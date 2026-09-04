import { cn } from "@/lib/utils";

export interface BreakdownRow {
  label: string;
  fyTarget: number | null;
  ytdTarget: number | null;
  ytdActual: number;
}

/** PBT's breakdown carries FY/YTD targets and a variance column; CIR's (no per-line targets in
 * the client's source report) collapses to a single actual-figures column. Shared by CP003
 * (Financial Perspective) and PFH001 (Financial Health Overview) — same KPIs, same breakdown. */
export function BreakdownTable({ rows, unit }: { rows: BreakdownRow[]; unit: string }) {
  if (rows.length === 0) {
    return <p className="text-[12px] text-[hsl(var(--pk-ink-faint))] px-1 py-2">No breakdown entered yet for this period.</p>;
  }
  const hasTargets = rows.some((r) => r.fyTarget !== null);
  return (
    <div className="rounded-lg border border-[hsl(var(--pk-border))] overflow-x-auto">
      <table className="w-full text-sm min-w-[420px]">
        <thead>
          <tr className="text-[11px] text-white bg-[hsl(var(--pk-navy))]">
            <th className="text-left font-medium px-3 py-2"> </th>
            {hasTargets && <th className="text-right font-medium px-3 py-2">FY Target ({unit})</th>}
            {hasTargets && <th className="text-right font-medium px-3 py-2">YTD Target ({unit})</th>}
            <th className="text-right font-medium px-3 py-2">YTD Actual ({unit})</th>
            {hasTargets && <th className="text-right font-medium px-3 py-2">Variance</th>}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => {
            const emphasize = r.label.startsWith("Total") || i === rows.length - 1;
            return (
              <tr key={r.label} className={cn("border-t border-[hsl(var(--pk-border))]", emphasize && "bg-[hsl(var(--pk-navy-soft)/0.5)] font-semibold")}>
                <td className="px-3 py-2 text-[hsl(var(--pk-ink))]">{r.label}</td>
                {hasTargets && <td className="px-3 py-2 text-right tnum">{r.fyTarget !== null ? r.fyTarget.toFixed(1) : "—"}</td>}
                {hasTargets && <td className="px-3 py-2 text-right tnum">{r.ytdTarget !== null ? r.ytdTarget.toFixed(1) : "—"}</td>}
                <td className="px-3 py-2 text-right tnum">{r.ytdActual.toFixed(1)}</td>
                {hasTargets && <td className="px-3 py-2 text-right tnum">{r.ytdTarget !== null ? (r.ytdActual - r.ytdTarget).toFixed(1) : "—"}</td>}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
