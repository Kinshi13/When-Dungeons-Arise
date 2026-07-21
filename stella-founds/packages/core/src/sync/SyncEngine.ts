import type { StorageAdapter } from '../storage/StorageAdapter';
import type { CloudAdapter } from './CloudAdapter';
import { SyncOutboxStore } from './SyncOutboxStore';
import { SyncLogger } from './SyncLogger';
import type { ConflictRecord, OutboxEntry, SyncOperation, SyncStatus, SyncStatusSnapshot, Syncable } from './SyncTypes';

/** Only FinanceEntry carries `updatedAt` today — other collections don't
 * yet, so conflict detection by recency only really applies there until
 * the rest of the models grow the field too. Everything else still syncs,
 * just without last-write-wins ordering. */
function readUpdatedAt(payload: unknown): string {
  if (payload && typeof payload === 'object' && 'updatedAt' in payload) {
    const value = (payload as { updatedAt?: unknown }).updatedAt;
    if (typeof value === 'string') return value;
  }
  return new Date().toISOString();
}

const FLUSH_DEBOUNCE_MS = 500;
const BASE_RETRY_DELAY_MS = 2000;
const MAX_RETRY_DELAY_MS = 60000;
const MAX_ATTEMPTS_BEFORE_ERROR_STATUS = 3;

function backoffDelay(attempts: number): number {
  return Math.min(MAX_RETRY_DELAY_MS, BASE_RETRY_DELAY_MS * 2 ** attempts);
}

/**
 * The only thing in the app that talks to CloudAdapter. Screens never see
 * this class directly — they read status through useSyncStatus(), and
 * writes reach it only via SyncingStorageAdapter, which enqueues on every
 * local write repositories already make. Everything here is generic across
 * `collection: string`, so a future module (Atlas, Memorize, ...) gets
 * sync for free just by using the same StorageAdapter/CloudAdapter pair —
 * no engine changes, per Fase 7 section 11.
 */
export class SyncEngine {
  private readonly localStorage: StorageAdapter;
  private readonly cloudAdapter: CloudAdapter;
  private readonly collections: readonly string[];
  private readonly outbox: SyncOutboxStore;
  private readonly target = new EventTarget();

  private status: SyncStatus = 'pending';
  private lastSyncedAt: string | null = null;
  private lastError: string | null = null;
  private pendingCount = 0;

  private flushTimer: ReturnType<typeof setTimeout> | null = null;
  private retryTimer: ReturnType<typeof setTimeout> | null = null;
  private flushing = false;
  private started = false;

  constructor(
    localStorage: StorageAdapter,
    cloudAdapter: CloudAdapter,
    collections: readonly string[],
    outbox: SyncOutboxStore = new SyncOutboxStore(),
  ) {
    this.localStorage = localStorage;
    this.cloudAdapter = cloudAdapter;
    this.collections = collections;
    this.outbox = outbox;
  }

  async start(): Promise<void> {
    if (this.started) return;
    this.started = true;
    this.lastSyncedAt = await this.outbox.getLastSyncedAt();
    window.addEventListener('online', this.handleOnline);
    window.addEventListener('offline', this.handleOffline);
    document.addEventListener('visibilitychange', this.handleVisibility);
    await this.refreshPendingCount();
    this.scheduleFlush();
  }

  stop(): void {
    this.started = false;
    window.removeEventListener('online', this.handleOnline);
    window.removeEventListener('offline', this.handleOffline);
    document.removeEventListener('visibilitychange', this.handleVisibility);
    if (this.flushTimer !== null) clearTimeout(this.flushTimer);
    if (this.retryTimer !== null) clearTimeout(this.retryTimer);
  }

  /** Called by SyncingStorageAdapter right after every local write —
   * never awaited by the caller, so a slow or absent network never blocks
   * the UI (Fase 7 sections 3 and 8). */
  async enqueue<T extends { id: string }>(collection: string, op: SyncOperation, entityId: string, payload?: T): Promise<void> {
    const entry: OutboxEntry = {
      entryId: `${collection}:${entityId}:${Date.now()}:${Math.random().toString(36).slice(2, 8)}`,
      collection,
      entityId,
      op,
      payload,
      updatedAt: readUpdatedAt(payload),
      attempts: 0,
      createdAt: new Date().toISOString(),
    };
    await this.dedupeAndStore(entry);
    SyncLogger.operation(`enqueued ${op} on ${collection}/${entityId}`);
    await this.refreshPendingCount();
    this.scheduleFlush();
  }

  getSnapshot(): SyncStatusSnapshot {
    return {
      status: this.status,
      lastSyncedAt: this.lastSyncedAt,
      pendingCount: this.pendingCount,
      lastError: this.lastError,
    };
  }

  subscribe(callback: (snapshot: SyncStatusSnapshot) => void): () => void {
    const handler = () => callback(this.getSnapshot());
    this.target.addEventListener('change', handler);
    return () => this.target.removeEventListener('change', handler);
  }

  async listConflicts(): Promise<ConflictRecord[]> {
    return this.outbox.listConflicts();
  }

  /** Best-effort pull — a no-op today since NoopCloudAdapter reports
   * unconfigured, but wired end-to-end so a real backend only needs to
   * implement CloudAdapter, nothing here. */
  async pullChanges(): Promise<void> {
    if (!this.cloudAdapter.isConfigured() || !navigator.onLine) return;
    for (const collection of this.collections) {
      const remoteItems = await this.cloudAdapter.fetchCollection<Syncable>(collection, this.lastSyncedAt ?? undefined);
      for (const remote of remoteItems) {
        await this.mergeRemoteItem(collection, remote);
      }
    }
    this.lastSyncedAt = new Date().toISOString();
    await this.outbox.setLastSyncedAt(this.lastSyncedAt);
    this.emitChange();
  }

  private async mergeRemoteItem(collection: string, remote: Syncable): Promise<void> {
    const local = await this.localStorage.get<Syncable>(collection, remote.id);
    const hasPendingLocalEdit = (await this.outbox.listPending()).some(
      (entry) => entry.collection === collection && entry.entityId === remote.id,
    );

    const remoteTime = Date.parse(remote.updatedAt);
    const localTime = local ? Date.parse(local.updatedAt) : NaN;
    const bothHaveTimestamps = !Number.isNaN(remoteTime) && !Number.isNaN(localTime);

    if (local && hasPendingLocalEdit && (!bothHaveTimestamps || remoteTime !== localTime)) {
      // Same entity changed on both sides — last-write-wins by timestamp
      // when both sides actually have one; otherwise the safer default is
      // to keep the local (already-pending) edit. Either way the losing
      // version is kept in the conflict log, never dropped silently
      // (Fase 7 section 5).
      const remoteWins = bothHaveTimestamps && remoteTime > localTime;
      const resolution = remoteWins ? 'kept-remote' : 'kept-local';
      await this.outbox.recordConflict({
        conflictId: `${collection}:${remote.id}:${Date.now()}`,
        collection,
        entityId: remote.id,
        local,
        remote,
        resolution,
        detectedAt: new Date().toISOString(),
      });
      SyncLogger.conflict(collection, remote.id, resolution);
      if (remoteWins) await this.localStorage.set(collection, remote);
      return;
    }

    await this.localStorage.set(collection, remote);
  }

  private async dedupeAndStore(entry: OutboxEntry): Promise<void> {
    const pending = await this.outbox.listPending();
    const superseded = pending.find((existing) => existing.collection === entry.collection && existing.entityId === entry.entityId);
    if (superseded) await this.outbox.remove(superseded.entryId);
    await this.outbox.put(entry);
  }

  private scheduleFlush(): void {
    if (this.flushTimer !== null) return;
    this.flushTimer = setTimeout(() => {
      this.flushTimer = null;
      void this.flush();
    }, FLUSH_DEBOUNCE_MS);
  }

  private async flush(): Promise<void> {
    if (this.flushing) return;
    this.flushing = true;
    try {
      const pending = await this.outbox.listPending();
      if (pending.length === 0) {
        this.setStatus('synced');
        return;
      }
      if (!this.cloudAdapter.isConfigured()) {
        this.setStatus('pending');
        return;
      }
      if (!navigator.onLine) {
        this.setStatus('offline');
        return;
      }

      this.setStatus('syncing');
      const started = performance.now();
      // In order: the oldest change goes first, one at a time, so a
      // dependent pair of ops (e.g. create then edit — already collapsed
      // by dedupeAndStore, but future collections might not collapse) never
      // races itself.
      const ordered = [...pending].sort((a, b) => a.createdAt.localeCompare(b.createdAt));
      for (const entry of ordered) {
        try {
          if (entry.op === 'remove') {
            await this.cloudAdapter.remove(entry.collection, entry.entityId);
          } else {
            await this.cloudAdapter.upsert(entry.collection, entry.payload as { id: string });
          }
          await this.outbox.remove(entry.entryId);
          await this.refreshPendingCount();
        } catch (error) {
          await this.handleFailedEntry(entry, error);
          return; // stop draining; the retry timer will resume from here
        }
      }
      this.lastSyncedAt = new Date().toISOString();
      await this.outbox.setLastSyncedAt(this.lastSyncedAt);
      SyncLogger.timing('flush', performance.now() - started);
      this.setStatus('synced');
    } finally {
      this.flushing = false;
    }
  }

  private async handleFailedEntry(entry: OutboxEntry, error: unknown): Promise<void> {
    const attempts = entry.attempts + 1;
    await this.outbox.put({ ...entry, attempts });
    this.lastError = error instanceof Error ? error.message : String(error);
    SyncLogger.error(`upload failed for ${entry.collection}/${entry.entityId} (attempt ${attempts})`, error);
    this.setStatus(attempts >= MAX_ATTEMPTS_BEFORE_ERROR_STATUS ? 'error' : 'syncing');
    if (this.retryTimer !== null) clearTimeout(this.retryTimer);
    this.retryTimer = setTimeout(() => void this.flush(), backoffDelay(attempts));
  }

  private async refreshPendingCount(): Promise<void> {
    this.pendingCount = (await this.outbox.listPending()).length;
    this.emitChange();
  }

  private setStatus(status: SyncStatus): void {
    this.status = status;
    this.emitChange();
  }

  private emitChange(): void {
    this.target.dispatchEvent(new Event('change'));
  }

  private readonly handleOnline = (): void => {
    this.scheduleFlush();
  };

  private readonly handleOffline = (): void => {
    this.setStatus('offline');
  };

  private readonly handleVisibility = (): void => {
    if (document.visibilityState === 'visible') this.scheduleFlush();
  };
}
