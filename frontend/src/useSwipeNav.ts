// A qual das áreas principais uma rota pertence — usado pra resolver o
// fundo/ambiente Lo-fi da área atual e o destaque da dock (ver activeTabOf
// em App.tsx). Tarefas (antigo Mural) e Diário viraram sub-abas de Tempo,
// por isso caem no mesmo startsWith("/sala-do-tempo") de Agenda/Calendário.
export function sectionOf(pathname: string): string | null {
  if (pathname === "/") return "guilda";
  if (pathname.startsWith("/tesouraria")) return "tesouraria";
  if (pathname.startsWith("/sala-do-tempo")) return "tempo";
  if (pathname === "/biblioteca") return "biblioteca";
  if (pathname.startsWith("/regras")) return "ajustes";
  return null;
}
