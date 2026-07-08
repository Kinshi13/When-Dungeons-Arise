import 'dart:convert';

import 'package:drift/drift.dart';

import '../db/app_database.dart';
import '../db/ids.dart';

/// Um conflito detectado — os dois lados (este dispositivo e o servidor)
/// mudaram a mesma entidade desde a última sincronização conhecida.
/// Guardado só para diagnóstico (seção 28): a resolução em si continua
/// sendo last-write-wins por `updated_at`, aplicada normalmente pelo motor
/// de pull — isto não bloqueia nem pede decisão do usuário nesta fase.
class SyncConflict {
  const SyncConflict({
    required this.id,
    required this.entityType,
    required this.entityId,
    required this.localPayload,
    required this.remotePayload,
    required this.detectedAt,
    this.resolvedAt,
    this.resolution,
  });

  final String id;
  final String entityType;
  final String entityId;
  final Map<String, dynamic> localPayload;
  final Map<String, dynamic> remotePayload;
  final DateTime detectedAt;
  final DateTime? resolvedAt;
  final String? resolution;
}

class SyncConflictRepository {
  SyncConflictRepository(this._db);

  final AppDatabase _db;

  Future<void> record({
    required String entityType,
    required String entityId,
    required Map<String, dynamic> localPayload,
    required Map<String, dynamic> remotePayload,
    String? resolution,
  }) async {
    final now = DateTime.now();
    await _db.into(_db.syncConflicts).insert(
      SyncConflictsCompanion.insert(
        id: newId(),
        entityType: entityType,
        entityId: entityId,
        localPayload: jsonEncode(localPayload),
        remotePayload: jsonEncode(remotePayload),
        detectedAt: now,
        resolvedAt: Value(resolution == null ? null : now),
        resolution: Value(resolution),
      ),
    );
  }

  Future<List<SyncConflict>> listAll() async {
    final rows = await (_db.select(
      _db.syncConflicts,
    )..orderBy([(c) => OrderingTerm.desc(c.detectedAt)])).get();
    return rows
        .map(
          (row) => SyncConflict(
            id: row.id,
            entityType: row.entityType,
            entityId: row.entityId,
            localPayload: jsonDecode(row.localPayload) as Map<String, dynamic>,
            remotePayload: jsonDecode(row.remotePayload) as Map<String, dynamic>,
            detectedAt: row.detectedAt,
            resolvedAt: row.resolvedAt,
            resolution: row.resolution,
          ),
        )
        .toList();
  }
}
