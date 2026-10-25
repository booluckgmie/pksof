// Replaces src/lib/api/submissions.ts — same exported names/signatures, now calling
// server/src/routes/submissions.ts instead of Supabase.
import { apiFetch } from "@/lib/apiClient";
import type { EntityId, PeriodId, Submission, SubmissionSource, SubmissionStatus } from "@/types";

interface SubmissionRow {
  id: string; kpi_id: string; entity_id: string; period_id: string; value: number; note: string | null;
  source: SubmissionSource; submitted_by: string; submitted_at: string; status: SubmissionStatus;
  reviewed_by: string | null; reviewed_at: string | null; review_note: string | null;
}

function toSubmission(row: SubmissionRow): Submission {
  return {
    id: row.id, kpiId: row.kpi_id, entityId: row.entity_id as EntityId, periodId: row.period_id as PeriodId,
    value: row.value, note: row.note ?? "", source: row.source, submittedBy: row.submitted_by, submittedAt: row.submitted_at,
    status: row.status, reviewedBy: row.reviewed_by ?? undefined, reviewedAt: row.reviewed_at ?? undefined, reviewNote: row.review_note ?? undefined,
  };
}

export async function fetchSubmissions(): Promise<Submission[]> {
  return (await apiFetch<SubmissionRow[]>("/submissions")).map(toSubmission);
}

export async function insertSubmission(input: {
  id: string; kpiId: string; entityId: EntityId; periodId: PeriodId; value: number; note: string; source: SubmissionSource; submittedBy: string;
}): Promise<void> {
  await apiFetch("/submissions", { method: "POST", body: input });
}

export async function updateSubmissionValue(input: { id: string; value: number; note: string }): Promise<void> {
  await apiFetch(`/submissions/${encodeURIComponent(input.id)}/value`, { method: "PATCH", body: { value: input.value, note: input.note } });
}

export async function updateSubmissionStatus(input: {
  id: string; status: "published" | "rejected"; reviewedBy: string; reviewNote?: string;
}): Promise<void> {
  await apiFetch(`/submissions/${encodeURIComponent(input.id)}/review`, {
    method: "POST",
    body: { status: input.status, reviewedBy: input.reviewedBy, reviewNote: input.reviewNote },
  });
}
