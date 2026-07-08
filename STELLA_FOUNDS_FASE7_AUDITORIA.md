# Stella Founds — Fase 7: Auditoria pré-implementação

Entregável solicitado antes de qualquer mudança grande desta fase (estabilidade,
backfill, identidade visual, Phaser/UI responsiva, parallax/multiplataforma).
Nada neste documento foi implementado ainda — é só levantamento + proposta.

Pacote visual de referência: `stella_founds_reception_concept_pack_v1.zip`
(13 arquivos — concept completo, mockup de UI, paleta, camadas de parallax,
personagem lo-fi, elementos decorativos). Direção confirmada: fantasia clara,
anime lo-fi, constelações, sem visual medieval escuro pesado.

---

## 1. Auditoria do projeto — estado atual

### Estável
- `core/domain/` (11 módulos movidos do antigo `game/`, sem lógica de UI).
- `core/repositories/storage.ts` (`table<T>()`, `Repository<T>` como contrato
  documentado, não forçado — ver seção "riscos").
- Navegação: dock de 4 núcleos (Recepção/Tempo/Tesouraria/Biblioteca) + Stella
  Core central, compartilhado entre `App.tsx` (mobile) e `DesktopApp.tsx` via
  `stellaActions.tsx`.
- Calendário unificado: `CalendarEntry` (`core/domain/calendarEntries.ts`) já
  separa `reminder | bill | holiday | birthday` como **kinds distintos** —
  **a separação pedida na seção 5 do briefing (lembrete ≠ conta) já existe**.
  Importante: `CalendarEntry` é **computado em memória** a partir de
  reminders/bills a cada leitura (`buildCalendarEntries`), nunca persistido —
  ou seja, não há cópia duplicada da entidade financeira pra manter
  sincronizada (o risco que a seção 5 do briefing descreve já não existe
  estruturalmente).
- Biblioteca: PDF/EPUB, progresso, anotações (`Annotation`), capítulos EPUB —
  tudo em UI tradicional, Phaser só na estante (ambientação).
- Design tokens de spacing/radius/elevação/motion em `tokens.css` — a
  ESTRUTURA serve, só a paleta de cor precisa mudar (ver seção 5).
- Code splitting: Phaser (~1,35–1,38 MB) nunca entra no bundle principal;
  `ReceptionCanvas`/`LibraryCanvas` são lazy e compartilham um único chunk
  bootstrapper (`PhaserCanvas.tsx`), confirmado no build output.

### Parcialmente implementado
- **Backfill/migração de dados: não existe como sistema formal.** Não há
  `BackfillService`, `MigrationService`, `BackfillReport`, `BackfillCheckpoint`,
  nem campo de versão de schema em `table()`/`storage.ts`. O único precedente
  é um ajuste ad-hoc em `weather.ts` (renomeia um campo de local salvo, sem
  relatório/idempotência formal). **Isto muda o enquadramento da seção 3 do
  briefing**: não é uma "revisão" de algo existente — é construir a
  infraestrutura pela primeira vez. Ver seção 2 abaixo.
- **Testes automatizados: zero.** `package.json` não tem `vitest`/`jest`/
  `playwright` como dependência nem script de teste. Toda validação desta
  sessão foi Playwright ad-hoc rodado manualmente na pasta de scratchpad,
  nunca persistido no repositório. Pra cumprir a seção 6 do briefing
  (testes de idempotência/interrupção/etc.) preciso **primeiro** instalar um
  test runner (Vitest é o natural pro Vite) — infraestrutura nova, não ajuste.
- **Recepção**: hoje é uma grade de cards flutuantes (`GuildReception.tsx`,
  refeita numa sessão anterior) + Phaser só com campo de estrelas/hotspot —
  **não existe a composição "ilustração única + sidebar de cards" do concept
  pack**. Ver seção 7.
- Edição de recorrência (série completa / esta-e-futuras / só esta) — MVP
  atual só cria/para recorrência, não edita retroativamente (já era uma
  lacuna conhecida e documentada da Fase 4).

### Duplicado
- Nada de duplicação estrutural nova encontrada (a revisão pós-Fase-5 já
  consolidou os pontos identificados: `materializeRuleOccurrences`,
  `EntryRow`/`dayLabel` compartilhados, ações do Stella Core deduplicadas).
- **Duas fontes de cotação de câmbio diferentes** (achado na revisão do app
  Android): tela de Tesouraria usa `open.er-api.com` (JS), o widget nativo de
  Câmbio usa `economia.awesomeapi.com.br` (Java) — não é duplicação de código,
  mas os dois podem mostrar valores levemente diferentes pro mesmo par.

### Acoplado ao Phaser (correto, dentro do padrão) vs. o que deveria sair
- **Corretamente em Phaser hoje**: campo de estrelas + linhas de constelação
  decorativas da Recepção (`ReceptionScene.ts`), ambientação da estante da
  Biblioteca (`LibraryScene.ts`) — ambos só emitem eventos (`game.events.emit`),
  nunca tocam storage/navegação diretamente. Ponte via `receptionBridge.ts`
  (`onReceptionHotspotTap`) é a única porta de saída — padrão correto mantido.
- **Ponto de atenção**: as cores do `ReceptionScene.ts` (estrelas cor
  `0xf4e9c9`, hotspot `0x8fb3f5`) foram calibradas pro fundo escuro do tema
  "lofi-guilda" atual. Com o novo céu claro do concept pack, esse contraste
  não funciona — estrelas claras em fundo claro ficam invisíveis. Precisa de
  ajuste de cor, não de arquitetura.
- **Dois "hotspots" conceitualmente distintos hoje**: o núcleo pulsante do
  Phaser (abre o Clima) e o Stella Core ✦ (menu de ações). O concept pack tem
  só UM núcleo central visual — vale decidir se eles se fundem ou continuam
  paralelos antes de desenhar a nova Recepção (pergunta em aberto, seção 7).
- **Nada hoje está indevidamente em Phaser** — não há lógica de negócio,
  formulário ou navegação dentro de scenes. O padrão "Phaser só ambientação"
  está sendo respeitado integralmente.

### Riscos atuais
1. **[CRÍTICO] Conta recorrente apagada individualmente volta sozinha.**
   `ensureRuleOccurrences()` chama `activeBills()` (`api.ts:202`, filtra
   `!b.deleted`) antes de calcular quais meses já existem
   (`buildMissingRuleOccurrences`, dedupe por `dueDate.slice(0,7)`). Se o
   usuário apaga (tombstone) só a ocorrência de um mês específico de uma
   conta recorrente, na próxima vez que a tela de Contas carregar
   (`bills.list()` roda `ensureRuleOccurrences()` sempre), aquele mês é visto
   como "faltando" e é **recriado automaticamente**. É exatamente o cenário
   que o briefing pede pra evitar ("pagamentos recriados", "loop de
   geração"). Correção proposta na seção 3.
2. `Repository<T>` documentado em `core/repositories/storage.ts` não é
   respeitado pela implementação real de `table()` (que é síncrona) — foi
   uma decisão deliberada da Fase 1 pra não quebrar ~8 chamadores, mas
   continua sendo uma inconsistência entre contrato e implementação que uma
   pessoa nova no projeto pode não perceber.
3. Sem teste automatizado, qualquer regressão futura (principalmente no
   backfill) só é pega manualmente — risco crescente à medida que mais fases
   se acumulam.
4. `AppNotificationListenerService` (Android) não faz backfill de
   notificações ativas em `onListenerConnected()` — histórico fica vazio após
   reboot/force-stop até a próxima notificação nova chegar (achado já
   reportado na revisão do app Android, incluído aqui por afetar "dados
   antigos vs. novos" também no native).
5. Bundle principal (`index-*.js`) e o chunk do Phaser (`PhaserCanvas-*.js`)
   estão ambos acima de 500 kB pós-minificação (aviso do próprio Vite) — não é
   crítico hoje, mas relevante pra performance em aparelhos mais fracos
   (seção 9).

### Código morto
- `frontend/android/app/src/main/res/xml/file_paths.xml` (FileProvider) —
  parece boilerplate padrão do Capacitor, não referenciado em nenhum lugar do
  app (nem JS nem Java). Não removi — pode ser usado por um plugin no futuro
  (compartilhamento de arquivo) e remover o `<provider>` é mais custoso que
  deixar.
- Nenhum outro código morto significativo encontrado nesta rodada (as
  revisões anteriores já limparam ícones/rotas/hooks órfãos).

### Possíveis regressões a observar ao mexer no visual
- `stella-core.css` é o ÚNICO consumidor de `--stella-*` hoje — trocar a
  paleta tem raio de impacto pequeno e contido.
- O tema "Guilda" (não-lofi, `isLofi === false`) ainda usa uma arte de fundo
  fotográfica antiga com balão de fala desenhado — mexer na paleta light não
  deve tocar esse branch por engano (são visualmente incompatíveis por design;
  o tema "Guilda" é o legado bloqueado, não o Stella).

---

## 2. Auditoria do backfill — detalhe

**Não existe.** Resumo do que eu esperava encontrar vs. o que existe:

| Esperado pelo briefing | Existe? |
|---|---|
| `BackfillService` | Não |
| `MigrationService` | Não |
| `BackfillReport` | Não |
| `BackfillCheckpoint` | Não |
| Versão de schema por registro | Não |
| Chave de dedupe (`sourceType`+`sourceId`+`occurrenceDate`) | Parcial — existe uma dedupe equivalente conceitualmente só pra `RecurringFinanceRule` (por `recurrenceId` + mês), não generalizada |
| Migração idempotente testável | Não (sem testes) |

O que existe, na prática, são "migrações implícitas" espalhadas: campos
opcionais com fallback (`?? default`) lidos direto na hora do uso, e um único
ajuste explícito em `weather.ts`. Isso funciona hoje porque o app nunca teve
uma mudança de schema destrutiva, mas não escala e não é auditável.

**Implicação prática**: não há "dados antigos" com um schema formalmente
diferente esperando conversão — o app sempre leu/escreveu o formato atual.
O trabalho real da seção 3 do briefing não é "corrigir migrações quebradas",
é **prevenir que a próxima mudança de schema RESULTE nos problemas descritos**
(duplicação, perda, recorrência duplicada) — construindo a infraestrutura
agora, antes que ela seja necessária de forma reativa/urgente.

---

## 3. Relatório de riscos (consolidado)

| # | Risco | Severidade | Ação proposta |
|---|---|---|---|
| 1 | Conta recorrente apagada individualmente é recriada | **Alta** | Corrigir `ensureRuleOccurrences` pra considerar ocorrências apagadas como "já existentes" (não regenerar) |
| 2 | Zero infraestrutura de migração/backfill | Média-Alta | Construir `BackfillService`/`MigrationService` mínimo viável antes da próxima mudança de schema |
| 3 | Zero testes automatizados | Média-Alta | Introduzir Vitest + suíte mínima focada em backfill/recorrência (o que já existe hoje) |
| 4 | Paleta `tokens.css` incompatível com nova direção visual | Média | Refatorar valores mantendo os nomes semânticos onde fizer sentido |
| 5 | Cores do `ReceptionScene.ts` inadequadas pro céu claro novo | Média | Recalibrar cor das estrelas/hotspot quando a nova Recepção entrar |
| 6 | Bundle principal e do Phaser acima de 500kB | Baixa-Média | Avaliar code-splitting adicional (rotas pesadas: leitor EPUB/PDF, calculadora) |
| 7 | Dois "hotspots" conceituais na Recepção (Phaser + Stella Core) | Baixa | Decisão de design a alinhar antes de redesenhar a Recepção |
| 8 | `AppNotificationListenerService` sem backfill de notificações ativas | Baixa | Adicionar `onListenerConnected()` (já reportado antes) |
| 9 | Duas fontes de câmbio (widget vs. app) podem divergir | Baixa | Documentado; decisão do usuário se reconcilia ou mantém |

---

## 4. Proposta de correção do backfill

### 4.1 Correção crítica imediata (risco #1)
Em `api.ts`, `ensureRuleOccurrences()` hoje usa `activeBills()` (exclui
`deleted: true`) pra descobrir quais meses já têm ocorrência. Trocar por uma
lista que **inclui apagadas** só para fins de dedupe (sem trazê-las de volta
pra UI):

```ts
// Novo: usa TODAS as ocorrências já materializadas pra essa regra (mesmo
// apagadas) só pra decidir o que falta gerar — apagar uma ocorrência não
// deve trazê-la de volta no próximo ensureRuleOccurrences().
function occurrencesForRule(ruleId: string): Bill[] {
  return billTable.list().filter((b) => b.recurrenceId === ruleId);
}
```
E usar `occurrencesForRule(rule.id)` no lugar de `bills.filter(...)` dentro de
`ensureRuleOccurrences()`. Baixo risco, mudança cirúrgica, cobre exatamente o
cenário relatado.

### 4.2 Infraestrutura de backfill (nova, mínima viável)
Não construir um framework genérico grande de uma vez. Proposta mínima:

```
core/backfill/
  BackfillService.ts     — orquestra migrations registradas, produz BackfillReport
  BackfillCheckpoint.ts  — grava progresso em localStorage (chave própria),
                            permite retomar se interrompido no meio
  types.ts               — Migration, BackfillReport, BackfillCheckpoint
```

```ts
interface Migration {
  id: string;               // ex: "2026-07-recurring-dedupe-key"
  version: number;           // ordem de execução
  run(): Promise<MigrationResult>; // idempotente por contrato
}

interface MigrationResult {
  processed: number;
  migrated: number;
  skipped: number;
  duplicatesAvoided: number;
  invalid: number;
  errors: { message: string; context?: unknown }[];
}
```

`BackfillCheckpoint` grava `{ migrationId, status: "done" | "in-progress" }`
por migration — se o app fechar no meio, a próxima abertura retoma da última
migration não concluída, sem re-rodar as já `"done"` (idempotência garantida
pelo checkpoint, não só pela lógica de cada migration individualmente —
dupla proteção). Erros nunca são engolidos: entram no relatório e ficam
visíveis (uma tela simples de diagnóstico, não necessariamente pro usuário
final — pode ficar em Ajustes, modo avançado).

**Chave de dedupe estável**, como pedido no briefing: onde fizer sentido,
usar `${sourceType}:${sourceId}:${occurrenceDate}` como chave de idempotência
(ex.: futuras migrations de calendário) — o caso da recorrência financeira já
usa um equivalente (`recurrenceId` + mês), não precisa reescrever isso.

### 4.3 Regra de ouro
"Executar duas vezes = executar uma vez" — garantido por: (a) cada migration
verifica se seu efeito já foi aplicado antes de aplicar de novo (idempotência
própria), E (b) o checkpoint evita re-execução de migrations já concluídas
(defesa em profundidade, não só uma camada).

---

## 5. Plano de Design System (Stella)

Estrutura já existe (`core/design-system/tokens.css` + `breakpoints.ts`) —
proposta é **refatorar a paleta**, não recriar a estrutura. Renomear para
`src/ui/theme/` conforme pedido no briefing (ou manter `core/design-system/`
e só adicionar os arquivos que faltam — a decidir, ambos funcionam;
recomendo manter o caminho atual pra não gerar um rename sem necessidade
funcional, já que nada de errado há na localização).

Paleta extraída de `02_palette_reference.png` (valores exatos do pack):

| Token semântico proposto | Hex | Papel |
|---|---|---|
| `--stella-cream` | `#F7E5C9` | fundo primário claro |
| `--stella-ivory` | `#EAD8B0` | fundo elevado/secundário |
| `--stella-gold` | `#D8A66A` | dourado suave (ícones, bordas finas) |
| `--stella-blue` | `#7FAEE6` | azul Stella (ações primárias) |
| `--stella-sky` | `#9CC9F1` | azul-céu (fundos atmosféricos) |
| `--stella-lavender` | `#7B61A8` | lavanda (acentos secundários) |
| `--stella-coral` | `#E45D4E` | coral (alerta/destaque, não "erro" duro) |
| `--stella-graphite` | `#3A3F4B` | texto principal sobre fundo claro |

Tokens semânticos (mapeando pra esses valores, como pedido):
`background.primary`, `background.elevated`, `surface.glass`, `surface.soft`,
`text.primary`, `text.secondary`, `accent.stella`, `accent.gold`,
`status.success/warning/danger`. `status.danger` reaproveita o coral em vez de
um vermelho genérico, pra não quebrar a paleta clara com um tom agressivo.

`spacing.ts`/`radius.ts`/`elevation.ts`/`motion.ts`/`breakpoints.ts` (TS,
não CSS puro) — só extrair os valores que já existem em `tokens.css` pra
constantes TS tipadas, útil pra Phaser (que não lê CSS custom properties)
usar as mesmas cores/espaçamentos. Isso resolve uma lacuna real: hoje
`ReceptionScene.ts` tem cores hardcoded (`0xf4e9c9`) sem nenhuma ligação com
o design system.

---

## 6. Plano de migração visual

Migração **por tela, incremental**, reaproveitando o mecanismo que já existe
(tema "Guilda" trancado convive com "lofi" hoje) — não um "big bang":

1. Trocar só a paleta de `tokens.css` primeiro (baixo risco, 1 consumidor).
2. Recepção ganha a nova composição (maior mudança visual, ver seção 7-8).
3. Stella Core migra de cor (já é componente isolado, `--stella-*` puro).
4. Demais telas (Tempo/Tesouraria/Biblioteca) migram card-by-card, sem
   quebrar a UI existente — hoje elas já usam variáveis de tema
   (`--bg`, `--accent`, `--surface` em `index.css`) que podem apontar pros
   novos valores Stella sem reescrever componente por componente.

---

## 7. Análise da Recepção atual vs. concept pack

**Atual**: grade de cards flutuantes sobre um Phaser de estrelas (tema lofi)
ou uma foto estática antiga com balão de fala (tema Guilda, legado). Não há
ilustração de cenário único, não há sidebar de cards informativos, não há
composição em camadas.

**Concept pack**: uma ÚNICA ilustração de cenário (biblioteca/mesa/janela com
castelo), com 4 cards informativos (`PRÓXIMO`/`HOJE`/`ATENÇÃO`/`PROGRESSO`)
sobrepostos como painel translúcido à direita, barra superior com
logo+saudação+nível, dock inferior com Stella Core central.

**Gap real**: a arte final do concept pack (ilustração completa de cenário)
**não existe como asset de produção** — o pack é explicitamente só
referência ("NOT true transparent production layers"). Migrar a Recepção pra
essa composição exige arte nova (ilustração completa OU camadas separadas)
que ainda não foi encomendada/produzida. Proposta: **não bloquear a
Fase 7 nisso** — usar um fallback (gradiente/cor sólida com os tokens novos)
enquanto a arte de produção não chega, estruturando o layout (posições dos 4
cards, barra superior, dock) desde já. Os cards atuais (Resumo/Mural/Sala do
Tempo/Tesouraria/Temas/Ajustes/Relógio) mapeiam razoavelmente bem pros 4
cards do mockup, com reagrupamento.

**Pergunta em aberto** (preciso da sua decisão antes da etapa G):
os dois "hotspots" (núcleo Phaser que abre o Clima, e Stella Core ✦ que abre
o menu de ações) se fundem num só elemento central, ou continuam
paralelos (um decorativo+atalho de clima, outro funcional)?

---

## 8. Arquitetura das futuras camadas (parallax)

Proposta mínima, sem exigir arte final agora:

```ts
// core/domain/receptionLayers.ts (puro, sem DOM/Phaser)
interface ReceptionLayerConfig {
  id: string;
  asset: string;                 // caminho do fallback estático hoje
  depth: number;                 // ordem de empilhamento
  parallaxFactor: number;        // 0 (fixo) a 1 (move junto do ponteiro)
  enabled: boolean;
  reducedMotionBehavior: "static" | "hidden";
}

const RECEPTION_LAYERS: ReceptionLayerConfig[] = [
  { id: "sky", asset: "...", depth: 0, parallaxFactor: 0.02, enabled: true, reducedMotionBehavior: "static" },
  { id: "architecture", asset: "...", depth: 1, parallaxFactor: 0.05, enabled: true, reducedMotionBehavior: "static" },
  { id: "midground", asset: "...", depth: 2, parallaxFactor: 0.10, enabled: true, reducedMotionBehavior: "static" },
  { id: "desk", asset: "...", depth: 3, parallaxFactor: 0.14, enabled: true, reducedMotionBehavior: "static" },
  { id: "character", asset: "...", depth: 4, parallaxFactor: 0.18, enabled: true, reducedMotionBehavior: "static" },
  { id: "foreground", asset: "...", depth: 5, parallaxFactor: 0.25, enabled: true, reducedMotionBehavior: "static" },
  { id: "constellations", asset: "...", depth: 6, parallaxFactor: 0.08, enabled: true, reducedMotionBehavior: "hidden" },
];
```

Renderização: componente DOM (`<img>`/`<div>` com `background-image`) por
camada, cada uma com `transform: translate3d(...)` calculado a partir da
posição do ponteiro/toque — **não em Phaser** (parallax de imagens estáticas
é DOM/CSS, conforme a seção 12 do briefing: Phaser fica só pra cena/partículas/
personagem, não pra composição de camadas de UI). Hotspots ficam em
elementos DOM separados posicionados por %, nunca "colados" na imagem
(exatamente como já funciona hoje pro hotspot do Clima). Hoje: todas as
camadas usam o MESMO fallback estático (`parallaxFactor` calculado mas sem
efeito visual, já que é uma imagem só) — o parallax de verdade só liga
quando existirem assets separados por camada.

---

## 9. Plano de performance

- **Phaser**: já lazy, já pausa implicitamente ao desmontar (React
  desmonta `ReceptionCanvas`/`LibraryCanvas` ao sair da rota, e o
  bootstrapper compartilhado destrói o `Phaser.Game` no cleanup — confirmar
  isso explicitamente com um teste antes de mexer, não assumir).
  `showPhaserScene` já é `false` com "Animações reduzidas" — comportamento
  correto já existe.
- **Bundle**: `index-*.js` (~1,6MB) e `PhaserCanvas-*.js` (~1,38MB) acima do
  aviso de 500kB do Vite. Candidatos a lazy-load adicional: leitor de
  EPUB/PDF (`epubjs`/`pdfjs-dist` já são pesados e só usados na Biblioteca),
  calculadora financeira. Avaliar na etapa de performance (não bloqueia o
  resto).
- **RAF/listeners**: auditoria não encontrou uso de `requestAnimationFrame`
  fora do Phaser (que gerencia o próprio loop internamente) nem
  `ResizeObserver`; só um `resize` listener (`PdfReader.tsx`, esperado). Sem
  achados de vazamento aqui.
- **Reduced motion**: já implementado consistentemente (parallax contínuo
  precisa nascer respeitando essa mesma flag desde o início, não como
  adição posterior).

---

## 10. Arquivos que serão modificados (por etapa)

| Etapa | Arquivos principais |
|---|---|
| A. Correção crítica de backfill | `frontend/src/api.ts` |
| B. Testes de idempotência | `package.json` (+vitest), `frontend/src/core/backfill/*.test.ts` (novo) |
| C. Estabilização | conforme testes revelarem |
| D. Design System | `frontend/src/core/design-system/tokens.css`, novo `spacing.ts`/`radius.ts`/`elevation.ts` |
| E. Navegação | provavelmente nenhuma mudança estrutural (já consolidada) |
| F. Stella Core | `ui/stella-core/stella-core.css` (cor), `StellaStarIcon.tsx` (se precisar) |
| G. Nova Recepção | `pages/GuildReception.tsx`, `App.css` (novo layout), `phaser/scenes/ReceptionScene.ts` (cor) |
| H. Parallax leve | novo `core/domain/receptionLayers.ts`, novo componente de camadas |
| I. SVG/constelações | novo componente SVG (fora do Phaser, conforme seção 12) |
| J. Refinamento das demais telas | `Tempo`/`Tesouraria`/`Biblioteca` — cores/tokens, sem mudança estrutural |

---

## Perguntas antes de eu começar a etapa A

1. A correção crítica (#1, seção 3/4.1) — posso aplicar já? É pequena,
   cirúrgica, e resolve um bug de dados reais.
2. Infraestrutura de backfill (seção 4.2) — tamanho mínimo proposto ok, ou
   prefere algo ainda mais enxuto pra essa primeira versão?
3. Os dois "hotspots" da Recepção (Phaser clima vs. Stella Core) — fundir ou
   manter paralelos?
4. Arte de produção da Recepção nova: sigo com fallback (cor/gradiente dos
   novos tokens) por enquanto, ou você vai encomendar/gerar os assets em
   camada antes de eu montar a estrutura visual?
