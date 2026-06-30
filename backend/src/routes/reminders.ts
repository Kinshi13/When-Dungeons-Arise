import { Router } from "express";
import { prisma } from "../prisma";
import { createReminderSchema, updateReminderSchema } from "../schemas";

export const remindersRouter = Router();

remindersRouter.get("/", async (_req, res) => {
  const reminders = await prisma.reminder.findMany({
    orderBy: { dateTime: "asc" },
  });
  res.json(reminders);
});

remindersRouter.get("/:id", async (req, res) => {
  const reminder = await prisma.reminder.findUnique({
    where: { id: req.params.id },
  });
  if (!reminder) return res.status(404).json({ error: "Lembrete não encontrado" });
  res.json(reminder);
});

remindersRouter.post("/", async (req, res) => {
  const parsed = createReminderSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }
  const reminder = await prisma.reminder.create({ data: parsed.data });
  res.status(201).json(reminder);
});

remindersRouter.put("/:id", async (req, res) => {
  const parsed = updateReminderSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }
  try {
    const reminder = await prisma.reminder.update({
      where: { id: req.params.id },
      data: parsed.data,
    });
    res.json(reminder);
  } catch {
    res.status(404).json({ error: "Lembrete não encontrado" });
  }
});

remindersRouter.delete("/:id", async (req, res) => {
  try {
    await prisma.reminder.delete({ where: { id: req.params.id } });
    res.status(204).send();
  } catch {
    res.status(404).json({ error: "Lembrete não encontrado" });
  }
});
