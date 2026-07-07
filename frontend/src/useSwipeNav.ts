// A qual das 5 telas principais da dock uma rota pertence — usado pra
// resolver o fundo/ambiente Lo-fi da área atual. Rotas fora da dock (Diário,
// Biblioteca, Ajustes, Leitor) retornam null aqui; activeTabOf() em App.tsx
// trata esses casos à parte pra fins de destaque da dock.
export function sectionOf(pathname: string): string | null {
  if (pathname === "/") return "guilda";
  if (pathname.startsWith("/missoes")) return "mural";
  if (pathname.startsWith("/tesouraria")) return "tesouraria";
  if (pathname.startsWith("/sala-do-tempo")) return "tempo";
  if (pathname.startsWith("/regras")) return "ajustes";
  return null;
}
