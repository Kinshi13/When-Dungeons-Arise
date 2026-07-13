import { useEffect, useState } from 'react';
import { useAppContainer } from '../../core/AppContainerContext';
import type { FinanceCategory, FinanceNucleus } from '../../core/models';
import { generateId } from '../../core/utils/id';
import { Modal } from '../../ui/components/Modal';
import { FinanceEntryForm, type FinanceEntryFormValues } from '../../ui/forms/FinanceEntryForm';
import { useFinanceDialog } from './FinanceDialogContext';

const typeTitles: Record<string, string> = {
  expense: 'Adicionar gasto',
  bill: 'Nova conta',
  income: 'Valor a receber',
  subscription: 'Nova assinatura',
};

export function FinanceEntryDialog() {
  const { state, close } = useFinanceDialog();
  const {
    financeService,
    financeCategoryRepository,
    financeNucleusRepository,
    recurringRuleRepository,
    recurrenceService,
  } = useAppContainer();
  const [categories, setCategories] = useState<FinanceCategory[]>([]);
  const [nuclei, setNuclei] = useState<FinanceNucleus[]>([]);

  useEffect(() => {
    if (!state.open) return;
    financeCategoryRepository.list().then(setCategories);
    financeNucleusRepository.list().then(setNuclei);
  }, [state.open, financeCategoryRepository, financeNucleusRepository]);

  if (!state.open) return null;

  async function handleSubmit(values: FinanceEntryFormValues) {
    if (state.entry) {
      await financeService.updateEntry(state.entry.id, values);
      close();
      return;
    }

    if (values.recurring && values.dueDate) {
      const rule = {
        id: generateId(),
        title: values.title,
        amount: values.amount,
        type: values.type,
        categoryId: values.categoryId,
        nucleusId: values.nucleusId,
        frequency: 'monthly' as const,
        interval: 1,
        dueDay: new Date(values.dueDate).getDate(),
        startDate: values.dueDate,
        endDate: null,
        reminderDaysBefore: 3,
        autoGenerate: true,
        active: true,
      };
      await recurringRuleRepository.save(rule);
      await recurrenceService.generateForRule(rule.id);
      close();
      return;
    }

    await financeService.createEntry({ ...values, recurrenceRuleId: null });
    close();
  }

  return (
    <Modal title={state.entry ? 'Editar lançamento' : typeTitles[state.initialType]} onClose={close}>
      <FinanceEntryForm
        initialType={state.initialType}
        entry={state.entry}
        categories={categories}
        nuclei={nuclei}
        onSubmit={handleSubmit}
        onCancel={close}
      />
    </Modal>
  );
}
