export interface CurrencyRates {
  usdToBrl: number;
  eurToBrl: number;
  updatedAt: string;
  source: "live" | "manual";
}

const STORAGE_KEY = "lembretes-app:currency-rates";

// API gratuita, sem chave, com CORS liberado pra uso direto do navegador/WebView.
const RATES_URL = "https://open.er-api.com/v6/latest/USD";

function loadCached(): CurrencyRates | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function saveCached(rates: CurrencyRates) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(rates));
}

export function getCachedRates(): CurrencyRates | null {
  return loadCached();
}

const FETCH_TIMEOUT_MS = 8000;

// Busca a cotação ao vivo — se falhar (sem internet, API fora do ar, conexão
// travada) retorna null e quem chamou continua com o que já tinha guardado
// (ou pede pro usuário informar manualmente). O timeout evita que o botão de
// atualizar fique preso pra sempre numa rede lenta/instável.
export async function fetchLiveRates(): Promise<CurrencyRates | null> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
    const res = await fetch(RATES_URL, { signal: controller.signal }).finally(() => clearTimeout(timeout));
    if (!res.ok) return null;
    const data = await res.json();
    const usdToBrl = data.rates?.BRL;
    const usdToEur = data.rates?.EUR;
    if (!usdToBrl || !usdToEur) return null;

    const rates: CurrencyRates = {
      usdToBrl,
      eurToBrl: usdToBrl / usdToEur,
      updatedAt: new Date().toISOString(),
      source: "live",
    };
    saveCached(rates);
    return rates;
  } catch {
    return null;
  }
}

export function setManualRates(usdToBrl: number, eurToBrl: number): CurrencyRates {
  const rates: CurrencyRates = { usdToBrl, eurToBrl, updatedAt: new Date().toISOString(), source: "manual" };
  saveCached(rates);
  return rates;
}
