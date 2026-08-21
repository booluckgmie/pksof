import { getSupabase } from "@/lib/supabase";

export interface KpiFyTargetRow {
  kpiId: string;
  fy: string;
  fyTarget: number;
}

interface DbRow {
  kpi_id: string;
  fy: string;
  fy_target: number;
}

/** All FY-target overrides across every KPI/FY — small table, fetched in full like org_settings. */
export async function fetchKpiFyTargets(): Promise<KpiFyTargetRow[]> {
  const { data, error } = await getSupabase().from("kpi_fy_targets").select("*");
  if (error) throw error;
  return (data as DbRow[]).map((r) => ({ kpiId: r.kpi_id, fy: r.fy, fyTarget: r.fy_target }));
}

export async function upsertKpiFyTarget(input: { kpiId: string; fy: string; fyTarget: number; updatedBy: string }): Promise<void> {
  const { error } = await getSupabase().from("kpi_fy_targets").upsert({
    kpi_id: input.kpiId,
    fy: input.fy,
    fy_target: input.fyTarget,
    updated_at: new Date().toISOString(),
    updated_by: input.updatedBy,
  });
  if (error) throw error;
}
