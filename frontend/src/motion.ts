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

// Transição de entrada/saída entre as telas principais da dock — substitui
// o antigo sistema de arrastar+prévia (que dependia do dedo estar preso à
// posição real do gesto). Valores discretos (opacity + leve translateY +
// scale quase imperceptível) em vez de um slide completo de tela: a troca
// deve parecer "o ambiente mudou", não "uma página deslizou pela tela".
export const screenEnter = {
  initial: { opacity: 0, y: 18, scale: 0.97 },
  animate: { opacity: 1, y: 0, scale: 1 },
  exit: { opacity: 0, y: -10, scale: 0.97 },
  transition: { duration: 0.3, ease: [0.32, 0.72, 0, 1] },
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
