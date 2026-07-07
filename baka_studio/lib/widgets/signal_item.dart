import 'package:flutter/material.dart';

import '../core/theme/theme.dart';
import '../data/models/signal.dart';
import 'stellar_card.dart';

IconData iconForSignalType(SignalType type) => switch (type) {
  SignalType.ideia => Icons.lightbulb_outline,
  SignalType.bug => Icons.bug_report_outlined,
  SignalType.conteudo => Icons.movie_creation_outlined,
  SignalType.musica => Icons.music_note_outlined,
  SignalType.nota => Icons.sticky_note_2_outlined,
  SignalType.link => Icons.link,
};

Color colorForSignalType(SignalType type) => switch (type) {
  SignalType.ideia => BakaColors.stellarBlue,
  SignalType.bug => BakaColors.danger,
  SignalType.conteudo => BakaColors.nebulaViolet,
  SignalType.musica => BakaColors.stellaRose,
  SignalType.nota => BakaColors.signalCyan,
  SignalType.link => BakaColors.textSecondary,
};

String relativeTime(DateTime from) {
  final diff = DateTime.now().difference(from);
  if (diff.inMinutes < 1) return 'agora';
  if (diff.inMinutes < 60) return 'há ${diff.inMinutes} min';
  if (diff.inHours < 24) return 'há ${diff.inHours} h';
  if (diff.inDays == 1) return 'ontem';
  return 'há ${diff.inDays} dias';
}

/// A single row in the Sinais (inbox) list.
class SignalItemTile extends StatelessWidget {
  const SignalItemTile({
    super.key,
    required this.signal,
    required this.onConvertToContent,
    required this.onArchive,
  });

  final Signal signal;
  final VoidCallback onConvertToContent;
  final VoidCallback onArchive;

  @override
  Widget build(BuildContext context) {
    final color = colorForSignalType(signal.type);
    final textTheme = Theme.of(context).textTheme;

    return StellarCard(
      padding: const EdgeInsets.symmetric(horizontal: BakaSpacing.md, vertical: BakaSpacing.sm),
      child: Row(
        children: [
          Container(
            width: 36,
            height: 36,
            decoration: BoxDecoration(
              color: color.withValues(alpha: 0.14),
              shape: BoxShape.circle,
            ),
            child: Icon(iconForSignalType(signal.type), color: color, size: 18),
          ),
          const SizedBox(width: BakaSpacing.sm),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(signal.type.label, style: BakaTypography.overline.copyWith(color: color)),
                const SizedBox(height: 2),
                Text(signal.text, style: textTheme.bodyLarge, maxLines: 2, overflow: TextOverflow.ellipsis),
                const SizedBox(height: 2),
                Text(relativeTime(signal.receivedAt), style: textTheme.bodySmall),
              ],
            ),
          ),
          PopupMenuButton<String>(
            tooltip: 'Processar sinal',
            icon: const Icon(Icons.more_vert, color: BakaColors.textSecondary),
            color: BakaColors.nebulaSlate,
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(BakaRadii.md)),
            onSelected: (value) {
              if (value == 'content') onConvertToContent();
              if (value == 'archive') onArchive();
            },
            itemBuilder: (context) => const [
              PopupMenuItem(value: 'content', child: Text('Transformar em conteúdo')),
              PopupMenuItem(value: 'archive', child: Text('Arquivar')),
            ],
          ),
        ],
      ),
    );
  }
}
