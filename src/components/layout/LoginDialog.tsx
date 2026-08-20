import { useMemo, useState } from "react";
import { ShieldCheck, KeyRound, Building2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useSession } from "@/lib/session";
import { useOrgSettings } from "@/lib/orgSettings";
import { roleDefs } from "@/lib/roles";
import { entities } from "@/data/entities";
import { resolveCurrentPeriodId } from "@/data/periods";
import type { EntityId, Role } from "@/types";

/** Sign-in as a dialog, not a landing page — browsing the dashboards needs no login; this is
 * only required to upload data (Data Entry) or verify/publish submissions. */
export function LoginDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const { login } = useSession();
  const { fiscalYearEndMonth } = useOrgSettings();
  const [userId, setUserId] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<Role>("reporting_officer");
  const [homeEntity, setHomeEntity] = useState<EntityId>("HQ");

  const roleDef = roleDefs.find((r) => r.id === role)!;
  const latestPeriodId = useMemo(() => resolveCurrentPeriodId(new Date(), fiscalYearEndMonth), [fiscalYearEndMonth]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const displayName = userId.trim() || "demo.user";
    login({ role, userName: displayName, homeEntity, periodId: latestPeriodId });
    onOpenChange(false);
    setUserId("");
    setPassword("");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[420px]">
        <DialogHeader>
          <DialogTitle className="font-head">Sign in</DialogTitle>
          <DialogDescription>
            Corporate ID and password — any values work in this prototype. Only needed to upload data or verify/publish submissions; browsing the dashboards doesn't require it.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
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

          <div className="h-px bg-[hsl(var(--pk-border))]" />

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
            className="mt-1 rounded-md bg-[hsl(var(--pk-accent))] text-[hsl(var(--pk-accent-ink))] font-medium text-sm py-2.5 hover:opacity-90 transition-opacity"
          >
            Sign in
          </button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
