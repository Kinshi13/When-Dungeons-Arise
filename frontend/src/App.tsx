import { NavLink, Navigate, Route, Routes, useLocation, useNavigate } from "react-router-dom";
import { motion, MotionConfig } from "framer-motion";
import { useEffect } from "react";
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
import { useSwipeNav } from "./useSwipeNav";
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
  const { onTouchStart, onTouchEnd } = useSwipeNav();
  const location = useLocation();
  useAndroidBackButton();

  const isReader = location.pathname.startsWith("/leitor");
  const pageBackground = PAGE_BACKGROUNDS[location.pathname];

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
      {pageBackground ? (
        <div className={`page-bg${pageBackground.blurred ? " page-bg-blurred" : ""}`} aria-hidden="true">
          <img src={pageBackground.src} alt="" />
        </div>
      ) : (
        <div className="ambient-bg" aria-hidden="true">
          <img src="/ambient-bg.gif" alt="" />
        </div>
      )}
      <div className="app" style={{ zoom: UI_ZOOM_BY_SCALE[uiScale] } as React.CSSProperties}>
        <div className="top-bar">
          <GameTopBar />
        </div>

        <main className="main" onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
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
        </main>
        <DueBillsPopup />
        <nav className="tabbar">
          <MotionNavLink to="/missoes" className="tab" aria-label="Mural" onClick={() => playSfx("coin")} {...tabMotion} />
          <MotionNavLink to="/tesouraria" className="tab" aria-label="Tesouraria" onClick={() => playSfx("coin")} {...tabMotion} />
          <MotionNavLink to="/" end className="tab" aria-label="Guilda" onClick={() => playSfx("coin")} {...tabMotion} />
          <MotionNavLink to="/sala-do-tempo" className="tab" aria-label="Tempo" onClick={() => playSfx("coin")} {...tabMotion} />
          <MotionNavLink to="/regras" className="tab" aria-label="Ajustes" onClick={() => playSfx("coin")} {...tabMotion} />
        </nav>
      </div>
    </MotionConfig>
  );
}

export default App;
