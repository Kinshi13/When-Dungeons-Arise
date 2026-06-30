import "dotenv/config";
import express from "express";
import cors from "cors";
import { remindersRouter } from "./routes/reminders";
import { plansRouter } from "./routes/plans";
import { expensesRouter } from "./routes/expenses";
import { billsRouter } from "./routes/bills";

const app = express();
app.use(cors());
app.use(express.json());

app.get("/api/health", (_req, res) => res.json({ ok: true }));

app.use("/api/reminders", remindersRouter);
app.use("/api/plans", plansRouter);
app.use("/api/expenses", expensesRouter);
app.use("/api/bills", billsRouter);

const PORT = process.env.PORT ? Number(process.env.PORT) : 4000;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`Backend rodando em http://localhost:${PORT}`);
});
