import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../core/theme/theme.dart';
import '../../state/sync_coordinator.dart';
import '../../widgets/stellar_button.dart';

/// Escuta [SyncCoordinator.pendingAdoption] e mostra o diálogo "Dados
/// encontrados neste dispositivo" quando (e só quando) este dispositivo
/// tinha dados criados antes do primeiro login — nunca decide sozinho,
/// sempre espera o usuário escolher (seção 23-24 da Fase 4).
class AdoptionDialogListener extends StatefulWidget {
  const AdoptionDialogListener({super.key, required this.child});

  final Widget child;

  @override
  State<AdoptionDialogListener> createState() => _AdoptionDialogListenerState();
}

class _AdoptionDialogListenerState extends State<AdoptionDialogListener> {
  bool _showing = false;

  @override
  Widget build(BuildContext context) {
    final pending = context.watch<SyncCoordinator>().pendingAdoption;

    if (pending != null && !_showing) {
      _showing = true;
      WidgetsBinding.instance.addPostFrameCallback((_) async {
        if (!mounted) return;
        await showDialog<void>(context: context, barrierDismissible: false, builder: (_) => _AdoptionDialog(pending: pending));
        _showing = false;
      });
    }

    return widget.child;
  }
}

class _AdoptionDialog extends StatelessWidget {
  const _AdoptionDialog({required this.pending});

  final PendingAdoption pending;

  @override
  Widget build(BuildContext context) {
    final summary = pending.summary;
    return AlertDialog(
      title: const Text('Dados encontrados neste dispositivo'),
      content: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Este dispositivo já tinha dados criados antes deste login. '
            'Você pode vincular tudo à sua conta para sincronizar entre '
            'dispositivos, ou manter apenas neste dispositivo por enquanto '
            '— nada é apagado em nenhum dos dois casos.',
            style: Theme.of(context).textTheme.bodyMedium,
          ),
          const SizedBox(height: BakaSpacing.md),
          _SummaryRow(label: 'Canais', count: summary.channels),
          _SummaryRow(label: 'Constelações', count: summary.projects),
          _SummaryRow(label: 'Produções', count: summary.contentItems),
          _SummaryRow(label: 'Tarefas', count: summary.tasks),
          _SummaryRow(label: 'Sinais', count: summary.signals),
          _SummaryRow(label: 'Campanhas', count: summary.campaigns),
        ],
      ),
      actions: [
        StellarButton(
          label: 'Manter apenas local por enquanto',
          variant: StellarButtonVariant.text,
          onPressed: () {
            context.read<SyncCoordinator>().dismissAdoption();
            Navigator.of(context).pop();
          },
        ),
        StellarButton(
          label: 'Vincular à minha conta',
          onPressed: () {
            context.read<SyncCoordinator>().confirmAdoption();
            Navigator.of(context).pop();
          },
        ),
      ],
    );
  }
}

class _SummaryRow extends StatelessWidget {
  const _SummaryRow({required this.label, required this.count});

  final String label;
  final int count;

  @override
  Widget build(BuildContext context) {
    if (count == 0) return const SizedBox.shrink();
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 2),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(label, style: Theme.of(context).textTheme.bodySmall),
          Text('$count', style: Theme.of(context).textTheme.bodySmall),
        ],
      ),
    );
  }
}
