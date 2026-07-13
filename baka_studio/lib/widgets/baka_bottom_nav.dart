import 'package:flutter/material.dart';

import '../core/navigation.dart';
import '../core/theme/theme.dart';

/// Mobile bottom navigation: Início, Produções — [notch] — Mais, Órbita,
/// Sinais. The notch makes room for the docked [QuickCaptureStar] FAB;
/// "Mais" sits closest to it on purpose (see [build]).
class BakaBottomNav extends StatelessWidget {
  const BakaBottomNav({
    super.key,
    required this.selected,
    required this.onSelect,
    required this.onMore,
    required this.pendingSignals,
  });

  final AppSection selected;
  final ValueChanged<AppSection> onSelect;
  final VoidCallback onMore;
  final int pendingSignals;

  @override
  Widget build(BuildContext context) {
    final items = mobilePrimarySections;
    final midpoint = items.length ~/ 2;
    // Split evenly around the docked FAB instead of just appending "Mais"
    // at the end — with an odd total (4 primary + Mais), tacking it onto
    // the tail left 2 items on one side of the notch and 3 on the other,
    // so the fixed-width gap below never lined up with the FAB's actual
    // (screen-centered) notch. Two equally-flexed groups guarantee the gap
    // sits exactly at the midpoint regardless of how many items are in
    // each side.
    final leftItems = items.sublist(0, midpoint);
    final rightItems = items.sublist(midpoint);

    Widget navItem(AppSection section) => Expanded(
      child: _NavItem(
        section: section,
        selected: section == selected,
        onTap: () => onSelect(section),
        badge: section == AppSection.signals && pendingSignals > 0 ? pendingSignals : null,
      ),
    );

    return BottomAppBar(
      color: BakaColors.deepOrbit,
      shape: const CircularNotchedRectangle(),
      notchMargin: 8,
      padding: EdgeInsets.zero,
      child: SizedBox(
        height: 64,
        child: Row(
          children: [
            Expanded(child: Row(children: [for (final section in leftItems) navItem(section)])),
            const SizedBox(width: 56),
            Expanded(
              child: Row(
                children: [
                  // "Mais" sits right next to the FAB, closest to the
                  // notch — the remaining primary sections trail after it.
                  Expanded(
                    child: _NavItem(icon: Icons.grid_view_rounded, label: 'Mais', selected: false, onTap: onMore),
                  ),
                  for (final section in rightItems) navItem(section),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _NavItem extends StatelessWidget {
  const _NavItem({
    this.section,
    this.icon,
    this.label,
    required this.selected,
    required this.onTap,
    this.badge,
  });

  final AppSection? section;
  final IconData? icon;
  final String? label;
  final bool selected;
  final VoidCallback onTap;
  final int? badge;

  @override
  Widget build(BuildContext context) {
    final info = section != null ? appSections[section]! : null;
    final color = selected ? BakaColors.stellarBlue : BakaColors.textSecondary;
    final displayIcon = selected ? (info?.selectedIcon ?? icon!) : (info?.icon ?? icon!);
    final displayLabel = info?.navLabel ?? label!;

    return InkResponse(
      onTap: onTap,
      containedInkWell: true,
      highlightShape: BoxShape.rectangle,
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Stack(
            clipBehavior: Clip.none,
            children: [
              Icon(displayIcon, color: color, size: 22),
              if (badge != null)
                Positioned(
                  right: -6,
                  top: -4,
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 1),
                    decoration: BoxDecoration(
                      color: BakaColors.signalCyan,
                      borderRadius: BorderRadius.circular(BakaRadii.pill),
                    ),
                    child: Text(
                      '$badge',
                      style: const TextStyle(fontSize: 9, fontWeight: FontWeight.w700, color: BakaColors.midnightVoid),
                    ),
                  ),
                ),
            ],
          ),
          const SizedBox(height: 2),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 2),
            child: Text(
              displayLabel,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              textAlign: TextAlign.center,
              style: TextStyle(fontSize: 10, color: color, fontWeight: FontWeight.w600),
            ),
          ),
        ],
      ),
    );
  }
}
