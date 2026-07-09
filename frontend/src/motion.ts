// Tokens de animação centralizados — consolida as durações/molas que antes
// estavam repetidas (às vezes byte-a-byte idênticas) espalhadas por vários
// componentes de overlay, mais as transições de tela/aba. Cada token mapeia
// 1:1 pro valor que já existia em algum lugar do app (comentado abaixo),
// então migrar um componente pra cá não muda a sensação dele por acidente.

export const DURATIONS = {
  // Era o fade do backdrop do DueBillsPopup (0.15).
  fast: 0.15,
  // Era o fade dos 7 overlays "note-fullscreen" (ClockScreen, WeatherScreen,
  // ThemesScreen, WallpaperSettingsScreen, NotificationManagerScreen,
  // NoteEditorScreen, ListEditorScreen) — todos usavam esse valor idêntico.
  standard: 0.2,
} as const;

export const SPRINGS = {
  // Era TAB_TRANSITION em App.tsx — toque/destaque da aba ativa.
  playful: { type: "spring", stiffness: 420, damping: 15, mass: 0.7 },
  // Era a mola do card do DueBillsPopup.
  pop: { type: "spring", stiffness: 420, damping: 28 },
  // Unifica LibraryDrawer (320/32) e BookCoverSheet (360/34) — mesmo padrão
  // conceitual de "gaveta subindo de baixo", uma mola só em vez de duas.
  sheet: { type: "spring", stiffness: 360, damping: 34 },
  // Era SLIDE_ENTER_TRANSITION em App.tsx.
  standard: { type: "spring", stiffness: 280, damping: 32, mass: 0.8 },
} as const;

// Preset composto reaproveitado por 7 overlays "tela cheia" que hoje
// duplicam exatamente esse initial/animate/exit/transition.
export const fullscreenSheetFade = {
  initial: { opacity: 0, y: 24 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: 24 },
  transition: { duration: DURATIONS.standard },
} as const;

export const sheetBackdropFade = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
  transition: { duration: DURATIONS.fast },
} as const;

export const sheetSlideUp = {
  initial: { y: "100%" },
  animate: { y: 0 },
  exit: { y: "100%" },
  transition: SPRINGS.sheet,
} as const;

// Transição de entrada/saída entre as telas principais da dock — gaveta
// subindo de baixo pra cima (pedido explícito após relato de atraso real
// em aparelhos Android 15/16 — Samsung A56, Redmi Note 14). Só
// translateY, sem scale nem opacity: scale forçava o navegador a
// recompor o blur() de tudo que tem filter/backdrop-filter por baixo
// (fundos de tela, cards de vidro) a cada frame da animação — uma
// combinação cara em WebView Android, e um dos motivos reais do atraso,
// não só estético. Sem scale/opacity, é só reposicionar uma camada já
// composta pela GPU (translateY é barato em qualquer resolução/potência);
// a tela nova "subindo por cima" da antiga já emerge sozinha da ordem de
// empilhamento normal do AnimatePresence, sem precisar simular com fade.
export const screenEnter = {
  initial: { y: 56 },
  animate: { y: 0 },
  exit: { y: -32 },
  transition: { type: "spring", stiffness: 340, damping: 32, mass: 0.9 },
} as const;

// Fundo full-bleed atrás da tela (.page-bg-layer, ver App.tsx) — mesma
// troca de rota do screenEnter, mas só com fade: é uma camada position:
// fixed/inset:0 atrás de tudo, então um translateY de poucos px não se
// percebe (a imagem já cobre o viewport inteiro antes/depois do
// deslocamento) — sem o fade, a troca "pipoca" de um fundo pro outro
// instantaneamente por trás do conteúdo ainda saindo (percebido durante a
// integração desta mudança). Sem scale (esse sim, caro — ver screenEnter).
export const pageBackgroundEnter = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
  transition: { duration: 0.25 },
} as const;

// Sub-abas dentro de uma mesma tela principal (Mural, Tesouraria, Sala do
// Tempo, Diário) — deliberadamente mais rápido e só com fade (sem y/scale):
// o conteúdo inteiro re-monta a cada troca (cada aba é um componente
// diferente), então um deslocamento vertical em cima disso parecia uma
// gaveta abrindo, não uma troca de aba. Só o fade já deixa a troca visível
// sem esse efeito colateral.
export const tabContentEnter = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
  transition: { duration: 0.15 },
} as const;
