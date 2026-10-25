import bcrypt from "bcryptjs";
import crypto from "node:crypto";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET ?? "";
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN ?? "24h";

if (!JWT_SECRET) {
  throw new Error("JWT_SECRET is not set — copy server/.env.example to .env and fill it in before starting the server.");
}

export interface SessionToken {
  /** app_users.id — the username. */
  sub: string;
}

export function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, 10);
}

export function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

export function signSessionToken(userId: string): string {
  return jwt.sign({ sub: userId } satisfies SessionToken, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN as jwt.SignOptions["expiresIn"],
  });
}

export function verifySessionToken(token: string): SessionToken | null {
  try {
    return jwt.verify(token, JWT_SECRET) as SessionToken;
  } catch {
    return null;
  }
}

/** A password-reset link's raw token is only ever in the emailed URL and the requester's
 * browser — only its sha256 hash is stored, same reasoning as never storing a plaintext
 * password. */
export function generateResetToken(): { raw: string; hash: string } {
  const raw = crypto.randomBytes(32).toString("hex");
  const hash = crypto.createHash("sha256").update(raw).digest("hex");
  return { raw, hash };
}

export function hashResetToken(raw: string): string {
  return crypto.createHash("sha256").update(raw).digest("hex");
}
