import { createContext, useContext, useState, type ReactNode } from "react";
import type { EntityId, KpiStatus, PeriodId, Submission, SubmissionSource } from "@/types";
import { factSeed } from "@/data/factSeed";
import { kpiById, kpiStatus, weightedAchievement } from "@/data/kpis";

interface WorkflowContextValue {
  submissions: Submission[];
  submit: (input: {
    kpiId: string;
    entityId: EntityId;
    periodId: PeriodId;
    value: number;
    note: string;
    source: SubmissionSource;
    submittedBy: string;
  }) => void;
  approve: (id: string, reviewedBy: string, reviewNote?: string) => void;
  reject: (id: string, reviewedBy: string, reviewNote: string) => void;
  pending: Submission[];
  latestValue: (kpiId: string, entityId: EntityId, periodId: PeriodId) => KpiResult;
}

export interface KpiResult {
  ytdActual: number | null;
  ytdTarget: number | null;
  status: KpiStatus;
  weighted: number | null;
  note?: string;
  origin: "seed" | "submission" | "none";
  lastUpdated?: string;
  lastUpdatedBy?: string;
}

const WorkflowContext = createContext<WorkflowContextValue | null>(null);

let seq = 1;

export function WorkflowProvider({ children }: { children: ReactNode }) {
  const [submissions, setSubmissions] = useState<Submission[]>([]);

  const submit: WorkflowContextValue["submit"] = (input) => {
    const s: Submission = {
      id: `SUB-${String(seq++).padStart(4, "0")}`,
      ...input,
      submittedAt: new Date().toISOString(),
      status: "submitted",
    };
    setSubmissions((prev) => [s, ...prev]);
  };

  const approve: WorkflowContextValue["approve"] = (id, reviewedBy, reviewNote) => {
    setSubmissions((prev) =>
      prev.map((s) =>
        s.id === id
          ? { ...s, status: "published", reviewedBy, reviewedAt: new Date().toISOString(), reviewNote }
          : s
      )
    );
  };

  const reject: WorkflowContextValue["reject"] = (id, reviewedBy, reviewNote) => {
    setSubmissions((prev) =>
      prev.map((s) =>
        s.id === id
          ? { ...s, status: "rejected", reviewedBy, reviewedAt: new Date().toISOString(), reviewNote }
          : s
      )
    );
  };

  const pending = submissions.filter((s) => s.status === "submitted");

  const latestValue = (kpiId: string, entityId: EntityId, periodId: PeriodId): KpiResult => {
    const published = submissions
      .filter((s) => s.kpiId === kpiId && s.entityId === entityId && s.periodId === periodId && s.status === "published")
      .sort((a, b) => (b.reviewedAt ?? "").localeCompare(a.reviewedAt ?? ""));

    const k = kpiById(kpiId);

    if (published.length > 0) {
      const v = published[0];
      const seed = factSeed.find((f) => f.kpiId === kpiId && f.entityId === entityId && f.periodId === periodId);
      const ytdTarget = seed?.ytdTarget ?? k.fyTarget;
      return {
        ytdActual: v.value,
        ytdTarget,
        status: kpiStatus(k, v.value, ytdTarget),
        weighted: weightedAchievement(k, v.value),
        origin: "submission",
        lastUpdated: v.reviewedAt,
        lastUpdatedBy: v.reviewedBy,
      };
    }

    const seed = factSeed.find((f) => f.kpiId === kpiId && f.entityId === entityId && f.periodId === periodId);
    if (seed) {
      return {
        ytdActual: seed.ytdActual,
        ytdTarget: seed.ytdTarget,
        status: seed.status,
        weighted: weightedAchievement(k, seed.ytdActual),
        note: seed.note,
        origin: "seed",
      };
    }

    return { ytdActual: null, ytdTarget: null, status: "not-measurable", weighted: null, origin: "none" };
  };

  return (
    <WorkflowContext.Provider value={{ submissions, submit, approve, reject, pending, latestValue }}>
      {children}
    </WorkflowContext.Provider>
  );
}

export function useWorkflow() {
  const ctx = useContext(WorkflowContext);
  if (!ctx) throw new Error("useWorkflow must be used within WorkflowProvider");
  return ctx;
}
