import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";
import ePub, { type Book, type Rendition } from "epubjs";
import { useReaderGestures } from "../useReaderGestures";
import { playPageFlip } from "../sound";
import type { ReaderHandle } from "./PdfReader";
import { EPUB_FONT_FAMILIES, EPUB_THEMES, type EpubFontFamily, type EpubTheme } from "../epubReaderSettings";

interface EpubReaderProps {
  blob: Blob;
  initialLocation?: string;
  zoomStep: number;
  fontFamily: EpubFontFamily;
  theme: EpubTheme;
  onLocationChange?: (cfi: string) => void;
  onToggleZoom?: () => void;
}

const EpubReader = forwardRef<ReaderHandle, EpubReaderProps>(function EpubReader(
  { blob, initialLocation, zoomStep, fontFamily, theme, onLocationChange, onToggleZoom },
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

        for (const [name, t] of Object.entries(EPUB_THEMES)) {
          rendition.themes.register(name, { body: { background: t.background, color: t.color } });
        }
        rendition.themes.select(theme);
        rendition.themes.font(EPUB_FONT_FAMILIES[fontFamily].css);

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

  useEffect(() => {
    renditionRef.current?.themes.select(theme);
  }, [theme]);

  useEffect(() => {
    renditionRef.current?.themes.font(EPUB_FONT_FAMILIES[fontFamily].css);
  }, [fontFamily]);

  const themeColors = EPUB_THEMES[theme];

  return (
    <div
      className="reader-canvas-wrap epub-wrap-outer"
      style={{ background: themeColors.background }}
    >
      {error && <p className="error">{error}</p>}
      <div className="epub-wrap" ref={containerRef} style={{ background: themeColors.background }} />
    </div>
  );
});

export default EpubReader;
