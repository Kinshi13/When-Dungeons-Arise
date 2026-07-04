export type EpubFontFamily = "serif" | "sans" | "readable";
export type EpubTheme = "claro" | "escuro" | "pastel";

export interface EpubReaderSettings {
  fontFamily: EpubFontFamily;
  theme: EpubTheme;
}

const STORAGE_KEY = "lembretes-app:epub-reader-settings";

const DEFAULT_SETTINGS: EpubReaderSettings = { fontFamily: "serif", theme: "claro" };

export function loadEpubReaderSettings(): EpubReaderSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? { ...DEFAULT_SETTINGS, ...JSON.parse(raw) } : DEFAULT_SETTINGS;
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function saveEpubReaderSettings(settings: EpubReaderSettings) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
}

// Famílias só com fontes seguras de sistema — o conteúdo do EPUB roda dentro
// de um iframe próprio do epub.js, que não herda as webfonts (@fontsource)
// carregadas no documento principal.
export const EPUB_FONT_FAMILIES: Record<EpubFontFamily, { label: string; css: string }> = {
  serif: { label: "Serifada", css: "Georgia, 'Times New Roman', serif" },
  sans: { label: "Redonda", css: "'Segoe UI', Verdana, Arial, sans-serif" },
  readable: { label: "Legível", css: "Verdana, Tahoma, sans-serif" },
};

export const EPUB_THEMES: Record<EpubTheme, { label: string; background: string; color: string }> = {
  claro: { label: "Claro", background: "#ffffff", color: "#1a1a1a" },
  escuro: { label: "Escuro", background: "#1c1c1c", color: "#e8e0d0" },
  pastel: { label: "Pastel", background: "#f4ecd8", color: "#5b4636" },
};
