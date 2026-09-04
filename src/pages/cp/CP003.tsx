import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { ScreenHeader } from "@/components/pk/ScreenHeader";
import { StatusChip } from "@/components/pk/StatusChip";
import { BarTrend, LineTrend } from "@/components/pk/Charts";
import { DataOriginBadge } from "@/components/pk/DataOrigin";
import { InfoTip } from "@/components/pk/InfoTip";
import { KpiMetricStrip } from "@/components/pk/KpiMetricStrip";
import { DurationFilterBar, useDurationFilter } from "@/components/pk/DurationFilter";
import { PeriodPickerCompact, ComparePeriodsPicker, PeriodComparisonTable } from "@/components/pk/PeriodPicker";
import { BreakdownTable } from "@/components/pk/BreakdownTable";
import type { ScreenId } from "@/lib/nav";
import { useSession } from "@/lib/session";
import { useWorkflow } from "@/lib/workflow";
import { useDetails } from "@/lib/details";
import { useKpiTargets } from "@/lib/kpiTargets";
import { kpiById } from "@/data/kpis";
import { periodById } from "@/data/periods";
import { cn } from "@/lib/utils";
import type { PeriodId } from "@/types";

export function CP003({ onNavigate }: { onNavigate: (id: ScreenId) => void }) {
  const { entityId, periodId, setPeriodId } = useSession();
  const { latestValue } = useWorkflow();
  const { quarterlyTrend: fullTrend, pbtBreakdown, cirBreakdown } = useDetails();
  const { getFyTarget } = useKpiTargets();
  const kpi1 = latestValue("KPI1", entityId, periodId);
  const kpi2 = latestValue("KPI2", entityId, periodId);
  const period = periodById(periodId);
  const fy = period.fy;
  const periodLabel = period.label.replace(" FY", " ");
  const kpi1FyTarget = getFyTarget("KPI1", fy);
  const kpi2FyTarget = getFyTarget("KPI2", fy);
  const { duration, setDuration, filtered: quarterlyTrend } = useDurationFilter(fullTrend);
  const [openBreakdown, setOpenBreakdown] = useState<{ pbt: boolean; cir: boolean }>({ pbt: false, cir: false });
  const [compareIds, setCompareIds] = useState<PeriodId[]>([]);

  const compareRows = [
    { label: "PBT — YTD Actual", get: (id: PeriodId) => { const r = latestValue("KPI1", entityId, id); return r.ytdActual !== null ? `RM ${r.ytdActual.toFixed(1)}m` : "—"; } },
    { label: "PBT — Weighted Achievement", get: (id: PeriodId) => { const r = latestValue("KPI1", entityId, id); return r.weighted !== null ? `${(r.weighted * 100).toFixed(1)}%` : "—"; } },
    { label: "Cost-to-Income Ratio — YTD Actual", get: (id: PeriodId) => { const r = latestValue("KPI2", entityId, id); return r.ytdActual !== null ? `${r.ytdActual.toFixed(1)}%` : "—"; } },
    { label: "Cost-to-Income Ratio — Weighted Achievement", get: (id: PeriodId) => { const r = latestValue("KPI2", entityId, id); return r.weighted !== null ? `${(r.weighted * 100).toFixed(1)}%` : "—"; } },
  ];

  return (
    <div>
      <ScreenHeader id="CP003" subtitle="Financial Perspective performance against approved targets for the year. Weight 25.0% · 2 KPIs." onNavigate={onNavigate} />

      <div className="mb-3 flex flex-wrap items-center gap-x-5 gap-y-2">
        <div className="flex items-center gap-2">
          <span className="text-[11px] text-[hsl(var(--pk-ink-faint))]">Reporting period</span>
          <PeriodPickerCompact periodId={periodId} onChange={setPeriodId} />
        </div>
        <DurationFilterBar duration={duration} onChange={setDuration} total={fullTrend.length} />
        <ComparePeriodsPicker selected={compareIds} onChange={setCompareIds} />
      </div>

      <PeriodComparisonTable periodIds={compareIds} rows={compareRows} onRemove={(id) => setCompareIds((prev) => prev.filter((x) => x !== id))} />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="rounded-lg border border-[hsl(var(--pk-border))] bg-[hsl(var(--pk-surface))] shadow-card p-4">
          <div className="flex items-center justify-between mb-1">
            <div>
              <div className="text-[11px] uppercase tracking-wide text-[hsl(var(--pk-ink-faint))]">KPI 1 · Weighted Achievement {kpi1.weighted !== null ? (kpi1.weighted * 100).toFixed(1) : "—"}%</div>
              <div className="font-head font-bold text-[hsl(var(--pk-ink))] inline-flex items-center gap-1.5">
                Profit Before Tax (PBT)
                <InfoTip title="Weighted Achievement">YTD Actual ÷ FY Target × Weight, capped at 12.5%.</InfoTip>
              </div>
            </div>
            <StatusChip status={kpi1.status} />
          </div>

          <KpiMetricStrip
            weight={`${(kpiById("KPI1").weight * 100).toFixed(1)}%`}
            fy={fy}
            periodLabel={periodLabel}
            fyTarget={`RM ${kpi1FyTarget.toFixed(1)}m`}
            ytdTarget={kpi1.ytdTarget !== null ? `RM ${kpi1.ytdTarget.toFixed(1)}m` : "—"}
            ytdActual={kpi1.ytdActual !== null ? `RM ${kpi1.ytdActual.toFixed(1)}m` : "—"}
          />

          <button
            type="button"
            onClick={() => setOpenBreakdown((s) => ({ ...s, pbt: !s.pbt }))}
            className="w-full text-left group"
            title="Click for the income-statement breakdown behind this figure"
          >
            <BarTrend data={quarterlyTrend.map((q) => ({ label: q.period.replace(" FY", " '"), value: q.pbt }))} unit="m" />
            <div className="flex items-center justify-center gap-1 text-[11px] text-[hsl(var(--pk-accent))] mt-1 group-hover:opacity-75 transition-opacity">
              {openBreakdown.pbt ? "Hide breakdown" : "Click chart for income-statement breakdown"}
              <ChevronDown className={cn("h-3 w-3 transition-transform", openBreakdown.pbt && "rotate-180")} />
            </div>
          </button>

          {openBreakdown.pbt && <div className="mt-2"><BreakdownTable rows={pbtBreakdown} unit="RM 'mil" /></div>}

          <div className="mt-2"><DataOriginBadge result={kpi1} /></div>
        </div>

        <div className="rounded-lg border border-[hsl(var(--pk-border))] bg-[hsl(var(--pk-surface))] shadow-card p-4">
          <div className="flex items-center justify-between mb-1">
            <div>
              <div className="text-[11px] uppercase tracking-wide text-[hsl(var(--pk-ink-faint))]">KPI 2 · Weighted Achievement {kpi2.weighted !== null ? (kpi2.weighted * 100).toFixed(1) : "—"}% · lower is better</div>
              <div className="font-head font-bold text-[hsl(var(--pk-ink))] inline-flex items-center gap-1.5">
                Cost-to-Income Ratio
                <InfoTip title="Weighted Achievement">FY Target ÷ YTD Actual × Weight, capped at 12.5% — a lower actual than target scores full achievement.</InfoTip>
              </div>
            </div>
            <StatusChip status={kpi2.status} />
          </div>

          <KpiMetricStrip
            weight={`${(kpiById("KPI2").weight * 100).toFixed(1)}%`}
            fy={fy}
            periodLabel={periodLabel}
            fyTarget={`${kpi2FyTarget.toFixed(1)}%`}
            ytdTarget={kpi2.ytdTarget !== null ? `${kpi2.ytdTarget.toFixed(1)}%` : "—"}
            ytdActual={kpi2.ytdActual !== null ? `${kpi2.ytdActual.toFixed(1)}%` : "—"}
          />

          <button
            type="button"
            onClick={() => setOpenBreakdown((s) => ({ ...s, cir: !s.cir }))}
            className="w-full text-left group"
            title="Click for the cost breakdown behind this figure"
          >
            <LineTrend data={quarterlyTrend.map((q) => ({ label: q.period.replace(" FY", " '"), value: q.cir }))} unit="%" />
            <div className="flex items-center justify-center gap-1 text-[11px] text-[hsl(var(--pk-accent))] mt-1 group-hover:opacity-75 transition-opacity">
              {openBreakdown.cir ? "Hide breakdown" : "Click chart for cost breakdown"}
              <ChevronDown className={cn("h-3 w-3 transition-transform", openBreakdown.cir && "rotate-180")} />
            </div>
          </button>

          {openBreakdown.cir && <div className="mt-2"><BreakdownTable rows={cirBreakdown} unit="RM 'mil" /></div>}

          <div className="mt-2"><DataOriginBadge result={kpi2} /></div>
        </div>
      </div>
    </div>
  );
}
