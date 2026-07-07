import { useEffect, useMemo, useRef, useState, type TouchEvent } from "react";
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
import { api, type Bill, type Reminder } from "../api";
import { getCachedPrimaryWeather, fetchPrimaryWeather, type WeatherInfo } from "../weather";
import { buildHomeSummary } from "../game/homeSummary";
import { useQuickAction } from "../useQuickAction";

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
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [bills, setBills] = useState<Bill[]>([]);
  const [summaryWeather, setSummaryWeather] = useState<WeatherInfo | null>(() => getCachedPrimaryWeather());
  const weatherWidgetRef = useRef<WeatherWidgetHandle>(null);
  const { theme } = useSettings();
  const isLofi = isLofiTheme(theme);

  // Card de resumo no topo: dados carregados uma vez ao entrar na Recepção
  // (lembretes/contas não mudam por gesto aqui, só em Agenda/Contas — ao
  // voltar pra essa tela o componente remonta e recarrega sozinho) e o clima
  // é re-sincronizado nos mesmos pontos que já atualizavam a janelinha de
  // Clima (fechar a tela de Clima / trocar de local).
  useEffect(() => {
    api.reminders.list().then(setReminders);
    api.bills.list().then(setBills);
  }, []);

  function refreshSummaryWeather() {
    setSummaryWeather(getCachedPrimaryWeather());
    fetchPrimaryWeather().then((data) => {
      if (data) setSummaryWeather(data);
    });
  }

  useEffect(() => {
    refreshSummaryWeather();
  }, []);

  const homeSummary = useMemo(
    () => buildHomeSummary(reminders, bills, summaryWeather, nextAlarmInfo),
    [reminders, bills, summaryWeather, nextAlarmInfo]
  );

  function openClock(tab: ClockTab) {
    playSfx("coin");
    setClockTab(tab);
    setClockOpen(true);
  }

  useQuickAction("novo-alarme", () => openClock("despertador"));
  useQuickAction("novo-temporizador", () => openClock("temporizador"));

  const clockCardSwipe = useClockCardSwipe(
    () => openClock("cronometro"),
    () => openClock("temporizador")
  );

  // Deslizar pra cima abre o Relógio, pra baixo abre o Clima — o gesto de
  // fechar mora em cada tela (ver ClockScreen/WeatherScreen). Como as duas
  // são portais (createPortal), o toque nelas ainda "borbulha" por essa
  // Recepção na ÁRVORE REACT (React segue a árvore de componentes, não o DOM,
  // pra eventos sintéticos) mesmo saindo visualmente por cima de tudo — sem
  // essa checagem, um gesto qualquer dentro de uma delas (fora do cabeçalho,
  // que já intercepta com stopPropagation) acabava sendo lido por esses
  // callbacks também, abrindo a tela irmã por engano. Só abre uma tela nova
  // se nenhuma das duas já estiver aberta.
  const verticalSwipe = useVerticalSwipe(
    () => {
      if (clockOpen || weatherOpen) return;
      openClock("despertador");
    },
    () => {
      if (clockOpen || weatherOpen) return;
      playSfx("coin");
      setWeatherOpen(true);
    }
  );

  return (
    <div className="page reception-page" {...verticalSwipe}>
      <h1 className="sr-only">Recepção da Guilda</h1>

      {isLofi ? (
        <div className="reception-cards">
          <div className="reception-card reception-card-resumo" aria-live="polite">
            <span className="reception-summary-title">Resumo</span>
            {homeSummary.weather && (
              <span className="reception-summary-row">
                <span aria-hidden="true">{homeSummary.weather.icon}</span> {homeSummary.weather.text}
              </span>
            )}
            {homeSummary.alarm && (
              <span className="reception-summary-row">
                <span aria-hidden="true">{homeSummary.alarm.icon}</span> {homeSummary.alarm.text}
              </span>
            )}
            {homeSummary.highlight ? (
              <span className="reception-summary-row reception-summary-highlight">
                <span aria-hidden="true">{homeSummary.highlight.icon}</span> {homeSummary.highlight.text}
              </span>
            ) : (
              <span className="reception-summary-row reception-summary-empty">Nada urgente por perto.</span>
            )}
          </div>

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
          refreshSummaryWeather();
        }}
        onPlacesChanged={() => {
          weatherWidgetRef.current?.refresh();
          refreshSummaryWeather();
        }}
      />
    </div>
  );
}
