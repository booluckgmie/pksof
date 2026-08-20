import { ScreenHeader } from "@/components/pk/ScreenHeader";
import { FhTabs } from "@/components/pk/FhTabs";
import { StatCard } from "@/components/pk/Misc";
import type { ScreenId } from "@/lib/nav";
import { useDetails } from "@/lib/details";

export function PFH004({ onNavigate }: { onNavigate: (id: ScreenId) => void }) {
  const { balanceSheet } = useDetails();
  const totalAssets = balanceSheet.assets.reduce((s, a) => s + a.value, 0);
  const totalLiabilities = balanceSheet.liabilities.reduce((s, l) => s + l.value, 0);
  const equity = totalAssets - totalLiabilities;
  const equityRatio = totalAssets > 0 ? (equity / totalAssets) * 100 : 0;
  const equityGrowth = balanceSheet.priorShareholdersFund > 0 ? ((equity - balanceSheet.priorShareholdersFund) / balanceSheet.priorShareholdersFund) * 100 : 0;

  const maxTrend = Math.max(...balanceSheet.trend.map((t) => t.equity + t.liabilities), 1);

  return (
    <div>
      <ScreenHeader id="PFH004" subtitle="Balance sheet position, capital strength and sustainability." onNavigate={onNavigate} />
      <FhTabs current="PFH004" onNavigate={onNavigate} />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-5">
        <div className="rounded-lg border border-[hsl(var(--pk-border))] bg-[hsl(var(--pk-surface))] shadow-card p-4">
          <div className="text-[11px] uppercase tracking-wide text-[hsl(var(--pk-ink-faint))] mb-2">Assets (RM Million)</div>
          <div className="divide-y divide-[hsl(var(--pk-border))]">
            {balanceSheet.assets.map((a) => (
              <div key={a.label} className="flex justify-between py-1.5 text-sm"><span className="text-[hsl(var(--pk-ink-soft))]">{a.label}</span><span className="tnum">{a.value.toFixed(1)}</span></div>
            ))}
            <div className="flex justify-between py-1.5 text-sm font-semibold"><span>Total Assets</span><span className="tnum">{totalAssets.toFixed(1)}</span></div>
          </div>
        </div>
        <div className="rounded-lg border border-[hsl(var(--pk-border))] bg-[hsl(var(--pk-surface))] shadow-card p-4">
          <div className="text-[11px] uppercase tracking-wide text-[hsl(var(--pk-ink-faint))] mb-2">Liabilities (RM Million)</div>
          <div className="divide-y divide-[hsl(var(--pk-border))]">
            {balanceSheet.liabilities.map((l) => (
              <div key={l.label} className="flex justify-between py-1.5 text-sm"><span className="text-[hsl(var(--pk-ink-soft))]">{l.label}</span><span className="tnum">{l.value.toFixed(1)}</span></div>
            ))}
            <div className="flex justify-between py-1.5 text-sm font-semibold"><span>Total Liabilities</span><span className="tnum">{totalLiabilities.toFixed(1)}</span></div>
          </div>
        </div>
        <div className="rounded-lg border border-[hsl(var(--pk-border))] bg-[hsl(var(--pk-surface))] shadow-card p-4">
          <div className="text-[11px] uppercase tracking-wide text-[hsl(var(--pk-ink-faint))] mb-2">Equity</div>
          <div className="tnum font-head text-2xl font-semibold text-[hsl(var(--pk-good))]">RM {equity.toFixed(1)}m</div>
          <div className="text-[11px] text-[hsl(var(--pk-ink-faint))] mt-1">Shareholders' Fund = Total Assets − Total Liabilities</div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 mb-5">
        <StatCard label="Assets Growth (YoY)" value={`+${(((totalAssets - 690) / 690) * 100).toFixed(1)}%`} tone="good" />
        <StatCard label="Liabilities Growth (YoY)" value={`+${(((totalLiabilities - 33.5) / 33.5) * 100).toFixed(1)}%`} tone="pending" />
        <StatCard label="Equity Ratio" value={`${equityRatio.toFixed(1)}%`} tone="good" sub={`Equity vs prior period +${equityGrowth.toFixed(1)}%`} />
      </div>

      <div className="rounded-lg border border-[hsl(var(--pk-border))] bg-[hsl(var(--pk-surface))] shadow-card p-4">
        <div className="text-xs font-medium text-[hsl(var(--pk-ink-soft))] mb-2">Balance sheet trend — Shareholders' Fund vs Total Liabilities (RM Million)</div>
        <div className="flex items-center gap-4 text-[11px] text-[hsl(var(--pk-ink-faint))] mb-2">
          <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-sm bg-[hsl(var(--pk-accent))]" />Shareholders' Fund</span>
          <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-sm bg-[hsl(var(--pk-navy))]" />Total Liabilities</span>
        </div>
        <svg viewBox="0 0 480 220" className="w-full h-auto max-w-xl" role="img" aria-label="Balance sheet trend — stacked bar chart">
          {balanceSheet.trend.map((t, i) => {
            const bw = 480 / balanceSheet.trend.length;
            const x = i * bw + bw * 0.24;
            const barW = bw * 0.52;
            const totalH = ((t.equity + t.liabilities) / maxTrend) * 165;
            const liabH = (t.liabilities / maxTrend) * 165;
            const eqH = totalH - liabH;
            const yBase = 190;
            return (
              <g key={t.period}>
                <rect x={x} y={yBase - totalH} width={barW} height={eqH} fill="hsl(var(--pk-accent))" rx={3}>
                  <title>Shareholders' Fund — {t.period}: RM {t.equity.toFixed(1)}m</title>
                </rect>
                <rect x={x} y={yBase - liabH} width={barW} height={liabH} fill="hsl(var(--pk-navy))" rx={3}>
                  <title>Total Liabilities — {t.period}: RM {t.liabilities.toFixed(1)}m</title>
                </rect>
                <text x={x + barW / 2} y={yBase - totalH - 8} textAnchor="middle" fontSize={11} fontWeight={600} className="fill-[hsl(var(--pk-ink))] tnum">
                  {(t.equity + t.liabilities).toFixed(0)}
                </text>
                <text x={x + barW / 2} y={yBase + 18} textAnchor="middle" fontSize={11} className="fill-[hsl(var(--pk-ink-faint))]">{t.period.replace(" FY", " '")}</text>
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
}
