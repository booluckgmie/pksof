import fs from "node:fs/promises";
import path from "node:path";
import { Router } from "express";
import multer from "multer";
import { execute, query } from "../db.js";
import { requireAuth } from "../middleware/auth.js";

export const uploadsRouter = Router();

const UPLOAD_DIR = process.env.UPLOAD_DIR ?? "./data/uploads";
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 25 * 1024 * 1024 } });

/** Mirrors src/lib/api/uploads.ts exactly, replacing the Supabase "upload-files" Storage bucket
 * with local disk under UPLOAD_DIR, same "<uploadId>/<fileName>" path convention. Unlike the old
 * public bucket, downloads now require auth — a deliberate small tightening, reasonable now that
 * this is the app's own origin rather than a public internet bucket. */
uploadsRouter.get("/", requireAuth, async (_req, res) => {
  const rows = await query("SELECT * FROM upload_events ORDER BY uploaded_at DESC");
  res.json(rows);
});

uploadsRouter.get("/:id/rows", requireAuth, async (req, res) => {
  const rows = await query("SELECT * FROM upload_event_rows WHERE upload_id = ? ORDER BY id", [req.params.id]);
  res.json(rows);
});

uploadsRouter.post("/", requireAuth, async (req, res) => {
  const b = req.body as {
    id: string; entityId: string; fileName: string; sheets: string; periods: string; uploadedBy: string;
    totalRows: number; savedRows: number; failedRows: number; filePath?: string | null;
  };
  await query(
    `INSERT INTO upload_events (id, entity_id, file_name, sheets, periods, uploaded_by, total_rows, saved_rows, failed_rows, file_path)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [b.id, b.entityId, b.fileName, b.sheets, b.periods, b.uploadedBy, b.totalRows, b.savedRows, b.failedRows, b.filePath ?? null]
  );
  res.json({ ok: true });
});

uploadsRouter.post("/rows", requireAuth, async (req, res) => {
  const rowsIn = req.body as {
    id: string; uploadId: string; dest: string; sheet: string; label: string; periodId: string;
    value: number | null; status: string; errorMessage?: string | null;
  }[];
  if (rowsIn.length === 0) return res.json({ ok: true });
  const values = rowsIn.flatMap((r) => [r.id, r.uploadId, r.dest, r.sheet, r.label, r.periodId, r.value, r.status, r.errorMessage ?? null]);
  const placeholders = rowsIn.map(() => "(?, ?, ?, ?, ?, ?, ?, ?, ?)").join(", ");
  await query(`INSERT INTO upload_event_rows (id, upload_id, dest, sheet, label, period_id, value, status, error_message) VALUES ${placeholders}`, values);
  res.json({ ok: true });
});

/** Best-effort save, same posture as uploadFileToStorage — a storage failure here must never
 * block the data this upload already wrote via the two routes above. */
uploadsRouter.post("/:id/file", requireAuth, upload.single("file"), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: "No file provided." });
  const uploadId = String(req.params.id);
  try {
    const dir = path.join(UPLOAD_DIR, uploadId);
    await fs.mkdir(dir, { recursive: true });
    const fileName = req.file.originalname;
    await fs.writeFile(path.join(dir, fileName), req.file.buffer);
    res.json({ filePath: `${uploadId}/${fileName}` });
  } catch (err) {
    console.error("Couldn't save uploaded file to disk", err);
    res.status(500).json({ error: "Couldn't save the file." });
  }
});

uploadsRouter.get("/:id/file/:fileName", requireAuth, async (req, res) => {
  const fileName = String(req.params.fileName);
  const filePath = path.join(UPLOAD_DIR, String(req.params.id), fileName);
  res.download(filePath, fileName, (err) => {
    if (err) res.status(404).json({ error: "File not found." });
  });
});

/** Deletes an upload's audit-trail record (upload_event_rows cascades via its FK, same as
 * before) and its stored file, if any — the KPI submissions / detail_metrics / detail_records
 * that upload already wrote are untouched, same as deleteUploadEvent's own doc comment. */
uploadsRouter.delete("/:id", requireAuth, async (req, res) => {
  const rows = await query<{ file_path: string | null }>("SELECT file_path FROM upload_events WHERE id = ?", [req.params.id]);
  const filePath = rows[0]?.file_path;
  await execute("DELETE FROM upload_events WHERE id = ?", [req.params.id]);
  if (filePath) {
    await fs.rm(path.join(UPLOAD_DIR, filePath), { force: true }).catch((err) => console.error("Couldn't remove stored file for deleted upload", req.params.id, err));
  }
  // Each upload gets its own "<uploadId>/" directory with exactly one file in it — clean up the
  // now-empty directory too, not just the file, so deleted uploads don't leave empty folders
  // behind forever. rmdir only succeeds if it's genuinely empty, so this is a no-op (silently
  // ignored) if anything unexpected is still in there.
  await fs.rmdir(path.join(UPLOAD_DIR, String(req.params.id))).catch(() => {});
  res.json({ ok: true });
});
