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
 * Revenue-by-source, expense-by-category, admin/personnel expense line items, P&L items below
 * PBT, balance sheet line-item detail, and receivables aging — everything identified as missing
 * against the client's own Q1 2026 MEC report deck that's a single-value-per-period figure (the
 * deposit/placement schedule and named-client receivables aging are multi-row datasets that need
 * a different entry mechanism, not covered here). Same metricKey/dimension pairs used throughout
 * src/lib/details.tsx's reshaping functions.
 */
const FINANCIAL_DETAIL_MAP: Record<string, { metricKey: string; dimension: string }> = {
  "management fee — danaharta (investment activities)": { metricKey: "revenue_by_source", dimension: "danaharta_mgmt_fee" },
  "management fee — govco": { metricKey: "revenue_by_source", dimension: "govco_mgmt_fee" },
  "management fee — sjkp": { metricKey: "revenue_by_source", dimension: "sjkp_mgmt_fee" },
  "management fee — sjpp": { metricKey: "revenue_by_source", dimension: "sjpp_mgmt_fee" },
  "management fee — danainfra": { metricKey: "revenue_by_source", dimension: "danainfra_mgmt_fee" },
  "fee from sap services": { metricKey: "revenue_by_source", dimension: "sap_services_fee" },
  "fee from outsourcing services": { metricKey: "revenue_by_source", dimension: "outsourcing_services_fee" },
  "fee from secretarial services": { metricKey: "revenue_by_source", dimension: "secretarial_services_fee" },
  "fee from corporate advisory services": { metricKey: "revenue_by_source", dimension: "corporate_advisory_fee" },
  "fee from credit advisory services": { metricKey: "revenue_by_source", dimension: "credit_advisory_fee" },
  "income from acquired loans (pam)": { metricKey: "revenue_by_source", dimension: "acquired_loans_income" },

  "administrative expenses": { metricKey: "expense_by_category", dimension: "admin_expenses" },
  "personnel expenses": { metricKey: "expense_by_category", dimension: "personnel_expenses" },
  "professional fees": { metricKey: "expense_by_category", dimension: "professional_fees" },
  "depreciation": { metricKey: "expense_by_category", dimension: "depreciation" },
  "depreciation of rou asset": { metricKey: "expense_by_category", dimension: "depreciation_rou" },
  "other expenses": { metricKey: "expense_by_category", dimension: "other_expenses" },
  "interest expense (lease liability)": { metricKey: "expense_by_category", dimension: "interest_expense_lease" },
  "provision for impairment loss on receivables": { metricKey: "expense_by_category", dimension: "impairment_receivables" },

  "advertisement, printing and stationery": { metricKey: "admin_expense_detail", dimension: "Advertisement, printing and stationery" },
  "computer expenses": { metricKey: "admin_expense_detail", dimension: "Computer expenses" },
  "electricity": { metricKey: "admin_expense_detail", dimension: "Electricity" },
  "insurance": { metricKey: "admin_expense_detail", dimension: "Insurance" },
  "motor vehicle expenses": { metricKey: "admin_expense_detail", dimension: "Motor vehicle expenses" },
  "newspaper/periodicals": { metricKey: "admin_expense_detail", dimension: "Newspaper/periodicals" },
  "office maintenance and repairs": { metricKey: "admin_expense_detail", dimension: "Office maintenance and repairs" },
  "lease (service tax)": { metricKey: "admin_expense_detail", dimension: "Lease (service tax)" },
  "office equipment rental and maintenance": { metricKey: "admin_expense_detail", dimension: "Office equipment rental and maintenance" },
  "stamps and postages": { metricKey: "admin_expense_detail", dimension: "Stamps and postages" },
  "telephone": { metricKey: "admin_expense_detail", dimension: "Telephone" },
  "travelling": { metricKey: "admin_expense_detail", dimension: "Travelling" },
  "entertainment": { metricKey: "admin_expense_detail", dimension: "Entertainment" },
  "corporate communication": { metricKey: "admin_expense_detail", dimension: "Corporate Communication" },
  "service tax": { metricKey: "admin_expense_detail", dimension: "Service tax" },

  "salaries and wages": { metricKey: "personnel_expense_detail", dimension: "Salaries and wages" },
  "bonus provision": { metricKey: "personnel_expense_detail", dimension: "Bonus provision" },
  "epf contribution": { metricKey: "personnel_expense_detail", dimension: "EPF contribution" },
  "socso": { metricKey: "personnel_expense_detail", dimension: "SOCSO" },
  "staff training": { metricKey: "personnel_expense_detail", dimension: "Staff training" },
  "staff welfare": { metricKey: "personnel_expense_detail", dimension: "Staff welfare" },
  "medical expenses": { metricKey: "personnel_expense_detail", dimension: "Medical expenses" },
  "hrdf fee": { metricKey: "personnel_expense_detail", dimension: "HRDF fee" },
  "director's benefits": { metricKey: "personnel_expense_detail", dimension: "Director's benefits" },
  "director's meeting allowance": { metricKey: "personnel_expense_detail", dimension: "Director's meeting allowance" },
  "mof staff related cost": { metricKey: "personnel_expense_detail", dimension: "MoF staff related cost" },

  "finance income": { metricKey: "pl_detail", dimension: "finance_income" },
  "other income": { metricKey: "pl_detail", dimension: "other_income" },
  "taxation": { metricKey: "pl_detail", dimension: "taxation" },
  "profit after tax": { metricKey: "pl_detail", dimension: "profit_after_tax" },
  "dividend": { metricKey: "pl_detail", dimension: "dividend" },

  "freehold buildings": { metricKey: "balance_sheet_detail", dimension: "pe_freehold_buildings" },
  "office furniture & fittings": { metricKey: "balance_sheet_detail", dimension: "pe_furniture_fittings" },
  "office equipment": { metricKey: "balance_sheet_detail", dimension: "pe_office_equipment" },
  "motor vehicles": { metricKey: "balance_sheet_detail", dimension: "pe_motor_vehicles" },
  "computer equipment": { metricKey: "balance_sheet_detail", dimension: "pe_computer_equipment" },
  "office renovation": { metricKey: "balance_sheet_detail", dimension: "pe_office_renovation" },
  "work in progress": { metricKey: "balance_sheet_detail", dimension: "pe_work_in_progress" },
  "right-of-use — office space": { metricKey: "balance_sheet_detail", dimension: "rou_office_space" },
  "right-of-use — photocopier": { metricKey: "balance_sheet_detail", dimension: "rou_photocopier" },
  "right-of-use — notebook/computer": { metricKey: "balance_sheet_detail", dimension: "rou_notebook_computer" },
  "right-of-use — server": { metricKey: "balance_sheet_detail", dimension: "rou_server" },
  "deferred tax asset": { metricKey: "balance_sheet_detail", dimension: "deferred_tax_asset" },
  "tax recoverable": { metricKey: "balance_sheet_detail", dimension: "tax_recoverable" },
  "amount due from related corporations": { metricKey: "balance_sheet_detail", dimension: "amount_due_from_related_corps" },
  "trade receivables": { metricKey: "balance_sheet_detail", dimension: "recv_trade_receivables" },
  "impairment of receivables": { metricKey: "balance_sheet_detail", dimension: "recv_impairment" },
  "expected credit loss": { metricKey: "balance_sheet_detail", dimension: "recv_expected_credit_loss" },
  "profit receivables from placements": { metricKey: "balance_sheet_detail", dimension: "recv_profit_receivables_placements" },
  "deposits (receivables)": { metricKey: "balance_sheet_detail", dimension: "recv_deposits" },
  "prepayments": { metricKey: "balance_sheet_detail", dimension: "recv_prepayments" },
  "reimbursable personnel cost and fees by mof": { metricKey: "balance_sheet_detail", dimension: "recv_reimbursable_personnel_cost" },
  "accrued revenue": { metricKey: "balance_sheet_detail", dimension: "recv_accrued_revenue" },
  "other receivables": { metricKey: "balance_sheet_detail", dimension: "recv_other_receivables" },
  "deposits and placements (cash)": { metricKey: "balance_sheet_detail", dimension: "cash_deposits_placements" },
  "cash and bank balances": { metricKey: "balance_sheet_detail", dimension: "cash_bank_balances" },
  "effective profit rate": { metricKey: "balance_sheet_detail", dimension: "cash_effective_profit_rate" },
  "staff related provisions": { metricKey: "balance_sheet_detail", dimension: "pay_staff_related_provisions" },
  "dividend payable": { metricKey: "balance_sheet_detail", dimension: "pay_dividend_payable" },
  "service tax payable": { metricKey: "balance_sheet_detail", dimension: "pay_service_tax" },
  "external auditors' fee": { metricKey: "balance_sheet_detail", dimension: "pay_external_auditors_fee" },
  "tax agent's fee": { metricKey: "balance_sheet_detail", dimension: "pay_tax_agent_fee" },
  "deposits from sale of properties": { metricKey: "balance_sheet_detail", dimension: "pay_deposits_sale_properties" },
  "amount due to a related corporation": { metricKey: "balance_sheet_detail", dimension: "pay_amount_due_related_corp" },
  "accrued expenses and other payables": { metricKey: "balance_sheet_detail", dimension: "pay_accrued_expenses_other" },

  "current": { metricKey: "receivables_aging", dimension: "current" },
  "1–30 days": { metricKey: "receivables_aging", dimension: "days_1_30" },
  "31–60 days": { metricKey: "receivables_aging", dimension: "days_31_60" },
  "61–90 days": { metricKey: "receivables_aging", dimension: "days_61_90" },
  "91–120 days": { metricKey: "receivables_aging", dimension: "days_91_120" },
  "over 120 days (impaired)": { metricKey: "receivables_aging", dimension: "days_over_120" },
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
  readLabelValueSheet(/financial detail/i, FINANCIAL_DETAIL_MAP, "Financial Detail");

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
