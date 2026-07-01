export interface Holiday {
  date: string; // YYYY-MM-DD
  name: string;
}

// Algoritmo de Gauss (Anonymous Gregorian algorithm) pra achar o domingo de Páscoa.
function easterSunday(year: number): Date {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(year, month - 1, day);
}

function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function toDateKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

// Feriados nacionais brasileiros. Cobre o suficiente pra uso prático na Agenda —
// não inclui feriados municipais/estaduais (pontos facultativos variam por cidade).
export function getBrazilianHolidays(year: number): Holiday[] {
  const easter = easterSunday(year);

  const fixed: Holiday[] = [
    { date: `${year}-01-01`, name: "Confraternização Universal" },
    { date: `${year}-04-21`, name: "Tiradentes" },
    { date: `${year}-05-01`, name: "Dia do Trabalho" },
    { date: `${year}-09-07`, name: "Independência do Brasil" },
    { date: `${year}-10-12`, name: "Nossa Senhora Aparecida" },
    { date: `${year}-11-02`, name: "Finados" },
    { date: `${year}-11-15`, name: "Proclamação da República" },
    { date: `${year}-11-20`, name: "Consciência Negra" },
    { date: `${year}-12-25`, name: "Natal" },
  ];

  const movable: Holiday[] = [
    { date: toDateKey(addDays(easter, -47)), name: "Carnaval" },
    { date: toDateKey(addDays(easter, -2)), name: "Sexta-feira Santa" },
    { date: toDateKey(easter), name: "Páscoa" },
    { date: toDateKey(addDays(easter, 60)), name: "Corpus Christi" },
  ];

  return [...fixed, ...movable].sort((a, b) => a.date.localeCompare(b.date));
}
