import { Router } from "express";
import { query } from "../db.js";
import { requireAuth } from "../middleware/auth.js";

export const templateOverflowRouter = Router();

/** Mirrors src/lib/api/templateOverflow.ts exactly — the "customize queue" behind VerifyPublish's
 * Customize queue tab (see src/components/pk/OverflowPanel.tsx). */
templateOverflowRouter.get("/", requireAuth, async (_req, res) => {
  const rows = await query("SELECT * FROM template_overflow_entries ORDER BY created_at DESC");
  res.json(rows);
});

templateOverflowRouter.post("/", requireAuth, async (req, res) => {
  const rowsIn = req.body as {
    uploadId: string; entityId: string; sheet: string; periodLabel: string | null;
    label: string; sub: string; rawValue: string; reason: string; conflictWith?: string;
  }[];
  if (rowsIn.length === 0) return res.json({ ok: true });
  const values = rowsIn.flatMap((r, i) => [
    `${r.uploadId}-OF-${i}`, r.uploadId, r.entityId, r.sheet, r.periodLabel, r.label, r.sub, r.rawValue, r.reason, r.conflictWith ?? null,
  ]);
  const placeholders = rowsIn.map(() => "(?, ?, ?, ?, ?, ?, ?, ?, ?, ?)").join(", ");
  await query(
    `INSERT INTO template_overflow_entries (id, upload_id, entity_id, sheet, period_label, row_label, row_sub, raw_value, reason, conflict_with_value)
     VALUES ${placeholders}`,
    values
  );
  res.json({ ok: true });
});

templateOverflowRouter.patch("/:id", requireAuth, async (req, res) => {
  const { status, resolvedBy, resolutionNote, mappedDest, mappedKey } = req.body as {
    status: "mapped" | "ignored" | "flagged_for_template"; resolvedBy: string; resolutionNote?: string; mappedDest?: string; mappedKey?: string;
  };
  await query(
    `UPDATE template_overflow_entries
     SET status = ?, resolved_by = ?, resolved_at = NOW(), resolution_note = ?, mapped_dest = ?, mapped_key = ?
     WHERE id = ?`,
    [status, resolvedBy, resolutionNote ?? null, mappedDest ?? null, mappedKey ?? null, req.params.id]
  );
  res.json({ ok: true });
});
