import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { fetchDetailMetrics, fetchDetailRecords, type DetailMetricRow, type DetailRecordRow } from "@/lib/api/details";
import { useSession } from "@/lib/session";
import { periods } from "@/data/periods";
import type { EntityId, PeriodId } from "@/types";
import type { InitiativeStatus } from "@/data/initiatives";

interface DetailsContextValue {
  loading: boolean;
  metrics: DetailMetricRow[];
  records: DetailRecordRow[];
  refresh: () => Promise<void>;
}

const DetailsContext = createContext<DetailsContextValue | null>(null);

export function DetailsProvider({ children }: { children: ReactNode }) {
  const [metrics, setMetrics] = useState<DetailMetricRow[]>([]);
  const [records, setRecords] = useState<DetailRecordRow[]>([]);
  const [loading, setLoading] = useState(true);

  const load = () =>
    Promise.all([fetchDetailMetrics(), fetchDetailRecords()])
      .then(([m, r]) => {
        setMetrics(m);
        setRecords(r);
      })
      .catch((err: Error) => {
        console.error("Failed to load detail data from Supabase", err);
      });

  useEffect(() => {
    let cancelled = false;
    load()
      .then(() => {})
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <DetailsContext.Provider value={{ loading, metrics, records, refresh: load }}>{children}</DetailsContext.Provider>;
}

function useDetailsRaw(): DetailsContextValue {
  const ctx = useContext(DetailsContext);
  if (!ctx) throw new Error("useDetails must be used within DetailsProvider");
  return ctx;
}

// ── Shared helpers ──────────────────────────────────────────────────────────

/** Periods that have at least one row for a given metric/record key, for this entity. */
function periodsWithData(rows: { entityId: EntityId; periodId: PeriodId }[], entityId: EntityId, matches: (r: { entityId: EntityId; periodId: PeriodId }) => boolean): Set<PeriodId> {
  const set = new Set<PeriodId>();
  for (const r of rows) {
    if (r.entityId === entityId && matches(r)) set.add(r.periodId);
  }
  return set;
}

/** Nothing submitted yet for `periodId`? Fall back to the nearest earlier period that has data,
 * so browsing an unreported quarter shows the last known state instead of going blank/zero —
 * same continuity the static prototype data had, now driven by whatever's actually been entered. */
function resolvePeriod(periodId: PeriodId, available: Set<PeriodId>): PeriodId | null {
  const idx = periods.findIndex((p) => p.id === periodId);
  for (let i = idx; i >= 0; i--) {
    if (available.has(periods[i].id)) return periods[i].id;
  }
  return null;
}

/** For flat/snapshot datasets that aren't period-selector-reactive (financial statements,
 * initiative lists, compliance tables) — use whichever period has the most recent submission. */
function latestPeriodWithData(available: Set<PeriodId>): PeriodId | null {
  for (let i = periods.length - 1; i >= 0; i--) {
    if (available.has(periods[i].id)) return periods[i].id;
  }
  return null;
}

// ── Headcount / demographics ────────────────────────────────────────────────

export interface HeadcountSummary {
  totalEmployees: number;
  bumiputera: number;
  nonBumiputera: number;
  approvedHeadcount: number;
  filledPosition: number;
}

export interface RecruitmentMetric {
  metric: string;
  weight: number;
  score: string;
  note: string;
  weighted: number;
}

export interface BumiputeraTrainingSnapshot {
  poolIdentified: number;
  attendedOne: number;
  attendedTwoPlus: number;
  stage: string;
}

export interface Initiative {
  name: string;
  start: string;
  end: string;
  status: InitiativeStatus;
  nextAction: string;
}

/** Reference figures that don't come from data entry — fixed external benchmark / catalog data. */
export const industryBenchmark = 4.2;
export const priorYearTrained = 132;
export const peopleDevProgrammes = [
  {
    programme: "Leadership Development Programme (continuation)",
    start: "Apr '26", end: "Dec '26", status: "In progress" as const,
    detail: "Continuation of 2025 LDPs; 23 sessions planned across ELDP (3 modules × 3 sessions), MLDP (3 × 4) and ISLDP (2 × 1).",
  },
  {
    programme: "Talent Pool Development Programme",
    start: "Apr '26", end: "Jun '26", status: "In progress" as const,
    detail: "Talent identification, career-aspiration conversations and external assessment to reaffirm the 4Q dimension review.",
  },
  {
    programme: "Data Analytics Skill Development",
    start: "May '26", end: "Sep '26", status: "Planned" as const,
    detail: "Source a suitable provider, confirm modules with HODs, then roll out to identified champions.",
  },
  {
    programme: "Job Evaluation completion",
    start: "Jan '26", end: "Dec '26", status: "In progress" as const,
    detail: "Vendor proposals received; evaluation against outlined criteria in progress ahead of first-round JE for anchoring roles.",
  },
  {
    programme: "Succession Management — Critical Positions",
    start: "Apr '26", end: "Dec '26", status: "Planned" as const,
    detail: "Phase 2A (retiring within 5 years) to Individual Development Plan stage; Phase 2B (all other positions) to Successor Evaluation stage.",
  },
];

export function useDetails() {
  const { metrics, records, loading, refresh } = useDetailsRaw();
  const { entityId } = useSession();

  const metricRows = (key: string) => metrics.filter((r) => r.entityId === entityId && r.metricKey === key);
  const recordRows = (type: string) => records.filter((r) => r.entityId === entityId && r.recordType === type);

  /** Exact lookup for a single figure, no carry-forward fallback — for Data Entry, where you
   * want to know exactly what's recorded for the period you're editing, not an inherited value. */
  const getMetricValue = (periodId: PeriodId, metricKey: string, dimension: string, dimension2 = ""): number | null =>
    metrics.find((r) => r.entityId === entityId && r.periodId === periodId && r.metricKey === metricKey && r.dimension === dimension && r.dimension2 === dimension2)?.value ?? null;

  const headcountSummaryByPeriod = useMemo(() => {
    const rows = metricRows("headcount_summary");
    const available = periodsWithData(rows, entityId, () => true);
    const out = {} as Record<PeriodId, HeadcountSummary>;
    for (const p of periods) {
      const eff = resolvePeriod(p.id, available);
      const forPeriod = eff ? rows.filter((r) => r.periodId === eff) : [];
      const get = (dim: string) => forPeriod.find((r) => r.dimension === dim)?.value ?? 0;
      out[p.id] = {
        totalEmployees: get("total_employees"),
        bumiputera: get("bumiputera"),
        nonBumiputera: get("non_bumiputera"),
        approvedHeadcount: get("approved_headcount"),
        filledPosition: get("filled_position"),
      };
    }
    return out;
  }, [metrics, entityId]);

  const headcountTrend = useMemo(() => {
    const rows = metricRows("headcount_summary");
    const available = [...periodsWithData(rows, entityId, () => true)];
    return periods
      .filter((p) => available.includes(p.id))
      .map((p) => {
        const forPeriod = rows.filter((r) => r.periodId === p.id);
        const get = (dim: string) => forPeriod.find((r) => r.dimension === dim)?.value ?? 0;
        return { period: p.label.replace("FY20", "FY"), actual: get("filled_position"), approved: get("approved_headcount") };
      });
  }, [metrics, entityId]);

  const genderBreakdownByPeriod = useMemo(() => {
    const rows = metricRows("gender_breakdown");
    const available = periodsWithData(rows, entityId, () => true);
    const out = {} as Record<PeriodId, { male: number; female: number }>;
    for (const p of periods) {
      const eff = resolvePeriod(p.id, available);
      const forPeriod = eff ? rows.filter((r) => r.periodId === eff) : [];
      out[p.id] = {
        male: forPeriod.find((r) => r.dimension === "male")?.value ?? 0,
        female: forPeriod.find((r) => r.dimension === "female")?.value ?? 0,
      };
    }
    return out;
  }, [metrics, entityId]);

  function singleDimListFor(metricKey: string, periodId: PeriodId, labels?: string[]) {
    const rows = metricRows(metricKey);
    const available = periodsWithData(rows, entityId, () => true);
    const eff = resolvePeriod(periodId, available);
    const forPeriod = eff ? rows.filter((r) => r.periodId === eff) : [];
    const dims = labels ?? [...new Set(forPeriod.map((r) => r.dimension))];
    return dims.map((d) => ({ dimension: d, value: forPeriod.find((r) => r.dimension === d)?.value ?? 0 }));
  }

  function twoDimListFor(metricKey: string, periodId: PeriodId, labels?: string[]) {
    const rows = metricRows(metricKey);
    const available = periodsWithData(rows, entityId, () => true);
    const eff = resolvePeriod(periodId, available);
    const forPeriod = eff ? rows.filter((r) => r.periodId === eff) : [];
    const dims = labels ?? [...new Set(forPeriod.map((r) => r.dimension))];
    return dims.map((d) => {
      const sub = forPeriod.filter((r) => r.dimension === d);
      return { dimension: d, byDim2: Object.fromEntries(sub.map((r) => [r.dimension2, r.value ?? 0])) as Record<string, number> };
    });
  }

  const gradeBreakdownFor = (periodId: PeriodId) =>
    singleDimListFor("grade_breakdown", periodId, ["Top Management", "Senior Management", "Management", "Executive", "Non-Executive"])
      .map((r) => ({ grade: r.dimension, count: r.value }));

  const ageBreakdownFor = (periodId: PeriodId) =>
    singleDimListFor("age_breakdown", periodId, ["≤30", "31–40", "41–50", "51+"])
      .map((r) => ({ band: r.dimension, count: r.value }));

  const ageGenderBreakdownFor = (periodId: PeriodId) =>
    twoDimListFor("age_gender_breakdown", periodId, ["≤30", "31–40", "41–50", "51+"])
      .map((r) => ({ band: r.dimension, male: r.byDim2.male ?? 0, female: r.byDim2.female ?? 0 }));

  const averageAgeByPeriod = useMemo(() => {
    const rows = metricRows("average_age");
    const available = periodsWithData(rows, entityId, () => true);
    const out = {} as Record<PeriodId, number>;
    for (const p of periods) {
      const eff = resolvePeriod(p.id, available);
      const forPeriod = eff ? rows.filter((r) => r.periodId === eff) : [];
      out[p.id] = forPeriod.find((r) => r.dimension === "avg")?.value ?? 0;
    }
    return out;
  }, [metrics, entityId]);

  const gradeGenderCrossTabFor = (periodId: PeriodId) =>
    twoDimListFor("grade_gender_crosstab", periodId, ["Top Management", "Senior Management", "Management", "Executive", "Non-Executive"])
      .map((r) => ({ grade: r.dimension, male: r.byDim2.male ?? 0, female: r.byDim2.female ?? 0, avgAge: r.byDim2.avgAge ?? 0 }));

  const departmentHeadcountFor = (periodId: PeriodId) =>
    twoDimListFor("dept_headcount", periodId, ["Finance", "Human Resource", "Corporate Performance", "IT & Digital", "Risk & Compliance"])
      .map((r) => ({ dept: r.dimension, approved: r.byDim2.approved ?? 0, filled: r.byDim2.filled ?? 0 }));

  const recruitmentIndexByPeriod = useMemo(() => {
    const rows = metricRows("recruitment_index");
    const metricNames = ["Time to Hire (TTH)", "MRF Fulfilment Rate", "Quality of Hire", "Offer Acceptance Rate"];
    const out: Partial<Record<PeriodId, RecruitmentMetric[]>> = {};
    for (const p of periods) {
      const forPeriod = rows.filter((r) => r.periodId === p.id);
      if (forPeriod.length === 0) continue;
      out[p.id] = metricNames.map((name) => {
        const weight = forPeriod.find((r) => r.dimension === name && r.dimension2 === "weight")?.value ?? 0;
        const score = forPeriod.find((r) => r.dimension === name && r.dimension2 === "score")?.note ?? "";
        const weightedRow = forPeriod.find((r) => r.dimension === name && r.dimension2 === "weighted");
        return { metric: name, weight, score, note: weightedRow?.note ?? "", weighted: weightedRow?.value ?? 0 };
      });
    }
    return out;
  }, [metrics, entityId]);

  const resignedByPeriod = useMemo(() => {
    const rows = metricRows("resigned");
    const available = periodsWithData(rows, entityId, () => true);
    const out = {} as Record<PeriodId, number>;
    for (const p of periods) {
      const eff = resolvePeriod(p.id, available);
      const forPeriod = eff ? rows.filter((r) => r.periodId === eff) : [];
      out[p.id] = forPeriod.find((r) => r.dimension === "count")?.value ?? 0;
    }
    return out;
  }, [metrics, entityId]);

  const turnoverTrend = useMemo(() => {
    const resignedRows = metricRows("resigned");
    const available = [...periodsWithData(resignedRows, entityId, () => true)];
    return periods
      .filter((p) => available.includes(p.id))
      .map((p) => {
        const resigned = resignedRows.find((r) => r.periodId === p.id && r.dimension === "count")?.value ?? 0;
        const summaryRows = metricRows("headcount_summary").filter((r) => r.periodId === p.id);
        const total = summaryRows.find((r) => r.dimension === "total_employees")?.value ?? 0;
        return { period: p.label.replace("FY20", "FY"), rate: total > 0 ? Math.round((resigned / total) * 1000) / 10 : 0 };
      });
  }, [metrics, entityId]);

  const bumiputeraTrainingByPeriod = useMemo(() => {
    const rows = metricRows("bumiputera_training");
    const available = periodsWithData(rows, entityId, () => true);
    const out = {} as Record<PeriodId, BumiputeraTrainingSnapshot>;
    for (const p of periods) {
      const eff = resolvePeriod(p.id, available);
      const forPeriod = eff ? rows.filter((r) => r.periodId === eff) : [];
      out[p.id] = {
        poolIdentified: forPeriod.find((r) => r.dimension === "pool_identified")?.value ?? 0,
        attendedOne: forPeriod.find((r) => r.dimension === "attended_one")?.value ?? 0,
        attendedTwoPlus: forPeriod.find((r) => r.dimension === "attended_two_plus")?.value ?? 0,
        stage: forPeriod.find((r) => r.dimension === "stage")?.note ?? "Not yet commenced",
      };
    }
    return out;
  }, [metrics, entityId]);

  // ── Financial detail ────────────────────────────────────────────────────

  const quarterlyTrend = useMemo(() => {
    const rows = metricRows("financial_trend");
    const available = [...periodsWithData(rows, entityId, () => true)];
    return periods
      .filter((p) => available.includes(p.id))
      .map((p) => {
        const forPeriod = rows.filter((r) => r.periodId === p.id);
        const get = (dim: string) => forPeriod.find((r) => r.dimension === dim)?.value ?? 0;
        return { period: p.label.replace("FY20", "FY"), revenue: get("revenue"), pbt: get("pbt"), cir: get("cir"), netMargin: get("net_margin") };
      });
  }, [metrics, entityId]);

  const actualVsBudget = useMemo(() => {
    const rows = metricRows("actual_vs_budget");
    const eff = latestPeriodWithData(periodsWithData(rows, entityId, () => true));
    if (!eff) return [];
    const items = [...new Set(rows.filter((r) => r.periodId === eff).map((r) => r.dimension))];
    return items.map((item) => {
      const forItem = rows.filter((r) => r.periodId === eff && r.dimension === item);
      return {
        item,
        actual: forItem.find((r) => r.dimension2 === "actual")?.value ?? 0,
        budget: forItem.find((r) => r.dimension2 === "budget")?.value ?? 0,
        py: forItem.find((r) => r.dimension2 === "py")?.value ?? 0,
      };
    });
  }, [metrics, entityId]);

  const varianceCommentary = useMemo(() => {
    const rows = metricRows("variance_commentary");
    const eff = latestPeriodWithData(periodsWithData(rows, entityId, () => true));
    const forPeriod = eff ? rows.filter((r) => r.periodId === eff) : [];
    const get = (key: string) => forPeriod.find((r) => r.dimension === key)?.note ?? "";
    return {
      revenue: get("revenue"), staffCost: get("staffCost"), adminCost: get("adminCost"), pbt: get("pbt"), outlook: get("outlook"),
    };
  }, [metrics, entityId]);

  const balanceSheet = useMemo(() => {
    const trendRows = metricRows("balance_sheet");
    const linesRows = metricRows("balance_sheet_lines");
    const available = [...periodsWithData(trendRows, entityId, () => true)];
    const trend = periods
      .filter((p) => available.includes(p.id))
      .map((p) => {
        const forPeriod = trendRows.filter((r) => r.periodId === p.id);
        return {
          period: p.label.replace("FY20", "FY"),
          equity: forPeriod.find((r) => r.dimension === "shareholders_fund")?.value ?? 0,
          liabilities: forPeriod.find((r) => r.dimension === "total_liabilities")?.value ?? 0,
        };
      });
    const eff = latestPeriodWithData(periodsWithData(trendRows, entityId, () => true));
    const shareholdersFund = eff ? (trendRows.find((r) => r.periodId === eff && r.dimension === "shareholders_fund")?.value ?? 0) : 0;
    const priorIdx = eff ? periods.findIndex((p) => p.id === eff) - 1 : -1;
    const priorPeriodId = priorIdx >= 0 ? periods[priorIdx].id : null;
    const priorShareholdersFund = priorPeriodId
      ? (trendRows.find((r) => r.periodId === priorPeriodId && r.dimension === "shareholders_fund")?.value ?? shareholdersFund)
      : shareholdersFund;
    const linesForPeriod = eff ? linesRows.filter((r) => r.periodId === eff) : [];
    return {
      assets: linesForPeriod.filter((r) => r.dimension2 === "asset").map((r) => ({ label: r.dimension, value: r.value ?? 0 })),
      liabilities: linesForPeriod.filter((r) => r.dimension2 === "liability").map((r) => ({ label: r.dimension, value: r.value ?? 0 })),
      shareholdersFund,
      priorShareholdersFund,
      trend,
    };
  }, [metrics, entityId]);

  const relatedPartyTransactions = useMemo(() => {
    const rows = recordRows("related_party_txn");
    const available = periodsWithData(rows, entityId, () => true);
    const eff = latestPeriodWithData(available);
    return rows
      .filter((r) => r.periodId === eff)
      .map((r) => {
        const [nature, basis] = (r.textNote ?? "|").split(" | ");
        return { txn: r.label, party: r.category ?? "", nature: nature ?? "", value: r.valueNum ?? 0, quarter: r.periodId, basis: basis ?? "", approved: r.flag ?? false };
      });
  }, [records, entityId]);

  // ── Initiatives / compliance ────────────────────────────────────────────

  const managedEntityRatings = useMemo(() => {
    const rows = metricRows("managed_entity_ratings");
    const eff = latestPeriodWithData(periodsWithData(rows, entityId, () => true));
    const forPeriod = eff ? rows.filter((r) => r.periodId === eff) : [];
    const entities = [...new Set(forPeriod.map((r) => r.dimension))];
    return entities.map((entity) => {
      const sub = forPeriod.filter((r) => r.dimension === entity);
      const met = sub.find((r) => r.dimension2 === "met")?.value ?? 0;
      const notMet = sub.find((r) => r.dimension2 === "not_met")?.value ?? 0;
      const notMeasured = sub.find((r) => r.dimension2 === "not_measured")?.value ?? 0;
      const achievementRow = sub.find((r) => r.dimension2 === "achievement");
      return {
        entity, met, notMet, notMeasured, total: met + notMet + notMeasured,
        achievement: achievementRow?.value ?? 0,
        status: (achievementRow?.note ?? "On track") as "On track" | "Attention",
      };
    });
  }, [metrics, entityId]);

  const clientSatisfaction = useMemo(() => {
    const rows = recordRows("client_satisfaction");
    const eff = latestPeriodWithData(periodsWithData(rows, entityId, () => true));
    const row = rows.find((r) => r.periodId === eff);
    return { fyTarget: row?.valueNum ?? 4.7, ytdActual: row?.valueNum2 ?? null, note: row?.textNote ?? "" };
  }, [records, entityId]);

  const timeCharterCompliance = useMemo(() => {
    const rows = recordRows("time_charter_compliance");
    const eff = latestPeriodWithData(periodsWithData(rows, entityId, () => true));
    return rows.filter((r) => r.periodId === eff).map((r) => ({ service: r.label, targetSla: r.category ?? "", status: (r.textNote ?? "Monitoring") as "On Track" | "Monitoring" }));
  }, [records, entityId]);

  const governanceIndex = useMemo(() => {
    const rows = recordRows("governance_index");
    const eff = latestPeriodWithData(periodsWithData(rows, entityId, () => true));
    return rows.filter((r) => r.periodId === eff).map((r) => ({ item: r.label, target: r.valueNum ?? 0, note: r.textNote ?? "" }));
  }, [records, entityId]);

  function initiativeListFor(recordType: string): Initiative[] {
    const rows = recordRows(recordType);
    const eff = latestPeriodWithData(periodsWithData(rows, entityId, () => true));
    return rows
      .filter((r) => r.periodId === eff)
      .map((r) => {
        const [start, end] = (r.category ?? "-").split("-");
        const [status, nextAction] = (r.textNote ?? " | ").split(" | ");
        return { name: r.label, start: start ?? "", end: end ?? "", status: (status ?? "Planned") as InitiativeStatus, nextAction: nextAction ?? "" };
      });
  }
  const processInitiatives = useMemo(() => initiativeListFor("process_initiative"), [records, entityId]);
  const techInitiatives = useMemo(() => initiativeListFor("tech_initiative"), [records, entityId]);

  const bumiputeraProcurement = useMemo(() => {
    const rows = metricRows("bumiputera_procurement");
    const eff = latestPeriodWithData(periodsWithData(rows, entityId, () => true));
    const forPeriod = eff ? rows.filter((r) => r.periodId === eff) : [];
    const depts = [...new Set(forPeriod.map((r) => r.dimension))];
    return depts.map((dept) => {
      const sub = forPeriod.filter((r) => r.dimension === dept);
      return {
        dept,
        fyTarget: sub.find((r) => r.dimension2 === "fy_target")?.value ?? 0,
        ytdActual: sub.find((r) => r.dimension2 === "ytd_actual")?.value ?? 0,
      };
    });
  }, [metrics, entityId]);

  return {
    loading, refresh, getMetricValue,
    headcountSummaryByPeriod, headcountTrend, genderBreakdownByPeriod,
    gradeBreakdownFor, ageBreakdownFor, ageGenderBreakdownFor, averageAgeByPeriod,
    gradeGenderCrossTabFor, departmentHeadcountFor, recruitmentIndexByPeriod,
    resignedByPeriod, turnoverTrend, bumiputeraTrainingByPeriod,
    quarterlyTrend, actualVsBudget, varianceCommentary, balanceSheet, relatedPartyTransactions,
    managedEntityRatings, clientSatisfaction, timeCharterCompliance, governanceIndex,
    processInitiatives, techInitiatives, bumiputeraProcurement,
  };
}
