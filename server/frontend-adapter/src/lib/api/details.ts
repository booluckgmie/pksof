// Replaces src/lib/api/details.ts's Supabase calls with calls to server/src/routes/details.ts —
// every exported name and signature below is identical to the original file, so details.tsx
// (and anything else importing from "@/lib/api/details") needs no changes at all.
import { apiFetch } from "@/lib/apiClient";
import type { EntityId, PeriodId } from "@/types";
import type { MonthPeriodId } from "@/data/periods";

export interface DetailMetricRow {
  entityId: EntityId;
  periodId: PeriodId | MonthPeriodId;
  metricKey: string;
  dimension: string;
  dimension2: string;
  value: number | null;
  note: string | null;
}

export interface DetailRecordRow {
  id: string;
  entityId: EntityId;
  periodId: PeriodId;
  recordType: string;
  label: string;
  category: string | null;
  valueNum: number | null;
  valueNum2: number | null;
  textNote: string | null;
  flag: boolean | null;
}

interface MetricDbRow {
  entity_id: string; period_id: string; metric_key: string; dimension: string; dimension2: string; value: number | null; note: string | null;
}
interface RecordDbRow {
  id: string; entity_id: string; period_id: string; record_type: string; label: string; category: string | null;
  value_num: number | null; value_num2: number | null; text_note: string | null; flag: boolean | null;
}

const toMetric = (r: MetricDbRow): DetailMetricRow => ({
  entityId: r.entity_id as EntityId, periodId: r.period_id as PeriodId | MonthPeriodId, metricKey: r.metric_key,
  dimension: r.dimension, dimension2: r.dimension2, value: r.value, note: r.note,
});
const toRecord = (r: RecordDbRow): DetailRecordRow => ({
  id: r.id, entityId: r.entity_id as EntityId, periodId: r.period_id as PeriodId, recordType: r.record_type,
  label: r.label, category: r.category, valueNum: r.value_num, valueNum2: r.value_num2, textNote: r.text_note, flag: r.flag,
});

export async function fetchDetailMetrics(): Promise<DetailMetricRow[]> {
  return (await apiFetch<MetricDbRow[]>("/details/metrics")).map(toMetric);
}

export async function fetchDetailRecords(): Promise<DetailRecordRow[]> {
  return (await apiFetch<RecordDbRow[]>("/details/records")).map(toRecord);
}

export async function upsertDetailMetric(input: {
  entityId: EntityId; periodId: PeriodId | MonthPeriodId; metricKey: string; dimension: string; dimension2?: string;
  value: number | null; note?: string | null;
}): Promise<void> {
  await apiFetch("/details/metrics", { method: "PUT", body: input });
}

export async function deleteDetailRecord(id: string): Promise<void> {
  await apiFetch(`/details/records/${encodeURIComponent(id)}`, { method: "DELETE" });
}

export async function upsertDetailRecord(input: {
  id: string; entityId: EntityId; periodId: PeriodId; recordType: string; label: string; category?: string | null;
  valueNum?: number | null; valueNum2?: number | null; textNote?: string | null; flag?: boolean | null;
}): Promise<void> {
  await apiFetch("/details/records", { method: "PUT", body: input });
}
