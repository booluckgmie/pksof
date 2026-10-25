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
  sheet: string;
}

export interface ParsedDetailMetric {
  metricKey: string;
  dimension: string;
  dimension2: string;
  periodId: PeriodId;
  /** A free-text narrative field (section_highlight, variance_commentary — see
   * TEMPLATE_FIELDS' valueKind: 'text') carries a string here instead of a number; every other
   * metric row is still a plain number, unchanged from before. */
  value: number | string;
  sheet: string;
}

export interface ParsedDetailRecordRow {
  recordType: string;
  label: string;
  category: string;
  /** Which column of the underlying detail_records row this cell writes — a record can need more
   * than one number (e.g. managed_entity_kpi's Rating + Weighted), so unlike a metric row a
   * record row's value doesn't always mean the same column. See DataEntry.tsx's submit step,
   * which groups rows back onto one record before writing so the columns not present in this
   * upload aren't clobbered. */
  recordField: "valueNum" | "valueNum2" | "textNote";
  periodId: PeriodId;
  value: number;
  sheet: string;
}

/** Why a piece of uploaded content didn't make it into kpiRows/metricRows/recordRows above —
 * every case this parser used to silently `continue` past with no trace at all now lands one of
 * these instead, so DataEntry.tsx can save it to the template_overflow_entries "customize table"
 * (migration 0021) rather than it just vanishing. `conflict` is additive: the value that wins
 * today (whichever row parses last) is unchanged — this only makes the fact that two different
 * values were typed for the same cell visible for the first time. */
export type OverflowReason = "unmatched_row" | "unmatched_column" | "non_numeric_value" | "conflict";

export interface ParsedOverflowRow {
  sheet: string;
  /** The raw column-header text for an unmatched_column row (label/sub are blank for that case);
   * the matched period's own label otherwise. Null only when no quarter column applies at all. */
  periodLabel: string | null;
  label: string;
  sub: string;
  rawValue: string;
  reason: OverflowReason;
  /** reason = 'conflict' only — the other value already seen for this same cell in this file. */
  conflictWith?: string;
}

export interface ParsedWorkbook {
  kpiRows: ParsedKpiRow[];
  metricRows: ParsedDetailMetric[];
  recordRows: ParsedDetailRecordRow[];
  /** Every reporting period that had at least one filled-in cell — Data Entry submits/saves
   * once per period found, not just the one selected in the UI. */
  periodsFound: PeriodId[];
  sheetsFound: string[];
  overflowRows: ParsedOverflowRow[];
}

function normalize(v: unknown): string {
  return String(v ?? "").trim();
}

/**
 * Parses the 3-pillar Excel data-entry template (Corporate Performance / Financial Health /
 * Resource & People sheets, one row per figure, one column per reporting quarter) generated for
 * this dashboard. Matches on header text and row (label, sub-category) pairs rather than fixed
 * cell positions, so column order or an extra note in a reviewer's copy doesn't break extraction.
 *
 * Nothing that doesn't match is lost without a trace: every row/column/cell this function can't
 * place is recorded on `overflowRows` instead of being silently skipped (see OverflowReason) —
 * DataEntry.tsx saves those to the template_overflow_entries "customize table" so an admin can
 * review a typo'd label, a client-added row, or a duplicated figure instead of it just vanishing.
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
  const overflowRows: ParsedOverflowRow[] = [];
  // Detects the same cell (sheet, label, sub, period) being typed twice in this one file with two
  // different values — a genuine conflict, as opposed to the same label legitimately recurring
  // across different quarter columns (not tracked here at all, since that's normal).
  const seenCells = new Map<string, string>();

  for (const sheetName of SHEET_NAMES) {
    const actualName = wb.SheetNames.find((n) => n.trim().toLowerCase() === sheetName.toLowerCase());
    if (!actualName) continue;
    const sheet = wb.Sheets[actualName];
    const grid = XLSX.utils.sheet_to_json(sheet, { header: 1, blankrows: false }) as unknown[][];

    const headerIdx = grid.findIndex((row) => normalize(row[0]).toLowerCase() === "metric");
    if (headerIdx === -1) continue;
    sheetsFound.push(sheetName);

    const header = grid[headerIdx];
    const noteCol = header.findIndex((c) => normalize(c).toLowerCase() === "note to checker");
    const remarkCol = header.findIndex((c) => normalize(c).toLowerCase() === "displayed on dashboard");
    // Columns 0/1 are Metric/Sub, the note and "Displayed on Dashboard" remark columns (if
    // present) are reference-only, not quarters — everything else is a quarter, matched against
    // periods.ts's own label text (e.g. "Q2 FY2025"). A header cell that matches neither of those
    // known non-quarter columns nor a real period is recorded as an unmatched_column overflow,
    // once per sheet.
    const quarterCols: { col: number; periodId: PeriodId; label: string }[] = [];
    for (let c = 2; c < header.length; c++) {
      if (c === noteCol || c === remarkCol) continue;
      const label = normalize(header[c]);
      if (!label) continue;
      const period = periods.find((p) => p.label === label);
      if (period) quarterCols.push({ col: c, periodId: period.id, label });
      else overflowRows.push({ sheet: sheetName, periodLabel: label, label: "", sub: "", rawValue: "", reason: "unmatched_column" });
    }

    for (const row of grid.slice(headerIdx + 1)) {
      const label = normalize(row[0]);
      const sub = normalize(row[1]) || "—";
      if (!label) continue;
      const field = FIELD_LOOKUP.get(`${sheetName}|${label}|${sub}`);

      if (!field) {
        // Section header or a row the template doesn't know — every populated cell on it is
        // captured rather than guessed at, so a client-added row or a typo'd label is reviewable
        // afterward instead of just gone.
        for (const { col, label: periodLabel } of quarterCols) {
          const raw = row[col];
          if (raw === undefined || raw === null || String(raw).trim() === "") continue;
          overflowRows.push({ sheet: sheetName, periodLabel, label, sub, rawValue: String(raw).trim(), reason: "unmatched_row" });
        }
        continue;
      }

      const note = noteCol !== -1 ? normalize(row[noteCol]) : "";
      const isTextField = field.dest === "metric" && field.valueKind === "text";

      for (const { col, periodId, label: periodLabel } of quarterCols) {
        const raw = row[col];
        if (raw === undefined || raw === null || String(raw).trim() === "") continue;
        const rawStr = String(raw).trim();

        const cellKey = `${sheetName}|${label}|${sub}|${periodId}`;
        const previous = seenCells.get(cellKey);
        if (previous !== undefined && previous !== rawStr) {
          overflowRows.push({ sheet: sheetName, periodLabel, label, sub, rawValue: rawStr, reason: "conflict", conflictWith: previous });
        }
        seenCells.set(cellKey, rawStr);

        if (isTextField) {
          periodsFound.add(periodId);
          metricRows.push({ metricKey: field.metricKey, dimension: field.dimension, dimension2: field.dimension2, periodId, value: rawStr, sheet: sheetName });
          continue;
        }

        const value = Number(raw);
        if (!Number.isFinite(value)) {
          overflowRows.push({ sheet: sheetName, periodLabel, label, sub, rawValue: rawStr, reason: "non_numeric_value" });
          continue;
        }

        periodsFound.add(periodId);
        if (field.dest === "kpi") {
          const no = Number(field.kpiId.replace("KPI", ""));
          kpiRows.push({ kpiId: field.kpiId, kpiNo: no, periodId, value, note, sheet: sheetName });
        } else if (field.dest === "metric") {
          metricRows.push({ metricKey: field.metricKey, dimension: field.dimension, dimension2: field.dimension2, periodId, value, sheet: sheetName });
        } else {
          recordRows.push({ recordType: field.recordType, label: field.recordLabel, category: sub === "—" ? "" : sub, recordField: field.recordField, periodId, value, sheet: sheetName });
        }
      }
    }
  }

  return { kpiRows, metricRows, recordRows, periodsFound: [...periodsFound], sheetsFound, overflowRows };
}
