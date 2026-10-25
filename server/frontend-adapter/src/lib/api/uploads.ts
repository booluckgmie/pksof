// Replaces src/lib/api/uploads.ts — calls server/src/routes/uploads.ts instead of Supabase's
// "upload-files" Storage bucket. Every function keeps its original name/signature EXCEPT
// uploadFileUrl, which has to change shape (see its own comment below) — that's the one place
// UploadsPanel.tsx (src/components/pk/UploadsPanel.tsx) needs a small follow-up edit at actual
// cutover time, swapping its plain `<a href={uploadFileUrl(...)}>` for an onClick that awaits
// this async version and saves the blob — a direct consequence of downloads now requiring auth
// (the old bucket was public; this server's equivalent route isn't, deliberately).
import { apiDownload, apiFetch } from "@/lib/apiClient";
import type { EntityId, PeriodId } from "@/types";

export interface UploadEvent {
  id: string; entityId: EntityId; fileName: string; sheets: string; periods: string; uploadedBy: string; uploadedAt: string;
  totalRows: number; savedRows: number; failedRows: number; filePath: string | null;
}
export interface UploadEventRow {
  id: string; uploadId: string; dest: "kpi" | "metric" | "record"; sheet: string; label: string; periodId: PeriodId;
  value: number | null; status: "saved" | "failed"; errorMessage: string | null;
}

interface UploadEventDbRow {
  id: string; entity_id: string; file_name: string; sheets: string; periods: string; uploaded_by: string; uploaded_at: string;
  total_rows: number; saved_rows: number; failed_rows: number; file_path: string | null;
}
interface UploadEventRowDbRow {
  id: string; upload_id: string; dest: string; sheet: string; label: string; period_id: string;
  value: number | null; status: string; error_message: string | null;
}

const toEvent = (r: UploadEventDbRow): UploadEvent => ({
  id: r.id, entityId: r.entity_id as EntityId, fileName: r.file_name, sheets: r.sheets, periods: r.periods,
  uploadedBy: r.uploaded_by, uploadedAt: r.uploaded_at, totalRows: r.total_rows, savedRows: r.saved_rows, failedRows: r.failed_rows,
  filePath: r.file_path,
});
const toRow = (r: UploadEventRowDbRow): UploadEventRow => ({
  id: r.id, uploadId: r.upload_id, dest: r.dest as UploadEventRow["dest"], sheet: r.sheet, label: r.label,
  periodId: r.period_id as PeriodId, value: r.value, status: r.status as UploadEventRow["status"], errorMessage: r.error_message,
});

export async function fetchUploadEvents(): Promise<UploadEvent[]> {
  return (await apiFetch<UploadEventDbRow[]>("/uploads")).map(toEvent);
}

export async function fetchUploadEventRows(uploadId: string): Promise<UploadEventRow[]> {
  return (await apiFetch<UploadEventRowDbRow[]>(`/uploads/${encodeURIComponent(uploadId)}/rows`)).map(toRow);
}

export async function insertUploadEvent(input: {
  id: string; entityId: EntityId; fileName: string; sheets: string; periods: string; uploadedBy: string;
  totalRows: number; savedRows: number; failedRows: number; filePath?: string | null;
}): Promise<void> {
  await apiFetch("/uploads", { method: "POST", body: input });
}

export async function deleteUploadEvent(id: string, _filePath?: string | null): Promise<void> {
  // _filePath is unused here (kept for call-site compatibility) — the server looks the stored
  // path up itself before deleting, same net effect as before.
  await apiFetch(`/uploads/${encodeURIComponent(id)}`, { method: "DELETE" });
}

export async function uploadFileToStorage(uploadId: string, file: File): Promise<string | null> {
  try {
    const form = new FormData();
    form.append("file", file);
    const { filePath } = await apiFetch<{ filePath: string }>(`/uploads/${encodeURIComponent(uploadId)}/file`, { method: "POST", form });
    return filePath;
  } catch (err) {
    console.error("Couldn't save uploaded file to storage — Upload History won't offer a download for this entry", err);
    return null;
  }
}

/** Was a plain synchronous public URL (Supabase Storage); downloads now require auth, so this
 * is async and returns an object URL for the caller to assign to a hidden <a download> and
 * click, or to window.open — see this file's header note on the one UploadsPanel.tsx follow-up
 * this implies. */
export async function uploadFileUrl(filePath: string): Promise<string> {
  const [uploadId, ...rest] = filePath.split("/");
  const fileName = rest.join("/");
  const blob = await apiDownload(`/uploads/${encodeURIComponent(uploadId)}/file/${encodeURIComponent(fileName)}`);
  return URL.createObjectURL(blob);
}

export async function insertUploadEventRows(rows: {
  id: string; uploadId: string; dest: "kpi" | "metric" | "record"; sheet: string; label: string; periodId: PeriodId;
  value: number | null; status: "saved" | "failed"; errorMessage?: string | null;
}[]): Promise<void> {
  if (rows.length === 0) return;
  await apiFetch("/uploads/rows", { method: "POST", body: rows });
}
