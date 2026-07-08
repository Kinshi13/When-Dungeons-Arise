import 'package:drift/native.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:baka_studio/data/db/app_database.dart';
import 'package:baka_studio/data/models/sync_state.dart';
import 'package:baka_studio/data/repositories/local_settings_repository.dart';
import 'package:baka_studio/data/repositories/sync_queue_repository.dart';

void main() {
  late AppDatabase db;

  setUp(() {
    db = AppDatabase.forTesting(NativeDatabase.memory());
  });

  tearDown(() => db.close());

  group('LocalSettingsRepository', () {
    test('device id is generated once and stays stable across calls', () async {
      final repo = LocalSettingsRepository(db);
      final first = await repo.getOrCreateDeviceId();
      final second = await repo.getOrCreateDeviceId();
      expect(first, second);
      expect(first, isNotEmpty);
    });

    test('pull cursor round-trips per workspace', () async {
      final repo = LocalSettingsRepository(db);
      expect(await repo.getLastPulledAt('w1'), isNull);
      final now = DateTime.now();
      await repo.setLastPulledAt('w1', now);
      final stored = await repo.getLastPulledAt('w1');
      expect(stored, isNotNull);
      expect(stored!.difference(now).inSeconds.abs(), lessThan(1));
      expect(await repo.getLastPulledAt('w2'), isNull, reason: 'cursor is scoped per workspace');
    });
  });

  group('SyncQueueRepository coalescing', () {
    test('update after a pending create collapses into just the create', () async {
      final repo = SyncQueueRepository(db);
      await repo.enqueue(workspaceId: 'w1', entityType: 'channel', entityId: 'c1', operation: SyncOperationType.create);
      await repo.enqueue(workspaceId: 'w1', entityType: 'channel', entityId: 'c1', operation: SyncOperationType.update);

      final pending = await repo.listPending();
      expect(pending, hasLength(1));
      expect(pending.single.operation, SyncOperationType.create);
    });

    test('repeated updates collapse into a single pending entry', () async {
      final repo = SyncQueueRepository(db);
      await repo.enqueue(workspaceId: 'w1', entityType: 'task', entityId: 't1', operation: SyncOperationType.update);
      await repo.enqueue(workspaceId: 'w1', entityType: 'task', entityId: 't1', operation: SyncOperationType.update);
      await repo.enqueue(workspaceId: 'w1', entityType: 'task', entityId: 't1', operation: SyncOperationType.update);

      final pending = await repo.listPending();
      expect(pending, hasLength(1));
    });

    test('create then delete before syncing results in no pending operation', () async {
      final repo = SyncQueueRepository(db);
      await repo.enqueue(workspaceId: 'w1', entityType: 'signal', entityId: 's1', operation: SyncOperationType.create);
      await repo.enqueue(workspaceId: 'w1', entityType: 'signal', entityId: 's1', operation: SyncOperationType.delete);

      expect(await repo.listPending(), isEmpty);
    });

    test('update then delete collapses into a single delete', () async {
      final repo = SyncQueueRepository(db);
      await repo.enqueue(workspaceId: 'w1', entityType: 'campaign_item', entityId: 'ci1', operation: SyncOperationType.update);
      await repo.enqueue(workspaceId: 'w1', entityType: 'campaign_item', entityId: 'ci1', operation: SyncOperationType.delete);

      final pending = await repo.listPending();
      expect(pending, hasLength(1));
      expect(pending.single.operation, SyncOperationType.delete);
    });

    test('markDone removes the entry; unrelated entities are unaffected', () async {
      final repo = SyncQueueRepository(db);
      await repo.enqueue(workspaceId: 'w1', entityType: 'channel', entityId: 'c1', operation: SyncOperationType.create);
      await repo.enqueue(workspaceId: 'w1', entityType: 'channel', entityId: 'c2', operation: SyncOperationType.create);

      final pending = await repo.listPending();
      final c1Entry = pending.firstWhere((e) => e.entityId == 'c1');
      await repo.markDone(c1Entry.id);

      final remaining = await repo.listPending();
      expect(remaining, hasLength(1));
      expect(remaining.single.entityId, 'c2');
    });

    test('scheduleRetry defers the entry until nextRetryAt, then it becomes eligible again', () async {
      final repo = SyncQueueRepository(db);
      await repo.enqueue(workspaceId: 'w1', entityType: 'channel', entityId: 'c1', operation: SyncOperationType.create);
      final entry = (await repo.listPending()).single;

      await repo.scheduleRetry(entry.id, backoff: const Duration(minutes: 5), error: 'timeout');
      expect(await repo.listPending(), isEmpty, reason: 'not ready to retry yet');

      final future = DateTime.now().add(const Duration(minutes: 10));
      final readyNow = await repo.listPending(readyBefore: future);
      expect(readyNow, hasLength(1));
      expect(readyNow.single.retryCount, 1);
      expect(readyNow.single.lastError, 'timeout');
    });

    test('markFailed excludes the entry from listPending until retryAllFailed', () async {
      final repo = SyncQueueRepository(db);
      await repo.enqueue(workspaceId: 'w1', entityType: 'channel', entityId: 'c1', operation: SyncOperationType.create);
      final entry = (await repo.listPending()).single;

      await repo.markFailed(entry.id, 'RLS denied');
      expect(await repo.listPending(), isEmpty);
      expect(await repo.listFailed(), hasLength(1));

      await repo.retryAllFailed();
      expect(await repo.listPending(), hasLength(1));
      expect(await repo.listFailed(), isEmpty);
    });
  });
}
