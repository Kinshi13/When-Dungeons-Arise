import 'package:drift/drift.dart';
import 'package:flutter/material.dart';

import '../db/app_database.dart';
import '../db/ids.dart';
import '../models/channel.dart';
import '../models/channel_link.dart';
import '../models/sync_state.dart';
import 'sync_queue_repository.dart';

Channel channelFromRow(ChannelEntry row) => Channel(
  id: row.id,
  workspaceId: row.workspaceId,
  name: row.name,
  handle: row.handle,
  niche: row.niche,
  objective: row.objective,
  description: row.description,
  color: Color(row.color),
  audience: row.audience,
  desiredFrequency: row.desiredFrequency,
  status: row.status,
  createdAt: row.createdAt,
  updatedAt: row.updatedAt,
  archivedAt: row.archivedAt,
);

/// Channels + the (mostly derived) relations drawn between them on "Minha
/// Rede". Nothing else in the app talks to [AppDatabase] for this data.
class ChannelRepository {
  ChannelRepository(this._db);

  final AppDatabase _db;
  late final SyncQueueRepository _syncQueue = SyncQueueRepository(_db);

  Stream<List<Channel>> watchAll({bool includeArchived = false}) {
    final query = _db.select(_db.channels)
      ..where((c) => c.deletedAt.isNull())
      ..orderBy([(c) => OrderingTerm.asc(c.name)]);
    if (!includeArchived) {
      query.where((c) => c.archivedAt.isNull());
    }
    return query.watch().map((rows) => rows.map(channelFromRow).toList());
  }

  Future<Channel?> getById(String id) async {
    final row = await (_db.select(_db.channels)..where((c) => c.id.equals(id))).getSingleOrNull();
    return row == null ? null : channelFromRow(row);
  }

  Future<Channel> create({
    required String workspaceId,
    required String name,
    required Color color,
    String? handle,
    String niche = '',
    String objective = '',
    String description = '',
    String? audience,
    String? desiredFrequency,
    ChannelStatus status = ChannelStatus.planning,
  }) async {
    final now = DateTime.now();
    final id = newId();
    await _db.into(_db.channels).insert(
      ChannelsCompanion.insert(
        id: id,
        workspaceId: workspaceId,
        name: name,
        color: color.toARGB32(),
        handle: Value(handle),
        niche: Value(niche),
        objective: Value(objective),
        description: Value(description),
        audience: Value(audience),
        desiredFrequency: Value(desiredFrequency),
        status: status,
        createdAt: now,
        updatedAt: now,
      ),
    );
    await _syncQueue.enqueue(workspaceId: workspaceId, entityType: 'channel', entityId: id, operation: SyncOperationType.create);
    return (await getById(id))!;
  }

  Future<void> update(Channel channel) async {
    await (_db.update(_db.channels)..where((c) => c.id.equals(channel.id))).write(
      ChannelsCompanion(
        name: Value(channel.name),
        handle: Value(channel.handle),
        niche: Value(channel.niche),
        objective: Value(channel.objective),
        description: Value(channel.description),
        color: Value(channel.color.toARGB32()),
        audience: Value(channel.audience),
        desiredFrequency: Value(channel.desiredFrequency),
        status: Value(channel.status),
        updatedAt: Value(DateTime.now()),
      ),
    );
    await _syncQueue.enqueue(
      workspaceId: channel.workspaceId,
      entityType: 'channel',
      entityId: channel.id,
      operation: SyncOperationType.update,
    );
  }

  Future<void> archive(String id) async {
    final now = DateTime.now();
    await (_db.update(_db.channels)..where((c) => c.id.equals(id))).write(
      ChannelsCompanion(archivedAt: Value(now), updatedAt: Value(now)),
    );
    final channel = await getById(id);
    if (channel != null) {
      await _syncQueue.enqueue(workspaceId: channel.workspaceId, entityType: 'channel', entityId: id, operation: SyncOperationType.update);
    }
  }

  Future<void> restore(String id) async {
    await (_db.update(_db.channels)..where((c) => c.id.equals(id))).write(
      ChannelsCompanion(archivedAt: const Value(null), updatedAt: Value(DateTime.now())),
    );
    final channel = await getById(id);
    if (channel != null) {
      await _syncQueue.enqueue(workspaceId: channel.workspaceId, entityType: 'channel', entityId: id, operation: SyncOperationType.update);
    }
  }

  // Relations ------------------------------------------------------------

  Stream<List<ChannelLink>> watchRelations(String workspaceId) {
    final query = _db.select(_db.channelRelations)
      ..where((r) => r.workspaceId.equals(workspaceId) & r.deletedAt.isNull());
    return query.watch().map(
      (rows) => rows
          .map((r) => ChannelLink(
                id: r.id,
                channelIdA: r.sourceChannelId,
                channelIdB: r.targetChannelId,
                type: r.type,
                relation: r.label,
              ))
          .toList(),
    );
  }

  Future<void> addManualRelation({
    required String workspaceId,
    required String channelIdA,
    required String channelIdB,
    required String label,
    ChannelRelationType type = ChannelRelationType.strategic,
  }) async {
    final id = newId();
    await _db.into(_db.channelRelations).insert(
      ChannelRelationsCompanion.insert(
        id: id,
        workspaceId: workspaceId,
        sourceChannelId: channelIdA,
        targetChannelId: channelIdB,
        type: type,
        label: Value(label),
        createdAt: DateTime.now(),
      ),
    );
    await _syncQueue.enqueue(workspaceId: workspaceId, entityType: 'channel_relation', entityId: id, operation: SyncOperationType.create);
  }

  /// Removes a manually curated relation. Derived (`sharedProject`/
  /// `sharedCampaign`) relations are never removed directly — they follow
  /// the underlying shared project/campaign automatically. Tombstoned
  /// rather than hard-deleted since this row is one of the few
  /// [ChannelRelations] rows that does get synced (see [type] check in the
  /// remote schema) — a physical delete could get resurrected by a device
  /// that hasn't pulled the removal yet.
  Future<void> removeRelation(String id) async {
    final now = DateTime.now();
    final row = await (_db.select(_db.channelRelations)..where((r) => r.id.equals(id))).getSingleOrNull();
    await (_db.update(_db.channelRelations)..where((r) => r.id.equals(id))).write(
      ChannelRelationsCompanion(deletedAt: Value(now), updatedAt: Value(now)),
    );
    if (row != null) {
      await _syncQueue.enqueue(
        workspaceId: row.workspaceId,
        entityType: 'channel_relation',
        entityId: id,
        operation: SyncOperationType.delete,
      );
    }
  }

  /// Recomputes every `sharedProject` relation from real
  /// [ProjectChannels] rows, replacing whatever derived rows existed
  /// before. Manually curated relations (`strategic` / `custom`) are left
  /// untouched. Call this after any project↔channel membership change.
  Future<void> syncSharedProjectRelations(String workspaceId) async {
    final links = await (_db.select(
      _db.projectChannels,
    )..where((c) => c.deletedAt.isNull())).get();
    final byProject = <String, Set<String>>{};
    for (final link in links) {
      byProject.putIfAbsent(link.projectId, () => {}).add(link.channelId);
    }

    final pairs = <(String, String)>{};
    for (final channelIds in byProject.values) {
      final ids = channelIds.toList()..sort();
      for (var i = 0; i < ids.length; i++) {
        for (var j = i + 1; j < ids.length; j++) {
          pairs.add((ids[i], ids[j]));
        }
      }
    }

    await _db.transaction(() async {
      await (_db.delete(_db.channelRelations)
            ..where((r) => r.workspaceId.equals(workspaceId) & r.type.equalsValue(ChannelRelationType.sharedProject)))
          .go();
      for (final pair in pairs) {
        await _db.into(_db.channelRelations).insert(
          ChannelRelationsCompanion.insert(
            id: newId(),
            workspaceId: workspaceId,
            sourceChannelId: pair.$1,
            targetChannelId: pair.$2,
            type: ChannelRelationType.sharedProject,
            createdAt: DateTime.now(),
          ),
        );
      }
    });
  }
}
