import type { FinanceCategoryRepository, FinanceNucleusRepository } from './repositories';

const defaultCategories = [
  { id: 'cat-alimentacao', name: 'Alimentação', icon: '🍽️', colorToken: 'accent.stella' },
  { id: 'cat-transporte', name: 'Transporte', icon: '🚗', colorToken: 'accent.lavender' },
  { id: 'cat-moradia', name: 'Moradia', icon: '🏠', colorToken: 'accent.gold' },
  { id: 'cat-assinaturas', name: 'Assinaturas', icon: '⭐', colorToken: 'accent.stella' },
  { id: 'cat-lazer', name: 'Lazer', icon: '🎮', colorToken: 'accent.lavender' },
  { id: 'cat-outros', name: 'Outros', icon: '✦', colorToken: 'text.secondary' },
];

const defaultNuclei = [
  { id: 'nucleus-casa', name: 'Casa', description: null, icon: '🏠', colorToken: 'accent.gold' },
  { id: 'nucleus-ia-dev', name: 'IA & Desenvolvimento', description: null, icon: '💻', colorToken: 'accent.stella' },
  { id: 'nucleus-conteudo', name: 'Conteúdo', description: null, icon: '🎬', colorToken: 'accent.lavender' },
  { id: 'nucleus-mobile', name: 'Mobile', description: null, icon: '📱', colorToken: 'accent.stella' },
  { id: 'nucleus-entretenimento', name: 'Entretenimento', description: null, icon: '🎮', colorToken: 'accent.lavender' },
  { id: 'nucleus-projetos', name: 'Projetos', description: null, icon: '🚀', colorToken: 'accent.gold' },
  { id: 'nucleus-igreja', name: 'Igreja/Voluntariado', description: null, icon: '🤝', colorToken: 'status.success' },
  { id: 'nucleus-outros', name: 'Outros', description: null, icon: '✦', colorToken: 'text.secondary' },
];

export async function seedDefaultsIfEmpty(
  categories: FinanceCategoryRepository,
  nuclei: FinanceNucleusRepository,
): Promise<void> {
  const [existingCategories, existingNuclei] = await Promise.all([categories.list(), nuclei.list()]);

  if (existingCategories.length === 0) {
    await Promise.all(defaultCategories.map((category) => categories.save(category)));
  }

  if (existingNuclei.length === 0) {
    await Promise.all(defaultNuclei.map((nucleus) => nuclei.save(nucleus)));
  }
}
