import Phaser from "phaser";

const WALL_COLOR = 0x251a3d;
const WALL_TRIM_COLOR = 0x1c1430;
const FLOOR_COLOR = 0x1c1430;
const FLOOR_LINE_COLOR = 0x2b2150;
const BANNER_COLOR = 0x6c5ce7;

// Fundo pixel art procedural da recepção (parede + bandeira da guilda + chão em grade).
// Substituível por `guild_reception_bg` quando o asset real existir — basta trocar isto por
// scene.load.image + scene.add.image cobrindo width x height.
export function drawGuildBackground(scene: Phaser.Scene, width: number, height: number) {
  const wallHeight = height * 0.32;

  const g = scene.add.graphics();
  g.fillStyle(WALL_COLOR, 1);
  g.fillRect(0, 0, width, wallHeight);
  g.fillStyle(WALL_TRIM_COLOR, 1);
  g.fillRect(0, wallHeight - 4, width, 4);

  const bannerW = width * 0.1;
  const bannerH = wallHeight * 0.7;
  const bannerX = width / 2 - bannerW / 2;
  g.fillStyle(BANNER_COLOR, 1);
  g.fillRect(bannerX, 6, bannerW, bannerH);
  g.lineStyle(2, 0x000000, 1);
  g.strokeRect(bannerX, 6, bannerW, bannerH);

  g.fillStyle(FLOOR_COLOR, 1);
  g.fillRect(0, wallHeight, width, height - wallHeight);

  g.lineStyle(1, FLOOR_LINE_COLOR, 0.6);
  const gridSize = 24;
  for (let gx = gridSize; gx < width; gx += gridSize) {
    g.lineBetween(gx, wallHeight, gx, height);
  }
  for (let gy = wallHeight + gridSize; gy < height; gy += gridSize) {
    g.lineBetween(0, gy, width, gy);
  }
}
