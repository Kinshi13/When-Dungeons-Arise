import { openDB, type IDBPDatabase } from 'idb';
import type { StorageAdapter } from './StorageAdapter';

const DB_NAME = 'stella-founds';
const DB_VERSION = 1;

export const COLLECTIONS = [
  'financeEntries',
  'financeCategories',
  'financeNuclei',
  'recurringRules',
  'calendarFinanceMarks',
] as const;

let dbPromise: Promise<IDBPDatabase> | null = null;

function getDb(): Promise<IDBPDatabase> {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        for (const name of COLLECTIONS) {
          if (!db.objectStoreNames.contains(name)) {
            db.createObjectStore(name, { keyPath: 'id' });
          }
        }
      },
    });
  }
  return dbPromise;
}

export class IndexedDbAdapter implements StorageAdapter {
  async list<T>(collection: string): Promise<T[]> {
    const db = await getDb();
    return db.getAll(collection);
  }

  async get<T>(collection: string, id: string): Promise<T | undefined> {
    const db = await getDb();
    return db.get(collection, id);
  }

  async set<T extends { id: string }>(collection: string, item: T): Promise<void> {
    const db = await getDb();
    await db.put(collection, item);
  }

  async remove(collection: string, id: string): Promise<void> {
    const db = await getDb();
    await db.delete(collection, id);
  }

  async clear(collection: string): Promise<void> {
    const db = await getDb();
    await db.clear(collection);
  }
}
