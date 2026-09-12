import { useState } from "react";
import { ScreenHeader } from "@/components/pk/ScreenHeader";
import { FhTabs } from "@/components/pk/FhTabs";
import { FinancialResultsHistoryChart } from "@/components/pk/Charts";
import { PeriodPickerCompact, ComparePeriodsPicker, PeriodComparisonTable } from "@/components/pk/PeriodPicker";
import type { ScreenId } from "@/lib/nav";
import { useSession } from "@/lib/session";
import { useWorkflow } from "@/lib/workflow";
import { useCurrentPeriodId } from "@/lib/orgSettings";
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

      <div className="rounded-lg border border-[hsl(var(--pk-border))] bg-[hsl(var(--pk-surface))] shadow-card p-4 mb-5">
        <div className="font-head font-bold text-[hsl(var(--pk-ink))] mb-2">Overview of Financial Results</div>
        <FinancialResultsHistoryChart
          data={FINANCIAL_RESULTS_HISTORY}
          dividerBeforeIndex={FINANCIAL_RESULTS_HISTORY.length - 1}
          banner={[
            { label: "Old SJPP income recognition structure", from: 0, to: 2 },
            { label: "Impact from changes in SJPP income recognition structure", from: 3, to: FINANCIAL_RESULTS_HISTORY.length - 1 },
          ]}
        />
      </div>
    </div>
  );
}
