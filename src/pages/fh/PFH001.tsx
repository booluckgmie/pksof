import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { ScreenHeader } from "@/components/pk/ScreenHeader";
import { FhTabs } from "@/components/pk/FhTabs";
import { StatusChip } from "@/components/pk/StatusChip";
import { StatCard } from "@/components/pk/Misc";
import { BarTrend, LineTrend } from "@/components/pk/Charts";
import { BreakdownTable } from "@/components/pk/BreakdownTable";
import { DurationFilterBar, useDurationFilter } from "@/components/pk/DurationFilter";
import { PeriodPickerCompact, ComparePeriodsPicker, PeriodComparisonTable } from "@/components/pk/PeriodPicker";
import { cn } from "@/lib/utils";
import type { ScreenId } from "@/lib/nav";
import { useSession } from "@/lib/session";
import { useWorkflow } from "@/lib/workflow";
import { useDetails } from "@/lib/details";
import type { PeriodId } from "@/types";

export function PFH001({ onNavigate }: { onNavigate: (id: ScreenId) => void }) {
  const { entityId, periodId, setPeriodId } = useSession();
  const [compareIds, setCompareIds] = useState<PeriodId[]>([]);
  const [openBreakdown, setOpenBreakdown] = useState<{ pbt: boolean; cir: boolean }>({ pbt: false, cir: false });
  const { latestValue } = useWorkflow();
  const { quarterlyTrend: fullTrend, pbtBreakdown, cirBreakdown } = useDetails();
  const { duration, setDuration, filtered: quarterlyTrend } = useDurationFilter(fullTrend);
  const kpi1 = latestValue("KPI1", entityId, periodId);
  const kpi2 = latestValue("KPI2", entityId, periodId);
  const met = [kpi1, kpi2].filter((k) => k.status === "met").length;
  const overall = ((kpi1.weighted ?? 0) + (kpi2.weighted ?? 0)) / 0.25 * 100;

  return (
    <div>
      <ScreenHeader id="PFH001" subtitle="Consolidated executive overview of financial performance, profitability, efficiency and sustainability." onNavigate={onNavigate} />
      <FhTabs current="PFH001" onNavigate={onNavigate} />

      <div className="mb-4 flex flex-wrap items-center gap-x-5 gap-y-2">
        <div className="flex items-center gap-2">
          <span className="text-[11px] text-[hsl(var(--pk-ink-faint))]">Reporting period</span>
          <PeriodPickerCompact periodId={periodId} onChange={setPeriodId} />
        </div>
        <ComparePeriodsPicker selected={compareIds} onChange={setCompareIds} />
      </div>

      <PeriodComparisonTable
        periodIds={compareIds}
        onRemove={(id) => setCompareIds((prev) => prev.filter((x) => x !== id))}
        rows={[
          { label: "Profit Before Tax — YTD Actual", get: (id) => { const r = latestValue("KPI1", entityId, id); return r.ytdActual !== null ? `RM ${r.ytdActual.toFixed(1)}m` : "—"; } },
          { label: "Profit Before Tax — Weighted Achievement", get: (id) => { const r = latestValue("KPI1", entityId, id); return r.weighted !== null ? `${(r.weighted * 100).toFixed(1)}%` : "—"; } },
          { label: "Cost-to-Income Ratio — YTD Actual", get: (id) => { const r = latestValue("KPI2", entityId, id); return r.ytdActual !== null ? `${r.ytdActual.toFixed(1)}%` : "—"; } },
          { label: "Cost-to-Income Ratio — Weighted Achievement", get: (id) => { const r = latestValue("KPI2", entityId, id); return r.weighted !== null ? `${(r.weighted * 100).toFixed(1)}%` : "—"; } },
        ]}
      />

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
            <span className="font-head font-bold text-[hsl(var(--pk-ink))]">KPI 1 — Profit Before Tax (PBT)</span>
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
            <span className="font-head font-bold text-[hsl(var(--pk-ink))]">KPI 2 — Cost-to-Income Ratio</span>
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
          <div className="text-xs font-bold underline text-[hsl(var(--pk-ink-soft))] mb-2">Profit Before Tax — RM Million</div>
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
        </div>
        <div className="rounded-lg border border-[hsl(var(--pk-border))] bg-[hsl(var(--pk-surface))] shadow-card p-4">
          <div className="text-xs font-bold underline text-[hsl(var(--pk-ink-soft))] mb-2">Cost-to-Income Ratio — %</div>
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
        </div>
      </div>
      <p className="text-[11.5px] text-[hsl(var(--pk-ink-faint))] mt-3">Supporting indicators (excluded from KPI achievement): Net Profit Margin — profitability · Shareholders' Fund — sustainability.</p>
    </div>
  );
}
