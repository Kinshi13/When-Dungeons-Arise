# Próximos passos — When Dungeons Arise

Este arquivo existe pra qualquer sessão nova (nuvem ou local) retomar o projeto sem precisar
reconstruir o contexto do zero. Leia isto antes de mexer em qualquer coisa.

## Onde estamos

App de produtividade gamificado (React + TypeScript + Vite + Capacitor, compila pra Android).
Tema: **Guilda de Aventureiros** — lembretes, calendário, finanças, notas e biblioteca de
PDF/EPUB reorganizados como salas de uma guilda, com sistema de XP/moedas/nível/sequência
diária baseado em ações reais do app.

Tudo isso já está **implementado e funcionando**: ver `README.md` na raiz pra descrição
completa das telas e do sistema de recompensas. Não é preciso reler o histórico do chat —
o `README.md` + este arquivo cobrem o necessário.

### Atualização recente (sessão de reformulação da navegação)

Várias telas ganharam sub-rotas + swipe unificado (`useSwipeNav.ts` trata tudo como uma
sequência única: Mural → Tesouraria (Finanças/Contas/Calculadora/Porcentagem) → Guilda →
Sala do Tempo (Calendário/Agenda) → Ajustes — ao passar da borda de um grupo de sub-abas, o
swipe cai naturalmente na área vizinha). Esse é o padrão a seguir se mais telas ganharem
sub-abas no futuro.

- **Recepção (Home)**: fundo estático (`guild-reception-bg.png`), sem cards/diálogo/boneco.
  Atalhos de Diário/Biblioteca viram ícones pequenos colados nas bordas esquerda/direita,
  com a faixa vertical inteira de cada lado clicável (não só o ícone).
- **Sala do Tempo**: `/sala-do-tempo/calendario` (integrado com Finanças, mostra contas) e
  `/sala-do-tempo/agenda` (só eventos/reuniões/tarefas + feriados nacionais, sem contas).
- **Tesouraria**: `/tesouraria/{financas,contas,calculadora,porcentagem}`. Contas ganhou
  status (pendente/paga/recebida), recorrência mensal automática e filtros. Finanças ganhou
  parcelamento (`game/installments.ts`). Porcentagem é calculadora de %, juros simples/compostos.
- **Diário**: virou app de notas de verdade — `/diario/notas` (texto livre, como antes) e
  `/diario/listas` (checklists com `components/Lists.tsx`, `Note.items`).
- Fundos por tela ficam centralizados em `App.tsx` (`PAGE_BACKGROUNDS`), com blur aplicado via
  CSS (`.page-bg-blurred`), não na imagem — fácil de recalibrar sem regenerar assets.

## Decisão tomada: não reescrever, adicionar Phaser

O usuário queria mais "sensação de jogo de verdade" (gameplay, não só tema visual) e cogitou
reescrever tudo nativo. Decisão final: **manter o stack atual** (React/TS/Capacitor, todas as
telas e dados como estão) e **adicionar Phaser** só nas partes que precisam parecer jogo de
verdade — sem reescrever nada que já funciona.

Por quê: Phaser é JS/TS, roda dentro de um `<canvas>` montado num componente React comum,
continua compilando pelo mesmo pipeline Capacitor pra Android. Reescrever em Kotlin/nativo
jogaria fora toda a lógica de dados (storage local, leitor de PDF/EPUB, notificações,
sistema de XP) pra ganho incerto.

## Plano do Phaser (ainda não iniciado)

1. **Instalar**: `npm install phaser` dentro de `frontend/`.
2. **Criar `frontend/src/game-engine/`** com:
   - `PhaserGameCanvas.tsx` — componente React que monta/desmonta uma instância Phaser num
     `<div>` ref, faz bridge de eventos entre Phaser e React (ex: callbacks quando o jogador
     clica num personagem ou completa uma ação no mini-jogo).
   - `scenes/` — cenas Phaser (ex: `ReceptionScene.ts` pra recepção animada, futuras cenas de
     exploração/mini-jogos).
3. **Primeiro uso recomendado**: trocar o `PixelCharacterIdle` (hoje placeholder CSS) da tela
   `GuildReception.tsx` por uma cena Phaser simples com sprite animado de verdade — escopo
   pequeno, prova de conceito, não mexe em nenhuma outra tela.
4. **Depois**: avaliar com o usuário se quer gameplay mais profundo (ex: mini-exploração da
   guilda, item collection visual, animações de conclusão de missão) — não implementar isso
   sem alinhar escopo primeiro, é fácil estourar o tempo aqui.
5. **Importante**: Phaser e React não devem competir pelo mesmo DOM. Cada cena Phaser vive
   isolada num componente próprio; o resto do app (formulários, listas, leitor de PDF/EPUB)
   continua 100% React normal. Não converter telas de CRUD (Mural de Missões, Tesouraria etc.)
   pra Phaser — não faz sentido pra esse tipo de interface.

## Pendências conhecidas (não relacionadas ao Phaser)

- **Widget Android de notas adesivas (adiado a pedido do usuário)**: ele pediu pra explorar a
  ideia de um widget de tela inicial pra notas do Diário. Investiguei a viabilidade nesta sessão
  e o usuário decidiu adiar — retomar só se ele pedir explicitamente. Contexto pra quando isso
  acontecer:
  - É código nativo Android de verdade (não dá pra fazer só em JS/React): um
    `AppWidgetProvider` (Kotlin) + layout XML em `RemoteViews` (views nativas restritas, não o
    WebView) + registro de `<receiver>` no `AndroidManifest.xml`.
  - Como as notas ficam no `localStorage` do WebView, o widget não lê os dados direto — precisa
    de um plugin Capacitor pequeno que espelhe as notas/listas pra um storage nativo
    (SharedPreferences ou SQLite) toda vez que o usuário salva algo.
  - Este ambiente de nuvem não tem Android SDK/emulador (`ANDROID_HOME` vazio, sem `adb`) — não
    dá pra testar/validar esse código aqui. Precisa ser buildado e testado localmente no Android
    Studio pelo usuário (ou numa sessão com acesso a emulador/dispositivo).
- **Marca d'água nas artes temporárias do Diário**: `diario-notas-bg.png` e
  `diario-listas-bg.png` vieram de imagens de personagem com marca d'água de terceiros
  (avisado e aceito pelo usuário como temporário). Trocar quando a arte final chegar — basta
  atualizar `design-source/assets-ref/` e rodar `scripts/optimize-screen-backgrounds.js`.
- **Spritesheets reais dos personagens**: recepcionista, bibliotecária, tesoureira etc. ainda
  usam um placeholder pixelado animado em CSS (`PixelCharacterIdle.tsx`). O componente já
  aceita `spriteUrl` + `frameCount` + `fps` — é só o usuário fornecer os arquivos (sugestão:
  salvar em `frontend/public/game/characters/` e me avisar os nomes dos arquivos).
- **Build de APK em ambiente de nuvem**: funciona. O SDK não vem pré-instalado no ambiente de
  nuvem, mas dá pra instalar em poucos minutos numa sessão nova:
  ```bash
  mkdir -p /opt/android-sdk/cmdline-tools
  cd /tmp && curl -sS -o cmdline-tools.zip \
    "https://dl.google.com/android/repository/commandlinetools-linux-11076708_latest.zip"
  unzip -q cmdline-tools.zip
  mkdir -p /opt/android-sdk/cmdline-tools/latest
  mv cmdline-tools/* /opt/android-sdk/cmdline-tools/latest/

  export ANDROID_HOME=/opt/android-sdk
  export PATH="$ANDROID_HOME/cmdline-tools/latest/bin:$PATH"
  yes | sdkmanager --licenses
  sdkmanager "platform-tools" "platforms;android-36" "build-tools;36.0.0"
  # versões devem bater com compileSdkVersion/targetSdkVersion em
  # frontend/android/variables.gradle — hoje ambos 36.

  cd frontend && npm run build:android   # tsc + vite build + cap sync android
  cd android
  chmod +x gradlew   # o bit de execução já foi corrigido no commit, mas por garantia
  echo "sdk.dir=/opt/android-sdk" > local.properties
  ./gradlew clean assembleDebug
  # APK sai em android/app/build/outputs/apk/debug/app-debug.apk
  ```
  Não precisa de `google-services.json` (o build detecta a ausência e pula o plugin do
  Firebase automaticamente). `*.apk` está no `.gitignore` — não commitar o binário; entregar
  direto pro usuário (ex: `SendUserFile`) ou copiar pra `lembretes-app-debug.apk` na raiz
  (mesmo caminho que o README já documenta, mas o arquivo em si nunca vai pro git).
- **iOS**: descartado por enquanto (precisa de Mac/serviço de build pago ou gratuito limitado).
  Não retomar sem o usuário pedir explicitamente.
- **Backend Express/Prisma** (`backend/`): não é mais usado pelo app (tudo é local-first hoje).
  Só existe no repo como base caso um dia se queira sincronizar dados entre aparelhos. Não
  mexer nele sem necessidade real.

## Como retomar

1. Leia `README.md` (visão geral do app) e este arquivo.
2. Rode `cd frontend && npm install && npm run dev` pra confirmar que tudo sobe limpo.
3. Se for mexer no Phaser, comece pelo passo 1 da lista acima.
4. Sempre que terminar uma etapa grande, rode `npx tsc -b --noEmit` antes de buildar o APK.
