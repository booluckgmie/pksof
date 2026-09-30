import { useEffect, useState, type ReactNode } from "react";
import { toast } from "sonner";
import { useSession } from "@/lib/session";
import { useDetails } from "@/lib/details";
import { upsertDetailMetric } from "@/lib/api/details";
import type { PeriodId } from "@/types";
import { cn } from "@/lib/utils";

/**
 * The "Highlight(s)" box shown on Financial Results (QoQ), Actual vs Budget vs PY, and Financial
 * Position — one free-text box per section per quarter, so a preparer writes the highlight
 * directly rather than assembling it from several separate fields. Stored on detail_metrics' own
 * `note` column (metric_key "section_highlight", dimension = the section), same convention as
 * varianceCommentaryFor. Falls back to `fallback` (that section's own auto-computed bullets)
 * whenever nothing's been entered yet for this quarter, so the box is never empty.
 */
export function HighlightEditor({
  periodId,
  section,
  fallback,
}: {
  periodId: PeriodId;
  section: "qoq" | "budget" | "financial_position";
  fallback: ReactNode;
}) {
  const { entityId, canEnterData } = useSession();
  const { sectionHighlightFor, refresh } = useDetails();
  const saved = sectionHighlightFor(periodId, section);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(saved);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (editing) setDraft(saved);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editing, periodId, section]);

  const save = async () => {
    setSaving(true);
    try {
      await upsertDetailMetric({ entityId, periodId, metricKey: "section_highlight", dimension: section, value: null, note: draft });
      await refresh();
      setEditing(false);
      toast.success("Highlight updated");
    } catch {
      toast.error("Couldn't save the highlight — check your connection and try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <div className="text-2xs uppercase tracking-wide text-[hsl(var(--pk-accent))] font-semibold">Highlight(s)</div>
        {canEnterData && !editing && (
          <button onClick={() => setEditing(true)} className="text-2xs font-medium text-[hsl(var(--pk-accent))] hover:opacity-75 transition-opacity">
            {saved.trim() ? "Edit" : "Add highlight"}
          </button>
        )}
      </div>
      {editing ? (
        <div className="flex flex-col gap-2">
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            rows={3}
            maxLength={2000}
            className="rounded-md border border-[hsl(var(--pk-border))] px-2.5 py-1.5 text-xs bg-[hsl(var(--pk-surface))] outline-none resize-none"
            placeholder="e.g. Income was RM2.3 million (8%) higher than the preceding quarter, driven by acquired-loans income and SJPP management fee."
          />
          <div className="text-3xs text-[hsl(var(--pk-ink-faint))] text-right -mt-1">{draft.length}/2000</div>
          <div className="flex items-center gap-2 justify-end">
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
      ) : saved.trim() ? (
        <p className="text-xs text-[hsl(var(--pk-ink-soft))] leading-snug whitespace-pre-line">{saved}</p>
      ) : (
        fallback
      )}
    </div>
  );
}
