import type { StorageAdapter } from './StorageAdapter';
import type { SyncEngine } from '../sync/SyncEngine';

/**
 * Decorates any StorageAdapter so every write a repository already makes
 * also reaches the SyncEngine's outbox — without a single repository
 * knowing sync exists (Fase 7: "Nenhuma tela conhece SyncEngine", and by
 * extension no repository does either). The local write always happens
 * and resolves first; enqueueing to the engine is fired-and-forgotten so a
 * slow or missing network can never add latency to a save (sections 3, 8).
 */
export class SyncingStorageAdapter implements StorageAdapter {
  private readonly inner: StorageAdapter;
  private readonly engine: SyncEngine;

  constructor(inner: StorageAdapter, engine: SyncEngine) {
    this.inner = inner;
    this.engine = engine;
  }

  list<T>(collection: string): Promise<T[]> {
    return this.inner.list<T>(collection);
  }

  get<T>(collection: string, id: string): Promise<T | undefined> {
    return this.inner.get<T>(collection, id);
  }

  async set<T extends { id: string }>(collection: string, item: T): Promise<void> {
    await this.inner.set(collection, item);
    void this.engine.enqueue(collection, 'upsert', item.id, item);
  }

  async remove(collection: string, id: string): Promise<void> {
    await this.inner.remove(collection, id);
    void this.engine.enqueue(collection, 'remove', id);
  }

  clear(collection: string): Promise<void> {
    return this.inner.clear(collection);
  }
}
