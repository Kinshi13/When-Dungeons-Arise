import 'package:flutter/material.dart';

/// Every top-level destination in the app. Thematic label + plain
/// functional subtitle travel together so both the sidebar and the mobile
/// nav can render "Constelações — Projetos" style labels consistently.
enum AppSection {
  observatory,
  channels,
  projects,
  content,
  orbit,
  signals,
  campaigns,
  settings,
}

class AppSectionInfo {
  const AppSectionInfo({
    required this.title,
    required this.subtitle,
    required this.icon,
    required this.selectedIcon,
  });

  final String title;
  final String subtitle;
  final IconData icon;
  final IconData selectedIcon;
}

const Map<AppSection, AppSectionInfo> appSections = {
  AppSection.observatory: AppSectionInfo(
    title: 'Observatório',
    subtitle: 'Visão geral',
    icon: Icons.explore_outlined,
    selectedIcon: Icons.explore,
  ),
  AppSection.channels: AppSectionInfo(
    title: 'Canais',
    subtitle: 'Seus canais',
    icon: Icons.auto_awesome_outlined,
    selectedIcon: Icons.auto_awesome,
  ),
  AppSection.projects: AppSectionInfo(
    title: 'Constelações',
    subtitle: 'Projetos',
    icon: Icons.hub_outlined,
    selectedIcon: Icons.hub,
  ),
  AppSection.content: AppSectionInfo(
    title: 'Produções',
    subtitle: 'Conteúdos',
    icon: Icons.movie_creation_outlined,
    selectedIcon: Icons.movie_creation,
  ),
  AppSection.orbit: AppSectionInfo(
    title: 'Órbita',
    subtitle: 'Calendário editorial',
    icon: Icons.public_outlined,
    selectedIcon: Icons.public,
  ),
  AppSection.signals: AppSectionInfo(
    title: 'Sinais',
    subtitle: 'Caixa de entrada',
    icon: Icons.graphic_eq,
    selectedIcon: Icons.graphic_eq,
  ),
  AppSection.campaigns: AppSectionInfo(
    title: 'Sistemas',
    subtitle: 'Campanhas',
    icon: Icons.device_hub_outlined,
    selectedIcon: Icons.device_hub,
  ),
  AppSection.settings: AppSectionInfo(
    title: 'Ajustes',
    subtitle: 'Configurações',
    icon: Icons.settings_outlined,
    selectedIcon: Icons.settings,
  ),
};

/// Order used by the mobile bottom bar: Início, Produções, Órbita, Sinais,
/// then "Mais" for everything else.
const List<AppSection> mobilePrimarySections = [
  AppSection.observatory,
  AppSection.content,
  AppSection.orbit,
  AppSection.signals,
];

const List<AppSection> mobileMoreSections = [
  AppSection.channels,
  AppSection.projects,
  AppSection.campaigns,
  AppSection.settings,
];

const List<AppSection> desktopSections = [
  AppSection.observatory,
  AppSection.channels,
  AppSection.projects,
  AppSection.content,
  AppSection.orbit,
  AppSection.signals,
  AppSection.campaigns,
  AppSection.settings,
];
