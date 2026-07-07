import 'package:flutter/material.dart';

import '../core/navigation.dart';
import '../core/theme/theme.dart';

/// Collapsible desktop sidebar. Selection is marked with a left accent bar
/// plus a color/weight change — no game-menu styling, no heavy glow.
class BakaSidebar extends StatelessWidget {
  const BakaSidebar({
    super.key,
    required this.selected,
    required this.onSelect,
    required this.collapsed,
    required this.onToggleCollapsed,
    required this.pendingSignals,
  });

  final AppSection selected;
  final ValueChanged<AppSection> onSelect;
  final bool collapsed;
  final VoidCallback onToggleCollapsed;
  final int pendingSignals;

  @override
  Widget build(BuildContext context) {
    final width = collapsed ? 76.0 : 248.0;

    return AnimatedContainer(
      duration: BakaMotion.base,
      curve: BakaMotion.standard,
      width: width,
      decoration: const BoxDecoration(
        color: BakaColors.deepOrbit,
        border: Border(right: BorderSide(color: BakaColors.divider)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          _Header(collapsed: collapsed),
          const Divider(height: 1),
          Expanded(
            child: ListView(
              padding: const EdgeInsets.symmetric(vertical: BakaSpacing.sm, horizontal: BakaSpacing.xs),
              children: [
                for (final section in desktopSections)
                  _NavTile(
                    section: section,
                    selected: section == selected,
                    collapsed: collapsed,
                    badge: section == AppSection.signals && pendingSignals > 0 ? pendingSignals : null,
                    onTap: () => onSelect(section),
                  ),
              ],
            ),
          ),
          const Divider(height: 1),
          Padding(
            padding: const EdgeInsets.all(BakaSpacing.xs),
            child: IconButton(
              tooltip: collapsed ? 'Expandir menu' : 'Recolher menu',
              icon: Icon(collapsed ? Icons.chevron_right : Icons.chevron_left),
              color: BakaColors.textSecondary,
              onPressed: onToggleCollapsed,
            ),
          ),
        ],
      ),
    );
  }
}

class _Header extends StatelessWidget {
  const _Header({required this.collapsed});

  final bool collapsed;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: BakaSpacing.md, vertical: BakaSpacing.lg),
      child: Row(
        children: [
          Container(
            width: 32,
            height: 32,
            alignment: Alignment.center,
            decoration: BoxDecoration(
              color: BakaColors.nebulaSlate,
              borderRadius: BorderRadius.circular(BakaRadii.sm),
            ),
            child: const Icon(Icons.auto_awesome, size: 18, color: BakaColors.stellarBlue),
          ),
          if (!collapsed) ...[
            const SizedBox(width: BakaSpacing.sm),
            Expanded(
              child: Text(
                'Baka Studio',
                style: BakaTypography.wordmark.copyWith(fontSize: 16),
                overflow: TextOverflow.ellipsis,
              ),
            ),
          ],
        ],
      ),
    );
  }
}

class _NavTile extends StatelessWidget {
  const _NavTile({
    required this.section,
    required this.selected,
    required this.collapsed,
    required this.onTap,
    this.badge,
  });

  final AppSection section;
  final bool selected;
  final bool collapsed;
  final VoidCallback onTap;
  final int? badge;

  @override
  Widget build(BuildContext context) {
    final info = appSections[section]!;
    final color = selected ? BakaColors.stellarBlue : BakaColors.textSecondary;

    final tile = Padding(
      padding: const EdgeInsets.symmetric(vertical: 2),
      child: Material(
        color: selected ? BakaColors.stellarBlue.withValues(alpha: 0.10) : Colors.transparent,
        borderRadius: BorderRadius.circular(BakaRadii.md),
        child: InkWell(
          onTap: onTap,
          borderRadius: BorderRadius.circular(BakaRadii.md),
          child: Container(
            height: 44,
            padding: EdgeInsets.symmetric(horizontal: collapsed ? 0 : BakaSpacing.sm),
            alignment: collapsed ? Alignment.center : Alignment.centerLeft,
            child: Row(
              mainAxisSize: collapsed ? MainAxisSize.min : MainAxisSize.max,
              children: [
                if (selected)
                  Container(
                    width: 3,
                    height: 18,
                    margin: const EdgeInsets.only(right: BakaSpacing.xs),
                    decoration: BoxDecoration(
                      color: BakaColors.stellarBlue,
                      borderRadius: BorderRadius.circular(BakaRadii.pill),
                    ),
                  ),
                Icon(selected ? info.selectedIcon : info.icon, color: color, size: 20),
                if (!collapsed) ...[
                  const SizedBox(width: BakaSpacing.sm),
                  Expanded(
                    child: Text(
                      info.title,
                      style: Theme.of(context).textTheme.titleSmall?.copyWith(color: color),
                      overflow: TextOverflow.ellipsis,
                    ),
                  ),
                  if (badge != null) _Badge(count: badge!),
                ],
              ],
            ),
          ),
        ),
      ),
    );

    if (!collapsed) return tile;
    return Tooltip(message: info.title, child: tile);
  }
}

class _Badge extends StatelessWidget {
  const _Badge({required this.count});

  final int count;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
      decoration: BoxDecoration(
        color: BakaColors.signalCyan.withValues(alpha: 0.16),
        borderRadius: BorderRadius.circular(BakaRadii.pill),
      ),
      child: Text(
        '$count',
        style: const TextStyle(color: BakaColors.signalCyan, fontSize: 11, fontWeight: FontWeight.w700),
      ),
    );
  }
}
