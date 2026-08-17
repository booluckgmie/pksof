import type { Period, PeriodId } from "@/types";

export const periods: Period[] = [
  // FY2025 — closed financial year, kept for year-over-year reference.
  { id: "Q1FY25", label: "Q1 FY2025", fy: "FY2025", quarter: 1, cumulativeThreshold: 0.25, mofThreshold: 0.20, isCurrent: false, isOpenForEntry: false },
  { id: "Q2FY25", label: "Q2 FY2025", fy: "FY2025", quarter: 2, cumulativeThreshold: 0.50, mofThreshold: 0.40, isCurrent: false, isOpenForEntry: false },
  { id: "Q3FY25", label: "Q3 FY2025", fy: "FY2025", quarter: 3, cumulativeThreshold: 0.75, mofThreshold: 0.60, isCurrent: false, isOpenForEntry: false },
  { id: "Q4FY25", label: "Q4 FY2025", fy: "FY2025", quarter: 4, cumulativeThreshold: 1.00, mofThreshold: 0.80, isCurrent: false, isOpenForEntry: false },
  // FY2026 — current financial year.
  { id: "Q1FY26", label: "Q1 FY2026", fy: "FY2026", quarter: 1, cumulativeThreshold: 0.25, mofThreshold: 0.20, isCurrent: false, isOpenForEntry: false },
  { id: "Q2FY26", label: "Q2 FY2026", fy: "FY2026", quarter: 2, cumulativeThreshold: 0.50, mofThreshold: 0.40, isCurrent: false, isOpenForEntry: true },
  { id: "Q3FY26", label: "Q3 FY2026", fy: "FY2026", quarter: 3, cumulativeThreshold: 0.75, mofThreshold: 0.60, isCurrent: true, isOpenForEntry: true },
  { id: "Q4FY26", label: "Q4 FY2026", fy: "FY2026", quarter: 4, cumulativeThreshold: 1.00, mofThreshold: 0.80, isCurrent: false, isOpenForEntry: false },
];

export const periodById = (id: string) => periods.find((p) => p.id === id)!;

/** [start, end) calendar-quarter date range for a period, derived from its fy + quarter (FY = calendar year). */
function periodDateRange(p: Period): [Date, Date] {
  const year = parseInt(p.fy.replace("FY", ""), 10);
  const startMonth = (p.quarter - 1) * 3;
  const start = new Date(Date.UTC(year, startMonth, 1));
  const end = new Date(Date.UTC(year, startMonth + 3, 1));
  return [start, end];
}

/**
 * The period whose calendar quarter contains `now` — computed from the real date rather than
 * a hardcoded flag, so the app's default selection tracks forward on its own every quarter.
 * Falls back to the closest period if `now` falls outside the seeded FY range entirely.
 */
export function resolveCurrentPeriodId(now: Date = new Date()): PeriodId {
  const containing = periods.find((p) => {
    const [start, end] = periodDateRange(p);
    return now >= start && now < end;
  });
  if (containing) return containing.id;

  const sorted = [...periods].sort((a, b) => periodDateRange(a)[0].getTime() - periodDateRange(b)[0].getTime());
  const past = sorted.filter((p) => periodDateRange(p)[0] <= now);
  return (past[past.length - 1] ?? sorted[0]).id;
}
