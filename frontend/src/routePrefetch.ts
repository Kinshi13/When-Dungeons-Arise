// Aquece o cache de módulos das telas principais (as que ficam a 1-2 toques
// da Recepção) durante o tempo ocioso logo após o primeiro paint — sem
// isso, o code-splitting por rota (ver App.tsx/DesktopApp.tsx) faz a
// PRIMEIRA visita a cada tela pagar o custo de rede+parse do chunk dela,
// que num aparelho/rede reais aparece como alguns segundos de tela em
// branco/esqueleto bem no meio da transição — foi exatamente isso que
// apareceu no vídeo que motivou este arquivo.
//
// De propósito NÃO inclui ReaderScreen: só ela puxa epubjs+pdfjs-dist
// (~826KB, chunk "reader-libs"), e abrir um livro é uma ação bem mais rara
// e deliberada (tocar num livro específico dentro da Biblioteca) do que
// navegar pela dock — continua carregando só quando o usuário realmente
// abre um livro, que é o motivo de ela ter ganhado um chunk próprio.
export function prefetchMainRoutes() {
  void import("./pages/MissionBoard");
  void import("./pages/TimeRoom");
  void import("./pages/Treasury");
  void import("./pages/AdventureDiary");
  void import("./pages/Library");
  void import("./pages/RulesBook");
}

// requestIdleCallback não existe no WebKit (iOS/desktop Safari) nem em
// todo WebView Android — cai num setTimeout com atraso pequeno, que ainda
// assim tira o prefetch de cima do primeiro paint.
export function schedulePrefetch(callback: () => void): () => void {
  const w = window as typeof window & {
    requestIdleCallback?: (cb: () => void) => number;
    cancelIdleCallback?: (id: number) => void;
  };
  if (typeof w.requestIdleCallback === "function") {
    const id = w.requestIdleCallback(callback);
    return () => w.cancelIdleCallback?.(id);
  }
  const id = window.setTimeout(callback, 300);
  return () => window.clearTimeout(id);
}
