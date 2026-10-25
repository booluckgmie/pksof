import { Router } from "express";
import { execute, query } from "../db.js";
import { requireAuth } from "../middleware/auth.js";

export const submissionsRouter = Router();

/** Mirrors src/lib/api/submissions.ts exactly — public read (same as today's RLS). */
submissionsRouter.get("/", async (_req, res) => {
  const rows = await query("SELECT * FROM submissions ORDER BY submitted_at DESC");
  res.json(rows);
});

/** Replaces RLS's "insert submissions as submitted" check (migration 0002) — can only ever be
 * created pending, never pre-published. */
submissionsRouter.post("/", requireAuth, async (req, res) => {
  const { id, kpiId, entityId, periodId, value, note, source, submittedBy } = req.body as {
    id: string; kpiId: string; entityId: string; periodId: string; value: number; note: string; source: string; submittedBy: string;
  };
  await query(
    "INSERT INTO submissions (id, kpi_id, entity_id, period_id, value, note, source, submitted_by, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'submitted')",
    [id, kpiId, entityId, periodId, value, note, source, submittedBy]
  );
  res.json({ ok: true });
});

/** Replaces RLS's "update submissions from submitted" check — only lets a still-pending
 * submission's value/note be corrected, matching updateSubmissionValue's own `.eq("status",
 * "submitted")` filter. */
submissionsRouter.patch("/:id/value", requireAuth, async (req, res) => {
  const { value, note } = req.body as { value: number; note: string };
  const result = await execute("UPDATE submissions SET value = ?, note = ? WHERE id = ? AND status = 'submitted'", [
    value,
    note,
    req.params.id,
  ]);
  if (result.affectedRows === 0) return res.status(409).json({ error: "This submission is no longer pending — it may have already been reviewed." });
  res.json({ ok: true });
});

/** Replaces RLS's "update submissions from submitted" published/rejected transition (migration
 * 0002/0004) — only a still-pending submission can be reviewed, and once reviewed it's
 * immutable (0010 reversed 0008's attempt to allow editing a published row in place).
 *
 * Unlike the Postgres RLS CHECK, this does NOT also write fact_kpi_results — computing the right
 * ytd_actual/ytd_target/status for that table is business logic that already lives entirely in
 * the frontend (src/lib/workflow.tsx's approveOne, using src/data/kpis.ts's kpiStatus()), not
 * something to re-derive server-side. The frontend calls `PUT /api/facts` as its own, separate
 * second statement right after this one succeeds — exactly the two-statement pattern
 * migration 0001's own comment on fact_kpi_results already described ("the app does this as a
 * second statement after marking the submission published"), just now over HTTP instead of two
 * Supabase calls in a row. */
submissionsRouter.post("/:id/review", requireAuth, async (req, res) => {
  const { status, reviewedBy, reviewNote } = req.body as { status: "published" | "rejected"; reviewedBy: string; reviewNote?: string };
  const result = await execute(
    "UPDATE submissions SET status = ?, reviewed_by = ?, reviewed_at = NOW(), review_note = ? WHERE id = ? AND status = 'submitted'",
    [status, reviewedBy, reviewNote ?? null, req.params.id]
  );
  if (result.affectedRows === 0) return res.status(409).json({ error: "This submission is no longer pending." });
  res.json({ ok: true });
});
