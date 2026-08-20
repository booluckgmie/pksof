import type { Period, PeriodId } from "@/types";

/**
 * The Group's fiscal year-end month, 0-indexed (11 = December) — currently a calendar-year FY.
 * Single source of truth for FY quarter boundaries below; change this one constant if the Group
 * ever moves to a non-calendar fiscal year, rather than touching `periodDateRange` or the seeded
 * quarter labels. Per client direction (Progress Meeting #1), this is an admin-settable config
 * value in intent, not a hardcoded assumption — a full settings UI is out of scope for this pass.
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
function periodDateRange(p: Period): [Date, Date] {
  const year = parseInt(p.fy.replace("FY", ""), 10);
  const fyStartMonth = (FISCAL_YEAR_END_MONTH + 1) % 12;
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
 * Falls back to the earliest seeded period if `now` predates all of them.
 */
export function resolveCurrentPeriodId(now: Date = new Date()): PeriodId {
  const sorted = [...periods].sort((a, b) => periodDateRange(a)[0].getTime() - periodDateRange(b)[0].getTime());
  const completed = sorted.filter((p) => periodDateRange(p)[1] <= now);
  return (completed[completed.length - 1] ?? sorted[0]).id;
}
