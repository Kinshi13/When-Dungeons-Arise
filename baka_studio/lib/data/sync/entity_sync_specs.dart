import 'package:drift/drift.dart';

import '../db/app_database.dart';
import '../models/campaign.dart';
import '../models/channel.dart';
import '../models/channel_link.dart';
import '../models/content_item.dart';
import '../models/project.dart';
import '../models/signal.dart';
import '../models/task.dart';
import '../repositories/sync_queue_repository.dart';

/// Serializa/aplica uma entidade sincronizável entre a linha local (Drift)
/// e o json remoto (Supabase, snake_case).
///
/// [toRemoteJson] usa `entry.workspaceId` (guardado na própria fila, não na
/// linha local) como fonte da verdade do `workspace_id` remoto — necessário
/// porque algumas tabelas locais mais antigas ([ProjectNodes],
/// [ProjectNodeRelations], [CampaignItems]) não têm essa coluna, ou a têm
/// como nullable por retrofit.
///
/// [applyRemoteJson] aplica a política de "last-write-wins por updated_at":
/// só escreve localmente se a linha remota for estritamente mais nova que a
/// local (ou se não houver linha local ainda) — nunca sobrescreve uma
/// edição local mais recente. A detecção fina de conflito (edição local
/// pendente + linha remota mais nova ao mesmo tempo) fica no motor de
/// sync, que consulta [SyncQueueRepository] antes de chamar isto.
class EntitySyncSpec {
  const EntitySyncSpec({required this.toRemoteJson, required this.applyRemoteJson});

  final Future<Map<String, dynamic>?> Function(AppDatabase db, SyncQueueEntry entry) toRemoteJson;
  final Future<void> Function(AppDatabase db, Map<String, dynamic> json) applyRemoteJson;
}

DateTime? _parseNullable(dynamic value) => value == null ? null : DateTime.parse(value as String);

// ---------------------------------------------------------------------
// channel
// ---------------------------------------------------------------------

Future<Map<String, dynamic>?> _channelToJson(AppDatabase db, SyncQueueEntry entry) async {
  final row = await (db.select(db.channels)..where((c) => c.id.equals(entry.entityId))).getSingleOrNull();
  if (row == null) return null;
  return {
    'id': row.id,
    'workspace_id': entry.workspaceId,
    'name': row.name,
    'handle': row.handle,
    'niche': row.niche,
    'objective': row.objective,
    'description': row.description,
    'color': row.color,
    'audience': row.audience,
    'desired_frequency': row.desiredFrequency,
    'status': row.status.name,
    'created_at': row.createdAt.toIso8601String(),
    'updated_at': row.updatedAt.toIso8601String(),
    'archived_at': row.archivedAt?.toIso8601String(),
    'deleted': row.deletedAt != null,
  };
}

Future<void> _channelApply(AppDatabase db, Map<String, dynamic> json) async {
  final id = json['id'] as String;
  final remoteUpdatedAt = DateTime.parse(json['updated_at'] as String);
  final local = await (db.select(db.channels)..where((c) => c.id.equals(id))).getSingleOrNull();
  if (local != null && !remoteUpdatedAt.isAfter(local.updatedAt)) return;
  await db
      .into(db.channels)
      .insertOnConflictUpdate(
        ChannelsCompanion.insert(
          id: id,
          workspaceId: json['workspace_id'] as String,
          name: json['name'] as String,
          handle: Value(json['handle'] as String?),
          niche: Value(json['niche'] as String? ?? ''),
          objective: Value(json['objective'] as String? ?? ''),
          description: Value(json['description'] as String? ?? ''),
          color: json['color'] as int,
          audience: Value(json['audience'] as String?),
          desiredFrequency: Value(json['desired_frequency'] as String?),
          status: ChannelStatus.values.byName(json['status'] as String),
          createdAt: DateTime.parse(json['created_at'] as String),
          updatedAt: remoteUpdatedAt,
          archivedAt: Value(_parseNullable(json['archived_at'])),
          deletedAt: Value(json['deleted'] == true ? remoteUpdatedAt : null),
        ),
      );
}

// ---------------------------------------------------------------------
// project
// ---------------------------------------------------------------------

Future<Map<String, dynamic>?> _projectToJson(AppDatabase db, SyncQueueEntry entry) async {
  final row = await (db.select(db.projects)..where((p) => p.id.equals(entry.entityId))).getSingleOrNull();
  if (row == null) return null;
  return {
    'id': row.id,
    'workspace_id': entry.workspaceId,
    'name': row.name,
    'description': row.description,
    'status': row.status.name,
    'priority': row.priority.name,
    'start_date': row.startDate?.toIso8601String(),
    'target_date': row.targetDate?.toIso8601String(),
    'created_at': row.createdAt.toIso8601String(),
    'updated_at': row.updatedAt.toIso8601String(),
    'archived_at': row.archivedAt?.toIso8601String(),
    'deleted': row.deletedAt != null,
  };
}

Future<void> _projectApply(AppDatabase db, Map<String, dynamic> json) async {
  final id = json['id'] as String;
  final remoteUpdatedAt = DateTime.parse(json['updated_at'] as String);
  final local = await (db.select(db.projects)..where((p) => p.id.equals(id))).getSingleOrNull();
  if (local != null && !remoteUpdatedAt.isAfter(local.updatedAt)) return;
  await db
      .into(db.projects)
      .insertOnConflictUpdate(
        ProjectsCompanion.insert(
          id: id,
          workspaceId: json['workspace_id'] as String,
          name: json['name'] as String,
          description: Value(json['description'] as String? ?? ''),
          status: ProjectStatus.values.byName(json['status'] as String),
          priority: ProjectPriority.values.byName(json['priority'] as String),
          startDate: Value(_parseNullable(json['start_date'])),
          targetDate: Value(_parseNullable(json['target_date'])),
          createdAt: DateTime.parse(json['created_at'] as String),
          updatedAt: remoteUpdatedAt,
          archivedAt: Value(_parseNullable(json['archived_at'])),
          deletedAt: Value(json['deleted'] == true ? remoteUpdatedAt : null),
        ),
      );
}

// ---------------------------------------------------------------------
// project_channel (N:N)
// ---------------------------------------------------------------------

Future<Map<String, dynamic>?> _projectChannelToJson(AppDatabase db, SyncQueueEntry entry) async {
  final row = await (db.select(db.projectChannels)..where((c) => c.id.equals(entry.entityId))).getSingleOrNull();
  if (row == null) return null;
  return {
    'id': row.id,
    'workspace_id': entry.workspaceId,
    'project_id': row.projectId,
    'channel_id': row.channelId,
    'created_at': (row.createdAt ?? DateTime.now()).toIso8601String(),
    'updated_at': (row.updatedAt ?? DateTime.now()).toIso8601String(),
    'deleted': row.deletedAt != null,
  };
}

Future<void> _projectChannelApply(AppDatabase db, Map<String, dynamic> json) async {
  final id = json['id'] as String;
  final remoteUpdatedAt = DateTime.parse(json['updated_at'] as String);
  final local = await (db.select(db.projectChannels)..where((c) => c.id.equals(id))).getSingleOrNull();
  if (local != null && local.updatedAt != null && !remoteUpdatedAt.isAfter(local.updatedAt!)) return;
  await db
      .into(db.projectChannels)
      .insertOnConflictUpdate(
        ProjectChannelsCompanion.insert(
          id: id,
          workspaceId: json['workspace_id'] as String,
          projectId: json['project_id'] as String,
          channelId: json['channel_id'] as String,
          createdAt: Value(DateTime.parse(json['created_at'] as String)),
          updatedAt: Value(remoteUpdatedAt),
          deletedAt: Value(json['deleted'] == true ? remoteUpdatedAt : null),
        ),
      );
}

// ---------------------------------------------------------------------
// project_node
// ---------------------------------------------------------------------

Future<Map<String, dynamic>?> _projectNodeToJson(AppDatabase db, SyncQueueEntry entry) async {
  final row = await (db.select(db.projectNodes)..where((n) => n.id.equals(entry.entityId))).getSingleOrNull();
  if (row == null) return null;
  return {
    'id': row.id,
    'workspace_id': entry.workspaceId,
    'project_id': row.projectId,
    'title': row.title,
    'state': row.state.name,
    'linked_entity_type': row.linkedEntityType,
    'linked_entity_id': row.linkedEntityId,
    'created_at': row.createdAt.toIso8601String(),
    'updated_at': row.updatedAt.toIso8601String(),
    'deleted': row.deletedAt != null,
  };
}

Future<void> _projectNodeApply(AppDatabase db, Map<String, dynamic> json) async {
  final id = json['id'] as String;
  final remoteUpdatedAt = DateTime.parse(json['updated_at'] as String);
  final local = await (db.select(db.projectNodes)..where((n) => n.id.equals(id))).getSingleOrNull();
  if (local != null && !remoteUpdatedAt.isAfter(local.updatedAt)) return;
  await db
      .into(db.projectNodes)
      .insertOnConflictUpdate(
        ProjectNodesCompanion.insert(
          id: id,
          projectId: json['project_id'] as String,
          title: json['title'] as String,
          state: ProjectItemState.values.byName(json['state'] as String),
          linkedEntityType: Value(json['linked_entity_type'] as String?),
          linkedEntityId: Value(json['linked_entity_id'] as String?),
          createdAt: DateTime.parse(json['created_at'] as String),
          updatedAt: remoteUpdatedAt,
          deletedAt: Value(json['deleted'] == true ? remoteUpdatedAt : null),
        ),
      );
}

// ---------------------------------------------------------------------
// project_node_relation
// ---------------------------------------------------------------------

Future<Map<String, dynamic>?> _projectNodeRelationToJson(AppDatabase db, SyncQueueEntry entry) async {
  final row = await (db.select(db.projectNodeRelations)..where((r) => r.id.equals(entry.entityId))).getSingleOrNull();
  if (row == null) return null;
  return {
    'id': row.id,
    'workspace_id': entry.workspaceId,
    'project_id': row.projectId,
    'source_node_id': row.sourceNodeId,
    'target_node_id': row.targetNodeId,
    'type': row.type,
    'created_at': (row.createdAt ?? DateTime.now()).toIso8601String(),
    'updated_at': (row.updatedAt ?? DateTime.now()).toIso8601String(),
    'deleted': row.deletedAt != null,
  };
}

Future<void> _projectNodeRelationApply(AppDatabase db, Map<String, dynamic> json) async {
  final id = json['id'] as String;
  final remoteUpdatedAt = DateTime.parse(json['updated_at'] as String);
  final local = await (db.select(db.projectNodeRelations)..where((r) => r.id.equals(id))).getSingleOrNull();
  if (local != null && local.updatedAt != null && !remoteUpdatedAt.isAfter(local.updatedAt!)) return;
  await db
      .into(db.projectNodeRelations)
      .insertOnConflictUpdate(
        ProjectNodeRelationsCompanion.insert(
          id: id,
          workspaceId: Value(json['workspace_id'] as String),
          projectId: json['project_id'] as String,
          sourceNodeId: json['source_node_id'] as String,
          targetNodeId: json['target_node_id'] as String,
          type: Value(json['type'] as String? ?? 'dependency'),
          createdAt: Value(DateTime.parse(json['created_at'] as String)),
          updatedAt: Value(remoteUpdatedAt),
          deletedAt: Value(json['deleted'] == true ? remoteUpdatedAt : null),
        ),
      );
}

// ---------------------------------------------------------------------
// content_item
// ---------------------------------------------------------------------

Future<Map<String, dynamic>?> _contentItemToJson(AppDatabase db, SyncQueueEntry entry) async {
  final row = await (db.select(db.contentItems)..where((c) => c.id.equals(entry.entityId))).getSingleOrNull();
  if (row == null) return null;
  return {
    'id': row.id,
    'workspace_id': entry.workspaceId,
    'title': row.title,
    'description': row.description,
    'format': row.format.name,
    'stage': row.stage.name,
    'priority': row.priority.name,
    'project_id': row.projectId,
    'due_date': row.dueDate?.toIso8601String(),
    'published_at': row.publishedAt?.toIso8601String(),
    'platform': row.platform,
    'notes': row.notes,
    'created_at': row.createdAt.toIso8601String(),
    'updated_at': row.updatedAt.toIso8601String(),
    'archived_at': row.archivedAt?.toIso8601String(),
    'deleted': row.deletedAt != null,
  };
}

Future<void> _contentItemApply(AppDatabase db, Map<String, dynamic> json) async {
  final id = json['id'] as String;
  final remoteUpdatedAt = DateTime.parse(json['updated_at'] as String);
  final local = await (db.select(db.contentItems)..where((c) => c.id.equals(id))).getSingleOrNull();
  if (local != null && !remoteUpdatedAt.isAfter(local.updatedAt)) return;
  await db
      .into(db.contentItems)
      .insertOnConflictUpdate(
        ContentItemsCompanion.insert(
          id: id,
          workspaceId: json['workspace_id'] as String,
          title: json['title'] as String,
          description: Value(json['description'] as String? ?? ''),
          format: ContentFormat.values.byName(json['format'] as String),
          stage: ContentStage.values.byName(json['stage'] as String),
          priority: ContentPriority.values.byName(json['priority'] as String),
          projectId: Value(json['project_id'] as String?),
          dueDate: Value(_parseNullable(json['due_date'])),
          publishedAt: Value(_parseNullable(json['published_at'])),
          platform: Value(json['platform'] as String?),
          notes: Value(json['notes'] as String? ?? ''),
          createdAt: DateTime.parse(json['created_at'] as String),
          updatedAt: remoteUpdatedAt,
          archivedAt: Value(_parseNullable(json['archived_at'])),
          deletedAt: Value(json['deleted'] == true ? remoteUpdatedAt : null),
        ),
      );
}

// ---------------------------------------------------------------------
// content_channel (N:N)
// ---------------------------------------------------------------------

Future<Map<String, dynamic>?> _contentChannelToJson(AppDatabase db, SyncQueueEntry entry) async {
  final row = await (db.select(db.contentChannels)..where((c) => c.id.equals(entry.entityId))).getSingleOrNull();
  if (row == null) return null;
  return {
    'id': row.id,
    'workspace_id': entry.workspaceId,
    'content_item_id': row.contentItemId,
    'channel_id': row.channelId,
    'created_at': (row.createdAt ?? DateTime.now()).toIso8601String(),
    'updated_at': (row.updatedAt ?? DateTime.now()).toIso8601String(),
    'deleted': row.deletedAt != null,
  };
}

Future<void> _contentChannelApply(AppDatabase db, Map<String, dynamic> json) async {
  final id = json['id'] as String;
  final remoteUpdatedAt = DateTime.parse(json['updated_at'] as String);
  final local = await (db.select(db.contentChannels)..where((c) => c.id.equals(id))).getSingleOrNull();
  if (local != null && local.updatedAt != null && !remoteUpdatedAt.isAfter(local.updatedAt!)) return;
  await db
      .into(db.contentChannels)
      .insertOnConflictUpdate(
        ContentChannelsCompanion.insert(
          id: id,
          workspaceId: json['workspace_id'] as String,
          contentItemId: json['content_item_id'] as String,
          channelId: json['channel_id'] as String,
          createdAt: Value(DateTime.parse(json['created_at'] as String)),
          updatedAt: Value(remoteUpdatedAt),
          deletedAt: Value(json['deleted'] == true ? remoteUpdatedAt : null),
        ),
      );
}

// ---------------------------------------------------------------------
// task
// ---------------------------------------------------------------------

Future<Map<String, dynamic>?> _taskToJson(AppDatabase db, SyncQueueEntry entry) async {
  final row = await (db.select(db.tasks)..where((t) => t.id.equals(entry.entityId))).getSingleOrNull();
  if (row == null) return null;
  return {
    'id': row.id,
    'workspace_id': entry.workspaceId,
    'title': row.title,
    'description': row.description,
    'status': row.status.name,
    'priority': row.priority.name,
    'due_date': row.dueDate?.toIso8601String(),
    'completed_at': row.completedAt?.toIso8601String(),
    'channel_id': row.channelId,
    'project_id': row.projectId,
    'content_item_id': row.contentItemId,
    'campaign_id': row.campaignId,
    'created_at': row.createdAt.toIso8601String(),
    'updated_at': row.updatedAt.toIso8601String(),
    'deleted': row.deletedAt != null,
  };
}

Future<void> _taskApply(AppDatabase db, Map<String, dynamic> json) async {
  final id = json['id'] as String;
  final remoteUpdatedAt = DateTime.parse(json['updated_at'] as String);
  final local = await (db.select(db.tasks)..where((t) => t.id.equals(id))).getSingleOrNull();
  if (local != null && !remoteUpdatedAt.isAfter(local.updatedAt)) return;
  await db
      .into(db.tasks)
      .insertOnConflictUpdate(
        TasksCompanion.insert(
          id: id,
          workspaceId: json['workspace_id'] as String,
          title: json['title'] as String,
          description: Value(json['description'] as String? ?? ''),
          status: TaskStatus.values.byName(json['status'] as String),
          priority: TaskPriority.values.byName(json['priority'] as String),
          dueDate: Value(_parseNullable(json['due_date'])),
          completedAt: Value(_parseNullable(json['completed_at'])),
          channelId: Value(json['channel_id'] as String?),
          projectId: Value(json['project_id'] as String?),
          contentItemId: Value(json['content_item_id'] as String?),
          campaignId: Value(json['campaign_id'] as String?),
          createdAt: DateTime.parse(json['created_at'] as String),
          updatedAt: remoteUpdatedAt,
          deletedAt: Value(json['deleted'] == true ? remoteUpdatedAt : null),
        ),
      );
}

// ---------------------------------------------------------------------
// inbox_item (Signal)
// ---------------------------------------------------------------------

Future<Map<String, dynamic>?> _inboxItemToJson(AppDatabase db, SyncQueueEntry entry) async {
  final row = await (db.select(db.signals)..where((s) => s.id.equals(entry.entityId))).getSingleOrNull();
  if (row == null) return null;
  return {
    'id': row.id,
    'workspace_id': entry.workspaceId,
    'type': row.type.name,
    'title': row.title,
    'body': row.body,
    'source': row.source,
    'channel_id': row.channelId,
    'processed': row.processed,
    'processed_at': row.processedAt?.toIso8601String(),
    'converted_entity_type': row.convertedEntityType,
    'converted_entity_id': row.convertedEntityId,
    'created_at': row.createdAt.toIso8601String(),
    'updated_at': row.updatedAt.toIso8601String(),
    'deleted': row.deletedAt != null,
  };
}

Future<void> _inboxItemApply(AppDatabase db, Map<String, dynamic> json) async {
  final id = json['id'] as String;
  final remoteUpdatedAt = DateTime.parse(json['updated_at'] as String);
  final local = await (db.select(db.signals)..where((s) => s.id.equals(id))).getSingleOrNull();
  if (local != null && !remoteUpdatedAt.isAfter(local.updatedAt)) return;
  await db
      .into(db.signals)
      .insertOnConflictUpdate(
        SignalsCompanion.insert(
          id: id,
          workspaceId: json['workspace_id'] as String,
          type: SignalType.values.byName(json['type'] as String),
          title: json['title'] as String,
          body: Value(json['body'] as String? ?? ''),
          source: Value(json['source'] as String?),
          channelId: Value(json['channel_id'] as String?),
          processed: Value(json['processed'] as bool? ?? false),
          processedAt: Value(_parseNullable(json['processed_at'])),
          convertedEntityType: Value(json['converted_entity_type'] as String?),
          convertedEntityId: Value(json['converted_entity_id'] as String?),
          createdAt: DateTime.parse(json['created_at'] as String),
          updatedAt: remoteUpdatedAt,
          deletedAt: Value(json['deleted'] == true ? remoteUpdatedAt : null),
        ),
      );
}

// ---------------------------------------------------------------------
// campaign
// ---------------------------------------------------------------------

Future<Map<String, dynamic>?> _campaignToJson(AppDatabase db, SyncQueueEntry entry) async {
  final row = await (db.select(db.campaigns)..where((c) => c.id.equals(entry.entityId))).getSingleOrNull();
  if (row == null) return null;
  return {
    'id': row.id,
    'workspace_id': entry.workspaceId,
    'name': row.name,
    'description': row.description,
    'status': row.status.name,
    'start_date': row.startDate?.toIso8601String(),
    'end_date': row.endDate?.toIso8601String(),
    'primary_channel_id': row.primaryChannelId,
    'created_at': row.createdAt.toIso8601String(),
    'updated_at': row.updatedAt.toIso8601String(),
    'archived_at': row.archivedAt?.toIso8601String(),
    'deleted': row.deletedAt != null,
  };
}

Future<void> _campaignApply(AppDatabase db, Map<String, dynamic> json) async {
  final id = json['id'] as String;
  final remoteUpdatedAt = DateTime.parse(json['updated_at'] as String);
  final local = await (db.select(db.campaigns)..where((c) => c.id.equals(id))).getSingleOrNull();
  if (local != null && !remoteUpdatedAt.isAfter(local.updatedAt)) return;
  await db
      .into(db.campaigns)
      .insertOnConflictUpdate(
        CampaignsCompanion.insert(
          id: id,
          workspaceId: json['workspace_id'] as String,
          name: json['name'] as String,
          description: Value(json['description'] as String? ?? ''),
          status: CampaignStatus.values.byName(json['status'] as String),
          startDate: Value(_parseNullable(json['start_date'])),
          endDate: Value(_parseNullable(json['end_date'])),
          primaryChannelId: Value(json['primary_channel_id'] as String?),
          createdAt: DateTime.parse(json['created_at'] as String),
          updatedAt: remoteUpdatedAt,
          archivedAt: Value(_parseNullable(json['archived_at'])),
          deletedAt: Value(json['deleted'] == true ? remoteUpdatedAt : null),
        ),
      );
}

// ---------------------------------------------------------------------
// campaign_item
// ---------------------------------------------------------------------

Future<Map<String, dynamic>?> _campaignItemToJson(AppDatabase db, SyncQueueEntry entry) async {
  final row = await (db.select(db.campaignItems)..where((i) => i.id.equals(entry.entityId))).getSingleOrNull();
  if (row == null) return null;
  return {
    'id': row.id,
    'workspace_id': entry.workspaceId,
    'campaign_id': row.campaignId,
    'entity_type': row.entityType.name,
    'entity_id': row.entityId,
    'sort_order': row.sortOrder,
    'created_at': (row.createdAt ?? DateTime.now()).toIso8601String(),
    'updated_at': (row.updatedAt ?? DateTime.now()).toIso8601String(),
    'deleted': row.deletedAt != null,
  };
}

Future<void> _campaignItemApply(AppDatabase db, Map<String, dynamic> json) async {
  final id = json['id'] as String;
  final remoteUpdatedAt = DateTime.parse(json['updated_at'] as String);
  final local = await (db.select(db.campaignItems)..where((i) => i.id.equals(id))).getSingleOrNull();
  if (local != null && local.updatedAt != null && !remoteUpdatedAt.isAfter(local.updatedAt!)) return;
  await db
      .into(db.campaignItems)
      .insertOnConflictUpdate(
        CampaignItemsCompanion.insert(
          id: id,
          workspaceId: Value(json['workspace_id'] as String),
          campaignId: json['campaign_id'] as String,
          entityType: CampaignItemEntityType.values.byName(json['entity_type'] as String),
          entityId: json['entity_id'] as String,
          sortOrder: Value(json['sort_order'] as int? ?? 0),
          createdAt: Value(DateTime.parse(json['created_at'] as String)),
          updatedAt: Value(remoteUpdatedAt),
          deletedAt: Value(json['deleted'] == true ? remoteUpdatedAt : null),
        ),
      );
}

// ---------------------------------------------------------------------
// channel_relation (só strategic/custom são enfileiradas)
// ---------------------------------------------------------------------

Future<Map<String, dynamic>?> _channelRelationToJson(AppDatabase db, SyncQueueEntry entry) async {
  final row = await (db.select(db.channelRelations)..where((r) => r.id.equals(entry.entityId))).getSingleOrNull();
  if (row == null) return null;
  return {
    'id': row.id,
    'workspace_id': entry.workspaceId,
    'source_channel_id': row.sourceChannelId,
    'target_channel_id': row.targetChannelId,
    'type': row.type.name,
    'label': row.label,
    'created_at': row.createdAt.toIso8601String(),
    'updated_at': (row.updatedAt ?? row.createdAt).toIso8601String(),
    'deleted': row.deletedAt != null,
  };
}

Future<void> _channelRelationApply(AppDatabase db, Map<String, dynamic> json) async {
  final id = json['id'] as String;
  final remoteUpdatedAt = DateTime.parse(json['updated_at'] as String);
  final local = await (db.select(db.channelRelations)..where((r) => r.id.equals(id))).getSingleOrNull();
  if (local != null && local.updatedAt != null && !remoteUpdatedAt.isAfter(local.updatedAt!)) return;
  await db
      .into(db.channelRelations)
      .insertOnConflictUpdate(
        ChannelRelationsCompanion.insert(
          id: id,
          workspaceId: json['workspace_id'] as String,
          sourceChannelId: json['source_channel_id'] as String,
          targetChannelId: json['target_channel_id'] as String,
          type: ChannelRelationType.values.byName(json['type'] as String),
          label: Value(json['label'] as String?),
          createdAt: DateTime.parse(json['created_at'] as String),
          updatedAt: Value(remoteUpdatedAt),
          deletedAt: Value(json['deleted'] == true ? remoteUpdatedAt : null),
        ),
      );
}

// ---------------------------------------------------------------------

final Map<String, EntitySyncSpec> entitySyncSpecs = {
  'channel': EntitySyncSpec(toRemoteJson: _channelToJson, applyRemoteJson: _channelApply),
  'project': EntitySyncSpec(toRemoteJson: _projectToJson, applyRemoteJson: _projectApply),
  'project_channel': EntitySyncSpec(toRemoteJson: _projectChannelToJson, applyRemoteJson: _projectChannelApply),
  'project_node': EntitySyncSpec(toRemoteJson: _projectNodeToJson, applyRemoteJson: _projectNodeApply),
  'project_node_relation': EntitySyncSpec(
    toRemoteJson: _projectNodeRelationToJson,
    applyRemoteJson: _projectNodeRelationApply,
  ),
  'content_item': EntitySyncSpec(toRemoteJson: _contentItemToJson, applyRemoteJson: _contentItemApply),
  'content_channel': EntitySyncSpec(toRemoteJson: _contentChannelToJson, applyRemoteJson: _contentChannelApply),
  'task': EntitySyncSpec(toRemoteJson: _taskToJson, applyRemoteJson: _taskApply),
  'inbox_item': EntitySyncSpec(toRemoteJson: _inboxItemToJson, applyRemoteJson: _inboxItemApply),
  'campaign': EntitySyncSpec(toRemoteJson: _campaignToJson, applyRemoteJson: _campaignApply),
  'campaign_item': EntitySyncSpec(toRemoteJson: _campaignItemToJson, applyRemoteJson: _campaignItemApply),
  'channel_relation': EntitySyncSpec(toRemoteJson: _channelRelationToJson, applyRemoteJson: _channelRelationApply),
};
