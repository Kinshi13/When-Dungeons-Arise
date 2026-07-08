// API estável do fundo da Recepção (Fase 7, etapa G) — GuildReception.tsx
// só escolhe o modo, nunca decide o que renderizar (ver
// components/ReceptionBackground.tsx, único lugar que interpreta isto).
//
// - "gradient-fallback": CSS puro com os tokens do Stella Design System —
//   o que existe hoje, enquanto não há arte de produção.
// - "static-art": uma ilustração única em camada só (like a versão anterior
//   com lofi-guilda-bg.jpg, mas na nova identidade visual) — não implementado
//   ainda, sem asset de produção pronto (ver STELLA_FOUNDS_FASE7_AUDITORIA.md,
//   seção 7).
// - "layered-parallax": composição em camadas de verdade (céu, arquitetura,
//   plano médio, mesa, personagem, primeiro plano, constelações — ver seção
//   8 da auditoria), cada uma com profundidade/parallax próprios — depende
//   da arte final em camadas separadas, não só referências do concept pack.
export type ReceptionBackgroundMode = "gradient-fallback" | "static-art" | "layered-parallax";
