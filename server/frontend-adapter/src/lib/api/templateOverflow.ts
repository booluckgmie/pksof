// Replaces src/lib/api/templateOverflow.ts — same exported names/signatures, calling
// server/src/routes/templateOverflow.ts instead of Supabase.
import { apiFetch } from "@/lib/apiClient";
import type { EntityId } from "@/types";
import type { OverflowReason } from "@/lib/excelTemplate";

export type OverflowStatus = "pending" | "mapped" | "ignored" | "flagged_for_template";

export interface TemplateOverflowEntry {
  id: string; uploadId: string; entityId: EntityId; sheet: string; periodLabel: string | null;
  rowLabel: string; rowSub: string; rawValue: string; reason: OverflowReason; conflictWithValue: string | null;
  status: OverflowStatus; resolvedBy: string | null; resolvedAt: string | null; resolutionNote: string | null;
  mappedDest: "kpi" | "metric" | "record" | null; mappedKey: string | null; createdAt: string;
}

interface OverflowDbRow {
  id: string; upload_id: string; entity_id: string; sheet: string; period_label: string | null;
  row_label: string | null; row_sub: string | null; raw_value: string | null; reason: string; conflict_with_value: string | null;
  status: string; resolved_by: string | null; resolved_at: string | null; resolution_note: string | null;
  mapped_dest: string | null; mapped_key: string | null; created_at: string;
}

function toEntry(row: OverflowDbRow): TemplateOverflowEntry {
  return {
    id: row.id, uploadId: row.upload_id, entityId: row.entity_id as EntityId, sheet: row.sheet, periodLabel: row.period_label,
    rowLabel: row.row_label ?? "", rowSub: row.row_sub ?? "", rawValue: row.raw_value ?? "", reason: row.reason as OverflowReason,
    conflictWithValue: row.conflict_with_value, status: row.status as OverflowStatus,
    resolvedBy: row.resolved_by, resolvedAt: row.resolved_at, resolutionNote: row.resolution_note,
    mappedDest: row.mapped_dest as TemplateOverflowEntry["mappedDest"], mappedKey: row.mapped_key, createdAt: row.created_at,
  };
}

export async function fetchTemplateOverflowEntries(): Promise<TemplateOverflowEntry[]> {
  return (await apiFetch<OverflowDbRow[]>("/template-overflow")).map(toEntry);
}

export async function insertTemplateOverflowEntries(
  rows: {
    uploadId: string; entityId: EntityId; sheet: string; periodLabel: string | null;
    label: string; sub: string; rawValue: string; reason: OverflowReason; conflictWith?: string;
  }[]
): Promise<void> {
  if (rows.length === 0) return;
  await apiFetch("/template-overflow", { method: "POST", body: rows });
}

export async function resolveTemplateOverflowEntry(input: {
  id: string; status: Exclude<OverflowStatus, "pending">; resolvedBy: string; resolutionNote?: string;
  mappedDest?: "kpi" | "metric" | "record"; mappedKey?: string;
}): Promise<void> {
  await apiFetch(`/template-overflow/${encodeURIComponent(input.id)}`, {
    method: "PATCH",
    body: { status: input.status, resolvedBy: input.resolvedBy, resolutionNote: input.resolutionNote, mappedDest: input.mappedDest, mappedKey: input.mappedKey },
  });
}
