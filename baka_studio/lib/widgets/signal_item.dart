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
  SignalType.imagem => Icons.image_outlined,
  SignalType.voz => Icons.mic_none_outlined,
};

Color colorForSignalType(SignalType type) => switch (type) {
  SignalType.ideia => BakaColors.stellarBlue,
  SignalType.bug => BakaColors.danger,
  SignalType.conteudo => BakaColors.nebulaViolet,
  SignalType.musica => BakaColors.stellaRose,
  SignalType.nota => BakaColors.signalCyan,
  SignalType.link => BakaColors.textSecondary,
  SignalType.imagem => BakaColors.emberAmber,
  SignalType.voz => BakaColors.success,
};

String relativeTime(DateTime from) {
  final diff = DateTime.now().difference(from);
  if (diff.inMinutes < 1) return 'agora';
  if (diff.inMinutes < 60) return 'há ${diff.inMinutes} min';
  if (diff.inHours < 24) return 'há ${diff.inHours} h';
  if (diff.inDays == 1) return 'ontem';
  return 'há ${diff.inDays} dias';
}

String _conversionLabel(String? type) => switch (type) {
  'content' => 'Virou uma produção',
  'task' => 'Virou uma tarefa',
  'project' => 'Virou um projeto',
  'channel' => 'Vinculado a um canal',
  'archived' => 'Arquivado sem conversão',
  _ => 'Processado',
};

/// A single row in the Sinais (inbox) list. Pending signals expose the full
/// processing menu; processed ones show what they became instead.
class SignalItemTile extends StatelessWidget {
  const SignalItemTile({
    super.key,
    required this.signal,
    this.onConvertToContent,
    this.onConvertToTask,
    this.onConvertToProject,
    this.onArchive,
  });

  final Signal signal;
  final VoidCallback? onConvertToContent;
  final VoidCallback? onConvertToTask;
  final VoidCallback? onConvertToProject;
  final VoidCallback? onArchive;

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
                Text(signal.title, style: textTheme.bodyLarge, maxLines: 2, overflow: TextOverflow.ellipsis),
                const SizedBox(height: 2),
                Text(
                  signal.processed ? _conversionLabel(signal.convertedEntityType) : relativeTime(signal.receivedAt),
                  style: textTheme.bodySmall,
                ),
              ],
            ),
          ),
          if (!signal.processed)
            PopupMenuButton<String>(
              tooltip: 'Processar sinal',
              icon: const Icon(Icons.more_vert, color: BakaColors.textSecondary),
              color: BakaColors.nebulaSlate,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(BakaRadii.md)),
              onSelected: (value) {
                switch (value) {
                  case 'content':
                    onConvertToContent?.call();
                  case 'task':
                    onConvertToTask?.call();
                  case 'project':
                    onConvertToProject?.call();
                  case 'archive':
                    onArchive?.call();
                }
              },
              itemBuilder: (context) => const [
                PopupMenuItem(value: 'content', child: Text('Transformar em produção')),
                PopupMenuItem(value: 'task', child: Text('Transformar em tarefa')),
                PopupMenuItem(value: 'project', child: Text('Transformar em projeto')),
                PopupMenuItem(value: 'archive', child: Text('Arquivar sem converter')),
              ],
            ),
        ],
      ),
    );
  }
}
