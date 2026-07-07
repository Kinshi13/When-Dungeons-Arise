import 'package:flutter/material.dart';

import '../../core/theme/theme.dart';
import '../../data/seed/seed_data.dart';
import '../../widgets/cosmic_section_header.dart';
import '../../widgets/stellar_card.dart';

class SettingsScreen extends StatefulWidget {
  const SettingsScreen({super.key});

  @override
  State<SettingsScreen> createState() => _SettingsScreenState();
}

class _SettingsScreenState extends State<SettingsScreen> {
  bool _reduceMotion = false;
  bool _starfield = true;
  bool _notifications = true;

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(BakaSpacing.lg),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const CosmicSectionHeader(title: 'Ajustes', subtitle: 'Configurações'),
          const SizedBox(height: BakaSpacing.lg),
          StellarCard(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text('Workspace', style: Theme.of(context).textTheme.titleMedium),
                const SizedBox(height: BakaSpacing.xs),
                Text(SeedData.workspaceName, style: Theme.of(context).textTheme.bodyLarge),
              ],
            ),
          ),
          const SizedBox(height: BakaSpacing.md),
          StellarCard(
            padding: EdgeInsets.zero,
            child: Column(
              children: [
                SwitchListTile(
                  title: const Text('Fundo estelar'),
                  subtitle: const Text('Exibir estrelas discretas no plano de fundo'),
                  value: _starfield,
                  onChanged: (v) => setState(() => _starfield = v),
                ),
                const Divider(height: 1),
                SwitchListTile(
                  title: const Text('Reduzir animações'),
                  subtitle: const Text('Desativa pulsação e transições para economizar desempenho'),
                  value: _reduceMotion,
                  onChanged: (v) => setState(() => _reduceMotion = v),
                ),
                const Divider(height: 1),
                SwitchListTile(
                  title: const Text('Notificações'),
                  subtitle: const Text('Alertas de sinais, prazos e publicações'),
                  value: _notifications,
                  onChanged: (v) => setState(() => _notifications = v),
                ),
              ],
            ),
          ),
          const SizedBox(height: BakaSpacing.md),
          StellarCard(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text('Sobre', style: Theme.of(context).textTheme.titleMedium),
                const SizedBox(height: BakaSpacing.xs),
                Text('Baka Studio · v0.1.0 · fundação visual', style: Theme.of(context).textTheme.bodyMedium),
                const SizedBox(height: 2),
                Text('Rede Baka', style: Theme.of(context).textTheme.bodySmall),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
