import 'package:supabase_flutter/supabase_flutter.dart';

/// Acesso Supabase genérico para uma tabela sincronizável.
///
/// Toda entidade sincronizável segue o mesmo formato (`id`, `workspace_id`,
/// `created_at`, `updated_at`, `deleted`, opcionalmente `archived_at`) — um
/// cliente genérico por nome de tabela cobre todas elas. O mapeamento
/// específico de cada entidade (linha local do Drift ⟷ json remoto) fica no
/// motor de sincronização (push/pull), não aqui: este cliente só sabe
/// conversar com uma tabela por nome, nunca com um tipo de domínio.
class RemoteTableClient {
  RemoteTableClient(this._client, this.table);

  final SupabaseClient _client;
  final String table;

  /// Todas as linhas do workspace atualizadas desde [since] (exclusive) —
  /// inclui tombstones (`deleted = true`); quem chama decide o que fazer com
  /// elas.
  Future<List<Map<String, dynamic>>> pullSince({required String workspaceId, required DateTime since}) async {
    final rows = await _client
        .from(table)
        .select()
        .eq('workspace_id', workspaceId)
        .gt('updated_at', since.toIso8601String());
    return List<Map<String, dynamic>>.from(rows as List);
  }

  /// Upsert por `id` — idempotente e seguro para retry: reenviar a mesma
  /// linha depois de uma falha de rede nunca duplica nem quebra.
  Future<void> upsert(Map<String, dynamic> row) async {
    await _client.from(table).upsert(row);
  }
}

/// Nome da tabela Supabase para cada `entityType` usado na fila de sync
/// ([SyncQueueRepository]) — só as entidades que de fato sincronizam
/// aparecem aqui (relações derivadas de canal, por exemplo, nunca são
/// enfileiradas, então não têm entrada).
const Map<String, String> remoteTableByEntityType = {
  'channel': 'baka_channels',
  'project': 'baka_projects',
  'project_channel': 'baka_project_channels',
  'project_node': 'baka_project_nodes',
  'project_node_relation': 'baka_project_node_relations',
  'content_item': 'baka_content_items',
  'content_channel': 'baka_content_channels',
  'task': 'baka_tasks',
  'inbox_item': 'baka_inbox_items',
  'campaign': 'baka_campaigns',
  'campaign_item': 'baka_campaign_items',
  'channel_relation': 'baka_channel_relations',
};
