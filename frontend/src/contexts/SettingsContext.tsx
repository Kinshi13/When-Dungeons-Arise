import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { setSfxVolume, playMusic, pauseMusic, setMusicVolume } from "../sound";

// Percentual de tamanho do texto/informações — não é mais um "zoom" da tela
// inteira (isso encolhia junto os fundos em tela cheia, deixando faixas
// vazias nas laterais). Agora é o font-size da raiz do documento: como quase
// todo o texto/paddings de UI usam `rem` (relativo à raiz), só isso escala;
// imagens de fundo em px/vw/vh/% ficam do mesmo tamanho sempre.
export type UiScale = number;

export const UI_SCALE_MIN = 50;
export const UI_SCALE_MAX = 125;
export const UI_SCALE_STEP = 5;

// Reduzidas: sem animação de UI nenhuma (framer-motion em reducedMotion
// "always") e sem partículas ambiente. Padrão/Completas mantêm a UI igual —
// só mudam a quantidade de partículas ambiente (ver AmbientParticles.tsx).
export type AnimationLevel = "reduzidas" | "padrao" | "completas";

export const ANIMATION_LEVEL_LABEL: Record<AnimationLevel, string> = {
  reduzidas: "Reduzidas",
  padrao: "Padrão",
  completas: "Completas",
};

export type ThemeId = "escuro" | "claro" | "lofi" | "personalizado";

// Ordem daqui é a ordem de exibição na tela de Temas.
export const THEME_LABEL: Record<ThemeId, string> = {
  lofi: "Lo-fi (padrão)",
  claro: "Lo-fi Escuro",
  personalizado: "Lo-fi Personalizado",
  escuro: "Guilda",
};

// A família Lo-fi (claro, escuro e personalizado) compartilha todo o visual
// flat: ícones preenchidos, barra de navegação de botões e a fonte redonda —
// só a paleta (claro/escuro) ou o fundo (personalizado, com papel de parede
// do usuário) muda entre eles.
export function isLofiTheme(theme: ThemeId): boolean {
  return theme === "lofi" || theme === "claro" || theme === "personalizado";
}

// Temas ainda não liberados pro usuário final — aparecem na tela de Temas
// como bloqueados (futuramente desbloqueáveis com o ouro do Avatar). O tema
// "Guilda" (o antigo padrão pixel art) fica guardado aqui até essa economia
// existir.
export const LOCKED_THEMES: ThemeId[] = ["escuro"];

interface SettingsState {
  sfxVolume: number;
  musicEnabled: boolean;
  musicVolume: number;
  uiScale: UiScale;
  animationLevel: AnimationLevel;
  theme: ThemeId;
  // Animação de entrada/saída ao trocar de tela (fade + leve translateY) —
  // vale tanto pra navegação por gesto quanto por toque na barra/links.
  screenTransitionAnimationEnabled: boolean;
  // Tema "Lo-fi Personalizado": usa sempre o papel de parede da Recepção em
  // todas as telas, em vez de um por tela — evita qualquer troca de imagem
  // de fundo ao navegar (nada pra "dessincronizar" visualmente no meio da
  // troca de tela, já que o fundo nunca muda).
  lockWallpaperToMain: boolean;
}

const DEFAULTS: SettingsState = {
  sfxVolume: 0.6,
  musicEnabled: false,
  musicVolume: 0.35,
  uiScale: 100,
  animationLevel: "padrao",
  theme: "lofi",
  screenTransitionAnimationEnabled: true,
  lockWallpaperToMain: false,
};

const STORAGE_KEY = "lembretes-app:settings";

function loadSettings(): SettingsState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULTS;
    const parsed = JSON.parse(raw);
    // uiScale era antes um dos textos "100"/"75"/"50" — converte pro número
    // equivalente se alguém ainda tiver isso salvo de uma versão anterior.
    const uiScale = Number(parsed.uiScale);
    // Quem tinha um tema hoje bloqueado salvo (ex.: o antigo padrão "Guilda")
    // volta pro padrão atual — o tema bloqueado não é acessível por enquanto.
    const theme: ThemeId = LOCKED_THEMES.includes(parsed.theme) ? DEFAULTS.theme : parsed.theme ?? DEFAULTS.theme;
    // Quem salvou o antigo toggle booleano (ligado/desligado) antes deste
    // nível de 3 opções existir: false vira "reduzidas" (preserva a escolha
    // de desligar), true ou ausente vira o padrão "padrao".
    const animationLevel: AnimationLevel =
      parsed.animationLevel ?? (parsed.animationsEnabled === false ? "reduzidas" : DEFAULTS.animationLevel);
    return {
      ...DEFAULTS,
      ...parsed,
      uiScale: Number.isFinite(uiScale) && uiScale > 0 ? uiScale : DEFAULTS.uiScale,
      theme,
      animationLevel,
    };
  } catch {
    return DEFAULTS;
  }
}

interface SettingsContextValue extends SettingsState {
  setSfxVolume: (v: number) => void;
  setMusicEnabled: (v: boolean) => void;
  setMusicVolume: (v: number) => void;
  setUiScale: (v: UiScale) => void;
  setAnimationLevel: (v: AnimationLevel) => void;
  setTheme: (v: ThemeId) => void;
  setScreenTransitionAnimationEnabled: (v: boolean) => void;
  setLockWallpaperToMain: (v: boolean) => void;
}

const SettingsContext = createContext<SettingsContextValue | null>(null);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<SettingsState>(loadSettings);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  useEffect(() => {
    document.documentElement.classList.toggle("no-animations", state.animationLevel === "reduzidas");
    document.documentElement.dataset.animationLevel = state.animationLevel;
  }, [state.animationLevel]);

  // Escala só o texto/informações (font-size da raiz, de onde todo `rem` do
  // app deriva) — fundos de tela cheia usam px/vw/vh/%, então não são afetados.
  useEffect(() => {
    document.documentElement.style.fontSize = `${state.uiScale}%`;
  }, [state.uiScale]);

  useEffect(() => {
    document.documentElement.dataset.theme = state.theme;
  }, [state.theme]);

  useEffect(() => {
    setSfxVolume(state.sfxVolume);
  }, [state.sfxVolume]);

  useEffect(() => {
    if (state.musicEnabled) {
      playMusic(state.musicVolume);
    } else {
      pauseMusic();
    }
  }, [state.musicEnabled]);

  useEffect(() => {
    setMusicVolume(state.musicVolume);
  }, [state.musicVolume]);

  const value: SettingsContextValue = {
    ...state,
    setSfxVolume: (v) => setState((s) => ({ ...s, sfxVolume: v })),
    setMusicEnabled: (v) => setState((s) => ({ ...s, musicEnabled: v })),
    setMusicVolume: (v) => setState((s) => ({ ...s, musicVolume: v })),
    setUiScale: (v) => setState((s) => ({ ...s, uiScale: v })),
    setAnimationLevel: (v) => setState((s) => ({ ...s, animationLevel: v })),
    // Temas bloqueados não são aplicáveis nem por chamada direta.
    setTheme: (v) => setState((s) => (LOCKED_THEMES.includes(v) ? s : { ...s, theme: v })),
    setScreenTransitionAnimationEnabled: (v) => setState((s) => ({ ...s, screenTransitionAnimationEnabled: v })),
    setLockWallpaperToMain: (v) => setState((s) => ({ ...s, lockWallpaperToMain: v })),
  };

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

export function useSettings() {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error("useSettings deve ser usado dentro de SettingsProvider");
  return ctx;
}
