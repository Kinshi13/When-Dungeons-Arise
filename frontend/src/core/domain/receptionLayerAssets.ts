import type { CSSProperties } from "react";

// Âncora visual de cada camada PNG do pacote de assets v2 — decisão tomada
// durante a integração (não vem do manifest.json, que só tem depth/
// maxOffsetPx): as imagens são tiras bem largas e baixas (~853×70-125px,
// pensadas como "faixas" de cena, não telas cheias), então usar
// object-fit:cover esticado pra altura inteira da viewport ampliaria a
// imagem ~7-8x num celular — borrão sem reconhecer a arte original. Em vez
// disso cada camada mantém a proporção nativa (width:100%, height:auto) e
// ancora numa posição vertical específica, como faixas empilhadas de uma
// cena em profundidade — o degradê de ReceptionBackground (modo
// gradient-fallback) continua por baixo preenchendo o resto do céu.
export interface ReceptionLayerAsset {
  id: string;
  src: string;
  // "band": largura 100%, altura proporcional, ancorada em top ou bottom.
  // "cover-blend": cobre a tela inteira com mix-blend-mode (usado só pra
  // "effects", que é luz/partícula, não uma cena reconhecível — zoom nela
  // não "quebra" a leitura do jeito que quebraria arquitetura/personagem).
  // "sprite": tamanho próprio (altura fixa em vh), centralizado horizontalmente
  // — usado só pra "character", nunca esticado (nunca distorcer uma pessoa).
  layout: "band" | "cover-blend" | "sprite";
  anchor: "top" | "bottom";
  offsetPercent: number;
  heightVh?: number; // só "sprite"
  blend?: CSSProperties["mixBlendMode"];
  opacity?: number;
}

export const RECEPTION_LAYER_ASSETS: ReceptionLayerAsset[] = [
  { id: "sky", src: "/reception/sky.png", layout: "band", anchor: "top", offsetPercent: 0 },
  { id: "architecture", src: "/reception/architecture.png", layout: "band", anchor: "top", offsetPercent: 6 },
  { id: "midground", src: "/reception/midground.png", layout: "band", anchor: "top", offsetPercent: 34 },
  { id: "desk", src: "/reception/desk.png", layout: "band", anchor: "bottom", offsetPercent: 0 },
  { id: "effects", src: "/reception/effects.png", layout: "cover-blend", anchor: "top", offsetPercent: 0, blend: "screen", opacity: 0.32 },
  // Ancorada pra ficar visível no vão entre midground e a grade de cards
  // (que não pode ser movida) — não embaixo dela. Ver ajuste em
  // ReceptionBackground durante a verificação visual desta integração.
  { id: "character", src: "/reception/character.png", layout: "sprite", anchor: "bottom", offsetPercent: 50, heightVh: 16 },
  { id: "foreground", src: "/reception/foreground.png", layout: "band", anchor: "bottom", offsetPercent: -2 },
];

export function receptionLayerAsset(id: string): ReceptionLayerAsset | undefined {
  return RECEPTION_LAYER_ASSETS.find((a) => a.id === id);
}
