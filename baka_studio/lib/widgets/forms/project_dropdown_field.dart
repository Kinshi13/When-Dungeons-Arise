import 'package:flutter/material.dart';

import '../../core/theme/theme.dart';
import '../../data/models/project.dart';

/// Optional single-project selector — used by the production form to link
/// a piece of content to a constellation.
class ProjectDropdownField extends StatelessWidget {
  const ProjectDropdownField({
    super.key,
    required this.projects,
    required this.selectedId,
    required this.onChanged,
    this.label = 'Projeto (opcional)',
  });

  final List<Project> projects;
  final String? selectedId;
  final ValueChanged<String?> onChanged;
  final String label;

  @override
  Widget build(BuildContext context) {
    return DropdownButtonFormField<String?>(
      initialValue: selectedId,
      decoration: InputDecoration(labelText: label),
      dropdownColor: BakaColors.nebulaSlate,
      items: [
        const DropdownMenuItem(value: null, child: Text('Nenhum')),
        for (final project in projects) DropdownMenuItem(value: project.id, child: Text(project.name)),
      ],
      onChanged: onChanged,
    );
  }
}
