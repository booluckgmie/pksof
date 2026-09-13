import { getSupabase } from "@/lib/supabase";
import type { EntityId, PeriodId } from "@/types";
import type { MonthPeriodId } from "@/data/periods";

export interface DetailMetricRow {
  entityId: EntityId;
  /** Usually a quarter, but Financial Trend rows can also carry a MonthPeriodId — see periods.ts. */
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
  entity_id: string;
  period_id: string;
  metric_key: string;
  dimension: string;
  dimension2: string;
  value: number | null;
  note: string | null;
}

interface RecordDbRow {
  id: string;
  entity_id: string;
  period_id: string;
  record_type: string;
  label: string;
  category: string | null;
  value_num: number | null;
  value_num2: number | null;
  text_note: string | null;
  flag: boolean | null;
}

function toMetric(row: MetricDbRow): DetailMetricRow {
  return {
    entityId: row.entity_id as EntityId,
    periodId: row.period_id as PeriodId | MonthPeriodId,
    metricKey: row.metric_key,
    dimension: row.dimension,
    dimension2: row.dimension2,
    value: row.value,
    note: row.note,
  };
}

function toRecord(row: RecordDbRow): DetailRecordRow {
  return {
    id: row.id,
    entityId: row.entity_id as EntityId,
    periodId: row.period_id as PeriodId,
    recordType: row.record_type,
    label: row.label,
    category: row.category,
    valueNum: row.value_num,
    valueNum2: row.value_num2,
    textNote: row.text_note,
    flag: row.flag,
  };
}

/** All detail_metrics rows across every entity/period. PostgREST caps a single response at 1000
 * rows by default — this table crossed that threshold once Financial Position's line-item detail
 * was added, so a plain `.select("*")` silently truncated whichever rows sorted last. Page through
 * in fixed-size chunks until a short page confirms there's nothing left. */
export async function fetchDetailMetrics(): Promise<DetailMetricRow[]> {
  const pageSize = 1000;
  const rows: MetricDbRow[] = [];
  for (let from = 0; ; from += pageSize) {
    const { data, error } = await getSupabase().from("detail_metrics").select("*").range(from, from + pageSize - 1);
    if (error) throw error;
    rows.push(...(data as MetricDbRow[]));
    if (data.length < pageSize) break;
  }
  return rows.map(toMetric);
}

/** Same pagination guard as fetchDetailMetrics — this table is smaller today but grows the same way. */
export async function fetchDetailRecords(): Promise<DetailRecordRow[]> {
  const pageSize = 1000;
  const rows: RecordDbRow[] = [];
  for (let from = 0; ; from += pageSize) {
    const { data, error } = await getSupabase().from("detail_records").select("*").range(from, from + pageSize - 1);
    if (error) throw error;
    rows.push(...(data as RecordDbRow[]));
    if (data.length < pageSize) break;
  }
  return rows.map(toRecord);
}

export async function upsertDetailMetric(input: {
  entityId: EntityId;
  periodId: PeriodId | MonthPeriodId;
  metricKey: string;
  dimension: string;
  dimension2?: string;
  value: number | null;
  note?: string | null;
}): Promise<void> {
  const { error } = await getSupabase().from("detail_metrics").upsert({
    entity_id: input.entityId,
    period_id: input.periodId,
    metric_key: input.metricKey,
    dimension: input.dimension,
    dimension2: input.dimension2 ?? "",
    value: input.value,
    note: input.note ?? null,
    updated_at: new Date().toISOString(),
  });
  if (error) throw error;
}

export async function deleteDetailRecord(id: string): Promise<void> {
  const { error } = await getSupabase().from("detail_records").delete().eq("id", id);
  if (error) throw error;
}

export async function upsertDetailRecord(input: {
  id: string;
  entityId: EntityId;
  periodId: PeriodId;
  recordType: string;
  label: string;
  category?: string | null;
  valueNum?: number | null;
  valueNum2?: number | null;
  textNote?: string | null;
  flag?: boolean | null;
}): Promise<void> {
  const { error } = await getSupabase().from("detail_records").upsert({
    id: input.id,
    entity_id: input.entityId,
    period_id: input.periodId,
    record_type: input.recordType,
    label: input.label,
    category: input.category ?? null,
    value_num: input.valueNum ?? null,
    value_num2: input.valueNum2 ?? null,
    text_note: input.textNote ?? null,
    flag: input.flag ?? null,
    updated_at: new Date().toISOString(),
  });
  if (error) throw error;
}
