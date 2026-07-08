import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../core/theme/theme.dart';
import '../../data/models/channel_link.dart';
import '../../state/app_state.dart';
import '../../widgets/forms/form_sheet_scaffold.dart';

/// Manually curates a relation between two channels — for links that don't
/// come from a shared project/campaign (e.g. a cross-promotion agreement).
class ChannelRelationFormSheet extends StatefulWidget {
  const ChannelRelationFormSheet({super.key, required this.channelId});

  final String channelId;

  @override
  State<ChannelRelationFormSheet> createState() => _ChannelRelationFormSheetState();
}

class _ChannelRelationFormSheetState extends State<ChannelRelationFormSheet> {
  final _formKey = GlobalKey<FormState>();
  final _label = TextEditingController();
  String? _otherChannelId;
  ChannelRelationType _type = ChannelRelationType.strategic;

  @override
  void dispose() {
    _label.dispose();
    super.dispose();
  }

  Future<void> _save() async {
    if (_otherChannelId == null) throw 'Selecione o outro canal';
    if (!_formKey.currentState!.validate()) throw 'Descreva a conexão';
    await context.read<AppState>().addChannelRelation(
      channelIdA: widget.channelId,
      channelIdB: _otherChannelId!,
      label: _label.text.trim(),
      type: _type,
    );
  }

  @override
  Widget build(BuildContext context) {
    final state = context.watch<AppState>();
    final otherChannels = state.channels.where((c) => c.id != widget.channelId).toList();

    return FormSheetScaffold(
      title: 'Nova conexão',
      saveLabel: 'Conectar',
      onSave: _save,
      child: Form(
        key: _formKey,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            DropdownButtonFormField<String>(
              initialValue: _otherChannelId,
              decoration: const InputDecoration(labelText: 'Canal *'),
              dropdownColor: BakaColors.nebulaSlate,
              items: [for (final c in otherChannels) DropdownMenuItem(value: c.id, child: Text(c.name))],
              onChanged: (v) => setState(() => _otherChannelId = v),
            ),
            const SizedBox(height: BakaSpacing.md),
            DropdownButtonFormField<ChannelRelationType>(
              initialValue: _type,
              decoration: const InputDecoration(labelText: 'Tipo'),
              dropdownColor: BakaColors.nebulaSlate,
              items: const [
                DropdownMenuItem(value: ChannelRelationType.strategic, child: Text('Vínculo estratégico')),
                DropdownMenuItem(value: ChannelRelationType.custom, child: Text('Conexão manual')),
              ],
              onChanged: (v) => setState(() => _type = v!),
            ),
            const SizedBox(height: BakaSpacing.md),
            TextFormField(
              controller: _label,
              decoration: const InputDecoration(labelText: 'Descrição *', hintText: 'Ex: Baka Studio documenta o processo da Stella7'),
              maxLines: 2,
              validator: (v) => (v == null || v.trim().isEmpty) ? 'Obrigatório' : null,
            ),
          ],
        ),
      ),
    );
  }
}
