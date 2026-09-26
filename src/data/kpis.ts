import type { Kpi } from "@/types";

export type KpiDirection = "higher" | "lower";

export interface KpiExt extends Kpi {
  direction: KpiDirection;
}

export const kpis: KpiExt[] = [
  { id: "KPI1", no: 1, name: "Profit Before Tax (PBT)", perspective: "FIN", weight: 0.125, unit: "RM mil", fyTarget: 106.2, direction: "higher", generalDescription: "Financial Target: Measures year-to-date earnings generated before income tax against approved financial targets.", dataOwner: "Finance" },
  { id: "KPI2", no: 2, name: "Cost-to-Income Ratio", perspective: "FIN", weight: 0.125, unit: "%", fyTarget: 55.0, direction: "lower", generalDescription: "Operational Efficiency: Measures operating costs as a percentage of revenue. A lower percentage reflects greater efficiency in managing expenses.", dataOwner: "Finance" },
  { id: "KPI3", no: 3, name: "Managed Entities Rating", perspective: "MG", weight: 0.075, unit: "rating /5", fyTarget: 4.5, direction: "higher", generalDescription: "Entity Performance: Tracks the overall performance and governance quality score averaged across all managed entities under supervision.", dataOwner: "Strategy & Performance" },
  { id: "KPI4", no: 4, name: "Governance Index", perspective: "MG", weight: 0.075, unit: "%", fyTarget: 100.0, direction: "higher", generalDescription: "Regulatory Compliance: Evaluates adherence to internal governance standards, policy guidelines, and compliance frameworks.", dataOwner: "Risk & Compliance" },
  { id: "KPI5", no: 5, name: "External Client Satisfaction", perspective: "CUST", weight: 0.075, unit: "rating /5", fyTarget: 4.7, direction: "higher", generalDescription: "Client Feedback: Measures external client satisfaction levels through annual survey assessments conducted at year-end.", dataOwner: "Corporate Communications" },
  { id: "KPI6", no: 6, name: "Time Charter Compliance", perspective: "CUST", weight: 0.075, unit: "%", fyTarget: 95.0, direction: "higher", generalDescription: "Service Delivery: Tracks compliance rates with time charter agreement terms, service standards, and schedule commitments.", dataOwner: "Operations" },
  { id: "KPI7", no: 7, name: "Process Improvements", perspective: "IBP", weight: 0.10, unit: "initiatives", fyTarget: 3, direction: "higher", generalDescription: "Operational Optimization: Counts completed process workflow enhancements and operational efficiency initiatives for the year.", dataOwner: "Operational Excellence" },
  { id: "KPI8", no: 8, name: "New Technology Implementation", perspective: "IBP", weight: 0.10, unit: "initiatives", fyTarget: 7, direction: "higher", generalDescription: "Digital Transformation: Measures progress on deploying planned technology systems, digital tools, and IT infrastructure.", dataOwner: "IT Department" },
  { id: "KPI9", no: 9, name: "Recruitment Efficiency Index", perspective: "OC", weight: 0.10, unit: "%", fyTarget: 80.0, direction: "higher", generalDescription: "Talent Acquisition: Measures HR efficiency in filling job vacancies based on hiring speed, offer acceptance rates, and candidate quality.", dataOwner: "Human Resource" },
  { id: "KPI10", no: 10, name: "People Development Programme", perspective: "OC", weight: 0.10, unit: "%", fyTarget: 100.0, direction: "higher", generalDescription: "Staff Training: Tracks the completion rate of scheduled corporate training and professional development programs against planned milestones.", dataOwner: "Human Resource" },
  { id: "KPI11", no: 11, name: "Bumiputera Procurement", perspective: "BE", weight: 0.0167, unit: "RM mil", fyTarget: 2.5, direction: "higher", generalDescription: "Vendor Diversity: Tracks total value of contract awards and procurement spending allocated to Bumiputera vendors.", dataOwner: "Administration & Security" },
  { id: "KPI12", no: 12, name: "Bumiputera Composition", perspective: "BE", weight: 0.0167, unit: "%", fyTarget: 70.0, direction: "higher", generalDescription: "Workforce Representation: Measures the percentage of Bumiputera staff within the organization's total workforce.", dataOwner: "Human Resource" },
  { id: "KPI13", no: 13, name: "Bumiputera Training", perspective: "BE", weight: 0.0166, unit: "staff", fyTarget: 129, direction: "higher", generalDescription: "Competency Enhancement: Tracks the number of Bumiputera employees who complete at least two registered skill development programs during the year.", dataOwner: "Human Resource" },
];

export const kpiById = (id: string) => kpis.find((k) => k.id === id)!;
export const kpisByPerspective = (p: string) => kpis.filter((k) => k.perspective === p);

/** Weighted achievement, per MOF guidance: capped at the KPI's own weight. */
export function weightedAchievement(k: KpiExt, ytdActual: number | null): number | null {
  if (ytdActual === null || k.fyTarget === null || k.fyTarget === 0) return null;
  const raw = k.direction === "higher" ? ytdActual / k.fyTarget : k.fyTarget / ytdActual;
  return Math.min(k.weight, Math.max(0, raw) * k.weight);
}

export function kpiStatus(k: KpiExt, ytdActual: number | null, ytdTarget: number | null): "met" | "not-met" | "not-measurable" {
  if (ytdActual === null || ytdTarget === null) return "not-measurable";
  const met = k.direction === "higher" ? ytdActual >= ytdTarget : ytdActual <= ytdTarget;
  return met ? "met" : "not-met";
}
