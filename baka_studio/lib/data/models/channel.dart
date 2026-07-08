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
    required this.workspaceId,
    required this.name,
    this.handle,
    this.niche = '',
    this.objective = '',
    this.description = '',
    required this.color,
    this.audience,
    this.desiredFrequency,
    required this.status,
    required this.createdAt,
    required this.updatedAt,
    this.archivedAt,
  });

  final String id;
  final String workspaceId;
  final String name;
  final String? handle;
  final String niche;
  final String objective;
  final String description;
  final Color color;
  final String? audience;
  final String? desiredFrequency;
  final ChannelStatus status;
  final DateTime createdAt;
  final DateTime updatedAt;
  final DateTime? archivedAt;

  bool get isArchived => archivedAt != null;

  Channel copyWith({
    String? name,
    String? handle,
    String? niche,
    String? objective,
    String? description,
    Color? color,
    String? audience,
    String? desiredFrequency,
    ChannelStatus? status,
    DateTime? updatedAt,
    DateTime? archivedAt,
  }) {
    return Channel(
      id: id,
      workspaceId: workspaceId,
      name: name ?? this.name,
      handle: handle ?? this.handle,
      niche: niche ?? this.niche,
      objective: objective ?? this.objective,
      description: description ?? this.description,
      color: color ?? this.color,
      audience: audience ?? this.audience,
      desiredFrequency: desiredFrequency ?? this.desiredFrequency,
      status: status ?? this.status,
      createdAt: createdAt,
      updatedAt: updatedAt ?? DateTime.now(),
      archivedAt: archivedAt ?? this.archivedAt,
    );
  }
}
