import { lazy, Suspense, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import ThemesScreen from "../components/ThemesScreen";
import ReceptionBackground from "../components/ReceptionBackground";
import StellaStarIcon from "../ui/stella-core/StellaStarIcon";
import { playSfx } from "../sound";
import { useVerticalSwipe } from "../useVerticalSwipe";
import { useOverlayBackClose } from "../useOverlayBackClose";
import { useSettings, isLofiTheme } from "../contexts/SettingsContext";
import { HourglassIcon, CalendarIcon, ChecklistIcon, InvoiceIcon, CheckIcon } from "../icons";
import { FlowerDecorIcon, TabGearIcon } from "../icons2";
import ClockScreen from "../components/ClockScreen";
import WeatherWidget, { type WeatherWidgetHandle } from "../components/WeatherWidget";
import WeatherScreen from "../components/WeatherScreen";
import { nextAlarm, type Alarm } from "../clockStore";
import { api, type Bill, type Reminder } from "../api";
import { getCachedPrimaryWeather, fetchPrimaryWeather, type WeatherInfo } from "../weather";
import { buildHomeSummary } from "../core/domain/homeSummary";
import { toDateKey } from "../core/domain/calendarEntries";
import { parallaxTransform } from "../core/domain/receptionLayers";
import { useReceptionParallax } from "../useReceptionParallax";
import { greeting } from "../greeting";
import { useQuickAction } from "../useQuickAction";
import StellaSpark from "../components/constellations/StellaSpark";

// Phaser só baixa quando a Recepção realmente monta (ver phaser/ReceptionCanvas.tsx)
// — não entra no bundle principal, que as outras 3 áreas nunca precisam dele.
const ReceptionCanvas = lazy(() => import("../phaser/ReceptionCanvas"));

type ClockTab = "despertador" | "cronometro" | "temporizador";

function formatBRL(value: number) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

// Entrada escalonada dos cards flutuantes — cada um "flutua" pro lugar com um
// pequeno atraso em relação ao anterior, em vez de todos aparecerem juntos.
function cardEnter(index: number) {
  return {
    initial: { opacity: 0, y: 18, scale: 0.94 },
    animate: { opacity: 1, y: 0, scale: 1 },
    transition: { type: "spring", stiffness: 380, damping: 26, delay: index * 0.05 },
    whileTap: { scale: 0.94 },
  } as const;
}

export default function GuildReception() {
  const [themesOpen, setThemesOpen] = useState(false);
  const [clockOpen, setClockOpen] = useState(false);
  const [clockTab, setClockTab] = useState<ClockTab>("despertador");
  const [weatherOpen, setWeatherOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const [nextAlarmInfo, setNextAlarmInfo] = useState<Alarm | null>(() => nextAlarm());
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [bills, setBills] = useState<Bill[]>([]);
  const [summaryWeather, setSummaryWeather] = useState<WeatherInfo | null>(() => getCachedPrimaryWeather());
  const weatherWidgetRef = useRef<WeatherWidgetHandle>(null);
  const pageRef = useRef<HTMLDivElement>(null);
  const { theme, animationLevel } = useSettings();
  const isLofi = isLofiTheme(theme);
  // Mesma regra da poeira/chuva CSS (index.css) — "Reduzidas" desliga o
  // canvas do Phaser por completo, não só as animações dentro dele.
  const showPhaserScene = isLofi && animationLevel !== "reduzidas";
  const navigate = useNavigate();

  // Parallax leve (Fase 7, etapa H) — mesma condição do Phaser: "Animações
  // reduzidas" desliga o rastreamento inteiro (nem escuta), não só zera o
  // deslocamento. Cada camada PNG lê seu próprio parallaxTransform direto
  // dentro de ReceptionBackground (pacote de assets v2) — só "constellations"
  // (o canvas do Phaser) ainda precisa do estilo aqui, porque é um componente
  // separado. O estilo é estático (calculado 1x, não muda por frame) — o
  // movimento de verdade vem das custom properties --parallax-x/y que o
  // hook escreve imperativamente no container a cada frame.
  const parallax = useReceptionParallax(pageRef, showPhaserScene);
  const constellationsStyle = parallaxTransform("constellations");

  useOverlayBackClose(moreOpen, () => setMoreOpen(false));

  useEffect(() => {
    if (!moreOpen) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setMoreOpen(false);
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [moreOpen]);

  // Derivados só pra exibição rápida nos cards — reaproveita reminders/bills
  // já buscados abaixo, sem nenhuma lógica nova de negócio (a real fica em
  // MissionList/TreasuryOverview).
  const pendingBillsCount = bills.filter((b) => b.status === "PENDENTE").length;
  const pendingBillsTotal = bills.filter((b) => b.status === "PENDENTE").reduce((sum, b) => sum + b.amount, 0);

  // "Hoje"/"Progresso": tudo com dateTime de hoje, exceto aniversário (esses
  // já aparecem no card "Próximo" via homeSummary.highlight, sem duplicar aqui).
  const todayKey = toDateKey(new Date());
  const todayReminders = reminders.filter((r) => !r.isBirthday && toDateKey(new Date(r.dateTime)) === todayKey);
  const todayTasksCount = todayReminders.filter((r) => r.type === "TAREFA").length;
  const todayEventsCount = todayReminders.filter((r) => r.type === "OUTRO").length;
  const todayMeetingsCount = todayReminders.filter((r) => r.type === "REUNIAO").length;
  const todayBillsCount = bills.filter((b) => b.status === "PENDENTE" && toDateKey(new Date(b.dueDate)) === todayKey).length;
  const todayDoneCount = todayReminders.filter((r) => r.done).length;

  const todayTally = [
    todayTasksCount > 0 ? `${todayTasksCount} tarefa${todayTasksCount > 1 ? "s" : ""}` : null,
    todayEventsCount > 0 ? `${todayEventsCount} evento${todayEventsCount > 1 ? "s" : ""}` : null,
    todayMeetingsCount > 0 ? `${todayMeetingsCount} reunião${todayMeetingsCount > 1 ? "ões" : ""}` : null,
    todayBillsCount > 0 ? `${todayBillsCount} conta${todayBillsCount > 1 ? "s" : ""}` : null,
  ]
    .filter(Boolean)
    .join(" · ");

  // Dados carregados uma vez ao entrar na Recepção (lembretes/contas não
  // mudam por gesto aqui, só em Agenda/Contas — ao voltar pra essa tela o
  // componente remonta e recarrega sozinho) e o clima é re-sincronizado nos
  // mesmos pontos que já atualizavam a janelinha de Clima (fechar a tela de
  // Clima / trocar de local).
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
    setMoreOpen(false);
    setClockTab(tab);
    setClockOpen(true);
  }

  useQuickAction("novo-alarme", () => openClock("despertador"));
  useQuickAction("novo-temporizador", () => openClock("temporizador"));

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
    <div className="page reception-page" ref={pageRef} {...verticalSwipe}>
      <h1 className="sr-only">Recepção da Guilda</h1>

      {/* Camadas explícitas (Fase 7, etapa G): fundo, Phaser, cards/UI — nessa
          ordem de empilhamento (ver --stella-reception-z-* em tokens.css).
          Dock/Stella Core ficam acima de tudo isso por serem irmãos desta
          página (renderizados por App.tsx), usando --z-dock. Parallax leve
          (etapa H) aplicado só nas 2 camadas com elemento visual de verdade
          hoje — sky (o próprio gradiente) e constellations (o Phaser). */}
      {isLofi && <ReceptionBackground mode="layered-parallax" />}

      {showPhaserScene && (
        <Suspense fallback={null}>
          <ReceptionCanvas
            style={constellationsStyle}
            onHotspotTap={() => {
              playSfx("coin");
              setWeatherOpen(true);
            }}
          />
        </Suspense>
      )}

      {isLofi ? (
        <>
          <div className="reception-topbar">
            <span className="reception-greeting">{greeting()}</span>
            <button
              className="reception-more-trigger"
              aria-label="Mais opções"
              aria-expanded={moreOpen}
              onClick={() => {
                playSfx("coin");
                setMoreOpen((v) => !v);
              }}
            >
              <TabGearIcon width={20} height={20} />
            </button>
          </div>

          {/* 4 cards da Home (seção 9 do briefing Stella Founds): informação +
              navegação juntas, cada um resolvendo "o que precisa da minha
              atenção agora". Temas/Ajustes/Relógio saíram daqui — ver o menu
              "Mais" abaixo, aberto pelo botão da barra superior. */}
          <div className="reception-cards">
            <motion.button
              className="reception-card reception-card-proximo"
              onClick={() => {
                playSfx("coin");
                navigate("/sala-do-tempo/calendario");
              }}
              {...cardEnter(0)}
            >
              <StellaSpark className="reception-card-accent" />
              <CalendarIcon width={20} height={20} />
              <span className="reception-card-fn-label">Próximo</span>
              <span className="reception-card-fn-hint">
                {homeSummary.highlight?.text ?? homeSummary.alarm?.text ?? "Nada urgente por perto."}
              </span>
            </motion.button>

            <motion.button
              className="reception-card reception-card-hoje"
              onClick={() => {
                playSfx("coin");
                navigate("/sala-do-tempo/tarefas/hoje");
              }}
              {...cardEnter(1)}
            >
              <StellaSpark className="reception-card-accent" />
              <ChecklistIcon width={20} height={20} />
              <span className="reception-card-fn-label">Hoje</span>
              <span className="reception-card-fn-hint">{todayTally || "Nada marcado por hoje"}</span>
            </motion.button>

            <motion.button
              className="reception-card reception-card-atencao"
              onClick={() => {
                playSfx("coin");
                navigate("/tesouraria/contas");
              }}
              {...cardEnter(2)}
            >
              <StellaSpark className="reception-card-accent" />
              <InvoiceIcon width={20} height={20} />
              <span className="reception-card-fn-label">Atenção</span>
              <span className="reception-card-fn-hint">
                {pendingBillsCount === 0
                  ? "Sem contas à vista"
                  : `${pendingBillsCount} conta${pendingBillsCount > 1 ? "s" : ""} · ${formatBRL(pendingBillsTotal)}`}
              </span>
            </motion.button>

            <motion.button
              className="reception-card reception-card-progresso"
              onClick={() => {
                playSfx("coin");
                navigate("/sala-do-tempo/tarefas");
              }}
              {...cardEnter(3)}
            >
              <StellaSpark className="reception-card-accent" />
              <CheckIcon width={20} height={20} />
              <span className="reception-card-fn-label">Progresso</span>
              <span className="reception-card-fn-hint">
                {todayReminders.length > 0
                  ? `${todayDoneCount} de ${todayReminders.length} atividades concluídas`
                  : "Nada marcado por hoje"}
              </span>
            </motion.button>
          </div>

          <WeatherWidget
            ref={weatherWidgetRef}
            onOpen={() => {
              playSfx("coin");
              setWeatherOpen(true);
            }}
          />

          {moreOpen && (
            <div className="reception-more-backdrop" onClick={() => setMoreOpen(false)} aria-hidden="true" />
          )}
          <AnimatePresence>
            {moreOpen && (
              <motion.div
                className="reception-more-menu"
                role="menu"
                initial={{ opacity: 0, y: -8, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -8, scale: 0.96 }}
                transition={{ type: "spring", stiffness: 420, damping: 30 }}
              >
                <button
                  role="menuitem"
                  className="reception-more-item"
                  onClick={() => {
                    playSfx("coin");
                    setMoreOpen(false);
                    setThemesOpen(true);
                  }}
                >
                  <FlowerDecorIcon width={18} height={18} aria-hidden="true" />
                  Temas
                </button>
                <button role="menuitem" className="reception-more-item" onClick={() => openClock("despertador")}>
                  <HourglassIcon width={18} height={18} />
                  Relógio
                </button>
                <button
                  role="menuitem"
                  className="reception-more-item"
                  onClick={() => {
                    playSfx("coin");
                    setMoreOpen(false);
                    navigate("/regras");
                  }}
                >
                  <TabGearIcon width={18} height={18} />
                  Ajustes
                </button>
                {parallax.permission === "unknown" && (
                  // Só aparece em navegadores que exigem gesto explícito pro
                  // sensor de inclinação (iOS 13+ Safari) — Android/desktop
                  // com sensor já ficam "granted" sem pedir nada, e sem
                  // suporte nenhum o item nem aparece (seção 4 do briefing).
                  <button
                    role="menuitem"
                    className="reception-more-item"
                    onClick={() => {
                      playSfx("coin");
                      setMoreOpen(false);
                      void parallax.requestSensor();
                    }}
                  >
                    <StellaStarIcon width={18} height={18} />
                    Ativar movimento da cena
                  </button>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </>
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
