import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { ScreenHeader } from "@/components/pk/ScreenHeader";
import { FhTabs } from "@/components/pk/FhTabs";
import { StatusChip } from "@/components/pk/StatusChip";
import { BarTrend, LineTrend, FinancialResultsHistoryChart } from "@/components/pk/Charts";
import { InfoTip } from "@/components/pk/InfoTip";
import { KpiMetricStrip } from "@/components/pk/KpiMetricStrip";
import { DurationFilterBar, useDurationFilter } from "@/components/pk/DurationFilter";
import { PeriodPickerCompact, ComparePeriodsPicker, PeriodComparisonTable } from "@/components/pk/PeriodPicker";
import { BreakdownTable } from "@/components/pk/BreakdownTable";
import { DownloadableFrame } from "@/components/pk/DownloadableFrame";
import { cn } from "@/lib/utils";
import type { ScreenId } from "@/lib/nav";
import { useSession } from "@/lib/session";
import { useWorkflow } from "@/lib/workflow";
import { useDetails } from "@/lib/details";
import { useKpiTargets } from "@/lib/kpiTargets";
import { useCurrentPeriodId } from "@/lib/orgSettings";
import { kpiById } from "@/data/kpis";
import { periodById } from "@/data/periods";
import type { PeriodId } from "@/types";

/** The client's own historical "Overview of Financial Results" exhibit — Revenue/PBT by
 * quarter since 1Q FY2023. Fixed historical figures, independent of the period-driven
 * Supabase dataset (like RP001A's Grade Code Detail listing). */
const FINANCIAL_RESULTS_HISTORY = [
  { label: "1Q FY2023", revenue: 55.6, pbt: 45.3, faded: true },
  { label: "2Q FY2023", revenue: 67.7, pbt: 59.3, faded: true },
  { label: "3Q FY2023", revenue: 52.4, pbt: 41.7, faded: true },
  { label: "4Q FY2023", revenue: 23.6, pbt: 11.9 },
  { label: "1Q FY2024", revenue: 34.5, pbt: 22.5 },
  { label: "2Q FY2024", revenue: 36.1, pbt: 27.5 },
  { label: "3Q FY2024", revenue: 40.1, pbt: 27.0 },
  { label: "4Q FY2024", revenue: 42.7, pbt: 29.3 },
  { label: "1Q FY2025", revenue: 40.4, pbt: 27.7 },
  { label: "2Q FY2025", revenue: 44.0, pbt: 33.0 },
  { label: "3Q FY2025", revenue: 44.1, pbt: 30.9 },
  { label: "4Q FY2025", revenue: 56.4, pbt: 41.0 },
  { label: "1Q FY2026", revenue: 46.7, pbt: 31.6 },
];

export function PFH001({ onNavigate }: { onNavigate: (id: ScreenId) => void }) {
  const { entityId } = useSession();
  // Local to this screen only — see CP003's own Reporting period filter for why.
  const [periodId, setPeriodId] = useState<PeriodId>(useCurrentPeriodId());
  const [compareIds, setCompareIds] = useState<PeriodId[]>([]);
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

  return (
    <div>
      <ScreenHeader
        id="PFH001"
        subtitle="Consolidated executive overview of financial performance, profitability, efficiency and sustainability."
        periodId={periodId}
        onNavigate={onNavigate}
        right={
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
            <div className="flex items-center gap-2">
              <span className="text-2xs text-[hsl(var(--pk-ink-faint))]">Reporting period</span>
              <PeriodPickerCompact periodId={periodId} onChange={setPeriodId} />
            </div>
            <ComparePeriodsPicker selected={compareIds} onChange={setCompareIds} />
          </div>
        }
      />
      <FhTabs current="PFH001" onNavigate={onNavigate} />

      {compareIds.length > 0 && (
        <DownloadableFrame filename="pfh001-period-comparison">
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
        </DownloadableFrame>
      )}

      <div className="rounded-lg border border-[hsl(var(--pk-border))] bg-[hsl(var(--pk-surface))] shadow-card p-4 mb-5">
        <div className="font-head font-bold text-[hsl(var(--pk-ink))] mb-2">Overview of Financial Results</div>
        <DownloadableFrame
          filename="pfh001-overview-of-financial-results"
          csvData={{
            headers: ["Period", "Revenue (RM mil)", "PBT (RM mil)"],
            rows: FINANCIAL_RESULTS_HISTORY.map((h) => [h.label, h.revenue, h.pbt]),
          }}
        >
          <FinancialResultsHistoryChart
            data={FINANCIAL_RESULTS_HISTORY}
            dividerBeforeIndex={FINANCIAL_RESULTS_HISTORY.length - 1}
            banner={[
              { label: "Old SJPP income recognition structure", from: 0, to: 2 },
              { label: "Impact from changes in SJPP income recognition structure", from: 3, to: FINANCIAL_RESULTS_HISTORY.length - 1 },
            ]}
          />
        </DownloadableFrame>
      </div>

      {/* KPI 1 / KPI 2 detail — the same two cards as CP003's own Financial Perspective screen,
          so a Financial Health viewer sees PBT/CIR's own quarterly trend and breakdown without
          leaving this overview. */}
      <div className="mb-3">
        <DurationFilterBar duration={duration} onChange={setDuration} total={fullTrend.length} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="rounded-lg border border-[hsl(var(--pk-border))] bg-[hsl(var(--pk-surface))] shadow-card p-4">
          <div className="flex items-center justify-between mb-1">
            <div>
              <div className="text-2xs font-bold uppercase tracking-wide text-[hsl(var(--pk-ink-faint))]">KPI 1 · Weight {(kpiById("KPI1").weight * 100).toFixed(1)}%</div>
              <div className="font-head font-bold text-[hsl(var(--pk-ink))] inline-flex items-center gap-1.5">
                Profit Before Tax (PBT)
                <InfoTip title="Profit Before Tax (PBT)">{kpiById("KPI1").generalDescription}</InfoTip>
              </div>
            </div>
            <StatusChip status={kpi1.status} />
          </div>

          <KpiMetricStrip
            fy={fy}
            periodLabel={periodLabel}
            fyTarget={`RM ${kpi1FyTarget.toFixed(1)}m`}
            ytdTarget={kpi1.ytdTarget !== null ? `RM ${kpi1.ytdTarget.toFixed(1)}m` : "—"}
            ytdActual={kpi1.ytdActual !== null ? `RM ${kpi1.ytdActual.toFixed(1)}m` : "—"}
            achievement={kpi1.weighted !== null ? `${(kpi1.weighted * 100).toFixed(1)}%` : "—"}
            status={kpi1.status}
          />

          <button
            type="button"
            onClick={() => setOpenBreakdown((s) => ({ ...s, pbt: !s.pbt }))}
            className="w-full text-left group"
            title="Click for the income-statement breakdown behind this figure"
          >
            <BarTrend data={quarterlyTrend.map((q) => ({ label: q.period.replace(" FY", " '"), value: q.pbt }))} unit="m" />
            <div className="flex items-center justify-center gap-1 text-2xs text-[hsl(var(--pk-accent))] mt-1 group-hover:opacity-75 transition-opacity">
              {openBreakdown.pbt ? "Hide breakdown" : "Click chart for income-statement breakdown"}
              <ChevronDown className={cn("h-3 w-3 transition-transform", openBreakdown.pbt && "rotate-180")} />
            </div>
          </button>

          {openBreakdown.pbt && (
            <div className="mt-2">
              {pbtBreakdown.length > 0 ? (
                <DownloadableFrame filename="pfh001-pbt-breakdown">
                  <BreakdownTable rows={pbtBreakdown} unit="RM 'mil" />
                </DownloadableFrame>
              ) : (
                <BreakdownTable rows={pbtBreakdown} unit="RM 'mil" />
              )}
            </div>
          )}
        </div>

        <div className="rounded-lg border border-[hsl(var(--pk-border))] bg-[hsl(var(--pk-surface))] shadow-card p-4">
          <div className="flex items-center justify-between mb-1">
            <div>
              <div className="text-2xs font-bold uppercase tracking-wide text-[hsl(var(--pk-ink-faint))]">KPI 2 · Weight {(kpiById("KPI2").weight * 100).toFixed(1)}%</div>
              <div className="font-head font-bold text-[hsl(var(--pk-ink))] inline-flex items-center gap-1.5">
                Cost-to-Income Ratio
                <InfoTip title="Cost-to-Income Ratio">{kpiById("KPI2").generalDescription}</InfoTip>
              </div>
            </div>
            <StatusChip status={kpi2.status} />
          </div>

          <KpiMetricStrip
            fy={fy}
            periodLabel={periodLabel}
            fyTarget={`${kpi2FyTarget.toFixed(1)}%`}
            ytdTarget={kpi2.ytdTarget !== null ? `${kpi2.ytdTarget.toFixed(1)}%` : "—"}
            ytdActual={kpi2.ytdActual !== null ? `${kpi2.ytdActual.toFixed(1)}%` : "—"}
            achievement={kpi2.weighted !== null ? `${(kpi2.weighted * 100).toFixed(1)}%` : "—"}
            status={kpi2.status}
          />

          <button
            type="button"
            onClick={() => setOpenBreakdown((s) => ({ ...s, cir: !s.cir }))}
            className="w-full text-left group"
            title="Click for the cost breakdown behind this figure"
          >
            <LineTrend data={quarterlyTrend.map((q) => ({ label: q.period.replace(" FY", " '"), value: q.cir }))} unit="%" />
            <div className="flex items-center justify-center gap-1 text-2xs text-[hsl(var(--pk-accent))] mt-1 group-hover:opacity-75 transition-opacity">
              {openBreakdown.cir ? "Hide breakdown" : "Click chart for cost breakdown"}
              <ChevronDown className={cn("h-3 w-3 transition-transform", openBreakdown.cir && "rotate-180")} />
            </div>
          </button>

          {openBreakdown.cir && (
            <div className="mt-2">
              {cirBreakdown.length > 0 ? (
                <DownloadableFrame filename="pfh001-cir-breakdown">
                  <BreakdownTable rows={cirBreakdown} unit="RM 'mil" />
                </DownloadableFrame>
              ) : (
                <BreakdownTable rows={cirBreakdown} unit="RM 'mil" />
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
