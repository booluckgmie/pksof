import { TEMPLATE_FIELDS } from "@/lib/templateFields.generated";
import { MODULE_LABEL } from "@/lib/modules";
import { periodById } from "@/data/periods";
import type { DetailRecordRow } from "@/lib/api/details";
import type { EntityId, Module, PeriodId } from "@/types";

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

/** What downloadPillarTemplate needs to pre-fill each row with its current live value — passed
 * in rather than fetched here so the download reuses whatever's already loaded in the app (no
 * extra network round-trip) and stays in sync with whatever the dashboards themselves show. */
export interface TemplateValueLookup {
  entityId: EntityId;
  getMetricValue: (periodId: PeriodId, metricKey: string, dimension: string, dimension2?: string) => number | null;
  records: DetailRecordRow[];
  latestValue: (kpiId: string, entityId: EntityId, periodId: PeriodId) => { ytdActual: number | null };
}

function currentValueFor(field: (typeof TEMPLATE_FIELDS)[number], periodId: PeriodId, lookup: TemplateValueLookup): number | null {
  if (field.dest === "kpi") {
    return lookup.latestValue(field.kpiId, lookup.entityId, periodId).ytdActual;
  }
  if (field.dest === "metric") {
    return lookup.getMetricValue(periodId, field.metricKey, field.dimension, field.dimension2);
  }
  const category = field.sub === "—" ? "" : field.sub;
  const row = lookup.records.find(
    (r) => r.entityId === lookup.entityId && r.periodId === periodId && r.recordType === field.recordType && r.label === field.recordLabel && (r.category ?? "") === category
  );
  if (!row) return null;
  if (field.recordField === "valueNum") return row.valueNum;
  if (field.recordField === "valueNum2") return row.valueNum2;
  const n = row.textNote ? Number(row.textNote) : NaN;
  return Number.isFinite(n) ? n : null;
}

/**
 * Builds this quarter's data-entry template for one pillar, straight from TEMPLATE_FIELDS
 * (src/lib/templateFields.generated.ts) — the exact same manifest excelTemplate.ts's parser
 * reads back, so a downloaded template can never drift out of sync with what re-uploading it
 * will recognize. Every row is pre-filled with its current live value (where one already exists)
 * so a reporting officer is correcting/updating this quarter's real figures, not starting from a
 * blank sheet — the "Displayed on Dashboard" column names exactly where each figure renders,
 * same as the reference workbook this mirrors. Triggers a browser download; there's no server
 * round-trip and nothing to keep a local copy of between quarters — this one button always
 * reflects the current data structure, the current reporting period, and today's figures.
 */
export async function downloadPillarTemplate(module: Module, periodId: PeriodId, lookup: TemplateValueLookup): Promise<void> {
  const XLSX = await import("xlsx");
  const sheetName = MODULE_LABEL[module];
  const period = periodById(periodId);
  const fields = TEMPLATE_FIELDS.filter((f) => f.sheet === sheetName);

  const rows: (string | number | null)[][] = [
    [`${sheetName} — ${period.label}`, null, null, null, null],
    [null, null, null, null, null],
    ["Metric", "Sub / Category", period.label, "Displayed on Dashboard", "Note to checker"],
  ];
  let lastGroup = "";
  for (const f of fields) {
    const group = groupKey(f);
    if (group !== lastGroup) {
      if (lastGroup) rows.push([null, null, null, null, null]);
      rows.push([group.toUpperCase(), null, null, null, null]);
    }
    lastGroup = group;
    rows.push([f.label, f.sub, currentValueFor(f, periodId, lookup), f.screen, null]);
  }

  const wb = XLSX.utils.book_new();
  const instructions = XLSX.utils.aoa_to_sheet([
    [`${sheetName} — Data Entry Template · ${period.label}`],
    [""],
    ["Every row is pre-filled with its current figure for this quarter, where one is already on"],
    ["file — correct or complete it rather than re-typing from scratch. Leave a cell blank if it"],
    ["genuinely wasn't measured this quarter (e.g. an annual KPI outside Q4) rather than entering"],
    ["a placeholder."],
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
  ws["!cols"] = [{ wch: 60 }, { wch: 22 }, { wch: 16 }, { wch: 45 }, { wch: 30 }];
  XLSX.utils.book_append_sheet(wb, ws, sheetName);

  XLSX.writeFile(wb, `pksof_data_entry_${periodId}_${PILLAR_SLUG[module]}.xlsx`);
}
