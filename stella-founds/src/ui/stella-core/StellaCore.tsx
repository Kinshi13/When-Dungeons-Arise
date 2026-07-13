import { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { StellaCoreIcon } from '../icons/NavIcons';
import { getStellaCoreActions } from './stellaCoreActions';
import './StellaCore.css';

export interface StellaCoreProps {
  onAction?: (actionId: string) => void;
}

export function StellaCore({ onAction }: StellaCoreProps) {
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const rootRef = useRef<HTMLDivElement>(null);
  const actions = getStellaCoreActions(location.pathname);

  useEffect(() => {
    setOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!open) return;

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
      {open && (
        <ul className="stella-core__menu" role="menu">
          {actions.map((action) => (
            <li key={action.id} role="none">
              <button
                type="button"
                role="menuitem"
                className="stella-core__menu-item"
                onClick={() => {
                  onAction?.(action.id);
                  setOpen(false);
                }}
              >
                {action.label}
              </button>
            </li>
          ))}
        </ul>
      )}
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
