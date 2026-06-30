import { Router } from "express";
import { prisma } from "../prisma";
import { createBillSchema, updateBillSchema } from "../schemas";

export const billsRouter = Router();

billsRouter.get("/", async (_req, res) => {
  const bills = await prisma.bill.findMany({
    orderBy: [{ paid: "asc" }, { dueDate: "asc" }],
  });
  res.json(bills);
});

billsRouter.post("/", async (req, res) => {
  const parsed = createBillSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }
  const bill = await prisma.bill.create({ data: parsed.data });
  res.status(201).json(bill);
});

billsRouter.put("/:id", async (req, res) => {
  const parsed = updateBillSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }
  try {
    const bill = await prisma.bill.update({
      where: { id: req.params.id },
      data: parsed.data,
    });
    res.json(bill);
  } catch {
    res.status(404).json({ error: "Conta não encontrada" });
  }
});

billsRouter.delete("/:id", async (req, res) => {
  try {
    await prisma.bill.delete({ where: { id: req.params.id } });
    res.status(204).send();
  } catch {
    res.status(404).json({ error: "Conta não encontrada" });
  }
});
