import { ScreenHeader } from "@/components/pk/ScreenHeader";
import { StatCard } from "@/components/pk/Misc";
import { StatusChip } from "@/components/pk/StatusChip";
import { LineTrend, DonutStat } from "@/components/pk/Charts";
import type { ScreenId } from "@/lib/nav";
import { useSession } from "@/lib/session";
import { useWorkflow } from "@/lib/workflow";
import { useDetails, industryBenchmark } from "@/lib/details";

export function RP003({ onNavigate }: { onNavigate: (id: ScreenId) => void }) {
  const { entityId, periodId } = useSession();
  const { latestValue } = useWorkflow();
  const { headcountSummaryByPeriod, turnoverTrend, resignedByPeriod } = useDetails();
  const kpi12 = latestValue("KPI12", entityId, periodId);
  const headcountSummary = headcountSummaryByPeriod[periodId];
  const resigned = resignedByPeriod[periodId];
  const turnoverRate = headcountSummary.totalEmployees > 0 ? (resigned / headcountSummary.totalEmployees) * 100 : 0;

  return (
    <div>
      <ScreenHeader id="RP003" subtitle="Resource & People · Turnover analysis and Bumiputera Composition." onNavigate={onNavigate} />

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mb-5">
        <StatCard label="Total Employees" value={String(headcountSummary.totalEmployees)} />
        <StatCard label="Employees Resigned" value={String(resigned)} />
        <StatCard label="Turnover Rate" value={`${turnoverRate.toFixed(1)}%`} tone="good" />
        <StatCard label="Industry Benchmark" value={`${industryBenchmark.toFixed(1)}%`} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
        <div className="rounded-lg border border-[hsl(var(--pk-border))] bg-[hsl(var(--pk-surface))] shadow-card p-4">
          <div className="text-xs font-medium text-[hsl(var(--pk-ink-soft))] mb-2">Turnover trend by quarter vs industry benchmark</div>
          <LineTrend data={turnoverTrend.map((t) => ({ label: t.period.replace(" FY", " '"), value: t.rate }))} unit="%" />
        </div>
        <div className="rounded-lg border border-[hsl(var(--pk-border))] bg-[hsl(var(--pk-surface))] shadow-card p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="text-xs font-medium text-[hsl(var(--pk-ink-soft))]">KPI 12 — Bumiputera Composition</div>
            <StatusChip status={kpi12.status} />
          </div>
          <DonutStat segments={[{ label: "Bumiputera", value: headcountSummary.bumiputera, color: "hsl(var(--pk-accent))" }, { label: "Non-Bumiputera", value: headcountSummary.nonBumiputera, color: "hsl(var(--pk-surface-2))" }]} />
        </div>
      </div>

      <div className="rounded-lg border border-[hsl(var(--pk-border))] bg-[hsl(var(--pk-surface))] shadow-card p-4">
        <div className="text-[11px] uppercase tracking-wide text-[hsl(var(--pk-ink-faint))] mb-2">KPI 12 performance detail</div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[480px]">
            <thead>
              <tr className="text-[11px] uppercase tracking-wide text-[hsl(var(--pk-ink-faint))]">
                <th className="text-left font-medium py-1.5">KPI</th><th className="text-right font-medium py-1.5">Weight</th><th className="text-right font-medium py-1.5">YTD Target</th><th className="text-right font-medium py-1.5">YTD Actual</th><th className="text-right font-medium py-1.5">Weighted</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-t border-[hsl(var(--pk-border))]">
                <td className="py-2">Bumiputera Composition (%)</td>
                <td className="text-right tnum py-2">1.67%</td>
                <td className="text-right tnum py-2">{kpi12.ytdTarget}</td>
                <td className="text-right tnum py-2 font-semibold">{kpi12.ytdActual?.toFixed(1)}</td>
                <td className="text-right tnum py-2 text-[hsl(var(--pk-accent))] font-semibold">{kpi12.weighted !== null ? `${(kpi12.weighted * 100).toFixed(1)}%` : "—"}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
