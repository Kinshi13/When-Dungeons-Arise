{{flutter_js}}
{{flutter_build_config}}
_flutter.loader.load({
  config: {
    // Usa o CanvasKit já empacotado localmente em vez do CDN do Google —
    // evita uma dependência de terceiros em tempo de execução (consistente
    // com a filosofia local-first do app) e a flakiness de rede que o
    // próprio time do Flutter documenta para esse cenário.
    canvasKitBaseUrl: "/canvaskit/",
  },
});
