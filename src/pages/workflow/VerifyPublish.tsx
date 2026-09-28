import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Check, X, FileSpreadsheet, PenLine, History, Inbox, CheckCheck, Pencil, Search, Loader2, Files, Activity as ActivityIcon, LogIn, UploadIcon, Send, CircleCheck, CircleX, CheckCircle2 } from "lucide-react";
import { ScreenHeader } from "@/components/pk/ScreenHeader";
import { WorkflowChip } from "@/components/pk/StatusChip";
import { NoDataState } from "@/components/pk/DataOrigin";
import { Pager } from "@/components/pk/Pager";
import { AuditTrailPanel } from "@/components/pk/AuditTrailPanel";
import { UploadsPanel } from "@/components/pk/UploadsPanel";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from "@/components/ui/dialog";
import type { ScreenId } from "@/lib/nav";
import { useSession } from "@/lib/session";
import { useWorkflow, scopePendingFor, scopeDetailPendingFor } from "@/lib/workflow";
import { useDetails } from "@/lib/details";
import { kpiById } from "@/data/kpis";
import { entityById } from "@/data/entities";
import { periods, periodById } from "@/data/periods";
import { roleById } from "@/lib/roles";
import { MODULE_LABEL } from "@/lib/modules";
import { cn } from "@/lib/utils";
import type { DetailSubmission, Submission } from "@/types";
import { fetchUploadEvents, type UploadEvent } from "@/lib/api/uploads";
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

/** Best-effort period label for a detail submission's periodId — unlike KPI periods, a Financial
 * Trend metric row can carry a month-level id that isn't in the quarter-only `periods` array
 * periodById() searches; fall back to the raw id rather than periodById's non-null assertion
 * throwing on a miss. */
function detailPeriodLabel(periodId: string): string {
  return periods.find((p) => p.id === periodId)?.label ?? periodId;
}

function detailLabel(s: DetailSubmission): string {
  return s.dest === "metric"
    ? `${s.metricKey}${s.dimension ? ` · ${s.dimension}` : ""}${s.dimension2 ? ` · ${s.dimension2}` : ""}`
    : `${s.recordType} · ${s.label}${s.category ? ` (${s.category})` : ""}`;
}

function detailValueDisplay(s: DetailSubmission): string {
  if (s.valueNum !== null && s.valueNum2 !== null) return `${s.valueNum} / ${s.valueNum2}`;
  if (s.valueNum !== null) return String(s.valueNum);
  if (s.valueNum2 !== null) return String(s.valueNum2);
  if (s.textNote) return s.textNote;
  return "—";
}

function matchesDetailSearch(s: DetailSubmission, query: string): boolean {
  if (!query.trim()) return true;
  const e = entityById(s.entityId);
  const p = detailPeriodLabel(s.periodId);
  const haystack = `${detailLabel(s)} ${MODULE_LABEL[s.module]} ${e.fullName} ${e.name} ${p} ${s.id} ${s.submittedBy} ${s.reviewedBy ?? ""}`.toLowerCase();
  return haystack.includes(query.trim().toLowerCase());
}

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

interface ApprovalResult {
  count: number;
  lines: string[];
}

/** A checker's Approve action used to only show a corner toast — easy to miss, and gone before a
 * checker working through a long pending list would notice it. This mirrors Data Entry's own
 * post-upload dialog so "something I just did was published" always gets a same, deliberate
 * confirmation the checker has to dismiss. */
function ApprovalResultDialog({ result, onClose }: { result: ApprovalResult | null; onClose: () => void }) {
  return (
    <Dialog open={result !== null} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="max-w-[480px]" onEscapeKeyDown={(e) => e.preventDefault()} onInteractOutside={(e) => e.preventDefault()}>
        {result && (
          <>
            <DialogHeader>
              <DialogTitle className="font-head flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-[hsl(var(--pk-good))]" />
                Published
              </DialogTitle>
              <DialogDescription>
                {result.count} submission{result.count > 1 ? "s" : ""} now live on the dashboard{result.count > 1 ? "s" : ""}.
              </DialogDescription>
            </DialogHeader>
            <div className="flex flex-col gap-1.5 text-sm max-h-60 overflow-y-auto">
              {result.lines.map((line, i) => (
                <div key={i} className="flex items-center gap-2 text-[hsl(var(--pk-ink))]">
                  <CheckCircle2 className="h-4 w-4 text-[hsl(var(--pk-good))] shrink-0" />
                  {line}
                </div>
              ))}
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <button
                  onClick={onClose}
                  className="rounded-md bg-[hsl(var(--pk-accent))] text-[hsl(var(--pk-accent-ink))] font-medium text-sm px-4 py-2 hover:opacity-90 transition-opacity"
                >
                  Close
                </button>
              </DialogClose>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

function SourceTag({ source }: { source: Submission["source"] | DetailSubmission["source"] }) {
  return source === "web-form" ? (
    <span className="inline-flex items-center gap-1 text-2xs text-[hsl(var(--pk-ink-faint))]"><PenLine className="h-3 w-3" />Web form</span>
  ) : source === "backfill" ? (
    <span className="inline-flex items-center gap-1 text-2xs text-[hsl(var(--pk-ink-faint))]"><History className="h-3 w-3" />Backfilled — already live</span>
  ) : (
    <span className="inline-flex items-center gap-1 text-2xs text-[hsl(var(--pk-ink-faint))]"><FileSpreadsheet className="h-3 w-3" />Excel upload</span>
  );
}

export function VerifyPublish({ onNavigate }: { onNavigate: (id: ScreenId) => void }) {
  const { userName, entityId, pillarLocked, assignedModule, role } = useSession();
  const {
    pending: allPending, submissions: allSubmissions, approve, approveAll, reject, editSubmission,
    detailPending: allDetailPending, approveDetail, approveAllDetail, rejectDetail,
  } = useWorkflow();
  const { refresh: refreshDetails } = useDetails();
  const canDeleteUploads = role === "admin" || role === "dept_head";

  /** A Department Head is entity-locked (pillarLocked) — scope every tab here to just their own
   * entity, the same way Data Entry already scopes for a Reporting Officer, rather than showing
   * the whole org. System Administrator (not pillarLocked) still sees everything.
   *
   * The KPI Scorecard queue (`submissions`) only ever comes from the Corporate Performance
   * pillar's own template sheet, so a Department Head assigned to Financial Health or Resource &
   * People genuinely has nothing of theirs in *that* queue — that's expected, not a bug. Their
   * own pillar's metric/record figures (Financial Trend, Bumiputera Training, etc.) go through
   * the separate detail_submissions queue below instead, scoped by module rather than excluded. */
  const moduleExcluded = !!assignedModule && assignedModule !== "CP";
  const pending = useMemo(() => scopePendingFor(allPending, { pillarLocked, entityId, assignedModule }), [allPending, pillarLocked, entityId, assignedModule]);
  const submissions = useMemo(() => (moduleExcluded ? [] : pillarLocked ? allSubmissions.filter((s) => s.entityId === entityId) : allSubmissions), [allSubmissions, pillarLocked, entityId, moduleExcluded]);
  const detailPending = useMemo(() => scopeDetailPendingFor(allDetailPending, { pillarLocked, entityId, assignedModule }), [allDetailPending, pillarLocked, entityId, assignedModule]);
  const [tab, setTab] = useState<"pending" | "audit" | "uploads" | "activity">("pending");
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [reason, setReason] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const [editNote, setEditNote] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [detailPage, setDetailPage] = useState(1);
  const [rejectingDetailId, setRejectingDetailId] = useState<string | null>(null);
  const [detailReason, setDetailReason] = useState("");
  const [activityUploads, setActivityUploads] = useState<UploadEvent[] | null>(null);
  const [activityUploadsError, setActivityUploadsError] = useState<string | null>(null);
  const [logins, setLogins] = useState<ActivityEvent[] | null>(null);
  const [loginsError, setLoginsError] = useState<string | null>(null);
  const [approvalResult, setApprovalResult] = useState<ApprovalResult | null>(null);

  const changeTab = (t: "pending" | "audit" | "uploads" | "activity") => { setTab(t); setPage(1); setDetailPage(1); };
  const changeSearch = (q: string) => { setSearch(q); setPage(1); setDetailPage(1); };

  useEffect(() => {
    if (tab !== "activity" || activityUploads !== null) return;
    fetchUploadEvents()
      .then(setActivityUploads)
      .catch((err: Error) => setActivityUploadsError(err.message));
  }, [tab, activityUploads]);

  useEffect(() => {
    if (tab !== "activity" || logins !== null) return;
    fetchActivityEvents()
      .then(setLogins)
      .catch((err: Error) => setLoginsError(err.message));
  }, [tab, logins]);

  const activityFeed = useMemo(() => {
    if (!logins || !activityUploads) return null;
    const scopedLogins = pillarLocked ? logins.filter((l) => l.entityId === entityId) : logins;
    const scopedUploads = pillarLocked ? activityUploads.filter((u) => u.entityId === entityId) : activityUploads;
    return buildActivityFeed(scopedLogins, submissions, scopedUploads);
  }, [logins, activityUploads, submissions, pillarLocked, entityId]);
  const filteredActivity = useMemo(() => (activityFeed ?? []).filter((a) => matchesActivity(a, search)), [activityFeed, search]);
  const activityPageCount = Math.max(1, Math.ceil(filteredActivity.length / PAGE_SIZE));
  const activityPage = filteredActivity.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const handleApprove = (id: string, name: string) => {
    approve(id, userName || "checker", "Verified against source documents.");
    setApprovalResult({ count: 1, lines: [`${name} is now live on the dashboard.`] });
  };

  const handleApproveAll = () => {
    const lines = pending.map((s) => `${kpiById(s.kpiId).name} · ${periodById(s.periodId).label}`);
    approveAll(userName || "checker", "Bulk approved — verified against source documents.", pillarLocked ? pending.map((s) => s.id) : undefined);
    setApprovalResult({ count: lines.length, lines });
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

  const handleApproveDetail = (id: string, name: string) => {
    approveDetail(id, userName || "checker", "Verified against source documents.").then(() => refreshDetails());
    setApprovalResult({ count: 1, lines: [`${name} is now live on the dashboard.`] });
  };

  const handleApproveAllDetail = () => {
    const lines = detailPending.map((s) => `${detailLabel(s)} · ${detailPeriodLabel(s.periodId)}`);
    approveAllDetail(userName || "checker", "Bulk approved — verified against source documents.", detailPending.map((s) => s.id)).then(() => refreshDetails());
    setApprovalResult({ count: lines.length, lines });
  };

  const confirmRejectDetail = (id: string) => {
    if (!detailReason.trim()) {
      toast.error("Give the submitter a reason before rejecting.");
      return;
    }
    rejectDetail(id, userName || "checker", detailReason.trim());
    toast("Rejected", { description: "Sent back to the submitter with your note." });
    setRejectingDetailId(null);
    setDetailReason("");
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

  const filteredPending = pending.filter((s) => matchesSearch(s, search));
  const pendingPageCount = Math.max(1, Math.ceil(filteredPending.length / PAGE_SIZE));
  const pendingPage = filteredPending.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const filteredDetailPending = detailPending.filter((s) => matchesDetailSearch(s, search));
  const detailPendingPageCount = Math.max(1, Math.ceil(filteredDetailPending.length / PAGE_SIZE));
  const detailPendingPage = filteredDetailPending.slice((detailPage - 1) * PAGE_SIZE, detailPage * PAGE_SIZE);

  return (
    <div>
      <ScreenHeader id="VERIFY_PUBLISH" subtitle="The data-integrity control before anything reaches a dashboard — approve to publish, or reject back to the submitter." onNavigate={onNavigate} />

      <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
        <div className="flex items-center gap-1 border border-[hsl(var(--pk-border))] rounded-lg p-1 w-fit bg-[hsl(var(--pk-surface))]">
          <button onClick={() => changeTab("pending")} className={cn("flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors", tab === "pending" ? "bg-[hsl(var(--pk-accent))] text-[hsl(var(--pk-accent-ink))]" : "text-[hsl(var(--pk-ink-faint))] hover:text-[hsl(var(--pk-ink))]")}>
            <Inbox className="h-3.5 w-3.5" />Pending verification {pending.length + detailPending.length > 0 && <span className="ml-0.5 tnum">({pending.length + detailPending.length})</span>}
          </button>
          <button onClick={() => changeTab("audit")} className={cn("flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors", tab === "audit" ? "bg-[hsl(var(--pk-accent))] text-[hsl(var(--pk-accent-ink))]" : "text-[hsl(var(--pk-ink-faint))] hover:text-[hsl(var(--pk-ink))]")}>
            <History className="h-3.5 w-3.5" />Audit trail
          </button>
          <button onClick={() => changeTab("uploads")} className={cn("flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors", tab === "uploads" ? "bg-[hsl(var(--pk-accent))] text-[hsl(var(--pk-accent-ink))]" : "text-[hsl(var(--pk-ink-faint))] hover:text-[hsl(var(--pk-ink))]")}>
            <Files className="h-3.5 w-3.5" />Upload History
          </button>
          <button onClick={() => changeTab("activity")} className={cn("flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors", tab === "activity" ? "bg-[hsl(var(--pk-accent))] text-[hsl(var(--pk-accent-ink))]" : "text-[hsl(var(--pk-ink-faint))] hover:text-[hsl(var(--pk-ink))]")}>
            <ActivityIcon className="h-3.5 w-3.5" />Activity
          </button>
        </div>
        {tab === "pending" && pending.length > 1 && (
          <button
            onClick={handleApproveAll}
            className="inline-flex items-center gap-1.5 rounded-md bg-[hsl(var(--pk-good))] text-white text-xs font-medium px-3 py-1.5 hover:opacity-90 transition-opacity"
          >
            <CheckCheck className="h-3.5 w-3.5" />Approve All KPI ({pending.length})
          </button>
        )}
      </div>

      {tab === "pending" && (
        <div className="relative mb-4 max-w-sm">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[hsl(var(--pk-ink-faint))]" />
          <input
            value={search}
            onChange={(e) => changeSearch(e.target.value)}
            placeholder="Search by KPI/figure, entity, period, submitter…"
            className="w-full rounded-md border border-[hsl(var(--pk-border))] bg-[hsl(var(--pk-surface))] pl-8 pr-3 py-1.5 text-sm outline-none focus:border-[hsl(var(--pk-accent))] transition-colors"
          />
        </div>
      )}

      {tab === "pending" ? (
        pending.length === 0 && detailPending.length === 0 ? (
          <NoDataState
            title="Nothing awaiting verification"
            body="Submissions made via Data Entry — web form or Excel template upload — will appear here for Approve or Reject."
          />
        ) : (
          <div className="flex flex-col gap-6">
          {pending.length > 0 && (
          <div className="flex flex-col gap-3">
            <div className="text-2xs uppercase tracking-wide text-[hsl(var(--pk-ink-faint))] font-semibold">KPI Scorecard</div>
            {filteredPending.length === 0 ? (
              <NoDataState title="No matches" body="No pending submissions match your search." />
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
                        <span className="font-head font-bold text-[hsl(var(--pk-ink))]">{k.name}</span>
                        <WorkflowChip status={s.status} />
                        <SourceTag source={s.source} />
                      </div>
                      <div className="text-2xs text-[hsl(var(--pk-ink-faint))] mt-1">
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
            )}
          </div>
          )}

          {detailPending.length > 0 && (
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="text-2xs uppercase tracking-wide text-[hsl(var(--pk-ink-faint))] font-semibold">Financial Health · Resource &amp; People — other detail figures</div>
              {detailPending.length > 1 && (
                <button onClick={handleApproveAllDetail} className="inline-flex items-center gap-1.5 rounded-md bg-[hsl(var(--pk-good))] text-white text-xs font-medium px-3 py-1.5 hover:opacity-90 transition-opacity">
                  <CheckCheck className="h-3.5 w-3.5" />Approve All ({detailPending.length})
                </button>
              )}
            </div>
            {filteredDetailPending.length === 0 ? (
              <NoDataState title="No matches" body="No pending detail submissions match your search." />
            ) : (
            <div className="flex flex-col gap-3">
              {detailPendingPage.map((s) => {
                const e = entityById(s.entityId);
                const p = detailPeriodLabel(s.periodId);
                return (
                  <div key={s.id} className="rounded-lg border border-[hsl(var(--pk-border))] bg-[hsl(var(--pk-surface))] shadow-card p-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-head font-bold text-[hsl(var(--pk-ink))]">{detailLabel(s)}</span>
                          <WorkflowChip status={s.status} />
                          <SourceTag source={s.source} />
                          <span className="text-2xs font-medium rounded-full px-2 py-0.5 bg-[hsl(var(--pk-navy-soft))] text-[hsl(var(--pk-navy))]">{MODULE_LABEL[s.module]}</span>
                        </div>
                        <div className="text-2xs text-[hsl(var(--pk-ink-faint))] mt-1">
                          {e.fullName} · {p} · submitted by {s.submittedBy} · {new Date(s.submittedAt).toLocaleString()}
                        </div>
                      </div>
                      <div className="tnum font-head text-xl font-semibold text-[hsl(var(--pk-ink))]">{detailValueDisplay(s)}</div>
                    </div>
                    {rejectingDetailId === s.id ? (
                      <div className="mt-3 flex flex-col gap-2">
                        <textarea
                          value={detailReason}
                          onChange={(e) => setDetailReason(e.target.value)}
                          rows={2}
                          autoFocus
                          placeholder="Reason for rejection — sent back to the submitter."
                          className="rounded-md border border-[hsl(var(--pk-bad))] px-2.5 py-2 text-sm bg-transparent outline-none"
                        />
                        <div className="flex items-center gap-2">
                          <button onClick={() => confirmRejectDetail(s.id)} className="rounded-md bg-[hsl(var(--pk-bad))] text-white text-xs font-medium px-3 py-1.5">Confirm rejection</button>
                          <button onClick={() => { setRejectingDetailId(null); setDetailReason(""); }} className="text-xs text-[hsl(var(--pk-ink-faint))] px-2">Cancel</button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 mt-3">
                        <button onClick={() => handleApproveDetail(s.id, detailLabel(s))} className="inline-flex items-center gap-1.5 rounded-md bg-[hsl(var(--pk-good))] text-white text-xs font-medium px-3 py-1.5 hover:opacity-90 transition-opacity">
                          <Check className="h-3.5 w-3.5" />Approve &amp; Publish
                        </button>
                        <button onClick={() => setRejectingDetailId(s.id)} className="inline-flex items-center gap-1.5 rounded-md border border-[hsl(var(--pk-bad))] text-[hsl(var(--pk-bad))] text-xs font-medium px-3 py-1.5 hover:bg-[hsl(var(--pk-bad-soft))] transition-colors">
                          <X className="h-3.5 w-3.5" />Reject
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
              <Pager page={detailPage} pageCount={detailPendingPageCount} onChange={setDetailPage} />
            </div>
            )}
          </div>
          )}
          </div>
        )
      ) : tab === "audit" ? (
        <AuditTrailPanel submissions={submissions} showEntityColumn={!pillarLocked} />
      ) : tab === "uploads" ? (
        <UploadsPanel entityId={pillarLocked ? entityId : undefined} assignedModule={assignedModule} canDelete={canDeleteUploads} />
      ) : loginsError || activityUploadsError ? (
        <p className="text-sm text-[hsl(var(--pk-bad))]">Couldn't load activity: {loginsError ?? activityUploadsError}</p>
      ) : activityFeed === null ? (
        <div className="flex items-center gap-1.5 text-sm text-[hsl(var(--pk-ink-faint))]"><Loader2 className="h-4 w-4 animate-spin" />Loading activity…</div>
      ) : (
        <div className="flex flex-col gap-3">
          <div className="relative max-w-sm">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[hsl(var(--pk-ink-faint))]" />
            <input
              value={search}
              onChange={(e) => changeSearch(e.target.value)}
              placeholder="Search by user, entity, action, detail…"
              className="w-full rounded-md border border-[hsl(var(--pk-border))] bg-[hsl(var(--pk-surface))] pl-8 pr-3 py-1.5 text-sm outline-none focus:border-[hsl(var(--pk-accent))] transition-colors"
            />
          </div>
          {filteredActivity.length === 0 ? (
            <NoDataState
              title={activityFeed.length === 0 ? "No activity yet" : "No matches"}
              body={activityFeed.length === 0 ? "Every sign-in, submission, review and upload across the whole team will be logged here, newest first." : "No activity matches your search."}
            />
          ) : (
            <div className="flex flex-col gap-2">
              <div className="rounded-lg border border-[hsl(var(--pk-border))] bg-[hsl(var(--pk-surface))] shadow-card overflow-x-auto">
                <table className="w-full text-sm min-w-[680px]">
                  <thead>
                    <tr className="text-2xs uppercase tracking-wide text-white bg-[hsl(var(--pk-navy))]">
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
                          <td className="px-3 py-2 text-[hsl(var(--pk-ink))]">{a.who}{a.role && <div className="text-2xs text-[hsl(var(--pk-ink-faint))]">{a.role}</div>}</td>
                          <td className="px-3 py-2 text-[hsl(var(--pk-ink-soft))]">{e ? e.name : "—"}</td>
                          <td className="px-3 py-2 text-[hsl(var(--pk-ink-soft))]">{a.detail}</td>
                          <td className="px-3 py-2 text-2xs text-[hsl(var(--pk-ink-faint))]">{new Date(a.at).toLocaleString()}</td>
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
      )}

      <ApprovalResultDialog result={approvalResult} onClose={() => setApprovalResult(null)} />
    </div>
  );
}
