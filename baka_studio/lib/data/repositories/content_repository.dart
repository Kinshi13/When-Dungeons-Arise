import 'package:drift/drift.dart';

import '../db/app_database.dart';
import '../db/ids.dart';
import '../models/content_item.dart';
import '../models/sync_state.dart';
import 'sync_queue_repository.dart';

/// Productions ("produções"), including their N:N relation to channels
/// (a single piece of content can be a collaboration between two channels).
class ContentRepository {
  ContentRepository(this._db);

  final AppDatabase _db;
  late final SyncQueueRepository _syncQueue = SyncQueueRepository(_db);

  Future<ContentItem> _hydrate(ContentItemEntry row) async {
    final channelLinks = await (_db.select(
      _db.contentChannels,
    )..where((c) => c.contentItemId.equals(row.id) & c.deletedAt.isNull())).get();
    return ContentItem(
      id: row.id,
      workspaceId: row.workspaceId,
      title: row.title,
      description: row.description,
      channelIds: channelLinks.map((c) => c.channelId).toList(),
      format: row.format,
      stage: row.stage,
      priority: row.priority,
      projectId: row.projectId,
      dueDate: row.dueDate,
      publishedAt: row.publishedAt,
      platform: row.platform,
      notes: row.notes,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      archivedAt: row.archivedAt,
    );
  }

  Stream<List<ContentItem>> watchAll({bool includeArchived = false}) {
    final query = _db.select(_db.contentItems)
      ..where((c) => c.deletedAt.isNull())
      ..orderBy([(c) => OrderingTerm.desc(c.updatedAt)]);
    if (!includeArchived) {
      query.where((c) => c.archivedAt.isNull());
    }
    return query.watch().asyncMap((rows) => Future.wait(rows.map(_hydrate)));
  }

  Future<ContentItem?> getById(String id) async {
    final row = await (_db.select(_db.contentItems)..where((c) => c.id.equals(id))).getSingleOrNull();
    return row == null ? null : _hydrate(row);
  }

  Future<ContentItem> create({
    required String workspaceId,
    required String title,
    String description = '',
    required List<String> channelIds,
    required ContentFormat format,
    ContentStage stage = ContentStage.inbox,
    ContentPriority priority = ContentPriority.medium,
    String? projectId,
    DateTime? dueDate,
    String? platform,
    String notes = '',
  }) async {
    assert(channelIds.isNotEmpty, 'A production needs at least one channel');
    final now = DateTime.now();
    final id = newId();
    final channelLinkIds = <String>[];
    await _db.transaction(() async {
      await _db.into(_db.contentItems).insert(
        ContentItemsCompanion.insert(
          id: id,
          workspaceId: workspaceId,
          title: title,
          description: Value(description),
          format: format,
          stage: stage,
          priority: priority,
          projectId: Value(projectId),
          dueDate: Value(dueDate),
          platform: Value(platform),
          notes: Value(notes),
          createdAt: now,
          updatedAt: now,
        ),
      );
      for (final channelId in channelIds) {
        final linkId = newId();
        channelLinkIds.add(linkId);
        await _db.into(_db.contentChannels).insert(
          ContentChannelsCompanion.insert(
            id: linkId,
            workspaceId: workspaceId,
            contentItemId: id,
            channelId: channelId,
            createdAt: Value(now),
            updatedAt: Value(now),
          ),
        );
      }
    });
    await _syncQueue.enqueue(workspaceId: workspaceId, entityType: 'content_item', entityId: id, operation: SyncOperationType.create);
    for (final linkId in channelLinkIds) {
      await _syncQueue.enqueue(
        workspaceId: workspaceId,
        entityType: 'content_channel',
        entityId: linkId,
        operation: SyncOperationType.create,
      );
    }
    return (await getById(id))!;
  }

  Future<void> update(
    String id, {
    String? title,
    String? description,
    List<String>? channelIds,
    ContentFormat? format,
    ContentPriority? priority,
    String? projectId,
    bool clearProjectId = false,
    DateTime? dueDate,
    String? platform,
    String? notes,
  }) async {
    final removedLinkIds = <String>[];
    final addedLinkIds = <String>[];
    var workspaceId = '';
    await _db.transaction(() async {
      await (_db.update(_db.contentItems)..where((c) => c.id.equals(id))).write(
        ContentItemsCompanion(
          title: title == null ? const Value.absent() : Value(title),
          description: description == null ? const Value.absent() : Value(description),
          format: format == null ? const Value.absent() : Value(format),
          priority: priority == null ? const Value.absent() : Value(priority),
          projectId: clearProjectId ? const Value(null) : (projectId == null ? const Value.absent() : Value(projectId)),
          dueDate: dueDate == null ? const Value.absent() : Value(dueDate),
          platform: platform == null ? const Value.absent() : Value(platform),
          notes: notes == null ? const Value.absent() : Value(notes),
          updatedAt: Value(DateTime.now()),
        ),
      );
      final contentItem = await getById(id);
      workspaceId = contentItem?.workspaceId ?? '';
      if (channelIds != null) {
        final now = DateTime.now();
        final existing = await (_db.select(
          _db.contentChannels,
        )..where((c) => c.contentItemId.equals(id) & c.deletedAt.isNull())).get();
        final existingChannelIds = existing.map((e) => e.channelId).toSet();
        final wantedChannelIds = channelIds.toSet();

        // Tombstone pairs that were removed — a physical delete here would
        // let another device that hasn't pulled this change yet resurrect
        // the pairing by pushing its still-active local copy.
        for (final row in existing) {
          if (!wantedChannelIds.contains(row.channelId)) {
            await (_db.update(_db.contentChannels)..where((c) => c.id.equals(row.id))).write(
              ContentChannelsCompanion(deletedAt: Value(now), updatedAt: Value(now)),
            );
            removedLinkIds.add(row.id);
          }
        }
        // Insert only genuinely new pairs — untouched existing ones keep
        // their own updatedAt instead of bumping on every unrelated edit.
        for (final channelId in wantedChannelIds.difference(existingChannelIds)) {
          final linkId = newId();
          addedLinkIds.add(linkId);
          await _db.into(_db.contentChannels).insert(
            ContentChannelsCompanion.insert(
              id: linkId,
              workspaceId: workspaceId,
              contentItemId: id,
              channelId: channelId,
              createdAt: Value(now),
              updatedAt: Value(now),
            ),
          );
        }
      }
    });
    if (workspaceId.isNotEmpty) {
      await _syncQueue.enqueue(
        workspaceId: workspaceId,
        entityType: 'content_item',
        entityId: id,
        operation: SyncOperationType.update,
      );
      for (final linkId in addedLinkIds) {
        await _syncQueue.enqueue(
          workspaceId: workspaceId,
          entityType: 'content_channel',
          entityId: linkId,
          operation: SyncOperationType.create,
        );
      }
      for (final linkId in removedLinkIds) {
        await _syncQueue.enqueue(
          workspaceId: workspaceId,
          entityType: 'content_channel',
          entityId: linkId,
          operation: SyncOperationType.delete,
        );
      }
    }
  }

  /// Moves a production to a new pipeline stage — the Kanban drag-and-drop
  /// entry point. Stamps `publishedAt` the first time it reaches
  /// [ContentStage.publicado] so campaign/channel "published" metrics have
  /// a real date to work with.
  Future<void> moveStage(String id, ContentStage stage) async {
    final current = await getById(id);
    await (_db.update(_db.contentItems)..where((c) => c.id.equals(id))).write(
      ContentItemsCompanion(
        stage: Value(stage),
        publishedAt: stage == ContentStage.publicado && current?.publishedAt == null
            ? Value(DateTime.now())
            : const Value.absent(),
        updatedAt: Value(DateTime.now()),
      ),
    );
    if (current != null) {
      await _syncQueue.enqueue(
        workspaceId: current.workspaceId,
        entityType: 'content_item',
        entityId: id,
        operation: SyncOperationType.update,
      );
    }
  }

  Future<void> archive(String id) async {
    final now = DateTime.now();
    await (_db.update(_db.contentItems)..where((c) => c.id.equals(id))).write(
      ContentItemsCompanion(archivedAt: Value(now), stage: const Value(ContentStage.arquivado), updatedAt: Value(now)),
    );
    final content = await getById(id);
    if (content != null) {
      await _syncQueue.enqueue(
        workspaceId: content.workspaceId,
        entityType: 'content_item',
        entityId: id,
        operation: SyncOperationType.update,
      );
    }
  }
}
