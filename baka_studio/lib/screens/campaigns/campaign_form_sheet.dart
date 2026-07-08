import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../core/theme/theme.dart';
import '../../data/models/campaign.dart';
import '../../state/app_state.dart';
import '../../widgets/forms/confirm_archive_dialog.dart';
import '../../widgets/forms/date_picker_field.dart';
import '../../widgets/forms/form_sheet_scaffold.dart';

/// Create/edit form for a campaign ("sistema"). Only name is required — the
/// entities it drives are attached separately via [CampaignItem]s.
class CampaignFormSheet extends StatefulWidget {
  const CampaignFormSheet({super.key, this.existing});

  final Campaign? existing;

  @override
  State<CampaignFormSheet> createState() => _CampaignFormSheetState();
}

class _CampaignFormSheetState extends State<CampaignFormSheet> {
  final _formKey = GlobalKey<FormState>();
  late final TextEditingController _name;
  late final TextEditingController _description;
  late CampaignStatus _status;
  String? _primaryChannelId;
  DateTime? _startDate;
  DateTime? _endDate;

  @override
  void initState() {
    super.initState();
    final existing = widget.existing;
    _name = TextEditingController(text: existing?.name ?? '');
    _description = TextEditingController(text: existing?.description ?? '');
    _status = existing?.status ?? CampaignStatus.planning;
    _primaryChannelId = existing?.primaryChannelId;
    _startDate = existing?.startDate;
    _endDate = existing?.endDate;
  }

  @override
  void dispose() {
    _name.dispose();
    _description.dispose();
    super.dispose();
  }

  Future<void> _save() async {
    if (!_formKey.currentState!.validate()) throw 'Preencha o nome da campanha';
    final state = context.read<AppState>();
    if (widget.existing == null) {
      await state.createCampaign(
        name: _name.text.trim(),
        description: _description.text.trim(),
        status: _status,
        primaryChannelId: _primaryChannelId,
        startDate: _startDate,
        endDate: _endDate,
      );
    } else {
      await state.updateCampaign(
        widget.existing!.id,
        name: _name.text.trim(),
        description: _description.text.trim(),
        status: _status,
        primaryChannelId: _primaryChannelId,
        startDate: _startDate,
        endDate: _endDate,
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final state = context.watch<AppState>();
    final isEditing = widget.existing != null;
    return FormSheetScaffold(
      title: isEditing ? 'Editar campanha' : 'Nova campanha',
      saveLabel: isEditing ? 'Salvar' : 'Criar campanha',
      destructiveLabel: isEditing ? 'Arquivar' : null,
      onDestructive: isEditing
          ? () async {
              final state = context.read<AppState>();
              final id = widget.existing!.id;
              final items = await state.watchCampaignItems(id).first;
              final warnings = [
                if (items.isNotEmpty) '${items.length} item(ns) vinculado(s) ao sistema',
              ];
              if (!context.mounted) throw FormCancelled();
              if (!await confirmArchiveWithLinks(context, entityLabel: 'campanha', warnings: warnings)) {
                throw FormCancelled();
              }
              await state.archiveCampaign(id);
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
            TextFormField(controller: _description, decoration: const InputDecoration(labelText: 'Descrição'), maxLines: 3),
            const SizedBox(height: BakaSpacing.md),
            DropdownButtonFormField<String?>(
              initialValue: _primaryChannelId,
              decoration: const InputDecoration(labelText: 'Canal principal (opcional)'),
              dropdownColor: BakaColors.nebulaSlate,
              items: [
                const DropdownMenuItem(value: null, child: Text('Nenhum')),
                for (final channel in state.channels) DropdownMenuItem(value: channel.id, child: Text(channel.name)),
              ],
              onChanged: (v) => setState(() => _primaryChannelId = v),
            ),
            const SizedBox(height: BakaSpacing.md),
            DropdownButtonFormField<CampaignStatus>(
              initialValue: _status,
              decoration: const InputDecoration(labelText: 'Status'),
              dropdownColor: BakaColors.nebulaSlate,
              items: [for (final s in CampaignStatus.values) DropdownMenuItem(value: s, child: Text(s.label))],
              onChanged: (v) => setState(() => _status = v!),
            ),
            const SizedBox(height: BakaSpacing.md),
            Row(
              children: [
                Expanded(child: DatePickerField(label: 'Início', value: _startDate, onChanged: (v) => setState(() => _startDate = v))),
                const SizedBox(width: BakaSpacing.md),
                Expanded(child: DatePickerField(label: 'Fim', value: _endDate, onChanged: (v) => setState(() => _endDate = v))),
              ],
            ),
          ],
        ),
      ),
    );
  }
}
