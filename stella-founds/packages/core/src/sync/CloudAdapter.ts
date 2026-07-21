/**
 * Remote persistence surface — the only interface the SyncEngine talks to.
 * A real implementation (Supabase, Firebase, or anything else) plugs in
 * here without the engine, the repositories, or any screen changing at
 * all. `isConfigured` lets the engine tell "no backend wired up yet" apart
 * from "backend wired up but the network is down" — the first is
 * permanent (don't retry-loop forever), the second is transient.
 */
export interface CloudAdapter {
  isConfigured(): boolean;
  fetchCollection<T>(collection: string, updatedSince?: string): Promise<T[]>;
  upsert<T extends { id: string }>(collection: string, item: T): Promise<void>;
  remove(collection: string, id: string): Promise<void>;
}
