import { useRef, useState } from 'react';

export type StellaCalculatorOperator = '+' | '-' | '×' | '÷';

export interface StellaCalculatorHistoryEntry {
  id: number;
  expression: string;
  result: number;
}

export interface StellaCalculatorEngine {
  display: string;
  history: StellaCalculatorHistoryEntry[];
  activeOperator: StellaCalculatorOperator | null;
  inputDigit: (digit: string) => void;
  applyOperator: (operator: StellaCalculatorOperator) => void;
  evaluate: () => void;
  clear: () => void;
  copyResult: () => Promise<boolean>;
}

function compute(a: number, b: number, operator: StellaCalculatorOperator): number {
  switch (operator) {
    case '+':
      return a + b;
    case '-':
      return a - b;
    case '×':
      return a * b;
    case '÷':
      return b === 0 ? NaN : a / b;
  }
}

const MAX_HISTORY = 5;
let nextHistoryId = 1;

/**
 * The calculator's arithmetic + history state, independent of any
 * particular chrome (bottom sheet / drawer / floating panel). Pulling this
 * out of the component means a provider can own one instance and keep its
 * display/history alive across the UI being hidden and shown again.
 */
export function useStellaCalculatorEngine(): StellaCalculatorEngine {
  const [display, setDisplay] = useState('0');
  const [pending, setPending] = useState<{ value: number; operator: StellaCalculatorOperator } | null>(null);
  const [awaitingFreshDigit, setAwaitingFreshDigit] = useState(false);
  const [history, setHistory] = useState<StellaCalculatorHistoryEntry[]>([]);
  const pendingDisplayRef = useRef('0');

  function inputDigit(digit: string) {
    if (awaitingFreshDigit) {
      setDisplay(digit === '.' ? '0.' : digit);
      setAwaitingFreshDigit(false);
      return;
    }
    if (digit === '.' && display.includes('.')) return;
    setDisplay((current) => (current === '0' && digit !== '.' ? digit : current + digit));
  }

  function applyOperator(operator: StellaCalculatorOperator) {
    const value = Number(display);
    if (pending && !awaitingFreshDigit) {
      const result = compute(pending.value, value, pending.operator);
      pendingDisplayRef.current = String(result);
      setPending({ value: result, operator });
      setDisplay(String(result));
    } else {
      pendingDisplayRef.current = display;
      setPending({ value, operator });
    }
    setAwaitingFreshDigit(true);
  }

  function evaluate() {
    if (!pending) return;
    const result = compute(pending.value, Number(display), pending.operator);
    const expression = `${pendingDisplayRef.current} ${pending.operator} ${display}`;
    setHistory((current) => [{ id: nextHistoryId++, expression, result }, ...current].slice(0, MAX_HISTORY));
    setDisplay(String(result));
    setPending(null);
    setAwaitingFreshDigit(true);
  }

  function clear() {
    setDisplay('0');
    setPending(null);
    setAwaitingFreshDigit(false);
  }

  async function copyResult(): Promise<boolean> {
    try {
      await navigator.clipboard.writeText(display);
      return true;
    } catch {
      return false;
    }
  }

  return {
    display,
    history,
    activeOperator: pending?.operator ?? null,
    inputDigit,
    applyOperator,
    evaluate,
    clear,
    copyResult,
  };
}
