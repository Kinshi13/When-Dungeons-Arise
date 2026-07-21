/** Any record repositories persist already carries this — required so the
 * engine can order operations and detect conflicts by recency. */
export interface Syncable {
  id: string;
  updatedAt: string;
}

export type SyncOperation = 'upsert' | 'remove';

/** One pending change, persisted so it survives a reload before it's sent. */
export interface OutboxEntry {
  /** Own id for the outbox row itself, not the entity's id. */
  entryId: string;
  collection: string;
  entityId: string;
  op: SyncOperation;
  payload: unknown;
  updatedAt: string;
  attempts: number;
  createdAt: string;
}

/** Never resolved silently — both sides are kept so a future UI can show
 * "this changed elsewhere" instead of a value just quietly disappearing. */
export interface ConflictRecord {
  conflictId: string;
  collection: string;
  entityId: string;
  local: unknown;
  remote: unknown;
  resolution: 'kept-local' | 'kept-remote';
  detectedAt: string;
}

export type SyncStatus = 'synced' | 'syncing' | 'offline' | 'error' | 'pending';

export interface SyncStatusSnapshot {
  status: SyncStatus;
  lastSyncedAt: string | null;
  pendingCount: number;
  lastError: string | null;
}
