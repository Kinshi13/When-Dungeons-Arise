import "./ReceptionBackground.css";
import type { ReceptionBackgroundMode } from "../core/domain/receptionBackground";
import { RECEPTION_LAYER_ASSETS } from "../core/domain/receptionLayerAssets";
import { parallaxTransform } from "../core/domain/receptionLayers";

interface ReceptionBackgroundProps {
  mode: ReceptionBackgroundMode;
}

const IMPLEMENTED_MODES: ReceptionBackgroundMode[] = ["gradient-fallback", "layered-parallax"];

// Único componente que decide o que renderizar atrás da Recepção —
// GuildReception.tsx só passa o modo, sem nenhum condicional espalhado pela
// Home (Fase 7, etapa G). "static-art" ainda não tem arte de produção e cai
// no fallback; trocar de modo no futuro só muda o corpo desta função.
//
// "layered-parallax" (pacote de assets v2): degradê da identidade Stella
// continua sendo a base de cor (as camadas PNG são tiras horizontais
// baixas — ~853×70-125px — pensadas como faixas de cena em profundidade,
// não telas cheias; ver core/domain/receptionLayerAssets.ts pro porquê de
// cada uma usar largura 100%/altura proporcional em vez de cover esticado).
// Cada <img> lê seu próprio parallaxTransform (a mesma função pura que a
// Recepção já usa pro céu/constelações) — nenhuma delas depende de props
// vindas de fora, então a composição inteira mora só aqui.
export default function ReceptionBackground({ mode }: ReceptionBackgroundProps) {
  const effectiveMode = IMPLEMENTED_MODES.includes(mode) ? mode : "gradient-fallback";

  if (effectiveMode === "layered-parallax") {
    return (
      <div className="reception-background" aria-hidden="true">
        <div className="reception-background-gradient reception-layer-base" />
        {RECEPTION_LAYER_ASSETS.map((asset) => {
          const parallax = parallaxTransform(asset.id);
          if (asset.layout === "sprite") {
            // Precisa de translateX(-50%) pra centralizar + o translate3d do
            // parallax ao mesmo tempo — um wrapper cuida da centralização
            // (sem transform próprio), o <img> de dentro só recebe o parallax.
            return (
              <div
                key={asset.id}
                className={`reception-layer-sprite-wrap reception-layer-${asset.anchor}`}
                style={{ [asset.anchor]: `${asset.offsetPercent}%`, height: `${asset.heightVh}vh` }}
              >
                <img src={asset.src} alt="" className="reception-layer-sprite" style={parallax} />
              </div>
            );
          }
          const style = {
            ...parallax,
            [asset.anchor]: `${asset.offsetPercent}%`,
            ...(asset.layout === "cover-blend"
              ? { mixBlendMode: asset.blend, opacity: asset.opacity }
              : {}),
          };
          return (
            <img
              key={asset.id}
              src={asset.src}
              alt=""
              className={`reception-layer reception-layer-${asset.layout} reception-layer-${asset.id}`}
              style={style}
            />
          );
        })}
      </div>
    );
  }

  if (effectiveMode === "gradient-fallback") {
    return (
      <div
        className="reception-background reception-background-gradient"
        style={parallaxTransform("sky")}
        aria-hidden="true"
      />
    );
  }
  return null;
}
