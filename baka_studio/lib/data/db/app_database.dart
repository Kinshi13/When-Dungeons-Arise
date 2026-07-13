import 'package:drift/drift.dart';
import 'package:drift_flutter/drift_flutter.dart';

import 'ids.dart';
import 'tables.dart';

part 'app_database.g.dart';

/// Local persistence for Baka Studio.
///
/// Chosen over sqflite/hive/isar/objectbox because it's the only option
/// that gives us all of: real SQL relations + migrations, first-class
/// support on Android *and* Windows *and* Linux (this sandbox) *and* a
/// future iOS/macOS build, and reactive `Stream` queries that plug directly
/// into the app's `ChangeNotifier`-based state without a separate
/// polling/refresh mechanism. The physical file lives in the platform's app
/// documents directory (`baka_studio.sqlite`), resolved by `drift_flutter`.
@DriftDatabase(
  tables: [
    Workspaces,
    Channels,
    Projects,
    ProjectChannels,
    ProjectNodes,
    ProjectNodeRelations,
    ContentItems,
    ContentChannels,
    Tasks,
    Signals,
    Campaigns,
    CampaignItems,
    ChannelRelations,
    LocalSettings,
    SyncQueueEntries,
    SyncConflicts,
  ],
)
class AppDatabase extends _$AppDatabase {
  AppDatabase() : super(_openConnection());

  /// Used by tests to run against an isolated in-memory/temp executor
  /// instead of the real per-platform app-documents file.
  AppDatabase.forTesting(super.executor);

  /// Bumping this requires adding a migration step below — never destroy
  /// user data by resetting the schema.
  @override
  int get schemaVersion => 2;

  @override
  MigrationStrategy get migration => MigrationStrategy(
    onCreate: (m) async {
      await m.createAll();
    },
    // v1 -> v2: adds sync-readiness fields (tombstone `deletedAt` on every
    // syncable table, `ownerId` on Workspaces) ahead of the sync engine —
    // see the Fase 4 final report for the full rationale. Two junction
    // tables (ProjectChannels, ContentChannels) also gain their own `id` +
    // timestamps, migrated separately in [_migrateJunctionTablesToV2] since
    // that requires recreating them, not just adding columns.
    onUpgrade: (m, from, to) async {
      if (from < 2) {
        await m.addColumn(workspaces, workspaces.ownerId);
        await m.addColumn(workspaces, workspaces.deletedAt);
        await m.addColumn(channels, channels.deletedAt);
        await m.addColumn(projects, projects.deletedAt);
        await m.addColumn(projectNodes, projectNodes.deletedAt);
        await m.addColumn(projectNodeRelations, projectNodeRelations.workspaceId);
        await m.addColumn(projectNodeRelations, projectNodeRelations.createdAt);
        await m.addColumn(projectNodeRelations, projectNodeRelations.updatedAt);
        await m.addColumn(projectNodeRelations, projectNodeRelations.deletedAt);
        await m.addColumn(contentItems, contentItems.deletedAt);
        await m.addColumn(tasks, tasks.deletedAt);
        await m.addColumn(signals, signals.deletedAt);
        await m.addColumn(campaigns, campaigns.deletedAt);
        await m.addColumn(campaignItems, campaignItems.workspaceId);
        await m.addColumn(campaignItems, campaignItems.createdAt);
        await m.addColumn(campaignItems, campaignItems.updatedAt);
        await m.addColumn(campaignItems, campaignItems.deletedAt);
        await m.addColumn(channelRelations, channelRelations.updatedAt);
        await m.addColumn(channelRelations, channelRelations.deletedAt);
        await _migrateJunctionTablesToV2(m);
        await m.createTable(localSettings);
        await m.createTable(syncQueueEntries);
        await m.createTable(syncConflicts);
      }
    },
  );

  /// [ProjectChannels] and [ContentChannels] originally used a composite
  /// primary key (no standalone `id`), which can't sync/tombstone a single
  /// pairing independently. SQLite can't add a primary key via `ALTER
  /// TABLE`, so each table is recreated under its new shape and every
  /// existing row is copied across with a freshly generated id — no data
  /// is dropped, only the physical table is rebuilt.
  Future<void> _migrateJunctionTablesToV2(Migrator m) async {
    final oldProjectChannels = await customSelect(
      'SELECT project_id, channel_id, role FROM project_channels',
    ).get();
    await customStatement('ALTER TABLE project_channels RENAME TO project_channels_v1');
    await m.createTable(projectChannels);
    for (final row in oldProjectChannels) {
      final projectId = row.read<String>('project_id');
      final workspaceRow = await customSelect(
        'SELECT workspace_id FROM projects WHERE id = ?',
        variables: [Variable(projectId)],
      ).getSingleOrNull();
      await into(projectChannels).insert(
        ProjectChannelsCompanion.insert(
          id: newId(),
          workspaceId: workspaceRow?.read<String>('workspace_id') ?? '',
          projectId: projectId,
          channelId: row.read<String>('channel_id'),
          role: Value(row.readNullable<String>('role')),
          createdAt: Value(DateTime.now()),
          updatedAt: Value(DateTime.now()),
        ),
      );
    }
    await customStatement('DROP TABLE project_channels_v1');

    final oldContentChannels = await customSelect(
      'SELECT content_item_id, channel_id, role FROM content_channels',
    ).get();
    await customStatement('ALTER TABLE content_channels RENAME TO content_channels_v1');
    await m.createTable(contentChannels);
    for (final row in oldContentChannels) {
      final contentItemId = row.read<String>('content_item_id');
      final workspaceRow = await customSelect(
        'SELECT workspace_id FROM content_items WHERE id = ?',
        variables: [Variable(contentItemId)],
      ).getSingleOrNull();
      await into(contentChannels).insert(
        ContentChannelsCompanion.insert(
          id: newId(),
          workspaceId: workspaceRow?.read<String>('workspace_id') ?? '',
          contentItemId: contentItemId,
          channelId: row.read<String>('channel_id'),
          role: Value(row.readNullable<String>('role')),
          createdAt: Value(DateTime.now()),
          updatedAt: Value(DateTime.now()),
        ),
      );
    }
    await customStatement('DROP TABLE content_channels_v1');
  }

  static QueryExecutor _openConnection() {
    return driftDatabase(
      name: 'baka_studio',
      web: DriftWebOptions(
        sqlite3Wasm: Uri.parse('sqlite3.wasm'),
        driftWorker: Uri.parse('drift_worker.js'),
      ),
    );
  }
}
