import { getSupabase } from "@/lib/supabase";
import type { EntityId, PeriodId, Submission, SubmissionSource, SubmissionStatus } from "@/types";

interface SubmissionRow {
  id: string;
  kpi_id: string;
  entity_id: string;
  period_id: string;
  value: number;
  note: string | null;
  source: SubmissionSource;
  submitted_by: string;
  submitted_at: string;
  status: SubmissionStatus;
  reviewed_by: string | null;
  reviewed_at: string | null;
  review_note: string | null;
}

function toSubmission(row: SubmissionRow): Submission {
  return {
    id: row.id,
    kpiId: row.kpi_id,
    entityId: row.entity_id as EntityId,
    periodId: row.period_id as PeriodId,
    value: row.value,
    note: row.note ?? "",
    source: row.source,
    submittedBy: row.submitted_by,
    submittedAt: row.submitted_at,
    status: row.status,
    reviewedBy: row.reviewed_by ?? undefined,
    reviewedAt: row.reviewed_at ?? undefined,
    reviewNote: row.review_note ?? undefined,
  };
}

export async function fetchSubmissions(): Promise<Submission[]> {
  const { data, error } = await getSupabase().from("submissions").select("*").order("submitted_at", { ascending: false });
  if (error) throw error;
  return (data as SubmissionRow[]).map(toSubmission);
}

export async function insertSubmission(input: {
  id: string;
  kpiId: string;
  entityId: EntityId;
  periodId: PeriodId;
  value: number;
  note: string;
  source: SubmissionSource;
  submittedBy: string;
}): Promise<void> {
  const { error } = await getSupabase().from("submissions").insert({
    id: input.id,
    kpi_id: input.kpiId,
    entity_id: input.entityId,
    period_id: input.periodId,
    value: input.value,
    note: input.note,
    source: input.source,
    submitted_by: input.submittedBy,
    status: "submitted",
  });
  if (error) throw error;
}

export async function updateSubmissionStatus(input: {
  id: string;
  status: "published" | "rejected";
  reviewedBy: string;
  reviewNote?: string;
}): Promise<void> {
  const { error } = await getSupabase()
    .from("submissions")
    .update({
      status: input.status,
      reviewed_by: input.reviewedBy,
      reviewed_at: new Date().toISOString(),
      review_note: input.reviewNote ?? null,
    })
    .eq("id", input.id);
  if (error) throw error;
}
