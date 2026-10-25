import { Router } from "express";
import { query } from "../db.js";
import { requireAuth } from "../middleware/auth.js";

export const detailsRouter = Router();

/** Mirrors src/lib/api/details.ts exactly. No pagination logic needed here the way the Supabase
 * version had — that 1000-row cap was a PostgREST default, not a real constraint; a plain SQL
 * SELECT has no such limit. Public read, same as today. */
detailsRouter.get("/metrics", async (_req, res) => {
  const rows = await query("SELECT * FROM detail_metrics");
  res.json(rows);
});

detailsRouter.get("/records", async (_req, res) => {
  const rows = await query("SELECT * FROM detail_records ORDER BY id ASC");
  res.json(rows);
});

detailsRouter.put("/metrics", requireAuth, async (req, res) => {
  const { entityId, periodId, metricKey, dimension, dimension2, value, note } = req.body as {
    entityId: string; periodId: string; metricKey: string; dimension: string; dimension2?: string; value: number | null; note?: string | null;
  };
  await query(
    `INSERT INTO detail_metrics (entity_id, period_id, metric_key, dimension, dimension2, value, note)
     VALUES (?, ?, ?, ?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE value = VALUES(value), note = VALUES(note), updated_at = CURRENT_TIMESTAMP`,
    [entityId, periodId, metricKey, dimension, dimension2 ?? "", value, note ?? null]
  );
  res.json({ ok: true });
});

detailsRouter.put("/records", requireAuth, async (req, res) => {
  const { id, entityId, periodId, recordType, label, category, valueNum, valueNum2, textNote, flag } = req.body as {
    id: string; entityId: string; periodId: string; recordType: string; label: string; category?: string | null;
    valueNum?: number | null; valueNum2?: number | null; textNote?: string | null; flag?: boolean | null;
  };
  await query(
    `INSERT INTO detail_records (id, entity_id, period_id, record_type, label, category, value_num, value_num2, text_note, flag)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE value_num = VALUES(value_num), value_num2 = VALUES(value_num2), text_note = VALUES(text_note), flag = VALUES(flag), updated_at = CURRENT_TIMESTAMP`,
    [id, entityId, periodId, recordType, label, category ?? null, valueNum ?? null, valueNum2 ?? null, textNote ?? null, flag ?? null]
  );
  res.json({ ok: true });
});

detailsRouter.delete("/records/:id", requireAuth, async (req, res) => {
  await query("DELETE FROM detail_records WHERE id = ?", [req.params.id]);
  res.json({ ok: true });
});
