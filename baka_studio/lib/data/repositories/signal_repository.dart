import 'package:drift/drift.dart';

import '../db/app_database.dart';
import '../db/ids.dart';
import '../models/signal.dart';

Signal signalFromRow(SignalEntry row) => Signal(
  id: row.id,
  workspaceId: row.workspaceId,
  type: row.type,
  title: row.title,
  body: row.body,
  source: row.source,
  channelId: row.channelId,
  processed: row.processed,
  processedAt: row.processedAt,
  convertedEntityType: row.convertedEntityType,
  convertedEntityId: row.convertedEntityId,
  createdAt: row.createdAt,
  updatedAt: row.updatedAt,
);

/// The Inbox ("Sinais"). Processing a signal always stamps what it became
/// (`convertedEntityType`/`convertedEntityId`) instead of just flipping
/// `processed` — the conversion stays traceable.
class SignalRepository {
  SignalRepository(this._db);

  final AppDatabase _db;

  Stream<List<Signal>> watchAll() {
    final query = _db.select(_db.signals)..orderBy([(s) => OrderingTerm.desc(s.createdAt)]);
    return query.watch().map((rows) => rows.map(signalFromRow).toList());
  }

  Future<Signal> create({
    required String workspaceId,
    required SignalType type,
    required String title,
    String body = '',
    String? source,
    String? channelId,
  }) async {
    final now = DateTime.now();
    final id = newId();
    await _db.into(_db.signals).insert(
      SignalsCompanion.insert(
        id: id,
        workspaceId: workspaceId,
        type: type,
        title: title,
        body: Value(body),
        source: Value(source),
        channelId: Value(channelId),
        createdAt: now,
        updatedAt: now,
      ),
    );
    return signalFromRow(await (_db.select(_db.signals)..where((s) => s.id.equals(id))).getSingle());
  }

  Future<void> markProcessed(String id, {String? convertedEntityType, String? convertedEntityId}) async {
    await (_db.update(_db.signals)..where((s) => s.id.equals(id))).write(
      SignalsCompanion(
        processed: const Value(true),
        processedAt: Value(DateTime.now()),
        convertedEntityType: Value(convertedEntityType),
        convertedEntityId: Value(convertedEntityId),
        updatedAt: Value(DateTime.now()),
      ),
    );
  }

  Future<void> archive(String id) => markProcessed(id, convertedEntityType: 'archived');

  Future<void> delete(String id) async {
    await (_db.delete(_db.signals)..where((s) => s.id.equals(id))).go();
  }
}
