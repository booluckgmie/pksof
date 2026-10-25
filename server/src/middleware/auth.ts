import type { NextFunction, Request, Response } from "express";
import { verifySessionToken } from "../auth.js";
import { query } from "../db.js";

export interface AppUserRow {
  id: string;
  display_name: string;
  role: "board" | "exec" | "dept_head" | "reporting_officer" | "approving_officer" | "admin";
  home_entity: string;
  email: string;
  assigned_module: "CP" | "FH" | "RP" | null;
  must_change_password: boolean;
  active: boolean;
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: AppUserRow;
    }
  }
}

/** Every dashboard-read endpoint stays public, matching today's `using (true)` RLS + no-login-
 * required browsing (see LoginDialog.tsx's own copy: "Browsing the dashboards doesn't require
 * signing in"). Only this — writes, app_users reads, admin actions — requires a session, same
 * split the Postgres schema already drew (migration 0020 was the one table that stopped being
 * anon-readable). */
export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  const token = header?.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: "Not signed in." });

  const payload = verifySessionToken(token);
  if (!payload) return res.status(401).json({ error: "Session expired — please sign in again." });

  const rows = await query<AppUserRow>(
    "SELECT id, display_name, role, home_entity, email, assigned_module, must_change_password, active FROM app_users WHERE id = ?",
    [payload.sub]
  );
  const user = rows[0];
  if (!user || !user.active) return res.status(401).json({ error: "This account is no longer active." });

  req.user = user;
  next();
}

/** Admin-only routes (user management) — mirrors the manage-users Edge Function's own check,
 * now done in-process instead of via a separate service-role-keyed function. */
export function requireRole(...roles: AppUserRow["role"][]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ error: "You don't have access to do that." });
    }
    next();
  };
}
