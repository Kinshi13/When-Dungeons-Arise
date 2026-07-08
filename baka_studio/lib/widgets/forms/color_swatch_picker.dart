import 'package:flutter/material.dart';

import '../../core/theme/theme.dart';

/// Preset palette offered when creating/editing a channel — kept to the
/// tokens already in the design system instead of a full HSV picker, so
/// every channel color stays inside the app's palette.
const List<Color> kChannelColorSwatches = [
  BakaColors.stellarBlue,
  BakaColors.signalCyan,
  BakaColors.nebulaViolet,
  BakaColors.stellaRose,
  BakaColors.emberAmber,
  BakaColors.success,
  BakaColors.warning,
  BakaColors.danger,
];

class ColorSwatchPicker extends StatelessWidget {
  const ColorSwatchPicker({super.key, required this.selected, required this.onChanged, this.label = 'Cor'});

  final Color selected;
  final ValueChanged<Color> onChanged;
  final String label;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(label, style: Theme.of(context).textTheme.labelMedium),
        const SizedBox(height: BakaSpacing.xs),
        Wrap(
          spacing: BakaSpacing.sm,
          runSpacing: BakaSpacing.sm,
          children: [
            for (final color in kChannelColorSwatches)
              InkWell(
                onTap: () => onChanged(color),
                customBorder: const CircleBorder(),
                child: Container(
                  width: 32,
                  height: 32,
                  alignment: Alignment.center,
                  decoration: BoxDecoration(
                    color: color,
                    shape: BoxShape.circle,
                    border: Border.all(
                      color: color.toARGB32() == selected.toARGB32() ? BakaColors.starWhite : Colors.transparent,
                      width: 2,
                    ),
                  ),
                  child: color.toARGB32() == selected.toARGB32()
                      ? const Icon(Icons.check, size: 16, color: BakaColors.midnightVoid)
                      : null,
                ),
              ),
          ],
        ),
      ],
    );
  }
}
