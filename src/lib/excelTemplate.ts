import { periods } from "@/data/periods";
import { TEMPLATE_FIELDS } from "@/lib/templateFields.generated";
import type { PeriodId } from "@/types";

const SHEET_NAMES = ["Corporate Performance", "Financial Health", "Resource & People"] as const;

/** One lookup entry per (sheet, label, sub) triple in the template — built once from the
 * generated manifest (see src/lib/templateFields.generated.ts) so a row's exact wording
 * always resolves to the same metricKey/dimension the display layer (details.tsx) reads. */
const FIELD_LOOKUP = new Map(TEMPLATE_FIELDS.map((f) => [`${f.sheet}|${f.label}|${f.sub}`, f]));

export interface ParsedKpiRow {
  kpiId: string;
  kpiNo: number;
  periodId: PeriodId;
  value: number;
  note: string;
}

export interface ParsedDetailMetric {
  metricKey: string;
  dimension: string;
  dimension2: string;
  periodId: PeriodId;
  value: number;
}

export interface ParsedDetailRecordRow {
  recordType: string;
  label: string;
  category: string;
  periodId: PeriodId;
  value: number;
}

export interface ParsedWorkbook {
  kpiRows: ParsedKpiRow[];
  metricRows: ParsedDetailMetric[];
  recordRows: ParsedDetailRecordRow[];
  /** Every reporting period that had at least one filled-in cell — Data Entry submits/saves
   * once per period found, not just the one selected in the UI. */
  periodsFound: PeriodId[];
  sheetsFound: string[];
}

function normalize(v: unknown): string {
  return String(v ?? "").trim();
}

/**
 * Parses the 3-pillar Excel data-entry template (Corporate Performance / Financial Health /
 * Resource & People sheets, one row per figure, one column per reporting quarter) generated for
 * this dashboard. Matches on header text and row (label, sub-category) pairs rather than fixed
 * cell positions, so column order or an extra note in a reviewer's copy doesn't break extraction.
 */
export async function parseWorkbook(file: File): Promise<ParsedWorkbook> {
  const XLSX = await import("xlsx");
  const buf = await file.arrayBuffer();
  const wb = XLSX.read(buf, { type: "array" });

  const kpiRows: ParsedKpiRow[] = [];
  const metricRows: ParsedDetailMetric[] = [];
  const recordRows: ParsedDetailRecordRow[] = [];
  const periodsFound = new Set<PeriodId>();
  const sheetsFound: string[] = [];

  for (const sheetName of SHEET_NAMES) {
    const actualName = wb.SheetNames.find((n) => n.trim().toLowerCase() === sheetName.toLowerCase());
    if (!actualName) continue;
    const sheet = wb.Sheets[actualName];
    const grid = XLSX.utils.sheet_to_json(sheet, { header: 1, blankrows: false }) as unknown[][];

    const headerIdx = grid.findIndex((row) => normalize(row[0]).toLowerCase() === "metric");
    if (headerIdx === -1) continue;
    sheetsFound.push(sheetName);

    const header = grid[headerIdx];
    // Columns 0/1 are Metric/Sub, the last column (if present) is the checker note — everything
    // in between is a quarter, matched against periods.ts's own label text (e.g. "Q2 FY2025").
    const quarterCols: { col: number; periodId: PeriodId }[] = [];
    for (let c = 2; c < header.length; c++) {
      const label = normalize(header[c]);
      const period = periods.find((p) => p.label === label);
      if (period) quarterCols.push({ col: c, periodId: period.id });
    }
    const noteCol = header.findIndex((c) => normalize(c).toLowerCase() === "note to checker");

    for (const row of grid.slice(headerIdx + 1)) {
      const label = normalize(row[0]);
      const sub = normalize(row[1]) || "—";
      if (!label) continue;
      const field = FIELD_LOOKUP.get(`${sheetName}|${label}|${sub}`);
      if (!field) continue; // section header or a row the template doesn't know — skip, don't guess

      const note = noteCol !== -1 ? normalize(row[noteCol]) : "";

      for (const { col, periodId } of quarterCols) {
        const raw = row[col];
        if (raw === undefined || raw === null || String(raw).trim() === "") continue;
        const value = Number(raw);
        if (!Number.isFinite(value)) continue;

        periodsFound.add(periodId);
        if (field.dest === "kpi") {
          const no = Number(field.kpiId.replace("KPI", ""));
          kpiRows.push({ kpiId: field.kpiId, kpiNo: no, periodId, value, note });
        } else if (field.dest === "metric") {
          metricRows.push({ metricKey: field.metricKey, dimension: field.dimension, dimension2: field.dimension2, periodId, value });
        } else {
          recordRows.push({ recordType: field.recordType, label: field.recordLabel, category: sub === "—" ? "" : sub, periodId, value });
        }
      }
    }
  }

  return { kpiRows, metricRows, recordRows, periodsFound: [...periodsFound], sheetsFound };
}
