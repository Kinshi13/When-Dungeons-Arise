import 'package:drift/drift.dart';

import '../db/app_database.dart';
import '../db/ids.dart';
import '../models/campaign.dart';

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

  Stream<List<Campaign>> watchAll({bool includeArchived = false}) {
    final query = _db.select(_db.campaigns)..orderBy([(c) => OrderingTerm.desc(c.createdAt)]);
    if (!includeArchived) {
      query.where((c) => c.archivedAt.isNull());
    }
    return query.watch().map((rows) => rows.map(_campaignFromRow).toList());
  }

  Stream<List<CampaignItem>> watchItems(String campaignId) {
    final query = _db.select(_db.campaignItems)
      ..where((i) => i.campaignId.equals(campaignId))
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
  }

  Future<void> archive(String id) async {
    await (_db.update(_db.campaigns)..where((c) => c.id.equals(id))).write(
      CampaignsCompanion(archivedAt: Value(DateTime.now()), status: Value(CampaignStatus.archived), updatedAt: Value(DateTime.now())),
    );
  }

  Future<void> addItem(String campaignId, CampaignItemEntityType type, String entityId) async {
    await _db.into(_db.campaignItems).insert(
      CampaignItemsCompanion.insert(id: newId(), campaignId: campaignId, entityType: type, entityId: entityId),
    );
  }

  Future<void> removeItem(String itemId) async {
    await (_db.delete(_db.campaignItems)..where((i) => i.id.equals(itemId))).go();
  }
}
