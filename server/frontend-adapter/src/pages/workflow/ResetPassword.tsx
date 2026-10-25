// Replaces src/pages/workflow/ResetPassword.tsx. Two paths, same as the original:
//   1. Forced-first-login gate — already signed in (a valid JWT), mustChangePassword is true.
//      Calls POST /api/auth/change-password with just the new password; the JWT in the
//      Authorization header (added automatically by apiFetch) is what proves who's asking.
//   2. Emailed recovery link — NOT signed in; the one-time token is in the URL
//      (?screen=RESET_PASSWORD&token=...), read directly rather than coming from a Supabase
//      PASSWORD_RECOVERY session the way it used to. Calls POST /api/auth/reset-password with
//      {token, password}.
// After either path succeeds: the forced-change path (already signed in) just refreshes
// identity in place via session.tsx's refreshIdentity() and navigates on, same as the original
// flow. The emailed-link path has no session to refresh — there never was one, unlike
// Supabase's magic-link-creates-a-temporary-session behavior — so it sends them to sign in
// with their new password instead of assuming they're now authenticated.
import { useState } from "react";
import { KeyRound, Loader2, CheckCircle2 } from "lucide-react";
import { useSession } from "@/lib/session";
import { apiFetch, ApiError } from "@/lib/apiClient";
import type { ScreenId } from "@/lib/nav";

export function ResetPassword({ onNavigate }: { onNavigate: (id: ScreenId) => void }) {
  const { mustChangePassword, userName, passwordRecovery, refreshIdentity } = useSession();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (password.length < 8) { setError("Use at least 8 characters."); return; }
    if (password !== confirm) { setError("Passwords don't match."); return; }
    setSubmitting(true);
    try {
      if (passwordRecovery) {
        const token = new URLSearchParams(window.location.search).get("token") ?? "";
        await apiFetch("/auth/reset-password", { method: "POST", body: { token, password } });
        setDone(true);
        // No session to resume — clear the one-time token out of the URL and send them to sign
        // in fresh with the password they just set.
        setTimeout(() => { window.location.href = window.location.pathname; }, 1500);
      } else {
        await apiFetch("/auth/change-password", { method: "POST", body: { password } });
        await refreshIdentity();
        setDone(true);
        setTimeout(() => onNavigate("MAIN"), 1200);
      }
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Couldn't update your password — try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (done) {
    return (
      <div className="flex flex-col items-center justify-center text-center gap-3 py-16">
        <CheckCircle2 className="h-8 w-8 text-[hsl(var(--pk-good))]" />
        <p className="text-sm text-[hsl(var(--pk-ink))]">Password updated. Taking you to the dashboard…</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[420px] py-10">
      <h1 className="font-head text-lg font-semibold text-[hsl(var(--pk-ink))] mb-1">
        {mustChangePassword ? "Set a new password" : "Reset your password"}
      </h1>
      <p className="text-sm text-[hsl(var(--pk-ink-faint))] mb-6">
        {mustChangePassword
          ? `Welcome${userName ? `, ${userName}` : ""} — your account still has its default password. Set your own before continuing.`
          : "Choose a new password for your account."}
      </p>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <label className="flex flex-col gap-1">
          <span className="text-2xs uppercase tracking-wide text-[hsl(var(--pk-ink-faint))]">New password</span>
          <div className="flex items-center gap-2 rounded-md border border-[hsl(var(--pk-border))] px-2.5 py-2">
            <KeyRound className="h-4 w-4 text-[hsl(var(--pk-ink-faint))]" />
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="flex-1 bg-transparent text-sm outline-none text-[hsl(var(--pk-ink))]" autoFocus />
          </div>
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-2xs uppercase tracking-wide text-[hsl(var(--pk-ink-faint))]">Confirm password</span>
          <div className="flex items-center gap-2 rounded-md border border-[hsl(var(--pk-border))] px-2.5 py-2">
            <KeyRound className="h-4 w-4 text-[hsl(var(--pk-ink-faint))]" />
            <input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} className="flex-1 bg-transparent text-sm outline-none text-[hsl(var(--pk-ink))]" />
          </div>
        </label>
        {error && <p className="text-xs text-[hsl(var(--pk-bad))]">{error}</p>}
        <button
          type="submit"
          disabled={submitting}
          className="mt-1 flex items-center justify-center gap-2 rounded-md bg-[hsl(var(--pk-accent))] text-[hsl(var(--pk-accent-ink))] font-medium text-sm py-2.5 hover:opacity-90 transition-opacity disabled:opacity-60"
        >
          {submitting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
          Set password
        </button>
      </form>
    </div>
  );
}
