import 'package:drift/native.dart';
import 'package:flutter/material.dart' show Color;
import 'package:flutter_test/flutter_test.dart';

import 'package:baka_studio/data/auth/auth_repository.dart';
import 'package:baka_studio/data/db/app_database.dart';
import 'package:baka_studio/data/repositories/channel_repository.dart';
import 'package:baka_studio/data/repositories/local_settings_repository.dart';
import 'package:baka_studio/data/repositories/workspace_repository.dart';
import 'package:baka_studio/data/sync/sync_engine.dart';
import 'package:baka_studio/state/auth_state.dart';
import 'package:baka_studio/state/sync_coordinator.dart';

/// Cobre a parte do fluxo de adoção (seção 23-24) que não depende de uma
/// sessão Supabase real: resumo de dados locais, e as duas decisões
/// possíveis (vincular / manter local) a partir de um [PendingAdoption] já
/// levantado.
void main() {
  late AppDatabase db;
  late SyncCoordinator coordinator;
  late LocalSettingsRepository localSettings;

  setUp(() {
    db = AppDatabase.forTesting(NativeDatabase.memory());
    localSettings = LocalSettingsRepository(db);
    coordinator = SyncCoordinator(AuthState(AuthRepository()), db, localSettings, SyncEngine(db));
  });

  tearDown(() => db.close());

  test('summarizeLocalData counts every syncable entity, ignoring tombstoned rows', () async {
    final workspace = await WorkspaceRepository(db).ensureDefault();
    final channelRepo = ChannelRepository(db);
    final a = await channelRepo.create(workspaceId: workspace.id, name: 'A', color: const Color(0xFF000001));
    await channelRepo.create(workspaceId: workspace.id, name: 'B', color: const Color(0xFF000002));
    await channelRepo.archive(a.id); // arquivado, mas não é tombstone — ainda conta.

    final summary = await coordinator.summarizeLocalData();
    expect(summary.channels, 2);
    expect(summary.total, 2);
  });

  test('confirmAdoption migrates the local workspace and clears the pending decision', () async {
    await WorkspaceRepository(db).ensureDefault();
    final summary = await coordinator.summarizeLocalData();
    coordinator.pendingAdoption = PendingAdoption(remoteWorkspaceId: 'remote-abc', ownerId: 'user-1', summary: summary);

    await coordinator.confirmAdoption();

    expect(coordinator.pendingAdoption, isNull);
    expect(await localSettings.getRemoteWorkspaceId(), 'remote-abc');
    final workspace = await WorkspaceRepository(db).getActive();
    expect(workspace!.id, 'remote-abc');
  });

  test('dismissAdoption leaves local data and the remote link untouched', () async {
    final original = await WorkspaceRepository(db).ensureDefault();
    final summary = await coordinator.summarizeLocalData();
    coordinator.pendingAdoption = PendingAdoption(remoteWorkspaceId: 'remote-xyz', ownerId: 'user-2', summary: summary);

    coordinator.dismissAdoption();

    expect(coordinator.pendingAdoption, isNull);
    expect(await localSettings.getRemoteWorkspaceId(), isNull);
    final workspace = await WorkspaceRepository(db).getActive();
    expect(workspace!.id, original.id, reason: 'workspace local não deve ser migrado quando o usuário escolhe manter local');
  });
}
