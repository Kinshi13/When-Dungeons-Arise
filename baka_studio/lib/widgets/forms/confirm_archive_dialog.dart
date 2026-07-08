import 'package:flutter/material.dart';

import '../../core/theme/theme.dart';

/// Shows a confirmation dialog listing what's still linked to an entity
/// before archiving it — used so archiving a channel/project/production/
/// campaign with real dependents is a deliberate choice, not a silent
/// side effect. Returns `true` only if the user explicitly confirms.
Future<bool> confirmArchiveWithLinks(
  BuildContext context, {
  required String entityLabel,
  required List<String> warnings,
}) async {
  if (warnings.isEmpty) return true;
  final confirmed = await showDialog<bool>(
    context: context,
    builder: (context) => AlertDialog(
      backgroundColor: BakaColors.nebulaSlate,
      title: Text('Arquivar $entityLabel?'),
      content: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text('Este item ainda tem dados vinculados:'),
          const SizedBox(height: BakaSpacing.sm),
          for (final warning in warnings)
            Padding(
              padding: const EdgeInsets.only(bottom: 4),
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text('•  '),
                  Expanded(child: Text(warning)),
                ],
              ),
            ),
          const SizedBox(height: BakaSpacing.sm),
          const Text('Os vínculos continuam existindo, mas o item deixa de aparecer nas listas ativas.'),
        ],
      ),
      actions: [
        TextButton(onPressed: () => Navigator.of(context).pop(false), child: const Text('Cancelar')),
        FilledButton(onPressed: () => Navigator.of(context).pop(true), child: const Text('Arquivar mesmo assim')),
      ],
    ),
  );
  return confirmed ?? false;
}
