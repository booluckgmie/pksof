// Replaces src/lib/api/orgSettings.ts — same signatures, calls server/src/routes/orgSettings.ts.
import { apiFetch } from "@/lib/apiClient";

export async function fetchFiscalYearEndMonth(): Promise<number> {
  const data = await apiFetch<{ fiscal_year_end_month: number }>("/org-settings");
  return data.fiscal_year_end_month;
}

export async function updateFiscalYearEndMonth(month: number, updatedBy: string): Promise<void> {
  await apiFetch("/org-settings", { method: "PUT", body: { fiscalYearEndMonth: month, updatedBy } });
}
