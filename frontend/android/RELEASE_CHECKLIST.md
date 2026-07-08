# Checklist de publicação — Google Play Store

Levantamento feito na Fase 6 (roteiro de publicação). Cobre só Android/Play
Store — PWA e Desktop ficam pra quando o usuário priorizar essas frentes.

## Já resolvido nesta sessão

- **appId**: `com.stellafounds.app` (trocado de `com.lembretes.app` — só era
  seguro mudar antes do primeiro upload; depois disso trava pra sempre).
- **Keystore de release**: gerada e assinatura configurada
  (`android/app/build.gradle` lê `keystore.properties`, que não vai pro git).
  O arquivo `.jks` e a senha foram entregues fora do repositório — **guarde
  os dois num cofre de senhas + backup seguro**. Sem eles, nunca mais dá pra
  publicar atualização do app com esse appId.
- **versionCode/versionName**: `1` / `"1.0.0"` — primeira versão candidata.
  A partir da próxima publicação, `versionCode` sobe 1 a cada envio (nunca
  pode repetir ou diminuir); `versionName` é só o texto exibido pro usuário.
- **Ícone adaptável**: já existe (`mipmap-anydpi-v26/ic_launcher.xml` +
  foreground/background por densidade) — não precisa de trabalho extra.
- Build de release testado localmente (`./gradlew assembleRelease`),
  assinatura confirmada via `apksigner verify --print-certs`.

## Precisa de ação do usuário (fora do código)

- **Conta de desenvolvedor Google Play** (taxa única de US$25) — se ainda
  não existe.
- **Ícone de alta resolução 512×512** pra ficha da loja (separado do ícone
  adaptável do APK — é upload direto no Play Console).
- **Screenshots** (mínimo 2, recomendado 4-8) — celular obrigatório, tablet
  opcional. Posso ajudar a capturar via Playwright/emulador quando quiser.
- **Descrição curta (80 caracteres) e longa (4000 caracteres)** da ficha da
  loja — posso rascunhar um texto em português quando você quiser revisar.
- **Política de privacidade** (URL pública, obrigatória mesmo pra apps sem
  coleta de dados). Levantamento do que o app realmente faz:
  - Todos os dados do usuário (lembretes, contas, notas, biblioteca) ficam
    **só no dispositivo** (local-first, sem backend).
  - Três chamadas de rede existem: `open-meteo.com` (previsão do tempo, a
    partir do nome da cidade que o usuário digita), `open.er-api.com`
    (cotação de moedas na tela de Tesouraria) e `economia.awesomeapi.com.br`
    (cotação do widget de Câmbio da tela inicial — código nativo Java,
    `CurrencyWidgetProvider.java`, roda mesmo com o app fechado). Nenhuma
    das três é analytics/rastreamento — só o nome da cidade digitado pelo
    usuário é enviado (pro geocoding do clima); nenhuma outra vai a
    lugar nenhum além do dispositivo.
  - **Atenção**: o widget de Câmbio e a tela de Tesouraria usam fontes
    diferentes pro mesmo par de moedas (AwesomeAPI vs. open.er-api.com) —
    os valores exibidos podem não bater exatamente. Decisão deliberada (o
    widget precisa funcionar com o app fechado), mas vale confirmar
    visualmente no aparelho se a diferença incomoda.
  - Nenhum SDK de anúncios, analytics ou crash reporting está presente.
  - Isso simplifica bastante a política de privacidade e o formulário de
    **Data Safety** do Play Console — posso rascunhar os dois textos.
- **Declaração de permissão restrita**: o app usa
  `BIND_NOTIFICATION_LISTENER_SERVICE` (recurso de notificações
  monitoradas). A Play Store exige um formulário de justificativa separado
  pra permissões sensíveis como essa — sem preencher, o app é rejeitado ou
  fica em análise mais longa. Vale revisar esse formulário com calma antes
  de submeter.

## Opcional / não bloqueia publicação

- Habilitar `minifyEnabled true` + R8/ProGuard no `buildTypes.release`
  (hoje `false`) — reduz o tamanho do APK, mas exige testar que nada quebra
  com ofuscação (Capacitor/plugins costumam já vir com regras prontas).
- Migrar de APK pra **Android App Bundle (.aab)** — a Play Store prefere/
  às vezes exige `.aab` pra novos apps (`./gradlew bundleRelease` em vez de
  `assembleRelease`). Fica fácil de fazer quando for a hora de submeter de
  verdade.
