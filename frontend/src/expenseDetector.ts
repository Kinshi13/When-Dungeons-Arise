export interface DetectedExpense {
  amount: number;
  matchText: string;
}

// Reconhece valores em reais no formato comum de notificação de banco/cartão:
// "R$ 1.234,56", "R$45,00", "R$ 9.90" etc. Para no primeiro valor válido — não
// tenta cobrir todo formato monetário existente.
const CURRENCY_REGEX = /R\$\s?(\d{1,3}(?:\.\d{3})*,\d{2}|\d+,\d{2}|\d+\.\d{2})/;

// Palavras que aparecem em notificações de compra/gasto real (aprovação de
// cartão, débito, PIX enviado) — evita marcar como gasto uma notificação que
// só menciona um valor por outro motivo (ex.: saldo em conta, cashback recebido).
const PURCHASE_HINTS = /compra|pagamento|débito|debito|fatura|cart[aã]o|pix enviado|transferência enviada|transferencia enviada/i;

export function findExpenseMention(text: string): DetectedExpense | null {
  const match = text.match(CURRENCY_REGEX);
  if (!match) return null;
  if (!PURCHASE_HINTS.test(text)) return null;

  const raw = match[1];
  const normalized = raw.includes(",") ? raw.replace(/\./g, "").replace(",", ".") : raw;
  const amount = parseFloat(normalized);
  if (Number.isNaN(amount) || amount <= 0) return null;

  return { amount, matchText: match[0] };
}
