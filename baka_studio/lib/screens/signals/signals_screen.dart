import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../core/theme/theme.dart';
import '../../state/app_state.dart';
import '../../widgets/cosmic_section_header.dart';
import '../../widgets/empty_constellation_state.dart';
import '../../widgets/signal_item.dart';

class SignalsScreen extends StatelessWidget {
  const SignalsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final state = context.watch<AppState>();
    final pending = state.signals.where((s) => !s.processed).toList()
      ..sort((a, b) => b.receivedAt.compareTo(a.receivedAt));
    final archived = state.signals.where((s) => s.processed).toList();

    return SingleChildScrollView(
      padding: const EdgeInsets.all(BakaSpacing.lg),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const CosmicSectionHeader(title: 'Sinais', subtitle: 'Caixa de entrada'),
          const SizedBox(height: BakaSpacing.lg),
          if (pending.isEmpty)
            const EmptyConstellationState(message: 'Nenhum sinal pendente.')
          else
            Column(
              children: [
                for (final signal in pending)
                  Padding(
                    padding: const EdgeInsets.only(bottom: BakaSpacing.sm),
                    child: SignalItemTile(
                      signal: signal,
                      onConvertToContent: () => state.convertSignalToContent(signal.id),
                      onArchive: () => state.archiveSignal(signal.id),
                    ),
                  ),
              ],
            ),
          if (archived.isNotEmpty) ...[
            const SizedBox(height: BakaSpacing.lg),
            ExpansionTile(
              tilePadding: EdgeInsets.zero,
              title: Text('Processados (${archived.length})', style: Theme.of(context).textTheme.titleSmall),
              children: [
                for (final signal in archived)
                  Opacity(
                    opacity: 0.55,
                    child: Padding(
                      padding: const EdgeInsets.only(bottom: BakaSpacing.sm),
                      child: SignalItemTile(
                        signal: signal,
                        onConvertToContent: () {},
                        onArchive: () {},
                      ),
                    ),
                  ),
              ],
            ),
          ],
        ],
      ),
    );
  }
}
