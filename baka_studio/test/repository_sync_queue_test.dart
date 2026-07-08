import 'package:drift/native.dart';
import 'package:flutter/material.dart' show Color;
import 'package:flutter_test/flutter_test.dart';

import 'package:baka_studio/data/db/app_database.dart';
import 'package:baka_studio/data/models/campaign.dart';
import 'package:baka_studio/data/models/content_item.dart';
import 'package:baka_studio/data/models/signal.dart';
import 'package:baka_studio/data/models/sync_state.dart';
import 'package:baka_studio/data/repositories/campaign_repository.dart';
import 'package:baka_studio/data/repositories/channel_repository.dart';
import 'package:baka_studio/data/repositories/content_repository.dart';
import 'package:baka_studio/data/repositories/project_repository.dart';
import 'package:baka_studio/data/repositories/signal_repository.dart';
import 'package:baka_studio/data/repositories/sync_queue_repository.dart';
import 'package:baka_studio/data/repositories/task_repository.dart';
import 'package:baka_studio/data/repositories/workspace_repository.dart';

/// Confirma que os repositórios reais alimentam a fila de sync a cada
/// mutação — a peça que faltava depois da Fase 4 parte 1, onde a fila
/// existia e estava testada isoladamente, mas nada a populava ainda.
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

  test('creating a channel enqueues a single pending create', () async {
    final repo = ChannelRepository(db);
    final channel = await repo.create(workspaceId: workspaceId, name: 'Baka Code', color: const Color(0xFF3355FF));

    final pending = await syncQueue.listPending();
    expect(pending, hasLength(1));
    expect(pending.single.entityType, 'channel');
    expect(pending.single.entityId, channel.id);
    expect(pending.single.operation, SyncOperationType.create);
  });

  test('archiving a channel before it ever synced still collapses into one pending create', () async {
    final repo = ChannelRepository(db);
    final channel = await repo.create(workspaceId: workspaceId, name: 'Baka Code', color: const Color(0xFF3355FF));
    await repo.archive(channel.id);

    final pending = await syncQueue.listPending();
    expect(pending, hasLength(1));
    expect(pending.single.operation, SyncOperationType.create);
  });

  test('a manually curated channel relation is enqueued, but derived sharedProject relations never are', () async {
    final channelRepo = ChannelRepository(db);
    final projectRepo = ProjectRepository(db);
    final a = await channelRepo.create(workspaceId: workspaceId, name: 'A', color: const Color(0xFF000001));
    final b = await channelRepo.create(workspaceId: workspaceId, name: 'B', color: const Color(0xFF000002));
    await syncQueue.markDone((await syncQueue.listPending()).firstWhere((e) => e.entityId == a.id).id);
    await syncQueue.markDone((await syncQueue.listPending()).firstWhere((e) => e.entityId == b.id).id);

    await channelRepo.addManualRelation(workspaceId: workspaceId, channelIdA: a.id, channelIdB: b.id, label: 'Parceria');
    final afterManual = await syncQueue.listPending();
    expect(afterManual.where((e) => e.entityType == 'channel_relation'), hasLength(1));

    await projectRepo.create(workspaceId: workspaceId, name: 'Shared project', channelIds: [a.id, b.id]);
    await channelRepo.syncSharedProjectRelations(workspaceId);
    final afterDerived = await syncQueue.listPending();
    // Only the manual relation (already counted above) plus the project/
    // project_channel entries from creating the project — never a
    // "channel_relation" entry for the derived sharedProject row.
    expect(afterDerived.where((e) => e.entityType == 'channel_relation'), hasLength(1));
  });

  test('project creation enqueues the project and each project_channel pairing', () async {
    final channelRepo = ChannelRepository(db);
    final projectRepo = ProjectRepository(db);
    final a = await channelRepo.create(workspaceId: workspaceId, name: 'A', color: const Color(0xFF000001));
    final b = await channelRepo.create(workspaceId: workspaceId, name: 'B', color: const Color(0xFF000002));

    final project = await projectRepo.create(workspaceId: workspaceId, name: 'Launch', channelIds: [a.id, b.id]);

    final pending = await syncQueue.listPending();
    expect(pending.where((e) => e.entityType == 'project' && e.entityId == project.id), hasLength(1));
    expect(pending.where((e) => e.entityType == 'project_channel'), hasLength(2));
  });

  test('removing a project_channel pairing before syncing collapses into nothing for that pairing', () async {
    final channelRepo = ChannelRepository(db);
    final projectRepo = ProjectRepository(db);
    final a = await channelRepo.create(workspaceId: workspaceId, name: 'A', color: const Color(0xFF000001));

    final project = await projectRepo.create(workspaceId: workspaceId, name: 'Launch', channelIds: [a.id]);
    await projectRepo.update(project.id, channelIds: []);

    final pending = await syncQueue.listPending();
    expect(pending.where((e) => e.entityType == 'project_channel'), isEmpty);
  });

  test('content item creation enqueues the item and its content_channel pairings', () async {
    final channelRepo = ChannelRepository(db);
    final contentRepo = ContentRepository(db);
    final channel = await channelRepo.create(workspaceId: workspaceId, name: 'A', color: const Color(0xFF000001));

    final content = await contentRepo.create(
      workspaceId: workspaceId,
      title: 'Vídeo novo',
      channelIds: [channel.id],
      format: ContentFormat.video,
    );

    final pending = await syncQueue.listPending();
    expect(pending.where((e) => e.entityType == 'content_item' && e.entityId == content.id), hasLength(1));
    expect(pending.where((e) => e.entityType == 'content_channel'), hasLength(1));
  });

  test('creating then deleting a task before syncing leaves nothing pending', () async {
    final taskRepo = TaskRepository(db);
    final task = await taskRepo.create(workspaceId: workspaceId, title: 'Responder comentários');
    await taskRepo.delete(task.id);

    final pending = await syncQueue.listPending();
    expect(pending.where((e) => e.entityId == task.id), isEmpty);
  });

  test('processing a signal (inbox item) collapses into a single pending create', () async {
    final signalRepo = SignalRepository(db);
    final signal = await signalRepo.create(workspaceId: workspaceId, type: SignalType.ideia, title: 'Ideia');
    await signalRepo.markProcessed(signal.id, convertedEntityType: 'task', convertedEntityId: 'x');

    final pending = await syncQueue.listPending();
    final entries = pending.where((e) => e.entityId == signal.id).toList();
    expect(entries, hasLength(1));
    expect(entries.single.entityType, 'inbox_item');
    expect(entries.single.operation, SyncOperationType.create);
  });

  test('campaign item creation and removal enqueue campaign_item operations', () async {
    final campaignRepo = CampaignRepository(db);
    final channelRepo = ChannelRepository(db);
    final contentRepo = ContentRepository(db);
    final channel = await channelRepo.create(workspaceId: workspaceId, name: 'A', color: const Color(0xFF000001));
    final content = await contentRepo.create(workspaceId: workspaceId, title: 'Trailer', channelIds: [channel.id], format: ContentFormat.video);
    final campaign = await campaignRepo.create(workspaceId: workspaceId, name: 'Lançamento');

    await campaignRepo.addItem(campaign.id, CampaignItemEntityType.content, content.id);
    final afterAdd = await syncQueue.listPending();
    expect(afterAdd.where((e) => e.entityType == 'campaign_item'), hasLength(1));

    final itemId = afterAdd.firstWhere((e) => e.entityType == 'campaign_item').entityId;
    await syncQueue.markDone(afterAdd.firstWhere((e) => e.entityType == 'campaign_item').id);
    await campaignRepo.removeItem(itemId);
    final afterRemove = await syncQueue.listPending();
    expect(afterRemove.where((e) => e.entityType == 'campaign_item' && e.operation == SyncOperationType.delete), hasLength(1));
  });
}
