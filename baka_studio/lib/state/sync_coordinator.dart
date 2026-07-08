import 'dart:async';

import 'package:flutter/foundation.dart';

import '../data/db/app_database.dart';
import '../data/repositories/local_settings_repository.dart';
import '../data/supabase/supabase_bootstrap.dart';
import '../data/sync/remote_workspace_service.dart';
import '../data/sync/sync_engine.dart';
import '../data/sync/workspace_migration_service.dart';
import 'auth_state.dart';

/// Contagem de dados locais existentes no dispositivo — usada só para
/// mostrar ao usuário o que está prestes a ser vinculado, nunca para
/// decidir nada sozinha.
class LocalDataSummary {
  const LocalDataSummary({
    required this.channels,
    required this.projects,
    required this.contentItems,
    required this.tasks,
    required this.signals,
    required this.campaigns,
  });

  final int channels;
  final int projects;
  final int contentItems;
  final int tasks;
  final int signals;
  final int campaigns;

  int get total => channels + projects + contentItems + tasks + signals + campaigns;
}

/// Um vínculo de workspace remoto aguardando decisão do usuário — só existe
/// quando há dados locais criados antes de qualquer login (seção 23-24 da
/// Fase 4). Enquanto isto não for `null`, nada é migrado nem sincronizado
/// automaticamente.
class PendingAdoption {
  const PendingAdoption({required this.remoteWorkspaceId, required this.ownerId, required this.summary});

  final String remoteWorkspaceId;
  final String ownerId;
  final LocalDataSummary summary;
}

/// Reage a mudanças de sessão para manter o dispositivo linkado ao
/// workspace remoto do usuário autenticado e disparar a sincronização
/// assim que esse vínculo existir.
///
/// O perfil e o workspace já existem no servidor assim que o cadastro é
/// concluído (trigger `baka_handle_new_user`, seção 55) — aqui descobrimos
/// o id desse workspace. Se este dispositivo já tinha dados locais antes de
/// qualquer login, a decisão de vincular fica com o usuário
/// ([confirmAdoption]/[dismissAdoption]) — dados locais nunca são migrados
/// ou apagados silenciosamente.
class SyncCoordinator extends ChangeNotifier {
  SyncCoordinator(this._authState, this._db, this._localSettings, this._syncEngine)
    : _migration = WorkspaceMigrationService(_db) {
    _authState.addListener(_onAuthChanged);
    _onAuthChanged();
  }

  final AuthState _authState;
  final AppDatabase _db;
  final LocalSettingsRepository _localSettings;
  final SyncEngine _syncEngine;
  final WorkspaceMigrationService _migration;
  String? _lastBootstrappedUserId;

  PendingAdoption? pendingAdoption;

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

      final wasEverLinked = await _localSettings.getRemoteWorkspaceId() != null;
      final userId = _authState.user!.id;

      if (!wasEverLinked) {
        final summary = await summarizeLocalData();
        if (summary.total > 0) {
          // Primeiro login deste dispositivo, e já existiam dados aqui —
          // não vincula nem sincroniza sozinho. Espera a decisão do
          // usuário via confirmAdoption()/dismissAdoption().
          pendingAdoption = PendingAdoption(remoteWorkspaceId: info.id, ownerId: userId, summary: summary);
          notifyListeners();
          return;
        }
      }

      await _migration.adoptLocalWorkspace(remoteWorkspaceId: info.id, ownerId: userId);
      await _localSettings.setRemoteWorkspaceId(info.id);
      await _syncEngine.runFullSync(info.id);
    } catch (error) {
      debugPrint('SyncCoordinator: falha ao buscar workspace remoto: $error');
    }
  }

  /// "Vincular à minha conta": migra tudo que já existia neste dispositivo
  /// para o workspace remoto e sincroniza em seguida.
  Future<void> confirmAdoption() async {
    final decision = pendingAdoption;
    if (decision == null) return;
    await _migration.adoptLocalWorkspace(remoteWorkspaceId: decision.remoteWorkspaceId, ownerId: decision.ownerId);
    await _localSettings.setRemoteWorkspaceId(decision.remoteWorkspaceId);
    await _syncEngine.runFullSync(decision.remoteWorkspaceId);
    pendingAdoption = null;
    notifyListeners();
  }

  /// "Manter apenas local por enquanto" / "Revisar depois": não vincula
  /// nada agora. Os dados locais continuam existindo e funcionando
  /// normalmente; a pergunta volta a aparecer no próximo login enquanto o
  /// usuário não decidir vincular.
  void dismissAdoption() {
    pendingAdoption = null;
    notifyListeners();
  }

  Future<LocalDataSummary> summarizeLocalData() async {
    final channels = await (_db.select(_db.channels)..where((c) => c.deletedAt.isNull())).get();
    final projects = await (_db.select(_db.projects)..where((p) => p.deletedAt.isNull())).get();
    final contentItems = await (_db.select(_db.contentItems)..where((c) => c.deletedAt.isNull())).get();
    final tasks = await (_db.select(_db.tasks)..where((t) => t.deletedAt.isNull())).get();
    final signals = await (_db.select(_db.signals)..where((s) => s.deletedAt.isNull())).get();
    final campaigns = await (_db.select(_db.campaigns)..where((c) => c.deletedAt.isNull())).get();
    return LocalDataSummary(
      channels: channels.length,
      projects: projects.length,
      contentItems: contentItems.length,
      tasks: tasks.length,
      signals: signals.length,
      campaigns: campaigns.length,
    );
  }

  @override
  void dispose() {
    _authState.removeListener(_onAuthChanged);
    super.dispose();
  }
}
