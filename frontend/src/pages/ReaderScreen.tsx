import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { api, type DocumentMeta } from "../api";
import PdfReader, { type ReaderHandle } from "../components/PdfReader";
import EpubReader from "../components/EpubReader";
import { ChevronLeftIcon, ChevronRightIcon, MinusIcon, PlusIcon, MoonIcon } from "../icons";
import { useGame } from "../game/GameContext";

const READING_GOAL_MINUTES = 20;
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
  const readerRef = useRef<ReaderHandle>(null);
  const { grantReward } = useGame();
  const sessionStart = useRef(Date.now());
  const rewardGranted = useRef(false);

  useEffect(() => {
    if (!id) return;
    (async () => {
      const meta = await api.documents.getMeta(id);
      if (!meta) {
        setNotFound(true);
        return;
      }
      const [fileBlob, progress] = await Promise.all([
        api.documents.getFile(id),
        api.readingProgress.get(id),
      ]);
      setDoc(meta);
      setBlob(fileBlob ?? null);
      setInitialLocation(progress?.location);
    })();
  }, [id]);

  useEffect(() => {
    return () => {
      const minutesRead = (Date.now() - sessionStart.current) / 60000;
      if (minutesRead >= READING_GOAL_MINUTES && !rewardGranted.current) {
        rewardGranted.current = true;
        grantReward("leitura20min");
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleBack() {
    navigate(-1);
  }

  function saveProgress(location: string) {
    if (id) api.readingProgress.save(id, location);
  }

  function handleToggleZoom() {
    setZoomStep((z) => (z === 0 ? MAX_ZOOM_STEP : 0));
  }

  const atFirstPage = doc?.type === "pdf" && !!pageInfo && pageInfo.page <= 1;
  const atLastPage = doc?.type === "pdf" && !!pageInfo && pageInfo.page >= pageInfo.numPages;

  return (
    <div className="reader-fullscreen">
      <div className="reader-fullscreen-header">
        <button className="icon-btn" onClick={handleBack} aria-label="Voltar para a estante">
          <ChevronLeftIcon width={18} height={18} />
        </button>
        <strong className="reader-fullscreen-title">{doc?.title ?? "Carregando..."}</strong>
      </div>

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
          onLocationChange={saveProgress}
          onToggleZoom={handleToggleZoom}
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
