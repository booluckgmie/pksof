import { Router } from "express";
import { query } from "../db.js";
import { generateResetToken, hashPassword, hashResetToken, signSessionToken, verifyPassword } from "../auth.js";
import { sendPasswordResetEmail } from "../mailer.js";
import { requireAuth, type AppUserRow } from "../middleware/auth.js";
import { logLoginActivity } from "./activity.js";

export const authRouter = Router();

interface AppUserAuthRow extends AppUserRow {
  password_hash: string;
}

function toIdentity(row: AppUserRow) {
  return {
    id: row.id,
    displayName: row.display_name,
    role: row.role,
    homeEntity: row.home_entity,
    email: row.email,
    assignedModule: row.assigned_module,
    mustChangePassword: Boolean(row.must_change_password),
  };
}

/** Mirrors session.tsx's current `login(username, password)`: same generic "Incorrect username
 * or password" message whether the username doesn't exist or the password is wrong, so a failed
 * attempt can't be used to enumerate real usernames. */
authRouter.post("/login", async (req, res) => {
  const { username, password } = req.body as { username?: string; password?: string };
  if (!username?.trim() || !password) return res.status(400).json({ error: "Enter your username and password." });

  const rows = await query<AppUserAuthRow>(
    "SELECT id, display_name, role, home_entity, email, assigned_module, must_change_password, active, password_hash FROM app_users WHERE id = ?",
    [username.trim()]
  );
  const user = rows[0];
  if (!user || !user.active || !(await verifyPassword(password, user.password_hash))) {
    return res.status(401).json({ error: "Incorrect username or password." });
  }

  const token = signSessionToken(user.id);
  logLoginActivity({
    userName: user.display_name,
    role: user.role,
    entityId: user.home_entity,
    detail: user.assigned_module ? `Signed in as ${user.role} — ${user.assigned_module}` : undefined,
  });
  res.json({ token, user: toIdentity(user) });
});

/** Replaces `supabase.auth.getSession()` + the app_users lookup session.tsx already does on
 * mount — restores identity from a stored token on page load. */
authRouter.get("/me", requireAuth, (req, res) => {
  res.json({ user: toIdentity(req.user!) });
});

/** Stateless JWT — nothing to invalidate server-side; the frontend just discards the token.
 * Kept as a real endpoint (rather than purely client-side) so a future server-side revocation
 * list has somewhere to hang without a frontend change. */
authRouter.post("/logout", (_req, res) => {
  res.json({ ok: true });
});

/** The forced-first-login / "set a new password while already signed in" path — ResetPassword.tsx's
 * `mustChangePassword` branch. Requires a valid session (unlike reset-password below, which works
 * from an emailed link with no prior session). */
authRouter.post("/change-password", requireAuth, async (req, res) => {
  const { password } = req.body as { password?: string };
  if (!password || password.length < 8) return res.status(400).json({ error: "Use at least 8 characters." });
  const hash = await hashPassword(password);
  await query("UPDATE app_users SET password_hash = ?, must_change_password = FALSE WHERE id = ?", [hash, req.user!.id]);
  res.json({ ok: true });
});

/** "Forgot password?" — same anti-enumeration shape as today: always responds success, whether
 * or not the username exists, and only logs/emails when it does. */
authRouter.post("/forgot-password", async (req, res) => {
  const { username } = req.body as { username?: string };
  const trimmed = username?.trim();
  if (trimmed) {
    const rows = await query<AppUserRow>("SELECT id, email, active FROM app_users WHERE id = ?", [trimmed]);
    const user = rows[0];
    if (user?.active) {
      const { raw, hash } = generateResetToken();
      const id = `PRT-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
      await query("INSERT INTO password_reset_tokens (id, user_id, token_hash, expires_at) VALUES (?, ?, ?, ?)", [
        id,
        user.id,
        hash,
        expiresAt,
      ]);
      const resetUrl = `${process.env.PUBLIC_APP_URL ?? ""}/?screen=RESET_PASSWORD&token=${raw}`;
      void sendPasswordResetEmail(user.email, resetUrl);
    }
  }
  res.json({ ok: true });
});

/** The emailed-link path — unlike change-password above, there's no signed-in session yet; the
 * one-time token (from forgot-password) stands in for one. */
authRouter.post("/reset-password", async (req, res) => {
  const { token, password } = req.body as { token?: string; password?: string };
  if (!token) return res.status(400).json({ error: "Missing reset token." });
  if (!password || password.length < 8) return res.status(400).json({ error: "Use at least 8 characters." });

  const hash = hashResetToken(token);
  const rows = await query<{ id: string; user_id: string; expires_at: string; used_at: string | null }>(
    "SELECT id, user_id, expires_at, used_at FROM password_reset_tokens WHERE token_hash = ?",
    [hash]
  );
  const record = rows[0];
  if (!record || record.used_at || new Date(record.expires_at) < new Date()) {
    return res.status(400).json({ error: "This reset link is invalid or has expired — request a new one." });
  }

  const passwordHash = await hashPassword(password);
  await query("UPDATE app_users SET password_hash = ?, must_change_password = FALSE WHERE id = ?", [passwordHash, record.user_id]);
  await query("UPDATE password_reset_tokens SET used_at = NOW() WHERE id = ?", [record.id]);
  res.json({ ok: true });
});
