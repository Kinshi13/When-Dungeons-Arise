import { NavLink, Route, Routes, useLocation, useNavigate } from "react-router-dom";
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
import { TabBellIcon, TabCoinsIcon, TabHomeCalendarIcon, TabGuildIcon, TabGearIcon } from "./icons2";
import { useSettings, UI_ZOOM_BY_SCALE } from "./contexts/SettingsContext";
import { useSwipeNav } from "./useSwipeNav";
import { isNativePlatform } from "./notifications";
import { playSfx } from "./sound";
import "./App.css";

const MotionNavLink = motion.create(NavLink);

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
  const isHome = location.pathname === "/";

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
      <div className={`ambient-bg${isHome ? " ambient-bg-hidden" : ""}`} aria-hidden="true">
        <img src="/ambient-bg.gif" alt="" />
      </div>
      <div className="app" style={{ zoom: UI_ZOOM_BY_SCALE[uiScale] } as React.CSSProperties}>
        <div className="top-bar">
          <GameTopBar />
        </div>

        <main className="main" onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
          <Routes>
            <Route path="/" element={<GuildReception />} />
            <Route path="/missoes" element={<MissionBoard />} />
            <Route path="/sala-do-tempo" element={<TimeRoom />} />
            <Route path="/tesouraria" element={<Treasury />} />
            <Route path="/diario" element={<AdventureDiary />} />
            <Route path="/biblioteca" element={<Library />} />
            <Route path="/regras" element={<RulesBook />} />
            <Route path="/perfil" element={<CharacterDetail />} />
          </Routes>
        </main>
        <DueBillsPopup />
        <nav className="tabbar">
          <MotionNavLink to="/missoes" className="tab" onClick={() => playSfx("coin")} {...tabMotion}>
            <TabBellIcon width={22} height={22} />
            <span>Mural</span>
          </MotionNavLink>
          <MotionNavLink to="/tesouraria" className="tab" onClick={() => playSfx("coin")} {...tabMotion}>
            <TabCoinsIcon width={22} height={22} />
            <span>Tesouraria</span>
          </MotionNavLink>
          <MotionNavLink to="/" end className="tab tab-home" onClick={() => playSfx("coin")} {...tabMotion}>
            <TabGuildIcon width={26} height={26} />
            <span>Guilda</span>
          </MotionNavLink>
          <MotionNavLink to="/sala-do-tempo" className="tab" onClick={() => playSfx("coin")} {...tabMotion}>
            <TabHomeCalendarIcon width={22} height={22} />
            <span>Tempo</span>
          </MotionNavLink>
          <MotionNavLink to="/regras" className="tab" onClick={() => playSfx("coin")} {...tabMotion}>
            <TabGearIcon width={22} height={22} />
            <span>Ajustes</span>
          </MotionNavLink>
        </nav>
      </div>
    </MotionConfig>
  );
}

export default App;
