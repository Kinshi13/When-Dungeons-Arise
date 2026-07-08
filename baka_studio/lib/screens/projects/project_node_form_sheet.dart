import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../core/theme/theme.dart';
import '../../data/models/project.dart';
import '../../state/app_state.dart';
import '../../widgets/forms/form_sheet_scaffold.dart';

/// Adds a milestone node to a project's constellation map. Nodes here are
/// free-standing (not linked to a real production) — linking a node to a
/// [ContentItem] happens automatically when a production picks this
/// project, not through this form.
class ProjectNodeFormSheet extends StatefulWidget {
  const ProjectNodeFormSheet({super.key, required this.project});

  final Project project;

  @override
  State<ProjectNodeFormSheet> createState() => _ProjectNodeFormSheetState();
}

class _ProjectNodeFormSheetState extends State<ProjectNodeFormSheet> {
  final _formKey = GlobalKey<FormState>();
  final _title = TextEditingController();
  ProjectItemState _state = ProjectItemState.planned;
  Set<String> _dependsOn = {};

  @override
  void dispose() {
    _title.dispose();
    super.dispose();
  }

  Future<void> _save() async {
    if (!_formKey.currentState!.validate()) throw 'Preencha o título do item';
    await context.read<AppState>().addProjectNode(
      projectId: widget.project.id,
      title: _title.text.trim(),
      state: _state,
      dependsOn: _dependsOn.toList(),
    );
  }

  @override
  Widget build(BuildContext context) {
    return FormSheetScaffold(
      title: 'Novo item da constelação',
      saveLabel: 'Adicionar',
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
              autofocus: true,
            ),
            const SizedBox(height: BakaSpacing.md),
            DropdownButtonFormField<ProjectItemState>(
              initialValue: _state,
              decoration: const InputDecoration(labelText: 'Estado'),
              dropdownColor: BakaColors.nebulaSlate,
              items: [
                for (final s in ProjectItemState.values) DropdownMenuItem(value: s, child: Text(_stateLabel(s))),
              ],
              onChanged: (v) => setState(() => _state = v!),
            ),
            if (widget.project.items.isNotEmpty) ...[
              const SizedBox(height: BakaSpacing.md),
              Text('Depende de', style: Theme.of(context).textTheme.labelMedium),
              const SizedBox(height: BakaSpacing.xs),
              Wrap(
                spacing: BakaSpacing.xs,
                runSpacing: BakaSpacing.xs,
                children: [
                  for (final item in widget.project.items)
                    FilterChip(
                      label: Text(item.title),
                      selected: _dependsOn.contains(item.id),
                      onSelected: (checked) {
                        final next = Set<String>.from(_dependsOn);
                        if (checked) {
                          next.add(item.id);
                        } else {
                          next.remove(item.id);
                        }
                        setState(() => _dependsOn = next);
                      },
                    ),
                ],
              ),
            ],
          ],
        ),
      ),
    );
  }
}

String _stateLabel(ProjectItemState state) => switch (state) {
  ProjectItemState.done => 'Concluído',
  ProjectItemState.inProgress => 'Em andamento',
  ProjectItemState.planned => 'Planejado',
  ProjectItemState.blocked => 'Bloqueado',
  ProjectItemState.future => 'Futuro',
};
