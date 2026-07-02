import { useRef, useState } from "react";
import ThemesScreen from "../components/ThemesScreen";
import { playSfx } from "../sound";
import { useVerticalSwipe } from "../useVerticalSwipe";
import { useSettings, isLofiTheme } from "../contexts/SettingsContext";
import { HourglassIcon } from "../icons";
import ClockScreen from "../components/ClockScreen";
import WeatherWidget, { type WeatherWidgetHandle } from "../components/WeatherWidget";
import WeatherScreen from "../components/WeatherScreen";

export default function GuildReception() {
  const [themesOpen, setThemesOpen] = useState(false);
  const [clockOpen, setClockOpen] = useState(false);
  const [weatherOpen, setWeatherOpen] = useState(false);
  const weatherWidgetRef = useRef<WeatherWidgetHandle>(null);
  const { theme } = useSettings();
  const isLofi = isLofiTheme(theme);

  // Deslizar pra cima abre o Relógio, pra baixo abre o Clima — o gesto
  // reverso (fechar) mora em cada tela (ver ClockScreen/WeatherScreen), que
  // capturam o próprio toque por serem overlays em tela cheia.
  const verticalSwipe = useVerticalSwipe(
    () => {
      playSfx("coin");
      setClockOpen(true);
    },
    () => {
      playSfx("coin");
      setWeatherOpen(true);
    }
  );

  return (
    <div className="page reception-page" {...verticalSwipe}>
      <h1 className="sr-only">Recepção da Guilda</h1>

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

      <WeatherWidget
        ref={weatherWidgetRef}
        onOpen={() => {
          playSfx("coin");
          setWeatherOpen(true);
        }}
      />

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
      <WeatherScreen
        open={weatherOpen}
        onClose={() => {
          setWeatherOpen(false);
          weatherWidgetRef.current?.refresh();
        }}
        onPlacesChanged={() => weatherWidgetRef.current?.refresh()}
      />
    </div>
  );
}
