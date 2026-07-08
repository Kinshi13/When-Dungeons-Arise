import 'package:drift/native.dart';
import 'package:flutter/material.dart' show Color;
import 'package:flutter_test/flutter_test.dart';

import 'package:baka_studio/data/db/app_database.dart';
import 'package:baka_studio/data/repositories/channel_repository.dart';
import 'package:baka_studio/data/repositories/sync_conflict_repository.dart';
import 'package:baka_studio/data/repositories/workspace_repository.dart';
import 'package:baka_studio/data/sync/sync_engine.dart';

/// Confirma a detecção de conflito descrita na Fase 4 (seção 27): quando
/// uma linha remota chega para uma entidade que também tem uma edição
/// local ainda não enviada, isso é registrado em sync_conflicts para
/// diagnóstico — mas a resolução em si continua sendo last-write-wins,
/// nunca fica bloqueada esperando decisão do usuário nesta fase.
void main() {
  late AppDatabase db;
  late SyncEngine engine;
  late SyncConflictRepository conflicts;
  late String workspaceId;

  setUp(() async {
    db = AppDatabase.forTesting(NativeDatabase.memory());
    engine = SyncEngine(db);
    conflicts = SyncConflictRepository(db);
    workspaceId = (await WorkspaceRepository(db).ensureDefault()).id;
  });

  tearDown(() => db.close());

  test('a remote row for an entity with a pending local edit is recorded as a conflict', () async {
    final channelRepo = ChannelRepository(db);
    final channel = await channelRepo.create(workspaceId: workspaceId, name: 'Baka Code', color: const Color(0xFF3355FF));
    // A criação em si já deixou uma entrada pendente na fila — simula o
    // caso real: o dispositivo editou localmente e ainda não sincronizou.

    final remoteRow = {
      'id': channel.id,
      'workspace_id': workspaceId,
      'name': 'Baka Code (editado em outro dispositivo)',
      'handle': null,
      'niche': '',
      'objective': '',
      'description': '',
      'color': channel.color.toARGB32(),
      'audience': null,
      'desired_frequency': null,
      'status': 'active',
      'created_at': channel.createdAt.toIso8601String(),
      'updated_at': channel.updatedAt.add(const Duration(minutes: 5)).toIso8601String(),
      'archived_at': null,
      'deleted': false,
    };

    await engine.mergeRemoteRow('channel', remoteRow);

    final recorded = await conflicts.listAll();
    expect(recorded, hasLength(1));
    expect(recorded.single.entityType, 'channel');
    expect(recorded.single.entityId, channel.id);
    expect(recorded.single.localPayload['name'], 'Baka Code');
    expect(recorded.single.remotePayload['name'], 'Baka Code (editado em outro dispositivo)');

    // A resolução ainda é last-write-wins: o remoto era mais novo, então venceu.
    final afterMerge = await channelRepo.getById(channel.id);
    expect(afterMerge!.name, 'Baka Code (editado em outro dispositivo)');
  });

  test('a remote row for an entity synced remotely with no pending local edit is never recorded as a conflict', () async {
    final channelRepo = ChannelRepository(db);
    final channel = await channelRepo.create(workspaceId: workspaceId, name: 'Baka Phone', color: const Color(0xFF00AAFF));
    final pending = await (db.select(db.syncQueueEntries)..where((e) => e.entityId.equals(channel.id))).get();
    // Simula que a criação já foi enviada com sucesso (fila drenada).
    for (final entry in pending) {
      await (db.delete(db.syncQueueEntries)..where((e) => e.id.equals(entry.id))).go();
    }

    final remoteRow = {
      'id': channel.id,
      'workspace_id': workspaceId,
      'name': 'Baka Phone (renomeado remotamente)',
      'handle': null,
      'niche': '',
      'objective': '',
      'description': '',
      'color': channel.color.toARGB32(),
      'audience': null,
      'desired_frequency': null,
      'status': 'active',
      'created_at': channel.createdAt.toIso8601String(),
      'updated_at': channel.updatedAt.add(const Duration(minutes: 5)).toIso8601String(),
      'archived_at': null,
      'deleted': false,
    };

    await engine.mergeRemoteRow('channel', remoteRow);

    expect(await conflicts.listAll(), isEmpty);
    final afterMerge = await channelRepo.getById(channel.id);
    expect(afterMerge!.name, 'Baka Phone (renomeado remotamente)');
  });
}
