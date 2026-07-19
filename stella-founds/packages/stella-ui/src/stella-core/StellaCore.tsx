import { useMemo } from 'react';
import { duration as durationTokens, stagger as staggerTokens } from '../tokens/motion';
import { usePrefersReducedMotion } from '../hooks/usePrefersReducedMotion';
import { useDocumentHidden } from '../hooks/useDocumentHidden';
import { StellaCoreIcon } from '../icons/NavIcons';
import { ConstellationLines } from './ConstellationLines';
import { StellaActionItem } from './StellaActionItem';
import { getStellaConstellationLayouts } from './stellaLayout';
import { useStellaCore } from './useStellaCore';
import type { StellaAction } from './StellaAction';
import './StellaCore.css';

export interface StellaCoreProps {
  /** Menu actions for the current context. The app decides what these are and what each one does. */
  actions: StellaAction[];
  /** Opaque value (e.g. current pathname) that, when changed, forces the menu closed. */
  activeContext?: unknown;
  /** Override the reduced-motion preference (mainly for tests/stories); defaults to the user's OS setting. */
  reducedMotion?: boolean;
}

export function StellaCore({ actions, activeContext, reducedMotion: reducedMotionOverride }: StellaCoreProps) {
  const systemReducedMotion = usePrefersReducedMotion();
  const reducedMotion = reducedMotionOverride ?? systemReducedMotion;
  const isTabHidden = useDocumentHidden();

  const stagger = reducedMotion ? 0 : staggerTokens.short;
  const duration = reducedMotion ? durationTokens.fast : durationTokens.normal;

  const layouts = useMemo(() => getStellaConstellationLayouts(actions.length), [actions.length]);
  const maxOrder = layouts.length;

  const { phase, isVisuallyOpen, rootRef, firstItemRef, triggerRef, toggle, closeMenu } = useStellaCore({
    activeContext,
    transitionDurationMs: () => ((maxOrder - 1) * stagger + duration) * 1000,
  });

  return (
    <>
      {phase !== 'closed' && (
        <div
          className={`stella-core__scrim${isVisuallyOpen ? ' is-active' : ' is-closing'}`}
          aria-hidden="true"
        />
      )}
      <div
        className={`stella-core${isTabHidden ? ' is-tab-hidden' : ''}`}
        data-phase={phase}
        ref={rootRef}
      >
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
                  disabled={action.disabled}
                  isActive={isVisuallyOpen}
                  delay={delay}
                  duration={duration}
                  ref={layout.animationOrder === 1 ? firstItemRef : undefined}
                  onClick={() => {
                    if (phase !== 'open' || action.disabled) return;
                    action.execute();
                    closeMenu();
                  }}
                />
              );
            })}
          </div>
        )}

        <button
          type="button"
          ref={triggerRef}
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
