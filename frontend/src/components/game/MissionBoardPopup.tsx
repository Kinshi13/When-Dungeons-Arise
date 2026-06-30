import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import type { Mission } from "../../game/missionGenerator";
import DailyMissionSummary from "./DailyMissionSummary";

interface MissionBoardPopupProps {
  open: boolean;
  missions: Mission[];
  onClose: () => void;
  onViewAll: () => void;
}

// Pop-up que abre ao tocar no mural na Recepção: fundo levemente desfocado, janela com a arte
// real do quadro (mission-board-popup.png) animando com fade-in + zoom suave (sem o "bounce" de
// mola do RewardPopup, que pediria atenção demais pra uma interação rápida de consulta).
export default function MissionBoardPopup({ open, missions, onClose, onViewAll }: MissionBoardPopupProps) {
  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          className="mission-popup-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={onClose}
        >
          <motion.div
            className="mission-popup"
            onClick={(e) => e.stopPropagation()}
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.92 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
          >
            <img src="/game/ui/mission-board-popup.png" alt="" className="mission-popup-art" />
            <h2>Mural de Missões</h2>
            {missions.length > 0 ? (
              <DailyMissionSummary missions={missions} />
            ) : (
              <p className="hint">Sem missões pendentes pra hoje.</p>
            )}
            <div className="mission-popup-actions">
              <button className="popup-close" onClick={onViewAll}>
                Ver mural completo
              </button>
              <button className="icon-btn" onClick={onClose} aria-label="Fechar">
                Fechar
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}
