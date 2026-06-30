import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import PhaserGameCanvas from "./PhaserGameCanvas";
import GuildMapScene, { GUILD_MAP_SCENE_KEY, type GuildMapRoom, type GuildMapSceneData } from "./scenes/GuildMapScene";
import { playSfx } from "../sound";

const HEIGHT = 240;
const FALLBACK_WIDTH = 360;

interface GuildMapCanvasProps {
  rooms: GuildMapRoom[];
}

// Mede a largura disponível do container e monta o mapa navegável da guilda nesse espaço.
export default function GuildMapCanvas({ rooms }: GuildMapCanvasProps) {
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

  const data: GuildMapSceneData = useMemo(
    () => ({
      width,
      height: HEIGHT,
      rooms,
      onEnterRoom: (room: GuildMapRoom) => {
        playSfx("coin");
        navigate(room.to);
      },
    }),
    [width, rooms, navigate],
  );

  return (
    <div ref={wrapperRef} className="guild-map-wrap">
      <PhaserGameCanvas
        sceneClass={GuildMapScene}
        sceneKey={GUILD_MAP_SCENE_KEY}
        width={width}
        height={HEIGHT}
        data={data}
      />
    </div>
  );
}
