import { Router } from "express";
import { execute, query } from "../db.js";
import { requireAuth } from "../middleware/auth.js";

export const detailSubmissionsRouter = Router();

/** Mirrors src/lib/api/detailSubmissions.ts exactly. */
detailSubmissionsRouter.get("/", async (_req, res) => {
  const rows = await query("SELECT * FROM detail_submissions ORDER BY submitted_at DESC");
  res.json(rows);
});

detailSubmissionsRouter.post("/", requireAuth, async (req, res) => {
  const b = req.body as Record<string, unknown>;
  await query(
    `INSERT INTO detail_submissions
      (id, dest, module, entity_id, period_id, metric_key, dimension, dimension2, record_id, record_type, label, category,
       value_num, value_num2, text_note, note, source, submitted_by, status, reviewed_by, reviewed_at, review_note)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      b.id, b.dest, b.module, b.entityId, b.periodId,
      b.metricKey ?? null, b.dimension ?? null, b.dimension2 ?? null,
      b.recordId ?? null, b.recordType ?? null, b.label ?? null, b.category ?? null,
      b.valueNum ?? null, b.valueNum2 ?? null, b.textNote ?? null, b.note ?? null,
      b.source, b.submittedBy, b.status ?? "submitted", b.reviewedBy ?? null, b.reviewedAt ?? null, b.reviewNote ?? null,
    ]
  );
  res.json({ ok: true });
});

/** Replaces RLS's "update detail_submissions from submitted" (migration 0016) — same
 * insert-only-as-submitted / update-only-while-submitted state machine as `submissions`.
 * Does NOT also write detail_metrics/detail_records — see src/lib/workflow.tsx's
 * writeApprovedDetail, which calls `PUT /api/details/metrics` or `/records` as its own next
 * statement, same two-step pattern as the KPI submissions queue (see submissions.ts's comment). */
detailSubmissionsRouter.post("/:id/review", requireAuth, async (req, res) => {
  const { status, reviewedBy, reviewNote } = req.body as { status: "published" | "rejected"; reviewedBy: string; reviewNote?: string };
  const result = await execute(
    "UPDATE detail_submissions SET status = ?, reviewed_by = ?, reviewed_at = NOW(), review_note = ? WHERE id = ? AND status = 'submitted'",
    [status, reviewedBy, reviewNote ?? null, req.params.id]
  );
  if (result.affectedRows === 0) return res.status(409).json({ error: "This submission is no longer pending." });
  res.json({ ok: true });
});
