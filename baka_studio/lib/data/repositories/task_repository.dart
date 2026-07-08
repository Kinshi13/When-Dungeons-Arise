import 'package:drift/drift.dart';

import '../db/app_database.dart';
import '../db/ids.dart';
import '../models/task.dart';

DailyTask taskFromRow(TaskEntry row) => DailyTask(
  id: row.id,
  workspaceId: row.workspaceId,
  title: row.title,
  description: row.description,
  status: row.status,
  priority: row.priority,
  dueDate: row.dueDate,
  completedAt: row.completedAt,
  channelId: row.channelId,
  projectId: row.projectId,
  contentItemId: row.contentItemId,
  campaignId: row.campaignId,
  createdAt: row.createdAt,
  updatedAt: row.updatedAt,
);

class TaskRepository {
  TaskRepository(this._db);

  final AppDatabase _db;

  Stream<List<DailyTask>> watchAll() {
    final query = _db.select(_db.tasks)
      ..where((t) => t.status.equalsValue(TaskStatus.cancelled).not() & t.deletedAt.isNull())
      ..orderBy([(t) => OrderingTerm.asc(t.dueDate)]);
    return query.watch().map((rows) => rows.map(taskFromRow).toList());
  }

  Stream<List<DailyTask>> watchForCampaign(String campaignId) {
    final query = _db.select(
      _db.tasks,
    )..where((t) => t.campaignId.equals(campaignId) & t.deletedAt.isNull());
    return query.watch().map((rows) => rows.map(taskFromRow).toList());
  }

  Future<DailyTask> create({
    required String workspaceId,
    required String title,
    String description = '',
    TaskPriority priority = TaskPriority.medium,
    DateTime? dueDate,
    String? channelId,
    String? projectId,
    String? contentItemId,
    String? campaignId,
  }) async {
    final now = DateTime.now();
    final id = newId();
    await _db.into(_db.tasks).insert(
      TasksCompanion.insert(
        id: id,
        workspaceId: workspaceId,
        title: title,
        description: Value(description),
        status: TaskStatus.todo,
        priority: priority,
        dueDate: Value(dueDate),
        channelId: Value(channelId),
        projectId: Value(projectId),
        contentItemId: Value(contentItemId),
        campaignId: Value(campaignId),
        createdAt: now,
        updatedAt: now,
      ),
    );
    return taskFromRow((await (_db.select(_db.tasks)..where((t) => t.id.equals(id))).getSingle()));
  }

  Future<void> update(String id, {String? title, String? description, DateTime? dueDate, TaskPriority? priority}) async {
    await (_db.update(_db.tasks)..where((t) => t.id.equals(id))).write(
      TasksCompanion(
        title: title == null ? const Value.absent() : Value(title),
        description: description == null ? const Value.absent() : Value(description),
        dueDate: dueDate == null ? const Value.absent() : Value(dueDate),
        priority: priority == null ? const Value.absent() : Value(priority),
        updatedAt: Value(DateTime.now()),
      ),
    );
  }

  Future<void> setStatus(String id, TaskStatus status) async {
    await (_db.update(_db.tasks)..where((t) => t.id.equals(id))).write(
      TasksCompanion(
        status: Value(status),
        completedAt: Value(status == TaskStatus.done ? DateTime.now() : null),
        updatedAt: Value(DateTime.now()),
      ),
    );
  }

  Future<void> toggleDone(String id) async {
    final row = await (_db.select(_db.tasks)..where((t) => t.id.equals(id))).getSingle();
    await setStatus(id, row.status == TaskStatus.done ? TaskStatus.todo : TaskStatus.done);
  }

  /// Tombstoned rather than physically deleted — tasks are a "minor" entity
  /// (hard delete is allowed by the UI), but still need to propagate the
  /// removal to other devices instead of a stale copy resurrecting it.
  Future<void> delete(String id) async {
    final now = DateTime.now();
    await (_db.update(_db.tasks)..where((t) => t.id.equals(id))).write(
      TasksCompanion(deletedAt: Value(now), updatedAt: Value(now)),
    );
  }
}
