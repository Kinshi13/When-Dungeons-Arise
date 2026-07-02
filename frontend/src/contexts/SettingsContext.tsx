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

export type ThemeId = "escuro" | "claro" | "lofi";

// Ordem daqui é a ordem de exibição na tela de Temas.
export const THEME_LABEL: Record<ThemeId, string> = {
  lofi: "Lo-fi (padrão)",
  claro: "Claro",
  escuro: "Guilda",
};

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
  animationsEnabled: boolean;
  theme: ThemeId;
}

const DEFAULTS: SettingsState = {
  sfxVolume: 0.6,
  musicEnabled: false,
  musicVolume: 0.35,
  uiScale: 100,
  animationsEnabled: true,
  theme: "lofi",
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
    return {
      ...DEFAULTS,
      ...parsed,
      uiScale: Number.isFinite(uiScale) && uiScale > 0 ? uiScale : DEFAULTS.uiScale,
      theme,
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
  setAnimationsEnabled: (v: boolean) => void;
  setTheme: (v: ThemeId) => void;
}

const SettingsContext = createContext<SettingsContextValue | null>(null);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<SettingsState>(loadSettings);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  useEffect(() => {
    document.documentElement.classList.toggle("no-animations", !state.animationsEnabled);
  }, [state.animationsEnabled]);

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
    setAnimationsEnabled: (v) => setState((s) => ({ ...s, animationsEnabled: v })),
    // Temas bloqueados não são aplicáveis nem por chamada direta.
    setTheme: (v) => setState((s) => (LOCKED_THEMES.includes(v) ? s : { ...s, theme: v })),
  };

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

export function useSettings() {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error("useSettings deve ser usado dentro de SettingsProvider");
  return ctx;
}
