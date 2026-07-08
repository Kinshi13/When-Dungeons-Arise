import 'package:drift/drift.dart';
import 'package:drift_flutter/drift_flutter.dart';

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
  int get schemaVersion => 1;

  @override
  MigrationStrategy get migration => MigrationStrategy(
    onCreate: (m) async {
      await m.createAll();
    },
    // Example for the next schema change:
    // onUpgrade: (m, from, to) async {
    //   if (from < 2) await m.addColumn(channels, channels.someNewColumn);
    // },
  );

  static QueryExecutor _openConnection() {
    return driftDatabase(name: 'baka_studio');
  }
}
