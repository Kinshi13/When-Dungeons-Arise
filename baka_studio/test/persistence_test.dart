import 'dart:io';

import 'package:drift/native.dart';
import 'package:flutter/material.dart' show Color;
import 'package:flutter_test/flutter_test.dart';

import 'package:baka_studio/data/db/app_database.dart';
import 'package:baka_studio/data/repositories/channel_repository.dart';
import 'package:baka_studio/data/repositories/workspace_repository.dart';

/// Exercises the exact guarantee the whole persistence layer exists for:
/// "close the app, reopen it, and find the data preserved" — by backing the
/// database with a real temp file (not `NativeDatabase.memory()`), closing
/// the connection, then reopening the same file as a fresh [AppDatabase]
/// instance, the way a real app restart would.
void main() {
  test('data survives closing and reopening the database file', () async {
    final dir = await Directory.systemTemp.createTemp('baka_studio_persistence_test');
    final file = File('${dir.path}/test.sqlite');
    addTearDown(() => dir.delete(recursive: true));

    var db = AppDatabase.forTesting(NativeDatabase(file));
    final workspace = await WorkspaceRepository(db).ensureDefault(name: 'Rede Baka');
    final channel = await ChannelRepository(db).create(
      workspaceId: workspace.id,
      name: 'Baka Code',
      color: const Color(0xFF3355FF),
    );
    await db.close();

    // Simulate the app being fully closed and reopened.
    db = AppDatabase.forTesting(NativeDatabase(file));
    final reopenedWorkspace = await WorkspaceRepository(db).getActive();
    final reopenedChannels = await ChannelRepository(db).watchAll().first;

    expect(reopenedWorkspace?.id, workspace.id);
    expect(reopenedWorkspace?.name, 'Rede Baka');
    expect(reopenedChannels, hasLength(1));
    expect(reopenedChannels.single.id, channel.id);
    expect(reopenedChannels.single.name, 'Baka Code');

    await db.close();
  });
}
