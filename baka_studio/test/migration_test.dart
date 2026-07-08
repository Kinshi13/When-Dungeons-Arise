import 'dart:io';

import 'package:drift/native.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:sqlite3/sqlite3.dart' as sqlite3;

import 'package:baka_studio/data/db/app_database.dart';

/// Exercises the real v1 -> v2 upgrade path: builds a database file under
/// the *old* schema shape by hand (mirroring what shipped before this
/// phase) using raw `package:sqlite3`, including a project_channels row in
/// the old composite-key shape with no `id` column — then opens that same
/// file with the current [AppDatabase] and confirms every row survived,
/// including the junction table that had to be rebuilt with a new `id`
/// primary key.
void main() {
  test('existing v1 data survives the upgrade to v2, including junction tables', () async {
    final dir = await Directory.systemTemp.createTemp('baka_studio_migration_test');
    final file = File('${dir.path}/v1.sqlite');
    addTearDown(() => dir.delete(recursive: true));

    final raw = sqlite3.sqlite3.open(file.path);
    raw.execute('''
      CREATE TABLE workspaces (
        id TEXT NOT NULL PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT NOT NULL DEFAULT '',
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL
      );
      CREATE TABLE channels (
        id TEXT NOT NULL PRIMARY KEY,
        workspace_id TEXT NOT NULL,
        name TEXT NOT NULL,
        handle TEXT NULL,
        niche TEXT NOT NULL DEFAULT '',
        objective TEXT NOT NULL DEFAULT '',
        description TEXT NOT NULL DEFAULT '',
        color INTEGER NOT NULL,
        audience TEXT NULL,
        desired_frequency TEXT NULL,
        status TEXT NOT NULL,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL,
        archived_at INTEGER NULL
      );
      CREATE TABLE projects (
        id TEXT NOT NULL PRIMARY KEY,
        workspace_id TEXT NOT NULL,
        name TEXT NOT NULL,
        description TEXT NOT NULL DEFAULT '',
        status TEXT NOT NULL,
        priority TEXT NOT NULL,
        start_date INTEGER NULL,
        target_date INTEGER NULL,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL,
        archived_at INTEGER NULL
      );
      CREATE TABLE project_channels (
        project_id TEXT NOT NULL,
        channel_id TEXT NOT NULL,
        role TEXT NULL,
        PRIMARY KEY (project_id, channel_id)
      );
      CREATE TABLE project_nodes (
        id TEXT NOT NULL PRIMARY KEY,
        project_id TEXT NOT NULL,
        title TEXT NOT NULL,
        state TEXT NOT NULL,
        linked_entity_type TEXT NULL,
        linked_entity_id TEXT NULL,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL
      );
      CREATE TABLE project_node_relations (
        id TEXT NOT NULL PRIMARY KEY,
        project_id TEXT NOT NULL,
        source_node_id TEXT NOT NULL,
        target_node_id TEXT NOT NULL,
        type TEXT NOT NULL DEFAULT 'dependency'
      );
      CREATE TABLE content_items (
        id TEXT NOT NULL PRIMARY KEY,
        workspace_id TEXT NOT NULL,
        title TEXT NOT NULL,
        description TEXT NOT NULL DEFAULT '',
        format TEXT NOT NULL,
        stage TEXT NOT NULL,
        priority TEXT NOT NULL,
        project_id TEXT NULL,
        due_date INTEGER NULL,
        published_at INTEGER NULL,
        platform TEXT NULL,
        notes TEXT NOT NULL DEFAULT '',
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL,
        archived_at INTEGER NULL
      );
      CREATE TABLE content_channels (
        content_item_id TEXT NOT NULL,
        channel_id TEXT NOT NULL,
        role TEXT NULL,
        PRIMARY KEY (content_item_id, channel_id)
      );
      CREATE TABLE tasks (
        id TEXT NOT NULL PRIMARY KEY,
        workspace_id TEXT NOT NULL,
        title TEXT NOT NULL,
        description TEXT NOT NULL DEFAULT '',
        status TEXT NOT NULL,
        priority TEXT NOT NULL,
        due_date INTEGER NULL,
        completed_at INTEGER NULL,
        channel_id TEXT NULL,
        project_id TEXT NULL,
        content_item_id TEXT NULL,
        campaign_id TEXT NULL,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL
      );
      CREATE TABLE signals (
        id TEXT NOT NULL PRIMARY KEY,
        workspace_id TEXT NOT NULL,
        type TEXT NOT NULL,
        title TEXT NOT NULL,
        body TEXT NOT NULL DEFAULT '',
        source TEXT NULL,
        channel_id TEXT NULL,
        processed INTEGER NOT NULL DEFAULT 0,
        processed_at INTEGER NULL,
        converted_entity_type TEXT NULL,
        converted_entity_id TEXT NULL,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL
      );
      CREATE TABLE campaigns (
        id TEXT NOT NULL PRIMARY KEY,
        workspace_id TEXT NOT NULL,
        name TEXT NOT NULL,
        description TEXT NOT NULL DEFAULT '',
        status TEXT NOT NULL,
        start_date INTEGER NULL,
        end_date INTEGER NULL,
        primary_channel_id TEXT NULL,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL,
        archived_at INTEGER NULL
      );
      CREATE TABLE campaign_items (
        id TEXT NOT NULL PRIMARY KEY,
        campaign_id TEXT NOT NULL,
        entity_type TEXT NOT NULL,
        entity_id TEXT NOT NULL,
        sort_order INTEGER NOT NULL DEFAULT 0
      );
      CREATE TABLE channel_relations (
        id TEXT NOT NULL PRIMARY KEY,
        workspace_id TEXT NOT NULL,
        source_channel_id TEXT NOT NULL,
        target_channel_id TEXT NOT NULL,
        type TEXT NOT NULL,
        label TEXT NULL,
        created_at INTEGER NOT NULL
      );
      PRAGMA user_version = 1;
    ''');

    final nowMs = DateTime.now().millisecondsSinceEpoch;
    raw.execute('''
      INSERT INTO workspaces (id, name, created_at, updated_at) VALUES ('w1', 'Rede Baka', $nowMs, $nowMs);
      INSERT INTO channels (id, workspace_id, name, color, status, created_at, updated_at)
        VALUES ('c1', 'w1', 'Baka Code', 123456, 'active', $nowMs, $nowMs);
      INSERT INTO projects (id, workspace_id, name, status, priority, created_at, updated_at)
        VALUES ('p1', 'w1', 'App de Estoque', 'active', 'medium', $nowMs, $nowMs);
      INSERT INTO project_channels (project_id, channel_id) VALUES ('p1', 'c1');
    ''');
    raw.close();

    // Now open the SAME file with the real, current-schema AppDatabase —
    // this is exactly what happens when a real installation upgrades.
    final db = AppDatabase.forTesting(NativeDatabase(file));
    final workspaces = await db.select(db.workspaces).get();
    final channels = await db.select(db.channels).get();
    final projects = await db.select(db.projects).get();
    final projectChannels = await db.select(db.projectChannels).get();

    expect(workspaces, hasLength(1));
    expect(workspaces.single.name, 'Rede Baka');
    expect(channels, hasLength(1));
    expect(channels.single.name, 'Baka Code');
    expect(channels.single.deletedAt, isNull, reason: 'new column should default to null, not crash');
    expect(projects, hasLength(1));

    expect(projectChannels, hasLength(1), reason: 'the old composite-key row must survive the rebuild');
    final migratedPair = projectChannels.single;
    expect(migratedPair.projectId, 'p1');
    expect(migratedPair.channelId, 'c1');
    expect(migratedPair.id, isNotEmpty, reason: 'a fresh id must have been generated for the old row');
    expect(migratedPair.workspaceId, 'w1', reason: 'workspaceId must be backfilled from the parent project');
    expect(migratedPair.deletedAt, isNull);

    await db.close();
  });
}
