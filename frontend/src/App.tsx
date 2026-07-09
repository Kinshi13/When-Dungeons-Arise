import { NavLink, Navigate, Route, Routes, useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence, MotionConfig } from "framer-motion";
import { lazy, Suspense, useEffect, useMemo, useState, type SVGProps, type ReactElement } from "react";
import { App as CapApp } from "@capacitor/app";
import DueBillsPopup from "./components/DueBillsPopup";
import AlarmRinger from "./components/AlarmRinger";
import AmbientParticles from "./components/AmbientParticles";
import Splash from "./components/Splash";
import StellaCore from "./ui/stella-core/StellaCore";
import { buildStellaActions } from "./stellaActions";
import { useSettings, isLofiTheme } from "./contexts/SettingsContext";
import { sectionOf } from "./useSwipeNav";
import { SPRINGS, screenEnter, pageBackgroundEnter } from "./motion";
import { isNativePlatform } from "./notifications";
import { consumeBackPress } from "./useOverlayBackClose";
import {
  WALLPAPER_SLOT_IDS,
  wallpaperScreenOf,
  slotForScreen,
  getSlotAdjust,
  getWallpaperUrl,
  loadWallpaperConfig,
  type WallpaperConfig,
  type WallpaperSlotId,
} from "./wallpaperStore";
import { onWallpaperChanged } from "./wallpaperEvents";
import { playSfx } from "./sound";
import { TabBellIcon, TabCoinsIcon, TabGuildIcon, TabHomeCalendarIcon, TabGearIcon, TabBookIcon } from "./icons2";
import "./App.css";

// Code-splitting por rota: cada tela só baixa/parseia quando o usuário
// navega até ela, em vez de tudo entrar no bundle principal de largada.
// ReaderScreen sozinho já puxa epubjs + pdfjs-dist (bibliotecas grandes) —
// antes disso, TODO usuário pagava esse custo no primeiro carregamento
// mesmo sem nunca abrir um livro. O Splash (mínimo 1.4s) cobre o instante
// de carregamento da primeira tela sem precisar de fallback visível.
const GuildReception = lazy(() => import("./pages/GuildReception"));
const MissionBoard = lazy(() => import("./pages/MissionBoard"));
const TimeRoom = lazy(() => import("./pages/TimeRoom"));
const Treasury = lazy(() => import("./pages/Treasury"));
const AdventureDiary = lazy(() => import("./pages/AdventureDiary"));
const Library = lazy(() => import("./pages/Library"));
const RulesBook = lazy(() => import("./pages/RulesBook"));
const ReaderScreen = lazy(() => import("./pages/ReaderScreen"));

const MotionNavLink = motion.create(NavLink);

// Fundo dedicado por tela. Rotas fora deste mapa caem no GIF ambiente padrão.
const PAGE_BACKGROUNDS: Record<string, { src: string; blurred?: boolean }> = {
  "/": { src: "/guild-reception-bg.png" },
  "/sala-do-tempo/calendario": { src: "/calendar-bg.png", blurred: true },
  "/sala-do-tempo/agenda": { src: "/calendar-bg.png", blurred: true },
  "/sala-do-tempo/linha-do-tempo": { src: "/calendar-bg.png", blurred: true },
  "/tesouraria/visao-geral": { src: "/finance-bg.png", blurred: true },
  "/tesouraria/movimentos": { src: "/finance-bg.png", blurred: true },
  "/tesouraria/contas": { src: "/finance-bg.png", blurred: true },
  "/tesouraria/analises": { src: "/finance-bg.png", blurred: true },
  "/tesouraria/ferramentas": { src: "/finance-bg.png", blurred: true },
  "/sala-do-tempo/diario/notas": { src: "/diario-notas-bg.png", blurred: true },
  "/sala-do-tempo/diario/listas": { src: "/diario-listas-bg.png", blurred: true },
};

// Cor/gradiente flat por área no tema Lo-fi — substitui inteiramente a arte
// pintada (ver .lofi-scene-* no index.css). Tarefas e Diário são sub-abas de
// Tempo (ver sectionOf em useSwipeNav.ts), por isso não têm entrada própria.
const LOFI_SECTION_CLASS: Record<string, string> = {
  tesouraria: "lofi-scene-tesouraria",
  guilda: "lofi-scene-guilda",
  tempo: "lofi-scene-tempo",
  ajustes: "lofi-scene-ajustes",
  biblioteca: "lofi-scene-biblioteca",
};

function lofiSceneClass(pathname: string): string {
  const section = sectionOf(pathname);
  return (section && LOFI_SECTION_CLASS[section]) || "lofi-scene-guilda";
}

// Chave da tela PRINCIPAL atual, agrupando sub-rotas da mesma área (ex.:
// /sala-do-tempo/calendario e /sala-do-tempo/tarefas/hoje) num valor só —
// usada como key do AnimatePresence externo (fundo + screenEnter) pra essa
// transição mais forte disparar só ao trocar de área pela dock, não a cada
// troca de sub-aba (que já tem sua própria transição mais leve, ver
// tabContentEnter).
function mainScreenKeyOf(pathname: string): string {
  return sectionOf(pathname) ?? pathname;
}

interface CustomWallpaperInfo {
  url: string;
  adjust: { zoom: number; offsetX: number; offsetY: number; blur: number };
}

// Papel de parede do usuário SEMPRE por cima do gradiente flat da área (em
// vez de substituí-lo por inteiro) — o gradiente já tem a paleta certa da
// seção, então serve de base consistente enquanto a foto entra com um fade
// suave (ver .wallpaper-custom-bg-img), sem nenhum instante "vazio"/preto no
// meio da troca. A key pela própria URL faz o fade reiniciar só quando a
// imagem muda de verdade (duas telas usando a mesma foto não re-animam).
function renderWallpaperOverlay(customWallpaper: CustomWallpaperInfo | null | undefined) {
  if (!customWallpaper) return null;
  const { zoom, offsetX, offsetY, blur } = customWallpaper.adjust;
  return (
    <img
      key={customWallpaper.url}
      src={customWallpaper.url}
      alt=""
      className="wallpaper-custom-bg-img"
      style={{
        transform: `scale(${zoom}) translate(${offsetX}%, ${offsetY}%)`,
        filter: blur > 0 ? `blur(${blur}px)` : undefined,
      }}
    />
  );
}

function renderBackgroundContent(
  bg: { src: string; blurred?: boolean } | undefined,
  isLofi: boolean,
  pathname: string,
  customWallpaper?: CustomWallpaperInfo | null
) {
  if (isLofi) {
    const sceneClass = lofiSceneClass(pathname);

    if (sceneClass === "lofi-scene-guilda") {
      // A Recepção tem fundo próprio agora (ReceptionBackground, dentro de
      // GuildReception.tsx — Fase 7, etapa G) — nada a desenhar aqui além do
      // papel de parede custom do usuário, se houver (continua funcionando
      // por cima do novo fundo, sem o gradiente/foto roxos de antes). Sem
      // AmbientParticles: a ambientação da Recepção é o canvas do Phaser.
      if (!customWallpaper) return null;
      return (
        <div className="lofi-scene lofi-scene-has-wallpaper" aria-hidden="true">
          {renderWallpaperOverlay(customWallpaper)}
        </div>
      );
    }

    // Suprime o brilho ::after quando tem papel de parede por cima — ele é
    // pensado pra iluminar o gradiente flat, não faz sentido sobre uma foto.
    const hasWallpaperClass = customWallpaper ? " lofi-scene-has-wallpaper" : "";
    // Chuva só combina com o tema noturno/lavanda da Sala do Tempo; as
    // demais áreas ganham a poeira flutuante genérica (seção 27 do spec).
    const particleKind = sceneClass === "lofi-scene-tempo" ? "rain" : "dust";
    return (
      <div className={`lofi-scene ${sceneClass}${hasWallpaperClass}`} aria-hidden="true">
        {renderWallpaperOverlay(customWallpaper)}
        <AmbientParticles kind={particleKind} />
      </div>
    );
  }
  return bg ? (
    <div className={`page-bg${bg.blurred ? " page-bg-blurred" : ""}`}>
      <img src={bg.src} alt="" />
    </div>
  ) : (
    <div className="ambient-bg">
      <img src="/ambient-bg.gif" alt="" />
    </div>
  );
}

// Transição única (bouncy, tipo "boneco de mola") usada tanto pro toque
// rápido (whileTap) quanto pro "pop" de destaque da aba ativa (animate) —
// os dois alvos usam scale/y, então uma mola só já cobre bem as duas.
const tabMotion = {
  whileTap: { scale: 0.85, y: 2 },
  transition: SPRINGS.playful,
};

// Aba ativa "salta" um pouco pra fora da barra (destaque discreto) — só no
// tema Lo-fi, onde a barra já é simples/flat o bastante pra isso não ficar
// poluído visualmente.
const ACTIVE_TAB_POSE = { scale: 1.16, y: -8 };
const INACTIVE_TAB_POSE = { scale: 1, y: 0 };

// Barra pintada do tema "Guilda" (trancado/reservado pra economia futura) —
// arte com só 5 posições fixas. Mantida intocada e completamente separada
// da dock nova: qualquer mudança na dock não pode arriscar esse tema.
interface LegacyTabDef {
  key: string;
  to: string;
  end?: boolean;
  label: string;
  legacyClass: string;
  Icon: (props: SVGProps<SVGSVGElement>) => ReactElement;
}

const LEGACY_TABS: LegacyTabDef[] = [
  { key: "mural", to: "/sala-do-tempo/tarefas", label: "Mural", legacyClass: "tab tab-mural", Icon: TabBellIcon },
  { key: "tesouraria", to: "/tesouraria", label: "Tesouraria", legacyClass: "tab tab-tesouraria", Icon: TabCoinsIcon },
  { key: "guilda", to: "/", end: true, label: "Guilda", legacyClass: "tab tab-guilda", Icon: TabGuildIcon },
  { key: "tempo", to: "/sala-do-tempo", label: "Tempo", legacyClass: "tab tab-tempo", Icon: TabHomeCalendarIcon },
  { key: "ajustes", to: "/regras", label: "Ajustes", legacyClass: "tab tab-ajustes", Icon: TabGearIcon },
];

// Dock flutuante — 4 núcleos (Recepção, Tempo, Tesouraria, Biblioteca) com o
// Stella Core no centro (renderizado à parte, ver StellaCore mais abaixo).
// Mural (Tarefas) e Diário viraram sub-abas de Tempo; Ajustes é acessado
// pela Recepção; Relógio/Clima já são cards da própria Recepção.
interface DockItemDef {
  key: string;
  to: string;
  end?: boolean;
  label: string;
  Icon: (props: SVGProps<SVGSVGElement>) => ReactElement;
}

const DOCK_ITEMS: DockItemDef[] = [
  { key: "guilda", to: "/", end: true, label: "Recepção", Icon: TabGuildIcon },
  { key: "tempo", to: "/sala-do-tempo", label: "Tempo", Icon: TabHomeCalendarIcon },
  { key: "tesouraria", to: "/tesouraria", label: "Tesouraria", Icon: TabCoinsIcon },
  { key: "biblioteca", to: "/biblioteca", label: "Biblioteca", Icon: TabBookIcon },
];

// A qual item da dock a rota atual pertence, pra destaque visual. Ajustes
// não tem posição própria na dock (é acessado pela Recepção), então destaca
// "guilda" enquanto o usuário estiver lá.
function activeTabOf(pathname: string): string | null {
  if (pathname.startsWith("/regras")) return "guilda";
  return sectionOf(pathname);
}

const SPARK_COUNT = 6;

// Brilho + partículas discretas ao tocar um ícone da barra — some sozinho
// depois de tocado (chama onDone), sem deixar nenhum estado "selecionado" fixo.
function TabBurst({ onDone }: { onDone: () => void }) {
  const sparks = useMemo(() => Array.from({ length: SPARK_COUNT }, (_, i) => i), []);
  return (
    <motion.div
      className="tab-burst"
      aria-hidden="true"
      initial={{ opacity: 1 }}
      animate={{ opacity: 0 }}
      transition={{ duration: 0.65 }}
      onAnimationComplete={onDone}
    >
      <motion.span
        className="tab-burst-glow"
        initial={{ scale: 0.4, opacity: 0.9 }}
        animate={{ scale: 1.6, opacity: 0 }}
        transition={{ duration: 0.45, ease: "easeOut" }}
      />
      {sparks.map((i) => {
        const angle = (i / sparks.length) * Math.PI * 2;
        const dx = Math.cos(angle) * 18;
        const dy = Math.sin(angle) * 18;
        return (
          <motion.span
            key={i}
            className="tab-spark"
            initial={{ x: 0, y: 0, opacity: 1, scale: 0.6 }}
            animate={{ x: dx, y: dy, opacity: 0, scale: 0.2 }}
            transition={{ duration: 0.55, ease: "easeOut", delay: i * 0.02 }}
          />
        );
      })}
    </motion.div>
  );
}

// Config + URLs do papel de parede personalizado, recarregados sempre que a
// tela de configuração avisa uma mudança (ver wallpaperEvents.ts) — só
// interessa de verdade quando o tema ativo é "personalizado", mas carregar
// incondicionalmente é barato (localStorage + 3 leituras no IndexedDB, cada
// uma cacheada em memória depois da primeira vez).
function useWallpaperState() {
  const [config, setConfig] = useState<WallpaperConfig>(() => loadWallpaperConfig());
  const [urls, setUrls] = useState<Partial<Record<WallpaperSlotId, string>>>({});

  async function refresh() {
    setConfig(loadWallpaperConfig());
    const entries = await Promise.all(WALLPAPER_SLOT_IDS.map(async (id) => [id, await getWallpaperUrl(id)] as const));
    setUrls(Object.fromEntries(entries.filter(([, url]) => url)));
  }

  useEffect(() => {
    refresh();
    return onWallpaperChanged(refresh);
  }, []);

  function resolve(pathname: string): CustomWallpaperInfo | null {
    const screen = wallpaperScreenOf(pathname);
    const slotId = slotForScreen(config, screen);
    if (!slotId) return null;
    const url = urls[slotId];
    if (!url) return null;
    return { url, adjust: getSlotAdjust(config, slotId) };
  }

  return resolve;
}

// Partículas ambiente (poeira/chuva) pausam quando o app sai de foco — sem
// custo nenhum enquanto o usuário está noutro app/tela bloqueada. Só a
// classe CSS muda; a animação em si continua 100% CSS (ver .ambient-particles
// em index.css), nada de rAF/timer pra pausar/retomar manualmente.
function useAmbientParticlesPause() {
  useEffect(() => {
    function sync() {
      document.documentElement.classList.toggle("app-hidden", document.hidden);
    }
    sync();
    document.addEventListener("visibilitychange", sync);
    return () => document.removeEventListener("visibilitychange", sync);
  }, []);
}

function useAndroidBackButton() {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!isNativePlatform()) return;
    const handle = CapApp.addListener("backButton", ({ canGoBack }) => {
      if (consumeBackPress()) return;
      if (location.pathname.startsWith("/leitor")) {
        navigate(-1);
      } else if (canGoBack) {
        navigate(-1);
      } else {
        CapApp.exitApp();
      }
    });
    return () => {
      handle.then((h) => h.remove());
    };
  }, [navigate, location.pathname]);
}

function App() {
  const { animationLevel, theme, screenTransitionAnimationEnabled, lockWallpaperToMain } = useSettings();
  const animationsEnabled = animationLevel !== "reduzidas";
  const isLofi = isLofiTheme(theme);
  const location = useLocation();
  const navigate = useNavigate();
  useAndroidBackButton();
  useAmbientParticlesPause();
  const resolveCustomWallpaper = useWallpaperState();
  // Com "Fixar papel de parede da Recepção em todas as telas" ligado, toda
  // tela resolve a mesma imagem da Guilda (mainSlot), então o fundo nunca
  // muda ao navegar — nada pra "dessincronizar" visualmente no meio da troca.
  const customWallpaper =
    theme === "personalizado" ? resolveCustomWallpaper(lockWallpaperToMain ? "/" : location.pathname) : null;
  const [tabBurst, setTabBurst] = useState<{ tab: string; id: number } | null>(null);
  function handleTabTap(tab: string) {
    playSfx("coin");
    setTabBurst({ tab, id: Date.now() });
  }

  const isReader = location.pathname.startsWith("/leitor");
  const pageBackground = PAGE_BACKGROUNDS[location.pathname];
  const activeTab = activeTabOf(location.pathname);
  const stellaActions = buildStellaActions(sectionOf(location.pathname), navigate);

  function renderDockItem(item: DockItemDef) {
    const active = activeTab === item.key;
    return (
      <MotionNavLink
        key={item.key}
        to={item.to}
        end={item.end}
        className="dock-item"
        aria-label={item.label}
        onClick={() => handleTabTap(item.key)}
        animate={active ? ACTIVE_TAB_POSE : INACTIVE_TAB_POSE}
        {...tabMotion}
      >
        <item.Icon />
        {tabBurst?.tab === item.key && <TabBurst key={tabBurst.id} onDone={() => setTabBurst(null)} />}
      </MotionNavLink>
    );
  }
  // Sem a animação de transição, cada tela só troca na hora — nenhuma das
  // duas camadas abaixo precisa de initial/exit, só o conteúdo já assentado.
  // Duas transições diferentes por design: o conteúdo (screen-transition)
  // usa a gaveta (translateY puro); o fundo full-bleed (page-bg-layer) usa
  // só fade — um translateY de poucos px não se percebe numa camada que já
  // cobre o viewport inteiro antes/depois do deslocamento, e sem NENHUMA
  // transição visível ali a troca "pipoca" pro fundo novo instantaneamente
  // por trás do conteúdo ainda saindo.
  const transitionProps = screenTransitionAnimationEnabled ? screenEnter : {};
  const bgTransitionProps = screenTransitionAnimationEnabled ? pageBackgroundEnter : {};

  if (isReader) {
    return (
      <MotionConfig reducedMotion={animationsEnabled ? "user" : "always"}>
        <Suspense fallback={null}>
          <Routes>
            <Route path="/leitor/:id" element={<ReaderScreen />} />
          </Routes>
        </Suspense>
        <AlarmRinger />
      </MotionConfig>
    );
  }

  return (
    <MotionConfig reducedMotion={animationsEnabled ? "user" : "always"}>
      <Splash />
      <div className="app">
        {/* Fundo e conteúdo animam em duas árvores independentes, mas com a
            MESMA chave (pathname) e a MESMA transição — como os dois trocam
            no mesmo commit de React, ficam sincronizados sem precisar de
            nenhum mecanismo extra de acompanhamento de gesto (que existia só
            por causa do arraste, removido junto com o swipe global). */}
        <AnimatePresence mode="sync" initial={false}>
          <motion.div key={mainScreenKeyOf(location.pathname)} className="page-bg-layer" aria-hidden="true" {...bgTransitionProps}>
            {renderBackgroundContent(pageBackground, isLofi, location.pathname, customWallpaper)}
          </motion.div>
        </AnimatePresence>
        <main className="main">
          <AnimatePresence mode="sync" initial={false}>
            <motion.div key={mainScreenKeyOf(location.pathname)} className="screen-transition" {...transitionProps}>
              <Suspense fallback={null}>
                <Routes location={location}>
                  <Route path="/" element={<GuildReception />} />
                  <Route path="/sala-do-tempo" element={<Navigate to="/sala-do-tempo/calendario" replace />} />
                  <Route path="/sala-do-tempo/calendario" element={<TimeRoom />} />
                  <Route path="/sala-do-tempo/agenda" element={<TimeRoom />} />
                  <Route path="/sala-do-tempo/linha-do-tempo" element={<TimeRoom />} />
                  <Route path="/sala-do-tempo/tarefas" element={<Navigate to="/sala-do-tempo/tarefas/hoje" replace />} />
                  <Route path="/sala-do-tempo/tarefas/hoje" element={<MissionBoard />} />
                  <Route path="/sala-do-tempo/tarefas/missoes" element={<MissionBoard />} />
                  <Route path="/sala-do-tempo/tarefas/caixa" element={<MissionBoard />} />
                  <Route path="/sala-do-tempo/diario" element={<Navigate to="/sala-do-tempo/diario/notas" replace />} />
                  <Route path="/sala-do-tempo/diario/notas" element={<AdventureDiary />} />
                  <Route path="/sala-do-tempo/diario/listas" element={<AdventureDiary />} />
                  <Route path="/tesouraria" element={<Navigate to="/tesouraria/visao-geral" replace />} />
                  <Route path="/tesouraria/visao-geral" element={<Treasury />} />
                  <Route path="/tesouraria/movimentos" element={<Treasury />} />
                  <Route path="/tesouraria/contas" element={<Treasury />} />
                  <Route path="/tesouraria/analises" element={<Treasury />} />
                  <Route path="/tesouraria/ferramentas" element={<Treasury />} />
                  <Route path="/biblioteca" element={<Library />} />
                  <Route path="/regras" element={<RulesBook />} />
                </Routes>
              </Suspense>
            </motion.div>
          </AnimatePresence>
        </main>
        <DueBillsPopup />
        <AlarmRinger />
        {isLofi ? (
          <nav className="dock">
            {DOCK_ITEMS.slice(0, 2).map((item) => renderDockItem(item))}
            <StellaCore actions={stellaActions} />
            {DOCK_ITEMS.slice(2).map((item) => renderDockItem(item))}
          </nav>
        ) : (
          <nav className="tabbar">
            {LEGACY_TABS.map((tab) => (
              <MotionNavLink
                key={tab.key}
                to={tab.to}
                end={tab.end}
                className={tab.legacyClass}
                aria-label={tab.label}
                onClick={() => handleTabTap(tab.key)}
                {...tabMotion}
              >
                {tabBurst?.tab === tab.key && <TabBurst key={tabBurst.id} onDone={() => setTabBurst(null)} />}
              </MotionNavLink>
            ))}
          </nav>
        )}
      </div>
    </MotionConfig>
  );
}

export default App;
