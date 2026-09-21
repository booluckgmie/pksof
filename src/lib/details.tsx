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

/** Fixed catalog behind External Client Satisfaction's per-service breakdown (KPI5, CP005) —
 * shared between the read-side grouping below and ClientSatisfactionServiceEditor, which only
 * ever fills in rows against this exact list (no add/remove — the service catalog itself isn't
 * data entry). */
export const CLIENT_SATISFACTION_SERVICE_CATALOG: { category: string; service: string }[] = [
  { category: 'Managed Entities ("MEs") & Committee', service: "DINB" },
  { category: 'Managed Entities ("MEs") & Committee', service: "GovCo" },
  { category: 'Managed Entities ("MEs") & Committee', service: "SJPP" },
  { category: 'Managed Entities ("MEs") & Committee', service: "SJKP" },
  { category: 'Managed Entities ("MEs") & Committee', service: "CDRC" },
  { category: "Advisory", service: "Corp. Advisory" },
  { category: "Support Services", service: "Finance Outsourcing" },
  { category: "Support Services", service: "Secretarial Services" },
  { category: "Support Services", service: "IT Services" },
  { category: "Support Services", service: "SAP Services" },
];

/** Managed Entities tracked under CP004's Managed Entities Performance Summary (KPI3) — the
 * fixed set the Excel template's own SJPP/SJKP/DanaInfra/DanaHarta rows cover for Rating/Weighted;
 * ManagedEntityKpiEditor uses the same set for its item catalog's wording fields. */
export const MANAGED_ENTITY_NAMES = ["SJPP", "SJKP", "DanaInfra", "DanaHarta"] as const;

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
  /** Free-text progress narrative for the table's own "Status" column (bulleted, one line each)
   * — separate from the `status` enum above, which still drives InitiativeStatusDot elsewhere. */
  statusNote: string;
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

  // ── Financial Position (PFH004) ─────────────────────────────────────────
  // "fp_main" carries the leaf line items that have no further drill-down (dimension = item key,
  // dimension2 = "asset"|"equity"|"liability"). Items that DO have a drill-down (Property and
  // Equipment, Right-of-use assets, Receivables/Deposits/Prepayments, Cash and Cash Equivalents,
  // Other payables) are never stored as their own total — that total is always the sum of their
  // "fp_breakdown" leaves (dimension = parent key, dimension2 = leaf key), so the main table and
  // its drill-down can never drift apart. Retained profit is likewise never stored: it's the
  // balancing plug (Total Assets − Share Capital − Total Liabilities), same convention as Total
  // Income/Expenses being derived elsewhere in this file.
  const FP_BREAKDOWN_LABELS: Record<string, { parentLabel: string; totalLabel: string; leaves: Record<string, string> }> = {
    property_equipment: {
      parentLabel: "Property and Equipment",
      totalLabel: "TOTAL PROPERTY AND EQUIPMENT",
      leaves: { freehold_buildings: "Freehold buildings", office_furniture_fittings: "Office furniture & fittings", office_equipment: "Office equipment", motor_vehicles: "Motor vehicles", computer_equipment: "Computer equipment", office_renovation: "Office renovation", work_in_progress: "Work in progress" },
    },
    rou_assets: {
      parentLabel: "Right-of-use assets",
      totalLabel: "TOTAL RIGHT-OF-USE ASSETS",
      leaves: { office_space: "Office Space", photocopier: "Photocopier", notebook_computer: "Notebook/Computer", server: "Server" },
    },
    receivables_deposits_prepayments: {
      parentLabel: "Receivables, deposits and prepayments",
      totalLabel: "TOTAL RECEIVABLES, DEPOSITS AND PREPAYMENTS",
      leaves: { trade_receivables: "Trade receivables", impairment_receivables: "Impairment of receivables", expected_credit_loss: "Expected credit loss", profit_receivables_placements: "Profit receivables from placements", deposits: "Deposits", prepayments: "Prepayments", reimbursable_personnel_cost: "Reimbursable personnel cost and fees by MoF", accrued_revenue: "Accrued revenue", other_receivables: "Other receivables" },
    },
    cash_equivalents: {
      parentLabel: "Cash and cash equivalents",
      totalLabel: "Total Cash and Cash Equivalents",
      leaves: { deposits_and_placements: "Deposits and placements", cash_and_bank_balances: "Cash and bank balances" },
    },
    other_payables: {
      parentLabel: "Other payables",
      totalLabel: "TOTAL LIABILITIES",
      leaves: { staff_related_provisions: "Staff related provisions", dividend_payable: "Dividend payable", service_tax: "Service tax", external_auditors_fee: "External auditors' fee", tax_agent_fee: "Tax agent's fee", deposits_sale_properties: "Deposits from sale of properties (PAM)", due_to_related_corp: "Amount due to a related corporation", accrued_expenses_other_payables: "Accrued expenses and other payables" },
    },
  };
  const FP_MAIN_LABELS: Record<string, string> = {
    deferred_tax_asset: "Deferred tax asset",
    tax_recoverable: "Tax recoverable",
    due_from_related: "Amount due from related corporations",
    other_investments: "Other investments",
    share_capital: "Share capital",
    lease_liabilities: "Lease liabilities",
    provision_for_tax: "Provision for tax",
  };

  function fpMainValue(periodId: PeriodId, key: string): number {
    return metricRows("fp_main").find((r) => r.periodId === periodId && r.dimension === key)?.value ?? 0;
  }

  function fpBreakdownTotal(periodId: PeriodId, parentKey: string): number {
    return metricRows("fp_breakdown")
      .filter((r) => r.periodId === periodId && r.dimension === parentKey)
      .reduce((s, r) => s + (r.value ?? 0), 0);
  }

  /** One breakdown group's rows for the current period and (if available) the immediately
   * preceding one — powers each drill-down table under the Financial Position main table. */
  function financialPositionBreakdownFor(parentKey: keyof typeof FP_BREAKDOWN_LABELS, periodId: PeriodId) {
    const def = FP_BREAKDOWN_LABELS[parentKey];
    const idx = periods.findIndex((p) => p.id === periodId);
    const priorId = idx > 0 ? periods[idx - 1].id : null;
    const rowsForP = metricRows("fp_breakdown").filter((r) => r.periodId === periodId && r.dimension === parentKey);
    const rowsForPrior = priorId ? metricRows("fp_breakdown").filter((r) => r.periodId === priorId && r.dimension === parentKey) : [];
    const rows = Object.entries(def.leaves).map(([key, label]) => ({
      key,
      label,
      current: rowsForP.find((r) => r.dimension2 === key)?.value ?? null,
      prior: priorId ? (rowsForPrior.find((r) => r.dimension2 === key)?.value ?? null) : null,
    }));
    return {
      parentLabel: def.parentLabel,
      totalLabel: def.totalLabel,
      currentLabel: periodById(periodId).label,
      priorLabel: priorId ? periodById(priorId).label : null,
      rows,
      totalCurrent: rowsForP.reduce((s, r) => s + (r.value ?? 0), 0),
      totalPrior: rowsForPrior.reduce((s, r) => s + (r.value ?? 0), 0),
    };
  }

  /** The Financial Position statement itself — current vs. immediately preceding quarter, RM'000.
   * Every total (Total Assets/Equity/Liabilities, and the summary "Cash and other investments" /
   * "Other assets" buckets) is derived from leaf figures so it can never drift out of reconciliation. */
  function financialPositionFor(periodId: PeriodId) {
    const idx = periods.findIndex((p) => p.id === periodId);
    const priorId = idx > 0 ? periods[idx - 1].id : null;
    const val = (key: string, forPeriod: PeriodId) =>
      key in FP_BREAKDOWN_LABELS ? fpBreakdownTotal(forPeriod, key) : fpMainValue(forPeriod, key);

    const ASSET_KEYS = ["property_equipment", "rou_assets", "deferred_tax_asset", "tax_recoverable", "due_from_related", "receivables_deposits_prepayments", "other_investments", "cash_equivalents"];
    const LIABILITY_KEYS = ["lease_liabilities", "provision_for_tax", "other_payables"];

    function sumAssets(forPeriod: PeriodId) {
      return ASSET_KEYS.reduce((s, k) => s + val(k, forPeriod), 0);
    }
    function sumLiabilities(forPeriod: PeriodId) {
      return LIABILITY_KEYS.reduce((s, k) => s + val(k, forPeriod), 0);
    }
    function retainedProfit(forPeriod: PeriodId) {
      return sumAssets(forPeriod) - fpMainValue(forPeriod, "share_capital") - sumLiabilities(forPeriod);
    }

    const label = (key: string) => (key in FP_BREAKDOWN_LABELS ? FP_BREAKDOWN_LABELS[key as keyof typeof FP_BREAKDOWN_LABELS].parentLabel : FP_MAIN_LABELS[key]);
    const drillable = (key: string) => key in FP_BREAKDOWN_LABELS || key === "other_investments";

    const current = periodId;
    const totalAssetsCurrent = sumAssets(current);
    const totalLiabilitiesCurrent = sumLiabilities(current);
    const totalEquityCurrent = fpMainValue(current, "share_capital") + retainedProfit(current);
    const totalAssetsPrior = priorId ? sumAssets(priorId) : null;
    const totalLiabilitiesPrior = priorId ? sumLiabilities(priorId) : null;
    const totalEquityPrior = priorId ? fpMainValue(priorId, "share_capital") + retainedProfit(priorId) : null;

    const rows = [
      ...ASSET_KEYS.map((key) => ({ key, label: label(key), current: val(key, current), prior: priorId ? val(key, priorId) : null, bucket: "asset" as const, isTotal: false, drillable: drillable(key) })),
      { key: "total_assets", label: "Total Assets", current: totalAssetsCurrent, prior: totalAssetsPrior, bucket: "asset" as const, isTotal: true, drillable: false },
      { key: "share_capital", label: "Share capital", current: fpMainValue(current, "share_capital"), prior: priorId ? fpMainValue(priorId, "share_capital") : null, bucket: "equity" as const, isTotal: false, drillable: false },
      { key: "retained_profit", label: "Retained profit", current: retainedProfit(current), prior: priorId ? retainedProfit(priorId) : null, bucket: "equity" as const, isTotal: false, drillable: false },
      { key: "total_equity", label: "Total Equity", current: totalEquityCurrent, prior: totalEquityPrior, bucket: "equity" as const, isTotal: true, drillable: false },
      ...LIABILITY_KEYS.map((key) => ({ key, label: label(key), current: val(key, current), prior: priorId ? val(key, priorId) : null, bucket: "liability" as const, isTotal: false, drillable: drillable(key) })),
      { key: "total_liabilities", label: "Total Liabilities", current: totalLiabilitiesCurrent, prior: totalLiabilitiesPrior, bucket: "liability" as const, isTotal: true, drillable: false },
      { key: "total_equity_and_liabilities", label: "Total Equity and Liabilities", current: totalEquityCurrent + totalLiabilitiesCurrent, prior: totalEquityPrior !== null && totalLiabilitiesPrior !== null ? totalEquityPrior + totalLiabilitiesPrior : null, bucket: "total" as const, isTotal: true, drillable: false },
    ];

    const cashAndInvestmentsCurrent = val("other_investments", current) + val("cash_equivalents", current);
    const cashAndInvestmentsPrior = priorId ? val("other_investments", priorId) + val("cash_equivalents", priorId) : null;

    return {
      hasData: totalAssetsCurrent !== 0,
      currentLabel: periodById(current).label,
      priorLabel: priorId ? periodById(priorId).label : null,
      priorId,
      rows,
      totalAssets: { current: totalAssetsCurrent, prior: totalAssetsPrior },
      totalEquity: { current: totalEquityCurrent, prior: totalEquityPrior },
      totalLiabilities: { current: totalLiabilitiesCurrent, prior: totalLiabilitiesPrior },
      cashAndInvestments: { current: cashAndInvestmentsCurrent, prior: cashAndInvestmentsPrior },
      otherAssets: { current: totalAssetsCurrent - cashAndInvestmentsCurrent, prior: totalAssetsPrior !== null && cashAndInvestmentsPrior !== null ? totalAssetsPrior - cashAndInvestmentsPrior : null },
    };
  }

  /** Aging-of-receivables sub-drill under the Trade receivables line — only captured for the
   * quarters the client actually supplied an aging schedule for (not every dummy quarter has one). */
  function agingOfReceivablesFor(periodId: PeriodId) {
    const AGING_LABELS: Record<string, string> = { current: "Current", d1_30: "1-30 days", d31_60: "31-60 days", d61_90: "61-90 days", d91_120: "91-120 days", over_120: ">120 days (impaired)" };
    const idx = periods.findIndex((p) => p.id === periodId);
    const priorId = idx > 0 ? periods[idx - 1].id : null;
    const rowsForP = metricRows("fp_aging_receivables").filter((r) => r.periodId === periodId);
    if (rowsForP.length === 0) return null;
    const rowsForPrior = priorId ? metricRows("fp_aging_receivables").filter((r) => r.periodId === priorId) : [];
    const rows = Object.entries(AGING_LABELS).map(([key, label]) => ({
      key,
      label,
      current: rowsForP.find((r) => r.dimension === key)?.value ?? null,
      prior: rowsForPrior.find((r) => r.dimension === key)?.value ?? null,
    }));
    const totalCurrent = rowsForP.reduce((s, r) => s + (r.value ?? 0), 0);
    const totalPrior = rowsForPrior.reduce((s, r) => s + (r.value ?? 0), 0);
    const impairmentCurrent = fpBreakdownRow("receivables_deposits_prepayments", "impairment_receivables", periodId);
    const eclCurrent = fpBreakdownRow("receivables_deposits_prepayments", "expected_credit_loss", periodId);
    const impairmentPrior = priorId ? fpBreakdownRow("receivables_deposits_prepayments", "impairment_receivables", priorId) : 0;
    const eclPrior = priorId ? fpBreakdownRow("receivables_deposits_prepayments", "expected_credit_loss", priorId) : 0;
    return {
      currentLabel: periodById(periodId).label,
      priorLabel: priorId ? periodById(priorId).label : null,
      rows,
      totalCurrent,
      totalPrior,
      impairmentCurrent,
      impairmentPrior,
      eclCurrent,
      eclPrior,
      netCurrent: totalCurrent + impairmentCurrent + eclCurrent,
      netPrior: totalPrior + impairmentPrior + eclPrior,
    };
  }

  function fpBreakdownRow(parentKey: string, leafKey: string, periodId: PeriodId): number {
    return metricRows("fp_breakdown").find((r) => r.periodId === periodId && r.dimension === parentKey && r.dimension2 === leafKey)?.value ?? 0;
  }

  /** Point-in-time deal-level schedule behind the "Other investments" line — captured only for
   * the quarter it was reported for, unlike every other drill-down here there is no prior-period
   * comparison column (the client's own exhibit is a snapshot, not a QoQ table). */
  function otherInvestmentsDealsFor(periodId: PeriodId) {
    const rows = recordRows("fp_other_investment_deal").filter((r) => r.periodId === periodId);
    if (rows.length === 0) return null;
    const deals = rows.map((r) => {
      const [dealDate, maturityDate, rating, tenureDays] = (r.textNote ?? "").split("|");
      return { bank: r.label, instrument: r.category ?? "", dealDate, maturityDate, rating, tenureDays, principal: r.valueNum ?? 0, interestPct: r.valueNum2 ?? 0 };
    });
    const total = deals.reduce((s, d) => s + d.principal, 0);
    const rateRow = metricRows("fp_note").find((r) => r.periodId === periodId && r.dimension === "other_investments_rate");
    return { asOfLabel: periodById(periodId).label, deals, total, noteRate: rateRow?.note ?? null };
  }

  function cashEffectiveRateFor(periodId: PeriodId): number | null {
    return metricRows("fp_note").find((r) => r.periodId === periodId && r.dimension === "cash_effective_rate")?.value ?? null;
  }

  /** Quarter-over-quarter comparison table, matching the client's own RPT report format — RM'000
   * figures grouped under a category (dimension, e.g. "A. Subsidiary companies") and a sub-heading
   * plus party code packed into dimension2 as "subheading|party" (the two free-text dimension
   * slots aren't enough for a 3-level hierarchy on their own). Newest quarter first, same reading
   * order as the source report. */
  /** RPT trend table, capped to quarters up to and including `periodId` — same "Reporting
   * period" semantics as every other Financial Health screen, applied to a multi-quarter table
   * instead of a single-quarter one. */
  function relatedPartyTransactionsUpTo(periodId: PeriodId) {
    const rows = metricRows("related_party_txn");
    const available = [...periodsWithData(rows, entityId, () => true)];
    const cutoffIdx = periods.findIndex((p) => p.id === periodId);
    const periodsUsed = periods.filter((p, i) => available.includes(p.id) && (cutoffIdx === -1 || i <= cutoffIdx)).slice().reverse();
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
  }

  // ── Initiatives / compliance ────────────────────────────────────────────

  /** Per-KPI breakdown behind each Managed Entity's own quarterly rating (No/Section/KPI/FY
   * Target/YTD Target/YTD Actual/Rating/Weighted Rating) — category holds the entity name
   * ("SJPP", "SJKP", …), textNote packs "no|section|fyTarget|ytdTarget|ytdActual" pipe-delimited
   * (same convention as related_party_txn / initiativeListFor), valueNum/valueNum2 are the
   * Rating (1-5) and Weighted Rating. The roll-up summary table (met/not-met/achievement/status)
   * is derived entirely from these rows rather than stored separately, so the two can't drift. */
  function managedEntityKpiRows(periodId: PeriodId) {
    const rows = recordRows("managed_entity_kpi");
    const available = periodsWithData(rows, entityId, () => true);
    const eff = resolvePeriod(periodId, available);
    return eff ? rows.filter((r) => r.periodId === eff) : [];
  }

  function managedEntityKpiDetailFor(entity: string, periodId: PeriodId) {
    return managedEntityKpiRows(periodId)
      .filter((r) => r.category === entity)
      .map((r) => {
        const [no = "", section = "", fyTarget = "", ytdTarget = "", ytdActual = ""] = (r.textNote ?? "").split("|");
        return { no, section, label: r.label, fyTarget, ytdTarget, ytdActual, rating: r.valueNum ?? 0, weighted: r.valueNum2 ?? 0 };
      });
  }

  /** Same per-KPI rows as managedEntityKpiDetailFor, but pivoted across every quarter of one FY
   * (Q1-Q4) instead of a single period — for the "add Q1-Q4 to the table" view. Row identity
   * across quarters is the "no" key from textNote (falls back to label if blank); order follows
   * whichever quarter (most recent first) actually has rows, since the underlying table has no
   * natural sort column of its own. */
  function managedEntityKpiQuarterlyFor(entity: string, fy: string) {
    const rows = recordRows("managed_entity_kpi").filter((r) => r.category === entity);
    const quartersInFy = periods.filter((p) => p.fy === fy);
    const keyOf = (r: DetailRecordRow) => (r.textNote ?? "").split("|")[0] || r.label;

    let order: string[] = [];
    for (let i = quartersInFy.length - 1; i >= 0; i--) {
      const forQ = rows.filter((r) => r.periodId === quartersInFy[i].id);
      if (forQ.length > 0) {
        order = forQ.map(keyOf);
        break;
      }
    }

    return order.map((key) => {
      let section = "";
      let label = "";
      let fyTarget = "";
      const byQuarter: Record<number, { ytdActual: string; rating: number; weighted: number }> = {};
      for (const q of quartersInFy) {
        const r = rows.find((rr) => rr.periodId === q.id && keyOf(rr) === key);
        if (!r) continue;
        const [, sec = "", fyT = "", , ytdActual = ""] = (r.textNote ?? "").split("|");
        section = sec;
        label = r.label;
        fyTarget = fyT;
        byQuarter[q.quarter] = { ytdActual, rating: r.valueNum ?? 0, weighted: r.valueNum2 ?? 0 };
      }
      return { no: key, section, label, fyTarget, byQuarter };
    });
  }

  function managedEntityRatingsFor(periodId: PeriodId) {
    const rows = managedEntityKpiRows(periodId);
    const entitiesPresent = [...new Set(rows.map((r) => r.category).filter((c): c is string => !!c))];
    return entitiesPresent.map((entity) => {
      const ratings = rows.filter((r) => r.category === entity).map((r) => r.valueNum ?? 0);
      const met = ratings.filter((r) => r >= 4).length;
      const notMet = ratings.filter((r) => r < 4).length;
      const achievement = ratings.length ? Math.round((ratings.reduce((s, r) => s + r, 0) / ratings.length / 5) * 100) : 0;
      const status: "On track" | "Attention" = ratings.some((r) => r <= 1) ? "Attention" : "On track";
      return { entity, met, notMet, notMeasured: 0, total: ratings.length, achievement, status };
    });
  }

  const clientSatisfaction = useMemo(() => {
    const rows = recordRows("client_satisfaction");
    const eff = latestPeriodWithData(periodsWithData(rows, entityId, () => true));
    const row = rows.find((r) => r.periodId === eff);
    return { fyTarget: row?.valueNum ?? 4.7, ytdActual: row?.valueNum2 ?? null, note: row?.textNote ?? "" };
  }, [records, entityId]);

  /** External Client Satisfaction (KPI 5) per-service survey breakdown — matches the client's own
   * "Appendix — External Client Satisfaction Rating" report exactly: a fixed catalog of services
   * grouped into 3 categories, each carrying a prior-year comparison rating, the current average
   * service rating, and the survey's own sent/received counts (packed into textNote as
   * "sent|received" since detail_records only carries two numeric slots). The bi-annual survey
   * doesn't run every quarter — hasData is false whenever this period has no rows at all. */
  const CLIENT_SATISFACTION_CATALOG = CLIENT_SATISFACTION_SERVICE_CATALOG;

  function ratingBand(rating: number | null): string {
    if (rating === null) return "";
    if (rating >= 4.5) return "Excellent";
    if (rating >= 4.0) return "Very Good";
    if (rating >= 3.5) return "Good";
    if (rating >= 3.0) return "Satisfactory";
    return "Needs Improvement";
  }

  function splitSentReceived(textNote: string | null) {
    const [sentStr, receivedStr] = (textNote ?? "").split("|");
    const sent = sentStr ? Number(sentStr) : null;
    const received = receivedStr ? Number(receivedStr) : null;
    return { sent, received, responseRate: sent && received !== null ? Math.round((received / sent) * 100) : null };
  }

  function clientSatisfactionServicesFor(periodId: PeriodId) {
    const rows = recordRows("client_satisfaction_service").filter((r) => r.periodId === periodId);
    const byService = (service: string) => rows.find((r) => r.label === service);
    const services = CLIENT_SATISFACTION_CATALOG.map(({ category, service }) => {
      const r = byService(service);
      return {
        category,
        service,
        priorRating: r?.valueNum2 ?? null,
        rating: r?.valueNum ?? null,
        band: ratingBand(r?.valueNum ?? null),
        ...splitSentReceived(r?.textNote ?? null),
      };
    });
    const totalRow = byService("Corp. Average Rating");
    const total = totalRow
      ? {
          priorRating: totalRow.valueNum2,
          rating: totalRow.valueNum,
          band: ratingBand(totalRow.valueNum),
          ...splitSentReceived(totalRow.textNote),
        }
      : null;
    return { services, total, hasData: rows.length > 0 };
  }

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

  /** Governance Index component breakdown (No/KPI/FY Target/YTD Actual/Achievement/Weighted
   * Achievement) — five equally-weighted (20% each) components; textNote packs
   * "no|fyTarget|ytdActual|achievement" (achievement blank when a component isn't due yet this
   * quarter, e.g. OACS initiatives in Q1 — its full 20% weight still carries through unpenalised,
   * matching how the client's own report treats "not yet due" versus an actual miss). */
  function governanceKpiFor(periodId: PeriodId) {
    const rows = recordRows("governance_kpi");
    const available = periodsWithData(rows, entityId, () => true);
    const eff = resolvePeriod(periodId, available);
    if (!eff) return [];
    return rows
      .filter((r) => r.periodId === eff)
      .map((r) => {
        const [no = "0", fyTarget = "", ytdActual = "", achievement = ""] = (r.textNote ?? "").split("|");
        return { no: Number(no), label: r.label, fyTarget, ytdActual, achievement, weighted: r.valueNum2 ?? 0 };
      })
      .sort((a, b) => a.no - b.no);
  }

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

  /** Id-carrying version of initiativeListFor, scoped to one exact period rather than "whichever
   * period has the latest submission" — what InitiativeEditor (CP006) reads/writes when adding,
   * editing or deleting a Process/Tech Initiative row for the quarter currently selected there. */
  function initiativeRecordsFor(recordType: string, periodId: PeriodId): (Initiative & { id: string })[] {
    return recordRows(recordType)
      .filter((r) => r.periodId === periodId)
      .map((r) => {
        const [start, end] = (r.category ?? "-").split("-");
        const [status, nextAction] = (r.textNote ?? " | ").split(" | ");
        return { id: r.id, name: r.label, start: start ?? "", end: end ?? "", status: (status ?? "Planned") as InitiativeStatus, nextAction: nextAction ?? "" };
      });
  }

  /** Id-carrying wording fields (No/Section/FY Target/YTD Target/YTD Actual) behind one managed
   * entity's own KPI item catalog for one exact quarter — what ManagedEntityKpiEditor (CP004)
   * reads/writes. Rating/Weighted (valueNum/valueNum2) stay whatever the Excel upload set; the
   * editor only ever touches the wording fields packed into textNote. */
  function managedEntityKpiItemsFor(entity: string, periodId: PeriodId) {
    return recordRows("managed_entity_kpi")
      .filter((r) => r.periodId === periodId && r.category === entity)
      .map((r) => {
        const [no = "", section = "", fyTarget = "", ytdTarget = "", ytdActual = ""] = (r.textNote ?? "").split("|");
        return { id: r.id, no, section, label: r.label, fyTarget, ytdTarget, ytdActual, rating: r.valueNum ?? 0, weighted: r.valueNum2 ?? 0 };
      });
  }

  /** Id-carrying wording fields behind the Governance Index component breakdown for one exact
   * quarter — what GovernanceKpiEditor (CP004) reads/writes. Weighted (valueNum2) stays whatever
   * the Excel upload set. */
  function governanceKpiItemsFor(periodId: PeriodId) {
    return recordRows("governance_kpi")
      .filter((r) => r.periodId === periodId)
      .map((r) => {
        const [no = "0", fyTarget = "", ytdActual = "", achievement = ""] = (r.textNote ?? "").split("|");
        return { id: r.id, no: Number(no), label: r.label, fyTarget, ytdActual, achievement, weighted: r.valueNum2 ?? 0 };
      })
      .sort((a, b) => a.no - b.no);
  }

  /** One row per catalog service (plus the "Corp. Average Rating" total row, itself entered the
   * same way) for one exact quarter — what ClientSatisfactionServiceEditor (CP005) reads/writes.
   * `id` is null for a service with no row yet this quarter (nothing to upsert onto, a fresh id is
   * minted on save). Rating (valueNum) stays whatever the Excel upload set; the editor only ever
   * touches priorRating (valueNum2) and the sent/received pair packed into textNote. */
  function clientSatisfactionServiceItemsFor(periodId: PeriodId) {
    const rows = recordRows("client_satisfaction_service").filter((r) => r.periodId === periodId);
    const catalog = [...CLIENT_SATISFACTION_SERVICE_CATALOG, { category: "", service: "Corp. Average Rating" }];
    return catalog.map(({ category, service }) => {
      const r = rows.find((rr) => rr.label === service);
      const [sentStr, receivedStr] = (r?.textNote ?? "").split("|");
      return {
        id: r?.id ?? null, category, service,
        priorRating: r?.valueNum2 ?? null,
        sent: sentStr ? Number(sentStr) : null,
        received: receivedStr ? Number(receivedStr) : null,
        rating: r?.valueNum ?? null,
      };
    });
  }

  /** Free-text budget-variance commentary (PFH003) for one exact quarter — five fixed dimensions,
   * each a narrative sentence rather than a number, so it's stored on detail_metrics' own `note`
   * column (value left null) instead of detail_records. Read by both the read-only display and
   * VarianceCommentaryPanel's edit form; there's nothing to add/remove, only to fill in, so no id
   * is needed — upsertDetailMetric's natural key (entity/period/metricKey/dimension) is enough. */
  function varianceCommentaryFor(periodId: PeriodId) {
    const rows = metricRows("variance_commentary").filter((r) => r.periodId === periodId);
    const get = (key: string) => rows.find((r) => r.dimension === key)?.note ?? "";
    return { revenue: get("revenue"), staffCost: get("staffCost"), adminCost: get("adminCost"), pbt: get("pbt"), outlook: get("outlook") };
  }

  /** Id-carrying deal schedule behind PFH004's "Other investments" drill-down for one exact
   * quarter — what OtherInvestmentDealsEditor reads/writes. Unlike every other table here, this
   * record type has no Excel coverage at all (not even a numeric column), so both the deal wording
   * and its principal/interest figures are only ever entered here. */
  function otherInvestmentDealItemsFor(periodId: PeriodId) {
    return recordRows("fp_other_investment_deal")
      .filter((r) => r.periodId === periodId)
      .map((r) => {
        const [dealDate = "", maturityDate = "", rating = "", tenureDays = ""] = (r.textNote ?? "").split("|");
        return { id: r.id, bank: r.label, instrument: r.category ?? "", dealDate, maturityDate, rating, tenureDays, principal: r.valueNum ?? 0, interestPct: r.valueNum2 ?? 0 };
      });
  }

  /** Bumiputera Procurement (KPI11) by department for a given quarter, matching the client's own
   * "Appendix — Bumiputera Procurement" exhibit. YTD Target is never stored — it's always the
   * department's FY Target scaled by the quarter's own cumulative-YTD threshold (25%/50%/75%/100%,
   * same convention the rest of the app's YTD targets use), so it can't drift from the FY figure. */
  function bumiputeraProcurementFor(periodId: PeriodId) {
    const rows = metricRows("bumiputera_procurement").filter((r) => r.periodId === periodId);
    const depts = [...new Set(rows.map((r) => r.dimension))];
    const threshold = periodById(periodId).cumulativeThreshold;
    return depts.map((dept) => {
      const sub = rows.filter((r) => r.dimension === dept);
      const fyTarget = sub.find((r) => r.dimension2 === "fy_target")?.value ?? 0;
      const ytdActual = sub.find((r) => r.dimension2 === "ytd_actual")?.value ?? 0;
      const ytdTarget = fyTarget * threshold;
      return { dept, fyTarget, ytdTarget, ytdActual, variance: ytdActual - ytdTarget };
    });
  }

  /** People Development Programme entries for a period — edited in full via CP009, mapped onto
   * detail_records the same way initiativeListFor() maps process/tech initiatives: `category`
   * holds the sub-area, `textNote` packs "start|end|status|detail<US>statusNote" (pipe-delimited
   * for the three scalar fields, same convention as initiativeListFor's "status | nextAction";
   * the two free-text blobs after that are joined with a Unit Separator (U+001F) instead, since
   * either one can itself contain "|" or newlines — user bullet text does, routinely). */
  function peopleDevRecordsFor(periodId: PeriodId): PeopleDevRecord[] {
    return recordRows("people_dev_programme")
      .filter((r) => r.periodId === periodId)
      .map((r) => {
        const [start = "", end = "", status = "Planned", ...rest] = (r.textNote ?? "").split("|");
        const [detail = "", statusNote = ""] = rest.join("|").split("\u001F");
        return {
          id: r.id,
          subArea: (PEOPLE_DEV_SUB_AREAS as readonly string[]).includes(r.category ?? "") ? (r.category as PeopleDevSubArea) : PEOPLE_DEV_SUB_AREAS[0],
          programme: r.label,
          start, end,
          status: status as InitiativeStatus,
          detail,
          statusNote,
        };
      });
  }

  return {
    loading, refresh, getMetricValue, records,
    headcountSummaryByPeriod, headcountTrend, genderBreakdownByPeriod,
    gradeBreakdownFor, ageBreakdownFor, ageGenderBreakdownFor, averageAgeByPeriod,
    gradeGenderCrossTabFor, departmentHeadcountFor, recruitmentIndexByPeriod,
    resignedByPeriod, turnoverTrend, bumiputeraTrainingByPeriod,
    quarterlyTrend, monthlyTrendFor, actualVsBudget, financialResultsFor, varianceCommentary, varianceCommentaryFor, relatedPartyTransactionsUpTo,
    financialPositionFor, financialPositionBreakdownFor, agingOfReceivablesFor, otherInvestmentsDealsFor, otherInvestmentDealItemsFor, cashEffectiveRateFor,
    managedEntityRatingsFor, managedEntityKpiDetailFor, managedEntityKpiQuarterlyFor, managedEntityKpiItemsFor, clientSatisfaction, clientSatisfactionServicesFor, clientSatisfactionServiceItemsFor, timeCharterByDept, governanceKpiFor, governanceKpiItemsFor,
    processInitiatives, techInitiatives, initiativeRecordsFor, bumiputeraProcurementFor, peopleDevRecordsFor,
    pbtBreakdown, cirBreakdown,
  };
}
