import { useMemo, useState } from "react";
import { toast } from "sonner";
import { FileSpreadsheet, PenLine, Send, UploadCloud } from "lucide-react";
import { ScreenHeader } from "@/components/pk/ScreenHeader";
import { WorkflowChip } from "@/components/pk/StatusChip";
import { InfoNote } from "@/components/pk/Misc";
import type { ScreenId } from "@/lib/nav";
import { useSession } from "@/lib/session";
import { useWorkflow } from "@/lib/workflow";
import { perspectives } from "@/data/perspectives";
import { kpisByPerspective, kpiById } from "@/data/kpis";
import { periods } from "@/data/periods";
import { cn } from "@/lib/utils";

export function DataEntry({ onNavigate }: { onNavigate: (id: ScreenId) => void }) {
  const { entityId, userName } = useSession();
  const { submit, submissions } = useWorkflow();

  const [channel, setChannel] = useState<"web-form" | "excel-upload">("web-form");
  const [perspectiveId, setPerspectiveId] = useState(perspectives[0].id);
  const kpiOptions = kpisByPerspective(perspectiveId);
  const [kpiId, setKpiId] = useState(kpiOptions[0]?.id ?? "");
  const [periodId, setPeriodIdLocal] = useState(periods.find((p) => p.isOpenForEntry)?.id ?? periods[0].id);
  const [value, setValue] = useState("");
  const [note, setNote] = useState("");
  const [fileName, setFileName] = useState<string | null>(null);

  const openPeriods = periods.filter((p) => p.isOpenForEntry);
  const kpi = kpiId ? kpiById(kpiId) : undefined;

  const mySubmissions = useMemo(
    () => submissions.filter((s) => s.submittedBy === userName || s.entityId === entityId).slice(0, 12),
    [submissions, userName, entityId]
  );

  const resetForm = () => {
    setValue("");
    setNote("");
    setFileName(null);
  };

  const handlePerspectiveChange = (pid: string) => {
    setPerspectiveId(pid as typeof perspectiveId);
    const first = kpisByPerspective(pid)[0];
    setKpiId(first?.id ?? "");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!kpi || value.trim() === "") {
      toast.error("Enter a value before submitting.");
      return;
    }
    const numeric = Number(value);
    if (Number.isNaN(numeric)) {
      toast.error("Value must be numeric.");
      return;
    }
    submit({
      kpiId: kpi.id,
      entityId,
      periodId,
      value: numeric,
      note: channel === "excel-upload" ? `${note} ${fileName ? `(from ${fileName})` : ""}`.trim() : note,
      source: channel,
      submittedBy: userName || "reporting.officer",
    });
    toast.success("Submitted for verification", {
      description: `${kpi.name} · ${periods.find((p) => p.id === periodId)?.label} — routed to the checker queue.`,
    });
    resetForm();
  };

  return (
    <div>
      <ScreenHeader id="DATA_ENTRY" subtitle="Submit a KPI update — via the web form or by uploading the approved Excel template. Both channels feed the same Verify & Publish queue." onNavigate={onNavigate} />

      <div className="flex items-center gap-1 mb-5 border border-[hsl(var(--pk-border))] rounded-lg p-1 w-fit bg-[hsl(var(--pk-surface))]">
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

      <div className="grid grid-cols-1 lg:grid-cols-[1.1fr_0.9fr] gap-5">
        <form onSubmit={handleSubmit} className="rounded-lg border border-[hsl(var(--pk-border))] bg-[hsl(var(--pk-surface))] p-5 flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-3">
            <label className="flex flex-col gap-1">
              <span className="text-[11px] uppercase tracking-wide text-[hsl(var(--pk-ink-faint))]">Perspective</span>
              <select value={perspectiveId} onChange={(e) => handlePerspectiveChange(e.target.value)} className="rounded-md border border-[hsl(var(--pk-border))] px-2.5 py-2 text-sm bg-transparent outline-none focus:border-[hsl(var(--pk-accent))]">
                {perspectives.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-[11px] uppercase tracking-wide text-[hsl(var(--pk-ink-faint))]">Reporting period</span>
              <select value={periodId} onChange={(e) => setPeriodIdLocal(e.target.value as typeof periodId)} className="rounded-md border border-[hsl(var(--pk-border))] px-2.5 py-2 text-sm bg-transparent outline-none focus:border-[hsl(var(--pk-accent))]">
                {openPeriods.map((p) => <option key={p.id} value={p.id}>{p.label}</option>)}
              </select>
            </label>
          </div>

          <label className="flex flex-col gap-1">
            <span className="text-[11px] uppercase tracking-wide text-[hsl(var(--pk-ink-faint))]">KPI</span>
            <select value={kpiId} onChange={(e) => setKpiId(e.target.value)} className="rounded-md border border-[hsl(var(--pk-border))] px-2.5 py-2 text-sm bg-transparent outline-none focus:border-[hsl(var(--pk-accent))]">
              {kpiOptions.map((k) => <option key={k.id} value={k.id}>KPI {k.no} — {k.name}</option>)}
            </select>
            {kpi && <span className="text-[11px] text-[hsl(var(--pk-ink-faint))]">Data owner: {kpi.dataOwner} · {kpi.formulaNote}</span>}
          </label>

          {channel === "web-form" ? (
            <label className="flex flex-col gap-1">
              <span className="text-[11px] uppercase tracking-wide text-[hsl(var(--pk-ink-faint))]">YTD Actual value {kpi ? `(${kpi.unit})` : ""}</span>
              <input
                value={value}
                onChange={(e) => setValue(e.target.value)}
                type="number"
                step="any"
                placeholder={kpi?.unit === "%" ? "e.g. 44.2" : "e.g. 27.5"}
                className="rounded-md border border-[hsl(var(--pk-border))] px-2.5 py-2 text-sm bg-transparent outline-none focus:border-[hsl(var(--pk-accent))] tnum"
              />
            </label>
          ) : (
            <div className="flex flex-col gap-2">
              <span className="text-[11px] uppercase tracking-wide text-[hsl(var(--pk-ink-faint))]">Completed Excel template</span>
              <label className="flex flex-col items-center justify-center gap-1.5 rounded-md border border-dashed border-[hsl(var(--pk-border))] py-6 cursor-pointer hover:border-[hsl(var(--pk-accent))] transition-colors">
                <UploadCloud className="h-5 w-5 text-[hsl(var(--pk-ink-faint))]" />
                <span className="text-xs text-[hsl(var(--pk-ink-faint))]">{fileName ?? "Click to choose a .xlsx file"}</span>
                <input type="file" accept=".xlsx,.xls" className="hidden" onChange={(e) => setFileName(e.target.files?.[0]?.name ?? null)} />
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-[11px] uppercase tracking-wide text-[hsl(var(--pk-ink-faint))]">YTD Actual value read from template {kpi ? `(${kpi.unit})` : ""}</span>
                <input
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                  type="number"
                  step="any"
                  placeholder="Value extracted from the uploaded file"
                  className="rounded-md border border-[hsl(var(--pk-border))] px-2.5 py-2 text-sm bg-transparent outline-none focus:border-[hsl(var(--pk-accent))] tnum"
                />
              </label>
            </div>
          )}

          <label className="flex flex-col gap-1">
            <span className="text-[11px] uppercase tracking-wide text-[hsl(var(--pk-ink-faint))]">Note to checker (optional)</span>
            <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={2} className="rounded-md border border-[hsl(var(--pk-border))] px-2.5 py-2 text-sm bg-transparent outline-none focus:border-[hsl(var(--pk-accent))]" placeholder="Context for the reviewer, e.g. source document or explanation of variance." />
          </label>

          <button type="submit" className="mt-1 inline-flex items-center justify-center gap-2 rounded-md bg-[hsl(var(--pk-accent))] text-[hsl(var(--pk-accent-ink))] font-medium text-sm py-2.5 hover:opacity-90 transition-opacity">
            <Send className="h-4 w-4" />Submit for verification
          </button>
          <InfoNote>Status moves to <b>Submitted</b>. Nothing reaches a dashboard until a checker reviews it in Verify &amp; Publish.</InfoNote>
        </form>

        <div className="rounded-lg border border-[hsl(var(--pk-border))] bg-[hsl(var(--pk-surface))] p-4">
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
