/// Contract every repository will eventually push/pull through once a
/// backend (Supabase) exists. Deliberately empty in this phase — no remote
/// sync is implemented — but repositories are written as
/// `LocalDataSource` + optional `RemoteDataSource` from the start so wiring
/// a real implementation later doesn't require touching UI or repository
/// call sites, only providing a concrete [RemoteDataSource].
///
/// Fields that matter for a future sync (already present on every table):
/// `id` (stable, client-generated UUID — the sync key), `updatedAt`
/// (conflict resolution / last-write-wins), `archivedAt` (soft-delete, so
/// deletions can propagate instead of disappearing silently), and
/// `workspaceId` (the sync scope/partition).
abstract interface class RemoteDataSource<T> {
  Future<List<T>> pullAll(String workspaceId);
  Future<void> push(T entity);
  Future<void> pushArchive(String id, DateTime archivedAt);
}
