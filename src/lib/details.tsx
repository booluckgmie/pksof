import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { fetchDetailMetrics, fetchDetailRecords, type DetailMetricRow, type DetailRecordRow } from "@/lib/api/details";
import { useSession } from "@/lib/session";
import { periods, periodById, monthsForQuarter, type MonthPeriodId } from "@/data/periods";
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
function periodsWithData(rows: { entityId: EntityId; periodId: PeriodId | MonthPeriodId }[], entityId: EntityId, matches: (r: { entityId: EntityId; periodId: PeriodId | MonthPeriodId }) => boolean): Set<PeriodId | MonthPeriodId> {
  const set = new Set<PeriodId | MonthPeriodId>();
  for (const r of rows) {
    if (r.entityId === entityId && matches(r)) set.add(r.periodId);
  }
  return set;
}

/** Nothing submitted yet for `periodId`? Fall back to the nearest earlier period that has data,
 * so browsing an unreported quarter shows the last known state instead of going blank/zero —
 * same continuity the static prototype data had, now driven by whatever's actually been entered. */
function resolvePeriod(periodId: PeriodId, available: Set<PeriodId | MonthPeriodId>): PeriodId | null {
  const idx = periods.findIndex((p) => p.id === periodId);
  for (let i = idx; i >= 0; i--) {
    if (available.has(periods[i].id)) return periods[i].id;
  }
  return null;
}

/** For flat/snapshot datasets that aren't period-selector-reactive (financial statements,
 * initiative lists, compliance tables) — use whichever period has the most recent submission. */
function latestPeriodWithData(available: Set<PeriodId | MonthPeriodId>): PeriodId | null {
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
  computation: string;
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

/** The 4 sub-areas the client asked People Development Programme entries to be grouped under. */
export const PEOPLE_DEV_SUB_AREAS = [
  "Talent Management",
  "Succession Management",
  "Performance Management",
  "Talent/Culture Engagement",
] as const;
export type PeopleDevSubArea = (typeof PEOPLE_DEV_SUB_AREAS)[number];

export interface PeopleDevRecord {
  id: string;
  subArea: PeopleDevSubArea;
  programme: string;
  start: string;
  end: string;
  status: InitiativeStatus;
  detail: string;
}

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
        const computation = forPeriod.find((r) => r.dimension === name && r.dimension2 === "computation")?.note ?? "";
        const weightedRow = forPeriod.find((r) => r.dimension === name && r.dimension2 === "weighted");
        return { metric: name, weight, score, computation, note: weightedRow?.note ?? "", weighted: weightedRow?.value ?? 0 };
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

  /** Monthly resolution for the same "financial_trend" metric quarterlyTrend reads — see
   * src/data/periods.ts's monthPeriods. Returns null (not 0) for a month with no row yet, so the
   * UI can show "not entered" distinctly from an actual zero. */
  function monthlyTrendFor(quarterId: PeriodId) {
    const rows = metricRows("financial_trend");
    return monthsForQuarter(quarterId).map((m) => {
      const forMonth = rows.filter((r) => r.periodId === m.id);
      const get = (dim: string) => forMonth.find((r) => r.dimension === dim)?.value ?? null;
      return { period: m.label, revenue: get("revenue"), pbt: get("pbt"), cir: get("cir"), netMargin: get("net_margin") };
    });
  }

  const REVENUE_SOURCE_LABELS: Record<string, string> = {
    danaharta_mgmt_fee: "Management fee from Danaharta — investment activities",
    govco_mgmt_fee: "Management fee from GovCo",
    sjkp_mgmt_fee: "Management fee from SJKP",
    sjpp_mgmt_fee: "Management fee from SJPP",
    danainfra_mgmt_fee: "Management fee from DanaInfra",
    sap_services_fee: "Fee from SAP services",
    outsourcing_services_fee: "Fee from Outsourcing services",
    secretarial_services_fee: "Fee from Secretarial services",
    corporate_advisory_fee: "Fee from Corporate Advisory services",
    credit_advisory_fee: "Fee from Credit Advisory services",
    acquired_loans_income: "Income from acquired loans (PAM)",
  };
  const EXPENSE_CATEGORY_LABELS: Record<string, string> = {
    admin_expenses: "Administrative expenses",
    personnel_expenses: "Personnel expenses",
    professional_fees: "Professional fees",
    depreciation: "Depreciation",
    depreciation_rou: "Depreciation of RoU asset",
    other_expenses: "Other Expenses",
    interest_expense_lease: "Interest expense (lease liability)",
    impairment_receivables: "Provision for / (reversal of) impairment loss on receivables",
  };

  /** One quarter's full income-statement, RM'000 — combines financial_trend (revenue, pbt) with
   * pl_detail's components below the line (finance/other income, tax, PAT, dividend). Total
   * Income and Expenses are derived (Total Income = Revenue + Finance Income + Other Income;
   * Expenses = PBT − Total Income), not stored separately, so they can never drift out of sync
   * with the two source figures. Returns null if either source is missing for this dim2. */
  function readQuarterPl(periodId: PeriodId, dim2: "actual" | "budget") {
    const forP = metricRows("pl_detail").filter((r) => r.periodId === periodId && r.dimension2 === dim2);
    if (forP.length === 0) return null;
    // Revenue and Expenses come from the sum of their own breakdown (revenue_by_source /
    // expense_by_category) rather than financial_trend — financial_trend only ever carries one
    // (actual) figure per quarter, so reading it for a "budget" snapshot would silently reuse the
    // actual PBT/revenue for budget too. Summing the breakdowns keeps actual and budget genuinely
    // independent, and both are cross-checked to reconcile with the client's own reported totals.
    const revenueRows = metricRows("revenue_by_source").filter((r) => r.periodId === periodId && r.dimension2 === dim2);
    const expenseRows = metricRows("expense_by_category").filter((r) => r.periodId === periodId && r.dimension2 === dim2);
    if (revenueRows.length === 0 || expenseRows.length === 0) return null;
    const revenue = revenueRows.reduce((s, r) => s + (r.value ?? 0), 0);
    const expenses = expenseRows.reduce((s, r) => s + (r.value ?? 0), 0);
    const financeIncome = forP.find((r) => r.dimension === "finance_income")?.value ?? null;
    const otherIncome = forP.find((r) => r.dimension === "other_income")?.value ?? null;
    const taxation = forP.find((r) => r.dimension === "taxation")?.value ?? null;
    const profitAfterTax = forP.find((r) => r.dimension === "profit_after_tax")?.value ?? null;
    const dividend = forP.find((r) => r.dimension === "dividend")?.value ?? null;
    const totalIncome = financeIncome !== null && otherIncome !== null ? revenue + financeIncome + otherIncome : null;
    const pbt = totalIncome !== null ? totalIncome + expenses : null;
    const netProfit = profitAfterTax !== null && dividend !== null ? profitAfterTax + dividend : null;
    return { revenue, financeIncome, otherIncome, totalIncome, expenses, pbt, taxation, profitAfterTax, dividend, netProfit };
  }

  function readBreakdown(periodId: PeriodId, dim2: "actual" | "budget", metricKey: string, labels: Record<string, string>) {
    const rows = metricRows(metricKey).filter((r) => r.periodId === periodId && r.dimension2 === dim2);
    return Object.entries(labels).map(([key, label]) => ({ key, label, value: rows.find((r) => r.dimension === key)?.value ?? null }));
  }

  /** Powers PFH002's revamped "Current Quarter vs Preceding Quarter" and "Actual vs Budget"
   * tables, each with a Revenue/Expenses drill-down — everything RM'000, everything derived from
   * financial_trend + pl_detail + revenue_by_source + expense_by_category so there's one source
   * of truth per figure. `periodId` is whatever quarter is currently selected; QoQ compares it to
   * the immediately preceding quarter, Budget compares it to its own budget dim2 (present only
   * where a budget figure has actually been entered — not every quarter has one). */
  function financialResultsFor(periodId: PeriodId) {
    const idx = periods.findIndex((p) => p.id === periodId);
    const priorId = idx > 0 ? periods[idx - 1].id : null;
    const current = readQuarterPl(periodId, "actual");
    const prior = priorId ? readQuarterPl(priorId, "actual") : null;
    const budget = readQuarterPl(periodId, "budget");
    return {
      current,
      qoq: prior && priorId ? { compareLabel: periodById(priorId).label, compare: prior, revenue: readBreakdown(periodId, "actual", "revenue_by_source", REVENUE_SOURCE_LABELS), revenueCompare: readBreakdown(priorId, "actual", "revenue_by_source", REVENUE_SOURCE_LABELS), expenses: readBreakdown(periodId, "actual", "expense_by_category", EXPENSE_CATEGORY_LABELS), expensesCompare: readBreakdown(priorId, "actual", "expense_by_category", EXPENSE_CATEGORY_LABELS) } : null,
      budget: budget ? { compare: budget, revenue: readBreakdown(periodId, "actual", "revenue_by_source", REVENUE_SOURCE_LABELS), revenueCompare: readBreakdown(periodId, "budget", "revenue_by_source", REVENUE_SOURCE_LABELS), expenses: readBreakdown(periodId, "actual", "expense_by_category", EXPENSE_CATEGORY_LABELS), expensesCompare: readBreakdown(periodId, "budget", "expense_by_category", EXPENSE_CATEGORY_LABELS) } : null,
    };
  }

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

  /** Quarter-over-quarter comparison table, matching the client's own RPT report format — RM'000
   * figures grouped under a category (dimension, e.g. "A. Subsidiary companies") and a sub-heading
   * plus party code packed into dimension2 as "subheading|party" (the two free-text dimension
   * slots aren't enough for a 3-level hierarchy on their own). Newest quarter first, same reading
   * order as the source report. */
  const relatedPartyTransactions = useMemo(() => {
    const rows = metricRows("related_party_txn");
    const available = [...periodsWithData(rows, entityId, () => true)];
    const periodsUsed = periods.filter((p) => available.includes(p.id)).slice().reverse();
    const keys = [...new Set(rows.map((r) => `${r.dimension}::${r.dimension2}`))];
    const items = keys.map((key) => {
      const [category, rest] = key.split("::");
      const [subheading, party] = rest.split("|");
      return {
        category,
        subheading,
        party,
        valuesByPeriod: periodsUsed.map((p) => rows.find((r) => r.periodId === p.id && r.dimension === category && r.dimension2 === rest)?.value ?? null),
      };
    });
    return {
      periods: periodsUsed.map((p) => ({ id: p.id, label: p.label })),
      items,
    };
  }, [metrics, entityId]);

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

  /** Per-department quarterly scoring — replaces the old flat SLA-target list. One row per
   * department per quarter (metric_key "time_charter_dept_score", dimension = department name,
   * value = that quarter's score), so the screen can both trend the Group average by quarter and
   * drill into any single department's own quarterly trend. */
  const timeCharterByDept = useMemo(() => {
    const rows = metricRows("time_charter_dept_score");
    const available = [...periodsWithData(rows, entityId, () => true)];
    const periodsUsed = periods.filter((p) => available.includes(p.id));
    const departments = [...new Set(rows.map((r) => r.dimension))];
    const byDepartment = departments.map((department) => ({
      department,
      scores: periodsUsed.map((p) => rows.find((r) => r.periodId === p.id && r.dimension === department)?.value ?? null),
    }));
    const overallByPeriod = periodsUsed.map((p) => {
      const vals = rows.filter((r) => r.periodId === p.id).map((r) => r.value).filter((v): v is number => v !== null);
      return vals.length > 0 ? vals.reduce((s, v) => s + v, 0) / vals.length : null;
    });
    return {
      periods: periodsUsed.map((p) => ({ id: p.id, label: p.label.replace(" FY", " ") })),
      departments: byDepartment,
      overallByPeriod,
    };
  }, [metrics, entityId]);

  const governanceIndex = useMemo(() => {
    const rows = recordRows("governance_index");
    const eff = latestPeriodWithData(periodsWithData(rows, entityId, () => true));
    return rows.filter((r) => r.periodId === eff).map((r) => ({ item: r.label, target: r.valueNum ?? 0, note: r.textNote ?? "" }));
  }, [records, entityId]);

  /** Drill-down line items behind a headline KPI card (PBT's income-statement breakdown, CIR's
   * cost breakdown) — category distinguishes which breakdown a row belongs to. valueNum = FY
   * target, valueNum2 = YTD actual, textNote packs YTD target as a plain number string (CIR's
   * rows leave target fields null — that breakdown only ever showed an actual-figures column). */
  function financialBreakdownFor(category: string) {
    const rows = recordRows("financial_breakdown").filter((r) => r.category === category);
    const eff = latestPeriodWithData(periodsWithData(rows, entityId, () => true));
    return rows
      .filter((r) => r.periodId === eff)
      .map((r) => ({
        label: r.label,
        fyTarget: r.valueNum,
        ytdTarget: r.textNote ? Number(r.textNote) : null,
        ytdActual: r.valueNum2 ?? 0,
      }));
  }
  const pbtBreakdown = useMemo(() => financialBreakdownFor("PBT"), [records, entityId]);
  const cirBreakdown = useMemo(() => financialBreakdownFor("CIR"), [records, entityId]);

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

  /** People Development Programme entries for a period — edited in full via CP009, mapped onto
   * detail_records the same way initiativeListFor() maps process/tech initiatives: `category`
   * holds the sub-area, `textNote` packs "start|end|status|detail" (pipe-delimited, same
   * convention as initiativeListFor's "status | nextAction"). */
  function peopleDevRecordsFor(periodId: PeriodId): PeopleDevRecord[] {
    return recordRows("people_dev_programme")
      .filter((r) => r.periodId === periodId)
      .map((r) => {
        const [start = "", end = "", status = "Planned", ...rest] = (r.textNote ?? "").split("|");
        return {
          id: r.id,
          subArea: (PEOPLE_DEV_SUB_AREAS as readonly string[]).includes(r.category ?? "") ? (r.category as PeopleDevSubArea) : PEOPLE_DEV_SUB_AREAS[0],
          programme: r.label,
          start, end,
          status: status as InitiativeStatus,
          detail: rest.join("|"),
        };
      });
  }

  return {
    loading, refresh, getMetricValue,
    headcountSummaryByPeriod, headcountTrend, genderBreakdownByPeriod,
    gradeBreakdownFor, ageBreakdownFor, ageGenderBreakdownFor, averageAgeByPeriod,
    gradeGenderCrossTabFor, departmentHeadcountFor, recruitmentIndexByPeriod,
    resignedByPeriod, turnoverTrend, bumiputeraTrainingByPeriod,
    quarterlyTrend, monthlyTrendFor, actualVsBudget, financialResultsFor, varianceCommentary, balanceSheet, relatedPartyTransactions,
    managedEntityRatings, clientSatisfaction, timeCharterByDept, governanceIndex,
    processInitiatives, techInitiatives, bumiputeraProcurement, peopleDevRecordsFor,
    pbtBreakdown, cirBreakdown,
  };
}
