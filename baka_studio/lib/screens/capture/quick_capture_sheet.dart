import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../core/theme/theme.dart';
import '../../data/models/signal.dart';
import '../../state/app_state.dart';
import '../../widgets/signal_item.dart';

/// Global quick-capture panel. Designed to take a few seconds: type + text
/// is enough to save — everything else is optional and defaults to Sinais.
class QuickCaptureSheet extends StatefulWidget {
  const QuickCaptureSheet({super.key});

  @override
  State<QuickCaptureSheet> createState() => _QuickCaptureSheetState();
}

class _QuickCaptureSheetState extends State<QuickCaptureSheet> {
  SignalType _type = SignalType.ideia;
  String? _channelId;
  final _textController = TextEditingController();

  @override
  void dispose() {
    _textController.dispose();
    super.dispose();
  }

  void _save() {
    final text = _textController.text.trim();
    if (text.isEmpty) return;
    context.read<AppState>().addSignal(
      Signal(
        id: 'signal_${DateTime.now().microsecondsSinceEpoch}',
        type: _type,
        text: text,
        receivedAt: DateTime.now(),
        channelId: _channelId,
      ),
    );
    Navigator.of(context).pop();
  }

  @override
  Widget build(BuildContext context) {
    final state = context.watch<AppState>();

    return Padding(
      padding: EdgeInsets.only(bottom: MediaQuery.viewInsetsOf(context).bottom),
      child: Container(
        decoration: const BoxDecoration(
          color: BakaColors.nebulaSlate,
          borderRadius: BorderRadius.vertical(top: Radius.circular(BakaRadii.xl)),
        ),
        padding: const EdgeInsets.fromLTRB(BakaSpacing.lg, BakaSpacing.sm, BakaSpacing.lg, BakaSpacing.lg),
        child: SafeArea(
          top: false,
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Center(
                child: Container(
                  width: 36,
                  height: 4,
                  margin: const EdgeInsets.only(bottom: BakaSpacing.md),
                  decoration: BoxDecoration(color: BakaColors.textTertiary, borderRadius: BorderRadius.circular(BakaRadii.pill)),
                ),
              ),
              Text('Captura rápida', style: Theme.of(context).textTheme.headlineSmall),
              const SizedBox(height: BakaSpacing.xs),
              Text('Salve agora, classifique depois — tudo cai em Sinais.', style: Theme.of(context).textTheme.bodySmall),
              const SizedBox(height: BakaSpacing.md),
              Wrap(
                spacing: BakaSpacing.xs,
                runSpacing: BakaSpacing.xs,
                children: [
                  for (final type in SignalType.values)
                    ChoiceChip(
                      avatar: Icon(iconForSignalType(type), size: 16, color: colorForSignalType(type)),
                      label: Text(type.label),
                      selected: _type == type,
                      onSelected: (_) => setState(() => _type = type),
                    ),
                ],
              ),
              const SizedBox(height: BakaSpacing.md),
              TextField(
                controller: _textController,
                autofocus: true,
                minLines: 2,
                maxLines: 4,
                decoration: const InputDecoration(hintText: 'O que você quer registrar?'),
                onSubmitted: (_) => _save(),
              ),
              const SizedBox(height: BakaSpacing.md),
              DropdownButtonFormField<String?>(
                initialValue: _channelId,
                decoration: const InputDecoration(labelText: 'Canal (opcional)'),
                dropdownColor: BakaColors.nebulaSlate,
                items: [
                  const DropdownMenuItem(value: null, child: Text('Nenhum')),
                  for (final channel in state.channels) DropdownMenuItem(value: channel.id, child: Text(channel.name)),
                ],
                onChanged: (value) => setState(() => _channelId = value),
              ),
              const SizedBox(height: BakaSpacing.lg),
              SizedBox(
                width: double.infinity,
                child: ElevatedButton(onPressed: _save, child: const Text('Salvar em Sinais')),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
