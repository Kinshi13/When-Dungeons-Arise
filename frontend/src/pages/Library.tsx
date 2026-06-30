import { useEffect, useRef, useState } from "react";
import { api, type DocumentMeta, type DocumentType } from "../api";
import BookCoverSheet from "../components/BookCoverSheet";
import PixelDialogBox from "../components/game/PixelDialogBox";
import PixelCharacterIdle from "../components/game/PixelCharacterIdle";
import { bookSpriteFor } from "../bookSprites";
import { TrashIcon, PlusIcon } from "../icons";
import { playSfx } from "../sound";

export default function Library() {
  const [docs, setDocs] = useState<DocumentMeta[]>([]);
  const [selected, setSelected] = useState<DocumentMeta | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  async function handleDelete(id: string, ev: React.MouseEvent) {
    ev.stopPropagation();
    await api.documents.remove(id);
    if (selected?.id === id) setSelected(null);
    await load();
  }

  return (
    <div className="shelf-bg library-page">
      <div className="page" style={{ paddingBottom: 0 }}>
        <h1>Biblioteca da Guilda</h1>
        <div className="reception-scene">
          <PixelCharacterIdle
            name="Bibliotecária"
            spriteUrl="/game/characters/librarian-idle.png"
            frameCount={4}
            fps={6}
            frameAspect={272 / 362}
            size={120}
          />
          <PixelDialogBox speaker="Bibliotecária">
            Bem-vindo à estante. Importe um PDF ou EPUB e ele ganha um lugar aqui — toque num livro pra continuar de
            onde parou. Meta de hoje: ler 20 minutos.
          </PixelDialogBox>
        </div>

        <div className="shelf-header">
          <h2>Estante</h2>
          <button
            className="icon-btn primary"
            onClick={() => fileInputRef.current?.click()}
            aria-label="Importar documento"
          >
            <PlusIcon width={18} height={18} />
          </button>
          <input ref={fileInputRef} type="file" accept=".pdf,.epub" hidden onChange={handleFileChange} />
        </div>
      </div>

      <div className="shelf-content library-shelf-content">
        {docs.length === 0 && <p className="hint">Importe um PDF ou EPUB para começar.</p>}
        <div className="shelf-row">
          {docs.map((doc) => (
            <button
              key={doc.id}
              className="book-spine"
              onClick={() => {
                playSfx("drop");
                setSelected(doc);
              }}
              title={doc.title}
            >
              <img src={bookSpriteFor(doc.id)} alt="" className="book-spine-img" />
              <span
                className="book-spine-delete"
                onClick={(e) => handleDelete(doc.id, e)}
                role="button"
                aria-label="Excluir documento"
              >
                <TrashIcon width={14} height={14} />
              </span>
            </button>
          ))}
        </div>
      </div>

      <BookCoverSheet
        doc={selected}
        spriteUrl={selected ? bookSpriteFor(selected.id) : ""}
        onClose={() => setSelected(null)}
      />
    </div>
  );
}
