import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { WorkflowChip } from "@/components/pk/StatusChip";
import { NoDataState } from "@/components/pk/DataOrigin";
import { Pager } from "@/components/pk/Pager";
import { kpiById } from "@/data/kpis";
import { entityById } from "@/data/entities";
import { periodById } from "@/data/periods";
import type { Submission } from "@/types";

const PAGE_SIZE = 10;

function matchesSearch(s: Submission, query: string): boolean {
  if (!query.trim()) return true;
  const k = kpiById(s.kpiId);
  const e = entityById(s.entityId);
  const p = periodById(s.periodId);
  const haystack = `${k.name} ${e.fullName} ${e.name} ${p.label} ${s.id} ${s.submittedBy} ${s.reviewedBy ?? ""}`.toLowerCase();
  return haystack.includes(query.trim().toLowerCase());
}

/**
 * Every submit/approve/reject/publish event, searchable and paginated — shared between Verify &
 * Publish's "Audit trail" tab (every submission, org-wide) and Data Entry's own "Audit trail" tab
 * (that reporting officer's own pillar only, via the `submissions` prop already being pre-scoped
 * by the caller) so the two never drift into two different table implementations.
 */
export function AuditTrailPanel({ submissions, showEntityColumn = true }: { submissions: Submission[]; showEntityColumn?: boolean }) {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const history = useMemo(() => [...submissions].sort((a, b) => b.submittedAt.localeCompare(a.submittedAt)), [submissions]);
  const filtered = useMemo(() => history.filter((s) => matchesSearch(s, search)), [history, search]);
  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageItems = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const changeSearch = (q: string) => { setSearch(q); setPage(1); };

  return (
    <div className="flex flex-col gap-3">
      <div className="relative max-w-sm">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[hsl(var(--pk-ink-faint))]" />
        <input
          value={search}
          onChange={(e) => changeSearch(e.target.value)}
          placeholder="Search by KPI, entity, period, submitter…"
          className="w-full rounded-md border border-[hsl(var(--pk-border))] bg-[hsl(var(--pk-surface))] pl-8 pr-3 py-1.5 text-sm outline-none focus:border-[hsl(var(--pk-accent))] transition-colors"
        />
      </div>

      {filtered.length === 0 ? (
        <NoDataState
          title={history.length === 0 ? "No activity yet" : "No matches"}
          body={history.length === 0 ? "Every submit, approve, reject and publish event will be logged here — who, what, and when." : "No submissions match your search."}
        />
      ) : (
        <div className="flex flex-col gap-2">
          <div className="rounded-lg border border-[hsl(var(--pk-border))] bg-[hsl(var(--pk-surface))] shadow-card overflow-x-auto">
            <table className="w-full text-sm min-w-[680px]">
              <thead>
                <tr className="text-[11px] uppercase tracking-wide text-[hsl(var(--pk-ink-faint))] bg-[hsl(var(--pk-surface-2))]">
                  <th className="text-left font-medium px-3 py-2">KPI</th>
                  <th className="text-left font-medium px-3 py-2">{showEntityColumn ? "Entity / Period" : "Period"}</th>
                  <th className="text-right font-medium px-3 py-2">Value</th>
                  <th className="text-left font-medium px-3 py-2">Submitted</th>
                  <th className="text-left font-medium px-3 py-2">Reviewed</th>
                  <th className="text-left font-medium px-3 py-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {pageItems.map((s) => {
                  const k = kpiById(s.kpiId);
                  const e = entityById(s.entityId);
                  const p = periodById(s.periodId);
                  return (
                    <tr key={s.id} className="border-t border-[hsl(var(--pk-border))]">
                      <td className="px-3 py-2 text-[hsl(var(--pk-ink))]">{k.name}<div className="font-mono-pk text-[10px] text-[hsl(var(--pk-ink-faint))]">{s.id}</div></td>
                      <td className="px-3 py-2 text-[hsl(var(--pk-ink-soft))]">{showEntityColumn ? `${e.name} · ${p.label}` : p.label}</td>
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
          <Pager page={page} pageCount={pageCount} onChange={setPage} />
        </div>
      )}
    </div>
  );
}
