import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../core/theme/theme.dart';
import '../../data/models/content_item.dart';
import '../../state/app_state.dart';
import '../../widgets/forms/channel_multi_select_field.dart';
import '../../widgets/forms/confirm_archive_dialog.dart';
import '../../widgets/forms/date_picker_field.dart';
import '../../widgets/forms/form_sheet_scaffold.dart';
import '../../widgets/forms/project_dropdown_field.dart';

/// Create/edit form for a production ("produção"). Requires a title and at
/// least one channel — everything else is optional.
class ContentFormSheet extends StatefulWidget {
  const ContentFormSheet({super.key, this.existing});

  final ContentItem? existing;

  @override
  State<ContentFormSheet> createState() => _ContentFormSheetState();
}

class _ContentFormSheetState extends State<ContentFormSheet> {
  final _formKey = GlobalKey<FormState>();
  late final TextEditingController _title;
  late final TextEditingController _description;
  late final TextEditingController _platform;
  late Set<String> _channelIds;
  late ContentFormat _format;
  late ContentPriority _priority;
  String? _projectId;
  DateTime? _dueDate;

  @override
  void initState() {
    super.initState();
    final existing = widget.existing;
    _title = TextEditingController(text: existing?.title ?? '');
    _description = TextEditingController(text: existing?.description ?? '');
    _platform = TextEditingController(text: existing?.platform ?? '');
    _channelIds = {...?existing?.channelIds};
    _format = existing?.format ?? ContentFormat.video;
    _priority = existing?.priority ?? ContentPriority.medium;
    _projectId = existing?.projectId;
    _dueDate = existing?.dueDate;
  }

  @override
  void dispose() {
    _title.dispose();
    _description.dispose();
    _platform.dispose();
    super.dispose();
  }

  Future<void> _save() async {
    if (!_formKey.currentState!.validate()) throw 'Preencha o título';
    if (_channelIds.isEmpty) throw 'Selecione ao menos um canal';
    final state = context.read<AppState>();
    if (widget.existing == null) {
      await state.createContent(
        title: _title.text.trim(),
        description: _description.text.trim(),
        channelIds: _channelIds.toList(),
        format: _format,
        priority: _priority,
        projectId: _projectId,
        dueDate: _dueDate,
        platform: _platform.text.trim().isEmpty ? null : _platform.text.trim(),
      );
    } else {
      await state.updateContent(
        widget.existing!.id,
        title: _title.text.trim(),
        description: _description.text.trim(),
        channelIds: _channelIds.toList(),
        format: _format,
        priority: _priority,
        projectId: _projectId,
        clearProjectId: _projectId == null,
        dueDate: _dueDate,
        platform: _platform.text.trim().isEmpty ? null : _platform.text.trim(),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final state = context.watch<AppState>();
    final isEditing = widget.existing != null;
    return FormSheetScaffold(
      title: isEditing ? 'Editar produção' : 'Nova produção',
      saveLabel: isEditing ? 'Salvar' : 'Criar produção',
      destructiveLabel: isEditing ? 'Arquivar' : null,
      onDestructive: isEditing
          ? () async {
              final state = context.read<AppState>();
              final id = widget.existing!.id;
              final linkedTasks = state.dailyTasks.where((t) => t.contentItemId == id).length;
              final warnings = [
                if (linkedTasks > 0) '$linkedTasks tarefa(s) vinculada(s)',
              ];
              if (!await confirmArchiveWithLinks(context, entityLabel: 'produção', warnings: warnings)) {
                throw FormCancelled();
              }
              await state.archiveContent(id);
            }
          : null,
      onSave: _save,
      child: Form(
        key: _formKey,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            TextFormField(
              controller: _title,
              decoration: const InputDecoration(labelText: 'Título *'),
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
                  child: DropdownButtonFormField<ContentFormat>(
                    initialValue: _format,
                    decoration: const InputDecoration(labelText: 'Formato'),
                    dropdownColor: BakaColors.nebulaSlate,
                    items: [for (final f in ContentFormat.values) DropdownMenuItem(value: f, child: Text(f.label))],
                    onChanged: (v) => setState(() => _format = v!),
                  ),
                ),
                const SizedBox(width: BakaSpacing.md),
                Expanded(
                  child: DropdownButtonFormField<ContentPriority>(
                    initialValue: _priority,
                    decoration: const InputDecoration(labelText: 'Prioridade'),
                    dropdownColor: BakaColors.nebulaSlate,
                    items: [for (final p in ContentPriority.values) DropdownMenuItem(value: p, child: Text(p.label))],
                    onChanged: (v) => setState(() => _priority = v!),
                  ),
                ),
              ],
            ),
            const SizedBox(height: BakaSpacing.md),
            ProjectDropdownField(
              projects: state.projects,
              selectedId: _projectId,
              onChanged: (v) => setState(() => _projectId = v),
            ),
            const SizedBox(height: BakaSpacing.md),
            DatePickerField(label: 'Data prevista', value: _dueDate, onChanged: (v) => setState(() => _dueDate = v)),
            const SizedBox(height: BakaSpacing.md),
            TextFormField(controller: _platform, decoration: const InputDecoration(labelText: 'Plataforma')),
          ],
        ),
      ),
    );
  }
}
