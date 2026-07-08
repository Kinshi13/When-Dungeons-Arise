import 'package:drift/native.dart';
import 'package:flutter/material.dart' show Color;
import 'package:flutter_test/flutter_test.dart';

import 'package:baka_studio/data/db/app_database.dart';
import 'package:baka_studio/data/models/channel_link.dart';
import 'package:baka_studio/data/models/sync_state.dart';
import 'package:baka_studio/data/repositories/channel_repository.dart';
import 'package:baka_studio/data/repositories/project_repository.dart';
import 'package:baka_studio/data/repositories/sync_queue_repository.dart';
import 'package:baka_studio/data/repositories/workspace_repository.dart';
import 'package:baka_studio/data/sync/entity_sync_specs.dart';

/// Confirma que a serialização local↔remoto de cada entidade sincronizável
/// é correta e que a política last-write-wins protege edições locais mais
/// recentes de serem sobrescritas por uma linha remota mais antiga.
void main() {
  late AppDatabase db;
  late SyncQueueRepository syncQueue;
  late String workspaceId;

  setUp(() async {
    db = AppDatabase.forTesting(NativeDatabase.memory());
    syncQueue = SyncQueueRepository(db);
    workspaceId = (await WorkspaceRepository(db).ensureDefault()).id;
  });

  tearDown(() => db.close());

  test('channel: push serializa os campos e pull aplica só quando o remoto é mais novo', () async {
    final channelRepo = ChannelRepository(db);
    final channel = await channelRepo.create(workspaceId: workspaceId, name: 'Baka Code', color: const Color(0xFF3355FF));
    final entry = (await syncQueue.listPending()).firstWhere((e) => e.entityId == channel.id);

    final json = await entitySyncSpecs['channel']!.toRemoteJson(db, entry);
    expect(json, isNotNull);
    expect(json!['id'], channel.id);
    expect(json['workspace_id'], workspaceId);
    expect(json['name'], 'Baka Code');
    expect(json['status'], 'planning');
    expect(json['deleted'], isFalse);

    // Uma linha remota mais antiga que a local não deve sobrescrever.
    final staleJson = Map<String, dynamic>.from(json)
      ..['name'] = 'Nome antigo'
      ..['updated_at'] = channel.updatedAt.subtract(const Duration(days: 1)).toIso8601String();
    await entitySyncSpecs['channel']!.applyRemoteJson(db, staleJson);
    final afterStale = await channelRepo.getById(channel.id);
    expect(afterStale!.name, 'Baka Code', reason: 'remoto mais antigo não pode sobrescrever edição local mais recente');

    // Uma linha remota mais nova deve ser aplicada.
    final freshJson = Map<String, dynamic>.from(json)
      ..['name'] = 'Baka Code Renovado'
      ..['updated_at'] = channel.updatedAt.add(const Duration(days: 1)).toIso8601String();
    await entitySyncSpecs['channel']!.applyRemoteJson(db, freshJson);
    final afterFresh = await channelRepo.getById(channel.id);
    expect(afterFresh!.name, 'Baka Code Renovado');
  });

  test('project_node: workspace_id vem da entrada da fila, não da linha local (que não tem essa coluna)', () async {
    final channelRepo = ChannelRepository(db);
    final projectRepo = ProjectRepository(db);
    final channel = await channelRepo.create(workspaceId: workspaceId, name: 'A', color: const Color(0xFF000001));
    final project = await projectRepo.create(workspaceId: workspaceId, name: 'Launch', channelIds: [channel.id]);
    final nodeId = await projectRepo.addNode(projectId: project.id, title: 'Roteiro');
    final entry = (await syncQueue.listPending()).firstWhere((e) => e.entityType == 'project_node' && e.entityId == nodeId);

    final json = await entitySyncSpecs['project_node']!.toRemoteJson(db, entry);
    expect(json, isNotNull);
    expect(json!['workspace_id'], workspaceId);
    expect(json['project_id'], project.id);
    expect(json['state'], 'planned');
  });

  test('channel_relation: só tipos strategic/custom são serializados com o rótulo correto', () async {
    final channelRepo = ChannelRepository(db);
    final a = await channelRepo.create(workspaceId: workspaceId, name: 'A', color: const Color(0xFF000001));
    final b = await channelRepo.create(workspaceId: workspaceId, name: 'B', color: const Color(0xFF000002));
    await channelRepo.addManualRelation(
      workspaceId: workspaceId,
      channelIdA: a.id,
      channelIdB: b.id,
      label: 'Parceria',
      type: ChannelRelationType.custom,
    );
    final entry = (await syncQueue.listPending()).firstWhere((e) => e.entityType == 'channel_relation');

    final json = await entitySyncSpecs['channel_relation']!.toRemoteJson(db, entry);
    expect(json, isNotNull);
    expect(json!['type'], 'custom');
    expect(json['label'], 'Parceria');
  });

  test('tombstone: uma linha arquivada/apagada localmente serializa deleted=true', () async {
    final channelRepo = ChannelRepository(db);
    final a = await channelRepo.create(workspaceId: workspaceId, name: 'A', color: const Color(0xFF000001));
    final b = await channelRepo.create(workspaceId: workspaceId, name: 'B', color: const Color(0xFF000002));
    await channelRepo.addManualRelation(workspaceId: workspaceId, channelIdA: a.id, channelIdB: b.id, label: 'x');
    final relation = (await channelRepo.watchRelations(workspaceId).first).single;
    await syncQueue.markDone((await syncQueue.listPending()).firstWhere((e) => e.entityType == 'channel_relation').id);

    await channelRepo.removeRelation(relation.id!);
    final entry = (await syncQueue.listPending()).firstWhere((e) => e.entityType == 'channel_relation');
    expect(entry.operation, SyncOperationType.delete);

    final json = await entitySyncSpecs['channel_relation']!.toRemoteJson(db, entry);
    expect(json!['deleted'], isTrue);
  });
}
