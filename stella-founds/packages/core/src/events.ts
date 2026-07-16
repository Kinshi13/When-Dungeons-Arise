const target = new EventTarget();
const CHANGED = 'finance-changed';
const EXPORT_REQUESTED = 'reports-export-requested';

export function emitFinanceChanged(): void {
  target.dispatchEvent(new Event(CHANGED));
}

export function onFinanceChanged(callback: () => void): () => void {
  target.addEventListener(CHANGED, callback);
  return () => target.removeEventListener(CHANGED, callback);
}

export function emitReportsExportRequested(): void {
  target.dispatchEvent(new Event(EXPORT_REQUESTED));
}

export function onReportsExportRequested(callback: () => void): () => void {
  target.addEventListener(EXPORT_REQUESTED, callback);
  return () => target.removeEventListener(EXPORT_REQUESTED, callback);
}
