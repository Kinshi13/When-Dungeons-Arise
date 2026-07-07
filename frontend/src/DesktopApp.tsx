import { NavLink, Navigate, Route, Routes, useLocation } from "react-router-dom";
import { useEffect, useMemo, useState, type SVGProps, type ReactElement } from "react";
import GuildReception from "./pages/GuildReception";
import MissionBoard from "./pages/MissionBoard";
import TimeRoom from "./pages/TimeRoom";
import Treasury from "./pages/Treasury";
import AdventureDiary from "./pages/AdventureDiary";
import Library from "./pages/Library";
import RulesBook from "./pages/RulesBook";
import ReaderScreen from "./pages/ReaderScreen";
import DueBillsPopup from "./components/DueBillsPopup";
import AlarmRinger from "./components/AlarmRinger";
import Splash from "./components/Splash";
import { useSettings, isLofiTheme } from "./contexts/SettingsContext";
import { api, type Bill, type Reminder } from "./api";
import { nextAlarm, type Alarm } from "./clockStore";
import { getCachedPrimaryWeather, fetchPrimaryWeather, type WeatherInfo } from "./weather";
import { buildHomeSummary } from "./game/homeSummary";
import {
  TabBellIcon,
  TabCoinsIcon,
  TabGuildIcon,
  TabHomeCalendarIcon,
  TabGearIcon,
  TabDiaryIcon,
  TabBookIcon,
} from "./icons2";
import "./DesktopApp.css";

interface NavItem {
  to: string;
  end?: boolean;
  label: string;
  Icon: (props: SVGProps<SVGSVGElement>) => ReactElement;
}

const NAV_ITEMS: NavItem[] = [
  { to: "/", end: true, label: "Guilda", Icon: TabGuildIcon },
  { to: "/missoes", label: "Mural", Icon: TabBellIcon },
  { to: "/tesouraria", label: "Tesouraria", Icon: TabCoinsIcon },
  { to: "/sala-do-tempo", label: "Sala do Tempo", Icon: TabHomeCalendarIcon },
  { to: "/diario/notas", label: "Diário", Icon: TabDiaryIcon },
  { to: "/biblioteca", label: "Biblioteca", Icon: TabBookIcon },
  { to: "/regras", label: "Ajustes", Icon: TabGearIcon },
];

function greeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Bom dia";
  if (hour < 18) return "Boa tarde";
  return "Boa noite";
}

// Painel fixo à direita — a "secretária": mesmo resumo da Recepção
// (buildHomeSummary), só que sempre visível, em qualquer tela, e com listas
// dos próximos lembretes/contas (a Recepção só mostra o item mais urgente).
function SecretaryPanel() {
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [bills, setBills] = useState<Bill[]>([]);
  const [weather, setWeather] = useState<WeatherInfo | null>(() => getCachedPrimaryWeather());
  const [alarm, setAlarm] = useState<Alarm | null>(() => nextAlarm());

  useEffect(() => {
    function refresh() {
      api.reminders.list().then(setReminders);
      api.bills.list().then(setBills);
      setAlarm(nextAlarm());
    }
    refresh();
    fetchPrimaryWeather().then((data) => {
      if (data) setWeather(data);
    });
    // Volta o foco pra janela (usuário trocou de app e voltou) é o momento
    // natural pra recarregar no desktop — não existe "remontar ao navegar
    // de volta pra Recepção" aqui, já que o painel é fixo e nunca desmonta.
    window.addEventListener("focus", refresh);
    const interval = setInterval(refresh, 60_000);
    return () => {
      window.removeEventListener("focus", refresh);
      clearInterval(interval);
    };
  }, []);

  const summary = useMemo(() => buildHomeSummary(reminders, bills, weather, alarm), [reminders, bills, weather, alarm]);

  const upcomingReminders = useMemo(() => {
    const now = Date.now();
    return reminders
      .filter((r) => !r.done && !r.isBirthday && new Date(r.dateTime).getTime() >= now)
      .sort((a, b) => new Date(a.dateTime).getTime() - new Date(b.dateTime).getTime())
      .slice(0, 5);
  }, [reminders]);

  const upcomingBills = useMemo(
    () =>
      bills
        .filter((b) => b.status === "PENDENTE")
        .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
        .slice(0, 5),
    [bills]
  );

  return (
    <aside className="secretary-panel">
      <div className="secretary-header">
        <span className="secretary-avatar" aria-hidden="true">
          🕯️
        </span>
        <div>
          <p className="secretary-greeting">{greeting()}!</p>
          <p className="secretary-subtitle">Sua secretária está de olho em tudo.</p>
        </div>
      </div>

      <div className="secretary-summary">
        {summary.weather && (
          <div className="secretary-row">
            <span aria-hidden="true">{summary.weather.icon}</span> {summary.weather.text}
          </div>
        )}
        {summary.alarm && (
          <div className="secretary-row">
            <span aria-hidden="true">{summary.alarm.icon}</span> {summary.alarm.text}
          </div>
        )}
        {summary.highlight ? (
          <div className="secretary-row secretary-highlight">
            <span aria-hidden="true">{summary.highlight.icon}</span> {summary.highlight.text}
          </div>
        ) : (
          <div className="secretary-row secretary-empty">Nada urgente por perto.</div>
        )}
      </div>

      <div className="secretary-section">
        <h3>Próximos lembretes</h3>
        {upcomingReminders.length === 0 ? (
          <p className="secretary-empty">Nenhum lembrete por vir.</p>
        ) : (
          <ul>
            {upcomingReminders.map((r) => (
              <li key={r.id}>
                <span className="secretary-item-title">{r.title}</span>
                <span className="secretary-item-date">
                  {new Date(r.dateTime).toLocaleString("pt-BR", {
                    day: "2-digit",
                    month: "2-digit",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="secretary-section">
        <h3>Contas a pagar</h3>
        {upcomingBills.length === 0 ? (
          <p className="secretary-empty">Nenhuma conta pendente.</p>
        ) : (
          <ul>
            {upcomingBills.map((b) => (
              <li key={b.id}>
                <span className="secretary-item-title">{b.title}</span>
                <span className="secretary-item-date">
                  {new Date(b.dueDate).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" })}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </aside>
  );
}

// Shell largo pro app de computador: barra lateral de navegação (mouse, sem
// gesto de arraste) + o mesmo conteúdo de tela do Android num cartão central
// + painel fixo da "secretária" à direita. As telas em si (Recepção, Mural,
// Tesouraria...) são reaproveitadas sem nenhuma mudança — só o "chrome" ao
// redor delas é outro.
function DesktopApp() {
  const { theme } = useSettings();
  const isLofi = isLofiTheme(theme);
  const location = useLocation();
  const isReader = location.pathname.startsWith("/leitor");

  if (isReader) {
    return (
      <Routes>
        <Route path="/leitor/:id" element={<ReaderScreen />} />
      </Routes>
    );
  }

  return (
    <>
      <Splash />
      <div className={`desktop-shell${isLofi ? " desktop-shell-lofi" : ""}`}>
        <nav className="desktop-sidebar">
          <div className="desktop-sidebar-brand">Guilda de Aventureiros</div>
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) => `desktop-nav-item${isActive ? " desktop-nav-item-active" : ""}`}
            >
              <item.Icon />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <main className="desktop-main">
          <div className="app desktop-app-frame">
            <div className="main desktop-page-frame">
              <Routes>
                <Route path="/" element={<GuildReception />} />
                <Route path="/missoes" element={<Navigate to="/missoes/hoje" replace />} />
                <Route path="/missoes/hoje" element={<MissionBoard />} />
                <Route path="/missoes/missoes" element={<MissionBoard />} />
                <Route path="/missoes/caixa" element={<MissionBoard />} />
                <Route path="/sala-do-tempo" element={<Navigate to="/sala-do-tempo/calendario" replace />} />
                <Route path="/sala-do-tempo/calendario" element={<TimeRoom />} />
                <Route path="/sala-do-tempo/agenda" element={<TimeRoom />} />
                <Route path="/sala-do-tempo/linha-do-tempo" element={<TimeRoom />} />
                <Route path="/tesouraria" element={<Navigate to="/tesouraria/visao-geral" replace />} />
                <Route path="/tesouraria/visao-geral" element={<Treasury />} />
                <Route path="/tesouraria/movimentos" element={<Treasury />} />
                <Route path="/tesouraria/contas" element={<Treasury />} />
                <Route path="/tesouraria/analises" element={<Treasury />} />
                <Route path="/tesouraria/ferramentas" element={<Treasury />} />
                <Route path="/diario" element={<Navigate to="/diario/notas" replace />} />
                <Route path="/diario/notas" element={<AdventureDiary />} />
                <Route path="/diario/listas" element={<AdventureDiary />} />
                <Route path="/biblioteca" element={<Library />} />
                <Route path="/regras" element={<RulesBook />} />
              </Routes>
            </div>
          </div>
          <DueBillsPopup />
          <AlarmRinger />
        </main>

        <SecretaryPanel />
      </div>
    </>
  );
}

export default DesktopApp;
