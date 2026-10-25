// Replaces src/lib/api/kpiTargets.ts — same signatures, calls server/src/routes/kpiTargets.ts.
import { apiFetch } from "@/lib/apiClient";

export interface KpiFyTargetRow {
  kpiId: string; fy: string; fyTarget: number;
}
interface DbRow { kpi_id: string; fy: string; fy_target: number }

export async function fetchKpiFyTargets(): Promise<KpiFyTargetRow[]> {
  const rows = await apiFetch<DbRow[]>("/kpi-targets");
  return rows.map((r) => ({ kpiId: r.kpi_id, fy: r.fy, fyTarget: r.fy_target }));
}

export async function upsertKpiFyTarget(input: { kpiId: string; fy: string; fyTarget: number; updatedBy: string }): Promise<void> {
  await apiFetch("/kpi-targets", { method: "PUT", body: input });
}
