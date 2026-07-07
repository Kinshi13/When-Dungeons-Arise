import { useEffect, useRef, useState, type ChangeEvent, type TouchEvent as ReactTouchEvent } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { fullscreenSheetFade } from "../motion";
import { ChevronLeftIcon, TrashIcon, PlusIcon } from "../icons";
import { playSfx } from "../sound";
import {
  WALLPAPER_SLOT_IDS,
  type WallpaperSlotId,
  type WallpaperScreenKey,
  type WallpaperConfig,
  type WallpaperAdjust,
  loadWallpaperConfig,
  saveWallpaperConfig,
  getSlotAdjust,
  saveWallpaperImage,
  getWallpaperUrl,
  clearWallpaperSlot,
} from "../wallpaperStore";
import { notifyWallpaperChanged } from "../wallpaperEvents";

interface WallpaperSettingsScreenProps {
  open: boolean;
  onClose: () => void;
}

const SCREEN_LABEL: Record<WallpaperScreenKey, string> = {
  guilda: "Recepção",
  mural: "Mural",
  tesouraria: "Tesouraria",
  tempo: "Sala do Tempo",
  ajustes: "Ajustes",
  diario: "Diário",
  biblioteca: "Biblioteca",
};
const SCREEN_ORDER: WallpaperScreenKey[] = ["guilda", "mural", "tesouraria", "tempo", "ajustes", "diario", "biblioteca"];

function clamp(v: number, min: number, max: number) {
  return Math.max(min, Math.min(max, v));
}

interface AdjustPanelProps {
  slotId: WallpaperSlotId;
  imageUrl: string;
  adjust: WallpaperAdjust;
  onChange: (patch: Partial<WallpaperAdjust>) => void;
  onClose: () => void;
}

// Painel de ajuste de zoom/posição/desfoque de UMA imagem — arrastar na
// prévia reposiciona (background-position), os sliders cuidam de zoom
// (background-size) e desfoque (filter: blur). Fica por cima da tela de
// papel de parede, não é um portal à parte (evita empilhar AnimatePresence).
function WallpaperAdjustPanel({ slotId, imageUrl, adjust, onChange, onClose }: AdjustPanelProps) {
  const dragRef = useRef<{ startX: number; startY: number; fromX: number; fromY: number } | null>(null);

  function handleTouchStart(e: ReactTouchEvent) {
    dragRef.current = {
      startX: e.touches[0].clientX,
      startY: e.touches[0].clientY,
      fromX: adjust.offsetX,
      fromY: adjust.offsetY,
    };
  }

  function handleTouchMove(e: ReactTouchEvent) {
    if (!dragRef.current) return;
    const dx = e.touches[0].clientX - dragRef.current.startX;
    const dy = e.touches[0].clientY - dragRef.current.startY;
    onChange({
      offsetX: clamp(dragRef.current.fromX - dx / 3, -50, 50),
      offsetY: clamp(dragRef.current.fromY - dy / 3, -50, 50),
    });
  }

  function handleTouchEnd() {
    dragRef.current = null;
  }

  return (
    <div className="wallpaper-adjust-panel">
      <div className="note-fullscreen-header">
        <button className="icon-btn" onClick={onClose} aria-label="Voltar">
          <ChevronLeftIcon width={20} height={20} /> Voltar
        </button>
        <strong>Ajustar imagem {slotId}</strong>
      </div>

      <div className="wallpaper-adjust-preview" onTouchStart={handleTouchStart} onTouchMove={handleTouchMove} onTouchEnd={handleTouchEnd}>
        <img
          src={imageUrl}
          alt=""
          className="wallpaper-adjust-preview-img"
          style={{
            transform: `scale(${adjust.zoom}) translate(${adjust.offsetX}%, ${adjust.offsetY}%)`,
            filter: adjust.blur > 0 ? `blur(${adjust.blur}px)` : undefined,
          }}
        />
        <span className="wallpaper-adjust-hint">Arraste pra posicionar</span>
      </div>

      <div className="wallpaper-adjust-controls">
        <label className="wallpaper-adjust-slider">
          <span>Zoom</span>
          <input
            type="range"
            min={1}
            max={3}
            step={0.05}
            value={adjust.zoom}
            onChange={(e) => onChange({ zoom: Number(e.target.value) })}
          />
        </label>
        <label className="wallpaper-adjust-slider">
          <span>Desfoque</span>
          <input
            type="range"
            min={0}
            max={20}
            step={1}
            value={adjust.blur}
            onChange={(e) => onChange({ blur: Number(e.target.value) })}
          />
        </label>
      </div>
    </div>
  );
}

export default function WallpaperSettingsScreen({ open, onClose }: WallpaperSettingsScreenProps) {
  const [config, setConfig] = useState<WallpaperConfig>(() => loadWallpaperConfig());
  const [slotUrls, setSlotUrls] = useState<Partial<Record<WallpaperSlotId, string>>>({});
  const [adjustingSlot, setAdjustingSlot] = useState<WallpaperSlotId | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pendingSlotRef = useRef<WallpaperSlotId | null>(null);

  async function refreshUrls() {
    const entries = await Promise.all(WALLPAPER_SLOT_IDS.map(async (id) => [id, await getWallpaperUrl(id)] as const));
    setSlotUrls(Object.fromEntries(entries.filter(([, url]) => url)));
  }

  useEffect(() => {
    if (open) {
      setConfig(loadWallpaperConfig());
      refreshUrls();
    } else {
      setAdjustingSlot(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  function persist(updated: WallpaperConfig) {
    setConfig(updated);
    saveWallpaperConfig(updated);
    notifyWallpaperChanged();
  }

  function handlePickImage(slotId: WallpaperSlotId) {
    pendingSlotRef.current = slotId;
    fileInputRef.current?.click();
  }

  async function handleFileChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    const slotId = pendingSlotRef.current;
    if (!file || !slotId) return;
    await saveWallpaperImage(slotId, file);
    await refreshUrls();
    playSfx("coin");
    notifyWallpaperChanged();
    setAdjustingSlot(slotId);
  }

  async function handleRemoveSlot(slotId: WallpaperSlotId) {
    const updated = await clearWallpaperSlot(slotId, config);
    persist(updated);
    await refreshUrls();
  }

  function handleSetMode(mode: WallpaperConfig["mode"]) {
    persist({ ...config, mode });
  }

  function handleSetMainSlot(slotId: WallpaperSlotId) {
    persist({ ...config, mainSlot: slotId });
  }

  function handleAssign(screen: WallpaperScreenKey, slotId: string) {
    const assignments = { ...config.assignments };
    if (slotId) assignments[screen] = slotId as WallpaperSlotId;
    else delete assignments[screen];
    persist({ ...config, assignments });
  }

  function handleAdjustChange(slotId: WallpaperSlotId, patch: Partial<WallpaperAdjust>) {
    persist({ ...config, adjusts: { ...config.adjusts, [slotId]: { ...getSlotAdjust(config, slotId), ...patch } } });
  }

  const uploadedSlots = WALLPAPER_SLOT_IDS.filter((id) => slotUrls[id]);

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          className="note-fullscreen wallpaper-settings-screen"
          {...fullscreenSheetFade}
        >
          <div className="lofi-scene lofi-scene-ajustes" aria-hidden="true" />

          <div className="note-fullscreen-content">
            <div className="note-fullscreen-header">
              <button className="icon-btn" onClick={onClose} aria-label="Voltar">
                <ChevronLeftIcon width={20} height={20} /> Voltar
              </button>
              <strong>Papel de parede</strong>
            </div>

            <section className="wallpaper-slots">
              <h2>Suas imagens (até 3)</h2>
              <div className="wallpaper-slot-grid">
                {WALLPAPER_SLOT_IDS.map((slotId) => (
                  <div key={slotId} className="wallpaper-slot-card">
                    {slotUrls[slotId] ? (
                      <>
                        <button className="wallpaper-slot-thumb" onClick={() => setAdjustingSlot(slotId)} aria-label={`Ajustar imagem ${slotId}`}>
                          <img src={slotUrls[slotId]} alt="" />
                        </button>
                        <button
                          className="wallpaper-slot-remove"
                          onClick={() => handleRemoveSlot(slotId)}
                          aria-label={`Remover imagem ${slotId}`}
                        >
                          <TrashIcon width={14} height={14} />
                        </button>
                      </>
                    ) : (
                      <button className="wallpaper-slot-empty" onClick={() => handlePickImage(slotId)} aria-label="Adicionar imagem">
                        <PlusIcon width={20} height={20} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
              <p className="hint">Toque numa imagem já escolhida pra ajustar zoom, posição e desfoque.</p>
            </section>

            <section className="wallpaper-mode">
              <h2>Onde aplicar</h2>
              <div className="filters">
                <button className={config.mode === "principal" ? "filter active" : "filter"} onClick={() => handleSetMode("principal")}>
                  Só na Recepção
                </button>
                <button className={config.mode === "todas" ? "filter active" : "filter"} onClick={() => handleSetMode("todas")}>
                  Uma por tela
                </button>
              </div>

              {config.mode === "principal" ? (
                uploadedSlots.length === 0 ? (
                  <p className="hint">Adicione uma imagem acima pra escolher aqui.</p>
                ) : (
                  <div className="filters">
                    {uploadedSlots.map((slotId) => (
                      <button
                        key={slotId}
                        className={config.mainSlot === slotId ? "filter active" : "filter"}
                        onClick={() => handleSetMainSlot(slotId)}
                      >
                        Imagem {slotId}
                      </button>
                    ))}
                  </div>
                )
              ) : (
                <div className="wallpaper-screen-list">
                  {SCREEN_ORDER.map((screen) => (
                    <label key={screen} className="wallpaper-screen-row">
                      <span>{SCREEN_LABEL[screen]}</span>
                      <select value={config.assignments[screen] ?? ""} onChange={(e) => handleAssign(screen, e.target.value)}>
                        <option value="">Padrão do tema</option>
                        {uploadedSlots.map((slotId) => (
                          <option key={slotId} value={slotId}>
                            Imagem {slotId}
                          </option>
                        ))}
                      </select>
                    </label>
                  ))}
                </div>
              )}
            </section>
          </div>

          <input ref={fileInputRef} type="file" accept="image/*" hidden onChange={handleFileChange} />

          {adjustingSlot && slotUrls[adjustingSlot] && (
            <WallpaperAdjustPanel
              slotId={adjustingSlot}
              imageUrl={slotUrls[adjustingSlot]!}
              adjust={getSlotAdjust(config, adjustingSlot)}
              onChange={(patch) => handleAdjustChange(adjustingSlot, patch)}
              onClose={() => setAdjustingSlot(null)}
            />
          )}
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}
