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

/** All detail_metrics rows across every entity/period — small table, fetched in full like fact_kpi_results. */
export async function fetchDetailMetrics(): Promise<DetailMetricRow[]> {
  const { data, error } = await getSupabase().from("detail_metrics").select("*");
  if (error) throw error;
  return (data as MetricDbRow[]).map(toMetric);
}

export async function fetchDetailRecords(): Promise<DetailRecordRow[]> {
  const { data, error } = await getSupabase().from("detail_records").select("*");
  if (error) throw error;
  return (data as RecordDbRow[]).map(toRecord);
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
