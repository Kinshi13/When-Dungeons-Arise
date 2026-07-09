// Contrato de asset de PRODUÇÃO pra composição em camadas da Recepção —
// substitui a tentativa anterior (pacote de assets v2), que usava strips de
// referência recortadas independentemente, cada uma com seu próprio canvas
// e coordenadas. Empilhar strips assim fragmenta a cena em vez de
// reconstruí-la (céu virava faixa, arquitetura ficava fragmentada, plano
// médio flutuava, personagem isolada, primeiro plano fragmentado) — o
// problema não era o anchor escolhido pra cada uma, era a ausência de um
// canvas/coordenadas comuns entre elas pra começo de conversa.
//
// Uma camada de produção de verdade precisa nascer no MESMO canvas que as
// outras (mesma largura/altura/composição original) — só assim empilhar
// todas em x=0/y=0 reconstrói a cena. anchorX/anchorY são a posição desta
// camada dentro desse canvas compartilhado (não um ajuste visual arbitrário
// por camada).
export interface ProductionParallaxLayer {
  id: string;
  asset: string;
  canvasWidth: number;
  canvasHeight: number;
  anchorX: number;
  anchorY: number;
  depth: number;
  maxOffset: number;
}

export interface ProductionLayerValidationResult {
  valid: ProductionParallaxLayer[];
  rejected: { layer: ProductionParallaxLayer; reason: string }[];
}

// A primeira camada da lista vira a referência de canvas — qualquer camada
// com dimensões diferentes é rejeitada (nunca "consertada" com CSS/anchor
// manual, ver o pedido explícito de não fazer isso). Uma lista vazia ou
// com 1 item só sempre é válida (nada pra comparar ainda).
export function validateProductionLayers(layers: ProductionParallaxLayer[]): ProductionLayerValidationResult {
  const [reference, ...rest] = layers;
  if (!reference) return { valid: [], rejected: [] };

  const valid: ProductionParallaxLayer[] = [reference];
  const rejected: ProductionLayerValidationResult["rejected"] = [];

  for (const layer of rest) {
    if (layer.canvasWidth !== reference.canvasWidth || layer.canvasHeight !== reference.canvasHeight) {
      rejected.push({
        layer,
        reason:
          `canvas ${layer.canvasWidth}x${layer.canvasHeight} da camada "${layer.id}" não bate com o canvas ` +
          `de referência ${reference.canvasWidth}x${reference.canvasHeight} (camada "${reference.id}")`,
      });
      continue;
    }
    valid.push(layer);
  }

  return { valid, rejected };
}

// Nenhum asset de produção (full-canvas, canvas/coordenadas compartilhados)
// chegou ainda — fica vazia até a arte final chegar. Trocar aqui é o único
// lugar que precisa mudar quando isso acontecer; ReceptionBackground.tsx só
// consome o resultado de validateProductionLayers, nunca a lista crua.
export const PRODUCTION_PARALLAX_LAYERS: ProductionParallaxLayer[] = [];
