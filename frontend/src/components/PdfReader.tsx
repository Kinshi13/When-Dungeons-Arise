import { useEffect, useRef, useState } from "react";
import * as pdfjsLib from "pdfjs-dist";
import workerSrc from "pdfjs-dist/build/pdf.worker.min.mjs?url";
import { useReaderGestures } from "../useReaderGestures";
import { playPageFlip } from "../sound";

pdfjsLib.GlobalWorkerOptions.workerSrc = workerSrc;

interface PdfReaderProps {
  blob: Blob;
  initialPage?: number;
  onPageChange?: (page: number) => void;
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

export default function PdfReader({ blob, initialPage = 1, onPageChange }: PdfReaderProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const docRef = useRef<pdfjsLib.PDFDocumentProxy | null>(null);
  const [page, setPage] = useState(initialPage);
  const [numPages, setNumPages] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [zoomed, setZoomed] = useState(false);
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
      const finalScale = zoomed ? baseScale * 1.5 : baseScale;

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
  }, [page, numPages, landscape, zoomed]);

  function goTo(next: number) {
    if (next < 1 || next > numPages) return;
    setPage(next);
    onPageChange?.(next);
    playPageFlip();
  }

  const { handleTap } = useReaderGestures({
    onPrev: () => goTo(page - 1),
    onNext: () => goTo(page + 1),
    onDoubleTap: () => setZoomed((z) => !z),
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
}
