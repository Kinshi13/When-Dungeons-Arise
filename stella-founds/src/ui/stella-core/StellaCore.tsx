import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useLocation } from 'react-router-dom';
import { motion as motionTokens } from '../theme/motion';
import { StellaCoreIcon } from '../icons/NavIcons';
import { getStellaCoreActions } from './stellaCoreActions';
import { computeOrbitPositions } from './orbitLayout';
import './StellaCore.css';

export interface StellaCoreProps {
  onAction?: (actionId: string) => void;
}

const ORBIT_SIZE = 260;
const ORBIT_CENTER = ORBIT_SIZE / 2;

export function StellaCore({ onAction }: StellaCoreProps) {
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const rootRef = useRef<HTMLDivElement>(null);
  const firstItemRef = useRef<HTMLButtonElement>(null);
  const actions = getStellaCoreActions(location.pathname);
  const positions = computeOrbitPositions(actions.length);

  useEffect(() => {
    setOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!open) return;

    firstItemRef.current?.focus();

    function handlePointerDown(event: PointerEvent) {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setOpen(false);
      }
    }

    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open]);

  return (
    <div className="stella-core" ref={rootRef}>
      <AnimatePresence>
        {open && (
          <div className="stella-core__orbit" role="menu">
            <svg
              className="stella-core__orbit-lines"
              width={ORBIT_SIZE}
              height={ORBIT_SIZE}
              viewBox={`0 0 ${ORBIT_SIZE} ${ORBIT_SIZE}`}
            >
              <motion.polyline
                points={positions
                  .map(({ x, y }) => `${ORBIT_CENTER + x},${ORBIT_CENTER + y}`)
                  .join(' ')}
                fill="none"
                stroke="currentColor"
                strokeWidth="1"
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.35 }}
                exit={{ opacity: 0 }}
                transition={{ duration: motionTokens.duration.medium }}
              />
              {positions.map(({ x, y }, index) => (
                <motion.circle
                  key={index}
                  cx={ORBIT_CENTER + x}
                  cy={ORBIT_CENTER + y}
                  r={2}
                  fill="currentColor"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 0.6 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: motionTokens.duration.medium, delay: index * 0.03 }}
                />
              ))}
            </svg>

            {actions.map((action, index) => {
              const { x, y } = positions[index];
              return (
                <motion.div
                  key={action.id}
                  className="stella-core__orbit-slot"
                  initial={{ x: 0, y: 0, opacity: 0, scale: 0.4 }}
                  animate={{ x, y, opacity: 1, scale: 1 }}
                  exit={{ x: 0, y: 0, opacity: 0, scale: 0.4 }}
                  transition={{
                    duration: motionTokens.duration.medium,
                    delay: index * 0.03,
                    ease: motionTokens.easing,
                  }}
                >
                  <button
                    ref={index === 0 ? firstItemRef : undefined}
                    type="button"
                    role="menuitem"
                    className="stella-core__orbit-item"
                    aria-label={action.label}
                    onClick={() => {
                      onAction?.(action.id);
                      setOpen(false);
                    }}
                  >
                    {action.label}
                  </button>
                </motion.div>
              );
            })}
          </div>
        )}
      </AnimatePresence>

      <button
        type="button"
        className="stella-core__button"
        aria-label={open ? 'Fechar Stella Core' : 'Abrir Stella Core'}
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
      >
        <StellaCoreIcon />
      </button>
    </div>
  );
}
