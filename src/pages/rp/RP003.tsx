import { ScreenHeader } from "@/components/pk/ScreenHeader";
import { StatusChip } from "@/components/pk/StatusChip";
import { CategoryBar } from "@/components/pk/Charts";
import { DownloadableFrame } from "@/components/pk/DownloadableFrame";
import { FinancialYearQuarterPicker, useLocalPeriodId } from "@/components/pk/PeriodPicker";
import type { ScreenId } from "@/lib/nav";
import { useSession } from "@/lib/session";
import { useWorkflow } from "@/lib/workflow";
import { useDetails } from "@/lib/details";

export function RP003({ onNavigate }: { onNavigate: (id: ScreenId) => void }) {
  const { entityId } = useSession();
  const [periodId, setPeriodId] = useLocalPeriodId();
  const { latestValue } = useWorkflow();
  const { headcountSummaryByPeriod } = useDetails();
  const kpi12 = latestValue("KPI12", entityId, periodId);
  const headcountSummary = headcountSummaryByPeriod[periodId];

  return (
    <div>
      <ScreenHeader id="RP003" subtitle="Resource & People · Bumiputera Composition (KPI 12)." onNavigate={onNavigate} periodId={periodId} right={<FinancialYearQuarterPicker periodId={periodId} onChange={setPeriodId} />} />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
        <div className="rounded-lg border border-[hsl(var(--pk-border))] bg-[hsl(var(--pk-surface))] shadow-card p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="text-xs font-bold underline text-[hsl(var(--pk-ink-soft))]">KPI 12 — Bumiputera Composition</div>
            <StatusChip status={kpi12.status} />
          </div>
          <DownloadableFrame
            filename="rp003-bumiputera-composition"
            csvData={{
              headers: ["Category", "Headcount"],
              rows: [["Bumiputera", headcountSummary.bumiputera], ["Non-Bumiputera", headcountSummary.nonBumiputera]],
            }}
          >
            <CategoryBar segments={[{ label: "Bumiputera", value: headcountSummary.bumiputera, color: "hsl(var(--pk-accent))" }, { label: "Non-Bumiputera", value: headcountSummary.nonBumiputera, color: "hsl(var(--pk-surface-2))" }]} />
          </DownloadableFrame>
        </div>
      </div>

      <div className="rounded-lg border border-[hsl(var(--pk-border))] bg-[hsl(var(--pk-surface))] shadow-card p-4">
        <div className="text-2xs uppercase tracking-wide text-[hsl(var(--pk-ink-faint))] mb-2">KPI 12 performance detail</div>
        <DownloadableFrame filename="rp003-kpi12-performance-detail" className="overflow-x-auto">
          <table className="w-full text-sm min-w-[480px]">
            <thead>
              <tr className="text-2xs uppercase tracking-wide text-white bg-[hsl(var(--pk-navy))]">
                <th className="text-left font-medium px-2 py-1.5">KPI</th><th className="text-right font-medium px-2 py-1.5">Weight</th><th className="text-right font-medium px-2 py-1.5">YTD Target</th><th className="text-right font-medium px-2 py-1.5">YTD Actual</th><th className="text-right font-medium px-2 py-1.5">Weighted</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-t border-[hsl(var(--pk-border))]">
                <td className="px-2 py-2">Bumiputera Composition (%)</td>
                <td className="text-right tnum px-2 py-2">1.67%</td>
                <td className="text-right tnum px-2 py-2">{kpi12.ytdTarget}</td>
                <td className="text-right tnum px-2 py-2 font-semibold">{kpi12.ytdActual?.toFixed(1)}</td>
                <td className="text-right tnum px-2 py-2 text-[hsl(var(--pk-accent))] font-semibold">{kpi12.weighted !== null ? `${(kpi12.weighted * 100).toFixed(1)}%` : "—"}</td>
              </tr>
            </tbody>
          </table>
        </DownloadableFrame>
      </div>
    </div>
  );
}
