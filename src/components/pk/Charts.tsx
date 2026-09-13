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
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" role="img" aria-label="Grouped bar chart">
        <line x1={PAD} y1={H - 24} x2={W - 6} y2={H - 24} stroke="hsl(var(--pk-border))" strokeWidth={1} />
        {data.map((d, i) => {
          const ha = ((H - 44) * d.a) / max;
          const hb = ((H - 44) * d.b) / max;
          const groupX = PAD + i * bw + bw * 0.16;
          return (
            <g key={d.label}>
              <rect x={groupX} y={H - 24 - ha} width={barW} height={ha} rx={3} fill={aColor}>
                <title>{aLabel} — {d.label}: {d.a}</title>
              </rect>
              <text x={groupX + barW / 2} y={H - 24 - ha - 5} textAnchor="middle" fontSize={9.5} className="fill-[hsl(var(--pk-ink-faint))] tnum" fontWeight={500}>{d.a}</text>
              <rect x={groupX + barW + 3} y={H - 24 - hb} width={barW} height={hb} rx={3} fill={bColor}>
                <title>{bLabel} — {d.label}: {d.b}</title>
              </rect>
              <text x={groupX + barW + 3 + barW / 2} y={H - 24 - hb - 5} textAnchor="middle" fontSize={9.5} className="fill-[hsl(var(--pk-ink))] tnum" fontWeight={700}>{d.b}</text>
              <text x={groupX + barW + 1.5} y={H - 10} textAnchor="middle" fontSize={9} className="fill-[hsl(var(--pk-ink-faint))]">{d.label}</text>
            </g>
          );
        })}
      </svg>
      <div className="flex items-center justify-center gap-4 text-2xs text-[hsl(var(--pk-ink-faint))] mt-1.5">
        <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-sm" style={{ background: aColor }} />{aLabel}</span>
        <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-sm" style={{ background: bColor }} />{bLabel}</span>
      </div>
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
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" role="img" aria-label="Stacked bar trend chart">
        <line x1={PAD} y1={H - 24} x2={W - 6} y2={H - 24} stroke="hsl(var(--pk-border))" strokeWidth={1} />
        {data.map((d, i) => {
          const total = totals[i];
          const x = PAD + i * bw + bw * 0.18;
          const barW = bw * 0.64;
          const isLast = i === data.length - 1;
          let yCursor = H - 24;
          return (
            <g key={d.label}>
              {d.segments.map((s) => {
                const h = ((H - 44) * s.value) / max;
                yCursor -= h;
                return (
                  <rect key={s.label} x={x} y={yCursor} width={barW} height={h} rx={2} fill={s.color}>
                    <title>{s.label} — {d.label}: {s.value.toFixed(1)}{unit}</title>
                  </rect>
                );
              })}
              <text x={x + barW / 2} y={H - 24 - ((H - 44) * total) / max - 5} textAnchor="middle" fontSize={9.5} className="fill-[hsl(var(--pk-ink))] tnum" fontWeight={isLast ? 700 : 500}>
                {total.toFixed(1)}{unit}
              </text>
              <text x={x + barW / 2} y={H - 10} textAnchor="middle" fontSize={9} className="fill-[hsl(var(--pk-ink-faint))]">
                {d.label}
              </text>
            </g>
          );
        })}
      </svg>
      <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-2xs text-[hsl(var(--pk-ink-faint))] mt-1.5">
        {legend.map((s) => (
          <span key={s.label} className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-sm" style={{ background: s.color }} />
            {s.label}
          </span>
        ))}
      </div>
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
      <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-2xs text-[hsl(var(--pk-ink-faint))] mt-2">
        {segments.map((s) => (
          <span key={s.label} className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-sm" style={{ background: s.color }} />
            {s.label}
          </span>
        ))}
      </div>
    </div>
  );
}

/** A single segmented bar (not one row per category) — for a two/three-way split where
 * CategoryBar's stacked full-width rows take up more room than the comparison needs. */
export function SplitBar({ segments }: { segments: { label: string; value: number; color: string }[] }) {
  const total = segments.reduce((s, x) => s + x.value, 0) || 1;
  return (
    <div>
      <div className="flex h-3 w-full rounded-full overflow-hidden">
        {segments.map((s) => (
          <div
            key={s.label}
            style={{ width: `${(s.value / total) * 100}%`, background: s.color }}
            title={`${s.label}: ${s.value} (${((s.value / total) * 100).toFixed(1)}%)`}
          />
        ))}
      </div>
      <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-2xs text-[hsl(var(--pk-ink-faint))] mt-2">
        {segments.map((s) => (
          <span key={s.label} className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-sm shrink-0" style={{ background: s.color }} />
            {s.label}
            <span className="tnum font-semibold text-[hsl(var(--pk-ink))]">{s.value}</span>
            <span className="tnum">({((s.value / total) * 100).toFixed(1)}%)</span>
          </span>
        ))}
      </div>
    </div>
  );
}

/** A ring composition chart with the total centered in the hole and each slice's own value/share
 * labeled in place — used sparingly (this dashboard's default is CategoryBar/SplitBar precisely
 * to avoid pie/donut charts) but adopted here to match the client's own sketch for this one
 * panel. Slices under `minLabelFraction` skip their in-ring label rather than overlap illegibly. */
export function Donut({
  segments,
  centerValue,
  centerLabel,
  minLabelFraction = 0.07,
}: {
  segments: { label: string; value: number; color: string }[];
  centerValue: string;
  centerLabel: string;
  minLabelFraction?: number;
}) {
  const total = segments.reduce((s, x) => s + x.value, 0) || 1;
  const CX = 100;
  const CY = 100;
  const R = 62;
  const STROKE = 34;
  const CIRC = 2 * Math.PI * R;

  let cumulative = 0;
  const arcs = segments.map((s) => {
    const frac = s.value / total;
    const startFrac = cumulative;
    cumulative += frac;
    const midAngle = (startFrac + frac / 2) * 2 * Math.PI - Math.PI / 2;
    const labelR = R;
    return {
      ...s,
      frac,
      dash: frac * CIRC,
      offset: -startFrac * CIRC,
      labelX: CX + labelR * Math.cos(midAngle),
      labelY: CY + labelR * Math.sin(midAngle),
    };
  });

  return (
    <svg viewBox="0 0 200 200" className="w-full h-auto" role="img" aria-label="Donut composition chart">
      {arcs.map((a) => (
        <circle
          key={a.label}
          cx={CX}
          cy={CY}
          r={R}
          fill="none"
          stroke={a.color}
          strokeWidth={STROKE}
          strokeDasharray={`${a.dash} ${CIRC - a.dash}`}
          strokeDashoffset={a.offset}
          transform={`rotate(-90 ${CX} ${CY})`}
        >
          <title>{a.label}: {a.value} ({(a.frac * 100).toFixed(1)}%)</title>
        </circle>
      ))}
      {arcs.filter((a) => a.frac >= minLabelFraction).map((a) => (
        <g key={`${a.label}-label`}>
          <text x={a.labelX} y={a.labelY - 4} textAnchor="middle" fontSize={13} fontWeight={700} className="fill-white tnum">{a.value}</text>
          <text x={a.labelX} y={a.labelY + 10} textAnchor="middle" fontSize={9.5} fontWeight={500} className="fill-white/85 tnum">{(a.frac * 100).toFixed(1)}%</text>
        </g>
      ))}
      <text x={CX} y={CY - 6} textAnchor="middle" fontSize={22} fontWeight={700} className="fill-[hsl(var(--pk-ink))] tnum">{centerValue}</text>
      <text x={CX} y={CY + 15} textAnchor="middle" fontSize={10.5} className="fill-[hsl(var(--pk-ink-faint))]">{centerLabel}</text>
    </svg>
  );
}

interface FinResultPoint {
  label: string;
  revenue: number;
  pbt: number;
  /** Quarters reported under a prior structure (e.g. before an income-recognition change) —
   * rendered in a paler tone than the rest, per the client's own exhibit. */
  faded?: boolean;
}

/**
 * The client's own "Overview of Financial Results" historical exhibit — grouped Revenue/PBT
 * bars across a long quarterly run, with `faded` quarters shown in a paler tone, an optional
 * dashed marker before the latest quarter, and a bottom banner calling out named eras
 * (e.g. before/after a reporting-structure change) by quarter-index span.
 */
export function FinancialResultsHistoryChart({
  data,
  dividerBeforeIndex,
  banner,
  unit = "RM' Million",
}: {
  data: FinResultPoint[];
  dividerBeforeIndex?: number;
  banner?: { label: string; from: number; to: number }[];
  unit?: string;
}) {
  const W = 960;
  const PAD_L = 34;
  const PAD_R = 8;
  const PAD_T = 34;
  const plotH = 200;
  const axisLabelH = 34;
  const bannerH = banner ? 28 : 0;
  const H = PAD_T + plotH + axisLabelH + bannerH + 6;

  const max = Math.max(...data.map((d) => Math.max(d.revenue, d.pbt)), 1);
  const niceMax = Math.ceil((max * 1.15) / 10) * 10;
  const tickCount = 8;
  const ticks = Array.from({ length: tickCount + 1 }, (_, i) => (niceMax / tickCount) * i);

  const plotW = W - PAD_L - PAD_R;
  const bw = plotW / data.length;
  const barW = bw * 0.32;
  const axisY = PAD_T + plotH;

  const revenueColor = "hsl(var(--pk-navy))";
  const pbtColor = "hsl(var(--pk-warn))";
  const revenueFaded = "hsl(var(--pk-navy) / 0.28)";
  const pbtFaded = "hsl(var(--pk-warn) / 0.30)";

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" role="img" aria-label="Overview of Financial Results — Revenue and PBT by quarter">
      <text x={PAD_L} y={10} fontSize={10} className="fill-[hsl(var(--pk-ink-faint))]">{unit}</text>
      <g>
        <rect x={PAD_L} y={20} width={9} height={9} rx={1.5} fill={revenueColor} />
        <text x={PAD_L + 13} y={28} fontSize={10.5} fontWeight={600} className="fill-[hsl(var(--pk-ink))]">Revenue</text>
        <rect x={PAD_L + 78} y={20} width={9} height={9} rx={1.5} fill={pbtColor} />
        <text x={PAD_L + 91} y={28} fontSize={10.5} fontWeight={600} className="fill-[hsl(var(--pk-ink))]">PBT</text>
      </g>

      {ticks.map((t) => {
        const y = axisY - (plotH * t) / niceMax;
        return (
          <g key={t}>
            <line x1={PAD_L} y1={y} x2={W - PAD_R} y2={y} stroke="hsl(var(--pk-border))" strokeWidth={1} />
            <text x={PAD_L - 6} y={y + 3} textAnchor="end" fontSize={9} className="fill-[hsl(var(--pk-ink-faint))] tnum">{t.toFixed(1)}</text>
          </g>
        );
      })}

      {data.map((d, i) => {
        const gx = PAD_L + i * bw + bw * 0.18;
        const hRev = (plotH * d.revenue) / niceMax;
        const hPbt = (plotH * d.pbt) / niceMax;
        return (
          <g key={d.label}>
            <rect x={gx} y={axisY - hRev} width={barW} height={hRev} fill={d.faded ? revenueFaded : revenueColor}>
              <title>{d.label} — Revenue: {d.revenue.toFixed(1)}</title>
            </rect>
            <text x={gx + barW / 2} y={axisY - hRev - 4} textAnchor="middle" fontSize={9} className="fill-[hsl(var(--pk-ink))] tnum" fontWeight={600}>{d.revenue.toFixed(1)}</text>
            <rect x={gx + barW + 3} y={axisY - hPbt} width={barW} height={hPbt} fill={d.faded ? pbtFaded : pbtColor}>
              <title>{d.label} — PBT: {d.pbt.toFixed(1)}</title>
            </rect>
            <text x={gx + barW + 3 + barW / 2} y={axisY - hPbt - 4} textAnchor="middle" fontSize={9} className="fill-[hsl(var(--pk-ink))] tnum" fontWeight={600}>{d.pbt.toFixed(1)}</text>
            <text x={gx + barW + 1.5} y={axisY + 14} textAnchor="middle" fontSize={9} className="fill-[hsl(var(--pk-ink-faint))]">{d.label}</text>
          </g>
        );
      })}

      {dividerBeforeIndex !== undefined && dividerBeforeIndex > 0 && dividerBeforeIndex < data.length && (
        <line
          x1={PAD_L + dividerBeforeIndex * bw}
          y1={PAD_T - 6}
          x2={PAD_L + dividerBeforeIndex * bw}
          y2={axisY}
          stroke="hsl(var(--pk-ink-faint))"
          strokeWidth={1.25}
          strokeDasharray="4 3"
        />
      )}

      {banner && banner.map((seg, i) => {
        const x1 = PAD_L + seg.from * bw;
        const x2 = PAD_L + (seg.to + 1) * bw;
        const y = axisY + axisLabelH;
        const isLast = i === banner.length - 1;
        const tipW = 8;
        const points = isLast
          ? `${x1},${y} ${x2 - tipW},${y} ${x2},${y + bannerH / 2} ${x2 - tipW},${y + bannerH} ${x1},${y + bannerH}`
          : `${x1},${y} ${x2},${y} ${x2 - tipW},${y + bannerH / 2} ${x2},${y + bannerH} ${x1},${y + bannerH}`;
        return (
          <g key={seg.label}>
            <polygon points={points} fill={i % 2 === 0 ? "hsl(var(--pk-surface-2))" : "hsl(var(--pk-border))"} />
            <text x={(x1 + x2) / 2} y={y + bannerH / 2 + 3.5} textAnchor="middle" fontSize={9} fontWeight={600} className="fill-[hsl(var(--pk-ink-soft))]">{seg.label}</text>
          </g>
        );
      })}
    </svg>
  );
}

/**
 * Horizontal paired-bar comparison — the client's own "Overview of Quarterly Financial
 * Results" exhibit (Current Quarter vs Preceding Quarter). Each category gets a current-
 * quarter bar and a compare-quarter bar sharing one axis, with a bracket + variance label
 * (RM Xm, Y%) between them. Values are plain numbers (RM'000); `unit` labels the axis.
 */
export function QoQHorizontalBars({
  categories,
  currentLabel,
  compareLabel,
  unit = "RM'000",
}: {
  categories: { label: string; current: number; compare: number }[];
  currentLabel: string;
  compareLabel: string;
  unit?: string;
}) {
  const W = 620;
  const PAD_L = 92;
  const PAD_R = 110;
  const BAR_H = 22;
  const BAR_GAP = 4;
  const GROUP_H = BAR_H * 2 + BAR_GAP + 30;
  const LEGEND_H = 22;
  const AXIS_H = 22;
  const H = LEGEND_H + categories.length * GROUP_H + AXIS_H;

  const max = Math.max(...categories.flatMap((c) => [c.current, c.compare]), 1) * 1.2;
  const plotW = W - PAD_L - PAD_R;
  const niceMax = Math.ceil(max / 10000) * 10000 || 1;
  const tickCount = 5;
  const ticks = Array.from({ length: tickCount + 1 }, (_, i) => (niceMax / tickCount) * i);
  const axisY = LEGEND_H + categories.length * GROUP_H + 12;

  const currentColor = "hsl(var(--pk-navy))";
  const compareColor = "hsl(var(--pk-border))";

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" role="img" aria-label="Current quarter vs preceding quarter">
      <g>
        <rect x={PAD_L} y={4} width={10} height={10} rx={2} fill={currentColor} />
        <text x={PAD_L + 14} y={13} fontSize={10.5} className="fill-[hsl(var(--pk-ink))]">{currentLabel}</text>
        <rect x={PAD_L + 100} y={4} width={10} height={10} rx={2} fill={compareColor} />
        <text x={PAD_L + 114} y={13} fontSize={10.5} className="fill-[hsl(var(--pk-ink))]">{compareLabel}</text>
        <text x={W - PAD_R} y={13} textAnchor="end" fontSize={9.5} className="fill-[hsl(var(--pk-ink-faint))]">{unit}</text>
      </g>

      {ticks.map((t) => {
        const x = PAD_L + (t / niceMax) * plotW;
        return <line key={t} x1={x} y1={LEGEND_H} x2={x} y2={LEGEND_H + categories.length * GROUP_H - 8} stroke="hsl(var(--pk-border))" strokeWidth={1} />;
      })}

      {categories.map((c, i) => {
        const groupY = LEGEND_H + i * GROUP_H;
        const curW = (c.current / niceMax) * plotW;
        const cmpW = (c.compare / niceMax) * plotW;
        const delta = c.current - c.compare;
        const pct = c.compare !== 0 ? (delta / Math.abs(c.compare)) * 100 : 0;
        const bracketX = PAD_L + Math.max(curW, cmpW) + 8;
        return (
          <g key={c.label}>
            <text x={PAD_L - 8} y={groupY + BAR_H + BAR_GAP / 2 + 4} textAnchor="end" fontSize={10.5} fontWeight={700} className="fill-[hsl(var(--pk-ink-soft))]">
              {c.label}
            </text>
            <rect x={PAD_L} y={groupY} width={curW} height={BAR_H} rx={2} fill={currentColor}>
              <title>{currentLabel} — {c.label}: {c.current.toLocaleString()}</title>
            </rect>
            <text x={PAD_L + curW - 6} y={groupY + BAR_H / 2 + 4} textAnchor="end" fontSize={10.5} fontWeight={700} className="fill-white tnum">{c.current.toLocaleString()}</text>
            <rect x={PAD_L} y={groupY + BAR_H + BAR_GAP} width={cmpW} height={BAR_H} rx={2} fill={compareColor}>
              <title>{compareLabel} — {c.label}: {c.compare.toLocaleString()}</title>
            </rect>
            <text x={PAD_L + cmpW - 6} y={groupY + BAR_H + BAR_GAP + BAR_H / 2 + 4} textAnchor="end" fontSize={10.5} fontWeight={700} className="fill-[hsl(var(--pk-ink))] tnum">{c.compare.toLocaleString()}</text>

            <line x1={bracketX} y1={groupY} x2={bracketX} y2={groupY + BAR_H * 2 + BAR_GAP} stroke="hsl(var(--pk-ink-faint))" strokeWidth={1} />
            <line x1={bracketX - 4} y1={groupY} x2={bracketX} y2={groupY} stroke="hsl(var(--pk-ink-faint))" strokeWidth={1} />
            <line x1={bracketX - 4} y1={groupY + BAR_H * 2 + BAR_GAP} x2={bracketX} y2={groupY + BAR_H * 2 + BAR_GAP} stroke="hsl(var(--pk-ink-faint))" strokeWidth={1} />
            <text x={bracketX + 5} y={groupY + BAR_H + BAR_GAP / 2 - 3} fontSize={9.5} fontStyle="italic" fontWeight={700} className="fill-[hsl(var(--pk-ink))] tnum">
              RM{(Math.abs(delta) / 1000).toFixed(1)}m
            </text>
            <text x={bracketX + 5} y={groupY + BAR_H + BAR_GAP / 2 + 9} fontSize={9.5} fontStyle="italic" fontWeight={700} className="fill-[hsl(var(--pk-ink))] tnum">
              {Math.abs(pct).toFixed(0)}%
            </text>
          </g>
        );
      })}

      <line x1={PAD_L} y1={LEGEND_H + categories.length * GROUP_H - 8} x2={PAD_L} y2={LEGEND_H} stroke="hsl(var(--pk-border))" strokeWidth={1} />
      {ticks.map((t) => (
        <text key={t} x={PAD_L + (t / niceMax) * plotW} y={axisY} textAnchor="middle" fontSize={9} className="fill-[hsl(var(--pk-ink-faint))] tnum">{t.toLocaleString()}</text>
      ))}
    </svg>
  );
}
