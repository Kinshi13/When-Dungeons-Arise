import { useState } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { fullscreenSheetFade } from "../motion";
import { useDragDismiss } from "../useDragDismiss";
import { useOverlayBackClose } from "../useOverlayBackClose";
import { ChevronLeftIcon, CheckIcon, ChevronRightIcon } from "../icons";
import { useSettings, THEME_LABEL, LOCKED_THEMES, isLofiTheme, type ThemeId } from "../contexts/SettingsContext";
import { playSfx } from "../sound";
import WallpaperSettingsScreen from "./WallpaperSettingsScreen";

interface ThemesScreenProps {
  open: boolean;
  onClose: () => void;
}

const THEME_SWATCH_COLORS: Record<ThemeId, [string, string, string]> = {
  escuro: ["#0f0a1e", "#1c1430", "#ffd23f"],
  claro: ["#23242a", "#2e3037", "#cf8a70"],
  lofi: ["#f3ead9", "#e7b6ad", "#a68fc9"],
  // Mesma paleta do Lo-fi padrão (é dela que herda todas as variáveis) — só
  // o fundo muda, pro papel de parede escolhido pelo usuário.
  personalizado: ["#f3ead9", "#e7b6ad", "#a68fc9"],
};

export default function ThemesScreen({ open, onClose }: ThemesScreenProps) {
  const { theme, setTheme } = useSettings();
  const [wallpaperOpen, setWallpaperOpen] = useState(false);
  const { surface, handle } = useDragDismiss({ direction: "down", onClose });
  useOverlayBackClose(open, onClose);

  return createPortal(
    <>
      <AnimatePresence>
        {open && (
          <motion.div
            className="note-fullscreen"
            {...fullscreenSheetFade}
            {...surface}
          >
            <div className="page-bg page-bg-blurred-strong" aria-hidden="true">
              {isLofiTheme(theme) ? (
                <div className="page-bg-gradient-backdrop" />
              ) : (
                <img src="/guild-reception-bg.png" alt="" />
              )}
            </div>

            <div className="note-fullscreen-content">
              <div className="note-fullscreen-header" {...handle}>
                <button className="icon-btn" onClick={onClose} aria-label="Voltar">
                  <ChevronLeftIcon width={20} height={20} /> Voltar
                </button>
                <strong>Temas</strong>
              </div>

              <div className="theme-picker">
                {(Object.keys(THEME_LABEL) as ThemeId[]).map((id) => {
                  const locked = LOCKED_THEMES.includes(id);
                  return (
                    <button
                      key={id}
                      className={`theme-swatch-card${theme === id ? " active" : ""}${locked ? " locked" : ""}`}
                      disabled={locked}
                      onClick={() => {
                        playSfx("coin");
                        setTheme(id);
                      }}
                    >
                      <span className="theme-swatch-preview">
                        {THEME_SWATCH_COLORS[id].map((color, i) => (
                          <span key={i} className="theme-swatch-dot" style={{ background: color }} />
                        ))}
                      </span>
                      <span>{THEME_LABEL[id]}</span>
                      {theme === id && <CheckIcon width={16} height={16} />}
                      {locked && <span className="theme-locked-badge">Bloqueado</span>}
                    </button>
                  );
                })}
              </div>

              {theme === "personalizado" && (
                <button
                  className="notif-center-entry"
                  onClick={() => {
                    playSfx("coin");
                    setWallpaperOpen(true);
                  }}
                >
                  <span>Configurar papel de parede</span>
                  <ChevronRightIcon width={16} height={16} />
                </button>
              )}

              <div className="themes-placeholder">
                <p>Mais temas em breve — em produção, seja paciente.</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      <WallpaperSettingsScreen open={wallpaperOpen} onClose={() => setWallpaperOpen(false)} />
    </>,
    document.body
  );
}
