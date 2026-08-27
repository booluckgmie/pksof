import type { FactKpiResultSeed } from "@/types";

/**
 * SAMPLE / DUMMY DATA — illustrative only.
 * Shaped like real quarterly submissions but with invented figures,
 * so the prototype can be explored without touching live numbers.
 *
 * FY2025 is a closed financial year — all four quarters are seeded as final,
 * published figures, for year-over-year reference against FY2026.
 * FY2026: Q1 is seeded (as if already Submitted → Verified → Published).
 * Q2 FY2026 is intentionally empty — use Data Entry to submit it.
 */
export const factSeed: FactKpiResultSeed[] = [
  // ── FY2025 (closed) ────────────────────────────────────────────────
  { kpiId: "KPI1", entityId: "HQ", periodId: "Q1FY25", ytdTarget: 25.0, ytdActual: 19.8, status: "not-met" },
  { kpiId: "KPI1", entityId: "HQ", periodId: "Q2FY25", ytdTarget: 50.0, ytdActual: 23.1, status: "not-met" },
  { kpiId: "KPI1", entityId: "HQ", periodId: "Q3FY25", ytdTarget: 75.0, ytdActual: 24.4, status: "not-met" },
  { kpiId: "KPI1", entityId: "HQ", periodId: "Q4FY25", ytdTarget: 100.0, ytdActual: 33.6, status: "not-met" },

  { kpiId: "KPI2", entityId: "HQ", periodId: "Q1FY25", ytdTarget: 58.0, ytdActual: 61.4, status: "not-met" },
  { kpiId: "KPI2", entityId: "HQ", periodId: "Q2FY25", ytdTarget: 58.0, ytdActual: 57.8, status: "met" },
  { kpiId: "KPI2", entityId: "HQ", periodId: "Q3FY25", ytdTarget: 58.0, ytdActual: 55.1, status: "met" },
  { kpiId: "KPI2", entityId: "HQ", periodId: "Q4FY25", ytdTarget: 58.0, ytdActual: 49.6, status: "met" },

  { kpiId: "KPI3", entityId: "HQ", periodId: "Q1FY25", ytdTarget: 4.5, ytdActual: 4.1, status: "not-met" },
  { kpiId: "KPI3", entityId: "HQ", periodId: "Q2FY25", ytdTarget: 4.5, ytdActual: 4.2, status: "not-met" },
  { kpiId: "KPI3", entityId: "HQ", periodId: "Q3FY25", ytdTarget: 4.5, ytdActual: 4.3, status: "not-met" },
  { kpiId: "KPI3", entityId: "HQ", periodId: "Q4FY25", ytdTarget: 4.5, ytdActual: 4.3, status: "not-met" },

  { kpiId: "KPI4", entityId: "HQ", periodId: "Q1FY25", ytdTarget: null, ytdActual: null, status: "not-measurable", note: "Annual assessment — results at FY close" },
  { kpiId: "KPI4", entityId: "HQ", periodId: "Q2FY25", ytdTarget: null, ytdActual: null, status: "not-measurable", note: "Annual assessment — results at FY close" },
  { kpiId: "KPI4", entityId: "HQ", periodId: "Q3FY25", ytdTarget: null, ytdActual: null, status: "not-measurable", note: "Annual assessment — results at FY close" },
  { kpiId: "KPI4", entityId: "HQ", periodId: "Q4FY25", ytdTarget: 100.0, ytdActual: 94.0, status: "not-met" },

  { kpiId: "KPI5", entityId: "HQ", periodId: "Q1FY25", ytdTarget: null, ytdActual: null, status: "not-measurable", note: "Bi-annual survey — next in Q2" },
  { kpiId: "KPI5", entityId: "HQ", periodId: "Q2FY25", ytdTarget: 4.7, ytdActual: 4.5, status: "not-met" },
  { kpiId: "KPI5", entityId: "HQ", periodId: "Q3FY25", ytdTarget: null, ytdActual: null, status: "not-measurable", note: "Bi-annual survey — next in Q4" },
  { kpiId: "KPI5", entityId: "HQ", periodId: "Q4FY25", ytdTarget: 4.7, ytdActual: 4.6, status: "not-met" },

  { kpiId: "KPI6", entityId: "HQ", periodId: "Q1FY25", ytdTarget: 95.0, ytdActual: 94.0, status: "not-met" },
  { kpiId: "KPI6", entityId: "HQ", periodId: "Q2FY25", ytdTarget: 95.0, ytdActual: 95.5, status: "met" },
  { kpiId: "KPI6", entityId: "HQ", periodId: "Q3FY25", ytdTarget: 95.0, ytdActual: 96.2, status: "met" },
  { kpiId: "KPI6", entityId: "HQ", periodId: "Q4FY25", ytdTarget: 95.0, ytdActual: 96.8, status: "met" },

  { kpiId: "KPI7", entityId: "HQ", periodId: "Q1FY25", ytdTarget: 1, ytdActual: 0, status: "not-met" },
  { kpiId: "KPI7", entityId: "HQ", periodId: "Q2FY25", ytdTarget: 2, ytdActual: 1, status: "not-met" },
  { kpiId: "KPI7", entityId: "HQ", periodId: "Q3FY25", ytdTarget: 2, ytdActual: 2, status: "met" },
  { kpiId: "KPI7", entityId: "HQ", periodId: "Q4FY25", ytdTarget: 3, ytdActual: 3, status: "met" },

  { kpiId: "KPI8", entityId: "HQ", periodId: "Q1FY25", ytdTarget: 2, ytdActual: 1, status: "not-met" },
  { kpiId: "KPI8", entityId: "HQ", periodId: "Q2FY25", ytdTarget: 3, ytdActual: 2, status: "not-met" },
  { kpiId: "KPI8", entityId: "HQ", periodId: "Q3FY25", ytdTarget: 5, ytdActual: 4, status: "not-met" },
  { kpiId: "KPI8", entityId: "HQ", periodId: "Q4FY25", ytdTarget: 6, ytdActual: 5, status: "not-met" },

  { kpiId: "KPI9", entityId: "HQ", periodId: "Q1FY25", ytdTarget: 80.0, ytdActual: 76.3, status: "not-met" },
  { kpiId: "KPI9", entityId: "HQ", periodId: "Q2FY25", ytdTarget: 80.0, ytdActual: 82.0, status: "met" },
  { kpiId: "KPI9", entityId: "HQ", periodId: "Q3FY25", ytdTarget: 80.0, ytdActual: 87.0, status: "met" },
  { kpiId: "KPI9", entityId: "HQ", periodId: "Q4FY25", ytdTarget: 80.0, ytdActual: 92.7, status: "met" },

  { kpiId: "KPI10", entityId: "HQ", periodId: "Q1FY25", ytdTarget: null, ytdActual: null, status: "not-measurable", note: "Programmes had not yet commenced" },
  { kpiId: "KPI10", entityId: "HQ", periodId: "Q2FY25", ytdTarget: 100.0, ytdActual: 45.0, status: "not-met" },
  { kpiId: "KPI10", entityId: "HQ", periodId: "Q3FY25", ytdTarget: 100.0, ytdActual: 70.0, status: "not-met" },
  { kpiId: "KPI10", entityId: "HQ", periodId: "Q4FY25", ytdTarget: 100.0, ytdActual: 88.0, status: "not-met" },

  { kpiId: "KPI11", entityId: "HQ", periodId: "Q1FY25", ytdTarget: 0.55, ytdActual: 0.50, status: "not-met" },
  { kpiId: "KPI11", entityId: "HQ", periodId: "Q2FY25", ytdTarget: 1.10, ytdActual: 1.15, status: "met" },
  { kpiId: "KPI11", entityId: "HQ", periodId: "Q3FY25", ytdTarget: 1.65, ytdActual: 1.80, status: "met" },
  { kpiId: "KPI11", entityId: "HQ", periodId: "Q4FY25", ytdTarget: 2.20, ytdActual: 2.40, status: "met" },

  { kpiId: "KPI12", entityId: "HQ", periodId: "Q1FY25", ytdTarget: 70.0, ytdActual: 86.0, status: "met" },
  { kpiId: "KPI12", entityId: "HQ", periodId: "Q2FY25", ytdTarget: 70.0, ytdActual: 87.0, status: "met" },
  { kpiId: "KPI12", entityId: "HQ", periodId: "Q3FY25", ytdTarget: 70.0, ytdActual: 88.0, status: "met" },
  { kpiId: "KPI12", entityId: "HQ", periodId: "Q4FY25", ytdTarget: 70.0, ytdActual: 88.5, status: "met" },

  { kpiId: "KPI13", entityId: "HQ", periodId: "Q1FY25", ytdTarget: 30, ytdActual: 30, status: "met" },
  { kpiId: "KPI13", entityId: "HQ", periodId: "Q2FY25", ytdTarget: 60, ytdActual: 65, status: "met" },
  { kpiId: "KPI13", entityId: "HQ", periodId: "Q3FY25", ytdTarget: 90, ytdActual: 100, status: "met" },
  { kpiId: "KPI13", entityId: "HQ", periodId: "Q4FY25", ytdTarget: 120, ytdActual: 132, status: "met" },

  // ── FY2026 (current) ───────────────────────────────────────────────
  { kpiId: "KPI1", entityId: "HQ", periodId: "Q1FY26", ytdTarget: 23.2, ytdActual: 27.5, status: "met" },
  { kpiId: "KPI2", entityId: "HQ", periodId: "Q1FY26", ytdTarget: 58.0, ytdActual: 44.2, status: "met" },
  { kpiId: "KPI3", entityId: "HQ", periodId: "Q1FY26", ytdTarget: 4.5, ytdActual: 4.2, status: "not-met" },
  { kpiId: "KPI4", entityId: "HQ", periodId: "Q1FY26", ytdTarget: null, ytdActual: null, status: "not-measurable", note: "Annual assessment scheduled Q4" },
  { kpiId: "KPI5", entityId: "HQ", periodId: "Q1FY26", ytdTarget: null, ytdActual: null, status: "not-measurable", note: "Bi-annual survey — next in Q2" },
  // Q2FY26's survey round is included even though the rest of FY2026's data stops at Q1 —
  // the external survey is fielded and tallied faster than the quarter's other KPI data, so by
  // the time Q2's reporting window opens its result is already in hand.
  { kpiId: "KPI5", entityId: "HQ", periodId: "Q2FY26", ytdTarget: 4.7, ytdActual: 4.7, status: "met" },
  { kpiId: "KPI6", entityId: "HQ", periodId: "Q1FY26", ytdTarget: null, ytdActual: null, status: "not-measurable", note: "Baseline monitoring framework in progress" },
  { kpiId: "KPI7", entityId: "HQ", periodId: "Q1FY26", ytdTarget: null, ytdActual: null, status: "not-measurable", note: "Initiatives planned to complete from Q3" },
  { kpiId: "KPI8", entityId: "HQ", periodId: "Q1FY26", ytdTarget: 6, ytdActual: 3, status: "not-met" },
  { kpiId: "KPI9", entityId: "HQ", periodId: "Q1FY26", ytdTarget: 80.0, ytdActual: 88.7, status: "met" },
  { kpiId: "KPI10", entityId: "HQ", periodId: "Q1FY26", ytdTarget: null, ytdActual: null, status: "not-measurable", note: "Programmes commence Q2 onward" },
  { kpiId: "KPI11", entityId: "HQ", periodId: "Q1FY26", ytdTarget: 0.55, ytdActual: 0.82, status: "met" },
  { kpiId: "KPI12", entityId: "HQ", periodId: "Q1FY26", ytdTarget: 70.0, ytdActual: 90.7, status: "met" },
  { kpiId: "KPI13", entityId: "HQ", periodId: "Q1FY26", ytdTarget: null, ytdActual: null, status: "not-measurable", note: "Training commences Q2 onward" },
];

/** Simple whole-of-entity snapshot for the Main Screen strip — dummy figures. */
export const entitySnapshot: Record<string, { achievement: number; status: "on-track" | "at-risk" | "attention" }> = {
  HQ: { achievement: 61.5, status: "on-track" },
  SJPP: { achievement: 68.9, status: "on-track" },
  SJKP: { achievement: 57.2, status: "attention" },
  DANAHARTA: { achievement: 54.0, status: "at-risk" },
  DANAINFRA: { achievement: 63.8, status: "on-track" },
  GOVCO: { achievement: 59.6, status: "attention" },
};
