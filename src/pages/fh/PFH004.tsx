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
        <div className="text-xs font-medium text-[hsl(var(--pk-ink-soft))] mb-3">Balance sheet trend — Shareholders' Fund vs Total Liabilities (RM Million)</div>
        <svg viewBox="0 0 320 150" className="w-full h-auto">
          {balanceSheet.trend.map((t, i) => {
            const bw = 320 / balanceSheet.trend.length;
            const x = i * bw + bw * 0.22;
            const totalH = ((t.equity + t.liabilities) / maxTrend) * 110;
            const liabH = (t.liabilities / maxTrend) * 110;
            const eqH = totalH - liabH;
            const yBase = 130;
            return (
              <g key={t.period}>
                <rect x={x} y={yBase - totalH} width={bw * 0.56} height={eqH} fill="hsl(var(--pk-accent))" rx={2} />
                <rect x={x} y={yBase - liabH} width={bw * 0.56} height={liabH} fill="hsl(var(--pk-navy))" rx={2} />
                <text x={x + bw * 0.28} y={yBase + 12} textAnchor="middle" fontSize={9} className="fill-[hsl(var(--pk-ink-faint))]">{t.period.replace(" FY", " '")}</text>
              </g>
            );
          })}
        </svg>
        <div className="flex items-center gap-4 text-[11px] text-[hsl(var(--pk-ink-faint))] mt-1">
          <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-sm bg-[hsl(var(--pk-accent))]" />Shareholders' Fund</span>
          <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-sm bg-[hsl(var(--pk-navy))]" />Total Liabilities</span>
        </div>
      </div>
    </div>
  );
}
