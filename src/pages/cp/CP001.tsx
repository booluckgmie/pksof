import { ScreenHeader } from "@/components/pk/ScreenHeader";
import { Gauge } from "@/components/pk/Gauge";
import { KpiPerformanceTable } from "@/components/pk/KpiPerformanceTable";
import { DownloadableFrame } from "@/components/pk/DownloadableFrame";
import { InfoTip } from "@/components/pk/InfoTip";
import { FinancialYearQuarterPicker, useLocalPeriodId } from "@/components/pk/PeriodPicker";
import type { ScreenId } from "@/lib/nav";
import { useSession } from "@/lib/session";
import { useWorkflow } from "@/lib/workflow";
import { kpis } from "@/data/kpis";
import { periodById, periods } from "@/data/periods";
import { cn } from "@/lib/utils";
import type { PeriodId } from "@/types";

export function CP001({ onNavigate }: { onNavigate: (id: ScreenId) => void }) {
  const { entityId } = useSession();
  const [periodId, setPeriodId] = useLocalPeriodId();
  const { latestValue } = useWorkflow();
  const period = periodById(periodId);
  const getResult = (kpiId: string) => latestValue(kpiId, entityId, periodId);

  const overall = kpis.reduce((sum, k) => sum + (getResult(k.id).weighted ?? 0), 0) * 100;

  // The 4 quarters of the selected period's own FY, in order — each column below is that
  // quarter's own cumulative/MOF threshold, and its own Result once reached (quarter <=
  // the one currently picked), so the table fills in left-to-right as the picker advances
  // instead of only ever showing one static "YTD" column next to 3 always-N/A placeholders.
  const fyQuarters = periods.filter((p) => p.fy === period.fy).sort((a, b) => a.quarter - b.quarter);
  const weightedFor = (qId: PeriodId) => kpis.reduce((sum, k) => sum + (latestValue(k.id, entityId, qId).weighted ?? 0), 0) * 100;

  return (
    <div>
      <ScreenHeader id="CP001" subtitle="Consolidated achievement across all six Strategic Perspectives, with drill-down to KPI detail." onNavigate={onNavigate} periodId={periodId} right={<FinancialYearQuarterPicker periodId={periodId} onChange={setPeriodId} />} />

      <div className="w-full rounded-lg border border-[hsl(var(--pk-border))] bg-[hsl(var(--pk-surface))] shadow-card p-5 flex flex-col md:flex-row items-center gap-6 mb-6">
        <Gauge value={overall} cumulativeThreshold={period.cumulativeThreshold} mofThreshold={period.mofThreshold} label="YTD achievement" size={220} />
        <div className="flex-1 w-full overflow-x-auto">
          <DownloadableFrame filename="cp001-ytd-achievement-thresholds">
          <table className="w-full text-sm min-w-[420px]">
            <thead>
              <tr className="text-2xs uppercase tracking-wide text-white bg-[hsl(var(--pk-navy))]">
                <th className="text-left font-medium px-2 py-1.5">Metric</th>
                {fyQuarters.map((q) => (
                  <th key={q.id} className="text-right font-medium px-2 py-1.5">Q{q.quarter}</th>
                ))}
              </tr>
            </thead>
            <tbody className="tnum">
              <tr className="border-t border-[hsl(var(--pk-border))]">
                <td className="px-2 py-1.5 text-[hsl(var(--pk-ink-soft))]">Cumulative Threshold</td>
                {fyQuarters.map((q) => (
                  <td key={q.id} className={cn("text-right px-2 py-1.5", q.quarter > period.quarter && "text-[hsl(var(--pk-ink-faint))]")}>{(q.cumulativeThreshold * 100).toFixed(1)}%</td>
                ))}
              </tr>
              <tr className="border-t border-[hsl(var(--pk-border))]">
                <td className="px-2 py-1.5 text-[hsl(var(--pk-ink-soft))]">MOF's Threshold</td>
                {fyQuarters.map((q) => (
                  <td key={q.id} className={cn("text-right px-2 py-1.5", q.quarter > period.quarter && "text-[hsl(var(--pk-ink-faint))]")}>{(q.mofThreshold * 100).toFixed(1)}%</td>
                ))}
              </tr>
              <tr className="border-t border-[hsl(var(--pk-border))] font-semibold">
                <td className="px-2 py-1.5 text-[hsl(var(--pk-ink))]">
                  <span className="inline-flex items-center gap-1.5">
                    Result (Weighted Achievement)
                    <InfoTip title="Weighted Achievement">
                      Overall Score: Total weighted contribution across all 13 KPIs, reflecting the Group's combined performance against its approved annual targets.
                    </InfoTip>
                  </span>
                </td>
                {fyQuarters.map((q) =>
                  q.quarter <= period.quarter ? (
                    <td key={q.id} className="text-right px-2 py-1.5 text-[hsl(var(--pk-good))]">{(q.id === periodId ? overall : weightedFor(q.id)).toFixed(1)}%</td>
                  ) : (
                    <td key={q.id} className="text-right px-2 py-1.5 text-[hsl(var(--pk-ink-faint))]">N/A</td>
                  )
                )}
              </tr>
            </tbody>
          </table>
          </DownloadableFrame>
        </div>
      </div>

      <div className="text-2xs uppercase tracking-wide text-[hsl(var(--pk-ink-faint))] mb-2">Corporate KPI Performance Status (YTD)</div>
      <DownloadableFrame filename="cp001-kpi-performance-status">
        <KpiPerformanceTable getResult={getResult} onNavigate={onNavigate} />
      </DownloadableFrame>
    </div>
  );
}
