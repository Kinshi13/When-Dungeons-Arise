import '../db/app_database.dart';
import '../db/ids.dart';

const _deviceIdKey = 'device_id';
const _remoteWorkspaceIdKey = 'remote_workspace_id';

/// Genérico key/value local — usado hoje para o `device_id` da instalação
/// e para o cursor de pull por workspace (`last_pulled_at:<workspaceId>`).
/// Não é sincronizado: existe só para a própria instância do app saber
/// "quem eu sou" e "até onde eu já puxei".
class LocalSettingsRepository {
  LocalSettingsRepository(this._db);

  final AppDatabase _db;

  Future<String?> get(String key) async {
    final row = await (_db.select(
      _db.localSettings,
    )..where((s) => s.key.equals(key))).getSingleOrNull();
    return row?.value;
  }

  Future<void> set(String key, String value) async {
    await _db
        .into(_db.localSettings)
        .insertOnConflictUpdate(LocalSettingsCompanion.insert(key: key, value: value));
  }

  /// UUID estável desta instalação — gerado uma única vez e reaproveitado
  /// em todo firing subsequente. Usado para diagnóstico/observabilidade de
  /// sync, nunca para identificar o usuário (isso é o `auth.uid()`).
  Future<String> getOrCreateDeviceId() async {
    final existing = await get(_deviceIdKey);
    if (existing != null) return existing;
    final generated = newId();
    await set(_deviceIdKey, generated);
    return generated;
  }

  String _pullCursorKey(String workspaceId) => 'last_pulled_at:$workspaceId';

  Future<DateTime?> getLastPulledAt(String workspaceId) async {
    final raw = await get(_pullCursorKey(workspaceId));
    if (raw == null) return null;
    return DateTime.parse(raw);
  }

  Future<void> setLastPulledAt(String workspaceId, DateTime value) {
    return set(_pullCursorKey(workspaceId), value.toIso8601String());
  }

  /// Id do workspace remoto (Supabase) já vinculado a este dispositivo, se
  /// algum usuário já autenticou aqui. `null` significa que o dispositivo
  /// ainda não tem nenhum vínculo remoto — inclusive o caso normal de nunca
  /// ter feito login, que continua 100% válido e local.
  Future<String?> getRemoteWorkspaceId() => get(_remoteWorkspaceIdKey);

  Future<void> setRemoteWorkspaceId(String workspaceId) => set(_remoteWorkspaceIdKey, workspaceId);
}
