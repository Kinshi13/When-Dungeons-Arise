import type { FinanceEntryType } from '@stella-founds/core';

export interface StellaCoreActionConfig {
  id: string;
  label: string;
}

/** Real (non-placeholder) finance actions, available on Hoje and Contas — same shape as Android's per-route config. */
const financeActionsByRoute: Record<string, StellaCoreActionConfig[]> = {
  '/': [
    { id: 'new-bill', label: 'Nova conta' },
    { id: 'new-subscription', label: 'Nova assinatura' },
    { id: 'new-income', label: 'Recebimento' },
    { id: 'mark-paid', label: 'Marcar pagamento' },
    { id: 'calculator', label: 'Calculadora' },
  ],
  '/contas': [
    { id: 'new-bill', label: 'Nova conta' },
    { id: 'new-subscription', label: 'Nova assinatura' },
    { id: 'new-income', label: 'Recebimento' },
    { id: 'mark-paid', label: 'Marcar pagamento' },
    { id: 'calculator', label: 'Calculadora' },
  ],
};

/** Other routes aren't implemented yet this phase — same 4 placeholders as Web Fase 2, calculator still real (harmless, generic). */
const placeholderActions: StellaCoreActionConfig[] = [
  { id: 'new-bill', label: 'Nova conta' },
  { id: 'new-subscription', label: 'Nova assinatura' },
  { id: 'new-income', label: 'Recebimento' },
  { id: 'calculator', label: 'Calculadora' },
];

export function getStellaCoreActionsForRoute(pathname: string): StellaCoreActionConfig[] {
  return financeActionsByRoute[pathname] ?? placeholderActions;
}

export function hasRealFinanceActions(pathname: string): boolean {
  return pathname in financeActionsByRoute;
}

export const actionToEntryType: Partial<Record<string, FinanceEntryType>> = {
  'new-bill': 'bill',
  'new-subscription': 'subscription',
  'new-income': 'income',
};
