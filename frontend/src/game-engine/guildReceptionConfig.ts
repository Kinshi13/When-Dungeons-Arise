export interface GuildShortcut {
  id: string;
  label: string;
  to: string;
  color: string;
  /** Posição relativa do centro do prédio, de 0 a 1 dentro do canvas. */
  x: number;
  y: number;
}

export const GUILD_SHORTCUTS: GuildShortcut[] = [
  { id: "biblioteca", label: "Biblioteca", to: "/biblioteca", color: "#ff8a5c", x: 0.18, y: 0.66 },
  { id: "tesouraria", label: "Tesouraria", to: "/tesouraria", color: "#ffd23f", x: 0.5, y: 0.66 },
  { id: "sala-do-tempo", label: "Sala do Tempo", to: "/sala-do-tempo", color: "#6c5ce7", x: 0.82, y: 0.66 },
  { id: "diario", label: "Diário", to: "/diario", color: "#4fd6e8", x: 0.32, y: 0.88 },
  { id: "configuracoes", label: "Ajustes", to: "/regras", color: "#9a8fc2", x: 0.68, y: 0.88 },
];

export interface ReceptionistSpriteConfig {
  /** Caminho do arquivo dentro de frontend/public/, ex.: "/game/characters/receptionist-idle.png" */
  url: string;
  /** Lado de cada frame no arquivo original, em pixels (frames quadrados, lado a lado). */
  frameSize: number;
  frameCount: number;
  fps: number;
}

// Defina aqui quando o spritesheet real da recepcionista existir. Enquanto for `null`, a cena
// desenha o placeholder pixelado via Phaser.Graphics.
export const RECEPTIONIST_SPRITE: ReceptionistSpriteConfig | null = null;

export const RECEPTIONIST_MESSAGES = [
  "Bem-vindo de volta, aventureiro.",
  "O mural foi atualizado com novas missões.",
  "Você tem tarefas importantes hoje.",
  "A biblioteca está esperando por você.",
  "Sua sequência diária continua ativa.",
] as const;

// Chaves de preload reservadas para quando os assets reais (imagens/spritesheets) existirem.
// Hoje nada é carregado por elas — tudo é desenhado proceduralmente via Phaser.Graphics nas
// scene objects (drawGuildBackground, createMissionBoardHotspot, createGuildShortcutButton,
// createReceptionistIdleCharacter). Basta o usuário fornecer os arquivos e trocar os
// `scene.add.graphics(...)` por `scene.load.image(key, url)` + `scene.add.image(...)`.
export const GUILD_RECEPTION_ASSET_KEYS = {
  background: "guild_reception_bg",
  receptionistIdle: "receptionist_idle",
  missionBoard: "mission_board",
  shortcutLibrary: "shortcut_library",
  shortcutTreasury: "shortcut_treasury",
  shortcutTimeRoom: "shortcut_time_room",
  shortcutDiary: "shortcut_diary",
  shortcutSettings: "shortcut_settings",
  xpIcon: "xp_icon",
  coinIcon: "coin_icon",
  rewardPopup: "reward_popup",
  dialogBox: "dialog_box",
} as const;
