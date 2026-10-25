import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Search, Loader2, HelpCircle, Columns3, Ban, FilePlus2 } from "lucide-react";
import { NoDataState } from "@/components/pk/DataOrigin";
import { Pager } from "@/components/pk/Pager";
import { entityById } from "@/data/entities";
import { cn } from "@/lib/utils";
import type { EntityId } from "@/types";
import {
  fetchTemplateOverflowEntries,
  resolveTemplateOverflowEntry,
  type TemplateOverflowEntry,
  type OverflowStatus,
} from "@/lib/api/templateOverflow";

const PAGE_SIZE = 10;

const REASON_LABEL: Record<TemplateOverflowEntry["reason"], string> = {
  unmatched_row: "Row not in template",
  unmatched_column: "Column not recognized",
  non_numeric_value: "Text typed into a number cell",
  conflict: "Duplicated with a different value",
};

const REASON_ICON: Record<TemplateOverflowEntry["reason"], typeof HelpCircle> = {
  unmatched_row: HelpCircle,
  unmatched_column: Columns3,
  non_numeric_value: HelpCircle,
  conflict: Ban,
};

function matchesSearch(e: TemplateOverflowEntry, query: string): boolean {
  if (!query.trim()) return true;
  const haystack = `${e.sheet} ${e.rowLabel} ${e.rowSub} ${e.rawValue} ${e.periodLabel ?? ""} ${REASON_LABEL[e.reason]}`.toLowerCase();
  return haystack.includes(query.trim().toLowerCase());
}

function ResolveRow({ entry, reviewerName, onResolved }: { entry: TemplateOverflowEntry; reviewerName: string; onResolved: (updated: TemplateOverflowEntry) => void }) {
  const [mode, setMode] = useState<"map" | "ignore" | "flag" | null>(null);
  const [note, setNote] = useState("");
  const [mappedKey, setMappedKey] = useState("");
  const [mappedDest, setMappedDest] = useState<"kpi" | "metric" | "record">("metric");
  const [saving, setSaving] = useState(false);

  const resolve = async (status: Exclude<OverflowStatus, "pending">) => {
    if (status === "mapped" && !mappedKey.trim()) {
      toast.error("Say which field this maps to before saving.");
      return;
    }
    setSaving(true);
    try {
      await resolveTemplateOverflowEntry({
        id: entry.id, status, resolvedBy: reviewerName, resolutionNote: note.trim() || undefined,
        mappedDest: status === "mapped" ? mappedDest : undefined,
        mappedKey: status === "mapped" ? mappedKey.trim() : undefined,
      });
      onResolved({
        ...entry, status, resolvedBy: reviewerName, resolvedAt: new Date().toISOString(),
        resolutionNote: note.trim() || null,
        mappedDest: status === "mapped" ? mappedDest : null,
        mappedKey: status === "mapped" ? mappedKey.trim() : null,
      });
      toast.success("Overflow entry resolved");
      setMode(null);
    } catch (err) {
      toast.error("Couldn't save", { description: err instanceof Error ? err.message : String(err) });
    } finally {
      setSaving(false);
    }
  };

  if (mode === null) {
    return (
      <div className="flex items-center gap-1.5 flex-wrap">
        <button onClick={() => setMode("map")} className="text-2xs font-medium rounded-md px-2 py-1 border border-[hsl(var(--pk-border))] hover:border-[hsl(var(--pk-accent))] hover:text-[hsl(var(--pk-accent))] transition-colors">Map to existing field</button>
        <button onClick={() => setMode("ignore")} className="text-2xs font-medium rounded-md px-2 py-1 border border-[hsl(var(--pk-border))] hover:border-[hsl(var(--pk-ink-faint))] transition-colors">Ignore</button>
        <button onClick={() => setMode("flag")} className="text-2xs font-medium rounded-md px-2 py-1 border border-[hsl(var(--pk-border))] hover:border-[hsl(var(--pk-warn))] hover:text-[hsl(var(--pk-warn))] transition-colors">Flag for next template</button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-1.5 rounded-md border border-[hsl(var(--pk-border))] bg-[hsl(var(--pk-surface-2))] p-2.5">
      {mode === "map" && (
        <div className="flex items-center gap-1.5">
          <select value={mappedDest} onChange={(e) => setMappedDest(e.target.value as "kpi" | "metric" | "record")} className="rounded-md border border-[hsl(var(--pk-border))] bg-[hsl(var(--pk-surface))] px-1.5 py-1 text-2xs outline-none">
            <option value="kpi">KPI</option>
            <option value="metric">Metric</option>
            <option value="record">Record</option>
          </select>
          <input
            value={mappedKey}
            onChange={(e) => setMappedKey(e.target.value)}
            placeholder="e.g. financial_trend / revenue"
            className="flex-1 rounded-md border border-[hsl(var(--pk-border))] bg-[hsl(var(--pk-surface))] px-2 py-1 text-2xs outline-none focus:border-[hsl(var(--pk-accent))]"
          />
        </div>
      )}
      <textarea
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder={mode === "map" ? "Note for the record — e.g. who'll re-enter this, and where." : mode === "ignore" ? "Why this can be ignored (e.g. duplicate, test data)." : "What the next template revision should add."}
        rows={2}
        className="rounded-md border border-[hsl(var(--pk-border))] bg-[hsl(var(--pk-surface))] px-2 py-1.5 text-2xs outline-none resize-none focus:border-[hsl(var(--pk-accent))]"
      />
      <div className="flex items-center gap-2 justify-end">
        <button onClick={() => setMode(null)} disabled={saving} className="text-2xs text-[hsl(var(--pk-ink-faint))] px-2 py-1">Cancel</button>
        <button
          onClick={() => resolve(mode === "map" ? "mapped" : mode === "ignore" ? "ignored" : "flagged_for_template")}
          disabled={saving}
          className="text-2xs font-medium rounded-md px-2.5 py-1 bg-[hsl(var(--pk-accent))] text-[hsl(var(--pk-accent-ink))] hover:opacity-90 transition-opacity disabled:opacity-50"
        >
          {saving ? <Loader2 className="h-3 w-3 animate-spin" /> : "Save"}
        </button>
      </div>
    </div>
  );
}

/**
 * The "customize table" review queue — every row/column/cell an upload couldn't place (see
 * excelTemplate.ts's OverflowReason) lands in template_overflow_entries instead of vanishing;
 * this is where an admin/approving officer actually looks at them. Mapping a resolved entry to a
 * real field only records that decision (mappedDest/mappedKey) for traceability — it does not
 * itself write a live value anywhere; the actual figure still goes in through the normal Data
 * Entry/in-app flow, same as any other submission, so nothing here bypasses the checker queue.
 */
export function OverflowPanel({ entityId, reviewerName }: { entityId?: EntityId; reviewerName: string }) {
  const [entries, setEntries] = useState<TemplateOverflowEntry[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [showResolved, setShowResolved] = useState(false);

  useEffect(() => {
    fetchTemplateOverflowEntries()
      .then(setEntries)
      .catch((err: Error) => setError(err.message));
  }, []);

  const scoped = useMemo(() => (entityId ? (entries ?? []).filter((e) => e.entityId === entityId) : entries ?? []), [entries, entityId]);
  const statusFiltered = useMemo(() => scoped.filter((e) => (showResolved ? e.status !== "pending" : e.status === "pending")), [scoped, showResolved]);
  const changeSearch = (q: string) => { setSearch(q); setPage(1); };
  const filtered = useMemo(() => statusFiltered.filter((e) => matchesSearch(e, search)), [statusFiltered, search]);
  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageItems = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const pendingCount = scoped.filter((e) => e.status === "pending").length;

  const handleResolved = (updated: TemplateOverflowEntry) => {
    setEntries((prev) => (prev ? prev.map((e) => (e.id === updated.id ? updated : e)) : prev));
  };

  if (error) return <p className="text-sm text-[hsl(var(--pk-bad))]">Couldn't load the customize queue: {error}</p>;
  if (entries === null) return <div className="flex items-center gap-1.5 text-sm text-[hsl(var(--pk-ink-faint))]"><Loader2 className="h-4 w-4 animate-spin" />Loading…</div>;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="relative max-w-sm flex-1 min-w-[200px]">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[hsl(var(--pk-ink-faint))]" />
          <input
            value={search}
            onChange={(e) => changeSearch(e.target.value)}
            placeholder="Search by sheet, label, value…"
            className="w-full rounded-md border border-[hsl(var(--pk-border))] bg-[hsl(var(--pk-surface))] pl-8 pr-3 py-1.5 text-sm outline-none focus:border-[hsl(var(--pk-accent))] transition-colors"
          />
        </div>
        <div className="flex items-center gap-1 border border-[hsl(var(--pk-border))] rounded-lg p-1 bg-[hsl(var(--pk-surface))]">
          <button onClick={() => { setShowResolved(false); setPage(1); }} className={cn("rounded-md px-2.5 py-1 text-2xs font-medium transition-colors", !showResolved ? "bg-[hsl(var(--pk-accent))] text-[hsl(var(--pk-accent-ink))]" : "text-[hsl(var(--pk-ink-faint))]")}>
            Pending {pendingCount > 0 && <span className="tnum">({pendingCount})</span>}
          </button>
          <button onClick={() => { setShowResolved(true); setPage(1); }} className={cn("rounded-md px-2.5 py-1 text-2xs font-medium transition-colors", showResolved ? "bg-[hsl(var(--pk-accent))] text-[hsl(var(--pk-accent-ink))]" : "text-[hsl(var(--pk-ink-faint))]")}>
            Resolved
          </button>
        </div>
      </div>

      {filtered.length === 0 ? (
        <NoDataState
          title={showResolved ? "Nothing resolved yet" : "Nothing queued"}
          body={showResolved ? "Entries you map, ignore, or flag will show up here — nothing is ever deleted." : "Every upload row, column, or cell that didn't match the template lands here for review, instead of being silently dropped."}
        />
      ) : (
        <div className="flex flex-col gap-2">
          {pageItems.map((e) => {
            const Icon = REASON_ICON[e.reason];
            const ent = entityById(e.entityId);
            return (
              <div key={e.id} className="rounded-lg border border-[hsl(var(--pk-border))] bg-[hsl(var(--pk-surface))] shadow-card p-3 flex flex-col gap-2">
                <div className="flex items-start justify-between gap-2 flex-wrap">
                  <div className="flex flex-col gap-0.5">
                    <div className="flex items-center gap-1.5">
                      <span className="inline-flex items-center gap-1 text-2xs font-medium rounded-full px-2 py-0.5 bg-[hsl(var(--pk-warn-soft))] text-[hsl(var(--pk-warn))]">
                        <Icon className="h-3 w-3" />{REASON_LABEL[e.reason]}
                      </span>
                      <span className="text-2xs text-[hsl(var(--pk-ink-faint))]">{ent.name} · {e.sheet}</span>
                    </div>
                    <div className="text-sm text-[hsl(var(--pk-ink))] mt-0.5">
                      {e.rowLabel ? <>{e.rowLabel}{e.rowSub && e.rowSub !== "—" ? ` · ${e.rowSub}` : ""}</> : <span className="text-[hsl(var(--pk-ink-faint))]">(column header)</span>}
                      {e.periodLabel && <span className="text-[hsl(var(--pk-ink-faint))]"> · {e.periodLabel}</span>}
                    </div>
                    <div className="text-xs text-[hsl(var(--pk-ink-soft))]">
                      Typed: <span className="font-medium">{e.rawValue || "(blank)"}</span>
                      {e.reason === "conflict" && e.conflictWithValue && <> — conflicts with <span className="font-medium">{e.conflictWithValue}</span></>}
                    </div>
                  </div>
                </div>

                {e.status === "pending" ? (
                  <ResolveRow entry={e} reviewerName={reviewerName} onResolved={handleResolved} />
                ) : (
                  <div className="flex items-center gap-1.5 text-2xs text-[hsl(var(--pk-ink-faint))]">
                    <FilePlus2 className="h-3 w-3" />
                    {e.status === "mapped" ? `Mapped to ${e.mappedDest}: ${e.mappedKey}` : e.status === "ignored" ? "Ignored" : "Flagged for the next template update"}
                    {e.resolvedBy && <> · {e.resolvedBy}</>}
                    {e.resolutionNote && <span className="italic"> — "{e.resolutionNote}"</span>}
                  </div>
                )}
              </div>
            );
          })}
          <Pager page={page} pageCount={pageCount} onChange={setPage} />
        </div>
      )}
    </div>
  );
}
