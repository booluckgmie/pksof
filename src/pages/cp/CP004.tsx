import { Lock, ChevronRight } from "lucide-react";
import { ScreenHeader } from "@/components/pk/ScreenHeader";
import { StatusChip } from "@/components/pk/StatusChip";
import { InfoTip } from "@/components/pk/InfoTip";
import { pillarRowClass } from "@/components/pk/PillarGate";
import { cn } from "@/lib/utils";
import type { ScreenId } from "@/lib/nav";
import { useSession } from "@/lib/session";
import { useWorkflow } from "@/lib/workflow";
import { useDetails } from "@/lib/details";
import { entities } from "@/data/entities";

export function CP004({ onNavigate }: { onNavigate: (id: ScreenId) => void }) {
  const { entityId, periodId, isRestrictedPillar, homeEntityName, setEntityId } = useSession();
  const { latestValue } = useWorkflow();
  const { managedEntityRatings, governanceIndex } = useDetails();
  const kpi3 = latestValue("KPI3", entityId, periodId);
  const kpi4 = latestValue("KPI4", entityId, periodId);

  return (
    <div>
      <ScreenHeader id="CP004" subtitle="Mandate & Governance performance, including the managed-entity KPI summary. Weight 15.0%." onNavigate={onNavigate} />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div className="rounded-lg border border-[hsl(var(--pk-border))] bg-[hsl(var(--pk-surface))] shadow-card p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="text-[11px] uppercase tracking-wide text-[hsl(var(--pk-ink-faint))]">KPI 3 · Weight 7.5%</div>
            <StatusChip status={kpi3.status} />
          </div>
          <div className="font-head font-semibold text-[hsl(var(--pk-ink))] mb-2 inline-flex items-center gap-1.5">
            Managed Entities Rating
            <InfoTip title="Weighted Achievement">YTD Actual ÷ FY Target × Weight, capped at 7.5%. Rolled up from each Managed Entity's own quarterly rating.</InfoTip>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="tnum font-head text-2xl font-semibold">{kpi3.ytdActual !== null ? kpi3.ytdActual.toFixed(1) : "—"}</span>
            <span className="text-sm text-[hsl(var(--pk-ink-faint))]">/ target {kpi3.ytdTarget ?? "—"}</span>
          </div>
        </div>
        <div className="rounded-lg border border-[hsl(var(--pk-border))] bg-[hsl(var(--pk-surface))] shadow-card p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="text-[11px] uppercase tracking-wide text-[hsl(var(--pk-ink-faint))]">KPI 4 · Weight 7.5%</div>
            <StatusChip status={kpi4.status} />
          </div>
          <div className="font-head font-semibold text-[hsl(var(--pk-ink))] mb-2 inline-flex items-center gap-1.5">
            Governance Index
            <InfoTip title="Not Measurable KPIs">Do not reduce achievement — progress updates run until the annual assessment. Full assessment scheduled Q4 FY2026.</InfoTip>
          </div>
          <p className="text-xs text-[hsl(var(--pk-ink-faint))]">Full annual assessment scheduled Q4 FY2026 — components below report progress only.</p>
        </div>
      </div>

      <div className="flex items-center justify-between mb-2">
        <div className="text-[11px] uppercase tracking-wide text-[hsl(var(--pk-ink-faint))]">Managed Entities Performance Summary</div>
        {isRestrictedPillar && (
          <span className="flex items-center gap-1.5 text-[11px] text-[hsl(var(--pk-ink-faint))]">
            <Lock className="h-3 w-3" />Only {homeEntityName} is visible to your pillar
          </span>
        )}
      </div>
      <div className="rounded-lg border border-[hsl(var(--pk-border))] bg-[hsl(var(--pk-surface))] shadow-card overflow-x-auto mb-4">
        <table className="w-full text-sm min-w-[560px]">
          <thead>
            <tr className="text-[11px] uppercase tracking-wide text-[hsl(var(--pk-ink-faint))] bg-[hsl(var(--pk-surface-2))]">
              <th className="text-left font-medium px-3 py-2">Entity</th>
              <th className="text-right font-medium px-3 py-2">KPI Met</th>
              <th className="text-right font-medium px-3 py-2">Not Met</th>
              <th className="text-right font-medium px-3 py-2">Not Measured</th>
              <th className="text-right font-medium px-3 py-2">Achievement</th>
              <th className="text-left font-medium px-3 py-2">Status</th>
            </tr>
          </thead>
          <tbody>
            {managedEntityRatings.map((r) => {
              const restricted = isRestrictedPillar && r.entity !== homeEntityName;
              const target = entities.find((e) => e.name === r.entity);
              const clickable = !restricted && !!target;
              return (
                <tr
                  key={r.entity}
                  onClick={clickable ? () => { setEntityId(target.id); onNavigate("MAIN"); } : undefined}
                  className={cn("border-t border-[hsl(var(--pk-border))]", clickable && "cursor-pointer hover:bg-[hsl(var(--pk-surface-2))]")}
                >
                  <td className={cn("px-3 py-2 font-medium text-[hsl(var(--pk-ink))]", pillarRowClass(restricted))}>
                    <span className="inline-flex items-center gap-1.5">
                      {r.entity}
                      {restricted && <Lock className="h-3 w-3 text-[hsl(var(--pk-ink-faint))]" />}
                      {clickable && <ChevronRight className="h-3 w-3 text-[hsl(var(--pk-ink-faint))]" />}
                    </span>
                  </td>
                  <td className={cn("px-3 py-2 text-right tnum text-[hsl(var(--pk-good))]", pillarRowClass(restricted))}>{r.met}</td>
                  <td className={cn("px-3 py-2 text-right tnum text-[hsl(var(--pk-bad))]", pillarRowClass(restricted))}>{r.notMet}</td>
                  <td className={cn("px-3 py-2 text-right tnum text-[hsl(var(--pk-pending))]", pillarRowClass(restricted))}>{r.notMeasured}</td>
                  <td className={cn("px-3 py-2 text-right tnum font-semibold", pillarRowClass(restricted))}>{r.achievement}%</td>
                  <td className={cn("px-3 py-2", pillarRowClass(restricted))}><StatusChip status={r.status === "On track" ? "met" : "warn"} label={r.status} /></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="text-[11px] uppercase tracking-wide text-[hsl(var(--pk-ink-faint))] mb-2">Governance Index — Progress Updates</div>
      <div className="rounded-lg border border-[hsl(var(--pk-border))] bg-[hsl(var(--pk-surface))] shadow-card divide-y divide-[hsl(var(--pk-border))] mb-4">
        {governanceIndex.map((g) => (
          <div key={g.item} className="flex items-center justify-between px-4 py-2.5 text-sm">
            <span className="text-[hsl(var(--pk-ink-soft))]">{g.item}</span>
            <span className="text-[11.5px] text-[hsl(var(--pk-ink-faint))]">{g.note}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
