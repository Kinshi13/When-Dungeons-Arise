import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeftIcon } from "../icons";

interface ThemesScreenProps {
  open: boolean;
  onClose: () => void;
}

export default function ThemesScreen({ open, onClose }: ThemesScreenProps) {
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
            <img src="/guild-reception-bg.png" alt="" />
          </div>

          <div className="note-fullscreen-content">
            <div className="note-fullscreen-header">
              <button className="icon-btn" onClick={onClose} aria-label="Voltar">
                <ChevronLeftIcon width={20} height={20} /> Voltar
              </button>
              <strong>Temas</strong>
            </div>

            <div className="themes-placeholder">
              <p>Em produção, seja paciente.</p>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}
