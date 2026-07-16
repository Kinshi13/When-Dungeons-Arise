import { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { usePrefersReducedMotion } from '../hooks/usePrefersReducedMotion';
import { StellaCoreIcon } from '../icons/NavIcons';
import { ConstellationLines } from './ConstellationLines';
import { StellaActionItem } from './StellaActionItem';
import { getStellaCoreActions } from './stellaCoreActions';
import { getStellaConstellationLayouts } from './stellaLayout';
import './StellaCore.css';

export interface StellaCoreProps {
  onAction?: (actionId: string) => void;
}

type Phase = 'closed' | 'opening' | 'open' | 'closing';

const STAGGER_S = 0.06;
const ITEM_DURATION_S = 0.22;
const REDUCED_DURATION_S = 0.12;

export function StellaCore({ onAction }: StellaCoreProps) {
  const [phase, setPhase] = useState<Phase>('closed');
  const location = useLocation();
  const rootRef = useRef<HTMLDivElement>(null);
  const firstItemRef = useRef<HTMLButtonElement>(null);
  const timeoutRef = useRef<number | null>(null);
  const pushedHistoryRef = useRef(false);
  const reducedMotion = usePrefersReducedMotion();

  const actions = getStellaCoreActions(location.pathname);
  const layouts = useMemo(() => getStellaConstellationLayouts(actions.length), [actions.length]);
  const maxOrder = layouts.length;

  const isVisuallyOpen = phase === 'opening' || phase === 'open';
  const stagger = reducedMotion ? 0 : STAGGER_S;
  const duration = reducedMotion ? REDUCED_DURATION_S : ITEM_DURATION_S;

  function clearPendingTransition() {
    if (timeoutRef.current !== null) {
      window.clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }

  function openMenu() {
    if (phase !== 'closed') return;
    clearPendingTransition();
    setPhase('opening');
    const totalMs = ((maxOrder - 1) * stagger + duration) * 1000;
    timeoutRef.current = window.setTimeout(() => setPhase('open'), totalMs);
    window.history.pushState({ stellaCoreMenu: true }, '');
    pushedHistoryRef.current = true;
  }

  /** Phase transition only — does not touch history. Used by both the
   * normal close path and the popstate handler (which fires *after* the
   * back button has already consumed our pushed history entry). */
  function transitionToClosing() {
    if (phase !== 'open') return;
    clearPendingTransition();
    setPhase('closing');
    const totalMs = ((maxOrder - 1) * stagger + duration) * 1000;
    timeoutRef.current = window.setTimeout(() => setPhase('closed'), totalMs);
  }

  function closeMenu() {
    transitionToClosing();
    if (pushedHistoryRef.current) {
      pushedHistoryRef.current = false;
      window.history.back();
    }
  }

  function toggle() {
    if (phase === 'closed') openMenu();
    else if (phase === 'open') closeMenu();
    // Ignore taps while opening/closing so we never stack overlapping timers.
  }

  useEffect(() => {
    clearPendingTransition();
    pushedHistoryRef.current = false;
    setPhase('closed');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);

  useEffect(() => () => clearPendingTransition(), []);

  useEffect(() => {
    if (phase !== 'open') return;
    firstItemRef.current?.focus();

    function handlePointerDown(event: PointerEvent) {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) {
        closeMenu();
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        closeMenu();
      }
    }

    function handlePopState() {
      // The back button (hardware or browser) already consumed the pushed
      // entry by the time this fires, so just transition — calling
      // history.back() again here would skip past the intended screen.
      pushedHistoryRef.current = false;
      transitionToClosing();
    }

    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    window.addEventListener('popstate', handlePopState);
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('popstate', handlePopState);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  return (
    <>
      {phase !== 'closed' && (
        <div
          className={`stella-core__scrim${isVisuallyOpen ? ' is-active' : ' is-closing'}`}
          aria-hidden="true"
        />
      )}
      <div className="stella-core" data-phase={phase} ref={rootRef}>
        {phase !== 'closed' && (
          <div className="stella-core__orbit" id="stella-core-menu" role="menu">
            <ConstellationLines
              layouts={layouts}
              isActive={isVisuallyOpen}
              stagger={stagger}
              duration={duration}
              reducedMotion={reducedMotion}
            />
            {actions.map((action, index) => {
              const layout = layouts[index];
              const delay = isVisuallyOpen
                ? (layout.animationOrder - 1) * stagger
                : (maxOrder - layout.animationOrder) * stagger;
              return (
                <StellaActionItem
                  key={action.id}
                  layout={layout}
                  label={action.label}
                  isActive={isVisuallyOpen}
                  delay={delay}
                  duration={duration}
                  ref={layout.animationOrder === 1 ? firstItemRef : undefined}
                  onClick={() => {
                    if (phase !== 'open') return;
                    onAction?.(action.id);
                    closeMenu();
                  }}
                />
              );
            })}
          </div>
        )}

        <button
          type="button"
          className="stella-core__button"
          aria-label={phase === 'closed' ? 'Abrir Stella Core' : 'Fechar Stella Core'}
          aria-expanded={phase !== 'closed'}
          aria-controls="stella-core-menu"
          onClick={toggle}
        >
          <span className="stella-core__glow" aria-hidden="true" />
          <span className="stella-core__icon">
            <StellaCoreIcon />
          </span>
        </button>
      </div>
    </>
  );
}
