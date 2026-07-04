import * as pdfjsLib from "pdfjs-dist/legacy/build/pdf.mjs";
import workerSrc from "pdfjs-dist/legacy/build/pdf.worker.min.mjs?url";
import ePub, { type Book } from "epubjs";
import type { DocumentType } from "./api";

pdfjsLib.GlobalWorkerOptions.workerSrc = workerSrc;

const THUMB_WIDTH = 160;
const THUMB_HEIGHT = 220;

function drawToThumbnail(source: CanvasImageSource, srcWidth: number, srcHeight: number): string {
  const canvas = document.createElement("canvas");
  const scale = Math.min(THUMB_WIDTH / srcWidth, THUMB_HEIGHT / srcHeight);
  canvas.width = Math.round(srcWidth * scale);
  canvas.height = Math.round(srcHeight * scale);
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(source, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL("image/jpeg", 0.75);
}

async function generatePdfCover(file: File): Promise<string | null> {
  try {
    const buffer = await file.arrayBuffer();
    const doc = await pdfjsLib.getDocument({ data: buffer }).promise;
    const page = await doc.getPage(1);
    const viewport = page.getViewport({ scale: 1 });
    const scale = THUMB_WIDTH / viewport.width;
    const scaledViewport = page.getViewport({ scale });
    const canvas = document.createElement("canvas");
    canvas.width = scaledViewport.width;
    canvas.height = scaledViewport.height;
    const ctx = canvas.getContext("2d")!;
    await page.render({ canvasContext: ctx, viewport: scaledViewport, canvas }).promise;
    const dataUrl = canvas.toDataURL("image/jpeg", 0.75);
    (doc as unknown as { destroy?: () => void }).destroy?.();
    return dataUrl;
  } catch {
    return null;
  }
}

// epub.js interpretando um EPUB fora do padrão (sem nav.xhtml, só NCX antigo etc.)
// dispara internamente promises "soltas" (fora da cadeia que aguardamos) e loga
// direto no console — nada disso afeta o resultado (cai no sprite de fallback),
// então mascaramos os dois canais por uma janela curta em vez de deixar virar
// ruído/erro não tratado.
function withEpubNoiseSuppressed<T>(run: () => Promise<T>): Promise<T> {
  const swallow = (e: PromiseRejectionEvent) => e.preventDefault();
  const originalConsoleError = console.error;
  window.addEventListener("unhandledrejection", swallow);
  console.error = () => {};
  const restore = () => {
    setTimeout(() => {
      window.removeEventListener("unhandledrejection", swallow);
      console.error = originalConsoleError;
    }, 500);
  };
  return run().finally(restore);
}

async function generateEpubCover(file: File): Promise<string | null> {
  const buffer = await file.arrayBuffer();
  const book: Book = ePub(buffer);
  try {
    return await withEpubNoiseSuppressed(async () => {
      await book.ready.catch(() => {});
      const coverUrl = await book.coverUrl().catch(() => null);
      if (!coverUrl) return null;
      const img = new Image();
      const loaded = new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => reject(new Error("cover load failed"));
      });
      img.src = coverUrl;
      await loaded;
      return drawToThumbnail(img, img.naturalWidth, img.naturalHeight);
    });
  } catch {
    return null;
  } finally {
    book.destroy();
  }
}

// Gera uma miniatura pequena (JPEG base64) da capa do documento pra exibir na estante.
// Guardada direto no metadado (localStorage) — fica pequena o bastante (poucos KB)
// pra não estourar a cota, diferente do arquivo original que vai pro IndexedDB.
export async function generateCoverThumbnail(file: File, type: DocumentType): Promise<string | null> {
  return type === "pdf" ? generatePdfCover(file) : generateEpubCover(file);
}
