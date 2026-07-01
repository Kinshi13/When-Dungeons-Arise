const MONTH_NAMES = [
  "janeiro", "fevereiro", "março", "abril", "maio", "junho",
  "julho", "agosto", "setembro", "outubro", "novembro", "dezembro",
];

export interface DetectedDate {
  day: number;
  month: number; // 1-12
  year?: number;
  matchText: string;
}

// Detecta uma menção de data (dia + mês) num texto livre, em dois formatos comuns
// em português: "10/07", "10/07/2026", "10-07" ou "10 de julho". Achado o primeiro
// válido, para — não tenta cobrir todo formato de data existente.
export function findDateMention(text: string): DetectedDate | null {
  const slashMatch = text.match(/\b(\d{1,2})[/-](\d{1,2})(?:[/-](\d{2,4}))?\b/);
  if (slashMatch) {
    const day = parseInt(slashMatch[1], 10);
    const month = parseInt(slashMatch[2], 10);
    if (day >= 1 && day <= 31 && month >= 1 && month <= 12) {
      const yearText = slashMatch[3];
      const year = yearText ? (yearText.length === 2 ? 2000 + parseInt(yearText, 10) : parseInt(yearText, 10)) : undefined;
      return { day, month, year, matchText: slashMatch[0] };
    }
  }

  const wordMatch = text.match(new RegExp(`\\b(\\d{1,2})\\s+de\\s+(${MONTH_NAMES.join("|")})\\b`, "i"));
  if (wordMatch) {
    const day = parseInt(wordMatch[1], 10);
    const month = MONTH_NAMES.indexOf(wordMatch[2].toLowerCase()) + 1;
    if (day >= 1 && day <= 31 && month >= 1) {
      return { day, month, matchText: wordMatch[0] };
    }
  }

  return null;
}

// Resolve a data detectada pro próximo ISO futuro: usa o ano informado, ou o ano
// atual — e se essa data já passou neste ano, empurra pro ano seguinte.
export function resolveDateToISO(detected: DetectedDate): string {
  const now = new Date();
  const year = detected.year ?? now.getFullYear();
  let date = new Date(year, detected.month - 1, detected.day, 9, 0, 0);
  if (!detected.year && date.getTime() < now.getTime() - 24 * 60 * 60 * 1000) {
    date = new Date(year + 1, detected.month - 1, detected.day, 9, 0, 0);
  }
  return date.toISOString();
}
