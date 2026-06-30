import Phaser from "phaser";

const BORDER_COLOR = 0x2b2b2b;

// Desenha a mesma silhueta pixelada usada como placeholder de personagem (cabeça, corpo,
// pernas, olhos) num Phaser.Container centrado em (x, y). Reaproveitado por toda cena que
// precisa de um personagem antes de termos as spritesheets reais.
export function drawPixelCharacterPlaceholder(
  scene: Phaser.Scene,
  x: number,
  y: number,
  size: number,
  colorHex: string,
) {
  const scale = size / 24;
  const color = Phaser.Display.Color.HexStringToColor(colorHex).color;

  const g = scene.add.graphics();
  g.fillStyle(color, 1);
  g.fillRect(-4 * scale, -9 * scale, 8 * scale, 7 * scale);
  g.lineStyle(scale, BORDER_COLOR, 1);
  g.strokeRect(-4 * scale, -9 * scale, 8 * scale, 7 * scale);

  g.fillRect(-6 * scale, -2 * scale, 12 * scale, 9 * scale);
  g.strokeRect(-6 * scale, -2 * scale, 12 * scale, 9 * scale);

  g.fillStyle(BORDER_COLOR, 1);
  g.fillRect(-6 * scale, 7 * scale, 4 * scale, 3 * scale);
  g.fillRect(2 * scale, 7 * scale, 4 * scale, 3 * scale);
  g.fillRect(-2 * scale, -6 * scale, 1.5 * scale, 1.5 * scale);
  g.fillRect(1.5 * scale, -6 * scale, 1.5 * scale, 1.5 * scale);

  return scene.add.container(x, y, [g]);
}
