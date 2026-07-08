import '../db/app_database.dart';
import '../db/ids.dart';
import '../models/workspace.dart';

Workspace _toDomain(WorkspaceEntry row) => Workspace(
  id: row.id,
  name: row.name,
  description: row.description,
  createdAt: row.createdAt,
  updatedAt: row.updatedAt,
);

/// UI never touches [AppDatabase] directly — it goes through repositories
/// like this one. Local-only today; see [RemoteDataSource] for how a future
/// Supabase sync would plug in without changing this contract.
class WorkspaceRepository {
  WorkspaceRepository(this._db);

  final AppDatabase _db;

  Stream<Workspace?> watchActive() {
    final query = _db.select(_db.workspaces)..limit(1);
    return query.watchSingleOrNull().map((row) => row == null ? null : _toDomain(row));
  }

  Future<Workspace?> getActive() async {
    final row = await (_db.select(_db.workspaces)..limit(1)).getSingleOrNull();
    return row == null ? null : _toDomain(row);
  }

  Future<Workspace> ensureDefault({String name = 'Rede Baka'}) async {
    final existing = await getActive();
    if (existing != null) return existing;

    final now = DateTime.now();
    final entry = WorkspacesCompanion.insert(
      id: newId(),
      name: name,
      createdAt: now,
      updatedAt: now,
    );
    await _db.into(_db.workspaces).insert(entry);
    return (await getActive())!;
  }
}
