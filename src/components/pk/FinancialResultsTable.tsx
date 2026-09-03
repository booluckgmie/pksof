import { useState, Fragment } from "react";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

export interface PlSnapshot {
  revenue: number | null;
  financeIncome: number | null;
  otherIncome: number | null;
  totalIncome: number | null;
  expenses: number | null;
  pbt: number | null;
  taxation: number | null;
  profitAfterTax: number | null;
  dividend: number | null;
  netProfit: number | null;
}

export interface BreakdownItem {
  key: string;
  label: string;
  value: number | null;
}

/** Accounting style — negative in parens, zero as a dash, thousands-separated, no decimals
 * (everything here is already in RM'000). */
function fmt(v: number | null): string {
  if (v === null) return "—";
  if (v === 0) return "-";
  const s = Math.abs(v).toLocaleString("en-MY", { maximumFractionDigits: 0 });
  return v < 0 ? `(${s})` : s;
}

function fmtPct(v: number | null): string {
  if (v === null) return "—";
  if (Math.abs(v) > 100) return v < 0 ? "(> 100)" : "> 100";
  const s = Math.abs(Math.round(v)).toString();
  return v < 0 ? `(${s})` : v === 0 ? "-" : s;
}

function variance(current: number | null, compare: number | null): { abs: number | null; pct: number | null } {
  if (current === null || compare === null) return { abs: null, pct: null };
  const abs = current - compare;
  const pct = compare !== 0 ? (abs / Math.abs(compare)) * 100 : null;
  return { abs, pct };
}

interface MainRow {
  key: keyof PlSnapshot;
  label: string;
  bold?: boolean;
  shaded?: boolean;
  indent?: boolean;
  drill?: "revenue" | "expenses";
}

const ROWS: MainRow[] = [
  { key: "revenue", label: "REVENUE", bold: true, drill: "revenue" },
  { key: "financeIncome", label: "Finance income", indent: true },
  { key: "otherIncome", label: "Other income", indent: true },
  { key: "totalIncome", label: "TOTAL INCOME", bold: true },
  { key: "expenses", label: "Expenses", drill: "expenses" },
  { key: "pbt", label: "PROFIT BEFORE TAX", bold: true, shaded: true },
  { key: "taxation", label: "Taxation", indent: true },
  { key: "profitAfterTax", label: "PROFIT AFTER TAX", bold: true, shaded: true },
  { key: "dividend", label: "Dividend", indent: true },
  { key: "netProfit", label: "NET PROFIT", bold: true, shaded: true },
];

/**
 * The client's own "Overview of Financial Results" report table — a two-column comparison (either
 * Current Quarter vs Preceding Quarter, or YTD Actual vs Budget) in RM'000, with a Variance
 * RM'000/% column, and a 2-level drill-down: clicking Revenue or Expenses reveals that row's own
 * category breakdown (revenue_by_source / expense_by_category) with the same current/compare/
 * variance shape, capped at one level deep per the client's own report design.
 */
export function FinancialResultsTable({
  title,
  currentLabel,
  compareLabel,
  current,
  compare,
  revenueCurrent,
  revenueCompare,
  expensesCurrent,
  expensesCompare,
}: {
  title: string;
  currentLabel: string;
  compareLabel: string;
  current: PlSnapshot;
  compare: PlSnapshot;
  revenueCurrent: BreakdownItem[];
  revenueCompare: BreakdownItem[];
  expensesCurrent: BreakdownItem[];
  expensesCompare: BreakdownItem[];
}) {
  const [open, setOpen] = useState<"revenue" | "expenses" | null>(null);

  const breakdownFor = (which: "revenue" | "expenses") =>
    which === "revenue" ? { items: revenueCurrent, compareItems: revenueCompare, totalLabel: "TOTAL REVENUE" } : { items: expensesCurrent, compareItems: expensesCompare, totalLabel: "TOTAL EXPENSES" };

  return (
    <div className="rounded-lg border border-[hsl(var(--pk-border))] bg-[hsl(var(--pk-surface))] shadow-card overflow-hidden">
      <div className="px-4 pt-3.5 pb-1 font-head font-bold text-[hsl(var(--pk-ink))]">{title}</div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm min-w-[640px]">
          <thead>
            <tr className="text-[11px] uppercase tracking-wide text-white bg-[hsl(var(--pk-navy))]">
              <th className="text-left font-medium px-3 py-2.5">RM'000</th>
              <th className="text-right font-medium px-3 py-2.5">{currentLabel}</th>
              <th className="text-right font-medium px-3 py-2.5">{compareLabel}</th>
              <th className="text-right font-medium px-3 py-2.5">Variance RM'000</th>
              <th className="text-right font-medium px-3 py-2.5">%</th>
            </tr>
          </thead>
          <tbody>
            {ROWS.map((r) => {
              const cur = current[r.key];
              const cmp = compare[r.key];
              const v = variance(cur, cmp);
              const isDrillable = !!r.drill;
              const isOpenRow = isDrillable && open === r.drill;
              return (
                <Fragment key={r.key}>
                  <tr
                    onClick={isDrillable ? () => setOpen(isOpenRow ? null : (r.drill ?? null)) : undefined}
                    className={cn(
                      "border-t border-[hsl(var(--pk-border))]",
                      r.shaded && "bg-[hsl(var(--pk-surface-2))]",
                      isDrillable && "cursor-pointer hover:bg-[hsl(var(--pk-surface-2))]"
                    )}
                  >
                    <td className={cn("px-3 py-2", r.bold ? "font-bold text-[hsl(var(--pk-ink))]" : "text-[hsl(var(--pk-ink-soft))]", r.indent && "pl-6")}>
                      <span className="inline-flex items-center gap-1.5">
                        {r.label}
                        {isDrillable && <ChevronRight className={cn("h-3.5 w-3.5 text-[hsl(var(--pk-ink-faint))] transition-transform", isOpenRow && "rotate-90")} />}
                      </span>
                    </td>
                    <td className={cn("text-right px-3 py-2 tnum", r.bold && "font-bold")}>{fmt(cur)}</td>
                    <td className={cn("text-right px-3 py-2 tnum", r.bold && "font-bold")}>{fmt(cmp)}</td>
                    <td className="text-right px-3 py-2 tnum italic">{fmt(v.abs)}</td>
                    <td className="text-right px-3 py-2 tnum italic">{fmtPct(v.pct)}</td>
                  </tr>
                  {isOpenRow && (() => {
                    const { items, compareItems, totalLabel } = breakdownFor(r.drill!);
                    const totalCur = items.reduce((s, it) => s + (it.value ?? 0), 0);
                    const totalCmp = compareItems.reduce((s, it) => s + (it.value ?? 0), 0);
                    const totalV = variance(totalCur, totalCmp);
                    return (
                      <>
                        {items.map((it) => {
                          const cmpV = compareItems.find((c) => c.key === it.key)?.value ?? null;
                          const iv = variance(it.value, cmpV);
                          return (
                            <tr key={it.key} className="border-t border-[hsl(var(--pk-border))] bg-[hsl(var(--pk-accent-soft))]">
                              <td className="px-3 py-1.5 pl-9 text-[12.5px] text-[hsl(var(--pk-ink-soft))]">{it.label}</td>
                              <td className="text-right px-3 py-1.5 tnum text-[12.5px]">{fmt(it.value)}</td>
                              <td className="text-right px-3 py-1.5 tnum text-[12.5px]">{fmt(cmpV)}</td>
                              <td className="text-right px-3 py-1.5 tnum italic text-[12.5px]">{fmt(iv.abs)}</td>
                              <td className="text-right px-3 py-1.5 tnum italic text-[12.5px]">{fmtPct(iv.pct)}</td>
                            </tr>
                          );
                        })}
                        <tr className="border-t border-[hsl(var(--pk-border))] bg-[hsl(var(--pk-accent-soft))] font-semibold">
                          <td className="px-3 py-1.5 pl-9 text-[12.5px]">{totalLabel}</td>
                          <td className="text-right px-3 py-1.5 tnum text-[12.5px]">{fmt(totalCur)}</td>
                          <td className="text-right px-3 py-1.5 tnum text-[12.5px]">{fmt(totalCmp)}</td>
                          <td className="text-right px-3 py-1.5 tnum italic text-[12.5px]">{fmt(totalV.abs)}</td>
                          <td className="text-right px-3 py-1.5 tnum italic text-[12.5px]">{fmtPct(totalV.pct)}</td>
                        </tr>
                      </>
                    );
                  })()}
                </Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
