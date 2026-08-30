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
import { periods, periodById } from "@/data/periods";
import { parseWorkbook, type ParsedWorkbook } from "@/lib/excelTemplate";
import { upsertDetailMetric, upsertDetailRecord } from "@/lib/api/details";

const EMPTY_PARSED: ParsedWorkbook = { kpiRows: [], metricRows: [], recordRows: [], periodsFound: [], sheetsFound: [] };

const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

function errMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  if (err && typeof err === "object" && "message" in err && typeof (err as { message: unknown }).message === "string") {
    return (err as { message: string }).message;
  }
  return String(err);
}

export function DataEntry({ onNavigate }: { onNavigate: (id: ScreenId) => void }) {
  const { entityId, userName } = useSession();
  const { submit, submissions, editSubmission } = useWorkflow();
  const { refresh } = useDetails();

  const [fileName, setFileName] = useState<string | null>(null);
  const [parsing, setParsing] = useState(false);
  const [parseError, setParseError] = useState<string | null>(null);
  const [parsed, setParsed] = useState<ParsedWorkbook>(EMPTY_PARSED);
  const [submittingParsed, setSubmittingParsed] = useState(false);
  const [submitProgress, setSubmitProgress] = useState({ done: 0, total: 0 });
  const [editingSubId, setEditingSubId] = useState<string | null>(null);
  const [editingSubValue, setEditingSubValue] = useState("");

  const mySubmissions = useMemo(
    () => submissions.filter((s) => s.submittedBy === userName || s.entityId === entityId).slice(0, 12),
    [submissions, userName, entityId]
  );

  const totalRows = parsed.kpiRows.length + parsed.metricRows.length + parsed.recordRows.length;

  const handleFileChange = async (file: File | undefined) => {
    if (!file) return;
    setFileName(file.name);
    setParsing(true);
    setParseError(null);
    setParsed(EMPTY_PARSED);
    try {
      const result = await parseWorkbook(file);
      setParsed(result);
      if (result.kpiRows.length === 0 && result.metricRows.length === 0 && result.recordRows.length === 0) {
        setParseError("Nothing recognized in this file — check it's built from the standard 3-pillar template (Corporate Performance / Financial Health / Resource & People sheets) with quarter columns matching a real reporting period label.");
      }
    } catch (err) {
      setParseError(err instanceof Error ? err.message : "Couldn't read this file.");
    } finally {
      setParsing(false);
    }
  };

  const handleSubmitParsed = async () => {
    if (totalRows === 0) return;
    setSubmittingParsed(true);
    setSubmitProgress({ done: 0, total: totalRows });

    for (const row of parsed.kpiRows) {
      submit({ kpiId: row.kpiId, entityId, periodId: row.periodId, value: row.value, note: row.note, source: "excel-upload", submittedBy: userName || "reporting.officer" });
      setSubmitProgress((p) => ({ ...p, done: p.done + 1 }));
    }

    let detailSaved = 0;
    for (const row of parsed.metricRows) {
      try {
        await upsertDetailMetric({ entityId, periodId: row.periodId, metricKey: row.metricKey, dimension: row.dimension, dimension2: row.dimension2, value: row.value });
        detailSaved++;
      } catch (err) {
        toast.error(`Couldn't save ${row.metricKey}/${row.dimension}`, { description: errMessage(err) });
      }
      setSubmitProgress((p) => ({ ...p, done: p.done + 1 }));
    }
    for (const row of parsed.recordRows) {
      try {
        await upsertDetailRecord({
          id: `TPL-${row.recordType}-${slug(row.label)}-${row.periodId}`,
          entityId, periodId: row.periodId, recordType: row.recordType,
          label: row.label, category: row.category || null, valueNum: row.value,
        });
        detailSaved++;
      } catch (err) {
        toast.error(`Couldn't save ${row.recordType}/${row.label}`, { description: errMessage(err) });
      }
      setSubmitProgress((p) => ({ ...p, done: p.done + 1 }));
    }
    if (detailSaved > 0) await refresh();
    setSubmittingParsed(false);

    const periodLabels = parsed.periodsFound.map((id) => periodById(id).label).join(", ");
    const parts: string[] = [];
    if (parsed.kpiRows.length > 0) parts.push(`${parsed.kpiRows.length} KPI update${parsed.kpiRows.length > 1 ? "s" : ""} routed to the checker queue`);
    if (detailSaved > 0) parts.push(`${detailSaved} detail figure${detailSaved > 1 ? "s" : ""} saved directly to the dashboards`);
    if (parts.length > 0) {
      toast.success("Upload processed", { description: `${fileName} · ${periodLabels} — ${parts.join("; ")}.` });
    }
    setFileName(null);
    setParsed(EMPTY_PARSED);
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
      <ScreenHeader id="DATA_ENTRY" subtitle="Upload the 3-pillar Excel template — each quarter column in the file is written to its own reporting period, in one pass." onNavigate={onNavigate} />

      <div className="mb-5">
        <InfoNote>
          The template carries its own reporting-period columns (Q2 FY2025 through Q2 FY2026 by default) —
          there's no period to pick here first. Leave a cell blank for any quarter a figure genuinely wasn't
          measured (e.g. <b>KPI4</b> outside Q4, or <b>KPI5</b>'s bi-annual survey outside Q2/Q4) rather than
          entering a placeholder value.
        </InfoNote>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1.6fr_1fr] gap-5">
        <div className="rounded-lg border border-[hsl(var(--pk-border))] bg-[hsl(var(--pk-surface))] shadow-card p-5 flex flex-col gap-4 h-fit">
          <div className="flex flex-col gap-2">
            <span className="text-[11px] uppercase tracking-wide text-[hsl(var(--pk-ink-faint))]">Completed 3-pillar Excel template</span>
            <label className="flex flex-col items-center justify-center gap-1.5 rounded-md border border-dashed border-[hsl(var(--pk-border))] py-6 cursor-pointer hover:border-[hsl(var(--pk-accent))] transition-colors">
              <UploadCloud className="h-5 w-5 text-[hsl(var(--pk-ink-faint))]" />
              <span className="text-xs text-[hsl(var(--pk-ink-faint))]">{parsing ? "Reading file…" : (fileName ?? "Click to choose a .xlsx file")}</span>
              <input type="file" accept=".xlsx,.xls" className="hidden" onChange={(e) => handleFileChange(e.target.files?.[0])} />
            </label>
          </div>

          {parseError && (
            <div className="rounded-md border border-[hsl(var(--pk-bad))] bg-[hsl(var(--pk-bad-soft))] px-3 py-2 text-xs text-[hsl(var(--pk-bad))]">{parseError}</div>
          )}

          {parsed.periodsFound.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-[11px] uppercase tracking-wide text-[hsl(var(--pk-ink-faint))] mr-1">Periods found</span>
              {parsed.periodsFound.map((id) => (
                <span key={id} className="text-[11px] font-medium rounded-full px-2 py-0.5 bg-[hsl(var(--pk-navy-soft))] text-[hsl(var(--pk-navy))]">{periodById(id).label}</span>
              ))}
            </div>
          )}

          {parsed.kpiRows.length > 0 && (
            <div className="flex flex-col gap-2">
              <span className="text-[11px] uppercase tracking-wide text-[hsl(var(--pk-ink-faint))]">
                KPI Scorecard — {parsed.kpiRows.length} value{parsed.kpiRows.length > 1 ? "s" : ""} across {parsed.periodsFound.length} period{parsed.periodsFound.length > 1 ? "s" : ""}
              </span>
              <div className="rounded-md border border-[hsl(var(--pk-border))] divide-y divide-[hsl(var(--pk-border))] max-h-48 overflow-y-auto">
                {parsed.kpiRows.map((row, i) => {
                  const k = kpiById(row.kpiId);
                  return (
                    <div key={`${row.kpiId}-${row.periodId}-${i}`} className="flex items-center justify-between gap-2 px-3 py-1.5 text-sm">
                      <span className="text-[hsl(var(--pk-ink))]">KPI {row.kpiNo} — {k.name} <span className="text-[hsl(var(--pk-ink-faint))]">· {periodById(row.periodId).label}</span></span>
                      <span className="tnum font-medium">{row.value}{k.unit === "%" ? "%" : ""}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {(parsed.metricRows.length > 0 || parsed.recordRows.length > 0) && (
            <div className="flex flex-col gap-2">
              <span className="text-[11px] uppercase tracking-wide text-[hsl(var(--pk-ink-faint))]">
                {parsed.sheetsFound.join(", ")} — {parsed.metricRows.length + parsed.recordRows.length} detail figure{parsed.metricRows.length + parsed.recordRows.length > 1 ? "s" : ""}
              </span>
              <div className="rounded-md border border-[hsl(var(--pk-border))] divide-y divide-[hsl(var(--pk-border))] max-h-48 overflow-y-auto">
                {parsed.metricRows.map((row, i) => (
                  <div key={`m-${i}`} className="flex items-center justify-between gap-2 px-3 py-1.5 text-sm">
                    <span className="text-[hsl(var(--pk-ink))]">{row.metricKey} / {row.dimension}{row.dimension2 ? ` / ${row.dimension2}` : ""} <span className="text-[hsl(var(--pk-ink-faint))]">· {periodById(row.periodId).label}</span></span>
                    <span className="tnum font-medium">{row.value}</span>
                  </div>
                ))}
                {parsed.recordRows.map((row, i) => (
                  <div key={`r-${i}`} className="flex items-center justify-between gap-2 px-3 py-1.5 text-sm">
                    <span className="text-[hsl(var(--pk-ink))]">{row.recordType} / {row.label} <span className="text-[hsl(var(--pk-ink-faint))]">· {periodById(row.periodId).label}</span></span>
                    <span className="tnum font-medium">{row.value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <button
            onClick={handleSubmitParsed}
            disabled={totalRows === 0 || submittingParsed}
            className="mt-1 inline-flex items-center justify-center gap-2 rounded-md bg-[hsl(var(--pk-accent))] text-[hsl(var(--pk-accent-ink))] font-medium text-sm py-2.5 hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Send className="h-4 w-4" />{submittingParsed ? "Submitting…" : `Submit ${totalRows} extracted value${totalRows === 1 ? "" : "s"}`}
          </button>
          {submittingParsed && (
            <div className="flex flex-col gap-1">
              <div className="h-1.5 w-full rounded-full bg-[hsl(var(--pk-border))] overflow-hidden">
                <div
                  className="h-full rounded-full bg-[hsl(var(--pk-accent))] transition-[width] duration-200 ease-out"
                  style={{ width: `${submitProgress.total > 0 ? Math.round((submitProgress.done / submitProgress.total) * 100) : 0}%` }}
                />
              </div>
              <span className="text-[11px] text-[hsl(var(--pk-ink-faint))] tnum">
                {submitProgress.done} / {submitProgress.total} saved ({submitProgress.total > 0 ? Math.round((submitProgress.done / submitProgress.total) * 100) : 0}%)
              </span>
            </div>
          )}
          <InfoNote>Parsed entirely in your browser — the file itself isn't uploaded anywhere. KPI values go through the checker queue; everything else saves directly to the dashboards. Sheets recognized: Corporate Performance, Financial Health, Resource & People. Initiative catalogs, related-party transactions, and the PBT/CIR breakdown drill-down aren't in this template — those stay entered directly in-app. Monthly-resolution financial figures (feeding PFH002's Quarterly/Monthly toggle) also aren't covered yet.</InfoNote>
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
