import { Router } from "express";
import { prisma } from "../prisma";
import {
  createPlanSchema,
  updatePlanSchema,
  createPlanStepSchema,
  updatePlanStepSchema,
} from "../schemas";

export const plansRouter = Router();

plansRouter.get("/", async (_req, res) => {
  const plans = await prisma.plan.findMany({
    include: { steps: { orderBy: { order: "asc" } } },
    orderBy: { createdAt: "desc" },
  });
  res.json(plans);
});

plansRouter.get("/:id", async (req, res) => {
  const plan = await prisma.plan.findUnique({
    where: { id: req.params.id },
    include: { steps: { orderBy: { order: "asc" } } },
  });
  if (!plan) return res.status(404).json({ error: "Planejamento não encontrado" });
  res.json(plan);
});

plansRouter.post("/", async (req, res) => {
  const parsed = createPlanSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }
  const { steps, ...planData } = parsed.data;
  const plan = await prisma.plan.create({
    data: {
      ...planData,
      steps: steps
        ? {
            create: steps.map((s, i) => ({
              title: s.title,
              dateTime: s.dateTime,
              order: s.order ?? i,
            })),
          }
        : undefined,
    },
    include: { steps: true },
  });
  res.status(201).json(plan);
});

plansRouter.put("/:id", async (req, res) => {
  const parsed = updatePlanSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }
  try {
    const plan = await prisma.plan.update({
      where: { id: req.params.id },
      data: parsed.data,
      include: { steps: true },
    });
    res.json(plan);
  } catch {
    res.status(404).json({ error: "Planejamento não encontrado" });
  }
});

plansRouter.delete("/:id", async (req, res) => {
  try {
    await prisma.plan.delete({ where: { id: req.params.id } });
    res.status(204).send();
  } catch {
    res.status(404).json({ error: "Planejamento não encontrado" });
  }
});

// Passos do planejamento

plansRouter.post("/:planId/steps", async (req, res) => {
  const parsed = createPlanStepSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }
  try {
    const step = await prisma.planStep.create({
      data: { ...parsed.data, planId: req.params.planId },
    });
    res.status(201).json(step);
  } catch {
    res.status(404).json({ error: "Planejamento não encontrado" });
  }
});

plansRouter.put("/:planId/steps/:stepId", async (req, res) => {
  const parsed = updatePlanStepSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }
  try {
    const step = await prisma.planStep.update({
      where: { id: req.params.stepId },
      data: parsed.data,
    });
    res.json(step);
  } catch {
    res.status(404).json({ error: "Passo não encontrado" });
  }
});

plansRouter.delete("/:planId/steps/:stepId", async (req, res) => {
  try {
    await prisma.planStep.delete({ where: { id: req.params.stepId } });
    res.status(204).send();
  } catch {
    res.status(404).json({ error: "Passo não encontrado" });
  }
});

// Gera um lembrete a partir de um passo do planejamento
plansRouter.post("/:planId/steps/:stepId/generate-reminder", async (req, res) => {
  const step = await prisma.planStep.findUnique({ where: { id: req.params.stepId } });
  if (!step || step.planId !== req.params.planId) {
    return res.status(404).json({ error: "Passo não encontrado" });
  }
  if (!step.dateTime) {
    return res.status(400).json({ error: "O passo precisa de uma data/hora para virar lembrete" });
  }
  if (step.reminderId) {
    return res.status(409).json({ error: "Este passo já possui um lembrete vinculado" });
  }
  const reminder = await prisma.reminder.create({
    data: {
      title: step.title,
      dateTime: step.dateTime,
      type: "TAREFA",
      planId: step.planId,
    },
  });
  const updatedStep = await prisma.planStep.update({
    where: { id: step.id },
    data: { reminderId: reminder.id },
  });
  res.status(201).json({ reminder, step: updatedStep });
});
