import { getSupabase } from "@/lib/supabase";
import type { EntityId } from "@/types";
import type { OverflowReason } from "@/lib/excelTemplate";

export type OverflowStatus = "pending" | "mapped" | "ignored" | "flagged_for_template";

export interface TemplateOverflowEntry {
  id: string;
  uploadId: string;
  entityId: EntityId;
  sheet: string;
  periodLabel: string | null;
  rowLabel: string;
  rowSub: string;
  rawValue: string;
  reason: OverflowReason;
  conflictWithValue: string | null;
  status: OverflowStatus;
  resolvedBy: string | null;
  resolvedAt: string | null;
  resolutionNote: string | null;
  mappedDest: "kpi" | "metric" | "record" | null;
  mappedKey: string | null;
  createdAt: string;
}

interface OverflowDbRow {
  id: string;
  upload_id: string;
  entity_id: string;
  sheet: string;
  period_label: string | null;
  row_label: string | null;
  row_sub: string | null;
  raw_value: string | null;
  reason: string;
  conflict_with_value: string | null;
  status: string;
  resolved_by: string | null;
  resolved_at: string | null;
  resolution_note: string | null;
  mapped_dest: string | null;
  mapped_key: string | null;
  created_at: string;
}

function toEntry(row: OverflowDbRow): TemplateOverflowEntry {
  return {
    id: row.id,
    uploadId: row.upload_id,
    entityId: row.entity_id as EntityId,
    sheet: row.sheet,
    periodLabel: row.period_label,
    rowLabel: row.row_label ?? "",
    rowSub: row.row_sub ?? "",
    rawValue: row.raw_value ?? "",
    reason: row.reason as OverflowReason,
    conflictWithValue: row.conflict_with_value,
    status: row.status as OverflowStatus,
    resolvedBy: row.resolved_by,
    resolvedAt: row.resolved_at,
    resolutionNote: row.resolution_note,
    mappedDest: row.mapped_dest as TemplateOverflowEntry["mappedDest"],
    mappedKey: row.mapped_key,
    createdAt: row.created_at,
  };
}

export async function fetchTemplateOverflowEntries(): Promise<TemplateOverflowEntry[]> {
  const { data, error } = await getSupabase().from("template_overflow_entries").select("*").order("created_at", { ascending: false });
  if (error) throw error;
  return (data as OverflowDbRow[]).map(toEntry);
}

/** Saves every row parseWorkbook couldn't place (see excelTemplate.ts's OverflowReason) to the
 * "customize table" — written in the same best-effort pass as the upload audit trail
 * (DataEntry.tsx's handleSubmitParsed): a failure here is logged, never thrown, so it can't block
 * submitting the rows that did match. */
export async function insertTemplateOverflowEntries(
  rows: {
    uploadId: string;
    entityId: EntityId;
    sheet: string;
    periodLabel: string | null;
    label: string;
    sub: string;
    rawValue: string;
    reason: OverflowReason;
    conflictWith?: string;
  }[]
): Promise<void> {
  if (rows.length === 0) return;
  const { error } = await getSupabase().from("template_overflow_entries").insert(
    rows.map((r, i) => ({
      id: `${r.uploadId}-OF-${i}`,
      upload_id: r.uploadId,
      entity_id: r.entityId,
      sheet: r.sheet,
      period_label: r.periodLabel,
      row_label: r.label,
      row_sub: r.sub,
      raw_value: r.rawValue,
      reason: r.reason,
      conflict_with_value: r.conflictWith ?? null,
    }))
  );
  if (error) throw error;
}

/** Marks a pending overflow entry resolved — "mapped" also stamps which real field it was
 * transcribed onto (mappedDest/mappedKey), purely for later traceability; actually writing that
 * value into detail_metrics/detail_records/submissions is a separate, deliberate step (still
 * through the normal checker queue), not something this call does on its own. */
export async function resolveTemplateOverflowEntry(input: {
  id: string;
  status: Exclude<OverflowStatus, "pending">;
  resolvedBy: string;
  resolutionNote?: string;
  mappedDest?: "kpi" | "metric" | "record";
  mappedKey?: string;
}): Promise<void> {
  const { error } = await getSupabase()
    .from("template_overflow_entries")
    .update({
      status: input.status,
      resolved_by: input.resolvedBy,
      resolved_at: new Date().toISOString(),
      resolution_note: input.resolutionNote ?? null,
      mapped_dest: input.mappedDest ?? null,
      mapped_key: input.mappedKey ?? null,
    })
    .eq("id", input.id);
  if (error) throw error;
}
