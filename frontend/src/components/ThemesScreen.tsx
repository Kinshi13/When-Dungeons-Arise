import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeftIcon, CheckIcon } from "../icons";
import { useSettings, THEME_LABEL, LOCKED_THEMES, type ThemeId } from "../contexts/SettingsContext";
import { playSfx } from "../sound";

interface ThemesScreenProps {
  open: boolean;
  onClose: () => void;
}

const THEME_SWATCH_COLORS: Record<ThemeId, [string, string, string]> = {
  escuro: ["#0f0a1e", "#1c1430", "#ffd23f"],
  claro: ["#33516c", "#7d6a4c", "#7dd3fc"],
  lofi: ["#f3ead9", "#e7b6ad", "#a68fc9"],
};

export default function ThemesScreen({ open, onClose }: ThemesScreenProps) {
  const { theme, setTheme } = useSettings();

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          className="note-fullscreen"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 24 }}
          transition={{ duration: 0.2 }}
        >
          <div className="page-bg page-bg-blurred-strong" aria-hidden="true">
            <img src={theme === "lofi" ? "/lofi-guilda-bg.jpg" : "/guild-reception-bg.png"} alt="" />
          </div>

          <div className="note-fullscreen-content">
            <div className="note-fullscreen-header">
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

            <div className="themes-placeholder">
              <p>Mais temas em breve — em produção, seja paciente.</p>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}
