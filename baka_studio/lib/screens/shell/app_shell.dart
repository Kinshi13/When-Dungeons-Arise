import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../core/navigation.dart';
import '../../core/theme/theme.dart';
import '../../state/app_state.dart';
import '../../widgets/widgets.dart';
import '../campaigns/campaigns_screen.dart';
import '../capture/quick_capture_sheet.dart';
import '../channels/channels_screen.dart';
import '../content/content_screen.dart';
import '../observatory/observatory_screen.dart';
import '../orbit/orbit_screen.dart';
import '../projects/projects_screen.dart';
import '../settings/settings_screen.dart';
import '../signals/signals_screen.dart';

/// Breakpoints. Mobile gets its own bottom nav (never a shrunk sidebar);
/// tablet gets a navigation rail; desktop gets the full collapsible sidebar.
abstract final class BakaBreakpoints {
  static const double tablet = 600;
  static const double desktop = 1000;
}

class AppShell extends StatefulWidget {
  const AppShell({super.key});

  @override
  State<AppShell> createState() => _AppShellState();
}

class _AppShellState extends State<AppShell> {
  AppSection _selected = AppSection.observatory;
  bool _sidebarCollapsed = false;

  Widget _buildScreen(AppSection section) {
    return switch (section) {
      AppSection.observatory => const ObservatoryScreen(),
      AppSection.channels => const ChannelsScreen(),
      AppSection.projects => const ProjectsScreen(),
      AppSection.content => const ContentScreen(),
      AppSection.orbit => const OrbitScreen(),
      AppSection.signals => const SignalsScreen(),
      AppSection.campaigns => const CampaignsScreen(),
      AppSection.settings => const SettingsScreen(),
    };
  }

  void _select(AppSection section) => setState(() => _selected = section);

  void _openQuickCapture() {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (_) => const QuickCaptureSheet(),
    );
  }

  void _openMoreSheet() {
    showModalBottomSheet(
      context: context,
      backgroundColor: BakaColors.nebulaSlate,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(BakaRadii.xl)),
      ),
      builder: (context) => SafeArea(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const SizedBox(height: BakaSpacing.sm),
            Container(width: 36, height: 4, decoration: BoxDecoration(
              color: BakaColors.textTertiary, borderRadius: BorderRadius.circular(BakaRadii.pill),
            )),
            const SizedBox(height: BakaSpacing.md),
            for (final section in mobileMoreSections)
              ListTile(
                leading: Icon(appSections[section]!.icon, color: BakaColors.starWhite),
                title: Text(appSections[section]!.title),
                subtitle: Text(appSections[section]!.subtitle),
                onTap: () {
                  Navigator.of(context).pop();
                  _select(section);
                },
              ),
            const SizedBox(height: BakaSpacing.sm),
          ],
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final width = MediaQuery.sizeOf(context).width;
    final pendingSignals = context.watch<AppState>().pendingSignalsCount;

    if (width >= BakaBreakpoints.desktop) {
      return _DesktopShell(
        selected: _selected,
        onSelect: _select,
        collapsed: _sidebarCollapsed,
        onToggleCollapsed: () => setState(() => _sidebarCollapsed = !_sidebarCollapsed),
        pendingSignals: pendingSignals,
        onQuickCapture: _openQuickCapture,
        body: _buildScreen(_selected),
      );
    }

    if (width >= BakaBreakpoints.tablet) {
      return _TabletShell(
        selected: _selected,
        onSelect: _select,
        pendingSignals: pendingSignals,
        onQuickCapture: _openQuickCapture,
        body: _buildScreen(_selected),
      );
    }

    return _MobileShell(
      selected: _selected,
      onSelect: _select,
      onMore: _openMoreSheet,
      pendingSignals: pendingSignals,
      onQuickCapture: _openQuickCapture,
      body: _buildScreen(_selected),
    );
  }
}

class _Topbar extends StatelessWidget {
  const _Topbar({required this.pendingSignals, required this.onQuickCapture});

  final int pendingSignals;
  final VoidCallback onQuickCapture;

  @override
  Widget build(BuildContext context) {
    return Container(
      height: 64,
      padding: const EdgeInsets.symmetric(horizontal: BakaSpacing.lg),
      decoration: const BoxDecoration(
        color: BakaColors.midnightVoid,
        border: Border(bottom: BorderSide(color: BakaColors.divider)),
      ),
      child: Row(
        children: [
          Expanded(
            child: ConstrainedBox(
              constraints: const BoxConstraints(maxWidth: 360),
              child: TextField(
                decoration: InputDecoration(
                  isDense: true,
                  hintText: 'Buscar canais, projetos, produções…',
                  prefixIcon: const Icon(Icons.search, size: 20),
                  border: OutlineInputBorder(borderRadius: BorderRadius.circular(BakaRadii.pill)),
                  enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(BakaRadii.pill), borderSide: const BorderSide(color: BakaColors.borderSubtle)),
                  focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(BakaRadii.pill), borderSide: const BorderSide(color: BakaColors.stellarBlue)),
                ),
              ),
            ),
          ),
          const SizedBox(width: BakaSpacing.md),
          IconButton(
            tooltip: 'Captura rápida',
            onPressed: onQuickCapture,
            icon: const Icon(Icons.add_circle_outline),
          ),
          Stack(
            clipBehavior: Clip.none,
            children: [
              IconButton(
                tooltip: 'Sinais',
                onPressed: () {},
                icon: const Icon(Icons.graphic_eq),
              ),
              if (pendingSignals > 0)
                Positioned(
                  right: 6,
                  top: 6,
                  child: Container(
                    width: 8,
                    height: 8,
                    decoration: const BoxDecoration(color: BakaColors.signalCyan, shape: BoxShape.circle),
                  ),
                ),
            ],
          ),
          const SizedBox(width: BakaSpacing.xs),
          const CircleAvatar(
            radius: 16,
            backgroundColor: BakaColors.nebulaSlate,
            child: Icon(Icons.person_outline, size: 18, color: BakaColors.textSecondary),
          ),
        ],
      ),
    );
  }
}

class _DesktopShell extends StatelessWidget {
  const _DesktopShell({
    required this.selected,
    required this.onSelect,
    required this.collapsed,
    required this.onToggleCollapsed,
    required this.pendingSignals,
    required this.onQuickCapture,
    required this.body,
  });

  final AppSection selected;
  final ValueChanged<AppSection> onSelect;
  final bool collapsed;
  final VoidCallback onToggleCollapsed;
  final int pendingSignals;
  final VoidCallback onQuickCapture;
  final Widget body;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Row(
        children: [
          BakaSidebar(
            selected: selected,
            onSelect: onSelect,
            collapsed: collapsed,
            onToggleCollapsed: onToggleCollapsed,
            pendingSignals: pendingSignals,
          ),
          Expanded(
            child: Column(
              children: [
                _Topbar(pendingSignals: pendingSignals, onQuickCapture: onQuickCapture),
                Expanded(child: body),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _TabletShell extends StatelessWidget {
  const _TabletShell({
    required this.selected,
    required this.onSelect,
    required this.pendingSignals,
    required this.onQuickCapture,
    required this.body,
  });

  final AppSection selected;
  final ValueChanged<AppSection> onSelect;
  final int pendingSignals;
  final VoidCallback onQuickCapture;
  final Widget body;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Row(
        children: [
          NavigationRail(
            selectedIndex: desktopSections.indexOf(selected),
            onDestinationSelected: (i) => onSelect(desktopSections[i]),
            labelType: NavigationRailLabelType.selected,
            leading: const Padding(
              padding: EdgeInsets.symmetric(vertical: BakaSpacing.md),
              child: Icon(Icons.auto_awesome, color: BakaColors.stellarBlue),
            ),
            destinations: [
              for (final section in desktopSections)
                NavigationRailDestination(
                  icon: Badge(
                    isLabelVisible: section == AppSection.signals && pendingSignals > 0,
                    label: Text('$pendingSignals'),
                    child: Icon(appSections[section]!.icon),
                  ),
                  selectedIcon: Icon(appSections[section]!.selectedIcon),
                  label: Text(appSections[section]!.title),
                ),
            ],
          ),
          const VerticalDivider(width: 1),
          Expanded(child: body),
        ],
      ),
      floatingActionButton: QuickCaptureStar(onPressed: onQuickCapture),
    );
  }
}

class _MobileShell extends StatelessWidget {
  const _MobileShell({
    required this.selected,
    required this.onSelect,
    required this.onMore,
    required this.pendingSignals,
    required this.onQuickCapture,
    required this.body,
  });

  final AppSection selected;
  final ValueChanged<AppSection> onSelect;
  final VoidCallback onMore;
  final int pendingSignals;
  final VoidCallback onQuickCapture;
  final Widget body;

  @override
  Widget build(BuildContext context) {
    final info = appSections[selected]!;
    return Scaffold(
      appBar: AppBar(
        title: Text(info.title),
        actions: [
          IconButton(onPressed: () {}, icon: const Icon(Icons.search)),
        ],
      ),
      body: body,
      floatingActionButtonLocation: FloatingActionButtonLocation.centerDocked,
      floatingActionButton: QuickCaptureStar(onPressed: onQuickCapture),
      bottomNavigationBar: BakaBottomNav(
        selected: selected,
        onSelect: onSelect,
        onMore: onMore,
        pendingSignals: pendingSignals,
      ),
    );
  }
}
