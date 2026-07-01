import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";
import ePub, { type Book, type Rendition } from "epubjs";
import { useReaderGestures } from "../useReaderGestures";
import { playPageFlip } from "../sound";
import type { ReaderHandle } from "./PdfReader";

interface EpubReaderProps {
  blob: Blob;
  initialLocation?: string;
  zoomStep: number;
  onLocationChange?: (cfi: string) => void;
  onToggleZoom?: () => void;
}

const EpubReader = forwardRef<ReaderHandle, EpubReaderProps>(function EpubReader(
  { blob, initialLocation, zoomStep, onLocationChange, onToggleZoom },
  ref
) {
  const containerRef = useRef<HTMLDivElement>(null);
  const renditionRef = useRef<Rendition | null>(null);
  const bookRef = useRef<Book | null>(null);
  const isFirstRelocation = useRef(true);
  const [error, setError] = useState<string | null>(null);

  const { handleTap } = useReaderGestures({
    onPrev: () => renditionRef.current?.prev(),
    onNext: () => renditionRef.current?.next(),
    onDoubleTap: () => onToggleZoom?.(),
  });

  useImperativeHandle(ref, () => ({
    next: () => renditionRef.current?.next(),
    prev: () => renditionRef.current?.prev(),
  }));

  useEffect(() => {
    let cancelled = false;
    blob.arrayBuffer().then(async (buffer) => {
      if (cancelled || !containerRef.current) return;
      try {
        const book = ePub(buffer);
        bookRef.current = book;
        const rendition = book.renderTo(containerRef.current, {
          width: "100%",
          height: "100%",
          spread: "auto",
        });
        renditionRef.current = rendition;

        rendition.on("relocated", (location: { start: { cfi: string } }) => {
          if (isFirstRelocation.current) {
            isFirstRelocation.current = false;
            return;
          }
          playPageFlip();
          onLocationChange?.(location.start.cfi);
        });

        rendition.on("click", (event: MouseEvent) => {
          const view = event.view;
          if (!view) return;
          handleTap(event.clientX, event.clientY, { left: 0, width: view.innerWidth });
        });

        await rendition.display(initialLocation || undefined);
      } catch {
        setError("Não foi possível abrir este EPUB.");
      }
    });
    return () => {
      cancelled = true;
      renditionRef.current?.destroy();
      bookRef.current?.destroy();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [blob]);

  useEffect(() => {
    renditionRef.current?.themes.fontSize(`${100 + zoomStep * 25}%`);
  }, [zoomStep]);

  return (
    <div className="reader-canvas-wrap epub-wrap-outer">
      {error && <p className="error">{error}</p>}
      <div className="epub-wrap" ref={containerRef} />
    </div>
  );
});

export default EpubReader;
