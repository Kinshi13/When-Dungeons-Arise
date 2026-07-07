import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { sheetBackdropFade, sheetSlideUp } from "../motion";
import { useDragDismiss } from "../useDragDismiss";
import { useNavigate } from "react-router-dom";
import type { DocumentMeta } from "../api";
import { TrashIcon } from "../icons";
import { playSfx } from "../sound";

interface BookCoverSheetProps {
  doc: DocumentMeta | null;
  spriteUrl: string;
  onClose: () => void;
  onDelete: (id: string) => void;
}

function condenseTitle(title: string, maxLen = 28) {
  if (title.length <= maxLen) return title;
  return `${title.slice(0, maxLen - 1).trimEnd()}…`;
}

export default function BookCoverSheet({ doc, spriteUrl, onClose, onDelete }: BookCoverSheetProps) {
  const navigate = useNavigate();
  const { surface, handle, backdropOpacity } = useDragDismiss({ direction: "down", onClose });

  function handleOpen() {
    if (!doc) return;
    playSfx("coin");
    navigate(`/leitor/${doc.id}`);
  }

  function handleDelete() {
    if (!doc) return;
    onDelete(doc.id);
    onClose();
  }

  // Renderizado via portal direto em document.body: garante que o pop-up fique
  // sempre acima da estante/menu lateral, independente da pilha de stacking context
  // de qualquer elemento pai (drawers usam position:fixed + z-index próprios).
  return createPortal(
    <AnimatePresence>
      {doc && (
        <motion.div
          className="book-sheet-backdrop"
          {...sheetBackdropFade}
          style={{ opacity: backdropOpacity }}
          onClick={onClose}
        >
          <motion.div
            className="book-sheet"
            onClick={(e) => e.stopPropagation()}
            {...sheetSlideUp}
            {...surface}
            {...handle}
          >
            <div className="book-sheet-handle" />
            <button className="book-sheet-delete" onClick={handleDelete} aria-label="Excluir documento">
              <TrashIcon width={16} height={16} />
            </button>
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
