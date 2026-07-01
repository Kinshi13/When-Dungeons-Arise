import { NavLink, Navigate, Route, Routes, useLocation, useNavigate } from "react-router-dom";
import { motion, MotionConfig } from "framer-motion";
import { useEffect, useRef } from "react";
import { App as CapApp } from "@capacitor/app";
import GuildReception from "./pages/GuildReception";
import MissionBoard from "./pages/MissionBoard";
import TimeRoom from "./pages/TimeRoom";
import Treasury from "./pages/Treasury";
import AdventureDiary from "./pages/AdventureDiary";
import Library from "./pages/Library";
import RulesBook from "./pages/RulesBook";
import CharacterDetail from "./pages/CharacterDetail";
import ReaderScreen from "./pages/ReaderScreen";
import DueBillsPopup from "./components/DueBillsPopup";
import Splash from "./components/Splash";
import GameTopBar from "./components/game/GameTopBar";
import { useSettings, UI_ZOOM_BY_SCALE } from "./contexts/SettingsContext";
import { useSwipeNav, sectionOf, MAIN_ORDER } from "./useSwipeNav";
import { isNativePlatform } from "./notifications";
import { playSfx } from "./sound";
import "./App.css";

const MotionNavLink = motion.create(NavLink);

// Fundo dedicado por tela. Rotas fora deste mapa caem no GIF ambiente padrão.
const PAGE_BACKGROUNDS: Record<string, { src: string; blurred?: boolean }> = {
  "/": { src: "/guild-reception-bg.png" },
  "/sala-do-tempo/calendario": { src: "/calendar-bg.png", blurred: true },
  "/sala-do-tempo/agenda": { src: "/calendar-bg.png", blurred: true },
  "/tesouraria/financas": { src: "/finance-bg.png", blurred: true },
  "/tesouraria/contas": { src: "/finance-bg.png", blurred: true },
  "/tesouraria/calculadora": { src: "/finance-bg.png", blurred: true },
  "/tesouraria/porcentagem": { src: "/finance-bg.png", blurred: true },
  "/diario/notas": { src: "/diario-notas-bg.png", blurred: true },
  "/diario/listas": { src: "/diario-listas-bg.png", blurred: true },
};

const tabMotion = {
  whileTap: { scale: 0.85, y: 2 },
  transition: { type: "spring" as const, stiffness: 500, damping: 20 },
};

const SLIDE_ENTER_TRANSITION = { type: "spring" as const, stiffness: 380, damping: 34 };

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
  const { uiScale, animationsEnabled } = useSettings();
  const { onTouchStart, onTouchMove, onTouchEnd, x } = useSwipeNav();
  const location = useLocation();
  useAndroidBackButton();

  const isReader = location.pathname.startsWith("/leitor");
  const pageBackground = PAGE_BACKGROUNDS[location.pathname];
  const isSpecialScreen = location.pathname.startsWith("/diario") || location.pathname === "/biblioteca";

  // Direção do slide entre as 5 telas principais, calculada durante o render
  // (não em efeito) pra já estar pronta a tempo do <motion.div> de entrada
  // montar com o "initial" certo. Trocas dentro da mesma tela (sub-abas) ou
  // envolvendo telas fora da barra (Diário, Biblioteca, Perfil, Leitor) não
  // animam — direção fica 0 e a troca continua instantânea. "/tesouraria" e
  // "/sala-do-tempo" (sem sub-rota) são só um pulo intermediário de redirect
  // — ignorados aqui pra não "consumir" a direção antes da rota final assentar.
  const prevPathRef = useRef(location.pathname);
  const prevSectionIndexRef = useRef<number | null>(null);
  let slideDirection = 0;
  const isRedirectStub = location.pathname === "/tesouraria" || location.pathname === "/sala-do-tempo";
  if (!isRedirectStub && prevPathRef.current !== location.pathname) {
    const section = sectionOf(location.pathname);
    const sectionIndex = section ? MAIN_ORDER.indexOf(section) : null;
    const prevIndex = prevSectionIndexRef.current;
    if (section !== null && prevIndex !== null && sectionIndex !== prevIndex) {
      slideDirection = sectionIndex! > prevIndex ? 1 : -1;
    }
    if (sectionIndex !== null) prevSectionIndexRef.current = sectionIndex;
    prevPathRef.current = location.pathname;
  }
  const slideKey = sectionOf(location.pathname) ?? location.pathname;

  if (isReader) {
    return (
      <MotionConfig reducedMotion={animationsEnabled ? "never" : "always"}>
        <Routes>
          <Route path="/leitor/:id" element={<ReaderScreen />} />
        </Routes>
      </MotionConfig>
    );
  }

  return (
    <MotionConfig reducedMotion={animationsEnabled ? "never" : "always"}>
      <Splash />
      {/* O fundo desliza junto (mesma direção/chave do conteúdo) — sem isso a
          arte ficaria parada enquanto só o conteúdo acompanhasse o dedo. */}
      <motion.div className="page-bg-slide-layer" style={{ x }} aria-hidden="true">
        <motion.div
          key={slideKey}
          className="page-bg-slide-inner"
          initial={slideDirection !== 0 ? { x: slideDirection > 0 ? "100%" : "-100%" } : false}
          animate={{ x: 0 }}
          transition={SLIDE_ENTER_TRANSITION}
        >
          {pageBackground ? (
            <div className={`page-bg${pageBackground.blurred ? " page-bg-blurred" : ""}`}>
              <img src={pageBackground.src} alt="" />
            </div>
          ) : (
            <div className="ambient-bg">
              <img src="/ambient-bg.gif" alt="" />
            </div>
          )}
        </motion.div>
      </motion.div>
      <div className="app" style={{ zoom: UI_ZOOM_BY_SCALE[uiScale] } as React.CSSProperties}>
        <div className="top-bar">
          <GameTopBar />
        </div>

        <main className="main" onTouchStart={onTouchStart} onTouchMove={onTouchMove} onTouchEnd={onTouchEnd}>
          <motion.div className="slide-drag-layer" style={{ x }}>
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
                <Route path="/tesouraria/calculadora" element={<Treasury />} />
                <Route path="/tesouraria/porcentagem" element={<Treasury />} />
                <Route path="/diario" element={<Navigate to="/diario/notas" replace />} />
                <Route path="/diario/notas" element={<AdventureDiary />} />
                <Route path="/diario/listas" element={<AdventureDiary />} />
                <Route path="/biblioteca" element={<Library />} />
                <Route path="/regras" element={<RulesBook />} />
                <Route path="/perfil" element={<CharacterDetail />} />
              </Routes>
            </motion.div>
          </motion.div>
        </main>
        <DueBillsPopup />
        <nav className={`tabbar${isSpecialScreen ? " tabbar-tucked" : ""}`}>
          <MotionNavLink to="/missoes" className="tab tab-mural" aria-label="Mural" onClick={() => playSfx("coin")} {...tabMotion} />
          <MotionNavLink to="/tesouraria" className="tab tab-tesouraria" aria-label="Tesouraria" onClick={() => playSfx("coin")} {...tabMotion} />
          <MotionNavLink to="/" end className="tab tab-guilda" aria-label="Guilda" onClick={() => playSfx("coin")} {...tabMotion} />
          <MotionNavLink to="/sala-do-tempo" className="tab tab-tempo" aria-label="Tempo" onClick={() => playSfx("coin")} {...tabMotion} />
          <MotionNavLink to="/regras" className="tab tab-ajustes" aria-label="Ajustes" onClick={() => playSfx("coin")} {...tabMotion} />
        </nav>
      </div>
    </MotionConfig>
  );
}

export default App;
