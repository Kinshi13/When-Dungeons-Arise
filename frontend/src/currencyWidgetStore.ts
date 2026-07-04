export interface CurrencyPairOption {
  code: string;
  label: string;
}

// Pares suportados pela AwesomeAPI (gratuita, sem chave) usados no widget de Câmbio.
export const CURRENCY_PAIRS: CurrencyPairOption[] = [
  { code: "USD-BRL", label: "Dólar (USD)" },
  { code: "EUR-BRL", label: "Euro (EUR)" },
  { code: "GBP-BRL", label: "Libra (GBP)" },
  { code: "ARS-BRL", label: "Peso argentino (ARS)" },
  { code: "BTC-BRL", label: "Bitcoin (BTC)" },
];

const KEY = "lembretes-app:currency-widget-pair";
const DEFAULT_PAIR = "USD-BRL";

export function getCurrencyWidgetPair(): string {
  try {
    return localStorage.getItem(KEY) ?? DEFAULT_PAIR;
  } catch {
    return DEFAULT_PAIR;
  }
}

export function setCurrencyWidgetPair(code: string) {
  try {
    localStorage.setItem(KEY, code);
  } catch {
    // sem localStorage disponível, segue sem persistir
  }
}
