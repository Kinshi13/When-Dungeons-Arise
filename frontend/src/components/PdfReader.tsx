import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";
// Build "legacy" (não o padrão): inclui os polyfills que o pdfjs-dist precisa
// (ex.: Map.prototype.getOrInsertComputed), API ainda não disponível nativamente
// no Chromium/WebView do Android — sem isso o render() falha silenciosamente.
import * as pdfjsLib from "pdfjs-dist/legacy/build/pdf.mjs";
import workerSrc from "pdfjs-dist/legacy/build/pdf.worker.min.mjs?url";
import { useReaderGestures } from "../useReaderGestures";
import { playPageFlip } from "../sound";

pdfjsLib.GlobalWorkerOptions.workerSrc = workerSrc;

export interface ReaderHandle {
  next: () => void;
  prev: () => void;
  // PDF: número da página (como string). EPUB: CFI ou href do sumário —
  // usado tanto pra retomar leitura (já cobria isso) quanto pra pular pra
  // uma anotação ou capítulo específico (ver ReaderScreen.tsx).
  goTo: (location: string) => void;
}

interface PdfReaderProps {
  blob: Blob;
  initialPage?: number;
  zoomStep: number;
  onPageChange?: (page: number, numPages: number) => void;
  onToggleZoom?: () => void;
}

function useOrientation() {
  const [landscape, setLandscape] = useState(window.innerWidth > window.innerHeight);
  useEffect(() => {
    const update = () => setLandscape(window.innerWidth > window.innerHeight);
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);
  return landscape;
}

const PdfReader = forwardRef<ReaderHandle, PdfReaderProps>(function PdfReader(
  { blob, initialPage = 1, zoomStep, onPageChange, onToggleZoom },
  ref
) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const docRef = useRef<pdfjsLib.PDFDocumentProxy | null>(null);
  const [page, setPage] = useState(initialPage);
  const [numPages, setNumPages] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const landscape = useOrientation();

  useEffect(() => {
    let cancelled = false;
    blob.arrayBuffer().then(async (buffer) => {
      try {
        const doc = await pdfjsLib.getDocument({ data: buffer }).promise;
        if (cancelled) return;
        docRef.current = doc;
        setNumPages(doc.numPages);
        setPage(Math.min(Math.max(initialPage, 1), doc.numPages));
      } catch {
        setError("Não foi possível abrir este PDF.");
      }
    });
    return () => {
      cancelled = true;
      (docRef.current as unknown as { destroy?: () => void } | null)?.destroy?.();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [blob]);

  useEffect(() => {
    if (!docRef.current || !canvasRef.current || !containerRef.current) return;
    let cancelled = false;
    docRef.current.getPage(page).then(async (pdfPage) => {
      if (cancelled) return;
      const container = containerRef.current!;
      const baseViewport = pdfPage.getViewport({ scale: 1 });
      const fitWidthScale = (container.clientWidth - 16) / baseViewport.width;
      const fitHeightScale = (container.clientHeight - 16) / baseViewport.height;
      const baseScale = landscape ? fitHeightScale : fitWidthScale;
      const finalScale = baseScale * (1 + zoomStep * 0.25);

      const viewport = pdfPage.getViewport({ scale: finalScale });
      const canvas = canvasRef.current!;
      const ctx = canvas.getContext("2d")!;
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      await pdfPage.render({ canvasContext: ctx, viewport, canvas }).promise;
    });
    return () => {
      cancelled = true;
    };
  }, [page, numPages, landscape, zoomStep]);

  function goTo(next: number) {
    if (Number.isNaN(next) || next < 1 || next > numPages) return;
    setPage(next);
    onPageChange?.(next, numPages);
    playPageFlip();
  }

  useEffect(() => {
    if (numPages) onPageChange?.(page, numPages);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [numPages]);

  useImperativeHandle(ref, () => ({
    next: () => goTo(page + 1),
    prev: () => goTo(page - 1),
    goTo: (location: string) => goTo(Number(location)),
  }));

  const { handleTap } = useReaderGestures({
    onPrev: () => goTo(page - 1),
    onNext: () => goTo(page + 1),
    onDoubleTap: () => onToggleZoom?.(),
  });

  if (error) return <p className="error">{error}</p>;

  return (
    <div
      className="reader-canvas-wrap"
      ref={containerRef}
      onClick={(e) => {
        const rect = e.currentTarget.getBoundingClientRect();
        handleTap(e.clientX, e.clientY, rect);
      }}
    >
      <canvas ref={canvasRef} />
      <div className="reader-page-indicator">
        {page} / {numPages || "…"}
      </div>
    </div>
  );
});

export default PdfReader;
