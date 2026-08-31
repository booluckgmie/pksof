import { useState } from "react";
import * as PopoverPrimitive from "@radix-ui/react-popover";
import { ChevronDown, X, Layers } from "lucide-react";
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

/** A "Compare periods" button that opens a checklist of every period, grouped by FY — pick any
 * 1 or more (across any year) to line up side by side in a PeriodComparisonTable. Independent of
 * PeriodPickerCompact's single-period selection, which still drives the screen's own KPI cards. */
export function ComparePeriodsPicker({
  selected,
  onChange,
  className,
}: {
  selected: PeriodId[];
  onChange: (ids: PeriodId[]) => void;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const toggle = (id: PeriodId) => {
    onChange(selected.includes(id) ? selected.filter((x) => x !== id) : [...selected, id]);
  };

  return (
    <PopoverPrimitive.Root open={open} onOpenChange={setOpen}>
      <PopoverPrimitive.Trigger asChild>
        <button
          type="button"
          className={cn(
            "inline-flex items-center gap-1.5 text-[12px] px-2.5 py-1 rounded-md border transition-colors",
            selected.length > 0
              ? "border-[hsl(var(--pk-accent))] text-[hsl(var(--pk-accent))] bg-[hsl(var(--pk-accent-soft))]"
              : "border-[hsl(var(--pk-border))] text-[hsl(var(--pk-ink-soft))] hover:bg-[hsl(var(--pk-surface-2))]",
            className
          )}
        >
          <Layers className="h-3 w-3" />
          Compare periods{selected.length > 0 ? ` (${selected.length})` : ""}
          <ChevronDown className="h-3 w-3" />
        </button>
      </PopoverPrimitive.Trigger>
      <PopoverPrimitive.Portal>
        <PopoverPrimitive.Content
          align="start"
          sideOffset={6}
          className="z-50 w-56 rounded-md border border-[hsl(var(--pk-border))] bg-[hsl(var(--pk-surface))] shadow-floating p-2.5 max-h-80 overflow-y-auto"
        >
          {FY_LIST.map((fy) => (
            <div key={fy} className="mb-2 last:mb-0">
              <div className="text-[10px] uppercase tracking-wide text-[hsl(var(--pk-ink-faint))] font-semibold mb-1">{fy}</div>
              <div className="grid grid-cols-4 gap-1">
                {periods.filter((p) => p.fy === fy).map((p) => (
                  <button
                    key={p.id}
                    onClick={() => toggle(p.id)}
                    className={cn(
                      "text-[11.5px] px-1.5 py-1 rounded border transition-colors",
                      selected.includes(p.id)
                        ? "bg-[hsl(var(--pk-accent))] text-[hsl(var(--pk-accent-ink))] border-[hsl(var(--pk-accent))]"
                        : "border-[hsl(var(--pk-border))] text-[hsl(var(--pk-ink-soft))] hover:bg-[hsl(var(--pk-surface-2))]"
                    )}
                  >
                    Q{p.quarter}
                  </button>
                ))}
              </div>
            </div>
          ))}
          {selected.length > 0 && (
            <button
              onClick={() => onChange([])}
              className="mt-1.5 w-full text-center text-[11px] text-[hsl(var(--pk-ink-faint))] hover:text-[hsl(var(--pk-bad))] transition-colors"
            >
              Clear selection
            </button>
          )}
        </PopoverPrimitive.Content>
      </PopoverPrimitive.Portal>
    </PopoverPrimitive.Root>
  );
}

/** Side-by-side comparison table for 1+ selected periods — one column per period (chronological),
 * one row per metric. `rows` supplies its own per-period value formatter so any screen can compare
 * whatever figures make sense for its own KPIs. */
export function PeriodComparisonTable({
  periodIds,
  rows,
  onRemove,
}: {
  periodIds: PeriodId[];
  rows: { label: string; get: (periodId: PeriodId) => string }[];
  onRemove?: (periodId: PeriodId) => void;
}) {
  if (periodIds.length === 0) return null;
  const sorted = [...periodIds].sort((a, b) => {
    const pa = periodById(a);
    const pb = periodById(b);
    return pa.fy === pb.fy ? pa.quarter - pb.quarter : pa.fy.localeCompare(pb.fy);
  });

  return (
    <div className="rounded-lg border border-[hsl(var(--pk-border))] bg-[hsl(var(--pk-surface))] shadow-card overflow-x-auto mb-4">
      <table className="w-full text-sm min-w-[480px]">
        <thead>
          <tr className="text-[11px] uppercase tracking-wide text-white bg-[hsl(var(--pk-navy))]">
            <th className="text-left font-medium px-3 py-2">Metric</th>
            {sorted.map((id) => (
              <th key={id} className="text-right font-medium px-3 py-2">
                <span className="inline-flex items-center gap-1.5">
                  {periodById(id).label}
                  {onRemove && (
                    <button onClick={() => onRemove(id)} className="text-white/60 hover:text-white transition-colors" title="Remove from comparison">
                      <X className="h-3 w-3" />
                    </button>
                  )}
                </span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.label} className="border-t border-[hsl(var(--pk-border))]">
              <td className="px-3 py-2 text-[hsl(var(--pk-ink-soft))]">{r.label}</td>
              {sorted.map((id) => (
                <td key={id} className="text-right px-3 py-2 tnum font-medium text-[hsl(var(--pk-ink))]">{r.get(id)}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
