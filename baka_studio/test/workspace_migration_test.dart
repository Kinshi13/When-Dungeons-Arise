import 'package:drift/native.dart';
import 'package:flutter/material.dart' show Color;
import 'package:flutter_test/flutter_test.dart';

import 'package:baka_studio/data/db/app_database.dart';
import 'package:baka_studio/data/models/content_item.dart';
import 'package:baka_studio/data/repositories/channel_repository.dart';
import 'package:baka_studio/data/repositories/content_repository.dart';
import 'package:baka_studio/data/repositories/project_repository.dart';
import 'package:baka_studio/data/repositories/sync_queue_repository.dart';
import 'package:baka_studio/data/repositories/workspace_repository.dart';
import 'package:baka_studio/data/sync/workspace_migration_service.dart';

/// Confirma a "adoção" de um workspace criado localmente antes de qualquer
/// login (seção 23-24 da Fase 4): nenhuma linha é perdida, e tudo que
/// apontava para o id local antigo passa a apontar para o id remoto real,
/// incluindo a fila de sync (senão o push tentaria usar um workspace_id
/// que nunca existiu no servidor).
void main() {
  late AppDatabase db;

  setUp(() {
    db = AppDatabase.forTesting(NativeDatabase.memory());
  });

  tearDown(() => db.close());

  test('migrates the local workspace id and every dependent row to the remote id, losing nothing', () async {
    final workspace = await WorkspaceRepository(db).ensureDefault();
    final channelRepo = ChannelRepository(db);
    final projectRepo = ProjectRepository(db);
    final contentRepo = ContentRepository(db);
    final syncQueue = SyncQueueRepository(db);

    final channel = await channelRepo.create(workspaceId: workspace.id, name: 'Baka Code', color: const Color(0xFF3355FF));
    final project = await projectRepo.create(workspaceId: workspace.id, name: 'Launch', channelIds: [channel.id]);
    await contentRepo.create(
      workspaceId: workspace.id,
      title: 'Vídeo',
      channelIds: [channel.id],
      format: ContentFormat.video,
      projectId: project.id,
    );

    const remoteWorkspaceId = 'remote-ws-123';
    const ownerId = 'user-456';
    final migrated = await WorkspaceMigrationService(
      db,
    ).adoptLocalWorkspace(remoteWorkspaceId: remoteWorkspaceId, ownerId: ownerId);
    expect(migrated, isTrue);

    final newWorkspace = await WorkspaceRepository(db).getActive();
    expect(newWorkspace!.id, remoteWorkspaceId);

    final channels = await channelRepo.watchAll().first;
    expect(channels, hasLength(1));
    expect(channels.single.workspaceId, remoteWorkspaceId);

    final projects = await projectRepo.watchAll().first;
    expect(projects, hasLength(1));
    expect(projects.single.workspaceId, remoteWorkspaceId);
    expect(projects.single.channelIds, contains(channel.id));

    final content = await contentRepo.watchAll().first;
    expect(content, hasLength(1));
    expect(content.single.workspaceId, remoteWorkspaceId);

    // A fila continua com todas as entradas — só o workspace_id mudou —
    // para que o próximo push use o workspace remoto correto.
    final pending = await syncQueue.listPending();
    expect(pending, isNotEmpty);
    expect(pending.every((e) => e.workspaceId == remoteWorkspaceId), isTrue);
  });

  test('running the migration again for the same remote id is a safe no-op', () async {
    final workspace = await WorkspaceRepository(db).ensureDefault();
    final service = WorkspaceMigrationService(db);
    final first = await service.adoptLocalWorkspace(remoteWorkspaceId: 'remote-ws-abc', ownerId: 'user-1');
    expect(first, isTrue);

    final second = await service.adoptLocalWorkspace(remoteWorkspaceId: 'remote-ws-abc', ownerId: 'user-1');
    expect(second, isFalse);

    final finalWorkspace = await WorkspaceRepository(db).getActive();
    expect(finalWorkspace!.id, 'remote-ws-abc');
    expect(finalWorkspace.id, isNot(workspace.id));
  });
}
