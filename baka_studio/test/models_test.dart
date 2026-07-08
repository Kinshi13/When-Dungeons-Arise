import 'package:flutter_test/flutter_test.dart';

import 'package:baka_studio/data/models/channel_link.dart';
import 'package:baka_studio/data/models/project.dart';
import 'package:baka_studio/data/models/task.dart';

DailyTask _task({DateTime? dueDate, TaskStatus status = TaskStatus.todo}) {
  final now = DateTime.now();
  return DailyTask(
    id: 't',
    workspaceId: 'w',
    title: 'Tarefa',
    status: status,
    dueDate: dueDate,
    createdAt: now,
    updatedAt: now,
  );
}

void main() {
  group('Project.progress', () {
    test('is zero with no items', () {
      final project = Project(
        id: 'p',
        workspaceId: 'w',
        name: 'Sem itens',
        description: '',
        channelIds: const [],
        status: ProjectStatus.idea,
        priority: ProjectPriority.medium,
        items: const [],
        createdAt: DateTime.now(),
        updatedAt: DateTime.now(),
      );
      expect(project.progress, 0);
    });

    test('is the fraction of items marked done', () {
      final project = Project(
        id: 'p',
        workspaceId: 'w',
        name: 'Com itens',
        description: '',
        channelIds: const [],
        status: ProjectStatus.active,
        priority: ProjectPriority.medium,
        items: const [
          ProjectItem(id: '1', title: 'A', state: ProjectItemState.done),
          ProjectItem(id: '2', title: 'B', state: ProjectItemState.done),
          ProjectItem(id: '3', title: 'C', state: ProjectItemState.planned),
          ProjectItem(id: '4', title: 'D', state: ProjectItemState.blocked),
        ],
        createdAt: DateTime.now(),
        updatedAt: DateTime.now(),
      );
      expect(project.progress, 0.5);
    });
  });

  group('DailyTask.isLate', () {
    test('a done task is never late, even with a past due date', () {
      final task = _task(dueDate: DateTime.now().subtract(const Duration(days: 3)), status: TaskStatus.done);
      expect(task.isLate, isFalse);
    });

    test('a cancelled task is never late', () {
      final task = _task(dueDate: DateTime.now().subtract(const Duration(days: 3)), status: TaskStatus.cancelled);
      expect(task.isLate, isFalse);
    });

    test('a pending task with a past due date is late', () {
      final task = _task(dueDate: DateTime.now().subtract(const Duration(days: 1)));
      expect(task.isLate, isTrue);
    });

    test('a task with no due date is never late', () {
      final task = _task();
      expect(task.isLate, isFalse);
    });

    test('a task due in the future is not late', () {
      final task = _task(dueDate: DateTime.now().add(const Duration(days: 1)));
      expect(task.isLate, isFalse);
    });
  });

  group('ChannelLink', () {
    test('involves and other() resolve either side of the relation', () {
      const link = ChannelLink(channelIdA: 'a', channelIdB: 'b', type: ChannelRelationType.strategic);
      expect(link.involves('a'), isTrue);
      expect(link.involves('b'), isTrue);
      expect(link.involves('c'), isFalse);
      expect(link.other('a'), 'b');
      expect(link.other('b'), 'a');
      expect(link.other('c'), isNull);
    });

    test('description falls back to the relation type label when unset', () {
      const link = ChannelLink(channelIdA: 'a', channelIdB: 'b', type: ChannelRelationType.sharedProject);
      expect(link.description, 'Projeto compartilhado');
    });

    test('description prefers the curated relation text when set', () {
      const link = ChannelLink(channelIdA: 'a', channelIdB: 'b', type: ChannelRelationType.custom, relation: 'Parceria de conteúdo');
      expect(link.description, 'Parceria de conteúdo');
    });
  });
}
