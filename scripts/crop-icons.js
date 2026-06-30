const fs = require("fs");
const path = require("path");
const { PNG } = require("pngjs");

const SRC = path.join(__dirname, "..", "frontend", "public", "assets-ref", "Icones.png");
const OUT_DIR = path.join(__dirname, "..", "frontend", "public", "icons-game");

if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });

function cropRect(x0, y0, w, h, name) {
  const out = new PNG({ width: w, height: h });
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const srcX = x0 + x;
      const srcY = y0 + y;
      const srcIdx = (png.width * srcY + srcX) << 2;
      const dstIdx = (w * y + x) << 2;
      out.data[dstIdx] = png.data[srcIdx];
      out.data[dstIdx + 1] = png.data[srcIdx + 1];
      out.data[dstIdx + 2] = png.data[srcIdx + 2];
      out.data[dstIdx + 3] = png.data[srcIdx + 3];
    }
  }
  const outPath = path.join(OUT_DIR, `${name}.png`);
  fs.writeFileSync(outPath, PNG.sync.write(out));
  console.log("wrote", outPath);
}

const png = PNG.sync.read(fs.readFileSync(SRC));
const cellW = Math.floor(png.width / 3); // 341

// Grade 3x3 confirmada pelo primeiro teste: chest e calendar (linha 2) bateram certo.
// Sino e envelope (linha 1) tiveram vazamento do vizinho; aqui aperta a janela de recorte.
cropRect(cellW * 1, cellW * 1, cellW - 50, cellW, "bell"); // Lembretes
cropRect(cellW * 2, cellW * 1, cellW - 40, cellW, "envelope"); // Contas
cropRect(cellW * 0, cellW * 2, cellW, cellW, "chest"); // Finanças
cropRect(cellW * 1, cellW * 2, cellW, cellW, "calendar"); // Calendário
