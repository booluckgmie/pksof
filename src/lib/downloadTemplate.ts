import type ExcelJS from "exceljs";
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

// Same palette/layout constants as scripts/generate_data_entry_template.py's build_workbook() —
// this is a from-scratch port of that same look into the browser (openpyxl isn't available
// client-side), kept in step by eye since the two can't share code across Python/TypeScript.
const NAVY = "FF16324A";
const ACCENT = "FF0E8F5C";
const LIGHT = "FFEAF3EF";
const WHITE = "FFFFFFFF";
const BODY = "FF333333";
const VALUE_TEXT = "FF1B4D3E";
const VALUE_FILL = "FFFBFDFC";
const REMARK_TEXT = "FF6B7B76";
const BORDER_COLOR = "FFD9E2E8";
const THIN_BOTTOM = { bottom: { style: "thin" as const, color: { argb: BORDER_COLOR } } };

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

async function styleInstructions(ws: ExcelJS.Worksheet, lines: { text: string; size: number; bold: boolean; color: string }[]) {
  ws.views = [{ showGridLines: false }];
  ws.getColumn(1).width = 100;
  lines.forEach((line, i) => {
    const cell = ws.getCell(i + 1, 1);
    cell.value = line.text;
    cell.font = { name: "Calibri", size: line.size, bold: line.bold, color: { argb: line.color } };
    cell.alignment = { wrapText: true, vertical: "top" };
  });
  await ws.protect("", {});
}

/**
 * Builds this quarter's data-entry template for one pillar, straight from TEMPLATE_FIELDS
 * (src/lib/templateFields.generated.ts) — the exact same manifest excelTemplate.ts's parser
 * reads back, so a downloaded template can never drift out of sync with what re-uploading it
 * will recognize. Every row is pre-filled with its current live value (where one already exists)
 * so a reporting officer is correcting/updating this quarter's real figures, not starting from a
 * blank sheet — the "Displayed on Dashboard" column names exactly where each figure renders.
 * Styled and protected to match the reference workbook exactly (navy header, section bands,
 * locked cells everywhere except the value column and the KPI rows' note column) — there's no
 * server round-trip and nothing to keep a local copy of between quarters, so this one button
 * always reflects the current data structure, the current reporting period, and today's figures.
 */
export async function downloadPillarTemplate(module: Module, periodId: PeriodId, lookup: TemplateValueLookup): Promise<void> {
  const sheetName = MODULE_LABEL[module];
  const period = periodById(periodId);
  const fields = TEMPLATE_FIELDS.filter((f) => f.sheet === sheetName);

  const { default: ExcelJSLib } = await import("exceljs");
  const wb = new ExcelJSLib.Workbook();

  const instructions = wb.addWorksheet("Instructions");
  await styleInstructions(instructions, [
    { text: `${sheetName} — Data Entry Template · ${period.label}`, size: 16, bold: true, color: NAVY },
    { text: "", size: 11, bold: false, color: BODY },
    { text: `One sheet, scoped to this dashboard pillar only: ${sheetName}.`, size: 11, bold: false, color: BODY },
    { text: `Each row is one figure the dashboard displays, for this one reporting period: ${period.label}.`, size: 11, bold: false, color: BODY },
    { text: "", size: 11, bold: false, color: BODY },
    { text: "HOW TO USE", size: 12, bold: true, color: NAVY },
    { text: "1. Every row is pre-filled with its current figure for this quarter, where one is already on file — correct or complete it rather than re-typing from scratch.", size: 11, bold: false, color: BODY },
    { text: "2. Leave a cell blank if that figure genuinely wasn't measured this quarter (e.g. an annual KPI outside Q4) rather than entering a placeholder.", size: 11, bold: false, color: BODY },
    { text: "3. Upload this file from Data Entry — the quarter it writes to is read from the column header, not a dropdown.", size: 11, bold: false, color: BODY },
    { text: "4. The KPI Scorecard section (Corporate Performance sheet only) routes through the checker queue; every other row saves directly.", size: 11, bold: false, color: BODY },
    { text: "", size: 11, bold: false, color: BODY },
    { text: "SHEET IS PROTECTED", size: 12, bold: true, color: NAVY },
    { text: "Row labels, sub-categories, headers and the reference remark column are locked so they can't be renamed or reordered by accident. Only the value column (and the note column on KPI rows) accepts edits. Preparers who genuinely need to change the sheet layout can turn this off from Excel's Review → Unprotect Sheet menu — no password is set.", size: 11, bold: false, color: BODY },
    { text: "", size: 11, bold: false, color: BODY },
    { text: "NOT COVERED HERE", size: 12, bold: true, color: NAVY },
    { text: "Initiative lists (Process/Tech Initiatives, People Development Programme) stay entered directly in-app — each row is a name, a date range and a status, not one number per quarter.", size: 11, bold: false, color: BODY },
    { text: "For Managed Entities KPI Detail and Governance KPI Detail, only the scored figures (Rating/Weighted) are here — the item catalog and its FY/YTD Target and YTD Actual wording (a mix of %, ratings and counts, not a uniform number) stay entered directly in-app on CP004.", size: 11, bold: false, color: BODY },
    { text: "The Variance Commentary notes (PFH003) are also entered directly in-app — a commentary sentence per line, not a number.", size: 11, bold: false, color: BODY },
    { text: "", size: 11, bold: false, color: BODY },
    { text: "No conditional formatting or colour-coded cells are used anywhere in this workbook — every figure is a plain number; status colours on the dashboard itself are computed from the value, not carried in the file.", size: 11, bold: false, color: BODY },
  ]);

  const ws = wb.addWorksheet(sheetName, {
    views: [{ showGridLines: false, state: "frozen", xSplit: 2, ySplit: 3 }],
  });

  ws.mergeCells("A1:E1");
  const title = ws.getCell("A1");
  title.value = `${sheetName} — ${period.label}`;
  title.font = { name: "Calibri", size: 14, bold: true, color: { argb: NAVY } };

  const headerRow = 3;
  const headers = ["Metric", "Sub / Category", period.label, "Displayed on Dashboard", "Note to checker"];
  headers.forEach((h, i) => {
    const cell = ws.getCell(headerRow, i + 1);
    cell.value = h;
    cell.font = { name: "Calibri", size: 10, bold: true, color: { argb: WHITE } };
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: NAVY } };
    cell.alignment = { horizontal: i > 1 ? "center" : "left", vertical: "middle", wrapText: true };
  });
  ws.getRow(headerRow).height = 30;

  let lastGroup = "";
  let r = headerRow + 1;
  for (const f of fields) {
    const group = groupKey(f);
    if (group !== lastGroup) {
      ws.mergeCells(`A${r}:E${r}`);
      const sectionCell = ws.getCell(r, 1);
      sectionCell.value = group.toUpperCase();
      sectionCell.font = { name: "Calibri", size: 10.5, bold: true, color: { argb: ACCENT } };
      sectionCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: LIGHT } };
      r++;
    }
    lastGroup = group;

    const isKpiRow = f.dest === "kpi";
    const labelCell = ws.getCell(r, 1);
    labelCell.value = f.label;
    labelCell.font = { name: "Calibri", size: 10, bold: isKpiRow };
    ws.getCell(r, 2).value = f.sub;

    const value = currentValueFor(f, periodId, lookup);
    const valueCell = ws.getCell(r, 3);
    valueCell.value = value;
    valueCell.font = { name: "Calibri", size: 10, color: { argb: VALUE_TEXT } };
    valueCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: VALUE_FILL } };
    valueCell.numFmt = value !== null && !Number.isInteger(value) ? "#,##0.00" : "#,##0";
    valueCell.alignment = { horizontal: "right" };
    valueCell.protection = { locked: false };

    const remarkCell = ws.getCell(r, 4);
    remarkCell.value = f.screen;
    remarkCell.font = { name: "Calibri", size: 8.5, italic: true, color: { argb: REMARK_TEXT } };
    remarkCell.alignment = { wrapText: true, vertical: "middle" };

    const noteCell = ws.getCell(r, 5);
    noteCell.protection = { locked: !isKpiRow };

    for (const col of [1, 2, 3, 4, 5]) {
      ws.getCell(r, col).border = THIN_BOTTOM;
    }
    r++;
  }

  ws.getColumn(1).width = 44;
  ws.getColumn(2).width = 16;
  ws.getColumn(3).width = 14;
  ws.getColumn(4).width = 38;
  ws.getColumn(5).width = 26;

  await ws.protect("", {
    selectLockedCells: false,
    selectUnlockedCells: false,
    formatCells: false,
    formatColumns: false,
    formatRows: false,
    insertColumns: false,
    insertRows: false,
    insertHyperlinks: false,
    deleteColumns: false,
    deleteRows: false,
    sort: false,
    autoFilter: false,
  });

  const buffer = await wb.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `pksof_data_entry_${periodId}_${PILLAR_SLUG[module]}.xlsx`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
