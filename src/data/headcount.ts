// SAMPLE / DUMMY DATA — illustrative only.
import type { PeriodId } from "@/types";

interface HeadcountSummary {
  totalEmployees: number;
  bumiputera: number;
  nonBumiputera: number;
  approvedHeadcount: number;
  filledPosition: number;
}

/** Headline headcount snapshot, by reporting period. Bumiputera split derived from each period's seeded KPI12 composition %. */
export const headcountSummaryByPeriod: Record<PeriodId, HeadcountSummary> = {
  Q1FY25: { totalEmployees: 208, bumiputera: 179, nonBumiputera: 29, approvedHeadcount: 227, filledPosition: 208 },
  Q2FY25: { totalEmployees: 211, bumiputera: 184, nonBumiputera: 27, approvedHeadcount: 228, filledPosition: 211 },
  Q3FY25: { totalEmployees: 214, bumiputera: 188, nonBumiputera: 26, approvedHeadcount: 229, filledPosition: 214 },
  Q4FY25: { totalEmployees: 217, bumiputera: 192, nonBumiputera: 25, approvedHeadcount: 231, filledPosition: 217 },
  Q1FY26: { totalEmployees: 219, bumiputera: 199, nonBumiputera: 20, approvedHeadcount: 231, filledPosition: 219 },
  // Not yet reported — carry forward the last known (Q1 FY2026) snapshot.
  Q2FY26: { totalEmployees: 219, bumiputera: 199, nonBumiputera: 20, approvedHeadcount: 231, filledPosition: 219 },
  Q3FY26: { totalEmployees: 219, bumiputera: 199, nonBumiputera: 20, approvedHeadcount: 231, filledPosition: 219 },
  Q4FY26: { totalEmployees: 219, bumiputera: 199, nonBumiputera: 20, approvedHeadcount: 231, filledPosition: 219 },
  Q1FY27: { totalEmployees: 219, bumiputera: 199, nonBumiputera: 20, approvedHeadcount: 231, filledPosition: 219 },
  Q2FY27: { totalEmployees: 219, bumiputera: 199, nonBumiputera: 20, approvedHeadcount: 231, filledPosition: 219 },
  Q3FY27: { totalEmployees: 219, bumiputera: 199, nonBumiputera: 20, approvedHeadcount: 231, filledPosition: 219 },
  Q4FY27: { totalEmployees: 219, bumiputera: 199, nonBumiputera: 20, approvedHeadcount: 231, filledPosition: 219 },
};

export const headcountTrend = [
  { period: "Q2 FY25", actual: 211, approved: 228 },
  { period: "Q3 FY25", actual: 214, approved: 229 },
  { period: "Q4 FY25", actual: 217, approved: 231 },
  { period: "Q1 FY26", actual: 219, approved: 231 },
];

export const genderBreakdownByPeriod: Record<PeriodId, { male: number; female: number }> = {
  Q1FY25: { male: 110, female: 98 },
  Q2FY25: { male: 112, female: 99 },
  Q3FY25: { male: 113, female: 101 },
  Q4FY25: { male: 115, female: 102 },
  Q1FY26: { male: 116, female: 103 },
  Q2FY26: { male: 116, female: 103 },
  Q3FY26: { male: 116, female: 103 },
  Q4FY26: { male: 116, female: 103 },
  Q1FY27: { male: 116, female: 103 },
  Q2FY27: { male: 116, female: 103 },
  Q3FY27: { male: 116, female: 103 },
  Q4FY27: { male: 116, female: 103 },
};

export const gradeBreakdownByPeriod: Record<PeriodId, { grade: string; count: number }[]> = {
  Q1FY25: [
    { grade: "Top Management", count: 7 }, { grade: "Senior Management", count: 20 },
    { grade: "Management", count: 49 }, { grade: "Executive", count: 98 }, { grade: "Non-Executive", count: 34 },
  ],
  Q2FY25: [
    { grade: "Top Management", count: 7 }, { grade: "Senior Management", count: 20 },
    { grade: "Management", count: 50 }, { grade: "Executive", count: 100 }, { grade: "Non-Executive", count: 34 },
  ],
  Q3FY25: [
    { grade: "Top Management", count: 7 }, { grade: "Senior Management", count: 21 },
    { grade: "Management", count: 51 }, { grade: "Executive", count: 101 }, { grade: "Non-Executive", count: 34 },
  ],
  Q4FY25: [
    { grade: "Top Management", count: 7 }, { grade: "Senior Management", count: 21 },
    { grade: "Management", count: 51 }, { grade: "Executive", count: 103 }, { grade: "Non-Executive", count: 35 },
  ],
  Q1FY26: [
    { grade: "Top Management", count: 7 }, { grade: "Senior Management", count: 21 },
    { grade: "Management", count: 52 }, { grade: "Executive", count: 104 }, { grade: "Non-Executive", count: 35 },
  ],
  Q2FY26: [], Q3FY26: [], Q4FY26: [], // not yet reported
  Q1FY27: [], Q2FY27: [], Q3FY27: [], Q4FY27: [],
};

export const ageBreakdownByPeriod: Record<PeriodId, { band: string; count: number }[]> = {
  Q1FY25: [{ band: "≤30", count: 36 }, { band: "31–40", count: 87 }, { band: "41–50", count: 58 }, { band: "51+", count: 27 }],
  Q2FY25: [{ band: "≤30", count: 37 }, { band: "31–40", count: 89 }, { band: "41–50", count: 59 }, { band: "51+", count: 26 }],
  Q3FY25: [{ band: "≤30", count: 37 }, { band: "31–40", count: 90 }, { band: "41–50", count: 60 }, { band: "51+", count: 27 }],
  Q4FY25: [{ band: "≤30", count: 38 }, { band: "31–40", count: 91 }, { band: "41–50", count: 61 }, { band: "51+", count: 27 }],
  Q1FY26: [{ band: "≤30", count: 38 }, { band: "31–40", count: 92 }, { band: "41–50", count: 61 }, { band: "51+", count: 28 }],
  Q2FY26: [], Q3FY26: [], Q4FY26: [],
  Q1FY27: [], Q2FY27: [], Q3FY27: [], Q4FY27: [],
};

/** Male / female headcount per age band (HRMS) — each period's bands sum to that period's ageBreakdown and genderBreakdown. */
export const ageGenderBreakdownByPeriod: Record<PeriodId, { band: string; male: number; female: number }[]> = {
  Q1FY25: [{ band: "≤30", male: 19, female: 17 }, { band: "31–40", male: 45, female: 42 }, { band: "41–50", male: 31, female: 27 }, { band: "51+", male: 15, female: 12 }],
  Q2FY25: [{ band: "≤30", male: 19, female: 18 }, { band: "31–40", male: 47, female: 42 }, { band: "41–50", male: 31, female: 28 }, { band: "51+", male: 15, female: 11 }],
  Q3FY25: [{ band: "≤30", male: 19, female: 18 }, { band: "31–40", male: 47, female: 43 }, { band: "41–50", male: 32, female: 28 }, { band: "51+", male: 15, female: 12 }],
  Q4FY25: [{ band: "≤30", male: 20, female: 18 }, { band: "31–40", male: 48, female: 43 }, { band: "41–50", male: 32, female: 29 }, { band: "51+", male: 15, female: 12 }],
  Q1FY26: [{ band: "≤30", male: 20, female: 18 }, { band: "31–40", male: 48, female: 44 }, { band: "41–50", male: 32, female: 29 }, { band: "51+", male: 16, female: 12 }],
  Q2FY26: [], Q3FY26: [], Q4FY26: [],
  Q1FY27: [], Q2FY27: [], Q3FY27: [], Q4FY27: [],
};

export const averageAgeByPeriod: Record<PeriodId, number> = {
  Q1FY25: 38.9, Q2FY25: 38.8, Q3FY25: 38.7, Q4FY25: 38.6,
  Q1FY26: 38.6, Q2FY26: 38.6, Q3FY26: 38.6, Q4FY26: 38.6,
  Q1FY27: 38.6, Q2FY27: 38.6, Q3FY27: 38.6, Q4FY27: 38.6,
};

export const gradeGenderCrossTabByPeriod: Record<PeriodId, { grade: string; male: number; female: number; avgAge: number }[]> = {
  Q1FY25: [
    { grade: "Top Management", male: 5, female: 2, avgAge: 51.1 },
    { grade: "Senior Management", male: 11, female: 9, avgAge: 45.6 },
    { grade: "Management", male: 25, female: 24, avgAge: 40.3 },
    { grade: "Executive", male: 50, female: 48, avgAge: 33.6 },
    { grade: "Non-Executive", male: 19, female: 15, avgAge: 35.5 },
  ],
  Q2FY25: [
    { grade: "Top Management", male: 5, female: 2, avgAge: 51.3 },
    { grade: "Senior Management", male: 11, female: 9, avgAge: 45.7 },
    { grade: "Management", male: 27, female: 23, avgAge: 40.4 },
    { grade: "Executive", male: 50, female: 50, avgAge: 33.7 },
    { grade: "Non-Executive", male: 19, female: 15, avgAge: 35.6 },
  ],
  Q3FY25: [
    { grade: "Top Management", male: 5, female: 2, avgAge: 51.6 },
    { grade: "Senior Management", male: 12, female: 9, avgAge: 45.9 },
    { grade: "Management", male: 26, female: 25, avgAge: 40.5 },
    { grade: "Executive", male: 51, female: 50, avgAge: 33.8 },
    { grade: "Non-Executive", male: 19, female: 15, avgAge: 35.7 },
  ],
  Q4FY25: [
    { grade: "Top Management", male: 5, female: 2, avgAge: 51.8 },
    { grade: "Senior Management", male: 12, female: 9, avgAge: 46.0 },
    { grade: "Management", male: 26, female: 25, avgAge: 40.7 },
    { grade: "Executive", male: 52, female: 51, avgAge: 33.9 },
    { grade: "Non-Executive", male: 20, female: 15, avgAge: 35.8 },
  ],
  Q1FY26: [
    { grade: "Top Management", male: 5, female: 2, avgAge: 51.4 },
    { grade: "Senior Management", male: 12, female: 9, avgAge: 45.9 },
    { grade: "Management", male: 27, female: 25, avgAge: 40.6 },
    { grade: "Executive", male: 52, female: 52, avgAge: 33.9 },
    { grade: "Non-Executive", male: 20, female: 15, avgAge: 35.8 },
  ],
  Q2FY26: [], Q3FY26: [], Q4FY26: [],
  Q1FY27: [], Q2FY27: [], Q3FY27: [], Q4FY27: [],
};

export const departmentHeadcountByPeriod: Record<PeriodId, { dept: string; approved: number; filled: number }[]> = {
  Q1FY25: [
    { dept: "Finance", approved: 22, filled: 19 }, { dept: "Human Resource", approved: 16, filled: 15 },
    { dept: "Corporate Performance", approved: 14, filled: 13 }, { dept: "IT & Digital", approved: 19, filled: 16 },
    { dept: "Risk & Compliance", approved: 14, filled: 12 },
  ],
  Q2FY25: [
    { dept: "Finance", approved: 23, filled: 20 }, { dept: "Human Resource", approved: 17, filled: 16 },
    { dept: "Corporate Performance", approved: 15, filled: 14 }, { dept: "IT & Digital", approved: 20, filled: 17 },
    { dept: "Risk & Compliance", approved: 15, filled: 12 },
  ],
  Q3FY25: [
    { dept: "Finance", approved: 23, filled: 21 }, { dept: "Human Resource", approved: 17, filled: 16 },
    { dept: "Corporate Performance", approved: 15, filled: 14 }, { dept: "IT & Digital", approved: 20, filled: 18 },
    { dept: "Risk & Compliance", approved: 15, filled: 13 },
  ],
  Q4FY25: [
    { dept: "Finance", approved: 24, filled: 21 }, { dept: "Human Resource", approved: 18, filled: 17 },
    { dept: "Corporate Performance", approved: 15, filled: 15 }, { dept: "IT & Digital", approved: 21, filled: 18 },
    { dept: "Risk & Compliance", approved: 16, filled: 13 },
  ],
  Q1FY26: [
    { dept: "Finance", approved: 24, filled: 22 }, { dept: "Human Resource", approved: 18, filled: 17 },
    { dept: "Corporate Performance", approved: 15, filled: 15 }, { dept: "IT & Digital", approved: 21, filled: 19 },
    { dept: "Risk & Compliance", approved: 16, filled: 14 },
  ],
  Q2FY26: [], Q3FY26: [], Q4FY26: [],
  Q1FY27: [], Q2FY27: [], Q3FY27: [], Q4FY27: [],
};

/** Quarters not yet reported (empty array) carry forward the latest known (Q1 FY2026) breakdown. */
function withFallback<T>(map: Record<PeriodId, T[]>, periodId: PeriodId): T[] {
  const v = map[periodId];
  return v.length > 0 ? v : map.Q1FY26;
}

export const gradeBreakdownFor = (periodId: PeriodId) => withFallback(gradeBreakdownByPeriod, periodId);
export const ageBreakdownFor = (periodId: PeriodId) => withFallback(ageBreakdownByPeriod, periodId);
export const ageGenderBreakdownFor = (periodId: PeriodId) => withFallback(ageGenderBreakdownByPeriod, periodId);
export const gradeGenderCrossTabFor = (periodId: PeriodId) => withFallback(gradeGenderCrossTabByPeriod, periodId);
export const departmentHeadcountFor = (periodId: PeriodId) => withFallback(departmentHeadcountByPeriod, periodId);

interface RecruitmentMetric {
  metric: string;
  weight: number;
  score: string;
  note: string;
  weighted: number;
}

/** KPI 9 component breakdown, by reporting period — kept in sync with each period's seeded KPI9 total in factSeed.ts. */
export const recruitmentIndexByPeriod: Partial<Record<PeriodId, RecruitmentMetric[]>> = {
  Q1FY25: [
    { metric: "Time to Hire (TTH)", weight: 0.20, score: "4 / 5", note: "Avg 48 days to fulfil approved MRFs", weighted: 0.16 },
    { metric: "MRF Fulfilment Rate", weight: 0.20, score: "3 / 5", note: "3 of 5 approved MRFs closed within 75 days", weighted: 0.12 },
    { metric: "Quality of Hire", weight: 0.40, score: "7 / 8", note: "7 confirmed of 8 hires", weighted: 0.35 },
    { metric: "Offer Acceptance Rate", weight: 0.20, score: "8 / 12", note: "8 report-for-duty of 12 offers made", weighted: 0.1333 },
  ],
  Q2FY25: [
    { metric: "Time to Hire (TTH)", weight: 0.20, score: "4 / 5", note: "Avg 45 days to fulfil approved MRFs", weighted: 0.16 },
    { metric: "MRF Fulfilment Rate", weight: 0.20, score: "4 / 5", note: "4 of 5 approved MRFs closed within 75 days", weighted: 0.16 },
    { metric: "Quality of Hire", weight: 0.40, score: "7 / 8", note: "7 confirmed of 8 hires", weighted: 0.35 },
    { metric: "Offer Acceptance Rate", weight: 0.20, score: "9 / 12", note: "9 report-for-duty of 12 offers made", weighted: 0.15 },
  ],
  Q3FY25: [
    { metric: "Time to Hire (TTH)", weight: 0.20, score: "4 / 5", note: "Avg 44 days to fulfil approved MRFs", weighted: 0.16 },
    { metric: "MRF Fulfilment Rate", weight: 0.20, score: "4 / 5", note: "4 of 5 approved MRFs closed within 75 days", weighted: 0.16 },
    { metric: "Quality of Hire", weight: 0.40, score: "8 / 8", note: "8 confirmed of 8 hires", weighted: 0.40 },
    { metric: "Offer Acceptance Rate", weight: 0.20, score: "9 / 12", note: "9 report-for-duty of 12 offers made", weighted: 0.15 },
  ],
  Q4FY25: [
    { metric: "Time to Hire (TTH)", weight: 0.20, score: "5 / 5", note: "Avg 40 days to fulfil approved MRFs", weighted: 0.20 },
    { metric: "MRF Fulfilment Rate", weight: 0.20, score: "4 / 5", note: "4 of 5 approved MRFs closed within 75 days", weighted: 0.16 },
    { metric: "Quality of Hire", weight: 0.40, score: "8 / 8", note: "8 confirmed of 8 hires", weighted: 0.40 },
    { metric: "Offer Acceptance Rate", weight: 0.20, score: "10 / 12", note: "10 report-for-duty of 12 offers made", weighted: 0.1667 },
  ],
  Q1FY26: [
    { metric: "Time to Hire (TTH)", weight: 0.20, score: "5 / 5", note: "Avg 42 days to fulfil approved MRFs", weighted: 0.20 },
    { metric: "MRF Fulfilment Rate", weight: 0.20, score: "3 / 5", note: "5 of 8 approved MRFs closed within 75 days", weighted: 0.12 },
    { metric: "Quality of Hire", weight: 0.40, score: "8 / 8", note: "8 confirmed of 8 hires", weighted: 0.40 },
    { metric: "Offer Acceptance Rate", weight: 0.20, score: "10 / 12", note: "10 report-for-duty of 12 offers made", weighted: 0.1667 },
  ],
};

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

export const turnoverTrend = [
  { period: "Q2 FY25", rate: 3.1 },
  { period: "Q3 FY25", rate: 2.6 },
  { period: "Q4 FY25", rate: 2.8 },
  { period: "Q1 FY26", rate: 2.3 },
];

export const industryBenchmark = 4.2;

/** Employees resigned during each quarter — turnover rate is derived as resigned ÷ that period's total headcount. */
export const resignedByPeriod: Record<PeriodId, number> = {
  Q1FY25: 6, Q2FY25: 4, Q3FY25: 5, Q4FY25: 3,
  Q1FY26: 5, Q2FY26: 5, Q3FY26: 5, Q4FY26: 5,
  Q1FY27: 5, Q2FY27: 5, Q3FY27: 5, Q4FY27: 5,
};

interface BumiputeraTrainingSnapshot {
  poolIdentified: number;
  attendedOne: number;
  attendedTwoPlus: number;
  stage: string;
}

/** attendedOne is kept in sync with each period's seeded KPI13 ytdActual in factSeed.ts. */
export const bumiputeraTrainingByPeriod: Record<PeriodId, BumiputeraTrainingSnapshot> = {
  Q1FY25: { poolIdentified: 135, attendedOne: 30, attendedTwoPlus: 2, stage: "Early stage" },
  Q2FY25: { poolIdentified: 138, attendedOne: 65, attendedTwoPlus: 6, stage: "In progress" },
  Q3FY25: { poolIdentified: 140, attendedOne: 100, attendedTwoPlus: 11, stage: "In progress" },
  Q4FY25: { poolIdentified: 140, attendedOne: 132, attendedTwoPlus: 18, stage: "Completed" },
  Q1FY26: { poolIdentified: 140, attendedOne: 0, attendedTwoPlus: 0, stage: "Not yet commenced" },
  Q2FY26: { poolIdentified: 140, attendedOne: 0, attendedTwoPlus: 0, stage: "Not yet commenced" },
  Q3FY26: { poolIdentified: 140, attendedOne: 0, attendedTwoPlus: 0, stage: "Not yet commenced" },
  Q4FY26: { poolIdentified: 140, attendedOne: 0, attendedTwoPlus: 0, stage: "Not yet commenced" },
  Q1FY27: { poolIdentified: 140, attendedOne: 0, attendedTwoPlus: 0, stage: "Not yet commenced" },
  Q2FY27: { poolIdentified: 140, attendedOne: 0, attendedTwoPlus: 0, stage: "Not yet commenced" },
  Q3FY27: { poolIdentified: 140, attendedOne: 0, attendedTwoPlus: 0, stage: "Not yet commenced" },
  Q4FY27: { poolIdentified: 140, attendedOne: 0, attendedTwoPlus: 0, stage: "Not yet commenced" },
};

/** FY2025's final closing figure — a fixed year-over-year reference, shown regardless of which period is selected. */
export const priorYearTrained = 132;
