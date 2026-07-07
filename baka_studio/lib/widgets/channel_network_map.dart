import 'dart:math';
import 'package:flutter/material.dart';

import '../data/models/channel.dart';
import 'channel_star.dart';
import 'constellation_line.dart';

/// Fixed layout (fractions of the available box) for the known channels,
/// tuned to roughly match the reference network sketch. Any channel not
/// listed here falls back to an even circular placement.
const Map<String, Offset> _fixedLayout = {
  'stella7': Offset(0.62, 0.14),
  'baka_code': Offset(0.28, 0.46),
  'baka_phone': Offset(0.78, 0.48),
  'code_no_sekai': Offset(0.56, 0.82),
  'robsonso': Offset(0.12, 0.78),
};

/// Shared "channels as connected stars" visualization used by both the
/// Observatório ("Minha Rede") and the Canais screen ("Mapa da rede").
class ChannelNetworkMap extends StatelessWidget {
  const ChannelNetworkMap({
    super.key,
    required this.channels,
    required this.links,
    required this.selectedChannelId,
    required this.onSelect,
    this.height = 260,
  });

  final List<Channel> channels;
  final List<List<String>> links;
  final String? selectedChannelId;
  final ValueChanged<String> onSelect;
  final double height;

  Offset _positionFor(String id, int index, int total, Size size) {
    final fixed = _fixedLayout[id];
    final fraction = fixed ??
        Offset(
          0.5 + 0.36 * cos(2 * pi * index / total - pi / 2),
          0.5 + 0.36 * sin(2 * pi * index / total - pi / 2),
        );
    return Offset(fraction.dx * size.width, fraction.dy * size.height);
  }

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      height: height,
      child: LayoutBuilder(
        builder: (context, constraints) {
          final size = Size(constraints.maxWidth, constraints.maxHeight);
          final positions = <String, Offset>{
            for (var i = 0; i < channels.length; i++)
              channels[i].id: _positionFor(channels[i].id, i, channels.length, size),
          };

          final edges = <ConstellationEdge>[
            for (final link in links)
              if (positions[link[0]] != null && positions[link[1]] != null)
                ConstellationEdge(
                  start: positions[link[0]]!,
                  end: positions[link[1]]!,
                  dashed: selectedChannelId != null &&
                      !link.contains(selectedChannelId),
                ),
          ];

          return Stack(
            children: [
              Positioned.fill(child: ConstellationLine(edges: edges)),
              for (final channel in channels)
                Positioned(
                  left: positions[channel.id]!.dx,
                  top: positions[channel.id]!.dy,
                  child: FractionalTranslation(
                    translation: const Offset(-0.5, -0.5),
                    child: ChannelStar(
                      channel: channel,
                      selected: channel.id == selectedChannelId,
                      onTap: () => onSelect(channel.id),
                    ),
                  ),
                ),
            ],
          );
        },
      ),
    );
  }
}
