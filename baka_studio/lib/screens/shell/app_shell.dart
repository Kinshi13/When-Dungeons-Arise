import 'package:flutter/foundation.dart' show defaultTargetPlatform, TargetPlatform;
import 'package:flutter/material.dart';
import 'package:flutter/services.dart' show LogicalKeyboardKey;
import 'package:provider/provider.dart';

import '../../core/navigation.dart';
import '../../core/theme/theme.dart';
import '../../data/models/content_item.dart';
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
      AppSection.observatory => ObservatoryScreen(onNavigate: _select),
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
    final appState = context.watch<AppState>();
    final pendingSignals = appState.pendingSignalsCount;
    final showStarfield = appState.showStarfield;

    if (width >= BakaBreakpoints.desktop) {
      return _DesktopShell(
        selected: _selected,
        onSelect: _select,
        collapsed: _sidebarCollapsed,
        onToggleCollapsed: () => setState(() => _sidebarCollapsed = !_sidebarCollapsed),
        pendingSignals: pendingSignals,
        onQuickCapture: _openQuickCapture,
        showStarfield: showStarfield,
        body: _buildScreen(_selected),
      );
    }

    if (width >= BakaBreakpoints.tablet) {
      return _TabletShell(
        selected: _selected,
        onSelect: _select,
        pendingSignals: pendingSignals,
        onQuickCapture: _openQuickCapture,
        showStarfield: showStarfield,
        body: _buildScreen(_selected),
      );
    }

    return _MobileShell(
      selected: _selected,
      onSelect: _select,
      onMore: _openMoreSheet,
      pendingSignals: pendingSignals,
      onQuickCapture: _openQuickCapture,
      showStarfield: showStarfield,
      body: _buildScreen(_selected),
    );
  }
}

/// A single result surfaced by the topbar search. Kept intentionally small:
/// this phase only wires up navigation to real matches, not a full command
/// palette (creating tasks, etc.) — no pretend functionality.
class _SearchResult {
  const _SearchResult({required this.label, required this.sublabel, required this.section, this.channelId});

  final String label;
  final String sublabel;
  final AppSection section;
  final String? channelId;
}

List<_SearchResult> _searchResults(AppState state, String query) {
  if (query.trim().isEmpty) return const [];
  final q = query.toLowerCase();
  final results = <_SearchResult>[
    for (final channel in state.channels)
      if (channel.name.toLowerCase().contains(q))
        _SearchResult(label: channel.name, sublabel: 'Canal · ${channel.niche}', section: AppSection.channels, channelId: channel.id),
    for (final project in state.projects)
      if (project.name.toLowerCase().contains(q))
        _SearchResult(label: project.name, sublabel: 'Constelação', section: AppSection.projects),
    for (final content in state.contentItems)
      if (content.title.toLowerCase().contains(q))
        _SearchResult(label: content.title, sublabel: 'Produção · ${content.stage.label}', section: AppSection.content),
  ];
  return results.take(8).toList();
}

class _Topbar extends StatelessWidget {
  const _Topbar({
    required this.pendingSignals,
    required this.onQuickCapture,
    required this.onNavigate,
    required this.searchFocusNode,
    required this.searchController,
  });

  final int pendingSignals;
  final VoidCallback onQuickCapture;
  final ValueChanged<AppSection> onNavigate;
  final FocusNode searchFocusNode;
  final TextEditingController searchController;

  @override
  Widget build(BuildContext context) {
    final state = context.watch<AppState>();
    final isApple = defaultTargetPlatform == TargetPlatform.macOS || defaultTargetPlatform == TargetPlatform.iOS;

    return Container(
      height: 64,
      padding: const EdgeInsets.symmetric(horizontal: BakaSpacing.lg),
      decoration: const BoxDecoration(
        color: BakaColors.midnightVoid,
        border: Border(bottom: BorderSide(color: BakaColors.divider)),
      ),
      child: Row(
        children: [
          ConstrainedBox(
            constraints: const BoxConstraints(maxWidth: 260),
            child: Autocomplete<_SearchResult>(
              focusNode: searchFocusNode,
              textEditingController: searchController,
              displayStringForOption: (r) => r.label,
              optionsBuilder: (value) => _searchResults(state, value.text),
              onSelected: (result) {
                if (result.channelId != null) state.selectChannel(result.channelId);
                onNavigate(result.section);
              },
              fieldViewBuilder: (context, controller, focusNode, onSubmitted) {
                return TextField(
                  controller: controller,
                  focusNode: focusNode,
                  decoration: InputDecoration(
                    isDense: true,
                    hintText: 'Buscar em tudo…',
                    prefixIcon: const Icon(Icons.search, size: 20),
                    suffixIcon: Padding(
                      padding: const EdgeInsets.only(right: BakaSpacing.sm),
                      child: Center(
                        widthFactor: 1,
                        child: _ShortcutHint(label: isApple ? '⌘K' : 'Ctrl+K'),
                      ),
                    ),
                    border: OutlineInputBorder(borderRadius: BorderRadius.circular(BakaRadii.pill)),
                    enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(BakaRadii.pill), borderSide: const BorderSide(color: BakaColors.borderSubtle)),
                    focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(BakaRadii.pill), borderSide: const BorderSide(color: BakaColors.stellarBlue)),
                  ),
                );
              },
              optionsViewBuilder: (context, onSelected, options) {
                return Align(
                  alignment: Alignment.topLeft,
                  child: Material(
                    color: BakaColors.nebulaSlate,
                    borderRadius: BorderRadius.circular(BakaRadii.md),
                    elevation: 0,
                    child: Container(
                      width: 320,
                      constraints: const BoxConstraints(maxHeight: 320),
                      padding: const EdgeInsets.symmetric(vertical: BakaSpacing.xs),
                      decoration: BoxDecoration(
                        borderRadius: BorderRadius.circular(BakaRadii.md),
                        border: Border.all(color: BakaColors.borderSubtle),
                      ),
                      child: ListView(
                        shrinkWrap: true,
                        children: [
                          for (final option in options)
                            ListTile(
                              dense: true,
                              title: Text(option.label, style: Theme.of(context).textTheme.bodyMedium),
                              subtitle: Text(option.sublabel, style: Theme.of(context).textTheme.bodySmall),
                              onTap: () => onSelected(option),
                            ),
                        ],
                      ),
                    ),
                  ),
                );
              },
            ),
          ),
          const Spacer(),
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
                onPressed: () => onNavigate(AppSection.signals),
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

/// Places the very low-density [StellarBackground] behind a screen's content
/// — only in the content pane, never behind the sidebar/topbar chrome — so
/// stars only ever show through empty space between cards, never compete
/// with dense text.
class _ScreenBackdrop extends StatelessWidget {
  const _ScreenBackdrop({required this.show, required this.child});

  final bool show;
  final Widget child;

  @override
  Widget build(BuildContext context) {
    if (!show) return child;
    return Stack(
      children: [
        const Positioned.fill(child: StellarBackground(density: 40)),
        child,
      ],
    );
  }
}

class _ShortcutHint extends StatelessWidget {
  const _ShortcutHint({required this.label});

  final String label;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
      decoration: BoxDecoration(
        color: BakaColors.nebulaSlateHigh,
        borderRadius: BorderRadius.circular(BakaRadii.sm),
        border: Border.all(color: BakaColors.borderSubtle),
      ),
      child: Text(label, style: const TextStyle(fontSize: 10, color: BakaColors.textSecondary, fontWeight: FontWeight.w600)),
    );
  }
}

class _DesktopShell extends StatefulWidget {
  const _DesktopShell({
    required this.selected,
    required this.onSelect,
    required this.collapsed,
    required this.onToggleCollapsed,
    required this.pendingSignals,
    required this.onQuickCapture,
    required this.showStarfield,
    required this.body,
  });

  final AppSection selected;
  final ValueChanged<AppSection> onSelect;
  final bool collapsed;
  final VoidCallback onToggleCollapsed;
  final int pendingSignals;
  final VoidCallback onQuickCapture;
  final bool showStarfield;
  final Widget body;

  @override
  State<_DesktopShell> createState() => _DesktopShellState();
}

class _DesktopShellState extends State<_DesktopShell> {
  final FocusNode _searchFocusNode = FocusNode();
  final TextEditingController _searchController = TextEditingController();

  @override
  void dispose() {
    _searchFocusNode.dispose();
    _searchController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return CallbackShortcuts(
      bindings: {
        const SingleActivator(LogicalKeyboardKey.keyK, control: true): _searchFocusNode.requestFocus,
        const SingleActivator(LogicalKeyboardKey.keyK, meta: true): _searchFocusNode.requestFocus,
      },
      child: Focus(
        autofocus: true,
        canRequestFocus: false,
        child: Scaffold(
          body: Row(
            children: [
              BakaSidebar(
                selected: widget.selected,
                onSelect: widget.onSelect,
                collapsed: widget.collapsed,
                onToggleCollapsed: widget.onToggleCollapsed,
                pendingSignals: widget.pendingSignals,
              ),
              Expanded(
                child: Column(
                  children: [
                    _Topbar(
                      pendingSignals: widget.pendingSignals,
                      onQuickCapture: widget.onQuickCapture,
                      onNavigate: widget.onSelect,
                      searchFocusNode: _searchFocusNode,
                      searchController: _searchController,
                    ),
                    Expanded(child: _ScreenBackdrop(show: widget.showStarfield, child: widget.body)),
                  ],
                ),
              ),
            ],
          ),
        ),
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
    required this.showStarfield,
    required this.body,
  });

  final AppSection selected;
  final ValueChanged<AppSection> onSelect;
  final int pendingSignals;
  final VoidCallback onQuickCapture;
  final bool showStarfield;
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
              child: BakaStudioMark(size: 22),
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
          Expanded(child: _ScreenBackdrop(show: showStarfield, child: body)),
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
    required this.showStarfield,
    required this.body,
  });

  final AppSection selected;
  final ValueChanged<AppSection> onSelect;
  final VoidCallback onMore;
  final int pendingSignals;
  final VoidCallback onQuickCapture;
  final bool showStarfield;
  final Widget body;

  @override
  Widget build(BuildContext context) {
    final info = appSections[selected]!;
    return Scaffold(
      appBar: AppBar(
        title: Text(info.title),
        actions: [
          IconButton(
            tooltip: 'Buscar em tudo',
            onPressed: () => showSearch(context: context, delegate: _AppSearchDelegate(onNavigate: onSelect)),
            icon: const Icon(Icons.search),
          ),
        ],
      ),
      body: _ScreenBackdrop(show: showStarfield, child: body),
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

class _AppSearchDelegate extends SearchDelegate<void> {
  _AppSearchDelegate({required this.onNavigate}) : super(searchFieldLabel: 'Buscar em tudo…');

  final ValueChanged<AppSection> onNavigate;

  @override
  List<Widget> buildActions(BuildContext context) => [
    if (query.isNotEmpty) IconButton(icon: const Icon(Icons.clear), onPressed: () => query = ''),
  ];

  @override
  Widget buildLeading(BuildContext context) => IconButton(
    icon: const Icon(Icons.arrow_back),
    onPressed: () => close(context, null),
  );

  Widget _buildList(BuildContext context) {
    final state = context.read<AppState>();
    final results = _searchResults(state, query);
    if (results.isEmpty) {
      return Center(
        child: Text(
          query.isEmpty ? 'Digite para buscar canais, projetos e produções.' : 'Nada encontrado.',
          style: Theme.of(context).textTheme.bodyMedium,
        ),
      );
    }
    return ListView(
      children: [
        for (final result in results)
          ListTile(
            title: Text(result.label),
            subtitle: Text(result.sublabel),
            onTap: () {
              if (result.channelId != null) state.selectChannel(result.channelId);
              onNavigate(result.section);
              close(context, null);
            },
          ),
      ],
    );
  }

  @override
  Widget buildResults(BuildContext context) => _buildList(context);

  @override
  Widget buildSuggestions(BuildContext context) => _buildList(context);
}
