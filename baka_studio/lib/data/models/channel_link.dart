/// A real relationship between two channels — never decorative. Every link
/// must describe an actual strategic connection (shared project, derived
/// content, cross-promotion) so the network map stays meaningful instead of
/// an all-to-all mesh.
class ChannelLink {
  const ChannelLink({
    required this.channelIdA,
    required this.channelIdB,
    required this.relation,
  });

  final String channelIdA;
  final String channelIdB;

  /// Short, honest description of the real link (e.g. "Baka Studio
  /// documenta o processo de criação musical").
  final String relation;

  bool involves(String channelId) => channelIdA == channelId || channelIdB == channelId;

  String? other(String channelId) {
    if (channelIdA == channelId) return channelIdB;
    if (channelIdB == channelId) return channelIdA;
    return null;
  }
}
