# Stella Founds

App financeiro pessoal com estética astral (Stella/Baka Studio). Projeto novo,
independente do app antigo neste repositório (`frontend/`), construído com
React + TypeScript + Vite, preparado para Android (Capacitor), PWA e Desktop.

## Rodando localmente

```bash
cd stella-founds
npm install
npm run dev
```

## Estrutura

- `src/core/` — modelos, services, repositories, storage (regra de negócio, sem UI)
- `src/features/` — telas por domínio (home, finance, bills, subscriptions, calendar, reports, settings)
- `src/ui/` — design system, componentes, navegação, Stella Core, parallax
- `src/assets/` — imagens e decoração visual

## Status

Fase 1 (fundação) concluída: design system, navegação principal, Stella Core
básico, storage local (IndexedDB), modelos financeiros, repositories e services.
