import 'package:supabase_flutter/supabase_flutter.dart';

/// Workspace remoto (Supabase) ao qual o usuário autenticado pertence.
class RemoteWorkspaceInfo {
  const RemoteWorkspaceInfo({required this.id, required this.name});

  final String id;
  final String name;
}

/// Busca o workspace remoto do usuário autenticado.
///
/// O perfil e o workspace já foram criados no servidor pelo trigger
/// `baka_handle_new_user` no momento do cadastro — este serviço só lê essa
/// informação de volta para o dispositivo, nunca cria nada remotamente.
class RemoteWorkspaceService {
  RemoteWorkspaceService(this._client);

  final SupabaseClient _client;

  Future<RemoteWorkspaceInfo?> fetchForCurrentUser() async {
    final userId = _client.auth.currentUser?.id;
    if (userId == null) return null;

    final rows = await _client
        .from('baka_workspace_members')
        .select('workspace_id, baka_workspaces(id, name)')
        .eq('user_id', userId)
        .limit(1);
    if (rows.isEmpty) return null;

    final workspace = rows.first['baka_workspaces'] as Map<String, dynamic>?;
    if (workspace == null) return null;
    return RemoteWorkspaceInfo(id: workspace['id'] as String, name: workspace['name'] as String);
  }
}
