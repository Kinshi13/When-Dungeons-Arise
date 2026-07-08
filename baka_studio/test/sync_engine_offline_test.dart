import 'package:drift/native.dart';
import 'package:flutter/material.dart' show Color;
import 'package:flutter_test/flutter_test.dart';

import 'package:baka_studio/data/db/app_database.dart';
import 'package:baka_studio/data/repositories/channel_repository.dart';
import 'package:baka_studio/data/repositories/sync_queue_repository.dart';
import 'package:baka_studio/data/repositories/workspace_repository.dart';
import 'package:baka_studio/data/sync/sync_engine.dart';

/// Confirma a garantia local-first no nível do próprio motor: sem Supabase
/// configurado (o caso normal em produção sem `--dart-define`, e sempre o
/// caso neste ambiente de teste), push/pull/runFullSync nunca lançam
/// exceção e nunca tocam a fila — o app segue funcionando 100% localmente
/// mesmo se alguém chamar "Sincronizar agora" sem sincronização disponível.
void main() {
  late AppDatabase db;
  late SyncEngine engine;
  late SyncQueueRepository syncQueue;
  late String workspaceId;

  setUp(() async {
    db = AppDatabase.forTesting(NativeDatabase.memory());
    engine = SyncEngine(db);
    syncQueue = SyncQueueRepository(db);
    workspaceId = (await WorkspaceRepository(db).ensureDefault()).id;
  });

  tearDown(() => db.close());

  test('push() is a safe no-op without a configured Supabase client', () async {
    final channelRepo = ChannelRepository(db);
    await channelRepo.create(workspaceId: workspaceId, name: 'Baka Code', color: const Color(0xFF3355FF));

    final pendingBefore = await syncQueue.listPending();
    expect(pendingBefore, isNotEmpty);

    await engine.push();

    final pendingAfter = await syncQueue.listPending();
    expect(pendingAfter.length, pendingBefore.length, reason: 'sem client, nada deveria ser drenado da fila');
  });

  test('pull() is a safe no-op without a configured Supabase client', () async {
    await expectLater(engine.pull(workspaceId), completes);
  });

  test('runFullSync() completes without throwing and updates isSyncing/lastSyncedAt correctly', () async {
    expect(engine.isSyncing, isFalse);
    await engine.runFullSync(workspaceId);
    expect(engine.isSyncing, isFalse);
    // Sem client, push/pull retornam cedo sem erro — runFullSync ainda
    // marca sucesso (nenhuma exceção ocorreu) e registra o horário.
    expect(engine.lastError, isNull);
    expect(engine.lastSyncedAt, isNotNull);
  });
}
