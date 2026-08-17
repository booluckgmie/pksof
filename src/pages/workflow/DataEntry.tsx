import { Fragment, useMemo, useState } from "react";
import { toast } from "sonner";
import { FileSpreadsheet, PenLine, Send, UploadCloud } from "lucide-react";
import { ScreenHeader } from "@/components/pk/ScreenHeader";
import { WorkflowChip } from "@/components/pk/StatusChip";
import { InfoNote } from "@/components/pk/Misc";
import type { ScreenId } from "@/lib/nav";
import { useSession } from "@/lib/session";
import { useWorkflow } from "@/lib/workflow";
import { useDetails } from "@/lib/details";
import { perspectives } from "@/data/perspectives";
import { kpisByPerspective, kpiById, type KpiExt } from "@/data/kpis";
import { periods } from "@/data/periods";
import { cn } from "@/lib/utils";
import { parseKpiTemplate, parseDetailTemplate, type ParsedKpiRow, type ParsedDetailMetric } from "@/lib/excelTemplate";
import { upsertDetailMetric } from "@/lib/api/details";

type Entries = Record<string, { value: string; note: string }>;

interface DetailField {
  section: string;
  label: string;
  metricKey: string;
  dimension: string;
  dimension2?: string;
  unit?: string;
}

const GRADES = ["Top Management", "Senior Management", "Management", "Executive", "Non-Executive"];
const BANDS = ["≤30", "31–40", "41–50", "51+"];
const DEPTS = ["Finance", "Human Resource", "Corporate Performance", "IT & Digital", "Risk & Compliance"];
const REC_METRICS = ["Time to Hire (TTH)", "MRF Fulfilment Rate", "Quality of Hire", "Offer Acceptance Rate"];
const ME_ENTITIES = ["SJPP", "SJKP", "DanaInfra", "DanaHarta", "GovCo"];
const PROC_DEPTS = ["Administration & Security", "Corporate Communications", "Information Technology"];
const BS_ASSETS = ["Cash & Equivalents", "Fixed Income Investments", "Receivables & Others", "Fixed Assets (Net)"];
const BS_LIABILITIES = ["Trade & Other Payables", "Deferred Revenue", "Other Liabilities"];

/** Every parameter the Excel template's "Workforce Summary" / "Financial Trend" / "All Other
 * Detail Data" sheets cover, mirrored here so the web form has full parity with the workbook. */
const DETAIL_FIELDS: DetailField[] = [
  { section: "Workforce Summary", label: "Total Employees", metricKey: "headcount_summary", dimension: "total_employees" },
  { section: "Workforce Summary", label: "Bumiputera", metricKey: "headcount_summary", dimension: "bumiputera" },
  { section: "Workforce Summary", label: "Non-Bumiputera", metricKey: "headcount_summary", dimension: "non_bumiputera" },
  { section: "Workforce Summary", label: "Approved Headcount", metricKey: "headcount_summary", dimension: "approved_headcount" },
  { section: "Workforce Summary", label: "Filled Position", metricKey: "headcount_summary", dimension: "filled_position" },
  { section: "Workforce Summary", label: "Male", metricKey: "gender_breakdown", dimension: "male" },
  { section: "Workforce Summary", label: "Female", metricKey: "gender_breakdown", dimension: "female" },
  { section: "Workforce Summary", label: "Average Age", metricKey: "average_age", dimension: "avg", unit: "years" },

  ...GRADES.map((g): DetailField => ({ section: "Grade Breakdown", label: g, metricKey: "grade_breakdown", dimension: g })),

  ...BANDS.map((b): DetailField => ({ section: "Age Breakdown", label: b, metricKey: "age_breakdown", dimension: b })),

  ...BANDS.flatMap((b): DetailField[] => [
    { section: "Age × Gender", label: `${b} — Male`, metricKey: "age_gender_breakdown", dimension: b, dimension2: "male" },
    { section: "Age × Gender", label: `${b} — Female`, metricKey: "age_gender_breakdown", dimension: b, dimension2: "female" },
  ]),

  ...GRADES.flatMap((g): DetailField[] => [
    { section: "Grade × Gender × Avg Age", label: `${g} — Male`, metricKey: "grade_gender_crosstab", dimension: g, dimension2: "male" },
    { section: "Grade × Gender × Avg Age", label: `${g} — Female`, metricKey: "grade_gender_crosstab", dimension: g, dimension2: "female" },
    { section: "Grade × Gender × Avg Age", label: `${g} — Avg Age`, metricKey: "grade_gender_crosstab", dimension: g, dimension2: "avgAge", unit: "years" },
  ]),

  ...DEPTS.flatMap((d): DetailField[] => [
    { section: "Department Headcount", label: `${d} — Approved`, metricKey: "dept_headcount", dimension: d, dimension2: "approved" },
    { section: "Department Headcount", label: `${d} — Filled`, metricKey: "dept_headcount", dimension: d, dimension2: "filled" },
  ]),

  ...REC_METRICS.flatMap((m): DetailField[] => [
    { section: "Recruitment Index", label: `${m} — Weight`, metricKey: "recruitment_index", dimension: m, dimension2: "weight" },
    { section: "Recruitment Index", label: `${m} — Weighted Score`, metricKey: "recruitment_index", dimension: m, dimension2: "weighted" },
  ]),

  { section: "Bumiputera Training", label: "Pool Identified", metricKey: "bumiputera_training", dimension: "pool_identified" },
  { section: "Bumiputera Training", label: "Attended 1 Programme", metricKey: "bumiputera_training", dimension: "attended_one" },
  { section: "Bumiputera Training", label: "Attended 2+ Programmes", metricKey: "bumiputera_training", dimension: "attended_two_plus" },

  { section: "Turnover", label: "Employees Resigned", metricKey: "resigned", dimension: "count" },

  { section: "Financial Trend", label: "Revenue", metricKey: "financial_trend", dimension: "revenue", unit: "RM mil" },
  { section: "Financial Trend", label: "Profit Before Tax", metricKey: "financial_trend", dimension: "pbt", unit: "RM mil" },
  { section: "Financial Trend", label: "Cost-to-Income Ratio", metricKey: "financial_trend", dimension: "cir", unit: "%" },
  { section: "Financial Trend", label: "Net Profit Margin", metricKey: "financial_trend", dimension: "net_margin", unit: "%" },

  { section: "Balance Sheet", label: "Shareholders' Fund", metricKey: "balance_sheet", dimension: "shareholders_fund", unit: "RM mil" },
  { section: "Balance Sheet", label: "Total Liabilities", metricKey: "balance_sheet", dimension: "total_liabilities", unit: "RM mil" },
  ...BS_ASSETS.map((a): DetailField => ({ section: "Balance Sheet", label: `${a} (Asset)`, metricKey: "balance_sheet_lines", dimension: a, dimension2: "asset", unit: "RM mil" })),
  ...BS_LIABILITIES.map((l): DetailField => ({ section: "Balance Sheet", label: `${l} (Liability)`, metricKey: "balance_sheet_lines", dimension: l, dimension2: "liability", unit: "RM mil" })),

  ...ME_ENTITIES.flatMap((e): DetailField[] => [
    { section: "Managed Entity Ratings", label: `${e} — Met`, metricKey: "managed_entity_ratings", dimension: e, dimension2: "met" },
    { section: "Managed Entity Ratings", label: `${e} — Not Met`, metricKey: "managed_entity_ratings", dimension: e, dimension2: "not_met" },
    { section: "Managed Entity Ratings", label: `${e} — Not Measured`, metricKey: "managed_entity_ratings", dimension: e, dimension2: "not_measured" },
    { section: "Managed Entity Ratings", label: `${e} — Achievement`, metricKey: "managed_entity_ratings", dimension: e, dimension2: "achievement", unit: "%" },
  ]),

  ...PROC_DEPTS.flatMap((d): DetailField[] => [
    { section: "Bumiputera Procurement", label: `${d} — FY Target`, metricKey: "bumiputera_procurement", dimension: d, dimension2: "fy_target", unit: "RM mil" },
    { section: "Bumiputera Procurement", label: `${d} — YTD Actual`, metricKey: "bumiputera_procurement", dimension: d, dimension2: "ytd_actual", unit: "RM mil" },
  ]),
];

const DETAIL_SECTIONS = [...new Set(DETAIL_FIELDS.map((f) => f.section))];

export function DataEntry({ onNavigate }: { onNavigate: (id: ScreenId) => void }) {
  const { entityId, userName, periodId: sessionPeriodId } = useSession();
  const { submit, submissions, latestValue, editSubmission } = useWorkflow();
  const { getMetricValue, refresh } = useDetails();

  const [channel, setChannel] = useState<"web-form" | "excel-upload">("web-form");
  const [formSection, setFormSection] = useState<"kpi" | "detail">("kpi");
  const openPeriods = periods.filter((p) => p.isOpenForEntry);
  const [periodId, setPeriodIdLocal] = useState(
    openPeriods.some((p) => p.id === sessionPeriodId) ? sessionPeriodId : (openPeriods[0]?.id ?? periods[0].id)
  );
  const [entries, setEntries] = useState<Entries>({});
  const [detailEntries, setDetailEntries] = useState<Record<string, string>>({});
  const [savingDetail, setSavingDetail] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [parsing, setParsing] = useState(false);
  const [parseError, setParseError] = useState<string | null>(null);
  const [parsed, setParsed] = useState<ParsedKpiRow[]>([]);
  const [parsedDetail, setParsedDetail] = useState<ParsedDetailMetric[]>([]);
  const [detailSheetsFound, setDetailSheetsFound] = useState<string[]>([]);
  const [skippedNoValue, setSkippedNoValue] = useState(0);
  const [submittingParsed, setSubmittingParsed] = useState(false);
  const [editingSubId, setEditingSubId] = useState<string | null>(null);
  const [editingSubValue, setEditingSubValue] = useState("");

  const fieldKey = (f: DetailField) => `${f.metricKey}::${f.dimension}::${f.dimension2 ?? ""}`;

  const detailFilledCount = Object.values(detailEntries).filter((v) => v.trim() !== "").length;

  const handleSaveDetailSnapshot = async () => {
    const rows = Object.entries(detailEntries).filter(([, v]) => v.trim() !== "");
    if (rows.length === 0) {
      toast.error("Enter at least one value before saving.");
      return;
    }
    setSavingDetail(true);
    let saved = 0;
    let invalid = 0;
    for (const [key, raw] of rows) {
      const value = Number(raw);
      if (Number.isNaN(value)) {
        invalid++;
        continue;
      }
      const [metricKey, dimension, dimension2] = key.split("::");
      try {
        await upsertDetailMetric({ entityId, periodId, metricKey, dimension, dimension2, value });
        saved++;
      } catch (err) {
        toast.error(`Couldn't save ${dimension}`, { description: err instanceof Error ? err.message : String(err) });
      }
    }
    await refresh();
    setSavingDetail(false);
    if (saved > 0) {
      toast.success(`Saved ${saved} figure${saved > 1 ? "s" : ""}`, { description: `${periods.find((p) => p.id === periodId)?.label} — reflected on the dashboards immediately.` });
      setDetailEntries({});
    }
    if (invalid > 0) toast.error(`${invalid} value${invalid > 1 ? "s" : ""} skipped — must be numeric.`);
  };

  const mySubmissions = useMemo(
    () => submissions.filter((s) => s.submittedBy === userName || s.entityId === entityId).slice(0, 12),
    [submissions, userName, entityId]
  );

  const pendingFor = (kpiId: string) =>
    submissions.find((s) => s.kpiId === kpiId && s.entityId === entityId && s.periodId === periodId && s.status === "submitted");

  const handlePeriodChange = (id: string) => {
    setPeriodIdLocal(id as typeof periodId);
    setEntries({});
  };

  const updateEntry = (kpiId: string, field: "value" | "note", val: string) => {
    setEntries((prev) => ({
      ...prev,
      [kpiId]: { value: field === "value" ? val : (prev[kpiId]?.value ?? ""), note: field === "note" ? val : (prev[kpiId]?.note ?? "") },
    }));
  };

  const filledCount = Object.values(entries).filter((e) => e.value.trim() !== "").length;

  const handleSubmitAll = () => {
    const rows = Object.entries(entries).filter(([, v]) => v.value.trim() !== "");
    if (rows.length === 0) {
      toast.error("Enter at least one KPI value before submitting.");
      return;
    }
    let submitted = 0;
    let invalid = 0;
    for (const [kpiId, v] of rows) {
      const numeric = Number(v.value);
      if (Number.isNaN(numeric)) {
        invalid++;
        continue;
      }
      submit({ kpiId, entityId, periodId, value: numeric, note: v.note, source: "web-form", submittedBy: userName || "reporting.officer" });
      submitted++;
    }
    if (submitted > 0) {
      toast.success(`Submitted ${submitted} KPI update${submitted > 1 ? "s" : ""} for verification`, {
        description: `${periods.find((p) => p.id === periodId)?.label} — routed to the checker queue.`,
      });
      setEntries({});
    }
    if (invalid > 0) {
      toast.error(`${invalid} value${invalid > 1 ? "s" : ""} skipped — must be numeric.`);
    }
  };

  const handleFileChange = async (file: File | undefined) => {
    if (!file) return;
    setFileName(file.name);
    setParsing(true);
    setParseError(null);
    setParsed([]);
    setParsedDetail([]);
    setDetailSheetsFound([]);
    setSkippedNoValue(0);
    try {
      const [kpiResult, detailResult] = await Promise.all([
        parseKpiTemplate(file).catch(() => ({ rows: [] as ParsedKpiRow[], skippedNoValue: 0 })),
        parseDetailTemplate(file).catch(() => ({ rows: [] as ParsedDetailMetric[], sheetsFound: [] as string[] })),
      ]);
      setParsed(kpiResult.rows);
      setSkippedNoValue(kpiResult.skippedNoValue);
      setParsedDetail(detailResult.rows);
      setDetailSheetsFound(detailResult.sheetsFound);
      if (kpiResult.rows.length === 0 && detailResult.rows.length === 0) {
        setParseError("Nothing recognized in this file — check it's built from the standard template (KPI Submission, Workforce Summary, Financial Trend, or All Other Detail Data sheets).");
      }
    } catch (err) {
      setParseError(err instanceof Error ? err.message : "Couldn't read this file.");
    } finally {
      setParsing(false);
    }
  };

  const handleSubmitParsed = async () => {
    if (parsed.length === 0 && parsedDetail.length === 0) return;
    setSubmittingParsed(true);
    for (const row of parsed) {
      submit({ kpiId: row.kpiId, entityId, periodId, value: row.value, note: row.note, source: "excel-upload", submittedBy: userName || "reporting.officer" });
    }
    let detailSaved = 0;
    for (const row of parsedDetail) {
      try {
        await upsertDetailMetric({ entityId, periodId, metricKey: row.metricKey, dimension: row.dimension, dimension2: row.dimension2, value: row.value, note: row.note || null });
        detailSaved++;
      } catch (err) {
        toast.error(`Couldn't save ${row.metricKey}/${row.dimension}`, { description: err instanceof Error ? err.message : String(err) });
      }
    }
    if (detailSaved > 0) await refresh();
    setSubmittingParsed(false);

    const parts: string[] = [];
    if (parsed.length > 0) parts.push(`${parsed.length} KPI update${parsed.length > 1 ? "s" : ""} routed to the checker queue`);
    if (detailSaved > 0) parts.push(`${detailSaved} detail figure${detailSaved > 1 ? "s" : ""} saved directly to the dashboards`);
    if (parts.length > 0) {
      toast.success("Upload processed", { description: `${fileName} · ${periods.find((p) => p.id === periodId)?.label} — ${parts.join("; ")}.` });
    }
    setFileName(null);
    setParsed([]);
    setParsedDetail([]);
    setDetailSheetsFound([]);
    setSkippedNoValue(0);
  };

  const saveSubmissionEdit = (id: string, note: string) => {
    const numeric = Number(editingSubValue);
    if (editingSubValue.trim() === "" || Number.isNaN(numeric)) {
      toast.error("Value must be numeric.");
      return;
    }
    editSubmission(id, numeric, note);
    toast.success("Submission updated");
    setEditingSubId(null);
  };

  const renderCurrent = (k: KpiExt) => {
    const r = latestValue(k.id, entityId, periodId);
    if (r.ytdActual === null) return <span className="text-[hsl(var(--pk-ink-faint))]">—</span>;
    return <span className="tnum">{r.ytdActual}{k.unit === "%" ? "%" : ""}</span>;
  };

  return (
    <div>
      <ScreenHeader id="DATA_ENTRY" subtitle="Update every KPI for the selected reporting period in one snapshot — via the web form or by uploading the approved Excel template. Both channels feed the same Verify & Publish queue." onNavigate={onNavigate} />

      <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
        <div className="flex items-center gap-1 border border-[hsl(var(--pk-border))] rounded-lg p-1 w-fit bg-[hsl(var(--pk-surface))]">
          <button
            onClick={() => setChannel("web-form")}
            className={cn("flex items-center gap-1.5 rounded-md px-3 py-1.5 text-[13px] font-medium transition-colors", channel === "web-form" ? "bg-[hsl(var(--pk-accent))] text-[hsl(var(--pk-accent-ink))]" : "text-[hsl(var(--pk-ink-faint))] hover:text-[hsl(var(--pk-ink))]")}
          >
            <PenLine className="h-3.5 w-3.5" />Web form
          </button>
          <button
            onClick={() => setChannel("excel-upload")}
            className={cn("flex items-center gap-1.5 rounded-md px-3 py-1.5 text-[13px] font-medium transition-colors", channel === "excel-upload" ? "bg-[hsl(var(--pk-accent))] text-[hsl(var(--pk-accent-ink))]" : "text-[hsl(var(--pk-ink-faint))] hover:text-[hsl(var(--pk-ink))]")}
          >
            <FileSpreadsheet className="h-3.5 w-3.5" />Excel template upload
          </button>
        </div>

        <label className="flex items-center gap-2">
          <span className="text-[11px] uppercase tracking-wide text-[hsl(var(--pk-ink-faint))]">Reporting period</span>
          <select value={periodId} onChange={(e) => handlePeriodChange(e.target.value)} className="rounded-md border border-[hsl(var(--pk-border))] px-2.5 py-1.5 text-sm bg-transparent outline-none focus:border-[hsl(var(--pk-accent))]">
            {openPeriods.map((p) => <option key={p.id} value={p.id}>{p.label}</option>)}
          </select>
        </label>
      </div>

      <div className="mb-5">
        <InfoNote>
          Skip <b>KPI4 (Governance Index)</b> and <b>KPI5 (External Client Satisfaction)</b> when they're not due —
          per their formula notes, KPI4 is only assessed annually in Q4, and KPI5's survey is bi-annual. Leave those
          rows blank rather than entering a placeholder value; a blank KPI correctly shows as no data instead of a
          fabricated figure.
        </InfoNote>
      </div>

      {channel === "web-form" && (
        <div className="flex items-center gap-1 mb-5 border border-[hsl(var(--pk-border))] rounded-lg p-1 w-fit bg-[hsl(var(--pk-surface))]">
          <button
            onClick={() => setFormSection("kpi")}
            className={cn("rounded-md px-3 py-1.5 text-[13px] font-medium transition-colors", formSection === "kpi" ? "bg-[hsl(var(--pk-accent))] text-[hsl(var(--pk-accent-ink))]" : "text-[hsl(var(--pk-ink-faint))] hover:text-[hsl(var(--pk-ink))]")}
          >
            KPI Scorecard
          </button>
          <button
            onClick={() => setFormSection("detail")}
            className={cn("rounded-md px-3 py-1.5 text-[13px] font-medium transition-colors", formSection === "detail" ? "bg-[hsl(var(--pk-accent))] text-[hsl(var(--pk-accent-ink))]" : "text-[hsl(var(--pk-ink-faint))] hover:text-[hsl(var(--pk-ink))]")}
          >
            Workforce, Financial &amp; Other Detail
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-[1.6fr_1fr] gap-5">
        {channel === "web-form" && formSection === "kpi" ? (
          <div className="rounded-lg border border-[hsl(var(--pk-border))] bg-[hsl(var(--pk-surface))] shadow-card p-5 flex flex-col gap-4">
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[640px]">
                <thead>
                  <tr className="text-[11px] uppercase tracking-wide text-[hsl(var(--pk-ink-faint))]">
                    <th className="text-left font-medium pb-1.5">KPI</th>
                    <th className="text-right font-medium pb-1.5 pr-2 w-20">Current</th>
                    <th className="text-right font-medium pb-1.5 pl-2 w-28">New value</th>
                    <th className="text-left font-medium pb-1.5 pl-3">Note to checker</th>
                  </tr>
                </thead>
                <tbody>
                  {perspectives.map((p) => (
                    <Fragment key={p.id}>
                      <tr className="bg-[hsl(var(--pk-surface-2))]">
                        <td colSpan={4} className="py-1.5 px-2 text-[11px] uppercase tracking-wide text-[hsl(var(--pk-ink-faint))] font-medium">{p.name}</td>
                      </tr>
                      {kpisByPerspective(p.id).map((k) => {
                        const pending = pendingFor(k.id);
                        return (
                          <tr key={k.id} className="border-t border-[hsl(var(--pk-border))] align-top">
                            <td className="py-2 pr-2">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="font-medium text-[hsl(var(--pk-ink))]">KPI {k.no} — {k.name}</span>
                                {pending && <WorkflowChip status="submitted" />}
                              </div>
                              <div className="text-[11px] text-[hsl(var(--pk-ink-faint))]">{k.dataOwner} · {k.unit}</div>
                            </td>
                            <td className="py-2 pr-2 text-right tnum">{renderCurrent(k)}</td>
                            <td className="py-2 pl-2">
                              <input
                                value={entries[k.id]?.value ?? ""}
                                onChange={(e) => updateEntry(k.id, "value", e.target.value)}
                                type="number"
                                step="any"
                                placeholder={k.unit === "%" ? "e.g. 44.2" : "e.g. 27.5"}
                                className="w-full rounded-md border border-[hsl(var(--pk-border))] px-2 py-1.5 text-sm bg-transparent outline-none focus:border-[hsl(var(--pk-accent))] tnum text-right"
                              />
                            </td>
                            <td className="py-2 pl-3">
                              <input
                                value={entries[k.id]?.note ?? ""}
                                onChange={(e) => updateEntry(k.id, "note", e.target.value)}
                                type="text"
                                placeholder="Optional context, e.g. source document"
                                className="w-full rounded-md border border-[hsl(var(--pk-border))] px-2 py-1.5 text-sm bg-transparent outline-none focus:border-[hsl(var(--pk-accent))]"
                              />
                            </td>
                          </tr>
                        );
                      })}
                    </Fragment>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex items-center justify-between gap-3 pt-1 border-t border-[hsl(var(--pk-border))]">
              <span className="text-[13px] text-[hsl(var(--pk-ink-faint))]">{filledCount} of {perspectives.reduce((n, p) => n + kpisByPerspective(p.id).length, 0)} KPIs filled in</span>
              <button
                onClick={handleSubmitAll}
                disabled={filledCount === 0}
                className="inline-flex items-center justify-center gap-2 rounded-md bg-[hsl(var(--pk-accent))] text-[hsl(var(--pk-accent-ink))] font-medium text-sm px-4 py-2.5 hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Send className="h-4 w-4" />Submit {filledCount > 0 ? filledCount : ""} for verification
              </button>
            </div>
            <InfoNote>Each filled-in row becomes its own submission with status <b>Submitted</b>. Nothing reaches a dashboard until a checker reviews it in Verify &amp; Publish. Leave a KPI blank to skip it this period (e.g. an annual or bi-annual measure not due).</InfoNote>
          </div>
        ) : channel === "web-form" && formSection === "detail" ? (
          <div className="rounded-lg border border-[hsl(var(--pk-border))] bg-[hsl(var(--pk-surface))] shadow-card p-5 flex flex-col gap-4">
            <div className="max-h-[560px] overflow-y-auto overflow-x-auto">
              <table className="w-full text-sm min-w-[520px]">
                <thead className="sticky top-0 bg-[hsl(var(--pk-surface))] z-10">
                  <tr className="text-[11px] uppercase tracking-wide text-[hsl(var(--pk-ink-faint))]">
                    <th className="text-left font-medium pb-1.5">Metric</th>
                    <th className="text-right font-medium pb-1.5 pr-2 w-24">Current</th>
                    <th className="text-right font-medium pb-1.5 pl-2 w-32">New value</th>
                  </tr>
                </thead>
                <tbody>
                  {DETAIL_SECTIONS.map((section) => (
                    <Fragment key={section}>
                      <tr className="bg-[hsl(var(--pk-surface-2))]">
                        <td colSpan={3} className="py-1.5 px-2 text-[11px] uppercase tracking-wide text-[hsl(var(--pk-ink-faint))] font-medium">{section}</td>
                      </tr>
                      {DETAIL_FIELDS.filter((f) => f.section === section).map((f) => {
                        const key = fieldKey(f);
                        const current = getMetricValue(periodId, f.metricKey, f.dimension, f.dimension2);
                        return (
                          <tr key={key} className="border-t border-[hsl(var(--pk-border))]">
                            <td className="py-2 pr-2">
                              <span className="font-medium text-[hsl(var(--pk-ink))]">{f.label}</span>
                              {f.unit && <span className="text-[11px] text-[hsl(var(--pk-ink-faint))]"> · {f.unit}</span>}
                            </td>
                            <td className="py-2 pr-2 text-right tnum">{current === null ? <span className="text-[hsl(var(--pk-ink-faint))]">—</span> : <>{current}{f.unit === "%" ? "%" : ""}</>}</td>
                            <td className="py-2 pl-2">
                              <input
                                value={detailEntries[key] ?? ""}
                                onChange={(e) => setDetailEntries((prev) => ({ ...prev, [key]: e.target.value }))}
                                type="number"
                                step="any"
                                placeholder="e.g. 219"
                                className="w-full rounded-md border border-[hsl(var(--pk-border))] px-2 py-1.5 text-sm bg-transparent outline-none focus:border-[hsl(var(--pk-accent))] tnum text-right"
                              />
                            </td>
                          </tr>
                        );
                      })}
                    </Fragment>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex items-center justify-between gap-3 pt-1 border-t border-[hsl(var(--pk-border))]">
              <span className="text-[13px] text-[hsl(var(--pk-ink-faint))]">{detailFilledCount} of {DETAIL_FIELDS.length} filled in</span>
              <button
                onClick={handleSaveDetailSnapshot}
                disabled={detailFilledCount === 0 || savingDetail}
                className="inline-flex items-center justify-center gap-2 rounded-md bg-[hsl(var(--pk-accent))] text-[hsl(var(--pk-accent-ink))] font-medium text-sm px-4 py-2.5 hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Send className="h-4 w-4" />{savingDetail ? "Saving…" : `Save ${detailFilledCount > 0 ? detailFilledCount : ""} figure${detailFilledCount === 1 ? "" : "s"}`}
              </button>
            </div>
            <InfoNote>Unlike the KPI scorecard, these figures save directly and appear on the dashboards immediately — there's no checker queue behind supporting data. Covers every parameter in the Excel template's Workforce Summary, Financial Trend and All Other Detail Data sheets — fill in only what changed this quarter.</InfoNote>
          </div>
        ) : (
          <div className="rounded-lg border border-[hsl(var(--pk-border))] bg-[hsl(var(--pk-surface))] shadow-card p-5 flex flex-col gap-4 h-fit">
            <div className="flex flex-col gap-2">
              <span className="text-[11px] uppercase tracking-wide text-[hsl(var(--pk-ink-faint))]">Completed Excel template — KPIs and/or workforce &amp; financial detail, {periods.find((p) => p.id === periodId)?.label}</span>
              <label className="flex flex-col items-center justify-center gap-1.5 rounded-md border border-dashed border-[hsl(var(--pk-border))] py-6 cursor-pointer hover:border-[hsl(var(--pk-accent))] transition-colors">
                <UploadCloud className="h-5 w-5 text-[hsl(var(--pk-ink-faint))]" />
                <span className="text-xs text-[hsl(var(--pk-ink-faint))]">{parsing ? "Reading file…" : (fileName ?? "Click to choose a .xlsx file")}</span>
                <input type="file" accept=".xlsx,.xls" className="hidden" onChange={(e) => handleFileChange(e.target.files?.[0])} />
              </label>
            </div>

            {parseError && (
              <div className="rounded-md border border-[hsl(var(--pk-bad))] bg-[hsl(var(--pk-bad-soft))] px-3 py-2 text-xs text-[hsl(var(--pk-bad))]">{parseError}</div>
            )}

            {parsed.length > 0 && (
              <div className="flex flex-col gap-2">
                <span className="text-[11px] uppercase tracking-wide text-[hsl(var(--pk-ink-faint))]">
                  KPI Submission — {parsed.length} value{parsed.length > 1 ? "s" : ""}{skippedNoValue > 0 ? ` · ${skippedNoValue} left blank (not due)` : ""}
                </span>
                <div className="rounded-md border border-[hsl(var(--pk-border))] divide-y divide-[hsl(var(--pk-border))] max-h-48 overflow-y-auto">
                  {parsed.map((row) => {
                    const k = kpiById(row.kpiId);
                    return (
                      <div key={row.kpiId} className="flex items-center justify-between gap-2 px-3 py-1.5 text-sm">
                        <span className="text-[hsl(var(--pk-ink))]">KPI {row.kpiNo} — {k.name}</span>
                        <span className="tnum font-medium">{row.value}{k.unit === "%" ? "%" : ""}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {parsedDetail.length > 0 && (
              <div className="flex flex-col gap-2">
                <span className="text-[11px] uppercase tracking-wide text-[hsl(var(--pk-ink-faint))]">
                  {detailSheetsFound.join(", ")} — {parsedDetail.length} value{parsedDetail.length > 1 ? "s" : ""}
                </span>
                <div className="rounded-md border border-[hsl(var(--pk-border))] divide-y divide-[hsl(var(--pk-border))] max-h-48 overflow-y-auto">
                  {parsedDetail.map((row, i) => (
                    <div key={`${row.metricKey}-${row.dimension}-${row.dimension2}-${i}`} className="flex items-center justify-between gap-2 px-3 py-1.5 text-sm">
                      <span className="text-[hsl(var(--pk-ink))]">{row.metricKey} / {row.dimension}{row.dimension2 ? ` / ${row.dimension2}` : ""}</span>
                      <span className="tnum font-medium">{row.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <button
              onClick={handleSubmitParsed}
              disabled={(parsed.length === 0 && parsedDetail.length === 0) || submittingParsed}
              className="mt-1 inline-flex items-center justify-center gap-2 rounded-md bg-[hsl(var(--pk-accent))] text-[hsl(var(--pk-accent-ink))] font-medium text-sm py-2.5 hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Send className="h-4 w-4" />{submittingParsed ? "Submitting…" : `Submit ${parsed.length + parsedDetail.length} extracted value${parsed.length + parsedDetail.length === 1 ? "" : "s"}`}
            </button>
            <InfoNote>Parsed entirely in your browser — the file itself isn't uploaded anywhere. KPI values go through the checker queue like the web form; workforce/financial detail values save directly to the dashboards. Sheets recognized: KPI Submission, Workforce Summary, Financial Trend, All Other Detail Data — include any subset.</InfoNote>
          </div>
        )}

        <div className="rounded-lg border border-[hsl(var(--pk-border))] bg-[hsl(var(--pk-surface))] shadow-card p-4 h-fit">
          <div className="text-[11px] uppercase tracking-wide text-[hsl(var(--pk-ink-faint))] mb-3">Recent submissions — this pillar</div>
          {mySubmissions.length === 0 ? (
            <p className="text-sm text-[hsl(var(--pk-ink-faint))]">No submissions yet. Once you submit, it'll appear here with its review status.</p>
          ) : (
            <div className="flex flex-col divide-y divide-[hsl(var(--pk-border))]">
              {mySubmissions.map((s) => {
                const k = kpiById(s.kpiId);
                const editing = editingSubId === s.id;
                return (
                  <div key={s.id} className="py-2.5">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-medium text-[hsl(var(--pk-ink))]">{k.name}</span>
                      <div className="flex items-center gap-1.5">
                        <WorkflowChip status={s.status} />
                        {s.status === "submitted" && !editing && (
                          <button
                            onClick={() => { setEditingSubId(s.id); setEditingSubValue(String(s.value)); }}
                            className="text-[hsl(var(--pk-ink-faint))] hover:text-[hsl(var(--pk-accent))] transition-colors"
                            title="Edit before it's reviewed"
                          >
                            <PenLine className="h-3 w-3" />
                          </button>
                        )}
                      </div>
                    </div>
                    {editing ? (
                      <div className="flex items-center gap-1.5 mt-1.5">
                        <input
                          value={editingSubValue}
                          onChange={(e) => setEditingSubValue(e.target.value)}
                          type="number"
                          step="any"
                          autoFocus
                          className="w-24 rounded-md border border-[hsl(var(--pk-accent))] px-2 py-1 text-xs bg-transparent outline-none tnum"
                        />
                        <button onClick={() => saveSubmissionEdit(s.id, s.note)} className="text-xs font-medium text-[hsl(var(--pk-accent))] px-1.5">Save</button>
                        <button onClick={() => setEditingSubId(null)} className="text-xs text-[hsl(var(--pk-ink-faint))] px-1.5">Cancel</button>
                      </div>
                    ) : (
                      <div className="text-[11px] text-[hsl(var(--pk-ink-faint))] mt-0.5">
                        {periods.find((p) => p.id === s.periodId)?.label} · {s.value}{k.unit === "%" ? "%" : ""} · {s.source === "web-form" ? "Web form" : "Excel upload"} · {new Date(s.submittedAt).toLocaleDateString()}
                      </div>
                    )}
                    {s.status === "rejected" && s.reviewNote && (
                      <div className="text-[11px] text-[hsl(var(--pk-bad))] mt-1">Rejected: {s.reviewNote}</div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
