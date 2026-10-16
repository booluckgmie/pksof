import { useState } from "react";
import { KeyRound, Loader2, CheckCircle2 } from "lucide-react";
import { useSession } from "@/lib/session";
import { getSupabase } from "@/lib/supabase";
import type { ScreenId } from "@/lib/nav";

/** Reached two ways: the forced-first-login gate (every seeded account starts on the shared
 * "prokhas" default, App.tsx blocks everything else until this is cleared), and an emailed
 * password-recovery link (Supabase's PASSWORD_RECOVERY auth event routes here — see session.tsx).
 * Same form either way; only the copy differs. */
export function ResetPassword({ onNavigate }: { onNavigate: (id: ScreenId) => void }) {
  const { mustChangePassword, userName } = useSession();
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
    const supabase = getSupabase();
    // Clear the forced-change flag before setting the new password — both reached via the
    // caller's own still-valid session, and RLS only allows a user to update this one column
    // on their own row (see migration 0020).
    const { data: userData } = await supabase.auth.getUser();
    const userId = userData.user?.id;
    if (userId) {
      const { error: flagError } = await supabase.from("app_users").update({ must_change_password: false }).eq("auth_user_id", userId);
      if (flagError) { setSubmitting(false); setError("Couldn't update your account — try again."); return; }
    }
    const { error: pwError } = await supabase.auth.updateUser({ password });
    setSubmitting(false);
    if (pwError) { setError(pwError.message); return; }
    setDone(true);
    setTimeout(() => onNavigate("MAIN"), 1200);
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
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="flex-1 bg-transparent text-sm outline-none text-[hsl(var(--pk-ink))]"
              autoFocus
            />
          </div>
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-2xs uppercase tracking-wide text-[hsl(var(--pk-ink-faint))]">Confirm password</span>
          <div className="flex items-center gap-2 rounded-md border border-[hsl(var(--pk-border))] px-2.5 py-2">
            <KeyRound className="h-4 w-4 text-[hsl(var(--pk-ink-faint))]" />
            <input
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              className="flex-1 bg-transparent text-sm outline-none text-[hsl(var(--pk-ink))]"
            />
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
