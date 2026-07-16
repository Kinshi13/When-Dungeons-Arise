/**
 * Future remote persistence surface (e.g. Supabase/Firebase), mirroring the
 * shape of the local StorageAdapter so SyncRepository can move data between
 * the two. No implementation yet.
 */
export interface CloudAdapter {
  fetchCollection<T>(collection: string): Promise<T[]>;
  upsert<T extends { id: string }>(collection: string, item: T): Promise<void>;
  remove(collection: string, id: string): Promise<void>;
}
