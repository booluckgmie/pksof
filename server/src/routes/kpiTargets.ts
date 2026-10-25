import { Router } from "express";
import { query } from "../db.js";
import { requireAuth } from "../middleware/auth.js";

export const kpiTargetsRouter = Router();

/** Mirrors src/lib/api/kpiTargets.ts exactly. */
kpiTargetsRouter.get("/", async (_req, res) => {
  const rows = await query("SELECT * FROM kpi_fy_targets");
  res.json(rows);
});

kpiTargetsRouter.put("/", requireAuth, async (req, res) => {
  const { kpiId, fy, fyTarget, updatedBy } = req.body as { kpiId: string; fy: string; fyTarget: number; updatedBy: string };
  await query(
    `INSERT INTO kpi_fy_targets (kpi_id, fy, fy_target, updated_by)
     VALUES (?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE fy_target = VALUES(fy_target), updated_by = VALUES(updated_by), updated_at = CURRENT_TIMESTAMP`,
    [kpiId, fy, fyTarget, updatedBy]
  );
  res.json({ ok: true });
});
