import { useMemo, useState } from "react";
import { toast } from "sonner";
import { PenLine, Send, UploadCloud } from "lucide-react";
import { ScreenHeader } from "@/components/pk/ScreenHeader";
import { WorkflowChip } from "@/components/pk/StatusChip";
import { InfoNote } from "@/components/pk/Misc";
import type { ScreenId } from "@/lib/nav";
import { useSession } from "@/lib/session";
import { useWorkflow } from "@/lib/workflow";
import { useDetails } from "@/lib/details";
import { kpiById } from "@/data/kpis";
import { periods } from "@/data/periods";
import { parseKpiTemplate, parseDetailTemplate, type ParsedKpiRow, type ParsedDetailMetric } from "@/lib/excelTemplate";
import { upsertDetailMetric } from "@/lib/api/details";

export function DataEntry({ onNavigate }: { onNavigate: (id: ScreenId) => void }) {
  const { entityId, userName } = useSession();
  const { submit, submissions, editSubmission } = useWorkflow();
  const { refresh } = useDetails();

  const openPeriods = periods.filter((p) => p.isOpenForEntry);
  const [periodId, setPeriodId] = useState(openPeriods[0]?.id ?? periods[0].id);
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

  const mySubmissions = useMemo(
    () => submissions.filter((s) => s.submittedBy === userName || s.entityId === entityId).slice(0, 12),
    [submissions, userName, entityId]
  );

  const handlePeriodChange = (id: string) => {
    setPeriodId(id as typeof periodId);
    setParsed([]);
    setParsedDetail([]);
    setDetailSheetsFound([]);
    setFileName(null);
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

  return (
    <div>
      <ScreenHeader id="DATA_ENTRY" subtitle="Upload the approved Excel template for the selected reporting period — KPI values and workforce/financial detail both feed from the same file." onNavigate={onNavigate} />

      <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
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
          rows blank in the template rather than entering a placeholder value; a blank KPI correctly shows as no data
          instead of a fabricated figure.
        </InfoNote>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1.6fr_1fr] gap-5">
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
          <InfoNote>Parsed entirely in your browser — the file itself isn't uploaded anywhere. KPI values go through the checker queue; workforce/financial detail values save directly to the dashboards. Sheets recognized: KPI Submission, Workforce Summary, Financial Trend, Financial Detail, All Other Detail Data — include any subset. Monthly-resolution financial figures (feeding PFH002's Quarterly/Monthly toggle) aren't in the template yet — until that's added, they need a direct Supabase write.</InfoNote>
        </div>

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
                        {(s.status === "submitted" || s.status === "published") && !editing && (
                          <button
                            onClick={() => { setEditingSubId(s.id); setEditingSubValue(String(s.value)); }}
                            className="text-[hsl(var(--pk-ink-faint))] hover:text-[hsl(var(--pk-accent))] transition-colors"
                            title={s.status === "published" ? "Edit this published figure directly" : "Edit before it's reviewed"}
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
                        {periods.find((p) => p.id === s.periodId)?.label} · {s.value}{k.unit === "%" ? "%" : ""} · Excel upload · {new Date(s.submittedAt).toLocaleDateString()}
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
