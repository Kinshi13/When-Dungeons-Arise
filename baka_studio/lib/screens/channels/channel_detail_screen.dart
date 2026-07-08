import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../core/theme/theme.dart';
import '../../data/models/channel.dart';
import '../../data/models/channel_link.dart';
import '../../data/models/content_item.dart';
import '../../state/app_state.dart';
import '../../widgets/forms/form_sheet_scaffold.dart';
import '../../widgets/star_node.dart';
import '../../widgets/stellar_card.dart';
import 'channel_form_sheet.dart';
import 'channel_relation_form_sheet.dart';

/// Full detail view for a single channel — reached by tapping a channel
/// card or star. Keeps the constellation identity (a single star header)
/// instead of turning into a generic dashboard.
class ChannelDetailScreen extends StatelessWidget {
  const ChannelDetailScreen({super.key, required this.channelId});

  final String channelId;

  @override
  Widget build(BuildContext context) {
    final state = context.watch<AppState>();
    final channel = state.channelById(channelId);
    if (channel == null) {
      return const Scaffold(body: Center(child: Text('Este canal foi arquivado ou removido.')));
    }

    final activeContent = state.contentForChannel(channelId).where((c) => c.stage != ContentStage.publicado && c.stage != ContentStage.arquivado).toList();
    final relatedProjects = state.projectsForChannel(channelId);
    final relatedCampaigns = state.campaigns.where((c) => c.primaryChannelId == channelId).toList();
    final relatedSignals = state.signals.where((s) => !s.processed && s.channelId == channelId).toList();
    final nextPublication = state.nextPublicationForChannel(channelId);
    final relations = state.channelRelations.where((r) => r.involves(channelId)).toList();

    return Scaffold(
      appBar: AppBar(
        title: Text(channel.name),
        actions: [
          IconButton(
            tooltip: 'Editar canal',
            icon: const Icon(Icons.edit_outlined),
            onPressed: () => showBakaFormSheet(context, builder: (_) => ChannelFormSheet(existing: channel)).then((changed) {
              if (changed == true && context.mounted && state.channelById(channelId) == null) {
                Navigator.of(context).pop();
              }
            }),
          ),
        ],
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(BakaSpacing.lg),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            StellarCard(
              accentColor: channel.color,
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      StarNode(color: channel.color, size: 28, state: channel.status == ChannelStatus.active ? StarNodeState.inProgress : StarNodeState.planned),
                      const SizedBox(width: BakaSpacing.sm),
                      Expanded(child: Text(channel.name, style: Theme.of(context).textTheme.headlineSmall)),
                    ],
                  ),
                  const SizedBox(height: BakaSpacing.sm),
                  if (channel.niche.isNotEmpty) _Field(label: 'Nicho', value: channel.niche),
                  if (channel.objective.isNotEmpty) _Field(label: 'Objetivo', value: channel.objective),
                  if (channel.description.isNotEmpty) _Field(label: 'Descrição', value: channel.description),
                  _Field(label: 'Próxima publicação', value: nextPublication ?? 'Nenhuma agendada'),
                ],
              ),
            ),
            const SizedBox(height: BakaSpacing.lg),
            Text('Produções ativas (${activeContent.length})', style: Theme.of(context).textTheme.titleLarge),
            const SizedBox(height: BakaSpacing.sm),
            if (activeContent.isEmpty)
              const StellarCard(child: Text('Nenhuma produção ativa.'))
            else
              for (final content in activeContent)
                Padding(
                  padding: const EdgeInsets.only(bottom: BakaSpacing.xs),
                  child: StellarCard(child: Text('${content.title} · ${content.stage.label}')),
                ),
            const SizedBox(height: BakaSpacing.lg),
            Text('Projetos relacionados (${relatedProjects.length})', style: Theme.of(context).textTheme.titleLarge),
            const SizedBox(height: BakaSpacing.sm),
            if (relatedProjects.isEmpty)
              const StellarCard(child: Text('Nenhum projeto relacionado.'))
            else
              Wrap(
                spacing: BakaSpacing.xs,
                runSpacing: BakaSpacing.xs,
                children: [for (final p in relatedProjects) Chip(label: Text(p.name))],
              ),
            const SizedBox(height: BakaSpacing.lg),
            Text('Campanhas (${relatedCampaigns.length})', style: Theme.of(context).textTheme.titleLarge),
            const SizedBox(height: BakaSpacing.sm),
            if (relatedCampaigns.isEmpty)
              const StellarCard(child: Text('Nenhuma campanha.'))
            else
              Wrap(
                spacing: BakaSpacing.xs,
                runSpacing: BakaSpacing.xs,
                children: [for (final c in relatedCampaigns) Chip(label: Text(c.name))],
              ),
            const SizedBox(height: BakaSpacing.lg),
            Text('Sinais pendentes (${relatedSignals.length})', style: Theme.of(context).textTheme.titleLarge),
            const SizedBox(height: BakaSpacing.sm),
            if (relatedSignals.isEmpty)
              const StellarCard(child: Text('Nenhum sinal pendente.'))
            else
              for (final signal in relatedSignals)
                Padding(
                  padding: const EdgeInsets.only(bottom: BakaSpacing.xs),
                  child: StellarCard(child: Text(signal.title)),
                ),
            const SizedBox(height: BakaSpacing.lg),
            Row(
              children: [
                Text('Conexões (${relations.length})', style: Theme.of(context).textTheme.titleLarge),
                const Spacer(),
                OutlinedButton.icon(
                  onPressed: () => showBakaFormSheet(context, builder: (_) => ChannelRelationFormSheet(channelId: channelId)),
                  icon: const Icon(Icons.add, size: 18),
                  label: const Text('Nova conexão'),
                ),
              ],
            ),
            const SizedBox(height: BakaSpacing.sm),
            if (relations.isEmpty)
              const StellarCard(child: Text('Nenhuma conexão ainda.'))
            else
              for (final relation in relations)
                Padding(
                  padding: const EdgeInsets.only(bottom: BakaSpacing.xs),
                  child: StellarCard(
                    child: Row(
                      children: [
                        Container(
                          width: 8,
                          height: 8,
                          decoration: BoxDecoration(color: state.channelById(relation.other(channelId))?.color ?? BakaColors.textTertiary, shape: BoxShape.circle),
                        ),
                        const SizedBox(width: BakaSpacing.sm),
                        Expanded(
                          child: Text.rich(
                            TextSpan(
                              children: [
                                TextSpan(
                                  text: '${state.channelById(relation.other(channelId))?.name ?? '—'}: ',
                                  style: Theme.of(context).textTheme.bodyMedium?.copyWith(color: BakaColors.starWhite),
                                ),
                                TextSpan(text: relation.description, style: Theme.of(context).textTheme.bodyMedium),
                              ],
                            ),
                          ),
                        ),
                        if (relation.type == ChannelRelationType.strategic || relation.type == ChannelRelationType.custom)
                          IconButton(
                            tooltip: 'Remover conexão',
                            icon: const Icon(Icons.close, size: 18),
                            onPressed: () => state.removeChannelRelation(relation.id!),
                          ),
                      ],
                    ),
                  ),
                ),
          ],
        ),
      ),
    );
  }
}

class _Field extends StatelessWidget {
  const _Field({required this.label, required this.value});

  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(top: BakaSpacing.xs),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(label, style: Theme.of(context).textTheme.labelSmall),
          Text(value, style: Theme.of(context).textTheme.bodyMedium),
        ],
      ),
    );
  }
}
