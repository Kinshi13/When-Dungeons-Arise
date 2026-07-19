import { useRef, useState, type PointerEvent, type ReactNode } from 'react';
import { useDismissableOverlay } from '../hooks/useDismissableOverlay';
import { useLocalStorageState } from '../hooks/useLocalStorageState';
import { StellaIconButton } from './StellaIconButton';
import './StellaFloatingPanel.css';

/**
 * A draggable, minimizable floating panel for desktop — stays anchored
 * wherever the user last dragged it, persists across route changes as
 * long as the caller keeps it mounted. ESC closes it (unless focus is
 * inside a text field, same convention as Modal/BottomSheet).
 */
export function StellaFloatingPanel({
  title,
  onClose,
  children,
  persistKey,
}: {
  title: string;
  onClose: () => void;
  children: ReactNode;
  /** When set, position and minimized state survive a reload under this localStorage key — pass a stable, unique key per panel instance (e.g. the calculator's). Omit for one-off panels that shouldn't persist. */
  persistKey?: string;
}) {
  useDismissableOverlay(onClose);
  const [minimizedPersisted, setMinimizedPersisted] = useLocalStorageState(`${persistKey}:minimized`, false);
  const [positionPersisted, setPositionPersisted] = useLocalStorageState<{ x: number; y: number } | null>(
    `${persistKey}:position`,
    null,
  );
  const [minimizedLocal, setMinimizedLocal] = useState(false);
  const [positionLocal, setPositionLocal] = useState<{ x: number; y: number } | null>(null);
  const minimized = persistKey ? minimizedPersisted : minimizedLocal;
  const setMinimized = persistKey ? setMinimizedPersisted : setMinimizedLocal;
  const position = persistKey ? positionPersisted : positionLocal;
  const setPosition = persistKey ? setPositionPersisted : setPositionLocal;
  const panelRef = useRef<HTMLDivElement>(null);
  const dragOrigin = useRef<{ pointerX: number; pointerY: number; panelX: number; panelY: number } | null>(null);

  function handleDragStart(event: PointerEvent) {
    if ((event.target as HTMLElement).closest('button')) return; // let header buttons (minimize/close) handle their own clicks
    const panel = panelRef.current;
    if (!panel) return;
    const rect = panel.getBoundingClientRect();
    dragOrigin.current = { pointerX: event.clientX, pointerY: event.clientY, panelX: rect.left, panelY: rect.top };
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function handleDragMove(event: PointerEvent) {
    if (!dragOrigin.current) return;
    const { pointerX, pointerY, panelX, panelY } = dragOrigin.current;
    const nextX = panelX + (event.clientX - pointerX);
    const nextY = panelY + (event.clientY - pointerY);
    const maxX = window.innerWidth - 60;
    const maxY = window.innerHeight - 60;
    setPosition({ x: Math.min(Math.max(nextX, 0), maxX), y: Math.min(Math.max(nextY, 0), maxY) });
  }

  function handleDragEnd(event: PointerEvent) {
    dragOrigin.current = null;
    event.currentTarget.releasePointerCapture(event.pointerId);
  }

  const style = position ? { left: position.x, top: position.y, right: 'auto', bottom: 'auto' } : undefined;

  return (
    <div
      ref={panelRef}
      className={`stella-floating-panel${minimized ? ' is-minimized' : ''}`}
      style={style}
      role="dialog"
      aria-label={title}
    >
      <div
        className="stella-floating-panel__header"
        onPointerDown={handleDragStart}
        onPointerMove={handleDragMove}
        onPointerUp={handleDragEnd}
      >
        <span className="stella-floating-panel__title">{title}</span>
        <div className="stella-floating-panel__header-actions">
          <StellaIconButton
            icon={minimized ? '▢' : '—'}
            label={minimized ? 'Restaurar' : 'Minimizar'}
            onClick={() => setMinimized((value) => !value)}
          />
          <StellaIconButton icon="×" label="Fechar" onClick={onClose} />
        </div>
      </div>
      {!minimized && <div className="stella-floating-panel__body">{children}</div>}
    </div>
  );
}
