import { useEffect, useMemo, useState, type FormEvent } from "react";
import {
  addPercentage,
  compoundInterest,
  percentageOf,
  simpleInterest,
  subtractPercentage,
} from "../core/domain/percentage";
import { fetchLiveRates, getCachedRates, setManualRates, type CurrencyRates } from "../currencyRates";
import { PlusIcon } from "../icons";

type Mode = "de" | "adicionar" | "remover" | "juros-simples" | "juros-compostos" | "dolar" | "euro";

const MODE_LABEL: Record<Mode, string> = {
  de: "Porcentagem de um valor",
  adicionar: "Adicionar porcentagem",
  remover: "Remover porcentagem",
  "juros-simples": "Juros simples",
  "juros-compostos": "Juros compostos",
  dolar: "Cotação do dólar",
  euro: "Cotação do euro",
};

// Rótulos curtos para os botões de modo (mesmo padrão dos filtros da aba
// Contas) — o texto completo do modo aparece como legenda abaixo.
const MODE_BUTTON_LABEL: Record<Mode, string> = {
  de: "% de",
  adicionar: "+ %",
  remover: "− %",
  "juros-simples": "Juros simples",
  "juros-compostos": "Juros compostos",
  dolar: "Dólar",
  euro: "Euro",
};

function formatBRL(value: number) {
  if (!Number.isFinite(value)) return "—";
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function relativeTime(iso: string): string {
  const diffMin = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (diffMin < 1) return "agora";
  if (diffMin < 60) return `há ${diffMin} min`;
  const diffH = Math.round(diffMin / 60);
  if (diffH < 24) return `há ${diffH}h`;
  return `há ${Math.round(diffH / 24)}d`;
}

function CurrencyConverter({ currency }: { currency: "USD" | "EUR" }) {
  const [rates, setRates] = useState<CurrencyRates | null>(() => getCachedRates());
  const [loading, setLoading] = useState(false);
  const [brlValue, setBrlValue] = useState("");
  const [foreignValue, setForeignValue] = useState("");
  const [editingRate, setEditingRate] = useState(false);
  const [rateInput, setRateInput] = useState("");

  useEffect(() => {
    setLoading(true);
    fetchLiveRates().then((r) => {
      if (r) setRates(r);
      setLoading(false);
    });
  }, []);

  const rate = currency === "USD" ? rates?.usdToBrl : rates?.eurToBrl;
  const symbol = currency === "USD" ? "US$" : "€";

  function handleBrlChange(v: string) {
    setBrlValue(v);
    if (!rate) return;
    const num = Number(v.replace(",", "."));
    setForeignValue(v && Number.isFinite(num) ? (num / rate).toFixed(2) : "");
  }

  function handleForeignChange(v: string) {
    setForeignValue(v);
    if (!rate) return;
    const num = Number(v.replace(",", "."));
    setBrlValue(v && Number.isFinite(num) ? (num * rate).toFixed(2) : "");
  }

  async function handleRefresh() {
    setLoading(true);
    const r = await fetchLiveRates();
    if (r) setRates(r);
    setLoading(false);
  }

  function handleSetManualRate(e: FormEvent) {
    e.preventDefault();
    const num = Number(rateInput.replace(",", "."));
    if (!num || num <= 0) return;
    const updated =
      currency === "USD"
        ? setManualRates(num, rates?.eurToBrl ?? 0)
        : setManualRates(rates?.usdToBrl ?? 0, num);
    setRates(updated);
    setEditingRate(false);
    setRateInput("");
  }

  return (
    <div>
      <div className="form">
        <input
          inputMode="decimal"
          placeholder="Valor em R$"
          value={brlValue}
          onChange={(e) => handleBrlChange(e.target.value)}
        />
        <input
          inputMode="decimal"
          placeholder={`Valor em ${symbol}`}
          value={foreignValue}
          onChange={(e) => handleForeignChange(e.target.value)}
        />
      </div>

      {rate ? (
        <p className="hint">
          Cotação: 1 {symbol} = {formatBRL(rate)}
          {rates?.source === "manual" ? " (definida manualmente)" : ""} · atualizada{" "}
          {rates ? relativeTime(rates.updatedAt) : ""}
        </p>
      ) : (
        <p className="hint">Sem cotação disponível ainda — atualize com internet ou informe manualmente.</p>
      )}

      <div className="currency-converter-actions">
        <button type="button" className="small" onClick={handleRefresh} disabled={loading}>
          {loading ? "Atualizando..." : "Atualizar cotação"}
        </button>
        <button type="button" className="small" onClick={() => setEditingRate((v) => !v)}>
          Definir manualmente
        </button>
      </div>

      {editingRate && (
        <form onSubmit={handleSetManualRate} className="form">
          <input
            inputMode="decimal"
            placeholder={`1 ${symbol} vale quantos R$?`}
            value={rateInput}
            onChange={(e) => setRateInput(e.target.value)}
            autoFocus
          />
          <button type="submit" className="icon-btn primary" aria-label="Confirmar cotação">
            <PlusIcon width={16} height={16} />
          </button>
        </form>
      )}
    </div>
  );
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
      default:
        return null;
    }
  }, [mode, hasInput, parsedValue, parsedPercent, parsedPeriods]);

  const isInterestMode = mode === "juros-simples" || mode === "juros-compostos";
  const isCurrencyMode = mode === "dolar" || mode === "euro";

  return (
    <div className="percentage-calc">
      <div className="filters">
        {(Object.entries(MODE_BUTTON_LABEL) as [Mode, string][]).map(([key, label]) => (
          <button
            key={key}
            type="button"
            className={mode === key ? "filter active" : "filter"}
            onClick={() => setMode(key)}
          >
            {label}
          </button>
        ))}
      </div>
      <p className="hint percentage-mode-hint">{MODE_LABEL[mode]}</p>

      {isCurrencyMode && <CurrencyConverter currency={mode === "dolar" ? "USD" : "EUR"} />}

      {!isCurrencyMode && (
        <>
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
        </>
      )}
    </div>
  );
}
