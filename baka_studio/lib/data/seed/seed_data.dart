import '../../core/theme/baka_colors.dart';
import '../models/campaign.dart';
import '../models/channel.dart';
import '../models/channel_link.dart';
import '../models/content_item.dart';
import '../models/orbit_event.dart';
import '../models/project.dart';
import '../models/signal.dart';
import '../models/task.dart';

/// Static demo data for the "Rede Baka" workspace — coherent, real-sounding
/// content so the design can be evaluated in context (no lorem ipsum).
abstract final class SeedData {
  static const workspaceName = 'Rede Baka';

  static final DateTime _now = DateTime.now();

  // Channels ------------------------------------------------------------
  static const List<Channel> channels = [
    Channel(
      id: 'baka_code',
      name: 'Baka Code',
      niche: 'Programação e desenvolvimento de apps',
      objective: 'Documentar a construção de produtos reais em vídeo',
      color: BakaColors.channelBakaCode,
      status: ChannelStatus.active,
      nextPublication: 'Vídeo — Baka Studio: primeiros passos',
      pendingSignals: 2,
    ),
    Channel(
      id: 'baka_phone',
      name: 'Baka Phone',
      niche: 'Android, iPhone e tecnologia mobile',
      objective: 'Comparativos e dicas práticas de celular',
      color: BakaColors.channelBakaPhone,
      status: ChannelStatus.active,
      nextPublication: 'Short — Notificações: Android vs iPhone',
      pendingSignals: 1,
    ),
    Channel(
      id: 'code_no_sekai',
      name: 'Code no Sekai',
      niche: 'IA, experimentação e cultura geek',
      objective: 'Explorar IA aplicada a projetos criativos',
      color: BakaColors.channelCodeNoSekai,
      status: ChannelStatus.planning,
      nextPublication: null,
      pendingSignals: 0,
    ),
    Channel(
      id: 'stella7',
      name: 'Stella7',
      niche: 'Música autoral',
      objective: 'Lançar músicas e clipes com identidade própria',
      color: BakaColors.channelStella7,
      status: ChannelStatus.active,
      nextPublication: 'Short — Refrão de Zenitsu',
      pendingSignals: 1,
    ),
    Channel(
      id: 'robsonso',
      name: 'Robsonso',
      niche: 'Humor e cotidiano',
      objective: 'Conteúdo leve entre um projeto e outro',
      color: BakaColors.channelRobsonso,
      status: ChannelStatus.paused,
      nextPublication: null,
      pendingSignals: 0,
    ),
  ];

  /// Curated channel-to-channel links for "Minha Rede" — only real
  /// strategic relationships, not an all-to-all mesh. Each carries an
  /// honest description of *why* the two channels are connected.
  static const List<ChannelLink> channelLinks = [
    ChannelLink(
      channelIdA: 'baka_code',
      channelIdB: 'baka_phone',
      relation: 'Mesma vertical técnica — conteúdo cruzado sobre dev e mobile',
    ),
    ChannelLink(
      channelIdA: 'baka_code',
      channelIdB: 'stella7',
      relation: 'Baka Studio documenta o processo de criação musical da Stella7',
    ),
    ChannelLink(
      channelIdA: 'stella7',
      channelIdB: 'code_no_sekai',
      relation: 'Exploração de IA aplicada à composição musical',
    ),
    ChannelLink(
      channelIdA: 'baka_code',
      channelIdB: 'robsonso',
      relation: 'Bastidores de desenvolvimento viram conteúdo de humor',
    ),
  ];

  // Projects (constellations) ------------------------------------------------------------
  static const List<Project> projects = [
    Project(
      id: 'proj_baka_studio',
      name: 'Baka Studio',
      description: 'Centro de comando para canais, projetos e conteúdos da Rede Baka.',
      channelIds: ['baka_code'],
      status: ProjectStatus.active,
      items: [
        ProjectItem(id: 'bs_mvp_android', title: 'MVP Android', state: ProjectItemState.inProgress),
        ProjectItem(id: 'bs_windows', title: 'Windows', state: ProjectItemState.planned, dependsOn: ['bs_mvp_android']),
        ProjectItem(id: 'bs_supabase', title: 'Supabase', state: ProjectItemState.blocked),
        ProjectItem(id: 'bs_video', title: 'Vídeo principal', state: ProjectItemState.planned, dependsOn: ['bs_mvp_android']),
        ProjectItem(id: 'bs_short', title: 'Short', state: ProjectItemState.future, dependsOn: ['bs_video']),
        ProjectItem(id: 'bs_docs', title: 'Documentação', state: ProjectItemState.done),
      ],
    ),
    Project(
      id: 'proj_app_escala',
      name: 'App de Escala',
      description: 'Ferramenta para organizar escalas de trabalho em equipe.',
      channelIds: ['baka_code'],
      status: ProjectStatus.planning,
      items: [
        ProjectItem(id: 'esc_wireframe', title: 'Wireframe', state: ProjectItemState.done),
        ProjectItem(id: 'esc_modelo_dados', title: 'Modelo de dados', state: ProjectItemState.inProgress, dependsOn: ['esc_wireframe']),
        ProjectItem(id: 'esc_login', title: 'Login', state: ProjectItemState.planned, dependsOn: ['esc_modelo_dados']),
      ],
    ),
    Project(
      id: 'proj_app_estoque',
      name: 'App de Estoque',
      description: 'Controle de estoque com sincronização entre dispositivos.',
      channelIds: ['baka_code'],
      status: ProjectStatus.active,
      items: [
        ProjectItem(id: 'est_cadastro', title: 'Cadastro de itens', state: ProjectItemState.done),
        ProjectItem(id: 'est_sync', title: 'Sincronização', state: ProjectItemState.blocked),
        ProjectItem(id: 'est_relatorios', title: 'Relatórios', state: ProjectItemState.future, dependsOn: ['est_sync']),
      ],
    ),
    Project(
      id: 'proj_guilda_aventureiros',
      name: 'Guilda de Aventureiros',
      description: 'App de produtividade gamificado — lembretes, calendário e biblioteca em tema RPG.',
      channelIds: ['baka_code'],
      status: ProjectStatus.active,
      items: [
        ProjectItem(id: 'guilda_mural', title: 'Mural de Missões', state: ProjectItemState.done),
        ProjectItem(id: 'guilda_tesouraria', title: 'Tesouraria', state: ProjectItemState.done),
        ProjectItem(id: 'guilda_biblioteca', title: 'Biblioteca', state: ProjectItemState.done),
        ProjectItem(id: 'guilda_phaser', title: 'Cenas Phaser', state: ProjectItemState.inProgress, dependsOn: ['guilda_mural']),
      ],
    ),
    Project(
      id: 'proj_app_musica',
      name: 'App de Música',
      description: 'Player e organizador de composições e referências da Stella7.',
      channelIds: ['stella7'],
      status: ProjectStatus.planning,
      items: [
        ProjectItem(id: 'mus_biblioteca_refs', title: 'Biblioteca de referências', state: ProjectItemState.planned),
        ProjectItem(id: 'mus_player', title: 'Player', state: ProjectItemState.future, dependsOn: ['mus_biblioteca_refs']),
      ],
    ),
    Project(
      id: 'proj_app_financas',
      name: 'App de Finanças',
      description: 'Controle financeiro pessoal integrado à Guilda de Aventureiros.',
      channelIds: ['baka_code'],
      status: ProjectStatus.done,
      items: [
        ProjectItem(id: 'fin_lancamentos', title: 'Lançamentos', state: ProjectItemState.done),
        ProjectItem(id: 'fin_parcelamento', title: 'Parcelamento', state: ProjectItemState.done),
        ProjectItem(id: 'fin_relatorios', title: 'Relatórios', state: ProjectItemState.done),
      ],
    ),
    Project(
      id: 'proj_musica_zenitsu',
      name: 'Música Zenitsu',
      description: 'Single autoral inspirado em Zenitsu, com clipe e materiais de lançamento.',
      channelIds: ['stella7'],
      status: ProjectStatus.active,
      items: [
        ProjectItem(id: 'zen_letra', title: 'Letra', state: ProjectItemState.done),
        ProjectItem(id: 'zen_gravacao', title: 'Gravação', state: ProjectItemState.done),
        ProjectItem(id: 'zen_edicao', title: 'Edição', state: ProjectItemState.inProgress, dependsOn: ['zen_gravacao']),
        ProjectItem(id: 'zen_clipe', title: 'Clipe', state: ProjectItemState.planned, dependsOn: ['zen_edicao']),
        ProjectItem(id: 'zen_thumb', title: 'Thumbnail', state: ProjectItemState.future, dependsOn: ['zen_clipe']),
      ],
    ),
    Project(
      id: 'proj_musica_himiko',
      name: 'Música Himiko Toga',
      description: 'Composição autoral sobre a personagem Himiko Toga.',
      channelIds: ['stella7'],
      status: ProjectStatus.planning,
      items: [
        ProjectItem(id: 'him_referencias', title: 'Referências', state: ProjectItemState.done),
        ProjectItem(id: 'him_letra', title: 'Letra', state: ProjectItemState.inProgress, dependsOn: ['him_referencias']),
      ],
    ),
    Project(
      id: 'proj_musica_eri_kota',
      name: 'Música Eri & Kota',
      description: 'Faixa autoral em dueto temático.',
      channelIds: ['stella7'],
      status: ProjectStatus.planning,
      items: [
        ProjectItem(id: 'ek_ideia', title: 'Ideia inicial', state: ProjectItemState.planned),
      ],
    ),
  ];

  // Content items (produções) ------------------------------------------------------------
  static List<ContentItem> get contentItems => [
    ContentItem(
      id: 'c1',
      title: 'Finalizar edição da música Zenitsu',
      channelId: 'stella7',
      projectId: 'proj_musica_zenitsu',
      format: ContentFormat.musica,
      stage: ContentStage.editando,
      priority: ContentPriority.high,
      dueDate: _now.add(const Duration(days: 1)),
      platform: 'YouTube Music',
    ),
    ContentItem(
      id: 'c2',
      title: 'Criar roteiro sobre Baka Studio',
      channelId: 'baka_code',
      projectId: 'proj_baka_studio',
      format: ContentFormat.roteiro,
      stage: ContentStage.roteiro,
      priority: ContentPriority.high,
      dueDate: _now.subtract(const Duration(days: 1)),
      platform: 'YouTube',
    ),
    ContentItem(
      id: 'c3',
      title: 'Comparar Android e iPhone',
      channelId: 'baka_phone',
      format: ContentFormat.short,
      stage: ContentStage.ideia,
      priority: ContentPriority.medium,
      dueDate: _now.add(const Duration(days: 3)),
      platform: 'TikTok',
    ),
    ContentItem(
      id: 'c4',
      title: 'Revisar sincronização do App de Estoque',
      channelId: 'baka_code',
      projectId: 'proj_app_estoque',
      format: ContentFormat.documento,
      stage: ContentStage.revisao,
      priority: ContentPriority.high,
      dueDate: _now.subtract(const Duration(hours: 6)),
    ),
    ContentItem(
      id: 'c5',
      title: 'Publicar Short da Stella7',
      channelId: 'stella7',
      projectId: 'proj_musica_zenitsu',
      format: ContentFormat.short,
      stage: ContentStage.agendado,
      priority: ContentPriority.medium,
      dueDate: _now.add(const Duration(days: 2)),
      platform: 'Instagram',
    ),
    ContentItem(
      id: 'c6',
      title: 'Documentar integração com Supabase',
      channelId: 'baka_code',
      projectId: 'proj_baka_studio',
      format: ContentFormat.documento,
      stage: ContentStage.pesquisa,
      priority: ContentPriority.low,
      dueDate: _now.add(const Duration(days: 5)),
    ),
    ContentItem(
      id: 'c7',
      title: 'Criar primeiro vídeo do Baka Code',
      channelId: 'baka_code',
      projectId: 'proj_baka_studio',
      format: ContentFormat.video,
      stage: ContentStage.prontoParaGravar,
      priority: ContentPriority.high,
      dueDate: _now.add(const Duration(days: 1)),
      platform: 'YouTube',
    ),
    ContentItem(
      id: 'c8',
      title: 'Thumbnail — Refrão de Zenitsu',
      channelId: 'stella7',
      projectId: 'proj_musica_zenitsu',
      format: ContentFormat.thumbnail,
      stage: ContentStage.thumb,
      priority: ContentPriority.medium,
      dueDate: _now.add(const Duration(days: 2)),
    ),
    ContentItem(
      id: 'c9',
      title: 'Gravar unboxing de acessórios',
      channelId: 'baka_phone',
      format: ContentFormat.video,
      stage: ContentStage.gravando,
      priority: ContentPriority.low,
      dueDate: _now.add(const Duration(days: 4)),
      platform: 'YouTube',
    ),
    ContentItem(
      id: 'c10',
      title: 'Post de bastidores — Guilda de Aventureiros',
      channelId: 'baka_code',
      projectId: 'proj_guilda_aventureiros',
      format: ContentFormat.post,
      stage: ContentStage.publicado,
      priority: ContentPriority.low,
      dueDate: _now.subtract(const Duration(days: 3)),
      platform: 'Instagram',
    ),
    ContentItem(
      id: 'c11',
      title: 'Arquivo — teaser antigo Robsonso',
      channelId: 'robsonso',
      format: ContentFormat.video,
      stage: ContentStage.arquivado,
      priority: ContentPriority.low,
      dueDate: _now.subtract(const Duration(days: 30)),
    ),
    ContentItem(
      id: 'c12',
      title: 'Letra — Himiko Toga',
      channelId: 'stella7',
      projectId: 'proj_musica_himiko',
      format: ContentFormat.musica,
      stage: ContentStage.inbox,
      priority: ContentPriority.medium,
      dueDate: _now.add(const Duration(days: 10)),
    ),
  ];

  // Signals (Sinais / Inbox) ------------------------------------------------------------
  static List<Signal> get signals => [
    Signal(
      id: 's1',
      type: SignalType.ideia,
      text: 'Comparar notificações Android e iPhone',
      receivedAt: _now.subtract(const Duration(minutes: 12)),
      channelId: 'baka_phone',
    ),
    Signal(
      id: 's2',
      type: SignalType.bug,
      text: 'Sincronização duplicou estoque',
      receivedAt: _now.subtract(const Duration(hours: 2)),
      channelId: 'baka_code',
    ),
    Signal(
      id: 's3',
      type: SignalType.musica,
      text: 'Refrão para Akaza',
      receivedAt: _now.subtract(const Duration(days: 1)),
      channelId: 'stella7',
    ),
    Signal(
      id: 's4',
      type: SignalType.conteudo,
      text: 'Claude destruiu minha navegação',
      receivedAt: _now.subtract(const Duration(days: 1, hours: 3)),
      channelId: 'baka_code',
    ),
    Signal(
      id: 's5',
      type: SignalType.nota,
      text: 'Lembrar de revisar contraste dos chips de canal',
      receivedAt: _now.subtract(const Duration(days: 2)),
    ),
    Signal(
      id: 's6',
      type: SignalType.link,
      text: 'Referência de paleta noturna — ver antes de fechar o tema',
      receivedAt: _now.subtract(const Duration(days: 2, hours: 5)),
    ),
  ];

  // Orbit events (calendário editorial) ------------------------------------------------------------
  static List<OrbitEvent> get orbitEvents => [
    OrbitEvent(id: 'o1', title: 'Gravação — Baka Code', channelId: 'baka_code', date: _now.add(const Duration(days: 1)), type: OrbitEventType.gravacao),
    OrbitEvent(id: 'o2', title: 'Publicação — Zenitsu (Short)', channelId: 'stella7', date: _now.add(const Duration(days: 2)), type: OrbitEventType.publicacao),
    OrbitEvent(id: 'o3', title: 'Prazo — Roteiro Baka Studio', channelId: 'baka_code', date: _now.subtract(const Duration(days: 1)), type: OrbitEventType.prazo),
    OrbitEvent(id: 'o4', title: 'Campanha — Lançamento Zenitsu', channelId: 'stella7', date: _now.add(const Duration(days: 6)), type: OrbitEventType.campanha),
    OrbitEvent(id: 'o5', title: 'Publicação — Comparativo Android/iPhone', channelId: 'baka_phone', date: _now.add(const Duration(days: 3)), type: OrbitEventType.publicacao),
    OrbitEvent(id: 'o6', title: 'Gravação — Unboxing', channelId: 'baka_phone', date: _now.add(const Duration(days: 4)), type: OrbitEventType.gravacao),
    OrbitEvent(id: 'o7', title: 'Publicação — Post bastidores Guilda', channelId: 'baka_code', date: _now.subtract(const Duration(days: 3)), type: OrbitEventType.publicacao),
    OrbitEvent(id: 'o8', title: 'Prazo — Thumb Zenitsu', channelId: 'stella7', date: _now.add(const Duration(days: 2)), type: OrbitEventType.prazo),
  ];

  // Campaigns (sistemas) ------------------------------------------------------------
  static const List<Campaign> campaigns = [
    Campaign(
      id: 'camp_lancamento_zenitsu',
      name: 'Lançamento Música Zenitsu',
      description: 'Sistema de conteúdos conectados para o lançamento do single Zenitsu.',
      channelId: 'stella7',
      relatedContentIds: ['c1', 'c5', 'c8'],
    ),
  ];

  // Daily tasks (Observatório) ------------------------------------------------------------
  static List<DailyTask> get dailyTasks => [
    DailyTask(id: 't1', title: 'Responder comentários do último vídeo', dueDate: _now, channelId: 'baka_code'),
    DailyTask(id: 't2', title: 'Aprovar thumbnail da Zenitsu', dueDate: _now, channelId: 'stella7'),
    DailyTask(id: 't3', title: 'Revisar prints do App de Estoque', dueDate: _now.subtract(const Duration(days: 1)), channelId: 'baka_code'),
    DailyTask(id: 't4', title: 'Planejar pauta do Code no Sekai', dueDate: _now.add(const Duration(days: 2)), channelId: 'code_no_sekai'),
  ];
}
