import { Link, useLocation } from "react-router-dom";

interface TempoTab {
  to: string;
  label: string;
  matchPrefix: string;
}

// As 5 sub-áreas de Tempo (calendário, agenda, linha do tempo, tarefas —
// antigo Mural — e diário), todas sob /sala-do-tempo. Compartilhada por
// TimeRoom, MissionBoard e AdventureDiary pra dar a sensação de uma tela só
// com sub-abas, mesmo cada uma sendo uma rota/componente próprio por baixo.
const TEMPO_TABS: TempoTab[] = [
  { to: "/sala-do-tempo/calendario", label: "Mês", matchPrefix: "/sala-do-tempo/calendario" },
  { to: "/sala-do-tempo/agenda", label: "Agenda", matchPrefix: "/sala-do-tempo/agenda" },
  { to: "/sala-do-tempo/linha-do-tempo", label: "Linha do Tempo", matchPrefix: "/sala-do-tempo/linha-do-tempo" },
  { to: "/sala-do-tempo/tarefas", label: "Tarefas", matchPrefix: "/sala-do-tempo/tarefas" },
  { to: "/sala-do-tempo/diario", label: "Diário", matchPrefix: "/sala-do-tempo/diario" },
];

export default function TempoTabBar() {
  const location = useLocation();
  return (
    <div className="drawer-tabs drawer-tabs-tempo">
      {TEMPO_TABS.map((t) => (
        <Link
          key={t.to}
          to={t.to}
          className={location.pathname.startsWith(t.matchPrefix) ? "drawer-tab active" : "drawer-tab"}
        >
          {t.label}
        </Link>
      ))}
    </div>
  );
}
