/**
 * The client's own MOF-format scorecard row — Weight / FY Target / YTD Target / YTD Actual —
 * as a strip of four boxes above a KPI's trend chart. `fy` and `periodLabel` are passed in
 * rather than hardcoded so the box labels ("FY2026 Target", "YTD Q1 2026 Target") track
 * whatever period is actually selected, not a fixed year. Weighted Achievement is deliberately
 * not a box here — it's already shown as the status chip next to the KPI title.
 */
export function KpiMetricStrip({
  weight, fy, periodLabel, fyTarget, ytdTarget, ytdActual,
}: {
  weight: string;
  fy: string;
  periodLabel: string;
  fyTarget: string;
  ytdTarget: string;
  ytdActual: string;
}) {
  const boxes = [
    { label: "Weight", value: weight },
    { label: `${fy} Target`, value: fyTarget },
    { label: `YTD ${periodLabel} Target`, value: ytdTarget },
    { label: `YTD ${periodLabel} Actual`, value: ytdActual },
  ];
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
      {boxes.map((b) => (
        <div key={b.label} className="rounded-lg border border-[hsl(var(--pk-navy-soft))] bg-[hsl(var(--pk-navy-soft)/0.4)] px-2 py-2 text-center">
          <div className="text-[10px] font-semibold text-[hsl(var(--pk-ink-faint))] uppercase tracking-wide leading-tight">{b.label}</div>
          <div className="tnum text-sm font-bold text-[hsl(var(--pk-ink))] mt-1">{b.value}</div>
        </div>
      ))}
    </div>
  );
}
