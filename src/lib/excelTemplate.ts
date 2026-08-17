import { kpis } from "@/data/kpis";

export interface ParsedKpiRow {
  kpiId: string;
  kpiNo: number;
  value: number;
  note: string;
}

export interface ParsedTemplate {
  rows: ParsedKpiRow[];
  /** Rows that matched a known KPI but had no YTD Actual value — expected for KPIs not due this period. */
  skippedNoValue: number;
}

/**
 * Parses the "KPI Submission" tab of the standard Data Entry Excel template — matches on
 * header text ("KPI No", "YTD Actual", "Note to checker") rather than fixed cell positions,
 * so row order or extra columns in a reviewer's copy don't break extraction.
 */
export async function parseKpiTemplate(file: File): Promise<ParsedTemplate> {
  const XLSX = await import("xlsx");
  const buf = await file.arrayBuffer();
  const wb = XLSX.read(buf, { type: "array" });
  const sheetName = wb.SheetNames.find((n) => /kpi submission/i.test(n)) ?? wb.SheetNames[wb.SheetNames.length - 1];
  const sheet = wb.Sheets[sheetName];
  if (!sheet) throw new Error("Couldn't find a sheet to read in this workbook.");

  const grid = XLSX.utils.sheet_to_json(sheet, { header: 1, blankrows: false }) as unknown[][];
  const headerIdx = grid.findIndex((row) => row.some((c) => String(c).trim().toLowerCase() === "kpi no"));
  if (headerIdx === -1) {
    throw new Error('Could not find a header row with "KPI No" — is this the standard KPI Submission template?');
  }
  const header = grid[headerIdx].map((c) => String(c).trim().toLowerCase());
  const col = (name: string) => header.indexOf(name);
  const cNo = col("kpi no");
  const cActual = col("ytd actual");
  const cNote = col("note to checker");
  if (cNo === -1 || cActual === -1) {
    throw new Error('Template is missing the "KPI No" or "YTD Actual" column.');
  }

  const rows: ParsedKpiRow[] = [];
  let skippedNoValue = 0;

  for (const row of grid.slice(headerIdx + 1)) {
    const no = Number(row[cNo]);
    if (!Number.isFinite(no)) continue;
    const kpi = kpis.find((k) => k.no === no);
    if (!kpi) continue;

    const raw = row[cActual];
    if (raw === undefined || raw === null || String(raw).trim() === "") {
      skippedNoValue++;
      continue;
    }
    const value = Number(raw);
    if (!Number.isFinite(value)) {
      skippedNoValue++;
      continue;
    }
    const note = cNote !== -1 ? String(row[cNote] ?? "").trim() : "";
    rows.push({ kpiId: kpi.id, kpiNo: no, value, note });
  }

  return { rows, skippedNoValue };
}
