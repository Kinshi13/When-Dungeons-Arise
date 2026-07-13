const target = new EventTarget();
const CHANGED = 'finance-changed';

export function emitFinanceChanged(): void {
  target.dispatchEvent(new Event(CHANGED));
}

export function onFinanceChanged(callback: () => void): () => void {
  target.addEventListener(CHANGED, callback);
  return () => target.removeEventListener(CHANGED, callback);
}
