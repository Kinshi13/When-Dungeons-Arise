import 'package:flutter/material.dart';

enum ChannelStatus { active, paused, planning }

extension ChannelStatusLabel on ChannelStatus {
  String get label => switch (this) {
    ChannelStatus.active => 'Ativo',
    ChannelStatus.paused => 'Pausado',
    ChannelStatus.planning => 'Planejamento',
  };
}

/// A channel is a "star" in the Baka Studio universe — one of the
/// creator's outlets (Baka Code, Stella7, etc).
class Channel {
  const Channel({
    required this.id,
    required this.name,
    required this.niche,
    required this.objective,
    required this.color,
    required this.status,
    this.nextPublication,
    this.pendingSignals = 0,
  });

  final String id;
  final String name;
  final String niche;
  final String objective;
  final Color color;
  final ChannelStatus status;
  final String? nextPublication;
  final int pendingSignals;
}
