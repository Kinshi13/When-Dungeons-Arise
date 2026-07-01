const path = require("path");
const sharp = require("sharp");

const REF = path.join(__dirname, "..", "design-source", "assets-ref", "icons");
const OUT = path.join(__dirname, "..", "frontend", "public", "icons-nav");

const ICON_SIZE = 128;
const PADDING_RATIO = 0.1; // margem uniforme ao redor do conteúdo (+ espaço pra borda), igual pra todos

// Dois estilos de contorno: "hard" (aresta dura, tipo borda) e "glow" (halo suave,
// baixa opacidade). O usuário preferiu o glow suave nos ícones da Recepção
// (Diário/Biblioteca) depois de comparar os dois.
const RIM_STYLES = {
  hard: { blur: 4.5, threshold: 8, opacity: 0.95 },
  glow: { blur: 2.2, threshold: null, linear: 2.6, opacity: 0.32 },
};

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

async function buildIcon(name, rimStyle = "hard") {
  const style = RIM_STYLES[rimStyle];
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

  // Máscara de alfa dilatada via blur, servindo de contorno branco atrás do ícone.
  // Estilo "hard" binariza (threshold) pra virar uma borda de aresta dura; estilo
  // "glow" mantém o gradiente do blur e amplifica com .linear() pra um halo suave.
  let alphaPipeline = sharp(resizedBuf).ensureAlpha().extractChannel(3).blur(style.blur);
  alphaPipeline = style.threshold != null ? alphaPipeline.threshold(style.threshold) : alphaPipeline.linear(style.linear, 0);
  const alphaMask = await alphaPipeline.toBuffer();
  const rimAlphaRaw = await sharp(alphaMask).raw().toBuffer();
  const rimRGBA = Buffer.alloc(ICON_SIZE * ICON_SIZE * 4);
  for (let i = 0, j = 0; i < ICON_SIZE * ICON_SIZE; i++, j += 4) {
    rimRGBA[j] = 255;
    rimRGBA[j + 1] = 255;
    rimRGBA[j + 2] = 255;
    rimRGBA[j + 3] = Math.round(Math.min(255, rimAlphaRaw[i]) * style.opacity);
  }
  const rimBuf = await sharp(rimRGBA, { raw: { width: ICON_SIZE, height: ICON_SIZE, channels: 4 } }).png().toBuffer();

  await sharp({ create: { width: ICON_SIZE, height: ICON_SIZE, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } })
    .composite([{ input: rimBuf }, { input: resizedBuf }])
    .png({ compressionLevel: 9 })
    .toFile(path.join(OUT, `${name}.png`));

  console.log(`${name}.png gerado (conteúdo original ${box.width}x${box.height}, estilo ${rimStyle})`);
}

// Recorte fixo (coordenadas descobertas inspecionando a arte): a barra nova já
// vem com os 5 ícones desenhados direto nela, cada um no seu quadro decorado.
// A região abaixo isola só a fileira dos 5 quadros (sem o topo com brasão/fitas
// nem as franjas penduradas embaixo), bem centralizada e uniformemente espaçada
// — por isso dá pra dividir em 5 colunas iguais no CSS e cair certinho em cada
// ícone (bell=Mural, balança=Tesouraria, bússola=Guilda, calendário=Tempo,
// engrenagem=Ajustes), na mesma ordem de sempre.
const TABBAR_ICON_ROW_REGION = { left: 260, top: 228, width: 1660, height: 360 };

async function buildTabbarIntegratedArt() {
  const raw = await removeNeutralBackground(path.join(REF, "tabbar-integrated-source.png"));
  const extractedBuf = await sharp(raw.data, { raw: raw.info })
    .extract(TABBAR_ICON_ROW_REGION)
    .flatten({ background: { r: 28, g: 20, b: 48 } })
    .png()
    .toBuffer();
  await sharp(extractedBuf)
    .resize(1400, 303)
    .png({ compressionLevel: 9, quality: 90 })
    .toFile(path.join(OUT, "tabbar-bg.png"));
  console.log("tabbar-bg.png gerado (fileira dos 5 ícones integrados)");
}

async function main() {
  require("fs").mkdirSync(OUT, { recursive: true });
  // icon-financas/icon-lembrete/icon-config/icon-guilda não são mais gerados —
  // a barra inferior agora usa tabbar-bg.png com os 5 ícones já desenhados nela.
  await buildIcon("icon-add", "hard");
  await buildIcon("icon-diario", "glow");
  await buildIcon("icon-biblioteca", "glow");
  await buildTabbarIntegratedArt();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
