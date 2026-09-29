import { getSupabase } from "@/lib/supabase";
import type { EntityId, PeriodId } from "@/types";

export interface UploadEvent {
  id: string;
  entityId: EntityId;
  fileName: string;
  sheets: string;
  periods: string;
  uploadedBy: string;
  uploadedAt: string;
  totalRows: number;
  savedRows: number;
  failedRows: number;
  /** Storage path of the original .xlsx (upload-files bucket), or null when it wasn't saved —
   * either an upload made before this feature existed, or a storage-save that failed (best-effort,
   * see uploadFileToStorage's caller in DataEntry.tsx: never blocks the data submission itself). */
  filePath: string | null;
}

export interface UploadEventRow {
  id: string;
  uploadId: string;
  dest: "kpi" | "metric" | "record";
  sheet: string;
  label: string;
  periodId: PeriodId;
  value: number | null;
  status: "saved" | "failed";
  errorMessage: string | null;
}

interface UploadEventDbRow {
  id: string;
  entity_id: string;
  file_name: string;
  sheets: string;
  periods: string;
  uploaded_by: string;
  uploaded_at: string;
  total_rows: number;
  saved_rows: number;
  failed_rows: number;
  file_path: string | null;
}

interface UploadEventRowDbRow {
  id: string;
  upload_id: string;
  dest: string;
  sheet: string;
  label: string;
  period_id: string;
  value: number | null;
  status: string;
  error_message: string | null;
}

function toEvent(row: UploadEventDbRow): UploadEvent {
  return {
    id: row.id,
    entityId: row.entity_id as EntityId,
    fileName: row.file_name,
    sheets: row.sheets,
    periods: row.periods,
    uploadedBy: row.uploaded_by,
    uploadedAt: row.uploaded_at,
    totalRows: row.total_rows,
    savedRows: row.saved_rows,
    failedRows: row.failed_rows,
    filePath: row.file_path,
  };
}

function toRow(row: UploadEventRowDbRow): UploadEventRow {
  return {
    id: row.id,
    uploadId: row.upload_id,
    dest: row.dest as UploadEventRow["dest"],
    sheet: row.sheet,
    label: row.label,
    periodId: row.period_id as PeriodId,
    value: row.value,
    status: row.status as UploadEventRow["status"],
    errorMessage: row.error_message,
  };
}

export async function fetchUploadEvents(): Promise<UploadEvent[]> {
  const { data, error } = await getSupabase().from("upload_events").select("*").order("uploaded_at", { ascending: false });
  if (error) throw error;
  return (data as UploadEventDbRow[]).map(toEvent);
}

export async function fetchUploadEventRows(uploadId: string): Promise<UploadEventRow[]> {
  const { data, error } = await getSupabase().from("upload_event_rows").select("*").eq("upload_id", uploadId).order("id");
  if (error) throw error;
  return (data as UploadEventRowDbRow[]).map(toRow);
}

export async function insertUploadEvent(input: {
  id: string;
  entityId: EntityId;
  fileName: string;
  sheets: string;
  periods: string;
  uploadedBy: string;
  totalRows: number;
  savedRows: number;
  failedRows: number;
  filePath?: string | null;
}): Promise<void> {
  const { error } = await getSupabase().from("upload_events").insert({
    id: input.id,
    entity_id: input.entityId,
    file_name: input.fileName,
    sheets: input.sheets,
    periods: input.periods,
    uploaded_by: input.uploadedBy,
    total_rows: input.totalRows,
    saved_rows: input.savedRows,
    failed_rows: input.failedRows,
    file_path: input.filePath ?? null,
  });
  if (error) throw error;
}

/** Deletes an upload's audit-trail record (upload_event_rows cascades via its FK) and its stored
 * file, if it has one — the KPI submissions / detail_metrics / detail_records that upload already
 * wrote are untouched. Storage cleanup is best-effort: logged, not thrown, so a storage hiccup
 * never blocks removing the audit-trail row itself. */
export async function deleteUploadEvent(id: string, filePath?: string | null): Promise<void> {
  const { error } = await getSupabase().from("upload_events").delete().eq("id", id);
  if (error) throw error;
  if (filePath) {
    const { error: storageError } = await getSupabase().storage.from("upload-files").remove([filePath]);
    if (storageError) console.error("Couldn't remove stored file for deleted upload", id, storageError);
  }
}

/** Best-effort save of the original .xlsx to the upload-files bucket, path "<uploadId>/<file
 * name>" — one object per upload event, so a re-upload (fresh uploadId) never collides with or
 * overwrites an earlier one. Returns null (never throws) on failure so a storage hiccup can't
 * block the data submission it's attached to — see DataEntry.tsx's caller. */
export async function uploadFileToStorage(uploadId: string, file: File): Promise<string | null> {
  const path = `${uploadId}/${file.name}`;
  const { error } = await getSupabase().storage.from("upload-files").upload(path, file, { contentType: file.type || undefined });
  if (error) {
    console.error("Couldn't save uploaded file to storage — Upload History won't offer a download for this entry", error);
    return null;
  }
  return path;
}

/** Public URL for a stored upload — the bucket is public-read (see migration 0018), so this is a
 * plain, permanent URL rather than a time-limited signed one. */
export function uploadFileUrl(path: string): string {
  return getSupabase().storage.from("upload-files").getPublicUrl(path).data.publicUrl;
}

export async function insertUploadEventRows(rows: {
  id: string;
  uploadId: string;
  dest: "kpi" | "metric" | "record";
  sheet: string;
  label: string;
  periodId: PeriodId;
  value: number | null;
  status: "saved" | "failed";
  errorMessage?: string | null;
}[]): Promise<void> {
  if (rows.length === 0) return;
  const { error } = await getSupabase().from("upload_event_rows").insert(
    rows.map((r) => ({
      id: r.id,
      upload_id: r.uploadId,
      dest: r.dest,
      sheet: r.sheet,
      label: r.label,
      period_id: r.periodId,
      value: r.value,
      status: r.status,
      error_message: r.errorMessage ?? null,
    }))
  );
  if (error) throw error;
}
