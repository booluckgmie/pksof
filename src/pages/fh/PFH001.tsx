import { ScreenHeader } from "@/components/pk/ScreenHeader";
import { FhTabs } from "@/components/pk/FhTabs";
import { StatusChip } from "@/components/pk/StatusChip";
import { StatCard } from "@/components/pk/Misc";
import { BarTrend, LineTrend } from "@/components/pk/Charts";
import { DurationFilterBar, useDurationFilter } from "@/components/pk/DurationFilter";
import type { ScreenId } from "@/lib/nav";
import { useSession } from "@/lib/session";
import { useWorkflow } from "@/lib/workflow";
import { useDetails } from "@/lib/details";

export function PFH001({ onNavigate }: { onNavigate: (id: ScreenId) => void }) {
  const { entityId, periodId } = useSession();
  const { latestValue } = useWorkflow();
  const { quarterlyTrend: fullTrend } = useDetails();
  const { duration, setDuration, filtered: quarterlyTrend } = useDurationFilter(fullTrend);
  const kpi1 = latestValue("KPI1", entityId, periodId);
  const kpi2 = latestValue("KPI2", entityId, periodId);
  const met = [kpi1, kpi2].filter((k) => k.status === "met").length;
  const overall = ((kpi1.weighted ?? 0) + (kpi2.weighted ?? 0)) / 0.25 * 100;

  return (
    <div>
      <ScreenHeader id="PFH001" subtitle="Consolidated executive overview of financial performance, profitability, efficiency and sustainability." onNavigate={onNavigate} />
      <FhTabs current="PFH001" onNavigate={onNavigate} />

      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 mb-5">
        <StatCard label="KPI Met" value={String(met)} tone="good" />
        <StatCard label="KPI Not Met" value={String(2 - met)} tone={met < 2 ? "bad" : "default"} />
        <StatCard label="Not Measurable" value="0" tone="pending" />
        <StatCard label="Total KPI" value="2" />
        <StatCard label="Overall Achievement" value={isFinite(overall) ? `${overall.toFixed(1)}%` : "—"} tone="good" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
        <div className="rounded-lg border border-[hsl(var(--pk-border))] bg-[hsl(var(--pk-surface))] shadow-card p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="font-head font-semibold text-[hsl(var(--pk-ink))]">KPI 1 — Profit Before Tax (PBT)</span>
            <StatusChip status={kpi1.status} />
          </div>
          <div className="flex items-baseline gap-3 text-sm">
            <span className="tnum text-lg font-semibold">{kpi1.ytdActual !== null ? `RM ${kpi1.ytdActual.toFixed(1)}m` : "—"}</span>
            <span className="text-[hsl(var(--pk-ink-faint))]">Target {kpi1.ytdTarget !== null ? `RM ${kpi1.ytdTarget.toFixed(1)}m` : "—"}</span>
            {kpi1.ytdActual !== null && kpi1.ytdTarget !== null && (
              <span className="text-[hsl(var(--pk-good))]">Variance +{(kpi1.ytdActual - kpi1.ytdTarget).toFixed(1)}</span>
            )}
          </div>
        </div>
        <div className="rounded-lg border border-[hsl(var(--pk-border))] bg-[hsl(var(--pk-surface))] shadow-card p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="font-head font-semibold text-[hsl(var(--pk-ink))]">KPI 2 — Cost-to-Income Ratio</span>
            <StatusChip status={kpi2.status} />
          </div>
          <div className="flex items-baseline gap-3 text-sm">
            <span className="tnum text-lg font-semibold">{kpi2.ytdActual !== null ? `${kpi2.ytdActual.toFixed(1)}%` : "—"}</span>
            <span className="text-[hsl(var(--pk-ink-faint))]">Target {kpi2.ytdTarget !== null ? `${kpi2.ytdTarget.toFixed(1)}%` : "—"}</span>
            {kpi2.ytdActual !== null && kpi2.ytdTarget !== null && (
              <span className="text-[hsl(var(--pk-good))]">Variance {(kpi2.ytdActual - kpi2.ytdTarget).toFixed(1)}</span>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between flex-wrap gap-1.5 mb-2">
        <div className="text-[11px] uppercase tracking-wide text-[hsl(var(--pk-ink-faint))]">Quarterly Trend Analysis</div>
        <DurationFilterBar duration={duration} onChange={setDuration} total={fullTrend.length} label="" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="rounded-lg border border-[hsl(var(--pk-border))] bg-[hsl(var(--pk-surface))] shadow-card p-4">
          <div className="text-xs font-medium text-[hsl(var(--pk-ink-soft))] mb-2">Profit Before Tax — RM Million</div>
          <BarTrend data={quarterlyTrend.map((q) => ({ label: q.period.replace(" FY", " '"), value: q.pbt }))} unit="m" />
        </div>
        <div className="rounded-lg border border-[hsl(var(--pk-border))] bg-[hsl(var(--pk-surface))] shadow-card p-4">
          <div className="text-xs font-medium text-[hsl(var(--pk-ink-soft))] mb-2">Cost-to-Income Ratio — %</div>
          <LineTrend data={quarterlyTrend.map((q) => ({ label: q.period.replace(" FY", " '"), value: q.cir }))} unit="%" />
        </div>
      </div>
      <p className="text-[11.5px] text-[hsl(var(--pk-ink-faint))] mt-3">Supporting indicators (excluded from KPI achievement): Net Profit Margin — profitability · Shareholders' Fund — sustainability.</p>
    </div>
  );
}
