import { getSupabase } from "@/lib/supabase";
import type { DetailSubmission, EntityId, Module, PeriodId, SubmissionStatus } from "@/types";

interface DetailSubmissionRow {
  id: string;
  dest: "metric" | "record";
  module: Module;
  entity_id: string;
  period_id: string;
  metric_key: string | null;
  dimension: string | null;
  dimension2: string | null;
  record_id: string | null;
  record_type: string | null;
  label: string | null;
  category: string | null;
  value_num: number | null;
  value_num2: number | null;
  text_note: string | null;
  note: string | null;
  source: "web-form" | "excel-upload" | "backfill";
  submitted_by: string;
  submitted_at: string;
  status: SubmissionStatus;
  reviewed_by: string | null;
  reviewed_at: string | null;
  review_note: string | null;
}

function toDetailSubmission(row: DetailSubmissionRow): DetailSubmission {
  return {
    id: row.id,
    dest: row.dest,
    module: row.module,
    entityId: row.entity_id as EntityId,
    periodId: row.period_id as PeriodId,
    metricKey: row.metric_key ?? undefined,
    dimension: row.dimension ?? undefined,
    dimension2: row.dimension2 ?? undefined,
    recordId: row.record_id ?? undefined,
    recordType: row.record_type ?? undefined,
    label: row.label ?? undefined,
    category: row.category ?? undefined,
    valueNum: row.value_num,
    valueNum2: row.value_num2,
    textNote: row.text_note,
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

export async function fetchDetailSubmissions(): Promise<DetailSubmission[]> {
  const { data, error } = await getSupabase().from("detail_submissions").select("*").order("submitted_at", { ascending: false });
  if (error) throw error;
  return (data as DetailSubmissionRow[]).map(toDetailSubmission);
}

export interface InsertDetailSubmissionInput {
  id: string;
  dest: "metric" | "record";
  module: Module;
  entityId: EntityId;
  periodId: PeriodId | string;
  metricKey?: string;
  dimension?: string;
  dimension2?: string;
  recordId?: string;
  recordType?: string;
  label?: string;
  category?: string;
  valueNum?: number | null;
  valueNum2?: number | null;
  textNote?: string | null;
  note?: string;
  source: "web-form" | "excel-upload" | "backfill";
  submittedBy: string;
  /** Backfill only — inserts a submission that's already reviewed, for a figure that's been live
   * on the dashboard since before this queue existed. Leave unset for a real, pending submission. */
  status?: "submitted" | "published";
  reviewedBy?: string;
  reviewedAt?: string;
  reviewNote?: string;
}

export async function insertDetailSubmission(input: InsertDetailSubmissionInput): Promise<void> {
  const { error } = await getSupabase().from("detail_submissions").insert({
    id: input.id,
    dest: input.dest,
    module: input.module,
    entity_id: input.entityId,
    period_id: input.periodId,
    metric_key: input.metricKey ?? null,
    dimension: input.dimension ?? null,
    dimension2: input.dimension2 ?? null,
    record_id: input.recordId ?? null,
    record_type: input.recordType ?? null,
    label: input.label ?? null,
    category: input.category ?? null,
    value_num: input.valueNum ?? null,
    value_num2: input.valueNum2 ?? null,
    text_note: input.textNote ?? null,
    note: input.note ?? null,
    source: input.source,
    submitted_by: input.submittedBy,
    status: input.status ?? "submitted",
    reviewed_by: input.reviewedBy ?? null,
    reviewed_at: input.reviewedAt ?? null,
    review_note: input.reviewNote ?? null,
  });
  if (error) throw error;
}

export async function updateDetailSubmissionStatus(input: {
  id: string;
  status: "published" | "rejected";
  reviewedBy: string;
  reviewNote?: string;
}): Promise<void> {
  const { error } = await getSupabase()
    .from("detail_submissions")
    .update({
      status: input.status,
      reviewed_by: input.reviewedBy,
      reviewed_at: new Date().toISOString(),
      review_note: input.reviewNote ?? null,
    })
    .eq("id", input.id);
  if (error) throw error;
}
