import { ScreenHeader } from "@/components/pk/ScreenHeader";
import { FhTabs } from "@/components/pk/FhTabs";
import { StatCard } from "@/components/pk/Misc";
import { StackedBarTrend } from "@/components/pk/Charts";
import type { ScreenId } from "@/lib/nav";
import { useDetails } from "@/lib/details";

export function PFH004({ onNavigate }: { onNavigate: (id: ScreenId) => void }) {
  const { balanceSheet } = useDetails();
  const totalAssets = balanceSheet.assets.reduce((s, a) => s + a.value, 0);
  const totalLiabilities = balanceSheet.liabilities.reduce((s, l) => s + l.value, 0);
  const equity = totalAssets - totalLiabilities;
  const equityRatio = totalAssets > 0 ? (equity / totalAssets) * 100 : 0;
  const equityGrowth = balanceSheet.priorShareholdersFund > 0 ? ((equity - balanceSheet.priorShareholdersFund) / balanceSheet.priorShareholdersFund) * 100 : 0;

  // StackedBarTrend stacks segments bottom-up in array order — Total Liabilities first so it
  // forms the base of the bar, same as the chart it replaced.
  const balanceSheetTrend = balanceSheet.trend.map((t) => ({
    label: t.period.replace(" FY", " '"),
    segments: [
      { label: "Total Liabilities", value: t.liabilities, color: "hsl(var(--pk-navy))" },
      { label: "Shareholders' Fund", value: t.equity, color: "hsl(var(--pk-accent))" },
    ],
  }));

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

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-2 rounded-lg border border-[hsl(var(--pk-border))] bg-[hsl(var(--pk-surface))] shadow-card p-4">
          <div className="text-xs font-medium text-[hsl(var(--pk-ink-soft))] mb-2">Balance sheet trend — Shareholders' Fund vs Total Liabilities (RM Million)</div>
          <StackedBarTrend data={balanceSheetTrend} />
        </div>
        <div className="rounded-lg border border-[hsl(var(--pk-border))] bg-[hsl(var(--pk-surface))] shadow-card p-4">
          <div className="text-[11px] uppercase tracking-wide text-[hsl(var(--pk-ink-faint))] mb-2.5">Key insights</div>
          <ul className="flex flex-col gap-2.5 text-[12.5px] text-[hsl(var(--pk-ink-soft))]">
            <li className="flex gap-2">
              <span className="text-[hsl(var(--pk-accent))] shrink-0">•</span>
              <span>Equity makes up <span className="font-semibold text-[hsl(var(--pk-ink))]">{equityRatio.toFixed(1)}%</span> of total assets, up <span className="font-semibold text-[hsl(var(--pk-good))]">{equityGrowth.toFixed(1)}%</span> from the prior period.</span>
            </li>
            <li className="flex gap-2">
              <span className="text-[hsl(var(--pk-accent))] shrink-0">•</span>
              <span>Total assets of <span className="font-semibold text-[hsl(var(--pk-ink))]">RM {totalAssets.toFixed(1)}m</span> against total liabilities of <span className="font-semibold text-[hsl(var(--pk-ink))]">RM {totalLiabilities.toFixed(1)}m</span> — a capital-strong position.</span>
            </li>
            <li className="flex gap-2">
              <span className="text-[hsl(var(--pk-accent))] shrink-0">•</span>
              <span>Shareholders' Fund is the dominant driver of balance-sheet growth across the trend shown, well ahead of liability growth.</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
