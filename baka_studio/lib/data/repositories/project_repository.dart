import 'package:drift/drift.dart';

import '../db/app_database.dart';
import '../db/ids.dart';
import '../models/project.dart';

/// Projects ("constelações"), their N:N relation to channels, and their
/// nodes (constellation map items — either free-standing milestones or a
/// thin pointer to a real [ContentItems] row).
class ProjectRepository {
  ProjectRepository(this._db);

  final AppDatabase _db;

  Future<Project> _hydrate(ProjectEntry row) async {
    final channelLinks = await (_db.select(_db.projectChannels)..where((c) => c.projectId.equals(row.id))).get();
    final nodeRows = await (_db.select(_db.projectNodes)..where((n) => n.projectId.equals(row.id))).get();
    final relationRows = await (_db.select(_db.projectNodeRelations)..where((r) => r.projectId.equals(row.id))).get();

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
    final query = _db.select(_db.projects)..orderBy([(p) => OrderingTerm.asc(p.name)]);
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
        await _db.into(_db.projectChannels).insert(
          ProjectChannelsCompanion.insert(projectId: id, channelId: channelId),
        );
      }
    });
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
      if (channelIds != null) {
        await (_db.delete(_db.projectChannels)..where((c) => c.projectId.equals(id))).go();
        for (final channelId in channelIds) {
          await _db.into(_db.projectChannels).insert(
            ProjectChannelsCompanion.insert(projectId: id, channelId: channelId),
          );
        }
      }
    });
  }

  Future<void> archive(String id) async {
    await (_db.update(_db.projects)..where((p) => p.id.equals(id))).write(
      ProjectsCompanion(archivedAt: Value(DateTime.now()), status: Value(ProjectStatus.archived), updatedAt: Value(DateTime.now())),
    );
  }

  Future<void> restore(String id) async {
    await (_db.update(_db.projects)..where((p) => p.id.equals(id))).write(
      const ProjectsCompanion(archivedAt: Value(null)),
    );
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
        await _db.into(_db.projectNodeRelations).insert(
          ProjectNodeRelationsCompanion.insert(
            id: newId(),
            projectId: projectId,
            sourceNodeId: depId,
            targetNodeId: nodeId,
          ),
        );
      }
      await (_db.update(_db.projects)..where((p) => p.id.equals(projectId)))
          .write(ProjectsCompanion(updatedAt: Value(now)));
    });
    return nodeId;
  }

  Future<void> updateNodeState(String nodeId, ProjectItemState state) async {
    await (_db.update(_db.projectNodes)..where((n) => n.id.equals(nodeId))).write(
      ProjectNodesCompanion(state: Value(state), updatedAt: Value(DateTime.now())),
    );
  }

  Future<void> removeNode(String nodeId) async {
    await _db.transaction(() async {
      await (_db.delete(_db.projectNodeRelations)
            ..where((r) => r.sourceNodeId.equals(nodeId) | r.targetNodeId.equals(nodeId)))
          .go();
      await (_db.delete(_db.projectNodes)..where((n) => n.id.equals(nodeId))).go();
    });
  }
}
