import { useEffect, useRef, useState, type TouchEvent } from "react";
import { api, type DocumentMeta, type DocumentType } from "../api";
import BookCoverSheet from "../components/BookCoverSheet";
import LibraryDrawer from "../components/LibraryDrawer";
import { bookSpriteFor } from "../bookSprites";
import { PlusIcon, ChevronUpIcon } from "../icons";
import { playSfx } from "../sound";
import { useSettings } from "../contexts/SettingsContext";

// Regiões das 4 prateleiras utilizáveis (a primeira, decorativa, fica de fora),
// em % da altura/largura da arte da estante — descobertas inspecionando as
// faixas de brilho das tábuas na imagem de referência (941x1672).
const SHELVES = [
  { top: 22.49, height: 15.25 },
  { top: 38.34, height: 17.1 },
  { top: 56.04, height: 16.51 },
  { top: 73.15, height: 15.37 },
];

const SWIPE_THRESHOLD = 70;

export default function Library() {
  const { theme } = useSettings();
  const isLofi = theme === "lofi";
  const [docs, setDocs] = useState<DocumentMeta[]>([]);
  const [selected, setSelected] = useState<DocumentMeta | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const touchStartY = useRef<number | null>(null);

  async function load() {
    setDocs(await api.documents.list());
  }

  useEffect(() => {
    load();
  }, []);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    const type: DocumentType = file.name.toLowerCase().endsWith(".epub") ? "epub" : "pdf";
    await api.documents.add(file, type);
    playSfx("coin");
    await load();
  }

  async function handleDelete(id: string) {
    await api.documents.remove(id);
    if (selected?.id === id) setSelected(null);
    await load();
  }

  function openBook(doc: DocumentMeta) {
    playSfx("drop");
    setSelected(doc);
  }

  function handleTouchStart(e: TouchEvent) {
    touchStartY.current = e.touches[0].clientY;
  }

  function handleTouchEnd(e: TouchEvent) {
    if (touchStartY.current === null) return;
    const dy = e.changedTouches[0].clientY - touchStartY.current;
    touchStartY.current = null;
    if (dy < -SWIPE_THRESHOLD) {
      playSfx("drop");
      setDrawerOpen(true);
    } else if (dy > SWIPE_THRESHOLD) {
      playSfx("coin");
      fileInputRef.current?.click();
    }
  }

  return (
    <div className="library-fullscreen" onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>
      <div className="library-shelf-frame">
        {isLofi ? (
          <div className="lofi-scene lofi-scene-biblioteca library-shelf-img" aria-hidden="true" />
        ) : (
          <img src="/biblioteca-bg.png" alt="Estante da biblioteca" className="library-shelf-img" />
        )}

        <button
          className="library-import-zone library-import-top"
          onClick={() => fileInputRef.current?.click()}
          aria-label="Importar documento"
        >
          <span className="library-import-badge">
            <PlusIcon width={15} height={15} />
          </span>
        </button>
        <button
          className="library-import-zone library-import-base"
          onClick={() => fileInputRef.current?.click()}
          aria-label="Importar documento"
        >
          <span className="library-import-badge">
            <PlusIcon width={15} height={15} />
          </span>
        </button>

        {SHELVES.map((shelf, i) => {
          const shelfDocs = docs.filter((_, idx) => idx % SHELVES.length === i);
          return (
            <div
              key={i}
              className="library-shelf-row"
              style={{ top: `${shelf.top}%`, height: `${shelf.height}%` }}
            >
              {isLofi && <div className="lofi-shelf-line" aria-hidden="true" />}
              {shelfDocs.map((doc) => (
                <button
                  key={doc.id}
                  className="library-book-cover"
                  onClick={() => openBook(doc)}
                  title={doc.title}
                >
                  <img src={doc.coverDataUrl || bookSpriteFor(doc.id)} alt="" />
                </button>
              ))}
            </div>
          );
        })}
      </div>

      <button className="library-drawer-handle" onClick={() => setDrawerOpen(true)} aria-label="Ver todos os arquivos">
        <ChevronUpIcon width={14} height={14} />
        Todos os arquivos
      </button>

      <input ref={fileInputRef} type="file" accept=".pdf,.epub" hidden onChange={handleFileChange} />

      <LibraryDrawer
        open={drawerOpen}
        docs={docs}
        onClose={() => setDrawerOpen(false)}
        onSelect={(doc) => {
          setDrawerOpen(false);
          openBook(doc);
        }}
        onDelete={handleDelete}
      />

      <BookCoverSheet
        doc={selected}
        spriteUrl={selected ? selected.coverDataUrl || bookSpriteFor(selected.id) : ""}
        onClose={() => setSelected(null)}
        onDelete={handleDelete}
      />
    </div>
  );
}
