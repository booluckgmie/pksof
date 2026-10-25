import nodemailer from "nodemailer";

const configured = Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASSWORD);

const transporter = configured
  ? nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT ?? 587),
      secure: process.env.SMTP_SECURE === "true",
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD },
    })
  : null;

/** Sends a password-reset link. Logged but never thrown on failure — same "best-effort, don't
 * block the request" posture the frontend already applies to its own fire-and-forget writes
 * (see DataEntry.tsx's upload-audit-trail insert), and the same anti-enumeration shape the
 * current Supabase-based flow already has: the caller always gets a generic "reset link sent if
 * that account exists" response regardless of whether the email actually went out. */
export async function sendPasswordResetEmail(to: string, resetUrl: string): Promise<void> {
  if (!transporter) {
    console.warn(`[mailer] SMTP not configured — would have sent a password-reset link to ${to}: ${resetUrl}`);
    return;
  }
  try {
    await transporter.sendMail({
      from: process.env.SMTP_FROM ?? process.env.SMTP_USER,
      to,
      subject: "Reset your Group Performance Dashboard password",
      text: `Someone requested a password reset for this email address.\n\nReset your password: ${resetUrl}\n\nIf you didn't request this, you can ignore this email — your password hasn't changed.\n\nThis link expires in 1 hour.`,
      html: `<p>Someone requested a password reset for this email address.</p><p><a href="${resetUrl}">Reset your password</a></p><p>If you didn't request this, you can ignore this email — your password hasn't changed.</p><p>This link expires in 1 hour.</p>`,
    });
  } catch (err) {
    console.error("[mailer] Failed to send password-reset email", err);
  }
}
