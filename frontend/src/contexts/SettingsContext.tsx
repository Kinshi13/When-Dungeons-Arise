import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { setSfxVolume, playMusic, pauseMusic, setMusicVolume } from "../sound";

export type UiScale = "100" | "75" | "50";

export const UI_ZOOM_BY_SCALE: Record<UiScale, number> = {
  "100": 1,
  "75": 0.75,
  "50": 0.5,
};

interface SettingsState {
  sfxVolume: number;
  musicEnabled: boolean;
  musicVolume: number;
  uiScale: UiScale;
  animationsEnabled: boolean;
}

const DEFAULTS: SettingsState = {
  sfxVolume: 0.6,
  musicEnabled: false,
  musicVolume: 0.35,
  uiScale: "100",
  animationsEnabled: true,
};

const STORAGE_KEY = "lembretes-app:settings";

function loadSettings(): SettingsState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULTS;
    return { ...DEFAULTS, ...JSON.parse(raw) };
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
  };

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

export function useSettings() {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error("useSettings deve ser usado dentro de SettingsProvider");
  return ctx;
}
