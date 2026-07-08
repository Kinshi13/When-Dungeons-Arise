import 'package:drift/drift.dart';

import '../db/app_database.dart';
import '../db/ids.dart';
import '../models/sync_state.dart';

/// Um item da fila, já hidratado — o que o motor de sync realmente
/// processa.
class SyncQueueEntry {
  const SyncQueueEntry({
    required this.id,
    required this.workspaceId,
    required this.entityType,
    required this.entityId,
    required this.operation,
    required this.createdAt,
    required this.retryCount,
    this.nextRetryAt,
    this.lastError,
    required this.status,
  });

  final String id;
  final String workspaceId;
  final String entityType;
  final String entityId;
  final SyncOperationType operation;
  final DateTime createdAt;
  final int retryCount;
  final DateTime? nextRetryAt;
  final String? lastError;
  final SyncQueueStatus status;
}

SyncQueueEntry _fromRow(SyncQueueEntryRow row) => SyncQueueEntry(
  id: row.id,
  workspaceId: row.workspaceId,
  entityType: row.entityType,
  entityId: row.entityId,
  operation: row.operation,
  createdAt: row.createdAt,
  retryCount: row.retryCount,
  nextRetryAt: row.nextRetryAt,
  lastError: row.lastError,
  status: row.status,
);

/// Fila persistente de operações pendentes — sobrevive a reinicialização do
/// app porque é uma tabela real, não uma lista em memória (seção 17).
///
/// [enqueue] já aplica o coalescing lógico descrito na seção 19: como o
/// motor de push sempre lê o estado *atual* da entidade no banco local (não
/// um snapshot congelado no momento do enqueue), a fila só precisa saber
/// qual é a operação mais forte ainda pendente por entidade — nunca duas
/// linhas para a mesma entidade.
class SyncQueueRepository {
  SyncQueueRepository(this._db);

  final AppDatabase _db;

  Future<void> enqueue({
    required String workspaceId,
    required String entityType,
    required String entityId,
    required SyncOperationType operation,
  }) async {
    final existing = await (_db.select(_db.syncQueueEntries)..where(
          (e) => e.entityType.equals(entityType) & e.entityId.equals(entityId),
        ))
        .getSingleOrNull();

    if (existing == null) {
      await _db.into(_db.syncQueueEntries).insert(
        SyncQueueEntriesCompanion.insert(
          id: newId(),
          workspaceId: workspaceId,
          entityType: entityType,
          entityId: entityId,
          operation: operation,
          createdAt: DateTime.now(),
          status: SyncQueueStatus.pending,
        ),
      );
      return;
    }

    switch (operation) {
      case SyncOperationType.create:
      case SyncOperationType.update:
        // Um create pendente já vai ler o estado mais recente quando
        // processado — uma edição subsequente não precisa de linha própria.
        // Um update pendente também já cobre outro update.
        return;
      case SyncOperationType.delete:
        if (existing.operation == SyncOperationType.create) {
          // Criado e apagado antes de sincronizar: nenhuma operação chegou
          // a existir remotamente, então não sobra nada a fazer.
          await (_db.delete(
            _db.syncQueueEntries,
          )..where((e) => e.id.equals(existing.id))).go();
        } else {
          await (_db.update(_db.syncQueueEntries)..where((e) => e.id.equals(existing.id))).write(
            SyncQueueEntriesCompanion(
              operation: const Value(SyncOperationType.delete),
              status: const Value(SyncQueueStatus.pending),
              lastError: const Value(null),
            ),
          );
        }
    }
  }

  Future<List<SyncQueueEntry>> listPending({DateTime? readyBefore}) async {
    final query = _db.select(_db.syncQueueEntries)
      ..where((e) => e.status.equalsValue(SyncQueueStatus.pending))
      ..orderBy([(e) => OrderingTerm.asc(e.createdAt)]);
    final rows = await query.get();
    final now = readyBefore ?? DateTime.now();
    return rows.where((r) => r.nextRetryAt == null || !r.nextRetryAt!.isAfter(now)).map(_fromRow).toList();
  }

  /// Existe uma edição local ainda não sincronizada para esta entidade?
  /// Usado pelo motor de pull para saber se uma linha remota recém-chegada
  /// diverge de uma alteração local pendente — o sinal de conflito real
  /// (seção 27): os dois lados mudaram desde o último sync conhecido.
  Future<SyncQueueEntry?> findPending(String entityType, String entityId) async {
    final row = await (_db.select(_db.syncQueueEntries)..where(
          (e) =>
              e.entityType.equals(entityType) &
              e.entityId.equals(entityId) &
              e.status.equalsValue(SyncQueueStatus.pending),
        ))
        .getSingleOrNull();
    return row == null ? null : _fromRow(row);
  }

  Stream<int> watchPendingCount() {
    final query = _db.selectOnly(_db.syncQueueEntries)
      ..addColumns([_db.syncQueueEntries.id.count()])
      ..where(_db.syncQueueEntries.status.equalsValue(SyncQueueStatus.pending));
    return query.watchSingle().map((row) => row.read(_db.syncQueueEntries.id.count()) ?? 0);
  }

  Future<void> markDone(String id) async {
    await (_db.delete(_db.syncQueueEntries)..where((e) => e.id.equals(id))).go();
  }

  /// Falha temporária (timeout, 5xx, conexão) — agenda um novo retry com
  /// backoff exponencial, mantendo a operação pendente.
  Future<void> scheduleRetry(String id, {required Duration backoff, required String error}) async {
    final row = await (_db.select(
      _db.syncQueueEntries,
    )..where((e) => e.id.equals(id))).getSingle();
    await (_db.update(_db.syncQueueEntries)..where((e) => e.id.equals(id))).write(
      SyncQueueEntriesCompanion(
        retryCount: Value(row.retryCount + 1),
        nextRetryAt: Value(DateTime.now().add(backoff)),
        lastError: Value(error),
      ),
    );
  }

  /// Falha permanente (RLS negou, payload inválido, constraint) — marca
  /// como `failed` e para de tentar automaticamente; fica disponível para
  /// diagnóstico e "sincronizar agora" manual.
  Future<void> markFailed(String id, String error) async {
    await (_db.update(_db.syncQueueEntries)..where((e) => e.id.equals(id))).write(
      SyncQueueEntriesCompanion(status: const Value(SyncQueueStatus.failed), lastError: Value(error)),
    );
  }

  Future<List<SyncQueueEntry>> listFailed() async {
    final rows = await (_db.select(
      _db.syncQueueEntries,
    )..where((e) => e.status.equalsValue(SyncQueueStatus.failed))).get();
    return rows.map(_fromRow).toList();
  }

  /// Reenfileira todas as entradas `failed` como `pending` — usado pelo
  /// botão manual "Sincronizar agora".
  Future<void> retryAllFailed() async {
    await (_db.update(_db.syncQueueEntries)..where((e) => e.status.equalsValue(SyncQueueStatus.failed))).write(
      const SyncQueueEntriesCompanion(status: Value(SyncQueueStatus.pending), nextRetryAt: Value(null)),
    );
  }
}
