import { useMemo, useState } from "react";
import {
  addPercentage,
  compoundInterest,
  percentageOf,
  simpleInterest,
  subtractPercentage,
} from "../game/percentage";

type Mode = "de" | "adicionar" | "remover" | "juros-simples" | "juros-compostos";

const MODE_LABEL: Record<Mode, string> = {
  de: "Porcentagem de um valor",
  adicionar: "Adicionar porcentagem",
  remover: "Remover porcentagem",
  "juros-simples": "Juros simples",
  "juros-compostos": "Juros compostos",
};

function formatBRL(value: number) {
  if (!Number.isFinite(value)) return "—";
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export default function PercentageCalculator() {
  const [mode, setMode] = useState<Mode>("de");
  const [value, setValue] = useState("");
  const [percent, setPercent] = useState("");
  const [periods, setPeriods] = useState("1");

  const parsedValue = Number(value.replace(",", "."));
  const parsedPercent = Number(percent.replace(",", "."));
  const parsedPeriods = Math.max(1, Math.round(Number(periods)) || 1);
  const hasInput = value !== "" && percent !== "";

  const result = useMemo(() => {
    if (!hasInput || Number.isNaN(parsedValue) || Number.isNaN(parsedPercent)) return null;
    switch (mode) {
      case "de":
        return { main: percentageOf(parsedValue, parsedPercent) };
      case "adicionar":
        return { main: addPercentage(parsedValue, parsedPercent) };
      case "remover":
        return { main: subtractPercentage(parsedValue, parsedPercent) };
      case "juros-simples": {
        const { interest, total } = simpleInterest(parsedValue, parsedPercent, parsedPeriods);
        return { main: total, interest };
      }
      case "juros-compostos": {
        const { interest, total } = compoundInterest(parsedValue, parsedPercent, parsedPeriods);
        return { main: total, interest };
      }
    }
  }, [mode, hasInput, parsedValue, parsedPercent, parsedPeriods]);

  const isInterestMode = mode === "juros-simples" || mode === "juros-compostos";

  return (
    <div className="percentage-calc">
      <select value={mode} onChange={(e) => setMode(e.target.value as Mode)} className="percentage-mode">
        {Object.entries(MODE_LABEL).map(([key, label]) => (
          <option key={key} value={key}>
            {label}
          </option>
        ))}
      </select>

      <div className="form">
        <input
          inputMode="decimal"
          placeholder="Valor (R$)"
          value={value}
          onChange={(e) => setValue(e.target.value)}
        />
        <input
          inputMode="decimal"
          placeholder="Porcentagem (%)"
          value={percent}
          onChange={(e) => setPercent(e.target.value)}
        />
        {isInterestMode && (
          <input
            inputMode="numeric"
            placeholder="Períodos"
            value={periods}
            onChange={(e) => setPeriods(e.target.value)}
            title="Quantidade de meses/períodos"
          />
        )}
      </div>

      {result && (
        <div className="finance-summary">
          {isInterestMode ? (
            <>
              <div className="summary-card">
                <span className="summary-label">Juros</span>
                <strong className="summary-value">{formatBRL(result.interest ?? 0)}</strong>
              </div>
              <div className="summary-card">
                <span className="summary-label">Total</span>
                <strong className="summary-value">{formatBRL(result.main)}</strong>
              </div>
            </>
          ) : (
            <div className="summary-card">
              <span className="summary-label">Resultado</span>
              <strong className="summary-value">{formatBRL(result.main)}</strong>
            </div>
          )}
        </div>
      )}
      {!result && <p className="hint">Preencha valor e porcentagem para calcular.</p>}
    </div>
  );
}
