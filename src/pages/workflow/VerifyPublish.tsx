import { Fragment, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Check, X, FileSpreadsheet, PenLine, History, Inbox, CheckCheck, Pencil, Search, ChevronLeft, ChevronRight, ChevronDown, UploadCloud, Loader2, Activity as ActivityIcon, LogIn, UploadIcon, Send, CircleCheck, CircleX, AlertTriangle } from "lucide-react";
import { ScreenHeader } from "@/components/pk/ScreenHeader";
import { WorkflowChip } from "@/components/pk/StatusChip";
import { NoDataState } from "@/components/pk/DataOrigin";
import type { ScreenId } from "@/lib/nav";
import { useSession } from "@/lib/session";
import { useWorkflow } from "@/lib/workflow";
import { useOrgSettings } from "@/lib/orgSettings";
import { kpiById } from "@/data/kpis";
import { entityById, entities } from "@/data/entities";
import { periodById, resolveCurrentPeriodId } from "@/data/periods";
import { roleById } from "@/lib/roles";
import { cn } from "@/lib/utils";
import type { Submission } from "@/types";
import { fetchUploadEvents, fetchUploadEventRows, type UploadEvent, type UploadEventRow } from "@/lib/api/uploads";
import { fetchActivityEvents, type ActivityEvent } from "@/lib/api/activity";

const PAGE_SIZE = 10;

function matchesSearch(s: Submission, query: string): boolean {
  if (!query.trim()) return true;
  const k = kpiById(s.kpiId);
  const e = entityById(s.entityId);
  const p = periodById(s.periodId);
  const haystack = `${k.name} ${e.fullName} ${e.name} ${p.label} ${s.id} ${s.submittedBy} ${s.reviewedBy ?? ""}`.toLowerCase();
  return haystack.includes(query.trim().toLowerCase());
}

function matchesUploadSearch(u: UploadEvent, query: string): boolean {
  if (!query.trim()) return true;
  const e = entityById(u.entityId);
  const haystack = `${u.fileName} ${e.fullName} ${e.name} ${u.sheets} ${u.periods} ${u.uploadedBy} ${u.id}`.toLowerCase();
  return haystack.includes(query.trim().toLowerCase());
}

const DEST_LABEL: Record<UploadEventRow["dest"], string> = { kpi: "KPI Scorecard", metric: "Detail metric", record: "Detail record" };

type ActivityKind = "login" | "submit" | "approve" | "reject" | "upload";

interface ActivityFeedItem {
  id: string;
  at: string;
  kind: ActivityKind;
  who: string;
  role: string | null;
  entityId: string | null;
  detail: string;
}

const ACTIVITY_ICON: Record<ActivityKind, typeof LogIn> = {
  login: LogIn,
  submit: Send,
  approve: CircleCheck,
  reject: CircleX,
  upload: UploadIcon,
};
const ACTIVITY_LABEL: Record<ActivityKind, string> = {
  login: "Signed in",
  submit: "Submitted",
  approve: "Approved & published",
  reject: "Rejected",
  upload: "Uploaded file",
};
const ACTIVITY_COLOR: Record<ActivityKind, string> = {
  login: "text-[hsl(var(--pk-ink-faint))]",
  submit: "text-[hsl(var(--pk-accent))]",
  approve: "text-[hsl(var(--pk-good))]",
  reject: "text-[hsl(var(--pk-bad))]",
  upload: "text-[hsl(var(--pk-accent))]",
};

/** Merges the three separate write paths (sign-ins, the maker-checker submission queue, Excel
 * uploads) into one chronological "who did what, when" feed — each of those already has its own
 * table/tab for its own detail, this just gives a single timeline across all of them. */
function buildActivityFeed(logins: ActivityEvent[], submissions: Submission[], uploads: UploadEvent[]): ActivityFeedItem[] {
  const items: ActivityFeedItem[] = [];
  for (const l of logins) {
    items.push({ id: l.id, at: l.createdAt, kind: "login", who: l.userName, role: roleById(l.role).label, entityId: l.entityId, detail: l.detail ?? `Signed in as ${roleById(l.role).label}` });
  }
  for (const s of submissions) {
    const k = kpiById(s.kpiId);
    const p = periodById(s.periodId);
    items.push({ id: `${s.id}-submit`, at: s.submittedAt, kind: "submit", who: s.submittedBy, role: null, entityId: s.entityId, detail: `${k.name} · ${p.label} · ${s.value}${k.unit === "%" ? "%" : ""}` });
    if (s.reviewedBy && s.reviewedAt) {
      const isRejected = s.status === "rejected";
      items.push({
        id: `${s.id}-review`,
        at: s.reviewedAt,
        kind: isRejected ? "reject" : "approve",
        who: s.reviewedBy,
        role: null,
        entityId: s.entityId,
        detail: isRejected ? `${k.name} · ${p.label}${s.reviewNote ? ` — ${s.reviewNote}` : ""}` : `${k.name} · ${p.label} · ${s.value}${k.unit === "%" ? "%" : ""}`,
      });
    }
  }
  for (const u of uploads) {
    items.push({
      id: `${u.id}-upload`,
      at: u.uploadedAt,
      kind: "upload",
      who: u.uploadedBy,
      role: null,
      entityId: u.entityId,
      detail: `${u.fileName} — ${u.savedRows} saved${u.failedRows > 0 ? `, ${u.failedRows} failed` : ""}`,
    });
  }
  return items.sort((a, b) => b.at.localeCompare(a.at));
}

function matchesActivity(item: ActivityFeedItem, query: string): boolean {
  if (!query.trim()) return true;
  const e = item.entityId ? entityById(item.entityId) : null;
  const haystack = `${item.who} ${item.role ?? ""} ${item.detail} ${e ? `${e.fullName} ${e.name}` : ""} ${ACTIVITY_LABEL[item.kind]}`.toLowerCase();
  return haystack.includes(query.trim().toLowerCase());
}

function UploadRowDetails({ uploadId }: { uploadId: string }) {
  const [rows, setRows] = useState<UploadEventRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetchUploadEventRows(uploadId)
      .then((r) => { if (!cancelled) setRows(r); })
      .catch((err: Error) => { if (!cancelled) setError(err.message); });
    return () => { cancelled = true; };
  }, [uploadId]);

  if (error) return <p className="text-xs text-[hsl(var(--pk-bad))] px-3 py-2">Couldn't load row details: {error}</p>;
  if (!rows) return <div className="flex items-center gap-1.5 text-xs text-[hsl(var(--pk-ink-faint))] px-3 py-2"><Loader2 className="h-3 w-3 animate-spin" />Loading row detail…</div>;
  if (rows.length === 0) return <p className="text-xs text-[hsl(var(--pk-ink-faint))] px-3 py-2">No individual rows recorded for this upload.</p>;

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-[12.5px] min-w-[560px]">
        <thead>
          <tr className="text-[10.5px] uppercase tracking-wide text-[hsl(var(--pk-ink-faint))]">
            <th className="text-left font-medium py-1 px-3">Type</th>
            <th className="text-left font-medium py-1">Sheet</th>
            <th className="text-left font-medium py-1">Field</th>
            <th className="text-left font-medium py-1">Period</th>
            <th className="text-right font-medium py-1">Value</th>
            <th className="text-left font-medium py-1 px-3">Outcome</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id} className="border-t border-[hsl(var(--pk-border))]">
              <td className="py-1.5 px-3 text-[hsl(var(--pk-ink-faint))]">{DEST_LABEL[r.dest]}</td>
              <td className="py-1.5 text-[hsl(var(--pk-ink-soft))]">{r.sheet}</td>
              <td className="py-1.5 text-[hsl(var(--pk-ink))]">{r.label}</td>
              <td className="py-1.5 text-[hsl(var(--pk-ink-faint))]">{periodById(r.periodId)?.label ?? r.periodId}</td>
              <td className="py-1.5 text-right tnum">{r.value ?? "—"}</td>
              <td className="py-1.5 px-3">
                {r.status === "saved" ? (
                  <span className="text-[hsl(var(--pk-good))] font-medium">Saved</span>
                ) : (
                  <span className="text-[hsl(var(--pk-bad))] font-medium" title={r.errorMessage ?? undefined}>Failed{r.errorMessage ? ` — ${r.errorMessage}` : ""}</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Pager({ page, pageCount, onChange }: { page: number; pageCount: number; onChange: (p: number) => void }) {
  if (pageCount <= 1) return null;
  return (
    <div className="flex items-center justify-between gap-3 px-1 pt-1">
      <span className="text-[11px] text-[hsl(var(--pk-ink-faint))]">Page {page} of {pageCount}</span>
      <div className="flex items-center gap-1">
        <button
          onClick={() => onChange(Math.max(1, page - 1))}
          disabled={page <= 1}
          className="inline-flex items-center justify-center h-7 w-7 rounded-md border border-[hsl(var(--pk-border))] text-[hsl(var(--pk-ink-soft))] hover:bg-[hsl(var(--pk-surface-2))] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronLeft className="h-3.5 w-3.5" />
        </button>
        <button
          onClick={() => onChange(Math.min(pageCount, page + 1))}
          disabled={page >= pageCount}
          className="inline-flex items-center justify-center h-7 w-7 rounded-md border border-[hsl(var(--pk-border))] text-[hsl(var(--pk-ink-soft))] hover:bg-[hsl(var(--pk-surface-2))] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronRight className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}

function SourceTag({ source }: { source: Submission["source"] }) {
  return source === "web-form" ? (
    <span className="inline-flex items-center gap-1 text-[11px] text-[hsl(var(--pk-ink-faint))]"><PenLine className="h-3 w-3" />Web form</span>
  ) : (
    <span className="inline-flex items-center gap-1 text-[11px] text-[hsl(var(--pk-ink-faint))]"><FileSpreadsheet className="h-3 w-3" />Excel upload</span>
  );
}

export function VerifyPublish({ onNavigate }: { onNavigate: (id: ScreenId) => void }) {
  const { userName } = useSession();
  const { fiscalYearEndMonth } = useOrgSettings();
  const { pending, submissions, approve, approveAll, reject, editSubmission } = useWorkflow();
  const [tab, setTab] = useState<"pending" | "audit" | "uploads" | "activity">("pending");
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [reason, setReason] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const [editNote, setEditNote] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [uploads, setUploads] = useState<UploadEvent[] | null>(null);
  const [uploadsError, setUploadsError] = useState<string | null>(null);
  const [expandedUploadId, setExpandedUploadId] = useState<string | null>(null);
  const [logins, setLogins] = useState<ActivityEvent[] | null>(null);
  const [loginsError, setLoginsError] = useState<string | null>(null);

  const changeTab = (t: "pending" | "audit" | "uploads" | "activity") => { setTab(t); setPage(1); };
  const changeSearch = (q: string) => { setSearch(q); setPage(1); };

  useEffect(() => {
    if ((tab !== "uploads" && tab !== "activity") || uploads !== null) return;
    fetchUploadEvents()
      .then(setUploads)
      .catch((err: Error) => setUploadsError(err.message));
  }, [tab, uploads]);

  useEffect(() => {
    if (tab !== "activity" || logins !== null) return;
    fetchActivityEvents()
      .then(setLogins)
      .catch((err: Error) => setLoginsError(err.message));
  }, [tab, logins]);

  const filteredUploads = useMemo(() => (uploads ?? []).filter((u) => matchesUploadSearch(u, search)), [uploads, search]);
  const uploadsPageCount = Math.max(1, Math.ceil(filteredUploads.length / PAGE_SIZE));
  const uploadsPage = filteredUploads.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const currentPeriodId = useMemo(() => resolveCurrentPeriodId(new Date(), fiscalYearEndMonth), [fiscalYearEndMonth]);
  const currentPeriodLabel = periodById(currentPeriodId).label;

  const uploadProgressByEntity = useMemo(() => {
    const byEntity = new Map<string, { files: number; saved: number; failed: number; uploadedThisPeriod: boolean }>();
    for (const u of uploads ?? []) {
      const cur = byEntity.get(u.entityId) ?? { files: 0, saved: 0, failed: 0, uploadedThisPeriod: false };
      cur.files += 1;
      cur.saved += u.savedRows;
      cur.failed += u.failedRows;
      if (u.periods.includes(currentPeriodLabel) && u.savedRows > 0) cur.uploadedThisPeriod = true;
      byEntity.set(u.entityId, cur);
    }
    return entities.map((e) => ({ entity: e, ...(byEntity.get(e.id) ?? { files: 0, saved: 0, failed: 0, uploadedThisPeriod: false }) }));
  }, [uploads, currentPeriodLabel]);

  const notYetUploaded = uploadProgressByEntity.filter((r) => !r.uploadedThisPeriod);

  const activityFeed = useMemo(
    () => (logins && uploads ? buildActivityFeed(logins, submissions, uploads) : null),
    [logins, uploads, submissions]
  );
  const filteredActivity = useMemo(() => (activityFeed ?? []).filter((a) => matchesActivity(a, search)), [activityFeed, search]);
  const activityPageCount = Math.max(1, Math.ceil(filteredActivity.length / PAGE_SIZE));
  const activityPage = filteredActivity.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

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

  const filteredPending = pending.filter((s) => matchesSearch(s, search));
  const pendingPageCount = Math.max(1, Math.ceil(filteredPending.length / PAGE_SIZE));
  const pendingPage = filteredPending.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const filteredHistory = history.filter((s) => matchesSearch(s, search));
  const historyPageCount = Math.max(1, Math.ceil(filteredHistory.length / PAGE_SIZE));
  const historyPage = filteredHistory.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div>
      <ScreenHeader id="VERIFY_PUBLISH" subtitle="The data-integrity control before anything reaches a dashboard — approve to publish, or reject back to the submitter." onNavigate={onNavigate} />

      <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
        <div className="flex items-center gap-1 border border-[hsl(var(--pk-border))] rounded-lg p-1 w-fit bg-[hsl(var(--pk-surface))]">
          <button onClick={() => changeTab("pending")} className={cn("flex items-center gap-1.5 rounded-md px-3 py-1.5 text-[13px] font-medium transition-colors", tab === "pending" ? "bg-[hsl(var(--pk-accent))] text-[hsl(var(--pk-accent-ink))]" : "text-[hsl(var(--pk-ink-faint))] hover:text-[hsl(var(--pk-ink))]")}>
            <Inbox className="h-3.5 w-3.5" />Pending verification {pending.length > 0 && <span className="ml-0.5 tnum">({pending.length})</span>}
          </button>
          <button onClick={() => changeTab("audit")} className={cn("flex items-center gap-1.5 rounded-md px-3 py-1.5 text-[13px] font-medium transition-colors", tab === "audit" ? "bg-[hsl(var(--pk-accent))] text-[hsl(var(--pk-accent-ink))]" : "text-[hsl(var(--pk-ink-faint))] hover:text-[hsl(var(--pk-ink))]")}>
            <History className="h-3.5 w-3.5" />Audit trail
          </button>
          <button onClick={() => changeTab("uploads")} className={cn("flex items-center gap-1.5 rounded-md px-3 py-1.5 text-[13px] font-medium transition-colors", tab === "uploads" ? "bg-[hsl(var(--pk-accent))] text-[hsl(var(--pk-accent-ink))]" : "text-[hsl(var(--pk-ink-faint))] hover:text-[hsl(var(--pk-ink))]")}>
            <UploadCloud className="h-3.5 w-3.5" />Uploads {uploads && uploads.length > 0 && <span className="ml-0.5 tnum">({uploads.length})</span>}
          </button>
          <button onClick={() => changeTab("activity")} className={cn("flex items-center gap-1.5 rounded-md px-3 py-1.5 text-[13px] font-medium transition-colors", tab === "activity" ? "bg-[hsl(var(--pk-accent))] text-[hsl(var(--pk-accent-ink))]" : "text-[hsl(var(--pk-ink-faint))] hover:text-[hsl(var(--pk-ink))]")}>
            <ActivityIcon className="h-3.5 w-3.5" />Activity
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

      <div className="relative mb-4 max-w-sm">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[hsl(var(--pk-ink-faint))]" />
        <input
          value={search}
          onChange={(e) => changeSearch(e.target.value)}
          placeholder={tab === "uploads" ? "Search by file, entity, sheet, uploader…" : tab === "activity" ? "Search by user, entity, action, detail…" : "Search by KPI, entity, period, submitter…"}
          className="w-full rounded-md border border-[hsl(var(--pk-border))] bg-[hsl(var(--pk-surface))] pl-8 pr-3 py-1.5 text-sm outline-none focus:border-[hsl(var(--pk-accent))] transition-colors"
        />
      </div>

      {tab === "pending" ? (
        filteredPending.length === 0 ? (
          <NoDataState
            title={pending.length === 0 ? "Nothing awaiting verification" : "No matches"}
            body={pending.length === 0 ? "Submissions made via Data Entry — web form or Excel template upload — will appear here for Approve or Reject." : "No pending submissions match your search."}
          />
        ) : (
          <div className="flex flex-col gap-3">
            {pendingPage.map((s) => {
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
            <Pager page={page} pageCount={pendingPageCount} onChange={setPage} />
          </div>
        )
      ) : tab === "audit" ? (
        filteredHistory.length === 0 ? (
        <NoDataState
          title={history.length === 0 ? "No activity yet" : "No matches"}
          body={history.length === 0 ? "Every submit, approve, reject and publish event will be logged here — who, what, and when." : "No submissions match your search."}
        />
      ) : (
        <div className="flex flex-col gap-2">
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
                {historyPage.map((s) => {
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
          <Pager page={page} pageCount={historyPageCount} onChange={setPage} />
        </div>
        )
      ) : tab === "uploads" ? (
        uploadsError ? (
        <p className="text-sm text-[hsl(var(--pk-bad))]">Couldn't load upload history: {uploadsError}</p>
      ) : uploads === null ? (
        <div className="flex items-center gap-1.5 text-sm text-[hsl(var(--pk-ink-faint))]"><Loader2 className="h-4 w-4 animate-spin" />Loading upload history…</div>
      ) : (
        <div className="flex flex-col gap-4">
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="text-[11px] uppercase tracking-wide text-[hsl(var(--pk-ink-faint))]">Upload progress — {currentPeriodLabel}</div>
              {notYetUploaded.length > 0 ? (
                <span className="inline-flex items-center gap-1 text-[11px] font-medium text-[hsl(var(--pk-bad))]">
                  <AlertTriangle className="h-3 w-3" />{notYetUploaded.length} of {entities.length} not yet uploaded
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-[11px] font-medium text-[hsl(var(--pk-good))]">
                  <Check className="h-3 w-3" />All entities have uploaded
                </span>
              )}
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
              {uploadProgressByEntity.map((r) => (
                <div
                  key={r.entity.id}
                  className={cn(
                    "rounded-lg border shadow-card p-3",
                    r.uploadedThisPeriod
                      ? "border-[hsl(var(--pk-border))] bg-[hsl(var(--pk-surface))]"
                      : "border-[hsl(var(--pk-bad))]/40 bg-[hsl(var(--pk-bad-soft))]"
                  )}
                >
                  <div className="text-[11px] uppercase tracking-wide text-[hsl(var(--pk-ink-faint))] truncate">{r.entity.fullName}</div>
                  {r.uploadedThisPeriod ? (
                    <>
                      <div className="text-lg font-head font-semibold text-[hsl(var(--pk-ink))] mt-0.5">{r.files} file{r.files !== 1 ? "s" : ""}</div>
                      <div className="text-[11px] mt-0.5">
                        <span className="text-[hsl(var(--pk-good))] font-medium">{r.saved} saved</span>
                        {r.failed > 0 && <span className="text-[hsl(var(--pk-bad))] font-medium"> · {r.failed} failed</span>}
                      </div>
                    </>
                  ) : (
                    <div className="text-sm font-medium text-[hsl(var(--pk-bad))] mt-1.5">Not yet uploaded</div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {filteredUploads.length === 0 ? (
            <NoDataState
              title={(uploads?.length ?? 0) === 0 ? "No uploads yet" : "No matches"}
              body={(uploads?.length ?? 0) === 0 ? "Every Excel template upload from Data Entry — file, uploader, and every row it touched — will be logged here." : "No uploads match your search."}
            />
          ) : (
            <div className="flex flex-col gap-2">
              <div className="rounded-lg border border-[hsl(var(--pk-border))] bg-[hsl(var(--pk-surface))] shadow-card overflow-x-auto">
                <table className="w-full text-sm min-w-[760px]">
                  <thead>
                    <tr className="text-[11px] uppercase tracking-wide text-[hsl(var(--pk-ink-faint))] bg-[hsl(var(--pk-surface-2))]">
                      <th className="text-left font-medium px-3 py-2">File</th>
                      <th className="text-left font-medium px-3 py-2">Entity / Sheets</th>
                      <th className="text-left font-medium px-3 py-2">Periods</th>
                      <th className="text-left font-medium px-3 py-2">Uploaded</th>
                      <th className="text-right font-medium px-3 py-2">Rows</th>
                      <th className="w-8"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {uploadsPage.map((u) => {
                      const e = entityById(u.entityId);
                      const expanded = expandedUploadId === u.id;
                      return (
                        <Fragment key={u.id}>
                          <tr
                            className="border-t border-[hsl(var(--pk-border))] cursor-pointer hover:bg-[hsl(var(--pk-surface-2))] transition-colors"
                            onClick={() => setExpandedUploadId(expanded ? null : u.id)}
                          >
                            <td className="px-3 py-2 text-[hsl(var(--pk-ink))]">{u.fileName}<div className="font-mono-pk text-[10px] text-[hsl(var(--pk-ink-faint))]">{u.id}</div></td>
                            <td className="px-3 py-2 text-[hsl(var(--pk-ink-soft))]">{e.name}<div className="text-[11px] text-[hsl(var(--pk-ink-faint))]">{u.sheets}</div></td>
                            <td className="px-3 py-2 text-[11px] text-[hsl(var(--pk-ink-faint))]">{u.periods}</td>
                            <td className="px-3 py-2 text-[11px] text-[hsl(var(--pk-ink-faint))]">{u.uploadedBy}<br />{new Date(u.uploadedAt).toLocaleString()}</td>
                            <td className="px-3 py-2 text-right tnum">
                              <span className="text-[hsl(var(--pk-good))]">{u.savedRows}</span>
                              {u.failedRows > 0 && <span className="text-[hsl(var(--pk-bad))]"> / {u.failedRows} failed</span>}
                            </td>
                            <td className="px-3 py-2 text-[hsl(var(--pk-ink-faint))]"><ChevronDown className={cn("h-3.5 w-3.5 transition-transform", expanded && "rotate-180")} /></td>
                          </tr>
                          {expanded && (
                            <tr className="border-t border-[hsl(var(--pk-border))] bg-[hsl(var(--pk-surface-2))]">
                              <td colSpan={6} className="p-0">
                                <UploadRowDetails uploadId={u.id} />
                              </td>
                            </tr>
                          )}
                        </Fragment>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <Pager page={page} pageCount={uploadsPageCount} onChange={setPage} />
            </div>
          )}
        </div>
        )
      ) : loginsError || uploadsError ? (
        <p className="text-sm text-[hsl(var(--pk-bad))]">Couldn't load activity: {loginsError ?? uploadsError}</p>
      ) : activityFeed === null ? (
        <div className="flex items-center gap-1.5 text-sm text-[hsl(var(--pk-ink-faint))]"><Loader2 className="h-4 w-4 animate-spin" />Loading activity…</div>
      ) : filteredActivity.length === 0 ? (
        <NoDataState
          title={activityFeed.length === 0 ? "No activity yet" : "No matches"}
          body={activityFeed.length === 0 ? "Every sign-in, submission, review and upload across the whole team will be logged here, newest first." : "No activity matches your search."}
        />
      ) : (
        <div className="flex flex-col gap-2">
          <div className="rounded-lg border border-[hsl(var(--pk-border))] bg-[hsl(var(--pk-surface))] shadow-card overflow-x-auto">
            <table className="w-full text-sm min-w-[680px]">
              <thead>
                <tr className="text-[11px] uppercase tracking-wide text-[hsl(var(--pk-ink-faint))] bg-[hsl(var(--pk-surface-2))]">
                  <th className="text-left font-medium px-3 py-2">Action</th>
                  <th className="text-left font-medium px-3 py-2">User</th>
                  <th className="text-left font-medium px-3 py-2">Entity</th>
                  <th className="text-left font-medium px-3 py-2">Detail</th>
                  <th className="text-left font-medium px-3 py-2">When</th>
                </tr>
              </thead>
              <tbody>
                {activityPage.map((a) => {
                  const Icon = ACTIVITY_ICON[a.kind];
                  const e = a.entityId ? entityById(a.entityId) : null;
                  return (
                    <tr key={a.id} className="border-t border-[hsl(var(--pk-border))]">
                      <td className={cn("px-3 py-2 font-medium", ACTIVITY_COLOR[a.kind])}>
                        <span className="inline-flex items-center gap-1.5"><Icon className="h-3.5 w-3.5" />{ACTIVITY_LABEL[a.kind]}</span>
                      </td>
                      <td className="px-3 py-2 text-[hsl(var(--pk-ink))]">{a.who}{a.role && <div className="text-[11px] text-[hsl(var(--pk-ink-faint))]">{a.role}</div>}</td>
                      <td className="px-3 py-2 text-[hsl(var(--pk-ink-soft))]">{e ? e.name : "—"}</td>
                      <td className="px-3 py-2 text-[hsl(var(--pk-ink-soft))]">{a.detail}</td>
                      <td className="px-3 py-2 text-[11px] text-[hsl(var(--pk-ink-faint))]">{new Date(a.at).toLocaleString()}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <Pager page={page} pageCount={activityPageCount} onChange={setPage} />
        </div>
      )}
    </div>
  );
}
