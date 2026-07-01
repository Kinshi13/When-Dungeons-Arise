const path = require("path");
const sharp = require("sharp");

const REF = path.join(__dirname, "..", "design-source", "assets-ref", "icons");
const OUT = path.join(__dirname, "..", "frontend", "public", "icons-nav");

const ICON_SIZE = 128;
const PADDING_RATIO = 0.08; // margem uniforme ao redor do conteúdo, igual pra todos
const RIM_BLUR = 2.2; // raio do "dilate" (aproximado via blur) pra borda branca
const RIM_OPACITY = 0.32; // opacidade da borda branca — sutil, não um contorno forte

// Remove fundo branco/xadrez (quase-cinza neutro e claro), preservando cores
// saturadas do desenho (dourado, roxo etc.) mesmo quando claras.
async function removeNeutralBackground(inputPath) {
  const { data, info } = await sharp(inputPath).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const { width, height, channels } = info;
  for (let i = 0; i < data.length; i += channels) {
    const r = data[i], g = data[i + 1], b = data[i + 2];
    const min = Math.min(r, g, b), max = Math.max(r, g, b);
    const isNeutral = max - min < 14;
    const isBright = min > 222;
    if (isNeutral && isBright) data[i + 3] = 0;
  }
  return { data: Buffer.from(data), info: { width, height, channels } };
}

async function contentBoundingBox({ data, info }) {
  const { width, height, channels } = info;
  let minX = width, minY = height, maxX = 0, maxY = 0;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const alpha = data[(y * width + x) * channels + 3];
      if (alpha > 10) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }
  return { left: minX, top: minY, width: maxX - minX + 1, height: maxY - minY + 1 };
}

async function buildIcon(name) {
  const raw = await removeNeutralBackground(path.join(REF, `${name}-source.png`));
  const box = await contentBoundingBox(raw);
  const side = Math.max(box.width, box.height);
  const pad = Math.round(side * PADDING_RATIO);
  const squareSide = side + pad * 2;

  // Materializa cada etapa em um buffer PNG antes de seguir — encadear
  // extract+extend+resize numa mesma pipeline (a partir de raw pixels)
  // corrompe as dimensões finais no sharp.
  const extractedBuf = await sharp(raw.data, { raw: raw.info }).extract(box).png().toBuffer();
  const extendedBuf = await sharp(extractedBuf)
    .extend({
      top: Math.floor((squareSide - box.height) / 2),
      bottom: Math.ceil((squareSide - box.height) / 2),
      left: Math.floor((squareSide - box.width) / 2),
      right: Math.ceil((squareSide - box.width) / 2),
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .png()
    .toBuffer();

  const resizedBuf = await sharp(extendedBuf)
    .resize(ICON_SIZE, ICON_SIZE, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer();

  // Máscara de alfa "dilatada" via blur, pra servir de borda branca suave atrás do ícone.
  const alphaMask = await sharp(resizedBuf).ensureAlpha().extractChannel(3).blur(RIM_BLUR).linear(2.6, 0).toBuffer();
  const rimAlphaRaw = await sharp(alphaMask).raw().toBuffer();
  const rimRGBA = Buffer.alloc(ICON_SIZE * ICON_SIZE * 4);
  for (let i = 0, j = 0; i < ICON_SIZE * ICON_SIZE; i++, j += 4) {
    rimRGBA[j] = 255;
    rimRGBA[j + 1] = 255;
    rimRGBA[j + 2] = 255;
    rimRGBA[j + 3] = Math.round(Math.min(255, rimAlphaRaw[i]) * RIM_OPACITY);
  }
  const rimBuf = await sharp(rimRGBA, { raw: { width: ICON_SIZE, height: ICON_SIZE, channels: 4 } }).png().toBuffer();

  await sharp({ create: { width: ICON_SIZE, height: ICON_SIZE, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } })
    .composite([{ input: rimBuf }, { input: resizedBuf }])
    .png({ compressionLevel: 9 })
    .toFile(path.join(OUT, `${name}.png`));

  console.log(`${name}.png gerado (conteúdo original ${box.width}x${box.height})`);
}

async function buildTabbarBackground() {
  const raw = await removeNeutralBackground(path.join(REF, "tabbar-bg-source.png"));
  const box = await contentBoundingBox(raw);
  const extractedBuf = await sharp(raw.data, { raw: raw.info })
    .extract(box)
    .flatten({ background: { r: 28, g: 20, b: 48 } })
    .png()
    .toBuffer();
  await sharp(extractedBuf)
    .resize(960, 140, { fit: "cover", position: "top" })
    .png({ compressionLevel: 9, quality: 85 })
    .toFile(path.join(OUT, "tabbar-bg.png"));
  console.log(`tabbar-bg.png gerado (conteúdo original ${box.width}x${box.height})`);
}

async function main() {
  require("fs").mkdirSync(OUT, { recursive: true });
  await buildIcon("icon-add");
  await buildIcon("icon-financas");
  await buildIcon("icon-lembrete");
  await buildIcon("icon-config");
  await buildTabbarBackground();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
