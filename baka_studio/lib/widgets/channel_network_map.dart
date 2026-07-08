import 'dart:math';
import 'package:flutter/material.dart';

import '../core/theme/baka_motion.dart';
import '../data/models/channel.dart';
import '../data/models/channel_link.dart';
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
///
/// Hovering (desktop) or selecting a star focuses it: its real connections
/// (see [ChannelLink]) light up while unrelated stars and lines dim — the
/// map never lights every connection at once, since not all channels are
/// actually related.
class ChannelNetworkMap extends StatefulWidget {
  const ChannelNetworkMap({
    super.key,
    required this.channels,
    required this.links,
    required this.selectedChannelId,
    required this.onSelect,
    this.height = 260,
  });

  final List<Channel> channels;
  final List<ChannelLink> links;
  final String? selectedChannelId;
  final ValueChanged<String> onSelect;
  final double height;

  @override
  State<ChannelNetworkMap> createState() => _ChannelNetworkMapState();
}

class _ChannelNetworkMapState extends State<ChannelNetworkMap> {
  String? _hoveredId;

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
    final focusId = _hoveredId ?? widget.selectedChannelId;

    return SizedBox(
      height: widget.height,
      child: LayoutBuilder(
        builder: (context, constraints) {
          final size = Size(constraints.maxWidth, constraints.maxHeight);
          final positions = <String, Offset>{
            for (var i = 0; i < widget.channels.length; i++)
              widget.channels[i].id: _positionFor(widget.channels[i].id, i, widget.channels.length, size),
          };

          final edges = <ConstellationEdge>[
            for (final link in widget.links)
              if (positions[link.channelIdA] != null && positions[link.channelIdB] != null)
                ConstellationEdge(
                  start: positions[link.channelIdA]!,
                  end: positions[link.channelIdB]!,
                  dashed: focusId != null && !link.involves(focusId),
                ),
          ];

          return Stack(
            children: [
              Positioned.fill(
                child: AnimatedSwitcher(
                  duration: BakaMotion.fast,
                  child: ConstellationLine(key: ValueKey(focusId), edges: edges),
                ),
              ),
              for (final channel in widget.channels)
                Positioned(
                  left: positions[channel.id]!.dx,
                  top: positions[channel.id]!.dy,
                  child: FractionalTranslation(
                    translation: const Offset(-0.5, -0.5),
                    child: ChannelStar(
                      channel: channel,
                      selected: channel.id == widget.selectedChannelId || channel.id == _hoveredId,
                      muted: focusId != null &&
                          channel.id != focusId &&
                          !widget.links.any((l) => l.involves(focusId) && l.involves(channel.id)),
                      onHover: (hovering) => setState(() => _hoveredId = hovering ? channel.id : null),
                      onTap: () => widget.onSelect(channel.id),
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
