import 'package:drift/drift.dart';

import '../db/app_database.dart';
import '../db/ids.dart';
import '../models/project.dart';
import '../models/sync_state.dart';
import 'sync_queue_repository.dart';

/// Projects ("constelações"), their N:N relation to channels, and their
/// nodes (constellation map items — either free-standing milestones or a
/// thin pointer to a real [ContentItems] row).
class ProjectRepository {
  ProjectRepository(this._db);

  final AppDatabase _db;
  late final SyncQueueRepository _syncQueue = SyncQueueRepository(_db);

  Future<String?> _workspaceIdForProject(String projectId) async {
    final row = await (_db.select(_db.projects)..where((p) => p.id.equals(projectId))).getSingleOrNull();
    return row?.workspaceId;
  }

  Future<Project> _hydrate(ProjectEntry row) async {
    final channelLinks = await (_db.select(
      _db.projectChannels,
    )..where((c) => c.projectId.equals(row.id) & c.deletedAt.isNull())).get();
    final nodeRows = await (_db.select(
      _db.projectNodes,
    )..where((n) => n.projectId.equals(row.id) & n.deletedAt.isNull())).get();
    final relationRows = await (_db.select(
      _db.projectNodeRelations,
    )..where((r) => r.projectId.equals(row.id) & r.deletedAt.isNull())).get();

    final dependsOnByTarget = <String, List<String>>{};
    for (final rel in relationRows) {
      dependsOnByTarget.putIfAbsent(rel.targetNodeId, () => []).add(rel.sourceNodeId);
    }

    return Project(
      id: row.id,
      workspaceId: row.workspaceId,
      name: row.name,
      description: row.description,
      channelIds: channelLinks.map((c) => c.channelId).toList(),
      status: row.status,
      priority: row.priority,
      items: [
        for (final node in nodeRows)
          ProjectItem(
            id: node.id,
            title: node.title,
            state: node.state,
            dependsOn: dependsOnByTarget[node.id] ?? const [],
            linkedContentId: node.linkedEntityType == 'content' ? node.linkedEntityId : null,
          ),
      ],
      startDate: row.startDate,
      targetDate: row.targetDate,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      archivedAt: row.archivedAt,
    );
  }

  Stream<List<Project>> watchAll({bool includeArchived = false}) {
    final query = _db.select(_db.projects)
      ..where((p) => p.deletedAt.isNull())
      ..orderBy([(p) => OrderingTerm.asc(p.name)]);
    if (!includeArchived) {
      query.where((p) => p.archivedAt.isNull());
    }
    return query.watch().asyncMap((rows) => Future.wait(rows.map(_hydrate)));
  }

  Future<Project?> getById(String id) async {
    final row = await (_db.select(_db.projects)..where((p) => p.id.equals(id))).getSingleOrNull();
    return row == null ? null : _hydrate(row);
  }

  Future<Project> create({
    required String workspaceId,
    required String name,
    String description = '',
    ProjectStatus status = ProjectStatus.idea,
    ProjectPriority priority = ProjectPriority.medium,
    List<String> channelIds = const [],
    DateTime? startDate,
    DateTime? targetDate,
  }) async {
    final now = DateTime.now();
    final id = newId();
    final channelLinkIds = <String>[];
    await _db.transaction(() async {
      await _db.into(_db.projects).insert(
        ProjectsCompanion.insert(
          id: id,
          workspaceId: workspaceId,
          name: name,
          description: Value(description),
          status: status,
          priority: priority,
          startDate: Value(startDate),
          targetDate: Value(targetDate),
          createdAt: now,
          updatedAt: now,
        ),
      );
      for (final channelId in channelIds) {
        final linkId = newId();
        channelLinkIds.add(linkId);
        await _db.into(_db.projectChannels).insert(
          ProjectChannelsCompanion.insert(
            id: linkId,
            workspaceId: workspaceId,
            projectId: id,
            channelId: channelId,
            createdAt: Value(now),
            updatedAt: Value(now),
          ),
        );
      }
    });
    await _syncQueue.enqueue(workspaceId: workspaceId, entityType: 'project', entityId: id, operation: SyncOperationType.create);
    for (final linkId in channelLinkIds) {
      await _syncQueue.enqueue(
        workspaceId: workspaceId,
        entityType: 'project_channel',
        entityId: linkId,
        operation: SyncOperationType.create,
      );
    }
    return (await getById(id))!;
  }

  Future<void> update(
    String id, {
    String? name,
    String? description,
    ProjectStatus? status,
    ProjectPriority? priority,
    DateTime? startDate,
    DateTime? targetDate,
    List<String>? channelIds,
  }) async {
    final removedLinkIds = <String>[];
    final addedLinkIds = <String>[];
    String workspaceId = '';
    await _db.transaction(() async {
      await (_db.update(_db.projects)..where((p) => p.id.equals(id))).write(
        ProjectsCompanion(
          name: name == null ? const Value.absent() : Value(name),
          description: description == null ? const Value.absent() : Value(description),
          status: status == null ? const Value.absent() : Value(status),
          priority: priority == null ? const Value.absent() : Value(priority),
          startDate: startDate == null ? const Value.absent() : Value(startDate),
          targetDate: targetDate == null ? const Value.absent() : Value(targetDate),
          updatedAt: Value(DateTime.now()),
        ),
      );
      workspaceId = await _workspaceIdForProject(id) ?? '';
      if (channelIds != null) {
        final now = DateTime.now();
        final existing = await (_db.select(
          _db.projectChannels,
        )..where((c) => c.projectId.equals(id) & c.deletedAt.isNull())).get();
        final existingChannelIds = existing.map((e) => e.channelId).toSet();
        final wantedChannelIds = channelIds.toSet();

        // Tombstone removed pairs instead of a physical delete — see
        // ContentRepository.update for why (a device that hasn't pulled
        // this change yet must not resurrect the pairing).
        for (final row in existing) {
          if (!wantedChannelIds.contains(row.channelId)) {
            await (_db.update(_db.projectChannels)..where((c) => c.id.equals(row.id))).write(
              ProjectChannelsCompanion(deletedAt: Value(now), updatedAt: Value(now)),
            );
            removedLinkIds.add(row.id);
          }
        }
        for (final channelId in wantedChannelIds.difference(existingChannelIds)) {
          final linkId = newId();
          addedLinkIds.add(linkId);
          await _db.into(_db.projectChannels).insert(
            ProjectChannelsCompanion.insert(
              id: linkId,
              workspaceId: workspaceId,
              projectId: id,
              channelId: channelId,
              createdAt: Value(now),
              updatedAt: Value(now),
            ),
          );
        }
      }
    });
    if (workspaceId.isNotEmpty) {
      await _syncQueue.enqueue(workspaceId: workspaceId, entityType: 'project', entityId: id, operation: SyncOperationType.update);
      for (final linkId in addedLinkIds) {
        await _syncQueue.enqueue(
          workspaceId: workspaceId,
          entityType: 'project_channel',
          entityId: linkId,
          operation: SyncOperationType.create,
        );
      }
      for (final linkId in removedLinkIds) {
        await _syncQueue.enqueue(
          workspaceId: workspaceId,
          entityType: 'project_channel',
          entityId: linkId,
          operation: SyncOperationType.delete,
        );
      }
    }
  }

  Future<void> archive(String id) async {
    final now = DateTime.now();
    await (_db.update(_db.projects)..where((p) => p.id.equals(id))).write(
      ProjectsCompanion(archivedAt: Value(now), status: Value(ProjectStatus.archived), updatedAt: Value(now)),
    );
    final workspaceId = await _workspaceIdForProject(id);
    if (workspaceId != null) {
      await _syncQueue.enqueue(workspaceId: workspaceId, entityType: 'project', entityId: id, operation: SyncOperationType.update);
    }
  }

  Future<void> restore(String id) async {
    await (_db.update(_db.projects)..where((p) => p.id.equals(id))).write(
      ProjectsCompanion(archivedAt: const Value(null), updatedAt: Value(DateTime.now())),
    );
    final workspaceId = await _workspaceIdForProject(id);
    if (workspaceId != null) {
      await _syncQueue.enqueue(workspaceId: workspaceId, entityType: 'project', entityId: id, operation: SyncOperationType.update);
    }
  }

  // Nodes ------------------------------------------------------------

  Future<String> addNode({
    required String projectId,
    required String title,
    ProjectItemState state = ProjectItemState.planned,
    List<String> dependsOn = const [],
    String? linkedContentId,
  }) async {
    final now = DateTime.now();
    final nodeId = newId();
    final project = await getById(projectId);
    final workspaceId = project?.workspaceId ?? '';
    final relationIds = <String>[];
    await _db.transaction(() async {
      await _db.into(_db.projectNodes).insert(
        ProjectNodesCompanion.insert(
          id: nodeId,
          projectId: projectId,
          title: title,
          state: state,
          linkedEntityType: Value(linkedContentId == null ? null : 'content'),
          linkedEntityId: Value(linkedContentId),
          createdAt: now,
          updatedAt: now,
        ),
      );
      for (final depId in dependsOn) {
        final relationId = newId();
        relationIds.add(relationId);
        await _db.into(_db.projectNodeRelations).insert(
          ProjectNodeRelationsCompanion.insert(
            id: relationId,
            workspaceId: Value(workspaceId),
            projectId: projectId,
            sourceNodeId: depId,
            targetNodeId: nodeId,
            createdAt: Value(now),
            updatedAt: Value(now),
          ),
        );
      }
      await (_db.update(_db.projects)..where((p) => p.id.equals(projectId)))
          .write(ProjectsCompanion(updatedAt: Value(now)));
    });
    if (workspaceId.isNotEmpty) {
      await _syncQueue.enqueue(
        workspaceId: workspaceId,
        entityType: 'project_node',
        entityId: nodeId,
        operation: SyncOperationType.create,
      );
      for (final relationId in relationIds) {
        await _syncQueue.enqueue(
          workspaceId: workspaceId,
          entityType: 'project_node_relation',
          entityId: relationId,
          operation: SyncOperationType.create,
        );
      }
    }
    return nodeId;
  }

  Future<void> updateNodeState(String nodeId, ProjectItemState state) async {
    await (_db.update(_db.projectNodes)..where((n) => n.id.equals(nodeId))).write(
      ProjectNodesCompanion(state: Value(state), updatedAt: Value(DateTime.now())),
    );
    final node = await (_db.select(_db.projectNodes)..where((n) => n.id.equals(nodeId))).getSingleOrNull();
    if (node != null) {
      final workspaceId = await _workspaceIdForProject(node.projectId);
      if (workspaceId != null) {
        await _syncQueue.enqueue(
          workspaceId: workspaceId,
          entityType: 'project_node',
          entityId: nodeId,
          operation: SyncOperationType.update,
        );
      }
    }
  }

  /// Tombstones the node and its dependency edges instead of deleting them
  /// outright — a device that hasn't pulled this removal yet must see it
  /// disappear on next sync, not resurrect it by pushing its stale copy.
  Future<void> removeNode(String nodeId) async {
    final now = DateTime.now();
    final node = await (_db.select(_db.projectNodes)..where((n) => n.id.equals(nodeId))).getSingleOrNull();
    final affectedRelations = await (_db.select(
      _db.projectNodeRelations,
    )..where((r) => r.sourceNodeId.equals(nodeId) | r.targetNodeId.equals(nodeId))).get();
    await _db.transaction(() async {
      await (_db.update(_db.projectNodeRelations)
            ..where((r) => r.sourceNodeId.equals(nodeId) | r.targetNodeId.equals(nodeId)))
          .write(ProjectNodeRelationsCompanion(deletedAt: Value(now), updatedAt: Value(now)));
      await (_db.update(_db.projectNodes)..where((n) => n.id.equals(nodeId))).write(
        ProjectNodesCompanion(deletedAt: Value(now), updatedAt: Value(now)),
      );
    });
    if (node != null) {
      final workspaceId = await _workspaceIdForProject(node.projectId);
      if (workspaceId != null) {
        await _syncQueue.enqueue(
          workspaceId: workspaceId,
          entityType: 'project_node',
          entityId: nodeId,
          operation: SyncOperationType.delete,
        );
        for (final rel in affectedRelations) {
          await _syncQueue.enqueue(
            workspaceId: workspaceId,
            entityType: 'project_node_relation',
            entityId: rel.id,
            operation: SyncOperationType.delete,
          );
        }
      }
    }
  }
}
