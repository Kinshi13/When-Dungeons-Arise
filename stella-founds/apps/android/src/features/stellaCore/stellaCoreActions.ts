import type { FinanceEntryType } from '@stella-founds/core';

export interface StellaCoreActionConfig {
  id: string;
  label: string;
}

export const stellaCoreActionsByRoute: Record<string, StellaCoreActionConfig[]> = {
  '/': [
    { id: 'add-expense', label: 'Adicionar gasto' },
    { id: 'new-bill', label: 'Nova conta' },
    { id: 'new-subscription', label: 'Nova assinatura' },
    { id: 'add-income', label: 'Valor a receber' },
    { id: 'calculator', label: 'Calculadora' },
  ],
  '/contas': [
    { id: 'new-bill', label: 'Nova conta' },
    { id: 'new-subscription', label: 'Nova assinatura' },
    { id: 'add-income', label: 'Valor a receber' },
    { id: 'mark-paid', label: 'Marcar pagamento' },
    { id: 'calculator', label: 'Calculadora' },
  ],
  '/calendario': [
    { id: 'new-bill', label: 'Nova conta' },
    { id: 'new-income', label: 'Nova receita' },
    { id: 'go-today', label: 'Ir para hoje' },
    { id: 'filter-month', label: 'Filtrar mês' },
    { id: 'view-due', label: 'Ver vencimentos' },
  ],
  '/relatorios': [
    { id: 'filter-month', label: 'Filtrar mês' },
    { id: 'filter-nucleus', label: 'Filtrar núcleo' },
    { id: 'export-summary', label: 'Exportar resumo' },
    { id: 'view-subscriptions', label: 'Ver assinaturas' },
    { id: 'view-categories', label: 'Ver categorias' },
  ],
};

export function getStellaCoreActionsForRoute(pathname: string): StellaCoreActionConfig[] {
  return stellaCoreActionsByRoute[pathname] ?? stellaCoreActionsByRoute['/'];
}

export const actionToEntryType: Partial<Record<string, FinanceEntryType>> = {
  'add-expense': 'expense',
  'new-bill': 'bill',
  'new-subscription': 'subscription',
  'add-income': 'income',
  'new-income': 'income',
};
