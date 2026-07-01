import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import type { DocumentMeta } from "../api";
import { bookSpriteFor } from "../bookSprites";
import { ChevronDownIcon, TrashIcon } from "../icons";
import { playSfx } from "../sound";

interface LibraryDrawerProps {
  open: boolean;
  docs: DocumentMeta[];
  onClose: () => void;
  onSelect: (doc: DocumentMeta) => void;
  onDelete: (id: string) => void;
}

export default function LibraryDrawer({ open, docs, onClose, onSelect, onDelete }: LibraryDrawerProps) {
  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          className="note-fullscreen library-drawer"
          initial={{ y: "100%" }}
          animate={{ y: 0 }}
          exit={{ y: "100%" }}
          transition={{ type: "spring", stiffness: 320, damping: 32 }}
        >
          <div className="page-bg page-bg-blurred-strong" aria-hidden="true">
            <img src="/biblioteca-bg.png" alt="" />
          </div>

          <div className="note-fullscreen-content">
            <div className="note-fullscreen-header">
              <button className="icon-btn" onClick={onClose} aria-label="Fechar">
                <ChevronDownIcon width={20} height={20} /> Fechar
              </button>
              <strong>Todos os arquivos</strong>
            </div>

            <div className="library-drawer-grid">
              {docs.map((doc) => (
                <button
                  key={doc.id}
                  className="library-drawer-item"
                  onClick={() => {
                    playSfx("drop");
                    onSelect(doc);
                  }}
                  title={doc.title}
                >
                  <img src={doc.coverDataUrl || bookSpriteFor(doc.id)} alt="" className="library-drawer-item-cover" />
                  <span className="library-drawer-item-title">{doc.title}</span>
                  <span
                    className="library-drawer-item-delete"
                    role="button"
                    aria-label="Excluir documento"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete(doc.id);
                    }}
                  >
                    <TrashIcon width={13} height={13} />
                  </span>
                </button>
              ))}
              {docs.length === 0 && <p className="hint">Nenhum arquivo importado ainda.</p>}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}
