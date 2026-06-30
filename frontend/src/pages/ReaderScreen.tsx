import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { api, type DocumentMeta } from "../api";
import PdfReader from "../components/PdfReader";
import EpubReader from "../components/EpubReader";
import { ChevronLeftIcon } from "../icons";
import { useGame } from "../game/GameContext";

const READING_GOAL_MINUTES = 20;

export default function ReaderScreen() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [doc, setDoc] = useState<DocumentMeta | null>(null);
  const [blob, setBlob] = useState<Blob | null>(null);
  const [initialLocation, setInitialLocation] = useState<string | undefined>(undefined);
  const [notFound, setNotFound] = useState(false);
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
          blob={blob}
          initialPage={initialLocation ? Number(initialLocation) : 1}
          onPageChange={(page) => saveProgress(String(page))}
        />
      )}
      {blob && doc?.type === "epub" && (
        <EpubReader blob={blob} initialLocation={initialLocation} onLocationChange={saveProgress} />
      )}
    </div>
  );
}
