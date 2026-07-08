import 'package:drift/native.dart';
import 'package:flutter/material.dart' show Color;
import 'package:flutter_test/flutter_test.dart';

import 'package:baka_studio/data/db/app_database.dart';
import 'package:baka_studio/data/models/campaign.dart';
import 'package:baka_studio/data/models/channel_link.dart';
import 'package:baka_studio/data/models/content_item.dart';
import 'package:baka_studio/data/models/project.dart';
import 'package:baka_studio/data/models/signal.dart';
import 'package:baka_studio/data/models/task.dart';
import 'package:baka_studio/data/repositories/campaign_repository.dart';
import 'package:baka_studio/data/repositories/channel_repository.dart';
import 'package:baka_studio/data/repositories/content_repository.dart';
import 'package:baka_studio/data/repositories/project_repository.dart';
import 'package:baka_studio/data/repositories/signal_repository.dart';
import 'package:baka_studio/data/repositories/task_repository.dart';
import 'package:baka_studio/data/repositories/workspace_repository.dart';

void main() {
  late AppDatabase db;
  late String workspaceId;

  setUp(() async {
    db = AppDatabase.forTesting(NativeDatabase.memory());
    workspaceId = (await WorkspaceRepository(db).ensureDefault()).id;
  });

  tearDown(() => db.close());

  group('ChannelRepository', () {
    test('creates, updates and archives a channel', () async {
      final repo = ChannelRepository(db);
      final channel = await repo.create(workspaceId: workspaceId, name: 'Baka Code', color: const Color(0xFF3355FF));
      expect(channel.name, 'Baka Code');
      expect(channel.isArchived, isFalse);

      await repo.update(channel.copyWith(name: 'Baka Code 2'));
      final afterUpdate = await repo.getById(channel.id);
      expect(afterUpdate!.name, 'Baka Code 2');

      await repo.archive(channel.id);
      final active = await repo.watchAll().first;
      expect(active.any((c) => c.id == channel.id), isFalse);
      final withArchived = await repo.watchAll(includeArchived: true).first;
      expect(withArchived.single.isArchived, isTrue);
    });

    test('derives sharedProject relations from real project↔channel links, without duplicating them', () async {
      final channelRepo = ChannelRepository(db);
      final projectRepo = ProjectRepository(db);
      final a = await channelRepo.create(workspaceId: workspaceId, name: 'A', color: const Color(0xFF000001));
      final b = await channelRepo.create(workspaceId: workspaceId, name: 'B', color: const Color(0xFF000002));

      await projectRepo.create(workspaceId: workspaceId, name: 'Shared project', channelIds: [a.id, b.id]);
      await channelRepo.syncSharedProjectRelations(workspaceId);

      final relations = await channelRepo.watchRelations(workspaceId).first;
      expect(relations.where((r) => r.type == ChannelRelationType.sharedProject), hasLength(1));

      // Running the sync again must not duplicate the derived relation.
      await channelRepo.syncSharedProjectRelations(workspaceId);
      final relationsAfterResync = await channelRepo.watchRelations(workspaceId).first;
      expect(relationsAfterResync.where((r) => r.type == ChannelRelationType.sharedProject), hasLength(1));
    });

    test('manual relations survive syncSharedProjectRelations untouched', () async {
      final channelRepo = ChannelRepository(db);
      final a = await channelRepo.create(workspaceId: workspaceId, name: 'A', color: const Color(0xFF000001));
      final b = await channelRepo.create(workspaceId: workspaceId, name: 'B', color: const Color(0xFF000002));

      await channelRepo.addManualRelation(workspaceId: workspaceId, channelIdA: a.id, channelIdB: b.id, label: 'Parceria estratégica');
      await channelRepo.syncSharedProjectRelations(workspaceId);

      final relations = await channelRepo.watchRelations(workspaceId).first;
      expect(relations, hasLength(1));
      expect(relations.single.type, ChannelRelationType.strategic);
    });
  });

  group('ProjectRepository', () {
    test('persists N:N channels and dependency-ordered nodes', () async {
      final channelRepo = ChannelRepository(db);
      final projectRepo = ProjectRepository(db);
      final a = await channelRepo.create(workspaceId: workspaceId, name: 'A', color: const Color(0xFF000001));
      final b = await channelRepo.create(workspaceId: workspaceId, name: 'B', color: const Color(0xFF000002));

      final project = await projectRepo.create(workspaceId: workspaceId, name: 'Launch', channelIds: [a.id, b.id]);
      expect(project.channelIds, containsAll([a.id, b.id]));

      final rootNodeId = await projectRepo.addNode(projectId: project.id, title: 'Roteiro', state: ProjectItemState.done);
      await projectRepo.addNode(projectId: project.id, title: 'Gravação', dependsOn: [rootNodeId]);

      final hydrated = await projectRepo.getById(project.id);
      expect(hydrated!.items, hasLength(2));
      final dependent = hydrated.items.firstWhere((i) => i.title == 'Gravação');
      expect(dependent.dependsOn, [rootNodeId]);
      expect(hydrated.progress, 0.5);
    });
  });

  group('ContentRepository', () {
    test('stamps publishedAt only the first time a production reaches publicado', () async {
      final channelRepo = ChannelRepository(db);
      final contentRepo = ContentRepository(db);
      final channel = await channelRepo.create(workspaceId: workspaceId, name: 'A', color: const Color(0xFF000001));

      final content = await contentRepo.create(
        workspaceId: workspaceId,
        title: 'Vídeo novo',
        channelIds: [channel.id],
        format: ContentFormat.video,
      );
      expect(content.publishedAt, isNull);

      await contentRepo.moveStage(content.id, ContentStage.publicado);
      final firstPublish = (await contentRepo.getById(content.id))!.publishedAt;
      expect(firstPublish, isNotNull);

      await contentRepo.moveStage(content.id, ContentStage.revisao);
      await contentRepo.moveStage(content.id, ContentStage.publicado);
      final secondPublish = (await contentRepo.getById(content.id))!.publishedAt;
      expect(secondPublish, firstPublish, reason: 'publishedAt should not be overwritten on a re-publish');
    });
  });

  group('TaskRepository', () {
    test('toggling a task flips between todo and done, stamping completedAt', () async {
      final taskRepo = TaskRepository(db);
      final task = await taskRepo.create(workspaceId: workspaceId, title: 'Responder comentários');
      expect(task.status, TaskStatus.todo);

      await taskRepo.toggleDone(task.id);
      var reloaded = (await taskRepo.watchAll().first).firstWhere((t) => t.id == task.id);
      expect(reloaded.done, isTrue);
      expect(reloaded.completedAt, isNotNull);

      await taskRepo.toggleDone(task.id);
      reloaded = (await taskRepo.watchAll().first).firstWhere((t) => t.id == task.id);
      expect(reloaded.done, isFalse);
    });

    test('watchAll excludes cancelled tasks', () async {
      final taskRepo = TaskRepository(db);
      final task = await taskRepo.create(workspaceId: workspaceId, title: 'Tarefa cancelada');
      await taskRepo.setStatus(task.id, TaskStatus.cancelled);
      final visible = await taskRepo.watchAll().first;
      expect(visible.any((t) => t.id == task.id), isFalse);
    });
  });

  group('SignalRepository', () {
    test('processing a signal stamps a traceable conversion record', () async {
      final signalRepo = SignalRepository(db);
      final signal = await signalRepo.create(workspaceId: workspaceId, type: SignalType.ideia, title: 'Ideia de vídeo');
      expect(signal.processed, isFalse);

      await signalRepo.markProcessed(signal.id, convertedEntityType: 'content', convertedEntityId: 'content-123');
      final processed = (await signalRepo.watchAll().first).firstWhere((s) => s.id == signal.id);
      expect(processed.processed, isTrue);
      expect(processed.convertedEntityType, 'content');
      expect(processed.convertedEntityId, 'content-123');
      expect(processed.processedAt, isNotNull);
    });
  });

  group('CampaignRepository', () {
    test('links real entities via CampaignItem instead of duplicating data', () async {
      final campaignRepo = CampaignRepository(db);
      final contentRepo = ContentRepository(db);
      final channelRepo = ChannelRepository(db);
      final channel = await channelRepo.create(workspaceId: workspaceId, name: 'A', color: const Color(0xFF000001));
      final content = await contentRepo.create(workspaceId: workspaceId, title: 'Trailer', channelIds: [channel.id], format: ContentFormat.video);

      final campaign = await campaignRepo.create(workspaceId: workspaceId, name: 'Lançamento');
      await campaignRepo.addItem(campaign.id, CampaignItemEntityType.content, content.id);

      final items = await campaignRepo.watchItems(campaign.id).first;
      expect(items, hasLength(1));
      expect(items.single.entityId, content.id);
      expect(items.single.entityType, CampaignItemEntityType.content);
    });
  });
}
