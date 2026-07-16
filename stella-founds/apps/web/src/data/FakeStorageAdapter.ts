import type { StorageAdapter } from '@stella-founds/core';

/**
 * In-memory StorageAdapter for the Web placeholder — fulfills the same
 * contract IndexedDbAdapter does, so every repository/service in
 * @stella-founds/core runs unmodified against fake, non-persisted data.
 * No backend, no fetch, nothing written to disk.
 */
export class FakeStorageAdapter implements StorageAdapter {
  private readonly collections = new Map<string, Map<string, unknown>>();

  private collection<T>(name: string): Map<string, T> {
    if (!this.collections.has(name)) this.collections.set(name, new Map());
    return this.collections.get(name) as Map<string, T>;
  }

  async list<T>(collection: string): Promise<T[]> {
    return Array.from(this.collection<T>(collection).values());
  }

  async get<T>(collection: string, id: string): Promise<T | undefined> {
    return this.collection<T>(collection).get(id);
  }

  async set<T extends { id: string }>(collection: string, item: T): Promise<void> {
    this.collection<T>(collection).set(item.id, item);
  }

  async remove(collection: string, id: string): Promise<void> {
    this.collection(collection).delete(id);
  }

  async clear(collection: string): Promise<void> {
    this.collection(collection).clear();
  }

  /** Test/demo-only helper to pre-populate a collection with fake seed rows. */
  seed<T extends { id: string }>(collection: string, items: T[]): void {
    const map = this.collection<T>(collection);
    for (const item of items) map.set(item.id, item);
  }
}
