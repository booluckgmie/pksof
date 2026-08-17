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
            <rect x={x} y={y} width={bw * 0.64} height={h} rx={3} fill={isLast ? color : "hsl(var(--pk-surface-2))"} stroke={isLast ? "none" : "hsl(var(--pk-border))"} />
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
              <rect x={groupX} y={H - 24 - ha} width={barW} height={ha} rx={2} fill={aColor} />
              <text x={groupX + barW / 2} y={H - 24 - ha - 4} textAnchor="middle" fontSize={8.5} className="fill-[hsl(var(--pk-ink-faint))] tnum">{d.a}</text>
              <rect x={groupX + barW + 3} y={H - 24 - hb} width={barW} height={hb} rx={2} fill={bColor} />
              <text x={groupX + barW + 3 + barW / 2} y={H - 24 - hb - 4} textAnchor="middle" fontSize={8.5} className="fill-[hsl(var(--pk-ink))] tnum" fontWeight={600}>{d.b}</text>
              <text x={groupX + barW + 1.5} y={H - 10} textAnchor="middle" fontSize={9} className="fill-[hsl(var(--pk-ink-faint))]">{d.label}</text>
            </g>
          );
        })}
      </svg>
      <div className="flex items-center gap-4 text-[11px] text-[hsl(var(--pk-ink-faint))] mt-1">
        <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-sm" style={{ background: aColor }} />{aLabel}</span>
        <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-sm" style={{ background: bColor }} />{bLabel}</span>
      </div>
    </div>
  );
}

export function LineTrend({ data, unit = "", color = "hsl(var(--pk-navy))" }: { data: Point[]; unit?: string; color?: string }) {
  if (data.length === 0) {
    return (
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" role="img" aria-label="Line trend chart — no data yet">
        <line x1={PAD} y1={H - 24} x2={W - 6} y2={H - 24} stroke="hsl(var(--pk-border))" strokeWidth={1} />
        <text x={W / 2} y={H / 2} textAnchor="middle" fontSize={10} className="fill-[hsl(var(--pk-ink-faint))]">No data yet</text>
      </svg>
    );
  }
  const max = Math.max(...data.map((d) => d.value)) * 1.15;
  const min = Math.min(0, Math.min(...data.map((d) => d.value)) * 0.9);
  const range = max - min || 1;
  const step = (W - PAD * 2) / (data.length - 1 || 1);
  const pts = data.map((d, i) => ({
    x: PAD + i * step,
    y: H - 24 - ((H - 44) * (d.value - min)) / range,
  }));
  const path = pts.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");
  const area = `${path} L ${pts[pts.length - 1].x} ${H - 24} L ${pts[0].x} ${H - 24} Z`;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" role="img" aria-label="Line trend chart">
      <line x1={PAD} y1={H - 24} x2={W - 6} y2={H - 24} stroke="hsl(var(--pk-border))" strokeWidth={1} />
      <path d={area} fill={color} opacity={0.08} />
      <path d={path} fill="none" stroke={color} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
      {pts.map((p, i) => (
        <g key={i}>
          <circle cx={p.x} cy={p.y} r={i === pts.length - 1 ? 3.5 : 2.5} fill={i === pts.length - 1 ? color : "hsl(var(--pk-surface))"} stroke={color} strokeWidth={1.5} />
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

export function DonutStat({
  segments,
  size = 128,
}: {
  segments: { label: string; value: number; color: string }[];
  size?: number;
}) {
  const total = segments.reduce((s, x) => s + x.value, 0) || 1;
  const r = 42;
  const c = 2 * Math.PI * r;
  let acc = 0;
  const primaryPct = ((segments[0]?.value ?? 0) / total) * 100;

  return (
    <div className="flex items-center gap-4">
      <svg viewBox="0 0 100 100" width={size} height={size}>
        {segments.map((s) => {
          const frac = s.value / total;
          const dash = frac * c;
          const el = (
            <circle
              key={s.label}
              cx={50}
              cy={50}
              r={r}
              fill="none"
              stroke={s.color}
              strokeWidth={14}
              strokeDasharray={`${dash} ${c - dash}`}
              strokeDashoffset={-acc}
              transform="rotate(-90 50 50)"
            />
          );
          acc += dash;
          return el;
        })}
        <text x={50} y={47} textAnchor="middle" fontSize={18} fontWeight={700} className="fill-[hsl(var(--pk-ink))] tnum">
          {primaryPct.toFixed(1)}%
        </text>
        <text x={50} y={60} textAnchor="middle" fontSize={7} className="fill-[hsl(var(--pk-ink-faint))]">
          {segments[0]?.label}
        </text>
      </svg>
      <div className="flex flex-col gap-1.5">
        {segments.map((s) => (
          <div key={s.label} className="flex items-center gap-2 text-xs">
            <span className="h-2.5 w-2.5 rounded-sm" style={{ background: s.color }} />
            <span className="text-[hsl(var(--pk-ink-soft))]">{s.label}</span>
            <span className="tnum font-semibold text-[hsl(var(--pk-ink))]">{s.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
