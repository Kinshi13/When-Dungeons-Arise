export function todayIso(): string {
  return new Date().toISOString();
}

export function toDateOnly(iso: string): string {
  return iso.slice(0, 10);
}

export function isSameDay(a: string, b: string): boolean {
  return toDateOnly(a) === toDateOnly(b);
}

export function monthKey(iso: string): string {
  return iso.slice(0, 7);
}

export function addMonths(iso: string, months: number): string {
  const date = new Date(iso);
  date.setMonth(date.getMonth() + months);
  return date.toISOString();
}
