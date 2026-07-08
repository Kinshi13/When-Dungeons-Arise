import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../core/theme/theme.dart';
import '../../data/repositories/sync_queue_repository.dart';
import '../../state/app_state.dart';
import '../../state/auth_state.dart';
import '../../widgets/cosmic_section_header.dart';
import '../../widgets/stellar_button.dart';
import '../../widgets/stellar_card.dart';
import '../auth/auth_screen.dart';

class SettingsScreen extends StatefulWidget {
  const SettingsScreen({super.key});

  @override
  State<SettingsScreen> createState() => _SettingsScreenState();
}

class _SettingsScreenState extends State<SettingsScreen> {
  bool _reduceMotion = false;
  bool _notifications = true;

  @override
  Widget build(BuildContext context) {
    final state = context.watch<AppState>();
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
                Text(state.workspace.name, style: Theme.of(context).textTheme.bodyLarge),
              ],
            ),
          ),
          const SizedBox(height: BakaSpacing.md),
          _buildAccountCard(context, state),
          const SizedBox(height: BakaSpacing.md),
          StellarCard(
            padding: EdgeInsets.zero,
            child: Column(
              children: [
                SwitchListTile(
                  title: const Text('Fundo estelar'),
                  subtitle: const Text('Exibir estrelas discretas no plano de fundo'),
                  value: state.showStarfield,
                  onChanged: state.setShowStarfield,
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
                Text('Baka Studio · v0.1.0', style: Theme.of(context).textTheme.bodyMedium),
                const SizedBox(height: 2),
                Text(state.workspace.name, style: Theme.of(context).textTheme.bodySmall),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildAccountCard(BuildContext context, AppState state) {
    final authState = context.watch<AuthState>();

    if (!authState.isAvailable) {
      return StellarCard(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Conta', style: Theme.of(context).textTheme.titleMedium),
            const SizedBox(height: BakaSpacing.xs),
            Text(
              'Sincronização entre dispositivos não configurada neste build. '
              'O app continua funcionando normalmente, só localmente.',
              style: Theme.of(context).textTheme.bodySmall,
            ),
          ],
        ),
      );
    }

    if (authState.status == AuthStatus.unauthenticated) {
      return StellarCard(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Conta', style: Theme.of(context).textTheme.titleMedium),
            const SizedBox(height: BakaSpacing.xs),
            Text(
              'Entre para sincronizar este workspace entre seus dispositivos.',
              style: Theme.of(context).textTheme.bodySmall,
            ),
            const SizedBox(height: BakaSpacing.sm),
            StellarButton(
              label: 'Entrar / Criar conta',
              onPressed: () => Navigator.of(context).push(MaterialPageRoute(builder: (_) => const AuthScreen())),
            ),
          ],
        ),
      );
    }

    return StellarCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('Conta', style: Theme.of(context).textTheme.titleMedium),
          const SizedBox(height: BakaSpacing.xs),
          Text(authState.user?.email ?? '', style: Theme.of(context).textTheme.bodyLarge),
          const SizedBox(height: BakaSpacing.sm),
          StellarButton(
            label: 'Sair',
            variant: StellarButtonVariant.outlined,
            loading: authState.isBusy,
            onPressed: () => _confirmSignOut(context, state),
          ),
        ],
      ),
    );
  }

  Future<void> _confirmSignOut(BuildContext context, AppState state) async {
    final syncQueue = SyncQueueRepository(state.db);
    final pending = await syncQueue.listPending();
    if (!context.mounted) return;

    if (pending.isEmpty) {
      await context.read<AuthState>().signOut();
      return;
    }

    final signOutAnyway = await showDialog<bool>(
      context: context,
      builder: (dialogContext) => AlertDialog(
        title: const Text('Alterações não sincronizadas'),
        content: Text(
          'Existem ${pending.length} alterações ainda não sincronizadas neste dispositivo. '
          'Elas continuam salvas localmente, mas só chegam aos seus outros dispositivos '
          'depois de uma sincronização.',
        ),
        actions: [
          TextButton(onPressed: () => Navigator.of(dialogContext).pop(false), child: const Text('Cancelar')),
          TextButton(onPressed: () => Navigator.of(dialogContext).pop(true), child: const Text('Sair mesmo assim')),
        ],
      ),
    );

    if (signOutAnyway == true && context.mounted) {
      await context.read<AuthState>().signOut();
    }
  }
}
