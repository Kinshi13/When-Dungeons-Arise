import type { SyncEngine } from './SyncEngine';

/**
 * Thin, stable surface over SyncEngine — kept separate so the rest of the
 * app (and future modules, section 11) can depend on "a thing that can
 * push/pull changes" without importing the engine's internals directly.
 */
export interface SyncRepository {
  pushChanges(): Promise<void>;
  pullChanges(): Promise<void>;
  getLastSyncedAt(): Promise<string | null>;
}

export class EngineSyncRepository implements SyncRepository {
  private readonly engine: SyncEngine;

  constructor(engine: SyncEngine) {
    this.engine = engine;
  }

  async pushChanges(): Promise<void> {
    await this.engine.start();
  }

  async pullChanges(): Promise<void> {
    await this.engine.pullChanges();
  }

  async getLastSyncedAt(): Promise<string | null> {
    return this.engine.getSnapshot().lastSyncedAt;
  }
}
