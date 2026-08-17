interface GaugeProps {
  value: number; // 0-100
  cumulativeThreshold?: number; // 0-1
  mofThreshold?: number; // 0-1
  size?: number;
  label?: string;
}

export function Gauge({ value, cumulativeThreshold = 0.25, mofThreshold = 0.2, size = 200, label }: GaugeProps) {
  const r = 78;
  const cx = 100;
  const cy = 100;
  const circumference = Math.PI * r;
  const pct = Math.max(0, Math.min(100, value));
  const offset = circumference * (1 - pct / 100);

  const angleFor = (frac: number) => Math.PI - frac * Math.PI; // 0->pi(left), 1->0(right)
  const tick = (frac: number, len = 10) => {
    const a = angleFor(frac);
    const x1 = cx + (r - len) * Math.cos(a);
    const y1 = cy - (r - len) * Math.sin(a);
    const x2 = cx + (r + 2) * Math.cos(a);
    const y2 = cy - (r + 2) * Math.sin(a);
    return { x1, y1, x2, y2 };
  };

  const mofTick = tick(mofThreshold, 14);
  const cumTick = tick(cumulativeThreshold, 14);

  return (
    <div className="flex flex-col items-center" style={{ width: size }}>
      <svg viewBox="0 0 200 118" width={size} height={size * 0.59}>
        <path
          d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`}
          fill="none"
          stroke="hsl(var(--pk-surface-2))"
          strokeWidth={14}
          strokeLinecap="round"
        />
        <path
          d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`}
          fill="none"
          stroke="hsl(var(--pk-accent))"
          strokeWidth={14}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
        />
        <line x1={cumTick.x1} y1={cumTick.y1} x2={cumTick.x2} y2={cumTick.y2} stroke="hsl(var(--pk-ink-faint))" strokeWidth={2} />
        <line x1={mofTick.x1} y1={mofTick.y1} x2={mofTick.x2} y2={mofTick.y2} stroke="hsl(var(--pk-navy))" strokeWidth={2} strokeDasharray="2 2" />
        <text x={cx} y={cy - 6} textAnchor="middle" className="fill-[hsl(var(--pk-ink))] font-mono-pk" fontSize={30} fontWeight={600}>
          {pct.toFixed(1)}%
        </text>
        {label && (
          <text x={cx} y={cy + 16} textAnchor="middle" className="fill-[hsl(var(--pk-ink-faint))]" fontSize={10} letterSpacing={0.5}>
            {label.toUpperCase()}
          </text>
        )}
      </svg>
      <div className="flex items-center gap-3 text-[10px] text-[hsl(var(--pk-ink-faint))] -mt-1">
        <span className="flex items-center gap-1"><span className="inline-block h-1.5 w-1.5 rounded-full bg-[hsl(var(--pk-ink-faint))]" />Cumulative {Math.round(cumulativeThreshold * 100)}%</span>
        <span className="flex items-center gap-1"><span className="inline-block h-1.5 w-1.5 rounded-full bg-[hsl(var(--pk-navy))]" />MOF {Math.round(mofThreshold * 100)}%</span>
      </div>
    </div>
  );
}
