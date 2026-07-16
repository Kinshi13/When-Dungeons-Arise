import { useState, type FormEvent } from 'react';
import { validateFinanceEntryInput, type FinanceCategory, type FinanceEntry, type FinanceEntryType, type FinanceNucleus } from '@stella-founds/core';
import { StellaButton } from '../components/StellaButton';
import { StellaIconButton } from '../components/StellaIconButton';
import './FinanceEntryForm.css';

export interface FinanceEntryFormValues {
  title: string;
  amount: number;
  type: FinanceEntryType;
  categoryId: string | null;
  nucleusId: string | null;
  dueDate: string | null;
  notes: string | null;
  recurring: boolean;
}

const typeLabels: Record<FinanceEntryType, string> = {
  expense: 'Gasto',
  bill: 'Conta',
  income: 'Valor a receber',
  subscription: 'Assinatura',
};

function toDateInputValue(iso: string | null): string {
  return iso ? iso.slice(0, 10) : '';
}

export function FinanceEntryForm({
  initialType,
  entry,
  categories,
  nuclei,
  onSubmit,
  onCancel,
  onOpenCalculator,
}: {
  initialType: FinanceEntryType;
  entry?: FinanceEntry;
  categories: FinanceCategory[];
  nuclei: FinanceNucleus[];
  onSubmit: (values: FinanceEntryFormValues) => void;
  onCancel: () => void;
  /** Optional — when provided (Web only), a small calculator trigger appears next to "Valor". The form never imports or knows about the calculator itself, only this callback contract. */
  onOpenCalculator?: (useValue: (value: number) => void) => void;
}) {
  const [type, setType] = useState<FinanceEntryType>(entry?.type ?? initialType);
  const [title, setTitle] = useState(entry?.title ?? '');
  const [amount, setAmount] = useState(entry ? String(entry.amount) : '');
  const [categoryId, setCategoryId] = useState(entry?.categoryId ?? '');
  const [nucleusId, setNucleusId] = useState(entry?.nucleusId ?? '');
  const [dueDate, setDueDate] = useState(toDateInputValue(entry?.dueDate ?? null));
  const [notes, setNotes] = useState(entry?.notes ?? '');
  const [recurring, setRecurring] = useState(!!entry?.recurrenceRuleId);
  const [errors, setErrors] = useState<string[]>([]);

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const parsedAmount = Number(amount.replace(',', '.'));
    const dueDateIso = dueDate ? new Date(`${dueDate}T00:00:00`).toISOString() : null;
    const validationErrors = validateFinanceEntryInput({ title, amount: parsedAmount, dueDate: dueDateIso });
    if (validationErrors.length > 0) {
      setErrors(validationErrors);
      return;
    }
    setErrors([]);
    onSubmit({
      title: title.trim(),
      amount: parsedAmount,
      type,
      categoryId: categoryId || null,
      nucleusId: nucleusId || null,
      dueDate: dueDateIso,
      notes: notes.trim() || null,
      recurring,
    });
  }

  return (
    <form className="finance-entry-form" onSubmit={handleSubmit}>
      {errors.length > 0 && (
        <div className="finance-entry-form__errors" role="alert" aria-live="assertive">
          {errors.map((error) => (
            <p key={error}>{error}</p>
          ))}
        </div>
      )}

      <label className="finance-entry-form__field">
        <span>Tipo</span>
        <select
          className="stella-input"
          value={type}
          onChange={(event) => setType(event.target.value as FinanceEntryType)}
        >
          {Object.entries(typeLabels).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </label>

      <label className="finance-entry-form__field">
        <span>Título</span>
        <input
          className="stella-input"
          type="text"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="Ex: Internet, Almoço, Netflix"
          required
        />
      </label>

      <label className="finance-entry-form__field">
        <span>Valor</span>
        <span className="finance-entry-form__amount-row">
          <input
            className="stella-input"
            type="text"
            inputMode="decimal"
            value={amount}
            onChange={(event) => setAmount(event.target.value)}
            placeholder="0,00"
            required
          />
          {onOpenCalculator && (
            <StellaIconButton
              icon="🖩"
              label="Abrir calculadora"
              onClick={() => onOpenCalculator((value) => setAmount(String(value)))}
            />
          )}
        </span>
      </label>

      <label className="finance-entry-form__field">
        <span>Categoria</span>
        <select className="stella-input" value={categoryId} onChange={(event) => setCategoryId(event.target.value)}>
          <option value="">Nenhuma</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.icon} {category.name}
            </option>
          ))}
        </select>
      </label>

      <label className="finance-entry-form__field">
        <span>Núcleo</span>
        <select className="stella-input" value={nucleusId} onChange={(event) => setNucleusId(event.target.value)}>
          <option value="">Nenhum</option>
          {nuclei.map((nucleus) => (
            <option key={nucleus.id} value={nucleus.id}>
              {nucleus.icon} {nucleus.name}
            </option>
          ))}
        </select>
      </label>

      <label className="finance-entry-form__field">
        <span>Vencimento</span>
        <input className="stella-input" type="date" value={dueDate} onChange={(event) => setDueDate(event.target.value)} />
      </label>

      <label className="finance-entry-form__field">
        <span>Observação</span>
        <textarea
          className="stella-input"
          value={notes}
          onChange={(event) => setNotes(event.target.value)}
          rows={2}
          placeholder="Opcional"
        />
      </label>

      {type !== 'expense' && !entry && (
        <label className="finance-entry-form__checkbox">
          <input
            type="checkbox"
            checked={recurring}
            onChange={(event) => setRecurring(event.target.checked)}
            disabled={!dueDate}
          />
          <span>Repetir mensalmente{!dueDate && ' (defina um vencimento)'}</span>
        </label>
      )}

      <div className="finance-entry-form__actions">
        <StellaButton type="button" onClick={onCancel}>
          Cancelar
        </StellaButton>
        <StellaButton type="submit" variant="primary">
          Salvar
        </StellaButton>
      </div>
    </form>
  );
}
