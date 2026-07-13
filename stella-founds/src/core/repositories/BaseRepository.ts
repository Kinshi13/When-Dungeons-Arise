import type { StorageAdapter } from '../storage/StorageAdapter';

export class BaseRepository<T extends { id: string }> {
  protected readonly storage: StorageAdapter;
  protected readonly collection: string;

  constructor(storage: StorageAdapter, collection: string) {
    this.storage = storage;
    this.collection = collection;
  }

  list(): Promise<T[]> {
    return this.storage.list<T>(this.collection);
  }

  get(id: string): Promise<T | undefined> {
    return this.storage.get<T>(this.collection, id);
  }

  save(item: T): Promise<void> {
    return this.storage.set<T>(this.collection, item);
  }

  remove(id: string): Promise<void> {
    return this.storage.remove(this.collection, id);
  }
}
