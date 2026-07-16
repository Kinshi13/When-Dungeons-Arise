import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { useStellaCalculatorEngine, showStellaToast, type StellaCalculatorEngine } from '@stella-founds/stella-ui';

export interface GlobalCalculatorApi {
  engine: StellaCalculatorEngine;
  isOpen: boolean;
  /** Set only when opened via openForValue — lets the UI show "Usar resultado" without the calculator ever importing whatever opened it. */
  onUseResult: ((value: number) => void) | null;
  openCalculator: () => void;
  closeCalculator: () => void;
  toggleCalculator: () => void;
  openForValue: (callback: (value: number) => void) => void;
  copyResult: () => void;
}

const GlobalCalculatorContext = createContext<GlobalCalculatorApi | null>(null);

export function GlobalCalculatorProvider({ children }: { children: ReactNode }) {
  const engine = useStellaCalculatorEngine();
  const [isOpen, setIsOpen] = useState(false);
  const [onUseResult, setOnUseResult] = useState<((value: number) => void) | null>(null);

  const openCalculator = useCallback(() => {
    setOnUseResult(null);
    setIsOpen(true);
  }, []);

  const closeCalculator = useCallback(() => {
    setIsOpen(false);
    setOnUseResult(null);
  }, []);

  const toggleCalculator = useCallback(() => {
    setIsOpen((open) => {
      if (open) setOnUseResult(null);
      return !open;
    });
  }, []);

  const openForValue = useCallback((callback: (value: number) => void) => {
    setOnUseResult(() => callback);
    setIsOpen(true);
  }, []);

  const copyResult = useCallback(() => {
    engine.copyResult().then((ok) => {
      if (ok) showStellaToast('Valor copiado', 'success');
    });
  }, [engine]);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.altKey && event.key.toLowerCase() === 'c') {
        event.preventDefault();
        toggleCalculator();
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [toggleCalculator]);

  const api = useMemo<GlobalCalculatorApi>(
    () => ({ engine, isOpen, onUseResult, openCalculator, closeCalculator, toggleCalculator, openForValue, copyResult }),
    [engine, isOpen, onUseResult, openCalculator, closeCalculator, toggleCalculator, openForValue, copyResult],
  );

  return <GlobalCalculatorContext.Provider value={api}>{children}</GlobalCalculatorContext.Provider>;
}

export function useGlobalCalculator(): GlobalCalculatorApi {
  const context = useContext(GlobalCalculatorContext);
  if (!context) {
    throw new Error('useGlobalCalculator must be used within GlobalCalculatorProvider');
  }
  return context;
}
