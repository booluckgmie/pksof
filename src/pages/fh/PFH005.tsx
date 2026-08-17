import { Lock } from "lucide-react";
import { ScreenHeader } from "@/components/pk/ScreenHeader";
import { FhTabs } from "@/components/pk/FhTabs";
import { StatCard } from "@/components/pk/Misc";
import { pillarRowClass } from "@/components/pk/PillarGate";
import { cn } from "@/lib/utils";
import type { ScreenId } from "@/lib/nav";
import { relatedPartyTransactions } from "@/data/financialDetail";
import { useSession } from "@/lib/session";

export function PFH005({ onNavigate }: { onNavigate: (id: ScreenId) => void }) {
  const { isRestrictedPillar, homeEntityName } = useSession();
  const total = relatedPartyTransactions.reduce((s, t) => s + t.value, 0);
  const compliance = (relatedPartyTransactions.filter((t) => t.approved).length / relatedPartyTransactions.length) * 100;

  return (
    <div>
      <ScreenHeader id="PFH005" subtitle="RPT monitoring, arm's-length compliance and Board approval status." onNavigate={onNavigate} />
      <FhTabs current="PFH005" onNavigate={onNavigate} />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 mb-5">
        <StatCard label="Total RPT Value" value={`RM ${total.toFixed(1)}m`} />
        <StatCard label="Number of Transactions" value={String(relatedPartyTransactions.length)} />
        <StatCard label="Arm's-Length Compliance" value={`${compliance.toFixed(0)}%`} tone={compliance === 100 ? "good" : "pending"} />
      </div>

      {isRestrictedPillar && (
        <div className="flex items-center gap-1.5 text-[11px] text-[hsl(var(--pk-ink-faint))] mb-2">
          <Lock className="h-3 w-3" />Transactions involving other related parties are blurred — only {homeEntityName}'s are visible to your pillar
        </div>
      )}
      <div className="rounded-lg border border-[hsl(var(--pk-border))] bg-[hsl(var(--pk-surface))] overflow-x-auto">
        <table className="w-full text-sm min-w-[720px]">
          <thead>
            <tr className="text-[11px] uppercase tracking-wide text-[hsl(var(--pk-ink-faint))] bg-[hsl(var(--pk-surface-2))]">
              <th className="text-left font-medium px-3 py-2">Transaction</th>
              <th className="text-left font-medium px-3 py-2">Related Party</th>
              <th className="text-left font-medium px-3 py-2">Nature</th>
              <th className="text-right font-medium px-3 py-2">Value (RM M)</th>
              <th className="text-left font-medium px-3 py-2">Basis</th>
              <th className="text-left font-medium px-3 py-2">Board Approved</th>
            </tr>
          </thead>
          <tbody>
            {relatedPartyTransactions.map((t) => {
              const restricted = isRestrictedPillar && t.party !== homeEntityName;
              return (
                <tr key={t.txn} className="border-t border-[hsl(var(--pk-border))]">
                  <td className={cn("px-3 py-2 text-[hsl(var(--pk-ink))]", pillarRowClass(restricted))}>{t.txn}</td>
                  <td className={cn("px-3 py-2 text-[hsl(var(--pk-ink-soft))]", pillarRowClass(restricted))}>
                    <span className="inline-flex items-center gap-1.5">
                      {t.party}
                      {restricted && <Lock className="h-3 w-3 text-[hsl(var(--pk-ink-faint))]" />}
                    </span>
                  </td>
                  <td className={cn("px-3 py-2 text-[hsl(var(--pk-ink-soft))]", pillarRowClass(restricted))}>{t.nature}</td>
                  <td className={cn("px-3 py-2 text-right tnum font-medium", pillarRowClass(restricted))}>{t.value.toFixed(1)}</td>
                  <td className={cn("px-3 py-2 text-[hsl(var(--pk-ink-faint))]", pillarRowClass(restricted))}>{t.basis}</td>
                  <td className={cn("px-3 py-2", pillarRowClass(restricted))}>
                    <span className={t.approved ? "text-[hsl(var(--pk-good))]" : "text-[hsl(var(--pk-warn))]"}>{t.approved ? "Approved" : "Pending"}</span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className="text-[11.5px] text-[hsl(var(--pk-ink-faint))] mt-3">Only approved transactions are displayed, supported by valid source documents. Updated quarterly by Finance / Company Secretary.</p>
    </div>
  );
}
