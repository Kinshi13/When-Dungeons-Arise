import { generateId, todayIso, type FinanceCategory, type FinanceEntry, type FinanceNucleus } from '@stella-founds/core';

function isoDaysFromNow(days: number): string {
  const date = new Date(todayIso());
  date.setDate(date.getDate() + days);
  return date.toISOString();
}

export const fakeCategories: FinanceCategory[] = [
  { id: 'cat-alimentacao', name: 'Alimentação', icon: '🍽️', colorToken: 'accent.stella' },
  { id: 'cat-moradia', name: 'Moradia', icon: '🏠', colorToken: 'accent.gold' },
  { id: 'cat-assinaturas', name: 'Assinaturas', icon: '⭐', colorToken: 'accent.stella' },
];

export const fakeNuclei: FinanceNucleus[] = [
  { id: 'nucleus-casa', name: 'Casa', description: null, icon: '🏠', colorToken: 'accent.gold' },
  { id: 'nucleus-projetos', name: 'Projetos', description: null, icon: '🚀', colorToken: 'accent.lavender' },
];

function entry(partial: Omit<Partial<FinanceEntry>, 'id'> & Pick<FinanceEntry, 'title' | 'amount' | 'type' | 'status'>): FinanceEntry {
  const now = todayIso();
  return {
    id: generateId(),
    categoryId: null,
    nucleusId: null,
    dueDate: null,
    paidAt: null,
    receivedAt: null,
    createdAt: now,
    updatedAt: now,
    notes: null,
    recurrenceRuleId: null,
    ...partial,
  };
}

export const fakeFinanceEntries: FinanceEntry[] = [
  entry({
    title: 'Almoço',
    amount: 38.5,
    type: 'expense',
    status: 'paid',
    categoryId: 'cat-alimentacao',
    paidAt: todayIso(),
  }),
  entry({
    title: 'Internet',
    amount: 129.9,
    type: 'bill',
    status: 'pending',
    categoryId: 'cat-moradia',
    nucleusId: 'nucleus-casa',
    dueDate: isoDaysFromNow(3),
  }),
  entry({
    title: 'Streaming de vídeo',
    amount: 44.9,
    type: 'subscription',
    status: 'pending',
    categoryId: 'cat-assinaturas',
    dueDate: isoDaysFromNow(9),
  }),
  entry({
    title: 'Projeto freelance',
    amount: 1800,
    type: 'income',
    status: 'pending',
    nucleusId: 'nucleus-projetos',
    dueDate: isoDaysFromNow(14),
  }),
  entry({
    title: 'Aluguel',
    amount: 1450,
    type: 'bill',
    status: 'pending',
    categoryId: 'cat-moradia',
    nucleusId: 'nucleus-casa',
    dueDate: isoDaysFromNow(5),
  }),
];
