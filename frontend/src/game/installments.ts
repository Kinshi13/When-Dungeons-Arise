import type { Expense } from "../api";
import { addMonths } from "./recurrence";

// Divide um gasto alto em N parcelas mensais, distribuindo os centavos da
// divisão nas primeiras parcelas para que a soma bata certinho com o valor total.
export function buildInstallmentExpenses(
  data: { amount: number; description?: string; date: string; superficial?: boolean },
  installmentTotal: number,
  createId: () => string
): Expense[] {
  const totalCents = Math.round(data.amount * 100);
  const baseCents = Math.floor(totalCents / installmentTotal);
  const remainderCents = totalCents - baseCents * installmentTotal;
  const groupId = createId();

  return Array.from({ length: installmentTotal }, (_, i) => {
    const cents = baseCents + (i < remainderCents ? 1 : 0);
    return {
      id: i === 0 ? groupId : createId(),
      amount: cents / 100,
      description: data.description,
      date: addMonths(data.date, i),
      installmentGroupId: groupId,
      installmentIndex: i + 1,
      installmentTotal,
      superficial: data.superficial,
    };
  });
}
