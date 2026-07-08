import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { api, type Annotation, type DocumentMeta } from "../api";
import PdfReader, { type ReaderHandle } from "../components/PdfReader";
import EpubReader, { type EpubTocItem } from "../components/EpubReader";
import { ChevronLeftIcon, ChevronRightIcon, MinusIcon, PlusIcon, MoonIcon, TrashIcon, DiaryIcon, BookIcon } from "../icons";
import {
  EPUB_FONT_FAMILIES,
  EPUB_THEMES,
  loadEpubReaderSettings,
  saveEpubReaderSettings,
  type EpubFontFamily,
  type EpubTheme,
} from "../epubReaderSettings";

const MAX_ZOOM_STEP = 3;

export default function ReaderScreen() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [doc, setDoc] = useState<DocumentMeta | null>(null);
  const [blob, setBlob] = useState<Blob | null>(null);
  const [initialLocation, setInitialLocation] = useState<string | undefined>(undefined);
  const [notFound, setNotFound] = useState(false);
  const [zoomStep, setZoomStep] = useState(0);
  const [dim, setDim] = useState(false);
  const [pageInfo, setPageInfo] = useState<{ page: number; numPages: number } | null>(null);
  const [epubSettings, setEpubSettings] = useState(() => loadEpubReaderSettings());
  const [openPanel, setOpenPanel] = useState<"toc" | "annotations" | "epubSettings" | null>(null);
  const [currentLocation, setCurrentLocation] = useState<string | undefined>(undefined);
  const [annotations, setAnnotations] = useState<Annotation[]>([]);
  const [newAnnotationNote, setNewAnnotationNote] = useState("");
  const [toc, setToc] = useState<EpubTocItem[]>([]);
  const readerRef = useRef<ReaderHandle>(null);

  useEffect(() => {
    if (!id) return;
    (async () => {
      const meta = await api.documents.getMeta(id);
      if (!meta) {
        setNotFound(true);
        return;
      }
      const [fileBlob, progress, annotationsData] = await Promise.all([
        api.documents.getFile(id),
        api.readingProgress.get(id),
        api.annotations.list(id),
      ]);
      setDoc(meta);
      setBlob(fileBlob ?? null);
      setInitialLocation(progress?.location);
      setCurrentLocation(progress?.location);
      setAnnotations(annotationsData);
    })();
  }, [id]);

  function handleBack() {
    navigate(-1);
  }

  function saveProgress(location: string) {
    setCurrentLocation(location);
    if (id) api.readingProgress.save(id, location);
  }

  async function handleAddAnnotation() {
    if (!id || !currentLocation || !newAnnotationNote.trim()) return;
    await api.annotations.create(id, currentLocation, newAnnotationNote.trim());
    setNewAnnotationNote("");
    setAnnotations(await api.annotations.list(id));
  }

  async function handleDeleteAnnotation(annotationId: string) {
    await api.annotations.remove(annotationId);
    if (id) setAnnotations(await api.annotations.list(id));
  }

  function handleJumpToAnnotation(location: string) {
    readerRef.current?.goTo(location);
    setOpenPanel(null);
  }

  function handleJumpToChapter(href: string) {
    readerRef.current?.goTo(href);
    setOpenPanel(null);
  }

  function handleToggleZoom() {
    setZoomStep((z) => (z === 0 ? MAX_ZOOM_STEP : 0));
  }

  function handleSetFontFamily(fontFamily: EpubFontFamily) {
    const updated = { ...epubSettings, fontFamily };
    setEpubSettings(updated);
    saveEpubReaderSettings(updated);
  }

  function handleSetTheme(theme: EpubTheme) {
    const updated = { ...epubSettings, theme };
    setEpubSettings(updated);
    saveEpubReaderSettings(updated);
  }

  const atFirstPage = doc?.type === "pdf" && !!pageInfo && pageInfo.page <= 1;
  const atLastPage = doc?.type === "pdf" && !!pageInfo && pageInfo.page >= pageInfo.numPages;
  const isEpub = doc?.type === "epub";

  return (
    <div className="reader-fullscreen">
      <div className="reader-fullscreen-header">
        <button className="icon-btn" onClick={handleBack} aria-label="Voltar para a estante">
          <ChevronLeftIcon width={18} height={18} />
        </button>
        <strong className="reader-fullscreen-title">{doc?.title ?? "Carregando..."}</strong>
        {isEpub && toc.length > 0 && (
          <button
            className={`icon-btn${openPanel === "toc" ? " active" : ""}`}
            onClick={() => setOpenPanel((p) => (p === "toc" ? null : "toc"))}
            aria-label="Capítulos"
          >
            <BookIcon width={16} height={16} />
          </button>
        )}
        <button
          className={`icon-btn${openPanel === "annotations" ? " active" : ""}`}
          onClick={() => setOpenPanel((p) => (p === "annotations" ? null : "annotations"))}
          aria-label="Anotações"
        >
          <DiaryIcon width={16} height={16} />
        </button>
        {isEpub && (
          <button
            className={`icon-btn reader-aa-btn${openPanel === "epubSettings" ? " active" : ""}`}
            onClick={() => setOpenPanel((p) => (p === "epubSettings" ? null : "epubSettings"))}
            aria-label="Fonte e tema de leitura"
          >
            Aa
          </button>
        )}
      </div>

      {openPanel === "toc" && toc.length > 0 && (
        <div className="epub-settings-panel reader-panel-scroll">
          {toc.map((item) => (
            <button key={item.href} className="reader-panel-item" onClick={() => handleJumpToChapter(item.href)}>
              {item.label}
            </button>
          ))}
        </div>
      )}

      {openPanel === "annotations" && (
        <div className="epub-settings-panel reader-panel-scroll">
          <form
            className="reader-annotation-form"
            onSubmit={(e) => {
              e.preventDefault();
              handleAddAnnotation();
            }}
          >
            <input
              placeholder={doc?.type === "pdf" ? "Anotação nesta página..." : "Anotação neste trecho..."}
              value={newAnnotationNote}
              onChange={(e) => setNewAnnotationNote(e.target.value)}
            />
            <button type="submit" className="icon-btn primary" aria-label="Salvar anotação">
              <PlusIcon width={16} height={16} />
            </button>
          </form>
          {annotations.length === 0 && <p className="hint">Nenhuma anotação neste livro ainda.</p>}
          {annotations.map((ann) => (
            <div key={ann.id} className="reader-annotation-item">
              <button className="reader-panel-item" onClick={() => handleJumpToAnnotation(ann.location)}>
                {ann.note}
              </button>
              <button className="icon-btn" onClick={() => handleDeleteAnnotation(ann.id)} aria-label="Excluir anotação">
                <TrashIcon width={14} height={14} />
              </button>
            </div>
          ))}
        </div>
      )}

      {isEpub && openPanel === "epubSettings" && (
        <div className="epub-settings-panel">
          <div className="epub-settings-row">
            <span className="epub-settings-label">Fonte</span>
            <div className="filters">
              {(Object.entries(EPUB_FONT_FAMILIES) as [EpubFontFamily, { label: string }][]).map(([key, f]) => (
                <button
                  key={key}
                  className={epubSettings.fontFamily === key ? "filter active" : "filter"}
                  onClick={() => handleSetFontFamily(key)}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>
          <div className="epub-settings-row">
            <span className="epub-settings-label">Fundo</span>
            <div className="epub-theme-swatches">
              {(Object.entries(EPUB_THEMES) as [EpubTheme, { label: string; background: string; color: string }][]).map(
                ([key, t]) => (
                  <button
                    key={key}
                    className={`epub-theme-swatch${epubSettings.theme === key ? " active" : ""}`}
                    style={{ background: t.background, color: t.color }}
                    onClick={() => handleSetTheme(key)}
                  >
                    Aa
                    <span className="epub-theme-swatch-label">{t.label}</span>
                  </button>
                )
              )}
            </div>
          </div>
        </div>
      )}

      {notFound && <p className="hint" style={{ padding: 16 }}>Documento não encontrado.</p>}
      {!notFound && !blob && <p className="hint" style={{ padding: 16 }}>Carregando...</p>}
      {blob && doc?.type === "pdf" && (
        <PdfReader
          ref={readerRef}
          blob={blob}
          initialPage={initialLocation ? Number(initialLocation) : 1}
          zoomStep={zoomStep}
          onPageChange={(page, numPages) => {
            saveProgress(String(page));
            setPageInfo({ page, numPages });
          }}
          onToggleZoom={handleToggleZoom}
        />
      )}
      {blob && doc?.type === "epub" && (
        <EpubReader
          ref={readerRef}
          blob={blob}
          initialLocation={initialLocation}
          zoomStep={zoomStep}
          fontFamily={epubSettings.fontFamily}
          theme={epubSettings.theme}
          onLocationChange={saveProgress}
          onToggleZoom={handleToggleZoom}
          onTocReady={setToc}
        />
      )}

      {dim && <div className="reader-dim-overlay" aria-hidden="true" />}

      {blob && !notFound && (
        <div className="reader-controls">
          <button
            className="reader-ctrl-btn"
            onClick={() => readerRef.current?.prev()}
            aria-label="Página anterior"
            disabled={atFirstPage}
          >
            <ChevronLeftIcon width={16} height={16} />
          </button>
          <button
            className="reader-ctrl-btn"
            onClick={() => setZoomStep((z) => Math.max(0, z - 1))}
            aria-label="Diminuir zoom"
            disabled={zoomStep === 0}
          >
            <MinusIcon width={14} height={14} />
          </button>
          <span className="reader-zoom-pct">{100 + zoomStep * 25}%</span>
          <button
            className="reader-ctrl-btn"
            onClick={() => setZoomStep((z) => Math.min(MAX_ZOOM_STEP, z + 1))}
            aria-label="Aumentar zoom"
            disabled={zoomStep === MAX_ZOOM_STEP}
          >
            <PlusIcon width={14} height={14} />
          </button>
          <button
            className={`reader-ctrl-btn${dim ? " active" : ""}`}
            onClick={() => setDim((d) => !d)}
            aria-label="Escurecer tela para leitura"
          >
            <MoonIcon width={14} height={14} />
          </button>
          <button
            className="reader-ctrl-btn"
            onClick={() => readerRef.current?.next()}
            aria-label="Próxima página"
            disabled={atLastPage}
          >
            <ChevronRightIcon width={16} height={16} />
          </button>
        </div>
      )}
    </div>
  );
}
