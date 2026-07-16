/**
 * Future cross-device sync surface. No implementation yet — this phase only
 * establishes the interface so app code can be written against it later
 * without another round of refactoring.
 */
export interface SyncRepository {
  pushChanges(): Promise<void>;
  pullChanges(): Promise<void>;
  getLastSyncedAt(): Promise<string | null>;
}
