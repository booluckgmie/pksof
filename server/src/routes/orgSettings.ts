import { Router } from "express";
import { query } from "../db.js";
import { requireAuth } from "../middleware/auth.js";

export const orgSettingsRouter = Router();

/** Mirrors src/lib/api/orgSettings.ts exactly — single row, id=1. */
orgSettingsRouter.get("/", async (_req, res) => {
  const rows = await query<{ fiscal_year_end_month: number }>("SELECT fiscal_year_end_month FROM org_settings WHERE id = 1");
  res.json(rows[0] ?? { fiscal_year_end_month: 11 });
});

orgSettingsRouter.put("/", requireAuth, async (req, res) => {
  const { fiscalYearEndMonth, updatedBy } = req.body as { fiscalYearEndMonth: number; updatedBy: string };
  await query("UPDATE org_settings SET fiscal_year_end_month = ?, updated_by = ? WHERE id = 1", [fiscalYearEndMonth, updatedBy]);
  res.json({ ok: true });
});
