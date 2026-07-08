import 'package:flutter/material.dart';

import '../../core/theme/theme.dart';

/// Thrown by an `onDestructive` callback to signal that the user backed out
/// of a confirmation step (e.g. declined an "this has linked data" warning)
/// — the sheet stays open with no error shown, instead of archiving anyway
/// or surfacing a scary error message for a normal cancel.
class FormCancelled implements Exception {}

/// Shared shell for every create/edit form in the app — a bottom sheet with
/// a title, the form fields, an optional destructive action (archive/
/// delete), and a save button that shows a spinner and surfaces errors
/// instead of failing silently. Every CRUD form (canal, projeto, produção,
/// tarefa, sinal, campanha) is built on top of this so they all look and
/// behave the same way.
class FormSheetScaffold extends StatefulWidget {
  const FormSheetScaffold({
    super.key,
    required this.title,
    required this.child,
    required this.onSave,
    this.saveLabel = 'Salvar',
    this.destructiveLabel,
    this.onDestructive,
  });

  final String title;
  final Widget child;
  final Future<void> Function() onSave;
  final String saveLabel;
  final String? destructiveLabel;
  final Future<void> Function()? onDestructive;

  @override
  State<FormSheetScaffold> createState() => _FormSheetScaffoldState();
}

class _FormSheetScaffoldState extends State<FormSheetScaffold> {
  bool _saving = false;
  String? _error;

  Future<void> _handleSave() async {
    setState(() {
      _saving = true;
      _error = null;
    });
    try {
      await widget.onSave();
      if (mounted) Navigator.of(context).pop(true);
    } catch (e) {
      if (mounted) setState(() => _error = 'Não foi possível salvar: $e');
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }

  Future<void> _handleDestructive() async {
    if (widget.onDestructive == null) return;
    setState(() {
      _saving = true;
      _error = null;
    });
    try {
      await widget.onDestructive!();
      if (mounted) Navigator.of(context).pop(true);
    } on FormCancelled {
      // User backed out of a confirmation — leave the sheet open, no error.
    } catch (e) {
      if (mounted) setState(() => _error = 'Não foi possível concluir: $e');
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: EdgeInsets.only(bottom: MediaQuery.viewInsetsOf(context).bottom),
      child: Container(
        constraints: BoxConstraints(maxHeight: MediaQuery.sizeOf(context).height * 0.88),
        decoration: const BoxDecoration(
          color: BakaColors.nebulaSlate,
          borderRadius: BorderRadius.vertical(top: Radius.circular(BakaRadii.xl)),
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const SizedBox(height: BakaSpacing.sm),
            Container(
              width: 36,
              height: 4,
              decoration: BoxDecoration(color: BakaColors.textTertiary, borderRadius: BorderRadius.circular(BakaRadii.pill)),
            ),
            Padding(
              padding: const EdgeInsets.fromLTRB(BakaSpacing.lg, BakaSpacing.md, BakaSpacing.lg, 0),
              child: Row(
                children: [
                  Expanded(child: Text(widget.title, style: Theme.of(context).textTheme.headlineSmall)),
                  IconButton(
                    icon: const Icon(Icons.close),
                    onPressed: _saving ? null : () => Navigator.of(context).pop(false),
                  ),
                ],
              ),
            ),
            Flexible(
              child: SingleChildScrollView(
                padding: const EdgeInsets.fromLTRB(BakaSpacing.lg, BakaSpacing.sm, BakaSpacing.lg, BakaSpacing.sm),
                child: widget.child,
              ),
            ),
            if (_error != null)
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: BakaSpacing.lg),
                child: Text(_error!, style: const TextStyle(color: BakaColors.danger)),
              ),
            Padding(
              padding: const EdgeInsets.fromLTRB(BakaSpacing.lg, BakaSpacing.sm, BakaSpacing.lg, BakaSpacing.lg),
              child: Row(
                children: [
                  if (widget.destructiveLabel != null)
                    TextButton(
                      onPressed: _saving ? null : _handleDestructive,
                      style: TextButton.styleFrom(foregroundColor: BakaColors.danger),
                      child: Text(widget.destructiveLabel!),
                    ),
                  const Spacer(),
                  TextButton(
                    onPressed: _saving ? null : () => Navigator.of(context).pop(false),
                    child: const Text('Cancelar'),
                  ),
                  const SizedBox(width: BakaSpacing.sm),
                  FilledButton(
                    onPressed: _saving ? null : _handleSave,
                    child: _saving
                        ? const SizedBox(width: 16, height: 16, child: CircularProgressIndicator(strokeWidth: 2))
                        : Text(widget.saveLabel),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

/// Opens [FormSheetScaffold] as a full-width modal bottom sheet — the same
/// presentation on every breakpoint per the brief ("bottom sheet quando
/// apropriado"), which keeps forms usable on mobile without a separate
/// desktop-only dialog variant to maintain.
Future<bool?> showBakaFormSheet(BuildContext context, {required Widget Function(BuildContext) builder}) {
  return showModalBottomSheet<bool>(
    context: context,
    isScrollControlled: true,
    backgroundColor: Colors.transparent,
    builder: builder,
  );
}
