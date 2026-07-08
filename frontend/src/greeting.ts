// Saudação por horário do dia — compartilhada entre o painel da secretária
// (desktop) e a barra superior da Recepção (mobile).
export function greetingForHour(hour: number): string {
  if (hour < 12) return "Bom dia";
  if (hour < 18) return "Boa tarde";
  return "Boa noite";
}

export function greeting(): string {
  return greetingForHour(new Date().getHours());
}
