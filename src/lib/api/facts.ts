import { getSupabase } from "@/lib/supabase";
import type { EntityId, FactKpiResultSeed, KpiStatus, PeriodId } from "@/types";

interface FactRow {
  kpi_id: string;
  entity_id: string;
  period_id: string;
  ytd_target: number | null;
  ytd_actual: number | null;
  status: KpiStatus;
  note: string | null;
}

function toFactSeed(row: FactRow): FactKpiResultSeed {
  return {
    kpiId: row.kpi_id,
    entityId: row.entity_id as EntityId,
    periodId: row.period_id as PeriodId,
    ytdTarget: row.ytd_target,
    ytdActual: row.ytd_actual,
    status: row.status,
    note: row.note ?? undefined,
  };
}

/** All published KPI facts across every entity/period — small table, fetched in full like the old static factSeed array. */
export async function fetchFactResults(): Promise<FactKpiResultSeed[]> {
  const { data, error } = await getSupabase().from("fact_kpi_results").select("*");
  if (error) throw error;
  return (data as FactRow[]).map(toFactSeed);
}

/** Publishing a submission also upserts the fact row it supersedes, so latestValue() stays correct after a page reload. */
export async function upsertFactResult(input: {
  kpiId: string;
  entityId: EntityId;
  periodId: PeriodId;
  ytdActual: number;
  ytdTarget: number | null;
  status: KpiStatus;
}): Promise<void> {
  const { error } = await getSupabase().from("fact_kpi_results").upsert({
    kpi_id: input.kpiId,
    entity_id: input.entityId,
    period_id: input.periodId,
    ytd_actual: input.ytdActual,
    ytd_target: input.ytdTarget,
    status: input.status,
    updated_at: new Date().toISOString(),
  });
  if (error) throw error;
}
