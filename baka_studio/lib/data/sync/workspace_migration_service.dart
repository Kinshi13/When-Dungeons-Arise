import 'package:drift/drift.dart';

import '../db/app_database.dart';

/// Re-vincula ("adota") todo o workspace local — e tudo que aponta para
/// ele — a um workspace remoto real, trocando apenas o `id`/`workspaceId`,
/// nunca apagando ou recriando nenhuma linha (seção 23-24 da Fase 4: dados
/// locais criados antes do login nunca podem ser perdidos).
///
/// Necessário porque o workspace local é criado com um id gerado neste
/// dispositivo ([WorkspaceRepository.ensureDefault]) antes de qualquer
/// conta existir; ao logar pela primeira vez, o servidor já tem seu
/// próprio workspace (criado pelo trigger `baka_handle_new_user`) com um
/// id diferente. Sem essa migração, tudo que já foi criado localmente
/// ficaria com um `workspace_id` que não corresponde a nenhum workspace
/// que o usuário realmente possui no servidor — e o push falharia (RLS).
class WorkspaceMigrationService {
  WorkspaceMigrationService(this._db);

  final AppDatabase _db;

  /// `true` se havia um workspace local com um id diferente do remoto
  /// (ou seja, migração foi necessária e foi realizada); `false` se não
  /// havia nada para migrar (workspace já linkado, ou nenhum workspace
  /// local ainda).
  Future<bool> adoptLocalWorkspace({required String remoteWorkspaceId, required String ownerId}) async {
    final local = await (_db.select(_db.workspaces)..limit(1)).getSingleOrNull();
    if (local == null || local.id == remoteWorkspaceId) return false;

    final oldId = local.id;
    final now = DateTime.now();

    await _db.transaction(() async {
      await (_db.update(_db.workspaces)..where((w) => w.id.equals(oldId))).write(
        WorkspacesCompanion(id: Value(remoteWorkspaceId), ownerId: Value(ownerId), updatedAt: Value(now)),
      );
      await (_db.update(_db.channels)..where((c) => c.workspaceId.equals(oldId))).write(
        ChannelsCompanion(workspaceId: Value(remoteWorkspaceId)),
      );
      await (_db.update(_db.projects)..where((p) => p.workspaceId.equals(oldId))).write(
        ProjectsCompanion(workspaceId: Value(remoteWorkspaceId)),
      );
      await (_db.update(_db.projectChannels)..where((c) => c.workspaceId.equals(oldId))).write(
        ProjectChannelsCompanion(workspaceId: Value(remoteWorkspaceId)),
      );
      await (_db.update(_db.projectNodeRelations)..where((r) => r.workspaceId.equals(oldId))).write(
        ProjectNodeRelationsCompanion(workspaceId: Value(remoteWorkspaceId)),
      );
      await (_db.update(_db.contentItems)..where((c) => c.workspaceId.equals(oldId))).write(
        ContentItemsCompanion(workspaceId: Value(remoteWorkspaceId)),
      );
      await (_db.update(_db.contentChannels)..where((c) => c.workspaceId.equals(oldId))).write(
        ContentChannelsCompanion(workspaceId: Value(remoteWorkspaceId)),
      );
      await (_db.update(_db.tasks)..where((t) => t.workspaceId.equals(oldId))).write(
        TasksCompanion(workspaceId: Value(remoteWorkspaceId)),
      );
      await (_db.update(_db.signals)..where((s) => s.workspaceId.equals(oldId))).write(
        SignalsCompanion(workspaceId: Value(remoteWorkspaceId)),
      );
      await (_db.update(_db.campaigns)..where((c) => c.workspaceId.equals(oldId))).write(
        CampaignsCompanion(workspaceId: Value(remoteWorkspaceId)),
      );
      await (_db.update(_db.campaignItems)..where((i) => i.workspaceId.equals(oldId))).write(
        CampaignItemsCompanion(workspaceId: Value(remoteWorkspaceId)),
      );
      await (_db.update(_db.channelRelations)..where((r) => r.workspaceId.equals(oldId))).write(
        ChannelRelationsCompanion(workspaceId: Value(remoteWorkspaceId)),
      );
      // A fila também precisa apontar para o workspace certo — senão o
      // push tentaria enviar usando o id antigo (que não existe remotamente).
      await (_db.update(_db.syncQueueEntries)..where((e) => e.workspaceId.equals(oldId))).write(
        SyncQueueEntriesCompanion(workspaceId: Value(remoteWorkspaceId)),
      );
    });

    return true;
  }
}
