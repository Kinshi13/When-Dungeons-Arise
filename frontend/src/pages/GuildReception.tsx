import { useState } from "react";
import { Link } from "react-router-dom";
import ThemesScreen from "../components/ThemesScreen";
import { playSfx } from "../sound";
import { pendingSwipeDirection } from "../useSwipeNav";
import { useSettings, isLofiTheme } from "../contexts/SettingsContext";
import { DiaryIcon, BookIcon, HourglassIcon } from "../icons";
import ClockScreen from "../components/ClockScreen";
import WeatherWidget from "../components/WeatherWidget";

export default function GuildReception() {
  const [themesOpen, setThemesOpen] = useState(false);
  const [clockOpen, setClockOpen] = useState(false);
  const { theme } = useSettings();
  const isLofi = isLofiTheme(theme);

  return (
    <div className="page reception-page">
      <h1 className="sr-only">Recepção da Guilda</h1>

      <Link
        to="/diario/notas"
        className="reception-edge-tap reception-edge-left"
        aria-label="Diário"
        onClick={() => {
          playSfx("coin");
          // Entra deslizando da esquerda — mesmo lado do ícone tocado, e o
          // reverso de como se sai (arrastando pra esquerda) de volta aqui.
          pendingSwipeDirection.current = -1;
        }}
      >
        {isLofi ? (
          <span className="reception-edge-icon-lofi">
            <DiaryIcon width={26} height={26} />
          </span>
        ) : (
          <img className="reception-edge-icon" src="/icons-nav/icon-diario.png" alt="" />
        )}
      </Link>
      <Link
        to="/biblioteca"
        className="reception-edge-tap reception-edge-right"
        aria-label="Biblioteca"
        onClick={() => {
          playSfx("coin");
          pendingSwipeDirection.current = 1;
        }}
      >
        {isLofi ? (
          <span className="reception-edge-icon-lofi">
            <BookIcon width={26} height={26} />
          </span>
        ) : (
          <img className="reception-edge-icon" src="/icons-nav/icon-biblioteca.png" alt="" />
        )}
      </Link>

      {/* Balão de fala em branco já desenhado na arte de fundo — o link mora
          dentro dele. No tema Lo-fi (sem a arte/balão) vira um botão flat
          normal, ancorado no topo. */}
      <div className={isLofi ? "reception-dialog-bubble-lofi" : "reception-dialog-bubble"}>
        <button
          className={isLofi ? "reception-dialog-bubble-link-lofi" : "reception-dialog-bubble-link"}
          onClick={() => {
            playSfx("coin");
            setThemesOpen(true);
          }}
        >
          Temas
        </button>
      </div>

      <WeatherWidget />

      {/* Botão do Relógio — ampulheta centralizada acima da barra de navegação. */}
      <button
        className="reception-clock-btn"
        aria-label="Relógio"
        onClick={() => {
          playSfx("coin");
          setClockOpen(true);
        }}
      >
        <HourglassIcon width={28} height={28} />
      </button>

      <ThemesScreen open={themesOpen} onClose={() => setThemesOpen(false)} />
      <ClockScreen open={clockOpen} onClose={() => setClockOpen(false)} />
    </div>
  );
}
