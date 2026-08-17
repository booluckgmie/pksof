import { Fragment } from "react";
import { ScreenHeader } from "@/components/pk/ScreenHeader";
import { FhTabs } from "@/components/pk/FhTabs";
import { BarTrend, LineTrend } from "@/components/pk/Charts";
import { InfoNote } from "@/components/pk/Misc";
import type { ScreenId } from "@/lib/nav";
import { useDetails } from "@/lib/details";

export function PFH002({ onNavigate }: { onNavigate: (id: ScreenId) => void }) {
  const { quarterlyTrend } = useDetails();
  const rows = [
    { section: "INCOME METRICS", metric: "Revenue (RM Million)", values: quarterlyTrend.map((q) => q.revenue) },
    { section: "PROFIT METRICS", metric: "Profit Before Tax (RM Million)", values: quarterlyTrend.map((q) => q.pbt) },
    { metric: "Net Profit Margin (%)", values: quarterlyTrend.map((q) => q.netMargin) },
    { section: "COST METRICS", metric: "Cost-to-Income Ratio (%)", values: quarterlyTrend.map((q) => q.cir) },
  ];

  return (
    <div>
      <ScreenHeader id="PFH002" subtitle="Quarter-on-quarter profitability, cost efficiency and operational financial metrics." onNavigate={onNavigate} />
      <FhTabs current="PFH002" onNavigate={onNavigate} />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
        <div className="rounded-lg border border-[hsl(var(--pk-border))] bg-[hsl(var(--pk-surface))] shadow-card p-4">
          <div className="text-xs font-medium text-[hsl(var(--pk-ink-soft))] mb-2">PBT quarter-on-quarter trend</div>
          <BarTrend data={quarterlyTrend.map((q) => ({ label: q.period.replace(" FY", " '"), value: q.pbt }))} unit="m" />
        </div>
        <div className="rounded-lg border border-[hsl(var(--pk-border))] bg-[hsl(var(--pk-surface))] shadow-card p-4">
          <div className="text-xs font-medium text-[hsl(var(--pk-ink-soft))] mb-2">Net Profit Margin trend</div>
          <LineTrend data={quarterlyTrend.map((q) => ({ label: q.period.replace(" FY", " '"), value: q.netMargin }))} unit="%" />
        </div>
      </div>

      <div className="rounded-lg border border-[hsl(var(--pk-border))] bg-[hsl(var(--pk-surface))] shadow-card overflow-x-auto mb-4">
        <table className="w-full text-sm min-w-[640px]">
          <thead>
            <tr className="text-[11px] uppercase tracking-wide text-[hsl(var(--pk-ink-faint))] bg-[hsl(var(--pk-surface-2))]">
              <th className="text-left font-medium px-3 py-2">Metric</th>
              {quarterlyTrend.map((q) => <th key={q.period} className="text-right font-medium px-3 py-2">{q.period}</th>)}
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <Fragment key={r.metric}>
                {r.section && (
                  <tr><td colSpan={6} className="px-3 pt-3 pb-1 text-[10.5px] font-semibold uppercase tracking-wide text-[hsl(var(--pk-navy))]">{r.section}</td></tr>
                )}
                <tr className="border-t border-[hsl(var(--pk-border))]">
                  <td className="px-3 py-2 text-[hsl(var(--pk-ink))]">{r.metric}</td>
                  {r.values.map((v, i) => (
                    <td key={i} className={`px-3 py-2 text-right tnum ${i === r.values.length - 1 ? "font-semibold" : ""}`}>{v.toFixed(1)}</td>
                  ))}
                </tr>
              </Fragment>
            ))}
          </tbody>
        </table>
      </div>
      <InfoNote>Trends display a minimum of five reporting periods. Monetary values in RM Million to one decimal. Upload template only — Finance Department, monthly.</InfoNote>
    </div>
  );
}
