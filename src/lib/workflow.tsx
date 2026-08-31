import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { toast } from "sonner";
import type { EntityId, FactKpiResultSeed, KpiStatus, PeriodId, Submission, SubmissionSource } from "@/types";
import { kpiById, kpiStatus, weightedAchievement } from "@/data/kpis";
import { periodById } from "@/data/periods";
import { useKpiTargets } from "@/lib/kpiTargets";
import { fetchFactResults, upsertFactResult } from "@/lib/api/facts";
import { fetchSubmissions, insertSubmission, updateSubmissionStatus, updateSubmissionValue } from "@/lib/api/submissions";

interface WorkflowContextValue {
  submissions: Submission[];
  loading: boolean;
  submit: (input: {
    kpiId: string;
    entityId: EntityId;
    periodId: PeriodId;
    value: number;
    note: string;
    source: SubmissionSource;
    submittedBy: string;
  }) => void;
  editSubmission: (id: string, value: number, note: string) => void;
  approve: (id: string, reviewedBy: string, reviewNote?: string) => void;
  approveAll: (reviewedBy: string, reviewNote?: string, ids?: string[]) => void;
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
const newSubmissionId = () => `SUB-${Date.now().toString(36)}-${String(seq++).padStart(3, "0")}`;

/**
 * Backed by Supabase (fact_kpi_results + submissions tables) instead of an in-memory array —
 * see supabase/migrations/0001_init.sql for schema. Facts and submissions are fetched once on
 * mount and cached in state so `latestValue` stays a synchronous read (all 19 screens call it
 * that way); writes go to Supabase first and update local state once they succeed, with a toast
 * on failure so a dropped connection doesn't silently lose someone's submission.
 */
export function WorkflowProvider({ children }: { children: ReactNode }) {
  const { getFyTarget } = useKpiTargets();
  const [facts, setFacts] = useState<FactKpiResultSeed[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);

  /** KpiExt with fyTarget swapped for the live, admin-editable per-FY value (falls back to the
   * static kpis.ts constant if no override exists) — see src/lib/kpiTargets.tsx. */
  const withLiveTarget = (kpiId: string, periodId: PeriodId) => {
    const k = kpiById(kpiId);
    return { ...k, fyTarget: getFyTarget(kpiId, periodById(periodId).fy) };
  };

  useEffect(() => {
    let cancelled = false;
    Promise.all([fetchFactResults(), fetchSubmissions()])
      .then(([factRows, submissionRows]) => {
        if (cancelled) return;
        setFacts(factRows);
        setSubmissions(submissionRows);
      })
      .catch((err: Error) => {
        console.error("Failed to load dashboard data from Supabase", err);
        toast.error("Could not load data from the database", { description: err.message });
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const submit: WorkflowContextValue["submit"] = (input) => {
    const s: Submission = {
      id: newSubmissionId(),
      ...input,
      submittedAt: new Date().toISOString(),
      status: "submitted",
    };
    setSubmissions((prev) => [s, ...prev]);
    insertSubmission(s).catch((err: Error) => {
      console.error("Failed to save submission", err);
      toast.error("Submission wasn't saved", { description: err.message });
      setSubmissions((prev) => prev.filter((x) => x.id !== s.id));
    });
  };

  const approveOne = (id: string, reviewedBy: string, reviewNote?: string) => {
    const target = submissions.find((s) => s.id === id);
    const reviewedAt = new Date().toISOString();
    setSubmissions((prev) =>
      prev.map((s) => (s.id === id ? { ...s, status: "published", reviewedBy, reviewedAt, reviewNote } : s))
    );

    updateSubmissionStatus({ id, status: "published", reviewedBy, reviewNote })
      .then(() => {
        if (!target) return;
        const k = withLiveTarget(target.kpiId, target.periodId);
        const seed = facts.find((f) => f.kpiId === target.kpiId && f.entityId === target.entityId && f.periodId === target.periodId);
        const ytdTarget = seed?.ytdTarget ?? k.fyTarget;
        const status = kpiStatus(k, target.value, ytdTarget);
        return upsertFactResult({ kpiId: target.kpiId, entityId: target.entityId, periodId: target.periodId, ytdActual: target.value, ytdTarget, status }).then(() => {
          setFacts((prev) => {
            const next = prev.filter((f) => !(f.kpiId === target.kpiId && f.entityId === target.entityId && f.periodId === target.periodId));
            next.push({ kpiId: target.kpiId, entityId: target.entityId, periodId: target.periodId, ytdTarget, ytdActual: target.value, status });
            return next;
          });
        });
      })
      .catch((err: Error) => {
        console.error("Failed to publish submission", err);
        toast.error("Publish didn't save to the database", { description: err.message });
      });
  };

  const approve: WorkflowContextValue["approve"] = (id, reviewedBy, reviewNote) => approveOne(id, reviewedBy, reviewNote);

  const approveAll: WorkflowContextValue["approveAll"] = (reviewedBy, reviewNote, ids) => {
    const targets = ids ?? submissions.filter((s) => s.status === "submitted").map((s) => s.id);
    for (const id of targets) approveOne(id, reviewedBy, reviewNote);
  };

  /** Corrects a submission's value/note while it's still pending review. Once a submission is
   * published, it's locked — per the 28 Aug 2026 Prokhas meeting decision, a published figure
   * needs HoD/checker sign-off to change, not a direct in-place edit (see migration 0010, which
   * revokes the permissive published-row UPDATE policy migration 0008 had added). */
  const editSubmission: WorkflowContextValue["editSubmission"] = (id, value, note) => {
    const previous = submissions.find((s) => s.id === id);
    setSubmissions((prev) => prev.map((s) => (s.id === id ? { ...s, value, note } : s)));
    updateSubmissionValue({ id, value, note }).catch((err: Error) => {
      console.error("Failed to update submission", err);
      toast.error("Edit wasn't saved", { description: err.message });
      if (previous) setSubmissions((prev) => prev.map((s) => (s.id === id ? previous : s)));
    });
  };

  const reject: WorkflowContextValue["reject"] = (id, reviewedBy, reviewNote) => {
    const reviewedAt = new Date().toISOString();
    setSubmissions((prev) =>
      prev.map((s) => (s.id === id ? { ...s, status: "rejected", reviewedBy, reviewedAt, reviewNote } : s))
    );
    updateSubmissionStatus({ id, status: "rejected", reviewedBy, reviewNote }).catch((err: Error) => {
      console.error("Failed to reject submission", err);
      toast.error("Rejection didn't save to the database", { description: err.message });
    });
  };

  const pending = submissions.filter((s) => s.status === "submitted");

  const latestValue = (kpiId: string, entityId: EntityId, periodId: PeriodId): KpiResult => {
    const published = submissions
      .filter((s) => s.kpiId === kpiId && s.entityId === entityId && s.periodId === periodId && s.status === "published")
      .sort((a, b) => (b.reviewedAt ?? "").localeCompare(a.reviewedAt ?? ""));

    const k = withLiveTarget(kpiId, periodId);

    if (published.length > 0) {
      const v = published[0];
      const seed = facts.find((f) => f.kpiId === kpiId && f.entityId === entityId && f.periodId === periodId);
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

    const seed = facts.find((f) => f.kpiId === kpiId && f.entityId === entityId && f.periodId === periodId);
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
    <WorkflowContext.Provider value={{ submissions, loading, submit, editSubmission, approve, approveAll, reject, pending, latestValue }}>
      {children}
    </WorkflowContext.Provider>
  );
}

export function useWorkflow() {
  const ctx = useContext(WorkflowContext);
  if (!ctx) throw new Error("useWorkflow must be used within WorkflowProvider");
  return ctx;
}
