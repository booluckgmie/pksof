// Replaces src/lib/api/detailSubmissions.ts — same exported names/signatures, calling
// server/src/routes/detailSubmissions.ts instead of Supabase.
import { apiFetch } from "@/lib/apiClient";
import type { DetailSubmission, EntityId, Module, PeriodId, SubmissionStatus } from "@/types";

interface DetailSubmissionRow {
  id: string; dest: "metric" | "record"; module: Module; entity_id: string; period_id: string;
  metric_key: string | null; dimension: string | null; dimension2: string | null;
  record_id: string | null; record_type: string | null; label: string | null; category: string | null;
  value_num: number | null; value_num2: number | null; text_note: string | null; note: string | null;
  source: "web-form" | "excel-upload" | "backfill"; submitted_by: string; submitted_at: string; status: SubmissionStatus;
  reviewed_by: string | null; reviewed_at: string | null; review_note: string | null;
}

function toDetailSubmission(row: DetailSubmissionRow): DetailSubmission {
  return {
    id: row.id, dest: row.dest, module: row.module, entityId: row.entity_id as EntityId, periodId: row.period_id as PeriodId,
    metricKey: row.metric_key ?? undefined, dimension: row.dimension ?? undefined, dimension2: row.dimension2 ?? undefined,
    recordId: row.record_id ?? undefined, recordType: row.record_type ?? undefined, label: row.label ?? undefined, category: row.category ?? undefined,
    valueNum: row.value_num, valueNum2: row.value_num2, textNote: row.text_note, note: row.note ?? "",
    source: row.source, submittedBy: row.submitted_by, submittedAt: row.submitted_at, status: row.status,
    reviewedBy: row.reviewed_by ?? undefined, reviewedAt: row.reviewed_at ?? undefined, reviewNote: row.review_note ?? undefined,
  };
}

export async function fetchDetailSubmissions(): Promise<DetailSubmission[]> {
  return (await apiFetch<DetailSubmissionRow[]>("/detail-submissions")).map(toDetailSubmission);
}

export interface InsertDetailSubmissionInput {
  id: string; dest: "metric" | "record"; module: Module; entityId: EntityId; periodId: PeriodId | string;
  metricKey?: string; dimension?: string; dimension2?: string; recordId?: string; recordType?: string; label?: string; category?: string;
  valueNum?: number | null; valueNum2?: number | null; textNote?: string | null; note?: string;
  source: "web-form" | "excel-upload" | "backfill"; submittedBy: string;
  status?: "submitted" | "published"; reviewedBy?: string; reviewedAt?: string; reviewNote?: string;
}

export async function insertDetailSubmission(input: InsertDetailSubmissionInput): Promise<void> {
  await apiFetch("/detail-submissions", { method: "POST", body: input });
}

export async function updateDetailSubmissionStatus(input: {
  id: string; status: "published" | "rejected"; reviewedBy: string; reviewNote?: string;
}): Promise<void> {
  await apiFetch(`/detail-submissions/${encodeURIComponent(input.id)}/review`, {
    method: "POST",
    body: { status: input.status, reviewedBy: input.reviewedBy, reviewNote: input.reviewNote },
  });
}
