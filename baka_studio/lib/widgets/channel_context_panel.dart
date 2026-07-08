import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../core/date_utils.dart';
import '../core/theme/theme.dart';
import '../data/models/content_item.dart';
import '../state/app_state.dart';
import 'stellar_card.dart';

/// Summary panel shown when a channel star is selected on a network map —
/// shared by the Observatório ("Minha Rede") and Canais ("Mapa da rede")
/// screens so selecting a channel always surfaces the same information.
class ChannelContextPanel extends StatelessWidget {
  const ChannelContextPanel({super.key, required this.channelId});

  final String channelId;

  @override
  Widget build(BuildContext context) {
    final state = context.watch<AppState>();
    final channel = state.channelById(channelId);
    if (channel == null) return const SizedBox.shrink();

    final projects = state.projectsForChannel(channelId);
    final content = state
        .contentForChannel(channelId)
        .where((c) => c.stage != ContentStage.publicado && c.stage != ContentStage.arquivado)
        .toList();
    final lateItems = content.where((c) => c.dueDate != null && isBeforeToday(c.dueDate!)).length;
    final links = state.channelRelations.where((l) => l.involves(channelId)).toList();
    final nextPublication = state.nextPublicationForChannel(channelId);

    return StellarCard(
      accentColor: channel.color,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(channel.name, style: Theme.of(context).textTheme.titleLarge),
          const SizedBox(height: 2),
          Text('${channel.niche} · ${channel.objective}', style: Theme.of(context).textTheme.bodySmall),
          const SizedBox(height: BakaSpacing.sm),
          Wrap(spacing: BakaSpacing.md, runSpacing: BakaSpacing.xs, children: [
            _MiniStat(label: 'Produções ativas', value: '${content.length}'),
            if (lateItems > 0) _MiniStat(label: 'Itens atrasados', value: '$lateItems', color: BakaColors.danger),
            _MiniStat(label: 'Projetos ativos', value: '${projects.length}'),
            _MiniStat(label: 'Próxima publicação', value: nextPublication ?? '—'),
          ]),
          if (links.isNotEmpty) ...[
            const SizedBox(height: BakaSpacing.sm),
            const Divider(),
            const SizedBox(height: BakaSpacing.xs),
            Text('Conexões', style: BakaTypography.overline),
            const SizedBox(height: 4),
            for (final link in links)
              Padding(
                padding: const EdgeInsets.only(bottom: 3),
                child: Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Padding(
                      padding: const EdgeInsets.only(top: 5),
                      child: Container(width: 4, height: 4, decoration: BoxDecoration(
                        color: state.channelById(link.other(channelId))?.color ?? BakaColors.textTertiary,
                        shape: BoxShape.circle,
                      )),
                    ),
                    const SizedBox(width: 6),
                    Expanded(
                      child: Text.rich(
                        TextSpan(
                          children: [
                            TextSpan(
                              text: '${state.channelById(link.other(channelId))?.name ?? '—'}: ',
                              style: Theme.of(context).textTheme.bodySmall?.copyWith(color: BakaColors.starWhite),
                            ),
                            TextSpan(text: link.description, style: Theme.of(context).textTheme.bodySmall),
                          ],
                        ),
                      ),
                    ),
                  ],
                ),
              ),
          ],
        ],
      ),
    );
  }
}

class _MiniStat extends StatelessWidget {
  const _MiniStat({required this.label, required this.value, this.color});

  final String label;
  final String value;
  final Color? color;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      mainAxisSize: MainAxisSize.min,
      children: [
        Text(label, style: Theme.of(context).textTheme.labelSmall),
        Text(value, style: Theme.of(context).textTheme.bodyMedium?.copyWith(color: color)),
      ],
    );
  }
}
