import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import PhaserGameCanvas from "./PhaserGameCanvas";
import GuildReceptionScene, {
  GUILD_RECEPTION_SCENE_KEY,
  type GuildReceptionSceneData,
} from "./scenes/GuildReceptionScene";
import { GUILD_SHORTCUTS, type GuildShortcut } from "./guildReceptionConfig";
import { playSfx } from "../sound";

const FALLBACK_WIDTH = 360;
const HEIGHT_RATIO = 1.05;
const MIN_HEIGHT = 320;
const MAX_HEIGHT = 440;

interface GuildReceptionCanvasProps {
  hasUrgentMissions: boolean;
  onReceptionistTap: () => void;
  onEnterMissionBoard: () => void;
}

// Cena principal da recepção da guilda: fundo + recepcionista + mural de missões + atalhos,
// tudo num único canvas Phaser responsivo (altura derivada da largura medida do container).
// Tocar no mural abre o pop-up de missões (ver GuildReceptionScreen); os atalhos continuam
// navegando direto pra rota correspondente.
export default function GuildReceptionCanvas({
  hasUrgentMissions,
  onReceptionistTap,
  onEnterMissionBoard,
}: GuildReceptionCanvasProps) {
  const navigate = useNavigate();
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const [width, setWidth] = useState(FALLBACK_WIDTH);

  useEffect(() => {
    const el = wrapperRef.current;
    if (!el) return;

    const observer = new ResizeObserver((entries) => {
      const measured = entries[0]?.contentRect.width;
      if (measured) setWidth(Math.round(measured));
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const height = Math.min(MAX_HEIGHT, Math.max(MIN_HEIGHT, Math.round(width * HEIGHT_RATIO)));

  const data: GuildReceptionSceneData = useMemo(
    () => ({
      width,
      height,
      shortcuts: GUILD_SHORTCUTS,
      hasUrgentMissions,
      onEnterMissionBoard: () => {
        playSfx("coin");
        onEnterMissionBoard();
      },
      onEnterShortcut: (shortcut: GuildShortcut) => {
        playSfx("coin");
        navigate(shortcut.to);
      },
      onReceptionistTap,
    }),
    [width, height, hasUrgentMissions, navigate, onReceptionistTap, onEnterMissionBoard]
  );

  return (
    <div ref={wrapperRef} className="guild-reception-wrap">
      <PhaserGameCanvas
        sceneClass={GuildReceptionScene}
        sceneKey={GUILD_RECEPTION_SCENE_KEY}
        width={width}
        height={height}
        data={data}
      />
    </div>
  );
}
