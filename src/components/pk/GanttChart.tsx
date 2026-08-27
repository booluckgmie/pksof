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

const MONTH_ABBR = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** Some catalogs (People Development Programme) store start/end as "Apr '26"-style month-year
 * strings instead of Gantt's Q1-Q4 quarter format — parses those into an absolute month index
 * (year*12+month) so a timeline can span an arbitrary range rather than a fixed 4 columns. */
function parseMonthYear(label: string): number | null {
  const m = /^([A-Za-z]{3})\s+'(\d{2})$/.exec(label.trim());
  if (!m) return null;
  const monthIdx = MONTH_ABBR.findIndex((a) => a.toLowerCase() === m[1].toLowerCase());
  if (monthIdx === -1) return null;
  return (2000 + Number(m[2])) * 12 + monthIdx;
}

function monthLabel(m: number): string {
  const monthIdx = ((m % 12) + 12) % 12;
  const year = Math.floor(m / 12);
  return `${MONTH_ABBR[monthIdx]} '${String(year % 100).padStart(2, "0")}`;
}

export interface MonthTimelineRow {
  name: string;
  start: string;
  end: string;
  status: string;
}

/** Same idea as GanttChart but for month-year ranges spanning whatever the data actually covers
 * (not a fixed FY quarter grid) — used by programme/timeline catalogs like People Development
 * Programme, whose entries can run anywhere from a couple of months to a full calendar year. */
export function MonthTimeline({ rows }: { rows: MonthTimelineRow[] }) {
  const parsed = rows
    .map((r) => ({ r, s: parseMonthYear(r.start), e: parseMonthYear(r.end) }))
    .filter((x): x is { r: MonthTimelineRow; s: number; e: number } => x.s !== null && x.e !== null);

  if (parsed.length === 0) {
    return <p className="text-[12px] text-[hsl(var(--pk-ink-faint))]">No parseable start/end dates to plot for this set.</p>;
  }

  const minM = Math.min(...parsed.map((p) => p.s));
  const maxM = Math.max(...parsed.map((p) => p.e));
  const span = Math.max(maxM - minM + 1, 1);

  return (
    <div className="flex flex-col gap-2.5">
      <div className="flex items-center justify-between text-[10px] uppercase tracking-wide text-[hsl(var(--pk-ink-faint))] pb-1 border-b border-[hsl(var(--pk-border))]">
        <span>{monthLabel(minM)}</span>
        <span>{monthLabel(maxM)}</span>
      </div>
      {parsed.map(({ r, s, e }) => {
        const left = ((s - minM) / span) * 100;
        const width = ((e - s + 1) / span) * 100;
        return (
          <div key={r.name} className="flex items-center gap-2.5">
            <div className="w-36 sm:w-44 shrink-0 text-[12px] text-[hsl(var(--pk-ink))] truncate" title={r.name}>{r.name}</div>
            <div className="relative flex-1 h-5 rounded bg-[hsl(var(--pk-surface-2))]">
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
