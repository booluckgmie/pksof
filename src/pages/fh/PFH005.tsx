import { Fragment } from "react";
import { Lock } from "lucide-react";
import { ScreenHeader } from "@/components/pk/ScreenHeader";
import { FhTabs } from "@/components/pk/FhTabs";
import { StatCard } from "@/components/pk/Misc";
import { pillarRowClass } from "@/components/pk/PillarGate";
import { cn } from "@/lib/utils";
import type { ScreenId } from "@/lib/nav";
import { useDetails } from "@/lib/details";
import { useSession } from "@/lib/session";

const fmt = (v: number | null) => (v === null ? "—" : v.toLocaleString("en-MY", { maximumFractionDigits: 0 }));

export function PFH005({ onNavigate }: { onNavigate: (id: ScreenId) => void }) {
  const { isRestrictedPillar, homeEntityName } = useSession();
  const { relatedPartyTransactions } = useDetails();
  const { periods: rptPeriods, items } = relatedPartyTransactions;
  const latest = items.map((it) => it.valuesByPeriod[0] ?? 0);
  const total = latest.reduce((s, v) => s + v, 0);

  // Group into category -> subheading -> line items, preserving the order the data arrived in.
  const categories = [...new Set(items.map((it) => it.category))];
  const grouped = categories.map((category) => {
    const rows = items.filter((it) => it.category === category);
    const subheadings = [...new Set(rows.map((it) => it.subheading))];
    return { category, subheadings: subheadings.map((subheading) => ({ subheading, rows: rows.filter((it) => it.subheading === subheading) })) };
  });

  return (
    <div>
      <ScreenHeader id="PFH005" subtitle="RPT monitoring, arm's-length compliance and Board approval status." onNavigate={onNavigate} />
      <FhTabs current="PFH005" onNavigate={onNavigate} />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mb-5">
        <StatCard label={`Total RPT Value, RM'000 (${rptPeriods[0]?.label ?? "latest quarter"})`} value={fmt(total)} />
        <StatCard label="Line Items" value={String(items.length)} />
      </div>

      {isRestrictedPillar && (
        <div className="flex items-center gap-1.5 text-[11px] text-[hsl(var(--pk-ink-faint))] mb-2">
          <Lock className="h-3 w-3" />Transactions involving other related parties are blurred — only {homeEntityName}'s are visible to your pillar
        </div>
      )}
      <p className="text-[12.5px] text-[hsl(var(--pk-ink-soft))] mb-2">The significant related party transactions of the Company are shown below.</p>
      <div className="rounded-lg border border-[hsl(var(--pk-border))] bg-[hsl(var(--pk-surface))] shadow-card overflow-x-auto">
        <table className="w-full text-sm min-w-[520px]">
          <thead>
            <tr className="text-[11px] uppercase tracking-wide text-white bg-[hsl(var(--pk-navy))]">
              <th className="text-left font-medium px-3 py-2.5">RM'000</th>
              {rptPeriods.map((p) => (
                <th key={p.id} className="text-right font-medium px-3 py-2.5">{p.label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {grouped.map((g) => (
              <Fragment key={g.category}>
                <tr className="border-t-2 border-[hsl(var(--pk-border))]">
                  <td className="px-3 pt-3 pb-1 font-bold text-[hsl(var(--pk-ink))]" colSpan={rptPeriods.length + 1}>{g.category}</td>
                </tr>
                {g.subheadings.map((sh) => (
                  <Fragment key={sh.subheading}>
                    <tr>
                      <td className="px-3 pt-1.5 pb-0.5 text-[hsl(var(--pk-ink-soft))]" colSpan={rptPeriods.length + 1}>{sh.subheading}:</td>
                    </tr>
                    {sh.rows.map((it) => {
                      const restricted = isRestrictedPillar && it.party !== homeEntityName;
                      return (
                        <tr key={it.party} className={cn("hover:bg-[hsl(var(--pk-surface-2))]", pillarRowClass(restricted))}>
                          <td className="px-3 py-1.5 pl-6 text-[hsl(var(--pk-ink-soft))]">
                            <span className="inline-flex items-center gap-1.5">
                              - {it.party}
                              {restricted && <Lock className="h-3 w-3 text-[hsl(var(--pk-ink-faint))]" />}
                            </span>
                          </td>
                          {it.valuesByPeriod.map((v, j) => (
                            <td key={rptPeriods[j].id} className="text-right px-3 py-1.5 tnum">{restricted ? "—" : fmt(v)}</td>
                          ))}
                        </tr>
                      );
                    })}
                  </Fragment>
                ))}
              </Fragment>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-[11.5px] text-[hsl(var(--pk-ink-faint))] mt-3">Only approved transactions are displayed, supported by valid source documents. Updated quarterly by Finance / Company Secretary.</p>
    </div>
  );
}
