import 'package:drift/drift.dart';

import '../db/app_database.dart';
import '../db/ids.dart';
import '../models/campaign.dart';
import '../models/sync_state.dart';
import 'sync_queue_repository.dart';

Campaign _campaignFromRow(CampaignEntry row) => Campaign(
  id: row.id,
  workspaceId: row.workspaceId,
  name: row.name,
  description: row.description,
  status: row.status,
  startDate: row.startDate,
  endDate: row.endDate,
  primaryChannelId: row.primaryChannelId,
  createdAt: row.createdAt,
  updatedAt: row.updatedAt,
  archivedAt: row.archivedAt,
);

class CampaignRepository {
  CampaignRepository(this._db);

  final AppDatabase _db;
  late final SyncQueueRepository _syncQueue = SyncQueueRepository(_db);

  Stream<List<Campaign>> watchAll({bool includeArchived = false}) {
    final query = _db.select(_db.campaigns)
      ..where((c) => c.deletedAt.isNull())
      ..orderBy([(c) => OrderingTerm.desc(c.createdAt)]);
    if (!includeArchived) {
      query.where((c) => c.archivedAt.isNull());
    }
    return query.watch().map((rows) => rows.map(_campaignFromRow).toList());
  }

  Stream<List<CampaignItem>> watchItems(String campaignId) {
    final query = _db.select(_db.campaignItems)
      ..where((i) => i.campaignId.equals(campaignId) & i.deletedAt.isNull())
      ..orderBy([(i) => OrderingTerm.asc(i.sortOrder)]);
    return query.watch().map(
      (rows) => rows
          .map((r) => CampaignItem(id: r.id, campaignId: r.campaignId, entityType: r.entityType, entityId: r.entityId, sortOrder: r.sortOrder))
          .toList(),
    );
  }

  Future<Campaign> create({
    required String workspaceId,
    required String name,
    String description = '',
    CampaignStatus status = CampaignStatus.planning,
    DateTime? startDate,
    DateTime? endDate,
    String? primaryChannelId,
  }) async {
    final now = DateTime.now();
    final id = newId();
    await _db.into(_db.campaigns).insert(
      CampaignsCompanion.insert(
        id: id,
        workspaceId: workspaceId,
        name: name,
        description: Value(description),
        status: status,
        startDate: Value(startDate),
        endDate: Value(endDate),
        primaryChannelId: Value(primaryChannelId),
        createdAt: now,
        updatedAt: now,
      ),
    );
    await _syncQueue.enqueue(workspaceId: workspaceId, entityType: 'campaign', entityId: id, operation: SyncOperationType.create);
    return _campaignFromRow(await (_db.select(_db.campaigns)..where((c) => c.id.equals(id))).getSingle());
  }

  Future<void> update(
    String id, {
    String? name,
    String? description,
    CampaignStatus? status,
    DateTime? startDate,
    DateTime? endDate,
    String? primaryChannelId,
  }) async {
    await (_db.update(_db.campaigns)..where((c) => c.id.equals(id))).write(
      CampaignsCompanion(
        name: name == null ? const Value.absent() : Value(name),
        description: description == null ? const Value.absent() : Value(description),
        status: status == null ? const Value.absent() : Value(status),
        startDate: startDate == null ? const Value.absent() : Value(startDate),
        endDate: endDate == null ? const Value.absent() : Value(endDate),
        primaryChannelId: primaryChannelId == null ? const Value.absent() : Value(primaryChannelId),
        updatedAt: Value(DateTime.now()),
      ),
    );
    await _enqueueCampaignUpdate(id);
  }

  Future<void> archive(String id) async {
    final now = DateTime.now();
    await (_db.update(_db.campaigns)..where((c) => c.id.equals(id))).write(
      CampaignsCompanion(archivedAt: Value(now), status: Value(CampaignStatus.archived), updatedAt: Value(now)),
    );
    await _enqueueCampaignUpdate(id);
  }

  Future<void> _enqueueCampaignUpdate(String id) async {
    final row = await (_db.select(_db.campaigns)..where((c) => c.id.equals(id))).getSingleOrNull();
    if (row != null) {
      await _syncQueue.enqueue(workspaceId: row.workspaceId, entityType: 'campaign', entityId: id, operation: SyncOperationType.update);
    }
  }

  Future<void> addItem(String campaignId, CampaignItemEntityType type, String entityId) async {
    final now = DateTime.now();
    final campaignRow = await (_db.select(
      _db.campaigns,
    )..where((c) => c.id.equals(campaignId))).getSingleOrNull();
    final workspaceId = campaignRow?.workspaceId ?? '';
    final itemId = newId();
    await _db.into(_db.campaignItems).insert(
      CampaignItemsCompanion.insert(
        id: itemId,
        workspaceId: Value(workspaceId),
        campaignId: campaignId,
        entityType: type,
        entityId: entityId,
        createdAt: Value(now),
        updatedAt: Value(now),
      ),
    );
    if (workspaceId.isNotEmpty) {
      await _syncQueue.enqueue(
        workspaceId: workspaceId,
        entityType: 'campaign_item',
        entityId: itemId,
        operation: SyncOperationType.create,
      );
    }
  }

  /// Tombstoned rather than physically deleted, same reasoning as
  /// [ChannelRepository.removeRelation] — a device that hasn't pulled this
  /// removal yet must not resurrect the item by pushing its stale copy.
  Future<void> removeItem(String itemId) async {
    final now = DateTime.now();
    final row = await (_db.select(_db.campaignItems)..where((i) => i.id.equals(itemId))).getSingleOrNull();
    await (_db.update(_db.campaignItems)..where((i) => i.id.equals(itemId))).write(
      CampaignItemsCompanion(deletedAt: Value(now), updatedAt: Value(now)),
    );
    if (row?.workspaceId != null) {
      await _syncQueue.enqueue(
        workspaceId: row!.workspaceId!,
        entityType: 'campaign_item',
        entityId: itemId,
        operation: SyncOperationType.delete,
      );
    }
  }
}
