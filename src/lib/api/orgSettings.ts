import { getSupabase } from "@/lib/supabase";

interface OrgSettingsRow {
  fiscal_year_end_month: number;
}

/** Single row (id=1) — see supabase/migrations/0005_org_settings.sql. */
export async function fetchFiscalYearEndMonth(): Promise<number> {
  const { data, error } = await getSupabase().from("org_settings").select("fiscal_year_end_month").eq("id", 1).single();
  if (error) throw error;
  return (data as OrgSettingsRow).fiscal_year_end_month;
}

export async function updateFiscalYearEndMonth(month: number, updatedBy: string): Promise<void> {
  const { error } = await getSupabase()
    .from("org_settings")
    .update({ fiscal_year_end_month: month, updated_at: new Date().toISOString(), updated_by: updatedBy })
    .eq("id", 1);
  if (error) throw error;
}
