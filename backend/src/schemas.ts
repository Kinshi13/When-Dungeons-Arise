import { z } from "zod";

export const reminderTypeEnum = z.enum(["REUNIAO", "TAREFA", "OUTRO"]);

export const createReminderSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  dateTime: z.coerce.date(),
  type: reminderTypeEnum.default("OUTRO"),
  planId: z.string().optional(),
});

export const updateReminderSchema = createReminderSchema.partial();

export const createPlanSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  steps: z
    .array(
      z.object({
        title: z.string().min(1),
        dateTime: z.coerce.date().optional(),
        order: z.number().int().optional(),
      })
    )
    .optional(),
});

export const updatePlanSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().optional(),
});

export const createPlanStepSchema = z.object({
  title: z.string().min(1),
  dateTime: z.coerce.date().optional(),
  order: z.number().int().optional(),
});

export const updatePlanStepSchema = z.object({
  title: z.string().min(1).optional(),
  dateTime: z.coerce.date().optional().nullable(),
  done: z.boolean().optional(),
  order: z.number().int().optional(),
});

export const createExpenseSchema = z.object({
  amount: z.number().positive(),
  description: z.string().optional(),
  date: z.coerce.date().optional(),
});

export const billTypeEnum = z.enum(["CARTAO", "BOLETO", "ASSINATURA", "OUTRO"]);

export const createBillSchema = z.object({
  title: z.string().min(1),
  amount: z.number().positive(),
  dueDate: z.coerce.date(),
  type: billTypeEnum.default("OUTRO"),
  priority: z.boolean().optional(),
});

export const updateBillSchema = createBillSchema.partial().extend({
  paid: z.boolean().optional(),
});
