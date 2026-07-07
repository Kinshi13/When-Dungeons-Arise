/// A campaign is a "sistema" — a bundle of related content items driving a
/// single push (a launch, a series).
class Campaign {
  const Campaign({
    required this.id,
    required this.name,
    required this.description,
    required this.channelId,
    required this.relatedContentIds,
  });

  final String id;
  final String name;
  final String description;
  final String channelId;
  final List<String> relatedContentIds;
}
