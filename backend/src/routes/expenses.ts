import { Router } from "express";
import { prisma } from "../prisma";
import { createExpenseSchema } from "../schemas";

export const expensesRouter = Router();

expensesRouter.get("/", async (req, res) => {
  const { from, to } = req.query as { from?: string; to?: string };
  const expenses = await prisma.expense.findMany({
    where: {
      date: {
        gte: from ? new Date(from) : undefined,
        lte: to ? new Date(to) : undefined,
      },
    },
    orderBy: { date: "desc" },
  });
  res.json(expenses);
});

expensesRouter.post("/", async (req, res) => {
  const parsed = createExpenseSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }
  const expense = await prisma.expense.create({ data: parsed.data });
  res.status(201).json(expense);
});

expensesRouter.delete("/:id", async (req, res) => {
  try {
    await prisma.expense.delete({ where: { id: req.params.id } });
    res.status(204).send();
  } catch {
    res.status(404).json({ error: "Gasto não encontrado" });
  }
});
