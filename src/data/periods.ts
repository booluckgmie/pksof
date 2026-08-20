import type { Period, PeriodId } from "@/types";

/**
 * The Group's fiscal year-end month, 0-indexed (11 = December) — currently a calendar-year FY.
 * This is the fallback default; the live, admin-editable value lives in Supabase (`org_settings`,
 * see supabase/migrations/0005_org_settings.sql and src/lib/orgSettings.tsx's SettingsProvider) —
 * a System Administrator can change it from the Settings screen without a code change. Functions
 * below take it as an explicit parameter defaulting to this constant, so callers that haven't
 * loaded the live setting yet (or run before login) still get a sensible answer.
 */
export const FISCAL_YEAR_END_MONTH = 11;

export const periods: Period[] = [
  // FY2025 — closed financial year, kept for year-over-year reference.
  { id: "Q1FY25", label: "Q1 FY2025", fy: "FY2025", quarter: 1, cumulativeThreshold: 0.25, mofThreshold: 0.20, isCurrent: false, isOpenForEntry: false },
  { id: "Q2FY25", label: "Q2 FY2025", fy: "FY2025", quarter: 2, cumulativeThreshold: 0.50, mofThreshold: 0.40, isCurrent: false, isOpenForEntry: false },
  { id: "Q3FY25", label: "Q3 FY2025", fy: "FY2025", quarter: 3, cumulativeThreshold: 0.75, mofThreshold: 0.60, isCurrent: false, isOpenForEntry: false },
  { id: "Q4FY25", label: "Q4 FY2025", fy: "FY2025", quarter: 4, cumulativeThreshold: 1.00, mofThreshold: 0.80, isCurrent: false, isOpenForEntry: false },
  // FY2026 — current financial year.
  { id: "Q1FY26", label: "Q1 FY2026", fy: "FY2026", quarter: 1, cumulativeThreshold: 0.25, mofThreshold: 0.20, isCurrent: false, isOpenForEntry: false },
  { id: "Q2FY26", label: "Q2 FY2026", fy: "FY2026", quarter: 2, cumulativeThreshold: 0.50, mofThreshold: 0.40, isCurrent: true, isOpenForEntry: true },
  { id: "Q3FY26", label: "Q3 FY2026", fy: "FY2026", quarter: 3, cumulativeThreshold: 0.75, mofThreshold: 0.60, isCurrent: false, isOpenForEntry: false },
  { id: "Q4FY26", label: "Q4 FY2026", fy: "FY2026", quarter: 4, cumulativeThreshold: 1.00, mofThreshold: 0.80, isCurrent: false, isOpenForEntry: false },
  // FY2027 — future financial year, not yet open for entry.
  { id: "Q1FY27", label: "Q1 FY2027", fy: "FY2027", quarter: 1, cumulativeThreshold: 0.25, mofThreshold: 0.20, isCurrent: false, isOpenForEntry: false },
  { id: "Q2FY27", label: "Q2 FY2027", fy: "FY2027", quarter: 2, cumulativeThreshold: 0.50, mofThreshold: 0.40, isCurrent: false, isOpenForEntry: false },
  { id: "Q3FY27", label: "Q3 FY2027", fy: "FY2027", quarter: 3, cumulativeThreshold: 0.75, mofThreshold: 0.60, isCurrent: false, isOpenForEntry: false },
  { id: "Q4FY27", label: "Q4 FY2027", fy: "FY2027", quarter: 4, cumulativeThreshold: 1.00, mofThreshold: 0.80, isCurrent: false, isOpenForEntry: false },
];

export const periodById = (id: string) => periods.find((p) => p.id === id)!;

/** [start, end) calendar-quarter date range for a period, derived from its fy + quarter (FY = calendar year). */
function periodDateRange(p: Period, fyEndMonth: number): [Date, Date] {
  const year = parseInt(p.fy.replace("FY", ""), 10);
  const fyStartMonth = (fyEndMonth + 1) % 12;
  const startMonth = (fyStartMonth + (p.quarter - 1) * 3) % 12;
  const start = new Date(Date.UTC(year, startMonth, 1));
  const end = new Date(Date.UTC(year, startMonth + 3, 1));
  return [start, end];
}

/**
 * The most recently *completed* quarter as of `now` — computed from the real date rather than
 * a hardcoded flag, so the app's default selection tracks forward on its own every quarter.
 * Reporting is retrospective: the quarter `now` currently falls inside isn't over yet, so there's
 * nothing to report for it — the right default is the last quarter that has actually closed.
 * Falls back to the earliest seeded period if `now` predates all of them. `fyEndMonth` defaults
 * to the fallback constant — pass the live org_settings value once it's loaded.
 */
export function resolveCurrentPeriodId(now: Date = new Date(), fyEndMonth: number = FISCAL_YEAR_END_MONTH): PeriodId {
  const sorted = [...periods].sort((a, b) => periodDateRange(a, fyEndMonth)[0].getTime() - periodDateRange(b, fyEndMonth)[0].getTime());
  const completed = sorted.filter((p) => periodDateRange(p, fyEndMonth)[1] <= now);
  return (completed[completed.length - 1] ?? sorted[0]).id;
}

// ── Monthly granularity (Financial Trend detail data only — see note below) ─

/** `${quarterId}-M1` | `${quarterId}-M2` | `${quarterId}-M3` for every quarter — e.g. "Q1FY26-M1". */
export type MonthPeriodId = `${PeriodId}-M1` | `${PeriodId}-M2` | `${PeriodId}-M3`;

export interface MonthPeriod {
  id: MonthPeriodId;
  label: string;
  parentQuarter: PeriodId;
}

const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/**
 * One calendar-month period per quarter (36 total), purely so Financial Trend detail_metrics
 * rows can carry monthly-resolution figures per Progress Meeting #1 ("support monthly view, not
 * just quarterly") — see supabase/migrations/0006_monthly_periods.sql. KPI achievement scoring
 * (fact_kpi_results/submissions) stays quarterly-only; that's the Group's actual assessment
 * cadence, not something this widens. Labels use the static FISCAL_YEAR_END_MONTH, same caveat
 * as that constant — computed once at module load, won't re-derive from a live org_settings change.
 */
export const monthPeriods: MonthPeriod[] = periods.flatMap((q) => {
  const year = parseInt(q.fy.replace("FY", ""), 10);
  const fyStartMonth = (FISCAL_YEAR_END_MONTH + 1) % 12;
  return ([1, 2, 3] as const).map((n) => {
    const offset = (q.quarter - 1) * 3 + (n - 1);
    const calMonth = (fyStartMonth + offset) % 12;
    const calYear = year + Math.floor((fyStartMonth + offset) / 12);
    return { id: `${q.id}-M${n}` as MonthPeriodId, label: `${MONTH_NAMES[calMonth]} ${calYear}`, parentQuarter: q.id };
  });
});

export const monthsForQuarter = (quarterId: PeriodId): MonthPeriod[] => monthPeriods.filter((m) => m.parentQuarter === quarterId);
