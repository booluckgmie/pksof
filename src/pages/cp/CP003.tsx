import { ScreenHeader } from "@/components/pk/ScreenHeader";
import { StatusChip } from "@/components/pk/StatusChip";
import { BarTrend, LineTrend } from "@/components/pk/Charts";
import { DataOriginBadge } from "@/components/pk/DataOrigin";
import { InfoTip } from "@/components/pk/InfoTip";
import { DurationFilterBar, useDurationFilter } from "@/components/pk/DurationFilter";
import type { ScreenId } from "@/lib/nav";
import { useSession } from "@/lib/session";
import { useWorkflow } from "@/lib/workflow";
import { useDetails } from "@/lib/details";
import { useKpiTargets } from "@/lib/kpiTargets";
import { periodById } from "@/data/periods";

export function CP003({ onNavigate }: { onNavigate: (id: ScreenId) => void }) {
  const { entityId, periodId } = useSession();
  const { latestValue } = useWorkflow();
  const { quarterlyTrend: fullTrend } = useDetails();
  const { getFyTarget } = useKpiTargets();
  const kpi1 = latestValue("KPI1", entityId, periodId);
  const kpi2 = latestValue("KPI2", entityId, periodId);
  const fy = periodById(periodId).fy;
  const kpi1FyTarget = getFyTarget("KPI1", fy);
  const kpi2FyTarget = getFyTarget("KPI2", fy);
  const { duration, setDuration, filtered: quarterlyTrend } = useDurationFilter(fullTrend);

  return (
    <div>
      <ScreenHeader id="CP003" subtitle="Financial Perspective performance against approved targets for the year. Weight 25.0% · 2 KPIs." onNavigate={onNavigate} />

      <DurationFilterBar duration={duration} onChange={setDuration} total={fullTrend.length} className="mb-4" />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="rounded-lg border border-[hsl(var(--pk-border))] bg-[hsl(var(--pk-surface))] shadow-card p-4">
          <div className="flex items-center justify-between mb-1">
            <div>
              <div className="text-[11px] uppercase tracking-wide text-[hsl(var(--pk-ink-faint))]">KPI 1 · Weight 12.5%</div>
              <div className="font-head font-semibold text-[hsl(var(--pk-ink))] inline-flex items-center gap-1.5">
                Profit Before Tax (PBT)
                <InfoTip title="Weighted Achievement">YTD Actual ÷ FY Target × Weight, capped at 12.5%.</InfoTip>
              </div>
            </div>
            <StatusChip status={kpi1.status} />
          </div>
          <div className="grid grid-cols-3 gap-2 my-3 text-center">
            <div><div className="text-[10px] text-[hsl(var(--pk-ink-faint))]">FY Target</div><div className="tnum font-semibold">RM {kpi1FyTarget.toFixed(1)}m</div></div>
            <div><div className="text-[10px] text-[hsl(var(--pk-ink-faint))]">YTD Target</div><div className="tnum font-semibold">{kpi1.ytdTarget !== null ? `RM ${kpi1.ytdTarget.toFixed(1)}m` : "—"}</div></div>
            <div><div className="text-[10px] text-[hsl(var(--pk-ink-faint))]">YTD Actual</div><div className="tnum font-semibold text-[hsl(var(--pk-good))]">{kpi1.ytdActual !== null ? `RM ${kpi1.ytdActual.toFixed(1)}m` : "—"}</div></div>
          </div>
          <BarTrend data={quarterlyTrend.map((q) => ({ label: q.period.replace(" FY", " '"), value: q.pbt }))} unit="m" />
          <div className="mt-2"><DataOriginBadge result={kpi1} /></div>
        </div>

        <div className="rounded-lg border border-[hsl(var(--pk-border))] bg-[hsl(var(--pk-surface))] shadow-card p-4">
          <div className="flex items-center justify-between mb-1">
            <div>
              <div className="text-[11px] uppercase tracking-wide text-[hsl(var(--pk-ink-faint))]">KPI 2 · Weight 12.5% · lower is better</div>
              <div className="font-head font-semibold text-[hsl(var(--pk-ink))] inline-flex items-center gap-1.5">
                Cost-to-Income Ratio
                <InfoTip title="Weighted Achievement">FY Target ÷ YTD Actual × Weight, capped at 12.5% — a lower actual than target scores full achievement.</InfoTip>
              </div>
            </div>
            <StatusChip status={kpi2.status} />
          </div>
          <div className="grid grid-cols-3 gap-2 my-3 text-center">
            <div><div className="text-[10px] text-[hsl(var(--pk-ink-faint))]">FY Target</div><div className="tnum font-semibold">{kpi2FyTarget.toFixed(1)}%</div></div>
            <div><div className="text-[10px] text-[hsl(var(--pk-ink-faint))]">YTD Target</div><div className="tnum font-semibold">{kpi2.ytdTarget !== null ? `${kpi2.ytdTarget.toFixed(1)}%` : "—"}</div></div>
            <div><div className="text-[10px] text-[hsl(var(--pk-ink-faint))]">YTD Actual</div><div className="tnum font-semibold text-[hsl(var(--pk-good))]">{kpi2.ytdActual !== null ? `${kpi2.ytdActual.toFixed(1)}%` : "—"}</div></div>
          </div>
          <LineTrend data={quarterlyTrend.map((q) => ({ label: q.period.replace(" FY", " '"), value: q.cir }))} unit="%" />
          <div className="mt-2"><DataOriginBadge result={kpi2} /></div>
        </div>
      </div>
    </div>
  );
}
