/// The top-level container for everything in Baka Studio. Only one is
/// active at a time in this phase, but nothing else assumes that will
/// always be true — every entity below carries a [workspaceId].
class Workspace {
  const Workspace({
    required this.id,
    required this.name,
    this.description = '',
    required this.createdAt,
    required this.updatedAt,
  });

  final String id;
  final String name;
  final String description;
  final DateTime createdAt;
  final DateTime updatedAt;
}
