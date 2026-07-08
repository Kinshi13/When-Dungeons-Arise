import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../core/theme/theme.dart';
import '../../data/models/project.dart';
import '../../state/app_state.dart';
import '../../widgets/forms/channel_multi_select_field.dart';
import '../../widgets/forms/confirm_archive_dialog.dart';
import '../../widgets/forms/date_picker_field.dart';
import '../../widgets/forms/form_sheet_scaffold.dart';

/// Create/edit form for a project ("constelação"). Only name is required —
/// channels, dates and priority are optional refinements.
class ProjectFormSheet extends StatefulWidget {
  const ProjectFormSheet({super.key, this.existing});

  final Project? existing;

  @override
  State<ProjectFormSheet> createState() => _ProjectFormSheetState();
}

class _ProjectFormSheetState extends State<ProjectFormSheet> {
  final _formKey = GlobalKey<FormState>();
  late final TextEditingController _name;
  late final TextEditingController _description;
  late Set<String> _channelIds;
  late ProjectStatus _status;
  late ProjectPriority _priority;
  DateTime? _startDate;
  DateTime? _targetDate;

  @override
  void initState() {
    super.initState();
    final existing = widget.existing;
    _name = TextEditingController(text: existing?.name ?? '');
    _description = TextEditingController(text: existing?.description ?? '');
    _channelIds = {...?existing?.channelIds};
    _status = existing?.status ?? ProjectStatus.idea;
    _priority = existing?.priority ?? ProjectPriority.medium;
    _startDate = existing?.startDate;
    _targetDate = existing?.targetDate;
  }

  @override
  void dispose() {
    _name.dispose();
    _description.dispose();
    super.dispose();
  }

  Future<void> _save() async {
    if (!_formKey.currentState!.validate()) throw 'Preencha o nome do projeto';
    final state = context.read<AppState>();
    if (widget.existing == null) {
      await state.createProject(
        name: _name.text.trim(),
        description: _description.text.trim(),
        channelIds: _channelIds.toList(),
        status: _status,
        priority: _priority,
        startDate: _startDate,
        targetDate: _targetDate,
      );
    } else {
      await state.updateProject(
        widget.existing!.id,
        name: _name.text.trim(),
        description: _description.text.trim(),
        channelIds: _channelIds.toList(),
        status: _status,
        priority: _priority,
        startDate: _startDate,
        targetDate: _targetDate,
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final state = context.watch<AppState>();
    final isEditing = widget.existing != null;
    return FormSheetScaffold(
      title: isEditing ? 'Editar constelação' : 'Nova constelação',
      saveLabel: isEditing ? 'Salvar' : 'Criar projeto',
      destructiveLabel: isEditing ? 'Arquivar' : null,
      onDestructive: isEditing
          ? () async {
              final state = context.read<AppState>();
              final id = widget.existing!.id;
              final linkedContent = state.contentItems.where((c) => c.projectId == id).length;
              final linkedTasks = state.dailyTasks.where((t) => t.projectId == id).length;
              final warnings = [
                if (linkedContent > 0) '$linkedContent produção(ões) vinculada(s)',
                if (linkedTasks > 0) '$linkedTasks tarefa(s) vinculada(s)',
              ];
              if (!await confirmArchiveWithLinks(context, entityLabel: 'projeto', warnings: warnings)) {
                throw FormCancelled();
              }
              await state.archiveProject(id);
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
            ChannelMultiSelectField(
              channels: state.channels,
              selectedIds: _channelIds,
              onChanged: (v) => setState(() => _channelIds = v),
            ),
            const SizedBox(height: BakaSpacing.md),
            Row(
              children: [
                Expanded(
                  child: DropdownButtonFormField<ProjectStatus>(
                    initialValue: _status,
                    decoration: const InputDecoration(labelText: 'Status'),
                    dropdownColor: BakaColors.nebulaSlate,
                    items: [for (final s in ProjectStatus.values) DropdownMenuItem(value: s, child: Text(s.label))],
                    onChanged: (v) => setState(() => _status = v!),
                  ),
                ),
                const SizedBox(width: BakaSpacing.md),
                Expanded(
                  child: DropdownButtonFormField<ProjectPriority>(
                    initialValue: _priority,
                    decoration: const InputDecoration(labelText: 'Prioridade'),
                    dropdownColor: BakaColors.nebulaSlate,
                    items: [for (final p in ProjectPriority.values) DropdownMenuItem(value: p, child: Text(p.label))],
                    onChanged: (v) => setState(() => _priority = v!),
                  ),
                ),
              ],
            ),
            const SizedBox(height: BakaSpacing.md),
            Row(
              children: [
                Expanded(
                  child: DatePickerField(label: 'Início', value: _startDate, onChanged: (v) => setState(() => _startDate = v)),
                ),
                const SizedBox(width: BakaSpacing.md),
                Expanded(
                  child: DatePickerField(label: 'Meta', value: _targetDate, onChanged: (v) => setState(() => _targetDate = v)),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}
