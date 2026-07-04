declare global {
  interface Window {
    // Exposto pelo preload do shell desktop (ver electron/preload.js) — só
    // existe rodando dentro do Electron; no navegador/Android normal essa
    // chave nunca aparece em window.
    desktopShell?: { isElectron: boolean };
  }
}

export function isElectron(): boolean {
  return typeof window !== "undefined" && Boolean(window.desktopShell?.isElectron);
}
