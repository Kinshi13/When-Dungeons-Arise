import { NavLink, Navigate, Route, Routes, useLocation, useNavigate } from "react-router-dom";
import { motion, MotionConfig } from "framer-motion";
import { useEffect, useLayoutEffect, useMemo, useRef, useState, type SVGProps, type ReactElement } from "react";
import { App as CapApp } from "@capacitor/app";
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
import { useSwipeNav, sectionOf, MAIN_ORDER, pendingSwipeDirection, skipNextEnterAnimation } from "./useSwipeNav";
import { isNativePlatform } from "./notifications";
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
import {
  TabBellIcon,
  TabCoinsIcon,
  TabGuildIcon,
  TabHomeCalendarIcon,
  TabGearIcon,
  TabDiaryIcon,
  TabBookIcon,
} from "./icons2";
import "./App.css";

const MotionNavLink = motion.create(NavLink);

// Fundo dedicado por tela. Rotas fora deste mapa caem no GIF ambiente padrão.
const PAGE_BACKGROUNDS: Record<string, { src: string; blurred?: boolean }> = {
  "/": { src: "/guild-reception-bg.png" },
  "/sala-do-tempo/calendario": { src: "/calendar-bg.png", blurred: true },
  "/sala-do-tempo/agenda": { src: "/calendar-bg.png", blurred: true },
  "/tesouraria/financas": { src: "/finance-bg.png", blurred: true },
  "/tesouraria/contas": { src: "/finance-bg.png", blurred: true },
  "/tesouraria/analises": { src: "/finance-bg.png", blurred: true },
  "/tesouraria/calculadora": { src: "/finance-bg.png", blurred: true },
  "/tesouraria/porcentagem": { src: "/finance-bg.png", blurred: true },
  "/diario/notas": { src: "/diario-notas-bg.png", blurred: true },
  "/diario/listas": { src: "/diario-listas-bg.png", blurred: true },
};

// Fundo "representante" de cada tela principal da barra — usado só pra
// prever, durante o arraste, qual arte vai aparecer quando soltar (a mesma
// que a rota de destino já mostraria depois de assentar).
const SECTION_BACKGROUND: Record<string, { src: string; blurred?: boolean } | undefined> = {
  mural: PAGE_BACKGROUNDS["/missoes"],
  tesouraria: PAGE_BACKGROUNDS["/tesouraria/financas"],
  guilda: PAGE_BACKGROUNDS["/"],
  tempo: PAGE_BACKGROUNDS["/sala-do-tempo/calendario"],
  ajustes: PAGE_BACKGROUNDS["/regras"],
};

// Conteúdo real da rota de destino — pré-renderizado durante o arraste (junto
// com o fundo) pra já mostrar a tela entrando, em vez de deixar a área vazia
// até soltar o dedo. Tesouraria/Diário recebem "forcedPath" pra escolher a
// sub-aba certa (a mesma que a rota de destino mostraria), já que eles
// decidem isso lendo a rota atual — que durante o arraste ainda não mudou.
function renderRoutePreview(path: string): React.ReactNode {
  if (path === "/missoes") return <MissionBoard />;
  if (path === "/") return <GuildReception />;
  if (path.startsWith("/sala-do-tempo")) return <TimeRoom />;
  if (path === "/regras") return <RulesBook />;
  if (path.startsWith("/tesouraria")) return <Treasury forcedPath={path} />;
  if (path.startsWith("/diario")) return <AdventureDiary forcedPath={path} />;
  if (path === "/biblioteca") return <Library />;
  return null;
}

// Cor/gradiente flat por área no tema Lo-fi — substitui inteiramente a arte
// pintada (ver .lofi-scene-* no index.css). Diário e Biblioteca não fazem
// parte das 5 áreas da barra, então são resolvidos à parte pelo pathname.
const LOFI_SECTION_CLASS: Record<string, string> = {
  mural: "lofi-scene-mural",
  tesouraria: "lofi-scene-tesouraria",
  guilda: "lofi-scene-guilda",
  tempo: "lofi-scene-tempo",
  ajustes: "lofi-scene-ajustes",
};

function lofiSceneClass(pathname: string): string {
  if (pathname.startsWith("/diario")) return "lofi-scene-diario";
  if (pathname === "/biblioteca") return "lofi-scene-biblioteca";
  const section = sectionOf(pathname);
  return (section && LOFI_SECTION_CLASS[section]) || "lofi-scene-guilda";
}

// Ilustração fixa por área no Lo-fi (em vez do gradiente flat) — hoje só a
// Guilda tem uma, mas o mapa já fica pronto pra receber mais no futuro.
const LOFI_SECTION_IMAGE: Record<string, string> = {
  "lofi-scene-guilda": "/lofi-guilda-bg.jpg",
};

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
    const image = LOFI_SECTION_IMAGE[sceneClass];
    // Suprime o brilho ::after quando tem papel de parede por cima — ele é
    // pensado pra iluminar o gradiente flat, não faz sentido sobre uma foto.
    const hasWallpaperClass = customWallpaper ? " lofi-scene-has-wallpaper" : "";
    if (image) {
      return (
        <div className={`lofi-scene ${sceneClass} lofi-scene-photo${hasWallpaperClass}`} aria-hidden="true">
          <img src={image} alt="" className="lofi-scene-photo-img" />
          {renderWallpaperOverlay(customWallpaper)}
        </div>
      );
    }
    return (
      <div className={`lofi-scene ${sceneClass}${hasWallpaperClass}`} aria-hidden="true">
        {renderWallpaperOverlay(customWallpaper)}
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
const TAB_TRANSITION = { type: "spring" as const, stiffness: 420, damping: 15, mass: 0.7 };
const tabMotion = {
  whileTap: { scale: 0.85, y: 2 },
  transition: TAB_TRANSITION,
};

// Aba ativa "salta" um pouco pra fora da barra (destaque discreto) — só no
// tema Lo-fi, onde a barra já é simples/flat o bastante pra isso não ficar
// poluído visualmente.
const ACTIVE_TAB_POSE = { scale: 1.16, y: -8 };
const INACTIVE_TAB_POSE = { scale: 1, y: 0 };

interface TabDef {
  key: string;
  to: string;
  end?: boolean;
  label: string;
  legacyClass: string;
  Icon: (props: SVGProps<SVGSVGElement>) => ReactElement;
  // Direção de entrada da tela (mesma convenção do arraste horizontal) —
  // só as abas que não fazem parte da sequência principal da barra
  // precisam "informar" isso (ver pendingSwipeDirection em useSwipeNav).
  swipeDir?: number;
  // Diário/Biblioteca só existem como abas no tema Lo-fi — a barra do tema
  // "Guilda" (trancado, reservado pra economia futura) usa uma arte pintada
  // com só 5 posições fixas, sem espaço pras duas nem arte nova desenhada
  // pra elas ainda.
  lofiOnly?: boolean;
}

const TABS: TabDef[] = [
  { key: "diario", to: "/diario/notas", label: "Diário", legacyClass: "", Icon: TabDiaryIcon, swipeDir: -1, lofiOnly: true },
  { key: "mural", to: "/missoes", label: "Mural", legacyClass: "tab tab-mural", Icon: TabBellIcon },
  { key: "tesouraria", to: "/tesouraria", label: "Tesouraria", legacyClass: "tab tab-tesouraria", Icon: TabCoinsIcon },
  { key: "guilda", to: "/", end: true, label: "Guilda", legacyClass: "tab tab-guilda", Icon: TabGuildIcon },
  { key: "tempo", to: "/sala-do-tempo", label: "Tempo", legacyClass: "tab tab-tempo", Icon: TabHomeCalendarIcon },
  { key: "ajustes", to: "/regras", label: "Ajustes", legacyClass: "tab tab-ajustes", Icon: TabGearIcon },
  { key: "biblioteca", to: "/biblioteca", label: "Biblioteca", legacyClass: "", Icon: TabBookIcon, swipeDir: 1, lofiOnly: true },
];

// A que aba a rota atual pertence — igual sectionOf, mas cobrindo também
// Diário/Biblioteca (que agora moram na barra, mas não fazem parte da
// sequência de arraste horizontal entre as 5 telas principais).
function activeTabOf(pathname: string): string | null {
  if (pathname.startsWith("/diario")) return "diario";
  if (pathname === "/biblioteca") return "biblioteca";
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

const SLIDE_ENTER_TRANSITION = { type: "spring" as const, stiffness: 280, damping: 32, mass: 0.8 };

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

function useAndroidBackButton() {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!isNativePlatform()) return;
    const handle = CapApp.addListener("backButton", ({ canGoBack }) => {
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
  const { animationsEnabled, theme } = useSettings();
  const isLofi = isLofiTheme(theme);
  const { onTouchStart, onTouchMove, onTouchEnd, x, preview, riseY, riseOpacity } = useSwipeNav();
  const location = useLocation();
  useAndroidBackButton();
  const resolveCustomWallpaper = useWallpaperState();
  const customWallpaper = theme === "personalizado" ? resolveCustomWallpaper(location.pathname) : null;
  const [tabBurst, setTabBurst] = useState<{ tab: string; id: number } | null>(null);
  function handleTabTap(tab: string) {
    playSfx("coin");
    setTabBurst({ tab, id: Date.now() });
  }

  const isReader = location.pathname.startsWith("/leitor");
  const pageBackground = PAGE_BACKGROUNDS[location.pathname];
  const activeTab = activeTabOf(location.pathname);

  // Direção do slide, calculada durante o render (não em efeito) pra já estar
  // pronta a tempo do <motion.div> de entrada montar com o "initial" certo.
  // "/tesouraria", "/sala-do-tempo" e "/diario" (sem sub-rota) são só um pulo
  // intermediário de redirect — ignorados aqui pra não "consumir" a direção
  // antes da rota final assentar.
  //
  // Importante: o corpo do render só LÊ prevPathRef/prevSectionIndexRef/
  // pendingSwipeDirection — nunca escreve neles aqui. Em StrictMode (dev) o
  // React chama a função de render duas vezes por commit; se a gente
  // consumisse (zerasse) esses valores durante o render, a 1ª chamada os
  // apagaria e a 2ª (cujo resultado é o que de fato é montado) sempre veria
  // tudo já zerado — a animação nunca aparecia de verdade. Por isso quem
  // escreve é o useLayoutEffect abaixo, que roda uma vez só por commit real.
  const prevPathRef = useRef(location.pathname);
  const prevSectionIndexRef = useRef<number | null>(null);
  let slideDirection = 0;
  const isRedirectStub =
    location.pathname === "/tesouraria" || location.pathname === "/sala-do-tempo" || location.pathname === "/diario";
  const pathChanged = !isRedirectStub && prevPathRef.current !== location.pathname;
  if (pathChanged) {
    const section = sectionOf(location.pathname);
    const sectionIndex = section ? MAIN_ORDER.indexOf(section) : null;
    // Navegação vinda do commit de um arraste: a tela já entrou acompanhando
    // o dedo (a prévia parou exatamente na posição final), então NÃO roda a
    // animação de entrada de novo — direção fica 0 e a rota assenta parada.
    if (skipNextEnterAnimation.current) {
      slideDirection = 0;
    } else if (pendingSwipeDirection.current !== 0) {
      // Direção "informada" por um tap (ícones de atalho da Recepção) — cobre
      // os casos que não são uma simples comparação de índice na barra.
      slideDirection = pendingSwipeDirection.current;
    } else {
      const prevIndex = prevSectionIndexRef.current;
      if (section !== null && prevIndex !== null && sectionIndex !== prevIndex) {
        slideDirection = sectionIndex! > prevIndex ? 1 : -1;
      }
    }
  }
  useLayoutEffect(() => {
    if (!pathChanged) return;
    const section = sectionOf(location.pathname);
    const sectionIndex = section ? MAIN_ORDER.indexOf(section) : null;
    pendingSwipeDirection.current = 0;
    skipNextEnterAnimation.current = false;
    if (sectionIndex !== null) prevSectionIndexRef.current = sectionIndex;
    prevPathRef.current = location.pathname;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);
  const slideKey = location.pathname;

  if (isReader) {
    return (
      <MotionConfig reducedMotion={animationsEnabled ? "never" : "always"}>
        <Routes>
          <Route path="/leitor/:id" element={<ReaderScreen />} />
        </Routes>
        <AlarmRinger />
      </MotionConfig>
    );
  }

  return (
    <MotionConfig reducedMotion={animationsEnabled ? "never" : "always"}>
      <Splash />
      {/* O fundo desliza junto (mesma direção/chave do conteúdo) — sem isso a
          arte ficaria parada enquanto só o conteúdo acompanhasse o dedo.
          Durante o arraste, o "preview" mostra de verdade o fundo da tela de
          destino entrando pelo lado certo, em vez de deixar vazio. */}
      <motion.div className="page-bg-slide-layer" style={{ x }} aria-hidden="true">
        {preview && (
          <div
            className="page-bg-slide-preview"
            style={{ transform: `translateX(${preview.direction > 0 ? "100%" : "-100%"})` }}
          >
            {/* A prévia do arraste NUNCA mostra papel de parede personalizado —
                só o gradiente flat da área. Trocar de foto no meio do gesto
                (às vezes pra uma foto ainda não decodificada) é exatamente o
                que dava a sensação de "recarregando"; o gradiente é instantâneo
                e sempre igual, então a prévia fica sempre suave. A foto de
                verdade só aparece (com fade) quando a tela assenta. */}
            {renderBackgroundContent(
              SECTION_BACKGROUND[sectionOf(preview.path) ?? ""] ?? PAGE_BACKGROUNDS[preview.path],
              isLofi,
              preview.path,
              null
            )}
          </div>
        )}
        <motion.div
          key={slideKey}
          className="page-bg-slide-inner"
          initial={slideDirection !== 0 ? { x: slideDirection > 0 ? "100%" : "-100%", opacity: 0.5 } : false}
          animate={{ x: 0, opacity: 1 }}
          transition={SLIDE_ENTER_TRANSITION}
        >
          {renderBackgroundContent(pageBackground, isLofi, location.pathname, customWallpaper)}
        </motion.div>
      </motion.div>
      <div className="app">
        <main className="main" onTouchStart={onTouchStart} onTouchMove={onTouchMove} onTouchEnd={onTouchEnd}>
          <motion.div className="slide-drag-layer" style={{ x }}>
            {preview && (
              <div
                className="content-slide-preview"
                aria-hidden="true"
                style={{ transform: `translateX(${preview.direction > 0 ? "100%" : "-100%"})` }}
              >
                {/* Efeito "gaveta": enquanto o arraste lateral acontece, o
                    conteúdo da tela de destino sobe de baixo pra cima —
                    preso à posição REAL do arraste (x), nunca a um timer de
                    duração fixa (ver riseY/riseOpacity em useSwipeNav.ts),
                    senão um gesto lento/parcial/cancelado terminava a
                    animação sozinha e mostrava a tela vizinha 100% "chegada"
                    com o fundo (esse sim preso à posição do dedo) parado.
                    Quando a rota assenta, o conteúdo real monta já na
                    posição final (a animação de entrada pós-navegação é
                    pulada). Só entre áreas diferentes — trocar de sub-aba
                    dentro da mesma área (Finanças/Contas, Notas/Listas) já
                    remonta o componente sozinho, e a gaveta por cima disso
                    só criava um flicker. */}
                <motion.div
                  className="drawer-rise-content"
                  style={preview.sameSection ? undefined : { y: riseY, opacity: riseOpacity }}
                >
                  {renderRoutePreview(preview.path)}
                </motion.div>
              </div>
            )}
            <motion.div
              key={slideKey}
              className="slide-enter-layer"
              initial={slideDirection !== 0 ? { x: slideDirection > 0 ? "100%" : "-100%" } : false}
              animate={{ x: 0 }}
              transition={SLIDE_ENTER_TRANSITION}
            >
              <Routes>
                <Route path="/" element={<GuildReception />} />
                <Route path="/missoes" element={<MissionBoard />} />
                <Route path="/sala-do-tempo" element={<Navigate to="/sala-do-tempo/calendario" replace />} />
                <Route path="/sala-do-tempo/calendario" element={<TimeRoom />} />
                <Route path="/sala-do-tempo/agenda" element={<TimeRoom />} />
                <Route path="/tesouraria" element={<Navigate to="/tesouraria/financas" replace />} />
                <Route path="/tesouraria/financas" element={<Treasury />} />
                <Route path="/tesouraria/contas" element={<Treasury />} />
                <Route path="/tesouraria/analises" element={<Treasury />} />
                <Route path="/tesouraria/calculadora" element={<Treasury />} />
                <Route path="/tesouraria/porcentagem" element={<Treasury />} />
                <Route path="/diario" element={<Navigate to="/diario/notas" replace />} />
                <Route path="/diario/notas" element={<AdventureDiary />} />
                <Route path="/diario/listas" element={<AdventureDiary />} />
                <Route path="/biblioteca" element={<Library />} />
                <Route path="/regras" element={<RulesBook />} />
              </Routes>
            </motion.div>
          </motion.div>
        </main>
        <DueBillsPopup />
        <AlarmRinger />
        <nav className={`tabbar${isLofi ? " tabbar-lofi" : ""}`}>
          {TABS.filter((tab) => isLofi || !tab.lofiOnly).map((tab) => {
            const active = isLofi && activeTab === tab.key;
            return (
              <MotionNavLink
                key={tab.key}
                to={tab.to}
                end={tab.end}
                className={isLofi ? "tab-lofi" : tab.legacyClass}
                aria-label={tab.label}
                onClick={() => {
                  handleTabTap(tab.key);
                  if (tab.swipeDir) pendingSwipeDirection.current = tab.swipeDir;
                }}
                animate={isLofi ? (active ? ACTIVE_TAB_POSE : INACTIVE_TAB_POSE) : undefined}
                {...tabMotion}
              >
                {isLofi && <tab.Icon />}
                {tabBurst?.tab === tab.key && <TabBurst key={tabBurst.id} onDone={() => setTabBurst(null)} />}
              </MotionNavLink>
            );
          })}
        </nav>
      </div>
    </MotionConfig>
  );
}

export default App;
