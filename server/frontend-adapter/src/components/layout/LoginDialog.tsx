// Replaces src/components/layout/LoginDialog.tsx. Only handleForgot changes — the new
// POST /api/auth/forgot-password endpoint does the username->email lookup, the anti-enumeration
// "always say sent" behavior, and the email send itself, server-side (see
// server/src/routes/auth.ts) — the frontend just calls it and shows the same confirmation
// regardless of outcome, same as before. Everything else in this file is unchanged from the
// original; it's included here in full only so the whole component is easy to diff and drop in.
import { useState } from "react";
import { ShieldCheck, KeyRound, Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useSession } from "@/lib/session";
import { apiFetch } from "@/lib/apiClient";

const SSO_VISIBLE = false;

export function LoginDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const { login } = useSession();
  const [mode, setMode] = useState<"signIn" | "forgot" | "sent">("signIn");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const reset = () => {
    setMode("signIn");
    setUsername("");
    setPassword("");
    setError(null);
    setSubmitting(false);
  };

  const close = () => {
    onOpenChange(false);
    reset();
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    const message = await login(username, password);
    setSubmitting(false);
    if (message) { setError(message); return; }
    close();
  };

  const handleForgot = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    const trimmed = username.trim();
    if (!trimmed) { setSubmitting(false); setError("Enter your username."); return; }
    await apiFetch("/auth/forgot-password", { method: "POST", body: { username: trimmed } }).catch(() => {});
    setSubmitting(false);
    // Same confirmation whether or not the username matched — otherwise this screen could be
    // used to check which usernames exist.
    setMode("sent");
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) close(); else onOpenChange(v); }}>
      <DialogContent className="max-w-[420px]">
        <DialogHeader>
          <DialogTitle className="font-head">{mode === "signIn" ? "Sign in" : "Reset your password"}</DialogTitle>
          <DialogDescription>
            {mode === "signIn"
              ? "For uploading or reviewing data. Browsing the dashboards doesn't require signing in."
              : mode === "forgot"
                ? "Enter your username and we'll email a reset link to the address on file."
                : "If that username has an account, a reset link is on its way to the email on file."}
          </DialogDescription>
        </DialogHeader>

        {mode === "sent" ? (
          <button
            type="button"
            onClick={close}
            className="mt-1 rounded-md bg-[hsl(var(--pk-accent))] text-[hsl(var(--pk-accent-ink))] font-medium text-sm py-2.5 hover:opacity-90 transition-opacity"
          >
            Done
          </button>
        ) : (
          <>
            {SSO_VISIBLE && mode === "signIn" && (
              <>
                <button
                  type="button"
                  className="rounded-md border border-[hsl(var(--pk-border))] text-sm font-medium py-2.5 hover:bg-[hsl(var(--pk-surface-2))] transition-colors"
                >
                  Continue with SSO
                </button>
                <div className="flex items-center gap-2 text-2xs text-[hsl(var(--pk-ink-faint))]">
                  <div className="h-px flex-1 bg-[hsl(var(--pk-border))]" />or<div className="h-px flex-1 bg-[hsl(var(--pk-border))]" />
                </div>
              </>
            )}

            <form onSubmit={mode === "signIn" ? handleSignIn : handleForgot} className="flex flex-col gap-4">
              <label className="flex flex-col gap-1">
                <span className="text-2xs uppercase tracking-wide text-[hsl(var(--pk-ink-faint))]">Username</span>
                <div className="flex items-center gap-2 rounded-md border border-[hsl(var(--pk-border))] px-2.5 py-2">
                  <ShieldCheck className="h-4 w-4 text-[hsl(var(--pk-ink-faint))]" />
                  <input
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="e.g. nhba"
                    autoFocus
                    className="flex-1 bg-transparent text-sm outline-none text-[hsl(var(--pk-ink))]"
                  />
                </div>
              </label>

              {mode === "signIn" && (
                <label className="flex flex-col gap-1">
                  <span className="text-2xs uppercase tracking-wide text-[hsl(var(--pk-ink-faint))]">Password</span>
                  <div className="flex items-center gap-2 rounded-md border border-[hsl(var(--pk-border))] px-2.5 py-2">
                    <KeyRound className="h-4 w-4 text-[hsl(var(--pk-ink-faint))]" />
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="flex-1 bg-transparent text-sm outline-none text-[hsl(var(--pk-ink))]"
                    />
                  </div>
                </label>
              )}

              {error && <p className="text-xs text-[hsl(var(--pk-bad))]">{error}</p>}

              <button
                type="submit"
                disabled={submitting}
                className="mt-1 flex items-center justify-center gap-2 rounded-md bg-[hsl(var(--pk-accent))] text-[hsl(var(--pk-accent-ink))] font-medium text-sm py-2.5 hover:opacity-90 transition-opacity disabled:opacity-60"
              >
                {submitting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                {mode === "signIn" ? "Sign in" : "Send reset link"}
              </button>

              <button
                type="button"
                onClick={() => { setMode(mode === "signIn" ? "forgot" : "signIn"); setError(null); }}
                className="text-2xs text-[hsl(var(--pk-ink-faint))] hover:text-[hsl(var(--pk-ink))] transition-colors -mt-1"
              >
                {mode === "signIn" ? "Forgot password?" : "Back to sign in"}
              </button>
            </form>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
