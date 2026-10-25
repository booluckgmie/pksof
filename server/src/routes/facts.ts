import { Router } from "express";
import { query } from "../db.js";
import { requireAuth } from "../middleware/auth.js";

export const factsRouter = Router();

/** Mirrors src/lib/api/facts.ts exactly. Public read — dashboards browse without signing in. */
factsRouter.get("/", async (_req, res) => {
  const rows = await query("SELECT * FROM fact_kpi_results");
  res.json(rows);
});

/** Publishing a submission upserts the fact row it supersedes — same as upsertFactResult. */
factsRouter.put("/", requireAuth, async (req, res) => {
  const { kpiId, entityId, periodId, ytdActual, ytdTarget, status } = req.body as {
    kpiId: string; entityId: string; periodId: string; ytdActual: number; ytdTarget: number | null; status: string;
  };
  await query(
    `INSERT INTO fact_kpi_results (kpi_id, entity_id, period_id, ytd_actual, ytd_target, status)
     VALUES (?, ?, ?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE ytd_actual = VALUES(ytd_actual), ytd_target = VALUES(ytd_target), status = VALUES(status), updated_at = CURRENT_TIMESTAMP`,
    [kpiId, entityId, periodId, ytdActual, ytdTarget, status]
  );
  res.json({ ok: true });
});
