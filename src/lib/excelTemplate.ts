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

export interface ParsedDetailMetric {
  metricKey: string;
  dimension: string;
  dimension2: string;
  value: number;
  note: string;
}

export interface ParsedDetailTemplate {
  rows: ParsedDetailMetric[];
  sheetsFound: string[];
}

const WORKFORCE_SUMMARY_MAP: Record<string, { metricKey: string; dimension: string }> = {
  "total employees": { metricKey: "headcount_summary", dimension: "total_employees" },
  "bumiputera": { metricKey: "headcount_summary", dimension: "bumiputera" },
  "non-bumiputera": { metricKey: "headcount_summary", dimension: "non_bumiputera" },
  "approved headcount": { metricKey: "headcount_summary", dimension: "approved_headcount" },
  "filled position": { metricKey: "headcount_summary", dimension: "filled_position" },
  "male": { metricKey: "gender_breakdown", dimension: "male" },
  "female": { metricKey: "gender_breakdown", dimension: "female" },
};

const FINANCIAL_TREND_MAP: Record<string, { metricKey: string; dimension: string }> = {
  "revenue (rm mil)": { metricKey: "financial_trend", dimension: "revenue" },
  "profit before tax (rm mil)": { metricKey: "financial_trend", dimension: "pbt" },
  "cost-to-income ratio (%)": { metricKey: "financial_trend", dimension: "cir" },
  "net profit margin (%)": { metricKey: "financial_trend", dimension: "net_margin" },
};

/**
 * Parses the "Workforce Summary", "Financial Trend" and "All Other Detail Data" tabs of the
 * standard template — all three are optional, and any subset present in the uploaded file is
 * read. "All Other Detail Data" is a direct pass-through of the database's own
 * metric_key/dimension/dimension2/value/note shape (see supabase/migrations/0003), for the
 * datasets (age/grade/department breakdowns, recruitment index, balance sheet, etc.) that don't
 * have a dedicated friendly sheet.
 */
export async function parseDetailTemplate(file: File): Promise<ParsedDetailTemplate> {
  const XLSX = await import("xlsx");
  const buf = await file.arrayBuffer();
  const wb = XLSX.read(buf, { type: "array" });
  const rows: ParsedDetailMetric[] = [];
  const sheetsFound: string[] = [];

  const findSheet = (pattern: RegExp) => {
    const name = wb.SheetNames.find((n) => pattern.test(n));
    return name ? wb.Sheets[name] : null;
  };
  const gridOf = (sheet: NonNullable<ReturnType<typeof findSheet>>) =>
    XLSX.utils.sheet_to_json(sheet, { header: 1, blankrows: false }) as unknown[][];

  const readLabelValueSheet = (sheetPattern: RegExp, labelMap: Record<string, { metricKey: string; dimension: string }>, sheetLabel: string) => {
    const sheet = findSheet(sheetPattern);
    if (!sheet) return;
    sheetsFound.push(sheetLabel);
    const grid = gridOf(sheet);
    const headerIdx = grid.findIndex((row) => row.some((c) => String(c).trim().toLowerCase() === "metric"));
    if (headerIdx === -1) return;
    const header = grid[headerIdx].map((c) => String(c).trim().toLowerCase());
    const cMetric = header.indexOf("metric");
    const cValue = header.indexOf("value");
    if (cMetric === -1 || cValue === -1) return;
    for (const row of grid.slice(headerIdx + 1)) {
      const label = String(row[cMetric] ?? "").trim().toLowerCase();
      const mapped = labelMap[label];
      if (!mapped) continue;
      const raw = row[cValue];
      if (raw === undefined || raw === null || String(raw).trim() === "") continue;
      const value = Number(raw);
      if (!Number.isFinite(value)) continue;
      rows.push({ metricKey: mapped.metricKey, dimension: mapped.dimension, dimension2: "", value, note: "" });
    }
  };

  readLabelValueSheet(/workforce summary/i, WORKFORCE_SUMMARY_MAP, "Workforce Summary");
  readLabelValueSheet(/financial trend/i, FINANCIAL_TREND_MAP, "Financial Trend");

  const advancedSheet = findSheet(/all other detail|advanced/i);
  if (advancedSheet) {
    sheetsFound.push("All Other Detail Data");
    const grid = gridOf(advancedSheet);
    const headerIdx = grid.findIndex((row) => row.some((c) => String(c).trim().toLowerCase() === "metric key"));
    if (headerIdx !== -1) {
      const header = grid[headerIdx].map((c) => String(c).trim().toLowerCase());
      const cKey = header.indexOf("metric key");
      const cDim = header.indexOf("dimension");
      const cDim2 = header.indexOf("dimension 2");
      const cVal = header.indexOf("value");
      const cNote = header.indexOf("note");
      if (cKey !== -1 && cDim !== -1 && cVal !== -1) {
        for (const row of grid.slice(headerIdx + 1)) {
          const metricKey = String(row[cKey] ?? "").trim();
          const dimension = String(row[cDim] ?? "").trim();
          if (!metricKey || !dimension) continue;
          const raw = row[cVal];
          if (raw === undefined || raw === null || String(raw).trim() === "") continue;
          const value = Number(raw);
          if (!Number.isFinite(value)) continue;
          const dimension2 = cDim2 !== -1 ? String(row[cDim2] ?? "").trim() : "";
          const note = cNote !== -1 ? String(row[cNote] ?? "").trim() : "";
          rows.push({ metricKey, dimension, dimension2, value, note });
        }
      }
    }
  }

  return { rows, sheetsFound };
}
