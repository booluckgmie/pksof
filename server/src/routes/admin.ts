import { Router } from "express";
import { hashPassword } from "../auth.js";
import { execute, query } from "../db.js";
import { requireAuth, requireRole, type AppUserRow } from "../middleware/auth.js";

export const adminRouter = Router();
adminRouter.use(requireAuth, requireRole("admin"));

const DEFAULT_PASSWORD = "prokhas";

/** Replaces supabase/functions/manage-users/index.ts. Simpler than the original: there's no
 * separate auth.users row to create/roll back alongside app_users anymore — one self-contained
 * insert, atomic by nature. */
adminRouter.get("/", async (_req, res) => {
  const rows = await query<AppUserRow>(
    "SELECT id, display_name, role, home_entity, email, assigned_module, must_change_password, active FROM app_users ORDER BY id"
  );
  res.json(rows);
});

adminRouter.post("/", async (req, res) => {
  const { username, displayName, email, role, assignedModule, homeEntity } = req.body as {
    username?: string; displayName?: string; email?: string; role?: string; assignedModule?: string | null; homeEntity?: string;
  };
  if (!username || !displayName || !email || !role || !homeEntity) {
    return res.status(400).json({ error: "username, displayName, email, role and homeEntity are all required." });
  }
  const existing = await query("SELECT id FROM app_users WHERE id = ?", [username]);
  if (existing.length > 0) return res.status(400).json({ error: "That username is already taken." });

  const passwordHash = await hashPassword(DEFAULT_PASSWORD);
  await query(
    `INSERT INTO app_users (id, display_name, role, home_entity, assigned_module, email, password_hash, must_change_password, active)
     VALUES (?, ?, ?, ?, ?, ?, ?, TRUE, TRUE)`,
    [username, displayName, role, homeEntity, assignedModule ?? null, email, passwordHash]
  );
  res.json({ ok: true });
});

adminRouter.put("/:username", async (req, res) => {
  const { role, assignedModule, homeEntity } = req.body as { role?: string; assignedModule?: string | null; homeEntity?: string };
  if (!role || !homeEntity) return res.status(400).json({ error: "role and homeEntity are required." });
  await query("UPDATE app_users SET role = ?, assigned_module = ?, home_entity = ? WHERE id = ?", [
    role,
    assignedModule ?? null,
    homeEntity,
    req.params.username,
  ]);
  res.json({ ok: true });
});

adminRouter.post("/:username/reset-password", async (req, res) => {
  const passwordHash = await hashPassword(DEFAULT_PASSWORD);
  const result = await execute("UPDATE app_users SET password_hash = ?, must_change_password = TRUE WHERE id = ?", [
    passwordHash,
    req.params.username,
  ]);
  if (result.affectedRows === 0) return res.status(404).json({ error: "No such user." });
  res.json({ ok: true });
});

adminRouter.post("/:username/active", async (req, res) => {
  const { active } = req.body as { active?: boolean };
  if (typeof active !== "boolean") return res.status(400).json({ error: "active (boolean) is required." });
  const result = await execute("UPDATE app_users SET active = ? WHERE id = ?", [active, req.params.username]);
  if (result.affectedRows === 0) return res.status(404).json({ error: "No such user." });
  res.json({ ok: true });
});
