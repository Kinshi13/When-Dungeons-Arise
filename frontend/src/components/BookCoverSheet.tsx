import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import type { DocumentMeta } from "../api";
import { playSfx } from "../sound";

interface BookCoverSheetProps {
  doc: DocumentMeta | null;
  spriteUrl: string;
  onClose: () => void;
}

function condenseTitle(title: string, maxLen = 28) {
  if (title.length <= maxLen) return title;
  return `${title.slice(0, maxLen - 1).trimEnd()}…`;
}

export default function BookCoverSheet({ doc, spriteUrl, onClose }: BookCoverSheetProps) {
  const navigate = useNavigate();

  function handleOpen() {
    if (!doc) return;
    playSfx("coin");
    navigate(`/leitor/${doc.id}`);
  }

  // Renderizado via portal direto em document.body: garante que o pop-up fique
  // sempre acima da estante/menu lateral, independente da pilha de stacking context
  // de qualquer elemento pai (drawers usam position:fixed + z-index próprios).
  return createPortal(
    <AnimatePresence>
      {doc && (
        <motion.div
          className="book-sheet-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            className="book-sheet"
            onClick={(e) => e.stopPropagation()}
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", stiffness: 360, damping: 34 }}
          >
            <div className="book-sheet-handle" />
            <button className="book-cover" onClick={handleOpen}>
              <img src={spriteUrl} alt="" className="book-cover-img" />
              <span className="book-cover-title">{condenseTitle(doc.title)}</span>
              <span className="book-cover-hint">Toque para abrir</span>
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}
