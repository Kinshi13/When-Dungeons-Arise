import { openDB, type IDBPDatabase } from 'idb';
import type { ConflictRecord, OutboxEntry } from './SyncTypes';

const DB_NAME = 'stella-founds-sync';
const DB_VERSION = 1;
const OUTBOX_STORE = 'outbox';
const CONFLICTS_STORE = 'conflicts';
const META_STORE = 'meta';
const LAST_SYNCED_KEY = 'lastSyncedAt';

let dbPromise: Promise<IDBPDatabase> | null = null;

function getDb(): Promise<IDBPDatabase> {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(OUTBOX_STORE)) {
          db.createObjectStore(OUTBOX_STORE, { keyPath: 'entryId' });
        }
        if (!db.objectStoreNames.contains(CONFLICTS_STORE)) {
          db.createObjectStore(CONFLICTS_STORE, { keyPath: 'conflictId' });
        }
        if (!db.objectStoreNames.contains(META_STORE)) {
          db.createObjectStore(META_STORE);
        }
      },
    });
  }
  return dbPromise;
}

/** Persisted, isolated from the app's own IndexedDB database — a queue and
 * a conflict log are sync bookkeeping, not application data, and keeping
 * them in a separate database means a bug here can never corrupt the
 * user's actual financial records. */
export class SyncOutboxStore {
  async listPending(): Promise<OutboxEntry[]> {
    const db = await getDb();
    return db.getAll(OUTBOX_STORE);
  }

  async put(entry: OutboxEntry): Promise<void> {
    const db = await getDb();
    await db.put(OUTBOX_STORE, entry);
  }

  async remove(entryId: string): Promise<void> {
    const db = await getDb();
    await db.delete(OUTBOX_STORE, entryId);
  }

  async recordConflict(record: ConflictRecord): Promise<void> {
    const db = await getDb();
    await db.put(CONFLICTS_STORE, record);
  }

  async listConflicts(): Promise<ConflictRecord[]> {
    const db = await getDb();
    return db.getAll(CONFLICTS_STORE);
  }

  async getLastSyncedAt(): Promise<string | null> {
    const db = await getDb();
    return (await db.get(META_STORE, LAST_SYNCED_KEY)) ?? null;
  }

  async setLastSyncedAt(iso: string): Promise<void> {
    const db = await getDb();
    await db.put(META_STORE, iso, LAST_SYNCED_KEY);
  }
}
