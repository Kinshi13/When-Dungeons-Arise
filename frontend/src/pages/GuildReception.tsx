import { useRef, useState, type TouchEvent } from "react";
import ThemesScreen from "../components/ThemesScreen";
import { playSfx } from "../sound";
import { useVerticalSwipe } from "../useVerticalSwipe";
import { useSettings, isLofiTheme } from "../contexts/SettingsContext";
import { HourglassIcon } from "../icons";
import { FlowerDecorIcon } from "../icons2";
import ClockScreen from "../components/ClockScreen";
import WeatherWidget, { type WeatherWidgetHandle } from "../components/WeatherWidget";
import WeatherScreen from "../components/WeatherScreen";
import { nextAlarm, type Alarm } from "../clockStore";

type ClockTab = "despertador" | "cronometro" | "temporizador";

const CARD_SWIPE_ACTIVATION = 10;
const CARD_SWIPE_THRESHOLD = 40;

// Gesto horizontal só do card do Relógio: deslizar pra esquerda/direita abre
// direto no Cronômetro/Temporizador em vez do Despertador. Precisa de
// stopPropagation pra não competir com o swipe horizontal entre abas (que
// escuta o mesmo eixo em .main, um nível acima) — sem isso os dois
// disputariam o mesmo gesto.
function useClockCardSwipe(onSwipeLeft: () => void, onSwipeRight: () => void) {
  const startX = useRef<number | null>(null);
  const startY = useRef<number | null>(null);
  const decided = useRef(false);

  function onTouchStart(e: TouchEvent) {
    startX.current = e.touches[0].clientX;
    startY.current = e.touches[0].clientY;
    decided.current = false;
  }

  function onTouchMove(e: TouchEvent) {
    if (startX.current === null || startY.current === null) return;
    // Precisa parar em TODO touchmove daqui em diante (não só no que decide)
    // — mesmo raciocínio do useVerticalSwipe: a Recepção também escuta um
    // gesto vertical no mesmo elemento, e um touchmove que escapasse sem
    // stopPropagation deixaria ela decidir por conta própria mais tarde.
    if (decided.current) {
      e.stopPropagation();
      return;
    }
    const dx = e.touches[0].clientX - startX.current;
    const dy = e.touches[0].clientY - startY.current;
    if (Math.abs(dx) < CARD_SWIPE_ACTIVATION || Math.abs(dx) < Math.abs(dy) * 1.5) return;
    decided.current = true;
    e.stopPropagation();
  }

  function onTouchEnd(e: TouchEvent) {
    if (!decided.current || startX.current === null) {
      startX.current = null;
      startY.current = null;
      return;
    }
    e.stopPropagation();
    const dx = e.changedTouches[0].clientX - startX.current;
    if (Math.abs(dx) > CARD_SWIPE_THRESHOLD) {
      if (dx < 0) onSwipeLeft();
      else onSwipeRight();
    }
    startX.current = null;
    startY.current = null;
    decided.current = false;
  }

  return { onTouchStart, onTouchMove, onTouchEnd };
}

function nextAlarmLabel(alarm: Alarm | null): string {
  if (!alarm) return "Nenhum alarme";
  return alarm.label ? `${alarm.time} · ${alarm.label}` : alarm.time;
}

export default function GuildReception() {
  const [themesOpen, setThemesOpen] = useState(false);
  const [clockOpen, setClockOpen] = useState(false);
  const [clockTab, setClockTab] = useState<ClockTab>("despertador");
  const [weatherOpen, setWeatherOpen] = useState(false);
  const [nextAlarmInfo, setNextAlarmInfo] = useState<Alarm | null>(() => nextAlarm());
  const weatherWidgetRef = useRef<WeatherWidgetHandle>(null);
  const { theme } = useSettings();
  const isLofi = isLofiTheme(theme);

  function openClock(tab: ClockTab) {
    playSfx("coin");
    setClockTab(tab);
    setClockOpen(true);
  }

  const clockCardSwipe = useClockCardSwipe(
    () => openClock("cronometro"),
    () => openClock("temporizador")
  );

  // Deslizar pra cima abre o Relógio, pra baixo abre o Clima — o gesto
  // reverso (fechar) mora em cada tela (ver ClockScreen/WeatherScreen), que
  // capturam o próprio toque por serem overlays em tela cheia.
  const verticalSwipe = useVerticalSwipe(
    () => openClock("despertador"),
    () => {
      playSfx("coin");
      setWeatherOpen(true);
    }
  );

  return (
    <div className="page reception-page" {...verticalSwipe}>
      <h1 className="sr-only">Recepção da Guilda</h1>

      {isLofi ? (
        <div className="reception-cards">
          <button
            className="reception-card reception-card-temas"
            onClick={() => {
              playSfx("coin");
              setThemesOpen(true);
            }}
          >
            <FlowerDecorIcon className="reception-card-temas-flower" aria-hidden="true" />
            <span className="reception-card-temas-label">Temas</span>
          </button>

          <WeatherWidget
            ref={weatherWidgetRef}
            onOpen={() => {
              playSfx("coin");
              setWeatherOpen(true);
            }}
          />

          <button
            className="reception-card reception-card-relogio"
            aria-label="Relógio — deslize para cronômetro ou temporizador"
            onClick={() => openClock("despertador")}
            {...clockCardSwipe}
          >
            <HourglassIcon width={24} height={24} />
            <span className="reception-card-relogio-label">{nextAlarmLabel(nextAlarmInfo)}</span>
            <span className="reception-card-relogio-hint">Deslize p/ cronômetro/temporizador</span>
          </button>
        </div>
      ) : (
        <>
          {/* Balão de fala em branco já desenhado na arte de fundo (tema
              "Guilda", trancado) — o link mora dentro dele. */}
          <div className="reception-dialog-bubble">
            <button
              className="reception-dialog-bubble-link"
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

          <button className="reception-clock-btn" aria-label="Relógio" onClick={() => openClock("despertador")}>
            <HourglassIcon width={28} height={28} />
          </button>
        </>
      )}

      <ThemesScreen open={themesOpen} onClose={() => setThemesOpen(false)} />
      <ClockScreen
        open={clockOpen}
        onClose={() => {
          setClockOpen(false);
          setNextAlarmInfo(nextAlarm());
        }}
        initialTab={clockTab}
      />
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
