import { createPortal } from "react-dom";
import "./ReceptionBackground.css";
import type { ReceptionBackgroundMode } from "../core/domain/receptionBackground";
import { PRODUCTION_PARALLAX_LAYERS, validateProductionLayers } from "../core/domain/receptionLayerAssets";
import { parallaxTransform } from "../core/domain/receptionLayers";

interface ReceptionBackgroundProps {
  mode: ReceptionBackgroundMode;
}

const IMPLEMENTED_MODES: ReceptionBackgroundMode[] = ["gradient-fallback", "layered-parallax", "static-art"];

// "effects" (partículas/luz) é independente da composição em camadas — não
// precisa de registro/alinhamento com nada (é um véu de luz por cima da
// cena inteira via mix-blend-mode), então continua ligado mesmo com o
// rollback do pacote v2 (ver receptionLayers.ts). cover é aceitável aqui
// porque zoom num padrão de luz difusa não "quebra" a leitura do jeito que
// quebraria uma cena com arquitetura/personagem reconhecíveis.
function EffectsOverlay() {
  const style = parallaxTransform("effects");
  if (!style) return null;
  return (
    <img
      src="/reception/effects.png"
      alt=""
      className="reception-layer-cover-blend"
      style={{ ...style, mixBlendMode: "screen", opacity: 0.32 }}
    />
  );
}

// Único componente que decide o que renderizar atrás da Recepção —
// GuildReception.tsx só passa o modo, sem nenhum condicional espalhado pela
// Home (Fase 7, etapa G). "static-art" ainda não tem arte de produção e cai
// no fallback; trocar de modo no futuro só muda o corpo desta função.
//
// "layered-parallax": composição em camadas de verdade, mas só entram
// camadas que passam por validateProductionLayers (mesmo canvas/coordenadas
// compartilhados — ver receptionLayerAssets.ts). PRODUCTION_PARALLAX_LAYERS
// está vazia hoje (rollback do pacote de assets v2, que eram strips de
// referência com canvas próprio cada uma, sem registro entre si — empilhar
// fragmentava a cena em vez de reconstruí-la). Enquanto isso, o resultado
// visual é o mesmo do gradient-fallback + effects, sem inventar anchors
// manuais pra "consertar" assets que não compartilham coordenadas.
export default function ReceptionBackground({ mode }: ReceptionBackgroundProps) {
  const effectiveMode = IMPLEMENTED_MODES.includes(mode) ? mode : "gradient-fallback";

  if (effectiveMode === "layered-parallax") {
    const { valid } = validateProductionLayers(PRODUCTION_PARALLAX_LAYERS);
    const canvasRef = valid[0];
    return (
      <div className="reception-background" aria-hidden="true">
        <div className="reception-background-gradient" style={parallaxTransform("sky")} />
        {canvasRef && (
          <div className="reception-layer-canvas" style={{ aspectRatio: `${canvasRef.canvasWidth} / ${canvasRef.canvasHeight}` }}>
            {valid.map((layer) => (
              <img
                key={layer.id}
                src={layer.asset}
                alt=""
                className="reception-layer-production"
                style={{
                  ...parallaxTransform(layer.id),
                  left: `${(layer.anchorX / layer.canvasWidth) * 100}%`,
                  top: `${(layer.anchorY / layer.canvasHeight) * 100}%`,
                }}
              />
            ))}
          </div>
        )}
        <EffectsOverlay />
      </div>
    );
  }

  // "static-art": uma única ilustração full-canvas (ao contrário do pacote
  // v2, este é o canvas de verdade — não um strip de referência). Um <img>
  // só, object-fit:cover — bem mais barato de compor que a pilha de
  // camadas PNG anterior. O parallax das estrelas continua vindo do canvas
  // do Phaser (camada "constellations"), renderizado por cima em
  // GuildReception.tsx; "effects" fica desligado aqui de propósito (a
  // ilustração já traz atmosfera própria, uma camada extra de blend só
  // custaria composição sem ganho visual).
  //
  // Portalizado pro body (mesmo padrão do backdrop do Stella Core) e
  // position:fixed cobrindo o viewport inteiro — sem isso, ficaria preso
  // aos limites de .reception-page (que reserva espaço pra dock), deixando
  // a barra flutuante sobre um vazio em vez de mostrar a ilustração
  // through o vidro translúcido dela. z-index abaixo do .app (que é 1)
  // garante que a imagem fica atrás de TUDO — inclusive da dock, que mora
  // dentro do .app — sem competir com nada.
  if (effectiveMode === "static-art") {
    const sky = parallaxTransform("sky");
    // scale(1.08) além do cover — um leve zoom a mais, pedido explicitamente
    // (a garota fica mais em destaque, e sobra uma margem extra pra cobrir
    // qualquer variação de aspect ratio sem revelar borda). O transform do
    // parallax de "sky" é concatenado na mesma string (não dá pra ter dois
    // "transform" competindo no mesmo estilo inline).
    const staticArtStyle = { transform: `scale(1.08) ${sky?.transform ?? ""}`.trim() };
    return createPortal(
      <div className="reception-background-fullscreen" aria-hidden="true">
        <img
          src="/reception/static-art.jpg"
          alt=""
          className="reception-background-static-art"
          style={staticArtStyle}
        />
      </div>,
      document.body
    );
  }

  if (effectiveMode === "gradient-fallback") {
    return (
      <div className="reception-background" aria-hidden="true">
        <div className="reception-background-gradient" style={parallaxTransform("sky")} />
        <EffectsOverlay />
      </div>
    );
  }
  return null;
}
