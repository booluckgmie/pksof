// Replaces src/lib/api/facts.ts — same signatures, calls server/src/routes/facts.ts.
import { apiFetch } from "@/lib/apiClient";
import type { EntityId, FactKpiResultSeed, KpiStatus, PeriodId } from "@/types";

interface FactRow {
  kpi_id: string; entity_id: string; period_id: string; ytd_target: number | null; ytd_actual: number | null;
  status: KpiStatus; note: string | null;
}

const toFactSeed = (r: FactRow): FactKpiResultSeed => ({
  kpiId: r.kpi_id, entityId: r.entity_id as EntityId, periodId: r.period_id as PeriodId,
  ytdTarget: r.ytd_target, ytdActual: r.ytd_actual, status: r.status, note: r.note ?? undefined,
});

export async function fetchFactResults(): Promise<FactKpiResultSeed[]> {
  return (await apiFetch<FactRow[]>("/facts")).map(toFactSeed);
}

export async function upsertFactResult(input: {
  kpiId: string; entityId: EntityId; periodId: PeriodId; ytdActual: number; ytdTarget: number | null; status: KpiStatus;
}): Promise<void> {
  await apiFetch("/facts", { method: "PUT", body: input });
}
