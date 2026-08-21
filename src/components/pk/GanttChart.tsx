import type { Initiative } from "@/lib/details";

const STATUS_COLOR: Record<string, string> = {
  Completed: "hsl(var(--pk-good))",
  "In Progress": "hsl(var(--pk-navy))",
  Planned: "hsl(var(--pk-warn))",
  Delayed: "hsl(var(--pk-bad))",
  "On Hold": "hsl(var(--pk-pending))",
};

/** Initiative start/end are stored as "Q1"–"Q4" quarter-range strings ("Q1-Q3"), not calendar
 * dates — parses those into a 1–4 quarter index for a 4-column timeline. */
function parseQuarter(label: string): number | null {
  const m = /^Q([1-4])$/.exec(label.trim());
  return m ? Number(m[1]) : null;
}

/** Simple 4-quarter Gantt-style timeline — one row per initiative, bar spans its start→end
 * quarter range, colored by status. Falls back to nothing for rows whose start/end don't parse
 * as a quarter range, rather than guessing a position. */
export function GanttChart({ rows }: { rows: Initiative[] }) {
  const parsed = rows
    .map((r) => ({ r, startQ: parseQuarter(r.start), endQ: parseQuarter(r.end) }))
    .filter((x): x is { r: Initiative; startQ: number; endQ: number } => x.startQ !== null && x.endQ !== null);

  if (parsed.length === 0) {
    return <p className="text-[12px] text-[hsl(var(--pk-ink-faint))]">No quarter-range dates to plot for this set.</p>;
  }

  return (
    <div className="flex flex-col gap-2.5">
      <div className="grid gap-1" style={{ gridTemplateColumns: "1fr 3fr" }}>
        <div />
        <div className="grid grid-cols-4 text-[10px] uppercase tracking-wide text-[hsl(var(--pk-ink-faint))] pb-1 border-b border-[hsl(var(--pk-border))]">
          {["Q1", "Q2", "Q3", "Q4"].map((q) => <div key={q} className="text-center">{q}</div>)}
        </div>
      </div>
      {parsed.map(({ r, startQ, endQ }) => {
        const left = ((startQ - 1) / 4) * 100;
        const width = ((endQ - startQ + 1) / 4) * 100;
        return (
          <div key={r.name} className="grid items-center gap-1" style={{ gridTemplateColumns: "1fr 3fr" }}>
            <div className="text-[12px] text-[hsl(var(--pk-ink))] truncate pr-2" title={r.name}>{r.name}</div>
            <div className="relative h-5 rounded bg-[hsl(var(--pk-surface-2))]">
              <div
                className="absolute inset-y-0 rounded"
                style={{ left: `${left}%`, width: `${width}%`, background: STATUS_COLOR[r.status] ?? STATUS_COLOR["On Hold"] }}
                title={`${r.name}: ${r.start} → ${r.end} · ${r.status}`}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
