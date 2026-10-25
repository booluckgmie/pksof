import { Router } from "express";
import { query } from "../db.js";
import { requireAuth } from "../middleware/auth.js";

export const activityRouter = Router();

/** Mirrors src/lib/api/activity.ts's fetchActivityEvents — public read is NOT preserved here on
 * purpose: this is sign-in history, not dashboard content, so it goes behind auth (today it's
 * technically open RLS, but nothing in the UI surfaces it to a signed-out visitor anyway — Verify
 * & Publish's Activity tab, which is the only consumer, already requires being signed in to reach
 * that screen at all). */
activityRouter.get("/", requireAuth, async (_req, res) => {
  const rows = await query("SELECT * FROM activity_log ORDER BY created_at DESC LIMIT 500");
  res.json(rows);
});

/** Fire-and-forget, same as the frontend's own logLogin — a failed write here must never block
 * sign-in itself, so this is called without awaiting from auth.ts's login handler. */
export function logLoginActivity(input: { userName: string; role: string; entityId: string; detail?: string }): void {
  const id = `LOGIN-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  query("INSERT INTO activity_log (id, user_name, role, entity_id, action, detail) VALUES (?, ?, ?, ?, 'login', ?)", [
    id,
    input.userName,
    input.role,
    input.entityId,
    input.detail ?? null,
  ]).catch((err) => console.warn("activity log write failed:", err));
}
