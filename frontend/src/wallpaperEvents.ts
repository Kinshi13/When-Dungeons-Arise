// Avisa o App.tsx que a config/imagens do papel de parede mudou, pra
// recarregar as URLs em memória. Um pub-sub simples de módulo em vez de
// Context — essa configuração muda raramente (só na tela de ajuste do
// papel de parede) e não vale o replumbing de um Provider só pra isso.

type Listener = () => void;
const listeners = new Set<Listener>();

export function onWallpaperChanged(cb: Listener): () => void {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

export function notifyWallpaperChanged() {
  for (const cb of listeners) cb();
}
