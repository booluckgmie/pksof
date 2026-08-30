import { periods, periodById } from "@/data/periods";
import type { PeriodId } from "@/types";
import { cn } from "@/lib/utils";

const FY_LIST = Array.from(new Set(periods.map((p) => p.fy)));

/** Picking a new FY keeps the same quarter number if that quarter exists yet, otherwise falls
 * back to the first quarter the new FY actually has — never lands on an invalid period. */
function periodForFy(fy: string, keepQuarter: number): PeriodId {
  const sameQuarter = periods.find((p) => p.fy === fy && p.quarter === keepQuarter);
  return (sameQuarter ?? periods.find((p) => p.fy === fy)!).id;
}

/** Two plain dropdowns — Year, then Quarter within that year — replacing a single long
 * FY-grouped `<optgroup>` select. Used in the Sidebar's global period filter. */
export function YearQuarterDropdowns({
  periodId,
  onChange,
  dark = false,
  className,
}: {
  periodId: PeriodId;
  onChange: (id: PeriodId) => void;
  dark?: boolean;
  className?: string;
}) {
  const period = periodById(periodId);
  const quartersInFy = periods.filter((p) => p.fy === period.fy);
  const selectClass = dark
    ? "flex-1 min-w-0 bg-white/5 border border-white/10 rounded-md px-2 py-1.5 text-sm font-medium text-white outline-none cursor-pointer focus:border-white/30"
    : "flex-1 min-w-0 bg-[hsl(var(--pk-surface))] border border-[hsl(var(--pk-border))] rounded-md px-2 py-1.5 text-sm font-medium text-[hsl(var(--pk-ink))] outline-none cursor-pointer focus:border-[hsl(var(--pk-accent))]";
  const optionClass = dark ? "text-[hsl(var(--pk-ink))]" : undefined;

  return (
    <div className={cn("flex items-center gap-1.5", className)}>
      <select
        value={period.fy}
        onChange={(e) => onChange(periodForFy(e.target.value, period.quarter))}
        className={selectClass}
      >
        {FY_LIST.map((fy) => (
          <option key={fy} value={fy} className={optionClass}>{fy}</option>
        ))}
      </select>
      <select
        value={periodId}
        onChange={(e) => onChange(e.target.value as PeriodId)}
        className={selectClass}
      >
        {quartersInFy.map((p) => (
          <option key={p.id} value={p.id} className={optionClass}>Q{p.quarter}</option>
        ))}
      </select>
    </div>
  );
}

/** Year dropdown + a compact Q1–Q4 pill row for the selected year — a single-line, "pick any
 * quarter across any year" filter for in-page use (CP003/CP005/CP008), replacing a long flat
 * row of every period as its own pill. */
export function PeriodPickerCompact({
  periodId,
  onChange,
  className,
}: {
  periodId: PeriodId;
  onChange: (id: PeriodId) => void;
  className?: string;
}) {
  const period = periodById(periodId);
  const quartersInFy = periods.filter((p) => p.fy === period.fy);

  return (
    <div className={cn("flex items-center gap-2 flex-wrap", className)}>
      <select
        value={period.fy}
        onChange={(e) => onChange(periodForFy(e.target.value, period.quarter))}
        className="bg-[hsl(var(--pk-surface))] border border-[hsl(var(--pk-border))] rounded-md px-2 py-1 text-[12.5px] font-medium text-[hsl(var(--pk-ink))] outline-none cursor-pointer focus:border-[hsl(var(--pk-accent))]"
      >
        {FY_LIST.map((fy) => (
          <option key={fy} value={fy}>{fy}</option>
        ))}
      </select>
      <div className="flex items-center gap-1">
        {quartersInFy.map((p) => (
          <button
            key={p.id}
            onClick={() => onChange(p.id)}
            className={cn(
              "text-[12px] px-2.5 py-1 rounded-md border transition-colors",
              periodId === p.id
                ? "bg-[hsl(var(--pk-accent))] text-[hsl(var(--pk-accent-ink))] border-[hsl(var(--pk-accent))]"
                : "border-[hsl(var(--pk-border))] text-[hsl(var(--pk-ink-soft))] hover:bg-[hsl(var(--pk-surface-2))]"
            )}
          >
            Q{p.quarter}
          </button>
        ))}
      </div>
    </div>
  );
}
