import { useState } from 'react';
import { StellaButton } from './StellaButton';
import './StellaCalculator.css';

type Operator = '+' | '-' | '×' | '÷';

function compute(a: number, b: number, operator: Operator): number {
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

/**
 * A simple four-operation calculator — no finance logic, no persistence.
 * `onUseResult` is optional so it also works as a fully standalone utility.
 */
export function StellaCalculator({ onUseResult }: { onUseResult?: (value: number) => void }) {
  const [display, setDisplay] = useState('0');
  const [pending, setPending] = useState<{ value: number; operator: Operator } | null>(null);
  // True right after "=" or an operator key — the next digit should start a
  // fresh number instead of appending to what's currently on screen.
  const [awaitingFreshDigit, setAwaitingFreshDigit] = useState(false);
  const [copied, setCopied] = useState(false);

  function inputDigit(digit: string) {
    setCopied(false);
    if (awaitingFreshDigit) {
      setDisplay(digit === '.' ? '0.' : digit);
      setAwaitingFreshDigit(false);
      return;
    }
    if (digit === '.' && display.includes('.')) return;
    setDisplay((current) => (current === '0' && digit !== '.' ? digit : current + digit));
  }

  function applyOperator(operator: Operator) {
    const value = Number(display);
    if (pending && !awaitingFreshDigit) {
      const result = compute(pending.value, value, pending.operator);
      setPending({ value: result, operator });
      setDisplay(String(result));
    } else {
      setPending({ value, operator });
    }
    setAwaitingFreshDigit(true);
  }

  function evaluate() {
    if (!pending) return;
    const result = compute(pending.value, Number(display), pending.operator);
    setDisplay(String(result));
    setPending(null);
    setAwaitingFreshDigit(true);
  }

  function clear() {
    setDisplay('0');
    setPending(null);
    setAwaitingFreshDigit(false);
    setCopied(false);
  }

  async function copyResult() {
    try {
      await navigator.clipboard.writeText(display);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  }

  const digits = ['7', '8', '9', '4', '5', '6', '1', '2', '3', '0', '.'];
  const operators: Operator[] = ['÷', '×', '-', '+'];

  return (
    <div className="stella-calculator">
      <div className="stella-calculator__display" aria-live="polite">
        {display}
      </div>

      <div className="stella-calculator__grid">
        <div className="stella-calculator__digits">
          {digits.map((digit) => (
            <StellaButton key={digit} type="button" onClick={() => inputDigit(digit)}>
              {digit}
            </StellaButton>
          ))}
        </div>
        <div className="stella-calculator__operators">
          {operators.map((operator) => (
            <StellaButton
              key={operator}
              type="button"
              variant={pending?.operator === operator ? 'primary' : 'ghost'}
              onClick={() => applyOperator(operator)}
            >
              {operator}
            </StellaButton>
          ))}
          <StellaButton type="button" variant="primary" onClick={evaluate}>
            =
          </StellaButton>
        </div>
      </div>

      <div className="stella-calculator__actions">
        <StellaButton type="button" onClick={clear}>
          Limpar
        </StellaButton>
        <StellaButton type="button" onClick={copyResult}>
          {copied ? 'Copiado!' : 'Copiar resultado'}
        </StellaButton>
        {onUseResult && (
          <StellaButton type="button" variant="primary" onClick={() => onUseResult(Number(display))}>
            Usar resultado
          </StellaButton>
        )}
      </div>
    </div>
  );
}
