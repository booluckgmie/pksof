import type { Kpi } from "@/types";

export type KpiDirection = "higher" | "lower";

export interface KpiExt extends Kpi {
  direction: KpiDirection;
}

export const kpis: KpiExt[] = [
  { id: "KPI1", no: 1, name: "Profit Before Tax (PBT)", perspective: "FIN", weight: 0.125, unit: "RM mil", fyTarget: 106.2, direction: "higher", formulaNote: "YTD Actual ÷ FY Target × Weight", dataOwner: "Finance" },
  { id: "KPI2", no: 2, name: "Cost-to-Income Ratio", perspective: "FIN", weight: 0.125, unit: "%", fyTarget: 55.0, direction: "lower", formulaNote: "FY Target ÷ YTD Actual × Weight (capped)", dataOwner: "Finance" },
  { id: "KPI3", no: 3, name: "Managed Entities Rating", perspective: "MG", weight: 0.075, unit: "rating /5", fyTarget: 4.5, direction: "higher", formulaNote: "YTD Actual ÷ FY Target × Weight", dataOwner: "Strategy & Performance" },
  { id: "KPI4", no: 4, name: "Governance Index", perspective: "MG", weight: 0.075, unit: "%", fyTarget: 100.0, direction: "higher", formulaNote: "5-component index, annual assessment in Q4", dataOwner: "Risk & Compliance" },
  { id: "KPI5", no: 5, name: "External Client Satisfaction", perspective: "CUST", weight: 0.075, unit: "rating /5", fyTarget: 4.7, direction: "higher", formulaNote: "Bi-annual survey", dataOwner: "Corporate Communications" },
  { id: "KPI6", no: 6, name: "Time Charter Compliance", perspective: "CUST", weight: 0.075, unit: "%", fyTarget: 95.0, direction: "higher", formulaNote: "Service-level compliance, quarterly", dataOwner: "Operations" },
  { id: "KPI7", no: 7, name: "Process Improvements", perspective: "IBP", weight: 0.10, unit: "initiatives", fyTarget: 3, direction: "higher", formulaNote: "Count of completed initiatives", dataOwner: "Operational Excellence" },
  { id: "KPI8", no: 8, name: "New Technology Implementation", perspective: "IBP", weight: 0.10, unit: "initiatives", fyTarget: 6, direction: "higher", formulaNote: "Count of completed initiatives", dataOwner: "IT Department" },
  { id: "KPI9", no: 9, name: "Recruitment Efficiency Index", perspective: "OC", weight: 0.10, unit: "%", fyTarget: 80.0, direction: "higher", formulaNote: "TTH 20% + MRF Fulfilment 20% + Quality of Hire 40% + Offer Acceptance 20%", dataOwner: "Human Resource" },
  { id: "KPI10", no: 10, name: "People Development Programme", perspective: "OC", weight: 0.10, unit: "%", fyTarget: 100.0, direction: "higher", formulaNote: "Programme completion rate", dataOwner: "Human Resource" },
  { id: "KPI11", no: 11, name: "Bumiputera Procurement", perspective: "BE", weight: 0.0167, unit: "RM mil", fyTarget: 2.2, direction: "higher", formulaNote: "YTD Actual ÷ FY Target × Weight", dataOwner: "Administration & Security" },
  { id: "KPI12", no: 12, name: "Bumiputera Composition", perspective: "BE", weight: 0.0167, unit: "%", fyTarget: 70.0, direction: "higher", formulaNote: "Bumiputera staff ÷ Total staff × 100", dataOwner: "Human Resource" },
  { id: "KPI13", no: 13, name: "Bumiputera Training", perspective: "BE", weight: 0.0166, unit: "staff", fyTarget: 120, direction: "higher", formulaNote: "Staff completing ≥2 registered programmes", dataOwner: "Human Resource" },
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
