import type { CloudAdapter } from './CloudAdapter';

/**
 * Stand-in used until a real backend (Supabase, etc.) is wired up.
 * `isConfigured()` returning false is what keeps the app fully functional
 * offline right now — the SyncEngine sees "not configured" and holds
 * changes in the outbox indefinitely instead of treating every attempt as
 * a network error to retry.
 */
export class NoopCloudAdapter implements CloudAdapter {
  isConfigured(): boolean {
    return false;
  }

  async fetchCollection<T>(): Promise<T[]> {
    return [];
  }

  async upsert(): Promise<void> {
    // No backend yet — nothing to send.
  }

  async remove(): Promise<void> {
    // No backend yet — nothing to send.
  }
}
