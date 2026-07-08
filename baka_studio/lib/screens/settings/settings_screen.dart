import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../core/theme/theme.dart';
import '../../data/repositories/sync_queue_repository.dart';
import '../../data/sync/sync_engine.dart';
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
          _buildSyncStatusCard(context, state),
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

  /// Indicador discreto de sincronização (seção 25-26): nunca bloqueia a
  /// UI, só informa sincronizado/sincronizando/pendente/erro e oferece o
  /// botão manual "Sincronizar agora". Só aparece com sessão autenticada —
  /// sem conta não há workspace remoto para sincronizar com.
  Widget _buildSyncStatusCard(BuildContext context, AppState state) {
    final authState = context.watch<AuthState>();
    if (authState.status != AuthStatus.authenticated) return const SizedBox.shrink();

    final syncQueue = SyncQueueRepository(state.db);
    final engine = context.watch<SyncEngine>();

    return StreamBuilder<int>(
      stream: syncQueue.watchPendingCount(),
      initialData: 0,
      builder: (context, pendingSnapshot) {
        return StreamBuilder<int>(
          stream: syncQueue.watchFailedCount(),
          initialData: 0,
          builder: (context, failedSnapshot) {
            final pending = pendingSnapshot.data ?? 0;
            final failed = failedSnapshot.data ?? 0;
            return StellarCard(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('Sincronização', style: Theme.of(context).textTheme.titleMedium),
                  const SizedBox(height: BakaSpacing.xs),
                  _syncStatusLine(context, engine: engine, pending: pending, failed: failed),
                  const SizedBox(height: BakaSpacing.sm),
                  Row(
                    children: [
                      StellarButton(
                        label: 'Sincronizar agora',
                        loading: engine.isSyncing,
                        onPressed: engine.isSyncing ? null : () => engine.runFullSync(state.workspace.id),
                      ),
                      if (failed > 0) ...[
                        const SizedBox(width: BakaSpacing.xs),
                        StellarButton(
                          label: 'Tentar novamente',
                          variant: StellarButtonVariant.text,
                          onPressed: engine.isSyncing
                              ? null
                              : () async {
                                  await syncQueue.retryAllFailed();
                                  await engine.runFullSync(state.workspace.id);
                                },
                        ),
                      ],
                    ],
                  ),
                ],
              ),
            );
          },
        );
      },
    );
  }

  Widget _syncStatusLine(BuildContext context, {required SyncEngine engine, required int pending, required int failed}) {
    final textTheme = Theme.of(context).textTheme;
    if (engine.isSyncing) {
      return Text('Sincronizando…', style: textTheme.bodySmall);
    }
    if (failed > 0) {
      return Text(
        'Erro na sincronização — $failed ${failed == 1 ? 'item não sincronizado' : 'itens não sincronizados'}',
        style: textTheme.bodySmall?.copyWith(color: BakaColors.danger),
      );
    }
    if (pending > 0) {
      return Text(
        '$pending ${pending == 1 ? 'alteração pendente' : 'alterações pendentes'}',
        style: textTheme.bodySmall?.copyWith(color: BakaColors.warning),
      );
    }
    final lastSynced = engine.lastSyncedAt;
    return Text(
      lastSynced == null ? 'Sincronizado' : 'Sincronizado às ${_formatTime(lastSynced)}',
      style: textTheme.bodySmall?.copyWith(color: BakaColors.success),
    );
  }

  String _formatTime(DateTime time) => '${time.hour.toString().padLeft(2, '0')}:${time.minute.toString().padLeft(2, '0')}';

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
