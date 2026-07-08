import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../core/theme/theme.dart';
import '../../data/models/channel.dart';
import '../../state/app_state.dart';
import '../../widgets/forms/color_swatch_picker.dart';
import '../../widgets/forms/confirm_archive_dialog.dart';
import '../../widgets/forms/form_sheet_scaffold.dart';

/// Create/edit form for a channel. Only name + color are required — every
/// other field is optional, per the brief ("não exigir todas as
/// informações").
class ChannelFormSheet extends StatefulWidget {
  const ChannelFormSheet({super.key, this.existing});

  final Channel? existing;

  @override
  State<ChannelFormSheet> createState() => _ChannelFormSheetState();
}

class _ChannelFormSheetState extends State<ChannelFormSheet> {
  final _formKey = GlobalKey<FormState>();
  late final TextEditingController _name;
  late final TextEditingController _niche;
  late final TextEditingController _objective;
  late final TextEditingController _description;
  late Color _color;
  late ChannelStatus _status;

  @override
  void initState() {
    super.initState();
    final existing = widget.existing;
    _name = TextEditingController(text: existing?.name ?? '');
    _niche = TextEditingController(text: existing?.niche ?? '');
    _objective = TextEditingController(text: existing?.objective ?? '');
    _description = TextEditingController(text: existing?.description ?? '');
    _color = existing?.color ?? kChannelColorSwatches.first;
    _status = existing?.status ?? ChannelStatus.planning;
  }

  @override
  void dispose() {
    _name.dispose();
    _niche.dispose();
    _objective.dispose();
    _description.dispose();
    super.dispose();
  }

  Future<void> _save() async {
    if (!_formKey.currentState!.validate()) throw 'Preencha o nome do canal';
    final state = context.read<AppState>();
    if (widget.existing == null) {
      await state.createChannel(
        name: _name.text.trim(),
        color: _color,
        niche: _niche.text.trim(),
        objective: _objective.text.trim(),
        description: _description.text.trim(),
        status: _status,
      );
    } else {
      await state.updateChannel(widget.existing!.copyWith(
        name: _name.text.trim(),
        color: _color,
        niche: _niche.text.trim(),
        objective: _objective.text.trim(),
        description: _description.text.trim(),
        status: _status,
      ));
    }
  }

  @override
  Widget build(BuildContext context) {
    final isEditing = widget.existing != null;
    return FormSheetScaffold(
      title: isEditing ? 'Editar canal' : 'Novo canal',
      saveLabel: isEditing ? 'Salvar' : 'Criar canal',
      destructiveLabel: isEditing ? 'Arquivar' : null,
      onDestructive: isEditing
          ? () async {
              final state = context.read<AppState>();
              final id = widget.existing!.id;
              final warnings = [
                if (state.projectsForChannel(id).isNotEmpty) '${state.projectsForChannel(id).length} projeto(s) vinculado(s)',
                if (state.contentForChannel(id).isNotEmpty) '${state.contentForChannel(id).length} produção(ões) vinculada(s)',
                if (state.pendingSignalsForChannel(id) > 0) '${state.pendingSignalsForChannel(id)} sinal(is) pendente(s)',
              ];
              if (!await confirmArchiveWithLinks(context, entityLabel: 'canal', warnings: warnings)) {
                throw FormCancelled();
              }
              await state.archiveChannel(id);
            }
          : null,
      onSave: _save,
      child: Form(
        key: _formKey,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            TextFormField(
              controller: _name,
              decoration: const InputDecoration(labelText: 'Nome *'),
              validator: (v) => (v == null || v.trim().isEmpty) ? 'Obrigatório' : null,
              autofocus: !isEditing,
            ),
            const SizedBox(height: BakaSpacing.md),
            ColorSwatchPicker(selected: _color, onChanged: (c) => setState(() => _color = c)),
            const SizedBox(height: BakaSpacing.md),
            TextFormField(controller: _niche, decoration: const InputDecoration(labelText: 'Nicho')),
            const SizedBox(height: BakaSpacing.md),
            TextFormField(controller: _objective, decoration: const InputDecoration(labelText: 'Objetivo')),
            const SizedBox(height: BakaSpacing.md),
            TextFormField(controller: _description, decoration: const InputDecoration(labelText: 'Descrição'), maxLines: 3),
            const SizedBox(height: BakaSpacing.md),
            DropdownButtonFormField<ChannelStatus>(
              initialValue: _status,
              decoration: const InputDecoration(labelText: 'Status'),
              dropdownColor: BakaColors.nebulaSlate,
              items: [for (final s in ChannelStatus.values) DropdownMenuItem(value: s, child: Text(s.label))],
              onChanged: (v) => setState(() => _status = v!),
            ),
          ],
        ),
      ),
    );
  }
}
