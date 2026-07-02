import { saveFile, loadFile, deleteFile } from "./blobStore";

// Papel de parede personalizado (tema "Lo-fi Personalizado"): até 3 imagens
// guardadas no aparelho (IndexedDB, mesmo mecanismo dos documentos da
// Biblioteca e do som do despertador), cada uma com seu próprio ajuste de
// zoom/posição/blur — e um mapa de qual imagem aparece em qual tela, ou uma
// única imagem só na Recepção.

export const WALLPAPER_SLOT_IDS = ["1", "2", "3"] as const;
export type WallpaperSlotId = (typeof WALLPAPER_SLOT_IDS)[number];

// Mesmas 7 áreas da barra inferior (ver activeTabOf em App.tsx).
export type WallpaperScreenKey = "diario" | "mural" | "tesouraria" | "guilda" | "tempo" | "ajustes" | "biblioteca";

export type WallpaperMode = "todas" | "principal";

export interface WallpaperAdjust {
  zoom: number; // 1 (sem zoom) a 3
  offsetX: number; // -50 a 50 (%, deslocamento a partir do centro)
  offsetY: number; // -50 a 50
  blur: number; // 0 a 20 (px)
}

export interface WallpaperConfig {
  mode: WallpaperMode;
  // Usado quando mode === "todas": tela -> id do slot.
  assignments: Partial<Record<WallpaperScreenKey, WallpaperSlotId>>;
  // Usado quando mode === "principal": só a Recepção recebe papel de parede.
  mainSlot: WallpaperSlotId | null;
  adjusts: Partial<Record<WallpaperSlotId, WallpaperAdjust>>;
}

export const DEFAULT_WALLPAPER_ADJUST: WallpaperAdjust = { zoom: 1, offsetX: 0, offsetY: 0, blur: 0 };

const DEFAULT_CONFIG: WallpaperConfig = {
  mode: "principal",
  assignments: {},
  mainSlot: null,
  adjusts: {},
};

const CONFIG_KEY = "lembretes-app:wallpaper-config";

export function loadWallpaperConfig(): WallpaperConfig {
  try {
    const raw = localStorage.getItem(CONFIG_KEY);
    if (!raw) return { ...DEFAULT_CONFIG };
    return { ...DEFAULT_CONFIG, ...JSON.parse(raw) };
  } catch {
    return { ...DEFAULT_CONFIG };
  }
}

export function saveWallpaperConfig(config: WallpaperConfig) {
  localStorage.setItem(CONFIG_KEY, JSON.stringify(config));
}

export function getSlotAdjust(config: WallpaperConfig, slotId: WallpaperSlotId): WallpaperAdjust {
  return config.adjusts[slotId] ?? DEFAULT_WALLPAPER_ADJUST;
}

function slotFileId(slotId: WallpaperSlotId): string {
  return `wallpaper-${slotId}`;
}

// Cache de object URLs em memória — o blob em si vive no IndexedDB, mas
// recriar a URL a cada render do fundo geraria uma nova URL (e vazaria a
// anterior) toda vez. Só invalida quando a imagem do slot realmente muda.
const urlCache = new Map<WallpaperSlotId, string>();

export async function getWallpaperUrl(slotId: WallpaperSlotId): Promise<string | null> {
  const cached = urlCache.get(slotId);
  if (cached) return cached;
  const blob = await loadFile(slotFileId(slotId));
  if (!blob) return null;
  const url = URL.createObjectURL(blob);
  urlCache.set(slotId, url);
  return url;
}

function invalidateWallpaperUrl(slotId: WallpaperSlotId) {
  const cached = urlCache.get(slotId);
  if (cached) URL.revokeObjectURL(cached);
  urlCache.delete(slotId);
}

export async function saveWallpaperImage(slotId: WallpaperSlotId, file: File) {
  await saveFile(slotFileId(slotId), file);
  invalidateWallpaperUrl(slotId);
}

export async function hasWallpaperImage(slotId: WallpaperSlotId): Promise<boolean> {
  return !!(await loadFile(slotFileId(slotId)));
}

// Remove a imagem do slot e limpa qualquer referência a ele (atribuições por
// tela, slot principal, ajuste salvo) — evita ficar com uma tela apontando
// pra um slot vazio.
export async function clearWallpaperSlot(slotId: WallpaperSlotId, config: WallpaperConfig): Promise<WallpaperConfig> {
  await deleteFile(slotFileId(slotId));
  invalidateWallpaperUrl(slotId);

  const assignments = { ...config.assignments };
  for (const key of Object.keys(assignments) as WallpaperScreenKey[]) {
    if (assignments[key] === slotId) delete assignments[key];
  }
  const adjusts = { ...config.adjusts };
  delete adjusts[slotId];

  return {
    ...config,
    assignments,
    mainSlot: config.mainSlot === slotId ? null : config.mainSlot,
    adjusts,
  };
}

// A que tela (das 7 da barra) uma rota pertence, pro mapeamento de papel de
// parede — mesma cobertura de activeTabOf (App.tsx) e flatSequenceSection
// (useSwipeNav.ts), reunidas aqui pra não depender de importar de App.tsx.
export function wallpaperScreenOf(pathname: string): WallpaperScreenKey {
  if (pathname.startsWith("/diario")) return "diario";
  if (pathname === "/biblioteca") return "biblioteca";
  if (pathname.startsWith("/missoes")) return "mural";
  if (pathname.startsWith("/tesouraria")) return "tesouraria";
  if (pathname.startsWith("/sala-do-tempo")) return "tempo";
  if (pathname.startsWith("/regras")) return "ajustes";
  return "guilda";
}

// Slot que deve aparecer nesta tela, considerando o modo — null quando a
// tela deve cair no visual padrão do Lo-fi (gradiente/ilustração normal).
export function slotForScreen(config: WallpaperConfig, screen: WallpaperScreenKey): WallpaperSlotId | null {
  if (config.mode === "principal") {
    return screen === "guilda" ? config.mainSlot : null;
  }
  return config.assignments[screen] ?? null;
}
