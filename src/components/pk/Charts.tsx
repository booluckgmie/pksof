interface Point { label: string; value: number }

const W = 320;
const H = 140;
const PAD = 24;

export function BarTrend({ data, unit = "", color = "hsl(var(--pk-accent))" }: { data: Point[]; unit?: string; color?: string }) {
  const max = Math.max(...data.map((d) => d.value), 1) * 1.15;
  const bw = (W - PAD * 2) / data.length;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" role="img" aria-label="Bar trend chart">
      <line x1={PAD} y1={H - 24} x2={W - 6} y2={H - 24} stroke="hsl(var(--pk-border))" strokeWidth={1} />
      {data.map((d, i) => {
        const h = ((H - 44) * d.value) / max;
        const x = PAD + i * bw + bw * 0.18;
        const y = H - 24 - h;
        const isLast = i === data.length - 1;
        return (
          <g key={d.label}>
            <rect x={x} y={y} width={bw * 0.64} height={h} rx={3} fill={isLast ? color : "hsl(var(--pk-surface-2))"} stroke={isLast ? "none" : "hsl(var(--pk-border))"}>
              <title>{d.label}: {d.value.toFixed(1)}{unit}</title>
            </rect>
            <text x={x + bw * 0.32} y={y - 5} textAnchor="middle" fontSize={9.5} className="fill-[hsl(var(--pk-ink))] tnum" fontWeight={isLast ? 700 : 500}>
              {d.value.toFixed(1)}{unit}
            </text>
            <text x={x + bw * 0.32} y={H - 10} textAnchor="middle" fontSize={9} className="fill-[hsl(var(--pk-ink-faint))]">
              {d.label}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

interface GroupedPoint { label: string; a: number; b: number }

export function GroupedBarTrend({
  data,
  aLabel,
  bLabel,
  aColor = "hsl(var(--pk-navy) / 0.45)",
  bColor = "hsl(var(--pk-accent))",
}: {
  data: GroupedPoint[];
  aLabel: string;
  bLabel: string;
  aColor?: string;
  bColor?: string;
}) {
  const max = Math.max(...data.map((d) => Math.max(d.a, d.b)), 1) * 1.2;
  const bw = (W - PAD * 2) / data.length;
  const barW = bw * 0.28;
  return (
    <div>
      <div className="flex items-center gap-4 text-[11px] text-[hsl(var(--pk-ink-faint))] mb-1.5">
        <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-sm" style={{ background: aColor }} />{aLabel}</span>
        <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-sm" style={{ background: bColor }} />{bLabel}</span>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" role="img" aria-label="Grouped bar chart">
        <line x1={PAD} y1={H - 24} x2={W - 6} y2={H - 24} stroke="hsl(var(--pk-border))" strokeWidth={1} />
        {data.map((d, i) => {
          const ha = ((H - 44) * d.a) / max;
          const hb = ((H - 44) * d.b) / max;
          const groupX = PAD + i * bw + bw * 0.16;
          return (
            <g key={d.label}>
              <rect x={groupX} y={H - 24 - ha} width={barW} height={ha} rx={2} fill={aColor}>
                <title>{aLabel} — {d.label}: {d.a}</title>
              </rect>
              <text x={groupX + barW / 2} y={H - 24 - ha - 4} textAnchor="middle" fontSize={8.5} className="fill-[hsl(var(--pk-ink-faint))] tnum">{d.a}</text>
              <rect x={groupX + barW + 3} y={H - 24 - hb} width={barW} height={hb} rx={2} fill={bColor}>
                <title>{bLabel} — {d.label}: {d.b}</title>
              </rect>
              <text x={groupX + barW + 3 + barW / 2} y={H - 24 - hb - 4} textAnchor="middle" fontSize={8.5} className="fill-[hsl(var(--pk-ink))] tnum" fontWeight={600}>{d.b}</text>
              <text x={groupX + barW + 1.5} y={H - 10} textAnchor="middle" fontSize={9} className="fill-[hsl(var(--pk-ink-faint))]">{d.label}</text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

export function LineTrend({
  data, unit = "", color = "hsl(var(--pk-navy))", referenceLine,
}: {
  data: Point[];
  unit?: string;
  color?: string;
  /** A constant horizontal comparison line (e.g. an industry benchmark) drawn behind the trend. */
  referenceLine?: { value: number; label: string };
}) {
  if (data.length === 0) {
    return (
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" role="img" aria-label="Line trend chart — no data yet">
        <line x1={PAD} y1={H - 24} x2={W - 6} y2={H - 24} stroke="hsl(var(--pk-border))" strokeWidth={1} />
        <text x={W / 2} y={H / 2} textAnchor="middle" fontSize={10} className="fill-[hsl(var(--pk-ink-faint))]">No data yet</text>
      </svg>
    );
  }
  const values = data.map((d) => d.value).concat(referenceLine ? [referenceLine.value] : []);
  const max = Math.max(...values) * 1.15;
  const min = Math.min(0, Math.min(...values) * 0.9);
  const range = max - min || 1;
  const step = (W - PAD * 2) / (data.length - 1 || 1);
  const pts = data.map((d, i) => ({
    x: PAD + i * step,
    y: H - 24 - ((H - 44) * (d.value - min)) / range,
  }));
  const path = pts.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");
  const area = `${path} L ${pts[pts.length - 1].x} ${H - 24} L ${pts[0].x} ${H - 24} Z`;
  const refY = referenceLine ? H - 24 - ((H - 44) * (referenceLine.value - min)) / range : null;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" role="img" aria-label="Line trend chart">
      <line x1={PAD} y1={H - 24} x2={W - 6} y2={H - 24} stroke="hsl(var(--pk-border))" strokeWidth={1} />
      {referenceLine && refY !== null && (
        <g>
          <line x1={PAD} y1={refY} x2={W - 6} y2={refY} stroke="hsl(var(--pk-warn))" strokeWidth={1.25} strokeDasharray="4 3">
            <title>{referenceLine.label}: {referenceLine.value.toFixed(1)}{unit}</title>
          </line>
          <text x={W - 6} y={refY - 4} textAnchor="end" fontSize={9} fontWeight={600} className="fill-[hsl(var(--pk-warn))]">
            {referenceLine.label} {referenceLine.value.toFixed(1)}{unit}
          </text>
        </g>
      )}
      <path d={area} fill={color} opacity={0.08} />
      <path d={path} fill="none" stroke={color} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
      {pts.map((p, i) => (
        <g key={i}>
          <circle cx={p.x} cy={p.y} r={i === pts.length - 1 ? 3.5 : 2.5} fill={i === pts.length - 1 ? color : "hsl(var(--pk-surface))"} stroke={color} strokeWidth={1.5}>
            <title>{data[i].label}: {data[i].value.toFixed(1)}{unit}</title>
          </circle>
          <text x={p.x} y={p.y - 8} textAnchor="middle" fontSize={9.5} className="fill-[hsl(var(--pk-ink))] tnum" fontWeight={i === pts.length - 1 ? 700 : 500}>
            {data[i].value.toFixed(1)}{unit}
          </text>
          <text x={p.x} y={H - 10} textAnchor="middle" fontSize={9} className="fill-[hsl(var(--pk-ink-faint))]">
            {data[i].label}
          </text>
        </g>
      ))}
    </svg>
  );
}

interface StackedPoint { label: string; segments: { label: string; value: number; color: string }[] }

/** Per-period stacked bar trend — each bar is built from the same named segments across periods. */
export function StackedBarTrend({ data, unit = "" }: { data: StackedPoint[]; unit?: string }) {
  if (data.length === 0) {
    return (
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" role="img" aria-label="Stacked bar trend chart — no data yet">
        <line x1={PAD} y1={H - 24} x2={W - 6} y2={H - 24} stroke="hsl(var(--pk-border))" strokeWidth={1} />
        <text x={W / 2} y={H / 2} textAnchor="middle" fontSize={10} className="fill-[hsl(var(--pk-ink-faint))]">No data yet</text>
      </svg>
    );
  }
  const totals = data.map((d) => d.segments.reduce((s, x) => s + x.value, 0));
  const max = Math.max(...totals, 1) * 1.15;
  const bw = (W - PAD * 2) / data.length;
  const legend = data[0].segments;
  return (
    <div>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-[hsl(var(--pk-ink-faint))] mb-1.5">
        {legend.map((s) => (
          <span key={s.label} className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-sm" style={{ background: s.color }} />
            {s.label}
          </span>
        ))}
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" role="img" aria-label="Stacked bar trend chart">
        <line x1={PAD} y1={H - 24} x2={W - 6} y2={H - 24} stroke="hsl(var(--pk-border))" strokeWidth={1} />
        {data.map((d, i) => {
          const total = totals[i];
          const x = PAD + i * bw + bw * 0.18;
          const barW = bw * 0.64;
          let yCursor = H - 24;
          return (
            <g key={d.label}>
              {d.segments.map((s) => {
                const h = ((H - 44) * s.value) / max;
                yCursor -= h;
                return (
                  <rect key={s.label} x={x} y={yCursor} width={barW} height={h} fill={s.color}>
                    <title>{s.label} — {d.label}: {s.value.toFixed(1)}{unit}</title>
                  </rect>
                );
              })}
              <text x={x + barW / 2} y={H - 24 - ((H - 44) * total) / max - 5} textAnchor="middle" fontSize={9.5} className="fill-[hsl(var(--pk-ink))] tnum" fontWeight={600}>
                {total.toFixed(1)}{unit}
              </text>
              <text x={x + barW / 2} y={H - 10} textAnchor="middle" fontSize={9} className="fill-[hsl(var(--pk-ink-faint))]">
                {d.label}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

/** Composition breakdown as stacked/individual bars — replaces the old pie/doughnut chart
 * per the "bar charts only" design standard. Legend sits above the bars, and each bar carries
 * a native SVG <title> for a hover tooltip. */
export function CategoryBar({
  segments,
  unit = "",
}: {
  segments: { label: string; value: number; color: string }[];
  unit?: string;
}) {
  const total = segments.reduce((s, x) => s + x.value, 0) || 1;
  const barH = 22;
  const gap = 10;
  const chartH = segments.length * barH + (segments.length - 1) * gap;

  return (
    <div>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-[hsl(var(--pk-ink-faint))] mb-2">
        {segments.map((s) => (
          <span key={s.label} className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-sm" style={{ background: s.color }} />
            {s.label}
          </span>
        ))}
      </div>
      <svg viewBox={`0 0 ${W} ${chartH}`} className="w-full h-auto" role="img" aria-label="Composition bar chart">
        {segments.map((s, i) => {
          const pct = (s.value / total) * 100;
          const y = i * (barH + gap);
          const labelW = 50;
          const trackW = W - labelW;
          const barW = (pct / 100) * trackW;
          return (
            <g key={s.label}>
              <rect x={0} y={y} width={trackW} height={barH} rx={4} fill="hsl(var(--pk-surface-2))" />
              <rect x={0} y={y} width={barW} height={barH} rx={4} fill={s.color}>
                <title>{s.label}: {s.value}{unit} ({pct.toFixed(1)}%)</title>
              </rect>
              <text x={trackW + 6} y={y + barH / 2 + 4} fontSize={11} fontWeight={700} className="fill-[hsl(var(--pk-ink))] tnum">
                {pct.toFixed(1)}%
              </text>
              <text x={8} y={y + barH / 2 + 4} fontSize={10} fontWeight={600} className="fill-white tnum" style={{ mixBlendMode: "difference" }}>
                {s.value}{unit}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

/** A single segmented bar (not one row per category) — for a two/three-way split where
 * CategoryBar's stacked full-width rows take up more room than the comparison needs. */
export function SplitBar({ segments }: { segments: { label: string; value: number; color: string }[] }) {
  const total = segments.reduce((s, x) => s + x.value, 0) || 1;
  return (
    <div>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-[hsl(var(--pk-ink-faint))] mb-2">
        {segments.map((s) => (
          <span key={s.label} className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-sm shrink-0" style={{ background: s.color }} />
            {s.label}
            <span className="tnum font-semibold text-[hsl(var(--pk-ink))]">{s.value}</span>
            <span className="tnum">({((s.value / total) * 100).toFixed(1)}%)</span>
          </span>
        ))}
      </div>
      <div className="flex h-3 w-full rounded-full overflow-hidden">
        {segments.map((s) => (
          <div
            key={s.label}
            style={{ width: `${(s.value / total) * 100}%`, background: s.color }}
            title={`${s.label}: ${s.value} (${((s.value / total) * 100).toFixed(1)}%)`}
          />
        ))}
      </div>
    </div>
  );
}
