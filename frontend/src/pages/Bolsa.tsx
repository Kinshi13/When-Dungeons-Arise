import { useState, type SVGProps, type ReactElement } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronRightIcon, HourglassIcon, ProfileIcon } from "../icons";
import { TabDiaryIcon, TabBookIcon, TabGearIcon, TabWeatherIcon } from "../icons2";
import ClockScreen from "../components/ClockScreen";
import WeatherScreen from "../components/WeatherScreen";
import { playSfx } from "../sound";

interface BolsaCard {
  key: string;
  label: string;
  hint: string;
  Icon: (props: SVGProps<SVGSVGElement>) => ReactElement;
  onOpen: () => void;
}

// Hub das ferramentas pessoais que não ocupam destino próprio na dock —
// Diário e Biblioteca navegam pra rota que já existe; Relógio e Clima não
// têm rota própria (são overlays abertos localmente, igual a Recepção já
// faz — ver GuildReception.tsx); Conta e Sincronização/Ajustes levam pra
// Settings (que mora dentro de /regras).
export default function Bolsa() {
  const navigate = useNavigate();
  const [clockOpen, setClockOpen] = useState(false);
  const [weatherOpen, setWeatherOpen] = useState(false);

  function open(action: () => void) {
    playSfx("coin");
    action();
  }

  const cards: BolsaCard[] = [
    {
      key: "diario",
      label: "Diário",
      hint: "Notas, pensamentos e listas",
      Icon: TabDiaryIcon,
      onOpen: () => navigate("/diario/notas"),
    },
    {
      key: "biblioteca",
      label: "Biblioteca",
      hint: "Livros e documentos",
      Icon: TabBookIcon,
      onOpen: () => navigate("/biblioteca"),
    },
    {
      key: "relogio",
      label: "Relógio",
      hint: "Alarmes, cronômetro e temporizador",
      Icon: HourglassIcon,
      onOpen: () => setClockOpen(true),
    },
    {
      key: "clima",
      label: "Clima",
      hint: "Previsão completa dos seus locais",
      Icon: TabWeatherIcon,
      onOpen: () => setWeatherOpen(true),
    },
    {
      key: "sincronizacao",
      label: "Conta e Sincronização",
      hint: "Seus dados entre aparelhos",
      Icon: ProfileIcon,
      onOpen: () => navigate("/regras"),
    },
    {
      key: "ajustes",
      label: "Ajustes",
      hint: "Preferências do aplicativo",
      Icon: TabGearIcon,
      onOpen: () => navigate("/regras"),
    },
  ];

  return (
    <div className="page">
      <h1>Bolsa</h1>
      <div className="bolsa-card-list">
        {cards.map((card) => (
          <button key={card.key} className="settings-section bolsa-card" onClick={() => open(card.onOpen)}>
            <span className="bolsa-card-icon" aria-hidden="true">
              <card.Icon width={22} height={22} />
            </span>
            <span className="bolsa-card-text">
              <strong>{card.label}</strong>
              <span className="hint">{card.hint}</span>
            </span>
            <ChevronRightIcon width={18} height={18} />
          </button>
        ))}
      </div>

      <ClockScreen open={clockOpen} onClose={() => setClockOpen(false)} initialTab="despertador" />
      <WeatherScreen open={weatherOpen} onClose={() => setWeatherOpen(false)} />
    </div>
  );
}
