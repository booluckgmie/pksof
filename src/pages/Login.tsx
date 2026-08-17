import { useState } from "react";
import { ShieldCheck, KeyRound, Building2 } from "lucide-react";
import { useSession } from "@/lib/session";
import { roleDefs } from "@/lib/roles";
import { entities } from "@/data/entities";
import { resolveCurrentPeriodId } from "@/data/periods";
import type { EntityId, Role } from "@/types";

/** The period whose calendar quarter contains today — new sign-ins land on it by default. */
const latestPeriodId = resolveCurrentPeriodId();

export function Login() {
  const { login } = useSession();
  const [userId, setUserId] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<Role>("exec");
  const [homeEntity, setHomeEntity] = useState<EntityId>("HQ");

  const roleDef = roleDefs.find((r) => r.id === role)!;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const displayName = userId.trim() || "demo.user";
    login({ role, userName: displayName, homeEntity, periodId: latestPeriodId });
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4 py-10"
      style={{ background: "linear-gradient(135deg, hsl(213 67% 13%) 0%, hsl(213 60% 17%) 55%, hsl(155 50% 16%) 100%)" }}
    >
      <div className="w-full max-w-[420px]">
        <div className="flex items-center gap-2.5 mb-8 justify-center">
          <div className="leading-tight text-white text-center">
            <div className="font-head font-semibold text-xl tracking-tight">
              Group <span className="text-[hsl(var(--pk-accent-lt))]">HQ</span>
            </div>
            <div className="text-[11px] text-white/50 -mt-0.5 tracking-wide">Group Performance Dashboard — prototype</div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="bg-[hsl(var(--pk-surface))] rounded-xl border border-white/10 shadow-2xl p-6 flex flex-col gap-4">
          <div>
            <h1 className="font-head text-lg font-semibold text-[hsl(var(--pk-ink))]">Sign in</h1>
            <p className="text-[13px] text-[hsl(var(--pk-ink-faint))] mt-0.5">Corporate ID and password — any values work in this prototype.</p>
          </div>

          <label className="flex flex-col gap-1">
            <span className="text-[11px] uppercase tracking-wide text-[hsl(var(--pk-ink-faint))]">Corporate ID</span>
            <div className="flex items-center gap-2 rounded-md border border-[hsl(var(--pk-border))] px-2.5 py-2">
              <ShieldCheck className="h-4 w-4 text-[hsl(var(--pk-ink-faint))]" />
              <input
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
                placeholder="e.g. ahmad.najmi"
                className="flex-1 bg-transparent text-sm outline-none text-[hsl(var(--pk-ink))]"
              />
            </div>
          </label>

          <label className="flex flex-col gap-1">
            <span className="text-[11px] uppercase tracking-wide text-[hsl(var(--pk-ink-faint))]">Password</span>
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

          <div className="h-px bg-[hsl(var(--pk-border))] my-1" />

          <label className="flex flex-col gap-1">
            <span className="text-[11px] uppercase tracking-wide text-[hsl(var(--pk-ink-faint))]">Sign in as (demo role)</span>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as Role)}
              className="rounded-md border border-[hsl(var(--pk-border))] px-2.5 py-2 text-sm text-[hsl(var(--pk-ink))] bg-[hsl(var(--pk-surface))] outline-none"
            >
              {roleDefs.map((r) => (
                <option key={r.id} value={r.id}>{r.label}</option>
              ))}
            </select>
            <span className="text-[11.5px] text-[hsl(var(--pk-ink-faint))] mt-0.5">{roleDef.description}</span>
          </label>

          {roleDef.pillarLocked && (
            <label className="flex flex-col gap-1">
              <span className="text-[11px] uppercase tracking-wide text-[hsl(var(--pk-ink-faint))]">Assigned pillar</span>
              <div className="flex items-center gap-2 rounded-md border border-[hsl(var(--pk-border))] px-2.5 py-2">
                <Building2 className="h-4 w-4 text-[hsl(var(--pk-ink-faint))]" />
                <select
                  value={homeEntity}
                  onChange={(e) => setHomeEntity(e.target.value as EntityId)}
                  className="flex-1 bg-transparent text-sm outline-none text-[hsl(var(--pk-ink))]"
                >
                  {entities.map((e) => (
                    <option key={e.id} value={e.id}>{e.fullName}</option>
                  ))}
                </select>
              </div>
              <span className="text-[11.5px] text-[hsl(var(--pk-ink-faint))] mt-0.5">Pillar isolation — this role sees only its assigned entity.</span>
            </label>
          )}

          <button
            type="submit"
            className="mt-2 rounded-md bg-[hsl(var(--pk-accent))] text-[hsl(var(--pk-accent-ink))] font-medium text-sm py-2.5 hover:opacity-90 transition-opacity"
          >
            Sign in
          </button>
        </form>

        <p className="text-center text-[11.5px] text-white/40 mt-5">Reporting year FY2026 · Prototype build with sample data</p>
      </div>
    </div>
  );
}
