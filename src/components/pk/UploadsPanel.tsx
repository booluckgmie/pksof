import { Fragment, useEffect, useMemo, useState } from "react";
import { Search, ChevronDown, Loader2, AlertTriangle, Check } from "lucide-react";
import { NoDataState } from "@/components/pk/DataOrigin";
import { Pager } from "@/components/pk/Pager";
import { useOrgSettings } from "@/lib/orgSettings";
import { entityById, entities } from "@/data/entities";
import { periodById, resolveCurrentPeriodId } from "@/data/periods";
import { cn } from "@/lib/utils";
import type { EntityId } from "@/types";
import { fetchUploadEvents, fetchUploadEventRows, type UploadEvent, type UploadEventRow } from "@/lib/api/uploads";

const PAGE_SIZE = 10;

/** Module code → the exact sheet name that code appears as in an upload's comma-joined `sheets`
 * field (src/lib/excelTemplate.ts's SHEET_NAMES) — same order as Entity.modules everywhere else
 * in the app, so this is the one place the two need to line up. */
const PILLAR_SHEET: Record<"CP" | "FH" | "RP", string> = {
  CP: "Corporate Performance",
  FH: "Financial Health",
  RP: "Resource & People",
};

function matchesUploadSearch(u: UploadEvent, query: string): boolean {
  if (!query.trim()) return true;
  const e = entityById(u.entityId);
  const haystack = `${u.fileName} ${e.fullName} ${e.name} ${u.sheets} ${u.periods} ${u.uploadedBy} ${u.id}`.toLowerCase();
  return haystack.includes(query.trim().toLowerCase());
}

const DEST_LABEL: Record<UploadEventRow["dest"], string> = { kpi: "KPI Scorecard", metric: "Detail metric", record: "Detail record" };

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

/**
 * Upload history + per-row detail + "who hasn't uploaded yet" progress, searchable and
 * paginated — shared between Verify & Publish's "Uploads" tab (org-wide, every entity,
 * `entityId` omitted) and Data Entry's own "Uploads" tab (`entityId` passed in, so a Reporting
 * Officer sees only their own pillar's history) so the two stay in sync rather than drifting
 * into two separate implementations.
 */
export function UploadsPanel({ entityId, showProgressGrid = !entityId }: { entityId?: EntityId; showProgressGrid?: boolean }) {
  const { fiscalYearEndMonth } = useOrgSettings();
  const [uploads, setUploads] = useState<UploadEvent[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    fetchUploadEvents()
      .then(setUploads)
      .catch((err: Error) => setError(err.message));
  }, []);

  const scoped = useMemo(() => (entityId ? (uploads ?? []).filter((u) => u.entityId === entityId) : uploads ?? []), [uploads, entityId]);
  const changeSearch = (q: string) => { setSearch(q); setPage(1); };
  const filtered = useMemo(() => scoped.filter((u) => matchesUploadSearch(u, search)), [scoped, search]);
  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageItems = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const currentPeriodId = useMemo(() => resolveCurrentPeriodId(new Date(), fiscalYearEndMonth), [fiscalYearEndMonth]);
  const currentPeriodLabel = periodById(currentPeriodId).label;

  const progressByEntity = useMemo(() => {
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
  const notYetUploaded = progressByEntity.filter((r) => !r.uploadedThisPeriod);

  const progressByPillar = useMemo(() => {
    if (!entityId) return [];
    const modules = entityById(entityId).modules;
    return modules.map((mod) => {
      const sheet = PILLAR_SHEET[mod];
      const relevant = scoped.filter((u) => u.sheets.split(", ").includes(sheet));
      return {
        module: mod,
        sheet,
        files: relevant.length,
        saved: relevant.reduce((s, u) => s + u.savedRows, 0),
        failed: relevant.reduce((s, u) => s + u.failedRows, 0),
        uploadedThisPeriod: relevant.some((u) => u.periods.includes(currentPeriodLabel) && u.savedRows > 0),
      };
    });
  }, [scoped, entityId, currentPeriodLabel]);
  const pillarsNotYetUploaded = progressByPillar.filter((r) => !r.uploadedThisPeriod);

  if (error) return <p className="text-sm text-[hsl(var(--pk-bad))]">Couldn't load upload history: {error}</p>;
  if (uploads === null) return <div className="flex items-center gap-1.5 text-sm text-[hsl(var(--pk-ink-faint))]"><Loader2 className="h-4 w-4 animate-spin" />Loading upload history…</div>;

  return (
    <div className="flex flex-col gap-4">
      {showProgressGrid ? (
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
            {progressByEntity.map((r) => (
              <div
                key={r.entity.id}
                className={cn(
                  "rounded-lg border shadow-card p-3",
                  r.uploadedThisPeriod ? "border-[hsl(var(--pk-border))] bg-[hsl(var(--pk-surface))]" : "border-[hsl(var(--pk-bad))]/40 bg-[hsl(var(--pk-bad-soft))]"
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
      ) : (
        entityId && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="text-[11px] uppercase tracking-wide text-[hsl(var(--pk-ink-faint))]">Upload progress — {currentPeriodLabel}</div>
              {pillarsNotYetUploaded.length > 0 ? (
                <span className="inline-flex items-center gap-1 text-[11px] font-medium text-[hsl(var(--pk-bad))]">
                  <AlertTriangle className="h-3 w-3" />{pillarsNotYetUploaded.length} of {progressByPillar.length} not yet uploaded
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-[11px] font-medium text-[hsl(var(--pk-good))]">
                  <Check className="h-3 w-3" />All pillars have uploaded
                </span>
              )}
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {progressByPillar.map((r) => (
                <div
                  key={r.module}
                  className={cn(
                    "rounded-lg border shadow-card p-3",
                    r.uploadedThisPeriod ? "border-[hsl(var(--pk-border))] bg-[hsl(var(--pk-surface))]" : "border-[hsl(var(--pk-bad))]/40 bg-[hsl(var(--pk-bad-soft))]"
                  )}
                >
                  <div className="text-[11px] uppercase tracking-wide text-[hsl(var(--pk-ink-faint))] truncate">{r.sheet}</div>
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
        )
      )}

      <div className="relative max-w-sm">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[hsl(var(--pk-ink-faint))]" />
        <input
          value={search}
          onChange={(e) => changeSearch(e.target.value)}
          placeholder="Search by file, sheet, uploader…"
          className="w-full rounded-md border border-[hsl(var(--pk-border))] bg-[hsl(var(--pk-surface))] pl-8 pr-3 py-1.5 text-sm outline-none focus:border-[hsl(var(--pk-accent))] transition-colors"
        />
      </div>

      {filtered.length === 0 ? (
        <NoDataState
          title={scoped.length === 0 ? "No uploads yet" : "No matches"}
          body={scoped.length === 0 ? "Every Excel template upload from Data Entry — file, uploader, and every row it touched — will be logged here." : "No uploads match your search."}
        />
      ) : (
        <div className="flex flex-col gap-2">
          <div className="rounded-lg border border-[hsl(var(--pk-border))] bg-[hsl(var(--pk-surface))] shadow-card overflow-x-auto">
            <table className="w-full text-sm min-w-[760px]">
              <thead>
                <tr className="text-[11px] uppercase tracking-wide text-[hsl(var(--pk-ink-faint))] bg-[hsl(var(--pk-surface-2))]">
                  <th className="text-left font-medium px-3 py-2">File</th>
                  <th className="text-left font-medium px-3 py-2">{entityId ? "Sheets" : "Entity / Sheets"}</th>
                  <th className="text-left font-medium px-3 py-2">Periods</th>
                  <th className="text-left font-medium px-3 py-2">Uploaded</th>
                  <th className="text-right font-medium px-3 py-2">Rows</th>
                  <th className="w-8"></th>
                </tr>
              </thead>
              <tbody>
                {pageItems.map((u) => {
                  const e = entityById(u.entityId);
                  const expanded = expandedId === u.id;
                  return (
                    <Fragment key={u.id}>
                      <tr
                        className="border-t border-[hsl(var(--pk-border))] cursor-pointer hover:bg-[hsl(var(--pk-surface-2))] transition-colors"
                        onClick={() => setExpandedId(expanded ? null : u.id)}
                      >
                        <td className="px-3 py-2 text-[hsl(var(--pk-ink))]">{u.fileName}<div className="font-mono-pk text-[10px] text-[hsl(var(--pk-ink-faint))]">{u.id}</div></td>
                        <td className="px-3 py-2 text-[hsl(var(--pk-ink-soft))]">{entityId ? u.sheets : <>{e.name}<div className="text-[11px] text-[hsl(var(--pk-ink-faint))]">{u.sheets}</div></>}</td>
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
          <Pager page={page} pageCount={pageCount} onChange={setPage} />
        </div>
      )}
    </div>
  );
}
