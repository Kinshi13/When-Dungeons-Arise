import 'dart:async';

import 'package:flutter/foundation.dart';

import '../data/repositories/local_settings_repository.dart';
import '../data/supabase/supabase_bootstrap.dart';
import '../data/sync/remote_workspace_service.dart';
import 'auth_state.dart';

/// Reage a mudanças de sessão para manter o dispositivo linkado ao
/// workspace remoto do usuário autenticado.
///
/// O perfil e o workspace já existem no servidor assim que o cadastro é
/// concluído (trigger `baka_handle_new_user`, seção 55) — aqui só
/// descobrimos o id desse workspace e guardamos localmente
/// ([LocalSettingsRepository.setRemoteWorkspaceId]), para que a fase de
/// sincronização (push/pull) saiba com qual workspace remoto conversar.
///
/// Não decide nada sobre dados locais pré-existentes: essa decisão é do
/// fluxo de migração/adoção (fase seguinte), que consome
/// [LocalSettingsRepository.getRemoteWorkspaceId] para saber se este é o
/// primeiro login deste dispositivo.
class SyncCoordinator {
  SyncCoordinator(this._authState, this._localSettings) {
    _authState.addListener(_onAuthChanged);
    _onAuthChanged();
  }

  final AuthState _authState;
  final LocalSettingsRepository _localSettings;
  String? _lastBootstrappedUserId;

  void _onAuthChanged() {
    if (_authState.status != AuthStatus.authenticated) {
      _lastBootstrappedUserId = null;
      return;
    }
    final userId = _authState.user?.id;
    if (userId == null || userId == _lastBootstrappedUserId) return;
    _lastBootstrappedUserId = userId;
    unawaited(_bootstrapWorkspace());
  }

  Future<void> _bootstrapWorkspace() async {
    final client = supabaseClientOrNull;
    if (client == null) return;
    try {
      final info = await RemoteWorkspaceService(client).fetchForCurrentUser();
      if (info == null) return;
      await _localSettings.setRemoteWorkspaceId(info.id);
    } catch (error) {
      debugPrint('SyncCoordinator: falha ao buscar workspace remoto: $error');
    }
  }

  void dispose() {
    _authState.removeListener(_onAuthChanged);
  }
}
