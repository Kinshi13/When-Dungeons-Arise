import { useMemo } from "react";
import PhaserGameCanvas from "./PhaserGameCanvas";
import ReceptionScene, { RECEPTION_SCENE_KEY, type ReceptionSceneData } from "./scenes/ReceptionScene";

interface ReceptionCharacterSceneProps {
  name: string;
  spriteUrl?: string;
  frameCount?: number;
  fps?: number;
  size?: number;
  color?: string;
}

// Substitui o PixelCharacterIdle (CSS) na Recepção da Guilda por uma cena Phaser de verdade,
// mantendo a mesma interface de props pra ser um drop-in.
export default function ReceptionCharacterScene({
  name,
  spriteUrl,
  frameCount = 1,
  fps = 4,
  size = 96,
  color = "#f4c95d",
}: ReceptionCharacterSceneProps) {
  const data: ReceptionSceneData = useMemo(
    () => ({ size, spriteUrl, frameCount, fps, color }),
    [size, spriteUrl, frameCount, fps, color],
  );

  return (
    <div role="img" aria-label={name}>
      <PhaserGameCanvas
        sceneClass={ReceptionScene}
        sceneKey={RECEPTION_SCENE_KEY}
        width={size}
        height={size}
        data={data}
      />
    </div>
  );
}
