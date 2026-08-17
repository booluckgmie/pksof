import type { Period } from "@/types";

export const periods: Period[] = [
  // FY2025 — closed financial year, kept for year-over-year reference.
  { id: "Q1FY25", label: "Q1 FY2025", fy: "FY2025", quarter: 1, cumulativeThreshold: 0.25, mofThreshold: 0.20, isCurrent: false, isOpenForEntry: false },
  { id: "Q2FY25", label: "Q2 FY2025", fy: "FY2025", quarter: 2, cumulativeThreshold: 0.50, mofThreshold: 0.40, isCurrent: false, isOpenForEntry: false },
  { id: "Q3FY25", label: "Q3 FY2025", fy: "FY2025", quarter: 3, cumulativeThreshold: 0.75, mofThreshold: 0.60, isCurrent: false, isOpenForEntry: false },
  { id: "Q4FY25", label: "Q4 FY2025", fy: "FY2025", quarter: 4, cumulativeThreshold: 1.00, mofThreshold: 0.80, isCurrent: false, isOpenForEntry: false },
  // FY2026 — current financial year.
  { id: "Q1FY26", label: "Q1 FY2026", fy: "FY2026", quarter: 1, cumulativeThreshold: 0.25, mofThreshold: 0.20, isCurrent: true, isOpenForEntry: true },
  { id: "Q2FY26", label: "Q2 FY2026", fy: "FY2026", quarter: 2, cumulativeThreshold: 0.50, mofThreshold: 0.40, isCurrent: false, isOpenForEntry: true },
  { id: "Q3FY26", label: "Q3 FY2026", fy: "FY2026", quarter: 3, cumulativeThreshold: 0.75, mofThreshold: 0.60, isCurrent: false, isOpenForEntry: false },
  { id: "Q4FY26", label: "Q4 FY2026", fy: "FY2026", quarter: 4, cumulativeThreshold: 1.00, mofThreshold: 0.80, isCurrent: false, isOpenForEntry: false },
];

export const periodById = (id: string) => periods.find((p) => p.id === id)!;
