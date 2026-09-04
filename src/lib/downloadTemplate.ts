import { TEMPLATE_FIELDS } from "@/lib/templateFields.generated";
import { MODULE_LABEL } from "@/lib/modules";
import { periodById } from "@/data/periods";
import type { Module, PeriodId } from "@/types";

const PILLAR_SLUG: Record<Module, string> = {
  CP: "corporate_performance",
  FH: "financial_health",
  RP: "resource_people",
};

function groupKey(field: (typeof TEMPLATE_FIELDS)[number]): string {
  if (field.dest === "kpi") return "KPI Scorecard";
  if (field.dest === "metric") return field.metricKey.replace(/_/g, " ");
  return field.recordType.replace(/_/g, " ");
}

/**
 * Builds a blank data-entry template for one pillar, headed with the given quarter, straight
 * from TEMPLATE_FIELDS (src/lib/templateFields.generated.ts) — the exact same manifest
 * excelTemplate.ts's parser reads back, so a downloaded template can never drift out of sync
 * with what re-uploading it will recognize. Triggers a browser download; there's no server
 * round-trip and nothing for a reporting officer to keep a local copy of between quarters — this
 * one button always reflects the current data structure and the current reporting period.
 */
export async function downloadPillarTemplate(module: Module, periodId: PeriodId): Promise<void> {
  const XLSX = await import("xlsx");
  const sheetName = MODULE_LABEL[module];
  const period = periodById(periodId);
  const fields = TEMPLATE_FIELDS.filter((f) => f.sheet === sheetName);

  const rows: (string | null)[][] = [["Metric", "Sub / Category", period.label, "Note to checker"]];
  let lastGroup = "";
  for (const f of fields) {
    const group = groupKey(f);
    if (group !== lastGroup) {
      if (lastGroup) rows.push([null, null, null, null]);
      rows.push([group.toUpperCase(), null, null, null]);
    }
    lastGroup = group;
    rows.push([f.label, f.sub, null, null]);
  }

  const wb = XLSX.utils.book_new();
  const instructions = XLSX.utils.aoa_to_sheet([
    [`${sheetName} — Data Entry Template · ${period.label}`],
    [""],
    ["Fill in the value column with this quarter's figures. Leave a row blank if it genuinely"],
    ["wasn't measured this quarter (e.g. an annual KPI outside Q4) rather than entering a"],
    ["placeholder."],
    [""],
    ["Upload this file from Data Entry — the quarter it writes to is read from the column header,"],
    ["not a dropdown, so don't rename that header."],
    [""],
    ["No conditional formatting or colour-coded cells are used here — every figure is a plain"],
    ["number; status colours on the dashboard itself are computed from the value, not carried in"],
    ["the file."],
  ]);
  instructions["!cols"] = [{ wch: 90 }];
  XLSX.utils.book_append_sheet(wb, instructions, "Instructions");

  const ws = XLSX.utils.aoa_to_sheet(rows);
  ws["!cols"] = [{ wch: 60 }, { wch: 22 }, { wch: 16 }, { wch: 30 }];
  XLSX.utils.book_append_sheet(wb, ws, sheetName);

  XLSX.writeFile(wb, `pksof_data_entry_${periodId}_${PILLAR_SLUG[module]}.xlsx`);
}
