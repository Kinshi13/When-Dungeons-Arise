import { useState } from 'react';
import { StellaButton } from './StellaButton';
import { showStellaToast } from './StellaToast';
import type { StellaCalculatorEngine, StellaCalculatorOperator } from '../hooks/useStellaCalculatorEngine';
import './StellaCalculator.css';

const digits = ['7', '8', '9', '4', '5', '6', '1', '2', '3', '0', '.'];
const operators: StellaCalculatorOperator[] = ['÷', '×', '-', '+'];

/**
 * Presentational four-operation calculator — all arithmetic/history state
 * lives in `engine` (see useStellaCalculatorEngine), so a single instance
 * can survive being hidden and shown again. `onUseResult` is optional: when
 * present (the calculator was opened for a specific field), a "Usar
 * resultado" button appears; the calculator never imports or knows about
 * whatever opened it that way.
 */
export function StellaCalculator({
  engine,
  onUseResult,
}: {
  engine: StellaCalculatorEngine;
  onUseResult?: (value: number) => void;
}) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    const ok = await engine.copyResult();
    setCopied(ok);
    if (ok) {
      showStellaToast('Valor copiado', 'success');
      window.setTimeout(() => setCopied(false), 2000);
    }
  }

  async function handleCopyHistoryEntry(result: number) {
    try {
      await navigator.clipboard.writeText(String(result));
      showStellaToast('Valor copiado', 'success');
    } catch {
      showStellaToast('Não foi possível copiar.', 'error');
    }
  }

  return (
    <div className="stella-calculator">
      <div className="stella-calculator__display" aria-live="polite">
        {engine.display}
      </div>

      <div className="stella-calculator__grid">
        <div className="stella-calculator__digits">
          {digits.map((digit) => (
            <StellaButton key={digit} type="button" onClick={() => engine.inputDigit(digit)}>
              {digit}
            </StellaButton>
          ))}
        </div>
        <div className="stella-calculator__operators">
          {operators.map((operator) => (
            <StellaButton
              key={operator}
              type="button"
              variant={engine.activeOperator === operator ? 'primary' : 'ghost'}
              onClick={() => engine.applyOperator(operator)}
            >
              {operator}
            </StellaButton>
          ))}
          <StellaButton type="button" variant="primary" onClick={engine.evaluate}>
            =
          </StellaButton>
        </div>
      </div>

      <div className="stella-calculator__actions">
        <StellaButton type="button" onClick={engine.clear}>
          Limpar
        </StellaButton>
        <StellaButton type="button" onClick={handleCopy}>
          {copied ? 'Copiado!' : 'Copiar resultado'}
        </StellaButton>
        {onUseResult && (
          <StellaButton type="button" variant="primary" onClick={() => onUseResult(Number(engine.display))}>
            Usar resultado
          </StellaButton>
        )}
      </div>

      {engine.history.length > 0 && (
        <div className="stella-calculator__history">
          <span className="stella-calculator__history-title">Últimos cálculos</span>
          <ul className="stella-calculator__history-list">
            {engine.history.map((entry) => (
              <li key={entry.id} className="stella-calculator__history-item">
                <span className="stella-calculator__history-expression">
                  {entry.expression} = {entry.result}
                </span>
                <StellaButton type="button" onClick={() => handleCopyHistoryEntry(entry.result)}>
                  Copiar
                </StellaButton>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
