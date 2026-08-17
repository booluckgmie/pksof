import { useState } from "react";
import { toast } from "sonner";
import { Check, X, FileSpreadsheet, PenLine, History, Inbox, CheckCheck, Pencil } from "lucide-react";
import { ScreenHeader } from "@/components/pk/ScreenHeader";
import { WorkflowChip } from "@/components/pk/StatusChip";
import { NoDataState } from "@/components/pk/DataOrigin";
import type { ScreenId } from "@/lib/nav";
import { useSession } from "@/lib/session";
import { useWorkflow } from "@/lib/workflow";
import { kpiById } from "@/data/kpis";
import { entityById } from "@/data/entities";
import { periodById } from "@/data/periods";
import { cn } from "@/lib/utils";
import type { Submission } from "@/types";

function SourceTag({ source }: { source: Submission["source"] }) {
  return source === "web-form" ? (
    <span className="inline-flex items-center gap-1 text-[11px] text-[hsl(var(--pk-ink-faint))]"><PenLine className="h-3 w-3" />Web form</span>
  ) : (
    <span className="inline-flex items-center gap-1 text-[11px] text-[hsl(var(--pk-ink-faint))]"><FileSpreadsheet className="h-3 w-3" />Excel upload</span>
  );
}

export function VerifyPublish({ onNavigate }: { onNavigate: (id: ScreenId) => void }) {
  const { userName } = useSession();
  const { pending, submissions, approve, approveAll, reject, editSubmission } = useWorkflow();
  const [tab, setTab] = useState<"pending" | "audit">("pending");
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [reason, setReason] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const [editNote, setEditNote] = useState("");

  const handleApprove = (id: string, name: string) => {
    approve(id, userName || "checker", "Verified against source documents.");
    toast.success("Published", { description: `${name} is now live on the dashboard.` });
  };

  const handleApproveAll = () => {
    const count = pending.length;
    approveAll(userName || "checker", "Bulk approved — verified against source documents.");
    toast.success(`Published ${count} submission${count > 1 ? "s" : ""}`, { description: "All pending items are now live on the dashboards." });
  };

  const confirmReject = (id: string) => {
    if (!reason.trim()) {
      toast.error("Give the submitter a reason before rejecting.");
      return;
    }
    reject(id, userName || "checker", reason.trim());
    toast("Rejected", { description: "Sent back to the submitter with your note." });
    setRejectingId(null);
    setReason("");
  };

  const startEdit = (s: Submission) => {
    setEditingId(s.id);
    setEditValue(String(s.value));
    setEditNote(s.note);
  };

  const saveEdit = (id: string) => {
    const numeric = Number(editValue);
    if (editValue.trim() === "" || Number.isNaN(numeric)) {
      toast.error("Value must be numeric.");
      return;
    }
    editSubmission(id, numeric, editNote);
    toast.success("Value updated");
    setEditingId(null);
  };

  const history = [...submissions].sort((a, b) => b.submittedAt.localeCompare(a.submittedAt));

  return (
    <div>
      <ScreenHeader id="VERIFY_PUBLISH" subtitle="The data-integrity control before anything reaches a dashboard — approve to publish, or reject back to the submitter." onNavigate={onNavigate} />

      <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
        <div className="flex items-center gap-1 border border-[hsl(var(--pk-border))] rounded-lg p-1 w-fit bg-[hsl(var(--pk-surface))]">
          <button onClick={() => setTab("pending")} className={cn("flex items-center gap-1.5 rounded-md px-3 py-1.5 text-[13px] font-medium transition-colors", tab === "pending" ? "bg-[hsl(var(--pk-accent))] text-[hsl(var(--pk-accent-ink))]" : "text-[hsl(var(--pk-ink-faint))] hover:text-[hsl(var(--pk-ink))]")}>
            <Inbox className="h-3.5 w-3.5" />Pending verification {pending.length > 0 && <span className="ml-0.5 tnum">({pending.length})</span>}
          </button>
          <button onClick={() => setTab("audit")} className={cn("flex items-center gap-1.5 rounded-md px-3 py-1.5 text-[13px] font-medium transition-colors", tab === "audit" ? "bg-[hsl(var(--pk-accent))] text-[hsl(var(--pk-accent-ink))]" : "text-[hsl(var(--pk-ink-faint))] hover:text-[hsl(var(--pk-ink))]")}>
            <History className="h-3.5 w-3.5" />Audit trail
          </button>
        </div>
        {tab === "pending" && pending.length > 1 && (
          <button
            onClick={handleApproveAll}
            className="inline-flex items-center gap-1.5 rounded-md bg-[hsl(var(--pk-good))] text-white text-xs font-medium px-3 py-1.5 hover:opacity-90 transition-opacity"
          >
            <CheckCheck className="h-3.5 w-3.5" />Approve All ({pending.length})
          </button>
        )}
      </div>

      {tab === "pending" ? (
        pending.length === 0 ? (
          <NoDataState title="Nothing awaiting verification" body="Submissions made via Data Entry — web form or Excel template upload — will appear here for Approve or Reject." />
        ) : (
          <div className="flex flex-col gap-3">
            {pending.map((s) => {
              const k = kpiById(s.kpiId);
              const e = entityById(s.entityId);
              const p = periodById(s.periodId);
              return (
                <div key={s.id} className="rounded-lg border border-[hsl(var(--pk-border))] bg-[hsl(var(--pk-surface))] shadow-card p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-head font-semibold text-[hsl(var(--pk-ink))]">{k.name}</span>
                        <WorkflowChip status={s.status} />
                        <SourceTag source={s.source} />
                      </div>
                      <div className="text-[11.5px] text-[hsl(var(--pk-ink-faint))] mt-1">
                        {e.fullName} · {p.label} · submitted by {s.submittedBy} · {new Date(s.submittedAt).toLocaleString()}
                      </div>
                    </div>
                    {editingId === s.id ? (
                      <input
                        value={editValue}
                        onChange={(ev) => setEditValue(ev.target.value)}
                        type="number"
                        step="any"
                        autoFocus
                        className="tnum font-head text-xl font-semibold text-[hsl(var(--pk-ink))] w-32 text-right rounded-md border border-[hsl(var(--pk-accent))] px-2 py-1 bg-transparent outline-none"
                      />
                    ) : (
                      <div className="tnum font-head text-xl font-semibold text-[hsl(var(--pk-ink))]">
                        {s.value}{k.unit === "%" ? "%" : k.unit === "RM mil" ? " RM'm" : ""}
                      </div>
                    )}
                  </div>
                  {editingId === s.id ? (
                    <textarea
                      value={editNote}
                      onChange={(ev) => setEditNote(ev.target.value)}
                      rows={2}
                      placeholder="Note to checker (optional)"
                      className="mt-2 w-full rounded-md border border-[hsl(var(--pk-border))] px-2.5 py-2 text-sm bg-transparent outline-none focus:border-[hsl(var(--pk-accent))]"
                    />
                  ) : (
                    s.note && <p className="text-sm text-[hsl(var(--pk-ink-soft))] mt-2 bg-[hsl(var(--pk-surface-2))] rounded-md px-3 py-2">{s.note}</p>
                  )}

                  {editingId === s.id ? (
                    <div className="flex items-center gap-2 mt-3">
                      <button onClick={() => saveEdit(s.id)} className="inline-flex items-center gap-1.5 rounded-md bg-[hsl(var(--pk-accent))] text-[hsl(var(--pk-accent-ink))] text-xs font-medium px-3 py-1.5 hover:opacity-90 transition-opacity">
                        <Check className="h-3.5 w-3.5" />Save value
                      </button>
                      <button onClick={() => setEditingId(null)} className="text-xs text-[hsl(var(--pk-ink-faint))] px-2">Cancel</button>
                    </div>
                  ) : rejectingId === s.id ? (
                    <div className="mt-3 flex flex-col gap-2">
                      <textarea
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                        rows={2}
                        autoFocus
                        placeholder="Reason for rejection — sent back to the submitter."
                        className="rounded-md border border-[hsl(var(--pk-bad))] px-2.5 py-2 text-sm bg-transparent outline-none"
                      />
                      <div className="flex items-center gap-2">
                        <button onClick={() => confirmReject(s.id)} className="rounded-md bg-[hsl(var(--pk-bad))] text-white text-xs font-medium px-3 py-1.5">Confirm rejection</button>
                        <button onClick={() => { setRejectingId(null); setReason(""); }} className="text-xs text-[hsl(var(--pk-ink-faint))] px-2">Cancel</button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 mt-3">
                      <button onClick={() => handleApprove(s.id, k.name)} className="inline-flex items-center gap-1.5 rounded-md bg-[hsl(var(--pk-good))] text-white text-xs font-medium px-3 py-1.5 hover:opacity-90 transition-opacity">
                        <Check className="h-3.5 w-3.5" />Approve &amp; Publish
                      </button>
                      <button onClick={() => startEdit(s)} className="inline-flex items-center gap-1.5 rounded-md border border-[hsl(var(--pk-border))] text-[hsl(var(--pk-ink-soft))] text-xs font-medium px-3 py-1.5 hover:bg-[hsl(var(--pk-surface-2))] transition-colors">
                        <Pencil className="h-3.5 w-3.5" />Edit value
                      </button>
                      <button onClick={() => setRejectingId(s.id)} className="inline-flex items-center gap-1.5 rounded-md border border-[hsl(var(--pk-bad))] text-[hsl(var(--pk-bad))] text-xs font-medium px-3 py-1.5 hover:bg-[hsl(var(--pk-bad-soft))] transition-colors">
                        <X className="h-3.5 w-3.5" />Reject
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )
      ) : history.length === 0 ? (
        <NoDataState title="No activity yet" body="Every submit, approve, reject and publish event will be logged here — who, what, and when." />
      ) : (
        <div className="rounded-lg border border-[hsl(var(--pk-border))] bg-[hsl(var(--pk-surface))] shadow-card overflow-x-auto">
          <table className="w-full text-sm min-w-[760px]">
            <thead>
              <tr className="text-[11px] uppercase tracking-wide text-[hsl(var(--pk-ink-faint))] bg-[hsl(var(--pk-surface-2))]">
                <th className="text-left font-medium px-3 py-2">KPI</th>
                <th className="text-left font-medium px-3 py-2">Entity / Period</th>
                <th className="text-right font-medium px-3 py-2">Value</th>
                <th className="text-left font-medium px-3 py-2">Submitted</th>
                <th className="text-left font-medium px-3 py-2">Reviewed</th>
                <th className="text-left font-medium px-3 py-2">Status</th>
              </tr>
            </thead>
            <tbody>
              {history.map((s) => {
                const k = kpiById(s.kpiId);
                const e = entityById(s.entityId);
                const p = periodById(s.periodId);
                return (
                  <tr key={s.id} className="border-t border-[hsl(var(--pk-border))]">
                    <td className="px-3 py-2 text-[hsl(var(--pk-ink))]">{k.name}<div className="font-mono-pk text-[10px] text-[hsl(var(--pk-ink-faint))]">{s.id}</div></td>
                    <td className="px-3 py-2 text-[hsl(var(--pk-ink-soft))]">{e.name} · {p.label}</td>
                    <td className="px-3 py-2 text-right tnum">{s.value}</td>
                    <td className="px-3 py-2 text-[11px] text-[hsl(var(--pk-ink-faint))]">{s.submittedBy}<br />{new Date(s.submittedAt).toLocaleString()}</td>
                    <td className="px-3 py-2 text-[11px] text-[hsl(var(--pk-ink-faint))]">{s.reviewedBy ? <>{s.reviewedBy}<br />{s.reviewedAt && new Date(s.reviewedAt).toLocaleString()}</> : "—"}</td>
                    <td className="px-3 py-2"><WorkflowChip status={s.status} /></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
