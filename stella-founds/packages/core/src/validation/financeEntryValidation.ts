export interface FinanceEntryValidationInput {
  title: string;
  amount: number;
  dueDate: string | null;
}

/**
 * Single source of truth for finance entry validation — both the Android
 * and Web forms call this instead of re-implementing their own checks, so
 * the rules can never drift between platforms.
 */
export function validateFinanceEntryInput(input: FinanceEntryValidationInput): string[] {
  const errors: string[] = [];

  if (!input.title.trim()) {
    errors.push('Informe um título.');
  }

  if (!Number.isFinite(input.amount) || input.amount <= 0) {
    errors.push('Informe um valor maior que zero.');
  }

  if (input.dueDate && Number.isNaN(new Date(input.dueDate).getTime())) {
    errors.push('Data de vencimento inválida.');
  }

  return errors;
}
