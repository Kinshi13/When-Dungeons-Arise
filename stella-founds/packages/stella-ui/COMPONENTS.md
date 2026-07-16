# Stella Design System — Component Catalog

Shared Android + Web design system for Stella Founds. No business logic lives
here — components take data and callbacks via props; the consuming app owns
routes, finance rules, and API calls. See `../../packages/stella-ui/src/index.ts`
for the full export list.

## Tokens

`src/tokens/` is the single source of design tokens (colors, spacing, radius,
typography, elevation, shadows, glass, motion, breakpoints, constellation
geometry, z-index). `src/tokens/tokens.css` mirrors them as CSS custom
properties and must be imported once per app (already wired into both
`apps/android` and `apps/web`). `stellaTheme` (from `theme/index.ts`) bundles
every token group into one object for consumers who prefer
`stellaTheme.colors.text.primary` over named imports.

## Components

### StellaButton
Objetivo: botão de ação genérico (texto).
Props: `variant?: 'primary' | 'ghost' | 'danger' | 'chip'`, `active?: boolean`, plus all native `<button>` props (`disabled`, `onClick`, `className`, ...).
Exemplo: `<StellaButton variant="primary" onClick={save}>Salvar</StellaButton>`

### StellaIconButton
Objetivo: botão circular somente-ícone, com `aria-label` obrigatório.
Props: `icon: ReactNode`, `label: string`, `active?: boolean`, plus native `<button>` props.
Exemplo: `<StellaIconButton icon={<CloseIcon />} label="Fechar" onClick={close} />`

### StellaCard / StellaGlassCard
Objetivo: contêiner de conteúdo com o tratamento visual Stella (borda sutil, glow no canto). `StellaGlassCard` troca a superfície por vidro translúcido mais forte.
Props: `interactive?: boolean` (hover state), `as?: ElementType`, plus native element props.
Exemplo: `<StellaCard interactive>{children}</StellaCard>`

### StellaInput / StellaSelect
Objetivo: campos de formulário com o estilo Stella (usa a mesma classe `.stella-input`).
Props: todos os atributos nativos de `<input>` / `<select>`.
Exemplo: `<StellaInput type="text" value={title} onChange={onChange} />`

### Modal / StellaBottomSheet
Objetivo: overlays modais. `Modal` é centrado/ancorado ao rodapé com título obrigatório; `StellaBottomSheet` é uma folha inferior mais leve com título opcional e um "handle" visual. Ambos fecham com ESC (via `useDismissableOverlay`) e ao clicar no backdrop.
Props: `title` (obrigatório em Modal, opcional em BottomSheet), `onClose: () => void`, `children`.
Exemplo: `<StellaBottomSheet onClose={close}>{children}</StellaBottomSheet>`

### StellaBadge / StellaStatusPill
Objetivo: rótulos curtos. `StellaBadge` é genérico (`tone`); `StellaStatusPill` é especializado para `FinanceStatus` (tipo vindo de `@stella-founds/core`, sem lógica de negócio — só mapeia status → label/tom).
Props: `StellaBadge`: `tone?: 'neutral' | 'success' | 'warning' | 'danger' | 'info'`. `StellaStatusPill`: `status: FinanceStatus`.

### StellaSectionHeader (alias StellaPageHeader) / ScreenShell (alias StellaPageContainer)
Objetivo: cabeçalho de seção com título e ação opcional; contêiner de tela com padding/max-width consistentes. Os aliases existem apenas para bater com a nomenclatura do Design System — é a mesma implementação, sem duplicar CSS.
Props: `title: string`, `action?: ReactNode` (ScreenShell), `children`.

### StellaEmptyState
Objetivo: estado vazio ilustrado com glifo de constelação.
Props: `title: string`, `message: string`.

### StellaConstellationDivider
Objetivo: divisor decorativo em forma de constelação entre seções.
Props: nenhuma.

### StellaListItem
Objetivo: linha de lista genérica (leading/título/subtítulo/trailing), reutilizável por qualquer tela de lista futura. Ainda não usada por `EntryListCard` (que mantém sua marcação própria) para não migrar toda a interface de uma vez.
Props: `leading?: ReactNode`, `title: ReactNode`, `subtitle?: ReactNode`, `trailing?: ReactNode`.

## Cards

### StellaAmountCard
Objetivo: card de valor monetário com tom semântico.
Props: `label: string`, `value: ReactNode`, `detail?: ReactNode`, `tone?: 'neutral' | 'success' | 'warning' | 'danger'`.

### EntryListCard
Objetivo: card com lista de lançamentos financeiros e estado vazio embutido.
Props: `title`, `entries: FinanceEntry[]`, `emptyTitle`, `emptyMessage`, `referenceIso`.

## Navigation

### StellaBottomNavigation
Objetivo: casca genérica de navegação inferior com 5 colunas (2 + slot central + 2), safe-area e estado ativo via `react-router-dom`. A tabela de rotas/labels/ícones é responsabilidade do app, não do design system.
Props: `items: StellaNavItem[]` (`{ id, to, label, icon, end? }`), `centerSlot?: ReactNode`, `ariaLabel?: string`.
Exemplo: `<StellaBottomNavigation items={bottomNavItems} />`

## Stella Core

### StellaCore
Objetivo: menu radial "Stella Core" (botão central com ações em constelação). Não conhece rotas nem regras financeiras — recebe as ações prontas.
Props: `actions: StellaAction[]`, `activeContext?: unknown` (ex.: pathname atual — força o fechamento ao mudar), `reducedMotion?: boolean` (padrão: preferência do sistema).
Contrato `StellaAction`: `{ id, label, icon?, execute: () => void, disabled?, animationOrder? }`.
Preserva: primeiro toque abre, segundo fecha, tocar fora fecha, ESC fecha, botão "voltar" fecha, animação processual com constelação assimétrica, respeita `prefers-reduced-motion`.

### useStellaCore
Objetivo: hook com a máquina de estados (closed/opening/open/closing) usada internamente pelo `StellaCore`. Exportado para reuso caso um outro shell precise do mesmo comportamento de abrir/fechar.

### StellaCoreConstellation (alias de ConstellationLines) / stellaLayout
Objetivo: desenho procedural das linhas/nós da constelação e o cálculo geométrico de posição de cada ação (`getStellaConstellationLayouts`).

## Parallax

### StellaParallaxBackground
Objetivo: fundo com estrelas e paralaxe sutil ao ponteiro/giroscópio.

## Motion

`src/motion/primitives.ts` expõe `fade`, `scale`, `slide` e `constellationDraw` —
helpers finos sobre a Web Animations API usando os tokens de duração/easing.
Preparados para telas futuras (Web Fase 2); as animações já existentes do
Stella Core e da navegação continuam em CSS `@keyframes` e não foram
reescritas para não arriscar mudança de comportamento.

## Ícones

`src/icons/NavIcons.tsx` (TodayIcon, BillsIcon, CalendarIcon, ReportsIcon,
StellaCoreIcon) e `src/icons/typeIcons.ts` (emoji por `FinanceEntryType`).
`src/assets/{icons,constellations,decorations}/` estão preparados para
receber assets estáticos compartilhados no futuro — vazios por enquanto,
pois os elementos visuais atuais são gerados via código, não arquivos.

## Hooks

- `usePrefersReducedMotion()` — observa `prefers-reduced-motion`.
- `useDismissableOverlay(onClose)` — fecha um overlay com ESC; usado por `Modal` e `StellaBottomSheet`.
