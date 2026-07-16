export interface StorageAdapter {
  list<T>(collection: string): Promise<T[]>;
  get<T>(collection: string, id: string): Promise<T | undefined>;
  set<T extends { id: string }>(collection: string, item: T): Promise<void>;
  remove(collection: string, id: string): Promise<void>;
  clear(collection: string): Promise<void>;
}
