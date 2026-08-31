export type EntityId = "HQ" | "SJPP" | "SJKP" | "DANAHARTA" | "DANAINFRA" | "GOVCO";

export type Module = "CP" | "FH" | "RP";

export interface Entity {
  id: EntityId;
  name: string;
  fullName: string;
  kind: "HQ" | "ME";
  modules: Module[];
}

export type PerspectiveId = "FIN" | "MG" | "CUST" | "IBP" | "OC" | "BE";

export interface Perspective {
  id: PerspectiveId;
  code: string;
  name: string;
  weight: number; // fraction of 1.0
  screenCode: string;
  icon: string;
}

export type KpiStatus = "met" | "not-met" | "not-measurable";

export interface Kpi {
  id: string; // e.g. "KPI1"
  no: number;
  name: string;
  perspective: PerspectiveId;
  weight: number; // fraction of 1.0
  unit: string; // "RM mil" | "%" | "rating" | "count" | "staff"
  fyTarget: number | null;
  formulaNote: string;
  dataOwner: string;
}

export type PeriodId =
  | "Q1FY25" | "Q2FY25" | "Q3FY25" | "Q4FY25"
  | "Q1FY26" | "Q2FY26" | "Q3FY26" | "Q4FY26"
  | "Q1FY27" | "Q2FY27" | "Q3FY27" | "Q4FY27";

export interface Period {
  id: PeriodId;
  label: string;
  fy: string; // e.g. "FY2025" — used to group the period picker
  quarter: 1 | 2 | 3 | 4;
  cumulativeThreshold: number;
  mofThreshold: number;
  isCurrent: boolean;
  isOpenForEntry: boolean;
}

export interface FactKpiResultSeed {
  kpiId: string;
  entityId: EntityId;
  periodId: PeriodId;
  ytdTarget: number | null;
  ytdActual: number | null;
  status: KpiStatus;
  note?: string;
}

export type SubmissionStatus = "submitted" | "published" | "rejected";
export type SubmissionSource = "web-form" | "excel-upload";

export interface Submission {
  id: string;
  kpiId: string;
  entityId: EntityId;
  periodId: PeriodId;
  value: number;
  note: string;
  source: SubmissionSource;
  submittedBy: string;
  submittedAt: string; // ISO
  status: SubmissionStatus;
  reviewedBy?: string;
  reviewedAt?: string;
  reviewNote?: string;
}

export type Role =
  | "board"
  | "exec"
  | "dept_head"
  | "reporting_officer"
  | "admin";

export interface RoleDef {
  id: Role;
  label: string;
  description: string;
  canEnterData: boolean;
  canVerify: boolean;
  readOnly: boolean;
  pillarLocked: boolean; // restricted to one entity
  moduleLocked: boolean; // restricted to one CP/FH/RP pillar within that entity
}

export interface SessionState {
  role: Role;
  userName: string;
  entityId: EntityId;
  periodId: PeriodId;
  assignedModule: Module | null;
}
