import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useSession } from "@/lib/session";
import { useDetails } from "@/lib/details";
import { upsertDetailMetric } from "@/lib/api/details";
import type { PeriodId } from "@/types";
import { cn } from "@/lib/utils";

const FIELDS: { key: "revenue" | "staffCost" | "adminCost" | "pbt" | "outlook"; label: string; placeholder: string }[] = [
  { key: "revenue", label: "Revenue", placeholder: "e.g. Higher income mainly attributable to acquired loans and SJPP management fee." },
  { key: "staffCost", label: "Staff Cost", placeholder: "e.g. Lower personnel cost due to headcount below budget." },
  { key: "adminCost", label: "Admin & Operating Cost", placeholder: "e.g. Lower IT and Corporate Communication project spend." },
  { key: "pbt", label: "Profit Before Tax", placeholder: "e.g. Higher PBT driven by the income and cost movements above." },
  { key: "outlook", label: "Outlook", placeholder: "e.g. Full-year PBT expected to remain ahead of budget." },
];

/**
 * Budget-variance commentary (PFH003, "YTD Actual vs YTD Budget") — a narrative sentence per
 * driver rather than a number, so the Excel template can't carry it at all (it's numeric-only by
 * construction). Nothing in the app read or wrote this before: details.tsx's own varianceCommentary
 * memo existed but had no consumer, and no in-app form ever offered to fill it in. Stored on
 * detail_metrics' own `note` column (dimension = revenue/staffCost/adminCost/pbt/outlook, value
 * left null) rather than detail_records, since it's a single free-text field per dimension with no
 * further structure.
 */
export function VarianceCommentaryPanel({ periodId }: { periodId: PeriodId }) {
  const { entityId, canEnterData } = useSession();
  const { varianceCommentaryFor, refresh } = useDetails();
  const commentary = varianceCommentaryFor(periodId);
  const [editing, setEditing] = useState(false);
  const [drafts, setDrafts] = useState(commentary);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (editing) setDrafts(commentary);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editing, periodId]);

  const hasAny = FIELDS.some((f) => commentary[f.key].trim() !== "");

  const save = async () => {
    setSaving(true);
    try {
      for (const f of FIELDS) {
        await upsertDetailMetric({ entityId, periodId, metricKey: "variance_commentary", dimension: f.key, value: null, note: drafts[f.key] });
      }
      await refresh();
      setEditing(false);
      toast.success("Variance commentary updated");
    } catch {
      toast.error("Couldn't save the commentary — check your connection and try again.");
    } finally {
      setSaving(false);
    }
  };

  if (!canEnterData && !hasAny) return null;

  return (
    <div className="rounded-lg border border-[hsl(var(--pk-border))] bg-[hsl(var(--pk-surface))] shadow-card p-4 mb-4">
      <div className="flex items-center justify-between mb-2">
        <div className="font-head font-bold text-[hsl(var(--pk-ink))]">Variance Commentary</div>
        {canEnterData && !editing && (
          <button onClick={() => setEditing(true)} className="text-2xs font-medium text-[hsl(var(--pk-accent))] hover:opacity-75 transition-opacity">
            {hasAny ? "Edit" : "Add commentary"}
          </button>
        )}
      </div>

      {editing ? (
        <div className="flex flex-col gap-2.5">
          {FIELDS.map((f) => (
            <label key={f.key} className="flex flex-col gap-1">
              <span className="text-3xs uppercase tracking-wide text-[hsl(var(--pk-ink-faint))]">{f.label}</span>
              <textarea
                value={drafts[f.key]}
                onChange={(e) => setDrafts({ ...drafts, [f.key]: e.target.value })}
                rows={2}
                className="rounded-md border border-[hsl(var(--pk-border))] px-2.5 py-1.5 text-sm bg-[hsl(var(--pk-surface))] outline-none resize-none"
                placeholder={f.placeholder}
              />
            </label>
          ))}
          <div className="flex items-center gap-2 justify-end mt-1">
            <button onClick={() => setEditing(false)} className="text-2xs text-[hsl(var(--pk-ink-faint))] hover:text-[hsl(var(--pk-ink))] px-2.5 py-1.5">Cancel</button>
            <button
              onClick={save}
              disabled={saving}
              className={cn("rounded-md bg-[hsl(var(--pk-accent))] text-[hsl(var(--pk-accent-ink))] text-2xs font-medium px-3 py-1.5 hover:opacity-90 transition-opacity", saving && "opacity-40 pointer-events-none")}
            >
              {saving ? "Saving…" : "Save"}
            </button>
          </div>
        </div>
      ) : hasAny ? (
        <div className="flex flex-col gap-2">
          {FIELDS.filter((f) => commentary[f.key].trim() !== "").map((f) => (
            <div key={f.key} className="text-xs text-[hsl(var(--pk-ink-soft))]">
              <span className="font-semibold text-[hsl(var(--pk-ink))]">{f.label}: </span>{commentary[f.key]}
            </div>
          ))}
        </div>
      ) : (
        <p className="text-xs text-[hsl(var(--pk-ink-faint))]">No commentary entered for this quarter yet.</p>
      )}
    </div>
  );
}
