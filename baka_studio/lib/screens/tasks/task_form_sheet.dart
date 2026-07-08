import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../core/theme/theme.dart';
import '../../data/models/task.dart';
import '../../state/app_state.dart';
import '../../widgets/forms/date_picker_field.dart';
import '../../widgets/forms/form_sheet_scaffold.dart';

/// Create/edit form for a lightweight follow-up task. Optionally linked to
/// a channel/project/production/campaign, but never requires one.
class TaskFormSheet extends StatefulWidget {
  const TaskFormSheet({
    super.key,
    this.existing,
    this.channelId,
    this.projectId,
    this.contentItemId,
    this.campaignId,
  });

  final DailyTask? existing;
  final String? channelId;
  final String? projectId;
  final String? contentItemId;
  final String? campaignId;

  @override
  State<TaskFormSheet> createState() => _TaskFormSheetState();
}

class _TaskFormSheetState extends State<TaskFormSheet> {
  final _formKey = GlobalKey<FormState>();
  late final TextEditingController _title;
  late final TextEditingController _description;
  late TaskPriority _priority;
  DateTime? _dueDate;

  @override
  void initState() {
    super.initState();
    final existing = widget.existing;
    _title = TextEditingController(text: existing?.title ?? '');
    _description = TextEditingController(text: existing?.description ?? '');
    _priority = existing?.priority ?? TaskPriority.medium;
    _dueDate = existing?.dueDate;
  }

  @override
  void dispose() {
    _title.dispose();
    _description.dispose();
    super.dispose();
  }

  Future<void> _save() async {
    if (!_formKey.currentState!.validate()) throw 'Preencha o título da tarefa';
    final state = context.read<AppState>();
    if (widget.existing == null) {
      await state.createTask(
        title: _title.text.trim(),
        description: _description.text.trim(),
        priority: _priority,
        dueDate: _dueDate,
        channelId: widget.channelId,
        projectId: widget.projectId,
        contentItemId: widget.contentItemId,
        campaignId: widget.campaignId,
      );
    } else {
      await state.updateTask(
        widget.existing!.id,
        title: _title.text.trim(),
        description: _description.text.trim(),
        priority: _priority,
        dueDate: _dueDate,
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final isEditing = widget.existing != null;
    return FormSheetScaffold(
      title: isEditing ? 'Editar tarefa' : 'Nova tarefa',
      saveLabel: isEditing ? 'Salvar' : 'Criar tarefa',
      destructiveLabel: isEditing ? 'Excluir' : null,
      onDestructive: isEditing
          ? () async {
              await context.read<AppState>().deleteTask(widget.existing!.id);
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
            TextFormField(controller: _description, decoration: const InputDecoration(labelText: 'Descrição'), maxLines: 2),
            const SizedBox(height: BakaSpacing.md),
            DropdownButtonFormField<TaskPriority>(
              initialValue: _priority,
              decoration: const InputDecoration(labelText: 'Prioridade'),
              dropdownColor: BakaColors.nebulaSlate,
              items: [for (final p in TaskPriority.values) DropdownMenuItem(value: p, child: Text(p.label))],
              onChanged: (v) => setState(() => _priority = v!),
            ),
            const SizedBox(height: BakaSpacing.md),
            DatePickerField(label: 'Prazo', value: _dueDate, onChanged: (v) => setState(() => _dueDate = v)),
          ],
        ),
      ),
    );
  }
}
