import { Fragment, useMemo, useState } from "react";
import { toast } from "sonner";
import { FileSpreadsheet, PenLine, Send, UploadCloud } from "lucide-react";
import { ScreenHeader } from "@/components/pk/ScreenHeader";
import { WorkflowChip } from "@/components/pk/StatusChip";
import { InfoNote } from "@/components/pk/Misc";
import type { ScreenId } from "@/lib/nav";
import { useSession } from "@/lib/session";
import { useWorkflow } from "@/lib/workflow";
import { perspectives } from "@/data/perspectives";
import { kpisByPerspective, kpiById, type KpiExt } from "@/data/kpis";
import { periods } from "@/data/periods";
import { cn } from "@/lib/utils";

type Entries = Record<string, { value: string; note: string }>;

export function DataEntry({ onNavigate }: { onNavigate: (id: ScreenId) => void }) {
  const { entityId, userName, periodId: sessionPeriodId } = useSession();
  const { submit, submissions, latestValue } = useWorkflow();

  const [channel, setChannel] = useState<"web-form" | "excel-upload">("web-form");
  const openPeriods = periods.filter((p) => p.isOpenForEntry);
  const [periodId, setPeriodIdLocal] = useState(
    openPeriods.some((p) => p.id === sessionPeriodId) ? sessionPeriodId : (openPeriods[0]?.id ?? periods[0].id)
  );
  const [entries, setEntries] = useState<Entries>({});
  const [fileName, setFileName] = useState<string | null>(null);
  const [fileNote, setFileNote] = useState("");

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

  const handleFileSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fileName) {
      toast.error("Choose a completed .xlsx template before submitting.");
      return;
    }
    toast.success("Template received", {
      description: `${fileName} — ${periods.find((p) => p.id === periodId)?.label}. A PMO reviewer will extract and route each KPI value from the checker queue.`,
    });
    setFileName(null);
    setFileNote("");
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

      <div className="grid grid-cols-1 lg:grid-cols-[1.6fr_1fr] gap-5">
        {channel === "web-form" ? (
          <div className="rounded-lg border border-[hsl(var(--pk-border))] bg-[hsl(var(--pk-surface))] p-5 flex flex-col gap-4">
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
        ) : (
          <form onSubmit={handleFileSubmit} className="rounded-lg border border-[hsl(var(--pk-border))] bg-[hsl(var(--pk-surface))] p-5 flex flex-col gap-4 h-fit">
            <div className="flex flex-col gap-2">
              <span className="text-[11px] uppercase tracking-wide text-[hsl(var(--pk-ink-faint))]">Completed Excel template — all KPIs, {periods.find((p) => p.id === periodId)?.label}</span>
              <label className="flex flex-col items-center justify-center gap-1.5 rounded-md border border-dashed border-[hsl(var(--pk-border))] py-6 cursor-pointer hover:border-[hsl(var(--pk-accent))] transition-colors">
                <UploadCloud className="h-5 w-5 text-[hsl(var(--pk-ink-faint))]" />
                <span className="text-xs text-[hsl(var(--pk-ink-faint))]">{fileName ?? "Click to choose a .xlsx file"}</span>
                <input type="file" accept=".xlsx,.xls" className="hidden" onChange={(e) => setFileName(e.target.files?.[0]?.name ?? null)} />
              </label>
            </div>
            <label className="flex flex-col gap-1">
              <span className="text-[11px] uppercase tracking-wide text-[hsl(var(--pk-ink-faint))]">Note to checker (optional)</span>
              <textarea value={fileNote} onChange={(e) => setFileNote(e.target.value)} rows={2} className="rounded-md border border-[hsl(var(--pk-border))] px-2.5 py-2 text-sm bg-transparent outline-none focus:border-[hsl(var(--pk-accent))]" placeholder="Context for the reviewer, e.g. which department compiled this." />
            </label>
            <button type="submit" className="mt-1 inline-flex items-center justify-center gap-2 rounded-md bg-[hsl(var(--pk-accent))] text-[hsl(var(--pk-accent-ink))] font-medium text-sm py-2.5 hover:opacity-90 transition-opacity">
              <Send className="h-4 w-4" />Submit template
            </button>
            <InfoNote>Prototype only — the uploaded file is logged for the PMO to extract manually. Automatic per-KPI parsing isn't wired up yet, so use the web form for entries that need to land on the dashboard.</InfoNote>
          </form>
        )}

        <div className="rounded-lg border border-[hsl(var(--pk-border))] bg-[hsl(var(--pk-surface))] p-4 h-fit">
          <div className="text-[11px] uppercase tracking-wide text-[hsl(var(--pk-ink-faint))] mb-3">Recent submissions — this pillar</div>
          {mySubmissions.length === 0 ? (
            <p className="text-sm text-[hsl(var(--pk-ink-faint))]">No submissions yet. Once you submit, it'll appear here with its review status.</p>
          ) : (
            <div className="flex flex-col divide-y divide-[hsl(var(--pk-border))]">
              {mySubmissions.map((s) => {
                const k = kpiById(s.kpiId);
                return (
                  <div key={s.id} className="py-2.5">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-medium text-[hsl(var(--pk-ink))]">{k.name}</span>
                      <WorkflowChip status={s.status} />
                    </div>
                    <div className="text-[11px] text-[hsl(var(--pk-ink-faint))] mt-0.5">
                      {periods.find((p) => p.id === s.periodId)?.label} · {s.value}{k.unit === "%" ? "%" : ""} · {s.source === "web-form" ? "Web form" : "Excel upload"} · {new Date(s.submittedAt).toLocaleDateString()}
                    </div>
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
