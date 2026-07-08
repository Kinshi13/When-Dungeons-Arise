import '../../core/theme/baka_colors.dart';
import '../models/campaign.dart';
import '../models/channel.dart';
import '../models/content_item.dart';
import '../models/project.dart';
import '../models/signal.dart';
import '../repositories/campaign_repository.dart';
import '../repositories/channel_repository.dart';
import '../repositories/content_repository.dart';
import '../repositories/project_repository.dart';
import '../repositories/signal_repository.dart';
import '../repositories/task_repository.dart';

/// Populates the "Rede Baka" demo dataset — but only the very first time
/// the app runs. Every repository call here is a real write through the
/// same path the UI uses; nothing is special-cased. Guarded by
/// [seedIfEmpty] checking the channels table, so re-opening the app never
/// re-inserts (and never duplicates) this data — see section 28 of the
/// brief and [ChannelRepository.watchAll].
class DatabaseSeeder {
  DatabaseSeeder({
    required this.channelRepository,
    required this.projectRepository,
    required this.contentRepository,
    required this.taskRepository,
    required this.signalRepository,
    required this.campaignRepository,
  });

  final ChannelRepository channelRepository;
  final ProjectRepository projectRepository;
  final ContentRepository contentRepository;
  final TaskRepository taskRepository;
  final SignalRepository signalRepository;
  final CampaignRepository campaignRepository;

  Future<void> seedIfEmpty(String workspaceId) async {
    final existing = await channelRepository.watchAll(includeArchived: true).first;
    if (existing.isNotEmpty) return;

    final now = DateTime.now();

    final bakaCode = await channelRepository.create(
      workspaceId: workspaceId,
      name: 'Baka Code',
      color: BakaColors.channelBakaCode,
      niche: 'Programação e desenvolvimento de apps',
      objective: 'Documentar a construção de produtos reais em vídeo',
      status: ChannelStatus.active,
    );
    final bakaPhone = await channelRepository.create(
      workspaceId: workspaceId,
      name: 'Baka Phone',
      color: BakaColors.channelBakaPhone,
      niche: 'Android, iPhone e tecnologia mobile',
      objective: 'Comparativos e dicas práticas de celular',
      status: ChannelStatus.active,
    );
    final codeNoSekai = await channelRepository.create(
      workspaceId: workspaceId,
      name: 'Code no Sekai',
      color: BakaColors.channelCodeNoSekai,
      niche: 'IA, experimentação e cultura geek',
      objective: 'Explorar IA aplicada a projetos criativos',
      status: ChannelStatus.planning,
    );
    final stella7 = await channelRepository.create(
      workspaceId: workspaceId,
      name: 'Stella7',
      color: BakaColors.channelStella7,
      niche: 'Música autoral',
      objective: 'Lançar músicas e clipes com identidade própria',
      status: ChannelStatus.active,
    );
    final robsonso = await channelRepository.create(
      workspaceId: workspaceId,
      name: 'Robsonso',
      color: BakaColors.channelRobsonso,
      niche: 'Humor e cotidiano',
      objective: 'Conteúdo leve entre um projeto e outro',
      status: ChannelStatus.paused,
    );

    await channelRepository.addManualRelation(
      workspaceId: workspaceId,
      channelIdA: bakaCode.id,
      channelIdB: bakaPhone.id,
      label: 'Mesma vertical técnica — conteúdo cruzado sobre dev e mobile',
    );
    await channelRepository.addManualRelation(
      workspaceId: workspaceId,
      channelIdA: bakaCode.id,
      channelIdB: stella7.id,
      label: 'Baka Studio documenta o processo de criação musical da Stella7',
    );
    await channelRepository.addManualRelation(
      workspaceId: workspaceId,
      channelIdA: stella7.id,
      channelIdB: codeNoSekai.id,
      label: 'Exploração de IA aplicada à composição musical',
    );
    await channelRepository.addManualRelation(
      workspaceId: workspaceId,
      channelIdA: bakaCode.id,
      channelIdB: robsonso.id,
      label: 'Bastidores de desenvolvimento viram conteúdo de humor',
    );

    final bakaStudio = await projectRepository.create(
      workspaceId: workspaceId,
      name: 'Baka Studio',
      description: 'Centro de comando para canais, projetos e conteúdos da Rede Baka.',
      channelIds: [bakaCode.id],
      status: ProjectStatus.active,
      priority: ProjectPriority.high,
    );
    final mvpAndroid = await projectRepository.addNode(projectId: bakaStudio.id, title: 'MVP Android', state: ProjectItemState.inProgress);
    await projectRepository.addNode(projectId: bakaStudio.id, title: 'Windows', state: ProjectItemState.planned, dependsOn: [mvpAndroid]);
    await projectRepository.addNode(projectId: bakaStudio.id, title: 'Supabase', state: ProjectItemState.blocked);
    final video = await projectRepository.addNode(projectId: bakaStudio.id, title: 'Vídeo principal', state: ProjectItemState.planned, dependsOn: [mvpAndroid]);
    await projectRepository.addNode(projectId: bakaStudio.id, title: 'Short', state: ProjectItemState.future, dependsOn: [video]);
    await projectRepository.addNode(projectId: bakaStudio.id, title: 'Documentação', state: ProjectItemState.done);

    final appEscala = await projectRepository.create(
      workspaceId: workspaceId,
      name: 'App de Escala',
      description: 'Ferramenta para organizar escalas de trabalho em equipe.',
      channelIds: [bakaCode.id],
      status: ProjectStatus.planned,
      priority: ProjectPriority.medium,
    );
    final wireframe = await projectRepository.addNode(projectId: appEscala.id, title: 'Wireframe', state: ProjectItemState.done);
    final modelo = await projectRepository.addNode(projectId: appEscala.id, title: 'Modelo de dados', state: ProjectItemState.inProgress, dependsOn: [wireframe]);
    await projectRepository.addNode(projectId: appEscala.id, title: 'Login', state: ProjectItemState.planned, dependsOn: [modelo]);

    final appEstoque = await projectRepository.create(
      workspaceId: workspaceId,
      name: 'App de Estoque',
      description: 'Controle de estoque com sincronização entre dispositivos.',
      channelIds: [bakaCode.id, bakaPhone.id],
      status: ProjectStatus.active,
      priority: ProjectPriority.high,
    );
    await projectRepository.addNode(projectId: appEstoque.id, title: 'Cadastro de itens', state: ProjectItemState.done);
    final sync = await projectRepository.addNode(projectId: appEstoque.id, title: 'Sincronização', state: ProjectItemState.blocked);
    await projectRepository.addNode(projectId: appEstoque.id, title: 'Relatórios', state: ProjectItemState.future, dependsOn: [sync]);

    final guilda = await projectRepository.create(
      workspaceId: workspaceId,
      name: 'Guilda de Aventureiros',
      description: 'App de produtividade gamificado — lembretes, calendário e biblioteca em tema RPG.',
      channelIds: [bakaCode.id],
      status: ProjectStatus.active,
      priority: ProjectPriority.medium,
    );
    final mural = await projectRepository.addNode(projectId: guilda.id, title: 'Mural de Missões', state: ProjectItemState.done);
    await projectRepository.addNode(projectId: guilda.id, title: 'Tesouraria', state: ProjectItemState.done);
    await projectRepository.addNode(projectId: guilda.id, title: 'Biblioteca', state: ProjectItemState.done);
    await projectRepository.addNode(projectId: guilda.id, title: 'Cenas Phaser', state: ProjectItemState.inProgress, dependsOn: [mural]);

    final appMusica = await projectRepository.create(
      workspaceId: workspaceId,
      name: 'App de Música',
      description: 'Player e organizador de composições e referências da Stella7.',
      channelIds: [stella7.id],
      status: ProjectStatus.planned,
      priority: ProjectPriority.low,
    );
    final refs = await projectRepository.addNode(projectId: appMusica.id, title: 'Biblioteca de referências', state: ProjectItemState.planned);
    await projectRepository.addNode(projectId: appMusica.id, title: 'Player', state: ProjectItemState.future, dependsOn: [refs]);

    await projectRepository.create(
      workspaceId: workspaceId,
      name: 'App de Finanças',
      description: 'Controle financeiro pessoal integrado à Guilda de Aventureiros.',
      channelIds: [bakaCode.id],
      status: ProjectStatus.completed,
      priority: ProjectPriority.low,
    ).then((p) async {
      await projectRepository.addNode(projectId: p.id, title: 'Lançamentos', state: ProjectItemState.done);
      await projectRepository.addNode(projectId: p.id, title: 'Parcelamento', state: ProjectItemState.done);
      await projectRepository.addNode(projectId: p.id, title: 'Relatórios', state: ProjectItemState.done);
    });

    final musicaZenitsu = await projectRepository.create(
      workspaceId: workspaceId,
      name: 'Música Zenitsu',
      description: 'Single autoral inspirado em Zenitsu, com clipe e materiais de lançamento.',
      channelIds: [stella7.id],
      status: ProjectStatus.active,
      priority: ProjectPriority.critical,
    );
    final letra = await projectRepository.addNode(projectId: musicaZenitsu.id, title: 'Letra', state: ProjectItemState.done);
    final gravacao = await projectRepository.addNode(projectId: musicaZenitsu.id, title: 'Gravação', state: ProjectItemState.done, dependsOn: [letra]);
    final edicao = await projectRepository.addNode(projectId: musicaZenitsu.id, title: 'Edição', state: ProjectItemState.inProgress, dependsOn: [gravacao]);
    final clipe = await projectRepository.addNode(projectId: musicaZenitsu.id, title: 'Clipe', state: ProjectItemState.planned, dependsOn: [edicao]);
    await projectRepository.addNode(projectId: musicaZenitsu.id, title: 'Thumbnail', state: ProjectItemState.future, dependsOn: [clipe]);

    final musicaHimiko = await projectRepository.create(
      workspaceId: workspaceId,
      name: 'Música Himiko Toga',
      description: 'Composição autoral sobre a personagem Himiko Toga.',
      channelIds: [stella7.id],
      status: ProjectStatus.planned,
      priority: ProjectPriority.medium,
    );
    final himikoRefs = await projectRepository.addNode(projectId: musicaHimiko.id, title: 'Referências', state: ProjectItemState.done);
    await projectRepository.addNode(projectId: musicaHimiko.id, title: 'Letra', state: ProjectItemState.inProgress, dependsOn: [himikoRefs]);

    await projectRepository.create(
      workspaceId: workspaceId,
      name: 'Música Eri & Kota',
      description: 'Faixa autoral em dueto temático.',
      channelIds: [stella7.id],
      status: ProjectStatus.idea,
      priority: ProjectPriority.low,
    ).then((p) => projectRepository.addNode(projectId: p.id, title: 'Ideia inicial', state: ProjectItemState.planned));

    Future<ContentItem> content({
      required String title,
      required List<String> channelIds,
      String? projectId,
      required ContentFormat format,
      required ContentStage stage,
      required ContentPriority priority,
      DateTime? dueDate,
      String? platform,
    }) {
      return contentRepository.create(
        workspaceId: workspaceId,
        title: title,
        channelIds: channelIds,
        projectId: projectId,
        format: format,
        stage: stage,
        priority: priority,
        dueDate: dueDate,
        platform: platform,
      );
    }

    final c1 = await content(
      title: 'Finalizar edição da música Zenitsu',
      channelIds: [stella7.id],
      projectId: musicaZenitsu.id,
      format: ContentFormat.musica,
      stage: ContentStage.editando,
      priority: ContentPriority.high,
      dueDate: now.add(const Duration(days: 1)),
      platform: 'YouTube Music',
    );
    await content(
      title: 'Criar roteiro sobre Baka Studio',
      channelIds: [bakaCode.id],
      projectId: bakaStudio.id,
      format: ContentFormat.roteiro,
      stage: ContentStage.roteiro,
      priority: ContentPriority.high,
      dueDate: now.subtract(const Duration(days: 1)),
      platform: 'YouTube',
    );
    await content(
      title: 'Comparar Android e iPhone',
      channelIds: [bakaPhone.id],
      format: ContentFormat.short,
      stage: ContentStage.ideia,
      priority: ContentPriority.medium,
      dueDate: now.add(const Duration(days: 3)),
      platform: 'TikTok',
    );
    await content(
      title: 'Revisar sincronização do App de Estoque',
      channelIds: [bakaCode.id, bakaPhone.id],
      projectId: appEstoque.id,
      format: ContentFormat.documento,
      stage: ContentStage.revisao,
      priority: ContentPriority.high,
      dueDate: now.subtract(const Duration(hours: 6)),
    );
    final c5 = await content(
      title: 'Publicar Short da Stella7',
      channelIds: [stella7.id],
      projectId: musicaZenitsu.id,
      format: ContentFormat.short,
      stage: ContentStage.agendado,
      priority: ContentPriority.medium,
      dueDate: now.add(const Duration(days: 2)),
      platform: 'Instagram',
    );
    await content(
      title: 'Documentar integração com Supabase',
      channelIds: [bakaCode.id],
      projectId: bakaStudio.id,
      format: ContentFormat.documento,
      stage: ContentStage.pesquisa,
      priority: ContentPriority.low,
      dueDate: now.add(const Duration(days: 5)),
    );
    await content(
      title: 'Criar primeiro vídeo do Baka Code',
      channelIds: [bakaCode.id],
      projectId: bakaStudio.id,
      format: ContentFormat.video,
      stage: ContentStage.prontoParaGravar,
      priority: ContentPriority.high,
      dueDate: now.add(const Duration(days: 1)),
      platform: 'YouTube',
    );
    final c8 = await content(
      title: 'Thumbnail — Refrão de Zenitsu',
      channelIds: [stella7.id],
      projectId: musicaZenitsu.id,
      format: ContentFormat.thumbnail,
      stage: ContentStage.thumb,
      priority: ContentPriority.medium,
      dueDate: now.add(const Duration(days: 2)),
    );
    await content(
      title: 'Gravar unboxing de acessórios',
      channelIds: [bakaPhone.id],
      format: ContentFormat.video,
      stage: ContentStage.gravando,
      priority: ContentPriority.low,
      dueDate: now.add(const Duration(days: 4)),
      platform: 'YouTube',
    );
    await content(
      title: 'Post de bastidores — Guilda de Aventureiros',
      channelIds: [bakaCode.id],
      projectId: guilda.id,
      format: ContentFormat.post,
      stage: ContentStage.publicado,
      priority: ContentPriority.low,
      dueDate: now.subtract(const Duration(days: 3)),
      platform: 'Instagram',
    );
    await content(
      title: 'Arquivo — teaser antigo Robsonso',
      channelIds: [robsonso.id],
      format: ContentFormat.video,
      stage: ContentStage.arquivado,
      priority: ContentPriority.low,
      dueDate: now.subtract(const Duration(days: 30)),
    );
    await content(
      title: 'Letra — Himiko Toga',
      channelIds: [stella7.id],
      projectId: musicaHimiko.id,
      format: ContentFormat.musica,
      stage: ContentStage.inbox,
      priority: ContentPriority.medium,
      dueDate: now.add(const Duration(days: 10)),
    );

    await taskRepository.create(
      workspaceId: workspaceId,
      title: 'Responder comentários do último vídeo',
      dueDate: now,
      channelId: bakaCode.id,
    );
    await taskRepository.create(
      workspaceId: workspaceId,
      title: 'Aprovar thumbnail da Zenitsu',
      dueDate: now,
      channelId: stella7.id,
    );
    await taskRepository.create(
      workspaceId: workspaceId,
      title: 'Revisar prints do App de Estoque',
      dueDate: now.subtract(const Duration(days: 1)),
      channelId: bakaCode.id,
    );
    await taskRepository.create(
      workspaceId: workspaceId,
      title: 'Planejar pauta do Code no Sekai',
      dueDate: now.add(const Duration(days: 2)),
      channelId: codeNoSekai.id,
    );

    await signalRepository.create(
      workspaceId: workspaceId,
      type: SignalType.ideia,
      title: 'Comparar notificações Android e iPhone',
      channelId: bakaPhone.id,
    );
    await signalRepository.create(
      workspaceId: workspaceId,
      type: SignalType.bug,
      title: 'Sincronização duplicou estoque',
      channelId: bakaCode.id,
    );
    await signalRepository.create(
      workspaceId: workspaceId,
      type: SignalType.musica,
      title: 'Refrão para Akaza',
      channelId: stella7.id,
    );
    await signalRepository.create(
      workspaceId: workspaceId,
      type: SignalType.conteudo,
      title: 'Claude destruiu minha navegação',
      channelId: bakaCode.id,
    );
    await signalRepository.create(
      workspaceId: workspaceId,
      type: SignalType.nota,
      title: 'Lembrar de revisar contraste dos chips de canal',
    );
    await signalRepository.create(
      workspaceId: workspaceId,
      type: SignalType.link,
      title: 'Referência de paleta noturna — ver antes de fechar o tema',
    );

    final campaign = await campaignRepository.create(
      workspaceId: workspaceId,
      name: 'Lançamento Música Zenitsu',
      description: 'Sistema de conteúdos conectados para o lançamento do single Zenitsu.',
      status: CampaignStatus.active,
      primaryChannelId: stella7.id,
    );
    await campaignRepository.addItem(campaign.id, CampaignItemEntityType.content, c1.id);
    await campaignRepository.addItem(campaign.id, CampaignItemEntityType.content, c5.id);
    await campaignRepository.addItem(campaign.id, CampaignItemEntityType.content, c8.id);
  }
}
