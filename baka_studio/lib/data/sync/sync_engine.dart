import 'dart:math';

import 'package:collection/collection.dart';
import 'package:flutter/foundation.dart' hide mergeSort;
import 'package:supabase_flutter/supabase_flutter.dart' show PostgrestException;

import '../db/app_database.dart';
import '../repositories/local_settings_repository.dart';
import '../repositories/sync_conflict_repository.dart';
import '../repositories/sync_queue_repository.dart';
import '../supabase/supabase_bootstrap.dart';
import 'entity_sync_specs.dart';
import 'remote_table_client.dart';

/// Ordem de push que respeita dependências reais (FK not-null remotas) —
/// um canal precisa existir antes de uma relação project_channel que o
/// referencia, um projeto antes de project_channel/project_node, um
/// content_item antes de content_channel, uma campanha antes de
/// campaign_item. `task`/`inbox_item`/`channel_relation` vão por último por
/// poderem referenciar qualquer uma das anteriores.
const List<String> _pushOrder = [
  'channel',
  'project',
  'project_channel',
  'project_node',
  'project_node_relation',
  'content_item',
  'content_channel',
  'campaign',
  'campaign_item',
  'task',
  'inbox_item',
  'channel_relation',
];

/// Motor de sincronização local-first: drena a fila persistente
/// ([SyncQueueRepository]) para o Supabase (push) e traz de volta o que
/// mudou remotamente (pull) — nunca o contrário de bloquear a UI, que
/// sempre lê/escreve local primeiro.
class SyncEngine extends ChangeNotifier {
  SyncEngine(this._db)
    : _queue = SyncQueueRepository(_db),
      _localSettings = LocalSettingsRepository(_db),
      _conflicts = SyncConflictRepository(_db);

  final AppDatabase _db;
  final SyncQueueRepository _queue;
  final LocalSettingsRepository _localSettings;
  final SyncConflictRepository _conflicts;

  bool _running = false;

  /// Estado observável para a UI de status (seção 25-26): discreto,
  /// nunca bloqueia — só informa o que está acontecendo.
  bool isSyncing = false;
  String? lastError;
  DateTime? lastSyncedAt;

  /// Push seguido de pull — usado tanto pelo botão manual "Sincronizar
  /// agora" quanto por um futuro gatilho automático. Ignora chamadas
  /// concorrentes (`_running`) em vez de enfileirar rodadas sobrepostas.
  Future<void> runFullSync(String workspaceId) async {
    if (_running) return;
    _running = true;
    isSyncing = true;
    notifyListeners();
    try {
      await push();
      await pull(workspaceId);
      lastError = null;
      lastSyncedAt = DateTime.now();
    } catch (error) {
      lastError = error.toString();
    } finally {
      _running = false;
      isSyncing = false;
      notifyListeners();
    }
  }

  /// Envia todas as operações pendentes, na ordem de dependência acima.
  /// Falhas permanentes (recusa do Postgrest — RLS, payload inválido,
  /// constraint) marcam a entrada como `failed` e seguem para a próxima;
  /// falhas temporárias (rede, timeout) agendam retry com backoff
  /// exponencial, até um limite, depois disso também viram `failed` para
  /// diagnóstico manual em vez de tentar para sempre.
  Future<void> push() async {
    final client = supabaseClientOrNull;
    if (client == null) return;

    final pending = _sortByPushOrder(await _queue.listPending());
    for (final entry in pending) {
      final spec = entitySyncSpecs[entry.entityType];
      final table = remoteTableByEntityType[entry.entityType];
      if (spec == null || table == null) {
        await _queue.markFailed(entry.id, 'Tipo de entidade desconhecido: ${entry.entityType}');
        continue;
      }

      try {
        final json = await spec.toRemoteJson(_db, entry);
        if (json == null) {
          // A linha local já não existe mais (nunca deveria acontecer, já
          // que tombstoning nunca apaga fisicamente) — nada a enviar.
          await _queue.markDone(entry.id);
          continue;
        }
        await RemoteTableClient(client, table).upsert(json);
        await _queue.markDone(entry.id);
      } on PostgrestException catch (error) {
        await _queue.markFailed(entry.id, error.message);
      } catch (error) {
        if (entry.retryCount >= 6) {
          await _queue.markFailed(entry.id, 'Excedeu o limite de tentativas: $error');
        } else {
          await _queue.scheduleRetry(entry.id, backoff: _backoffFor(entry.retryCount), error: error.toString());
        }
      }
    }
  }

  /// Puxa tudo que mudou desde a última sincronização bem-sucedida deste
  /// workspace, para cada tabela sincronizável, e aplica localmente via
  /// [EntitySyncSpec.applyRemoteJson] (last-write-wins por `updated_at`).
  Future<void> pull(String workspaceId) async {
    final client = supabaseClientOrNull;
    if (client == null) return;

    final since = await _localSettings.getLastPulledAt(workspaceId) ?? DateTime.fromMillisecondsSinceEpoch(0);
    final pullStartedAt = DateTime.now();

    for (final tableEntry in remoteTableByEntityType.entries) {
      final entityType = tableEntry.key;
      if (!entitySyncSpecs.containsKey(entityType)) continue;
      final rows = await RemoteTableClient(client, tableEntry.value).pullSince(workspaceId: workspaceId, since: since);
      for (final row in rows) {
        await mergeRemoteRow(entityType, row);
      }
    }

    // Margem de sobreposição: a próxima pull revisita alguns segundos antes
    // do início desta, para nunca perder uma escrita concorrente feita
    // durante a janela da consulta — reaplicar uma linha já vista é seguro,
    // applyRemoteJson é idempotente por id/updated_at.
    await _localSettings.setLastPulledAt(workspaceId, pullStartedAt.subtract(const Duration(seconds: 5)));
  }

  /// Mescla uma única linha remota já pulled — separado de [pull] para ser
  /// testável sem precisar de um cliente Supabase real: quem chama já tem o
  /// json em mãos (seja de uma consulta de verdade, seja de um teste).
  ///
  /// Antes de aplicar (last-write-wins por `updated_at`), verifica se há
  /// uma edição local ainda não enviada para a mesma entidade — se houver,
  /// os dois lados mudaram desde o último sync conhecido, o que é
  /// registrado em [SyncConflictRepository] para diagnóstico (a resolução
  /// em si continua sendo last-write-wins, nunca fica pendente de decisão
  /// do usuário nesta fase).
  Future<void> mergeRemoteRow(String entityType, Map<String, dynamic> row) async {
    final spec = entitySyncSpecs[entityType];
    if (spec == null) return;
    final entityId = row['id'] as String;

    final pendingLocalEdit = await _queue.findPending(entityType, entityId);
    if (pendingLocalEdit != null) {
      final localJson = await spec.toRemoteJson(_db, pendingLocalEdit);
      if (localJson != null) {
        await _conflicts.record(entityType: entityType, entityId: entityId, localPayload: localJson, remotePayload: row);
      }
    }
    await spec.applyRemoteJson(_db, row);
  }

  List<SyncQueueEntry> _sortByPushOrder(List<SyncQueueEntry> entries) {
    final sorted = [...entries];
    mergeSort(sorted, compare: (a, b) => _pushOrder.indexOf(a.entityType).compareTo(_pushOrder.indexOf(b.entityType)));
    return sorted;
  }

  Duration _backoffFor(int retryCount) {
    final seconds = min(300, 5 * pow(2, retryCount).toInt());
    return Duration(seconds: seconds);
  }
}
