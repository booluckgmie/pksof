import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useSession } from "@/lib/session";
import { useDetails } from "@/lib/details";
import { upsertDetailRecord } from "@/lib/api/details";
import type { PeriodId } from "@/types";
import { cn } from "@/lib/utils";

interface RowDraft {
  priorRating: string;
  sent: string;
  received: string;
}

let seq = 1;
const newRecordId = () => `CSS-${Date.now().toString(36)}-${String(seq++).padStart(3, "0")}`;

/**
 * External Client Satisfaction service breakdown (CP005, KPI5) — the Excel template only ever
 * carries each service's current rating; the survey's own prior-year comparison rating and
 * sent/received counts (packed two-numbers-per-cell, same reason the template can't hold them)
 * have never had an in-app editor. The service catalog itself is fixed (this is a fill-in-the-
 * blanks form, not an add/remove list) — one bi-annual survey period at a time.
 */
export function ClientSatisfactionServiceEditor({ periodId }: { periodId: PeriodId }) {
  const { entityId, canEnterData } = useSession();
  const { clientSatisfactionServiceItemsFor, refresh } = useDetails();
  const items = clientSatisfactionServiceItemsFor(periodId);
  const [editing, setEditing] = useState(false);
  const [drafts, setDrafts] = useState<RowDraft[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (editing) {
      setDrafts(items.map((it) => ({ priorRating: it.priorRating !== null ? String(it.priorRating) : "", sent: it.sent !== null ? String(it.sent) : "", received: it.received !== null ? String(it.received) : "" })));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editing, periodId]);

  if (!canEnterData) return null;

  const setDraft = (i: number, patch: Partial<RowDraft>) => setDrafts((prev) => prev.map((d, j) => (i === j ? { ...d, ...patch } : d)));

  const save = async () => {
    setSaving(true);
    try {
      for (let i = 0; i < items.length; i++) {
        const it = items[i];
        const d = drafts[i];
        const priorRating = d.priorRating.trim() === "" ? null : Number(d.priorRating);
        const sent = d.sent.trim() === "" ? null : Number(d.sent);
        const received = d.received.trim() === "" ? null : Number(d.received);
        await upsertDetailRecord({
          id: it.id ?? newRecordId(),
          entityId,
          periodId,
          recordType: "client_satisfaction_service",
          label: it.service,
          category: it.category || null,
          valueNum: it.rating,
          valueNum2: priorRating,
          textNote: `${sent ?? ""}|${received ?? ""}`,
        });
      }
      await refresh();
      setEditing(false);
      toast.success("Service breakdown updated");
    } catch {
      toast.error("Couldn't save the service breakdown — check your connection and try again.");
    } finally {
      setSaving(false);
    }
  };

  if (!editing) {
    return (
      <div className="flex justify-end mb-2">
        <button onClick={() => setEditing(true)} className="text-2xs font-medium text-[hsl(var(--pk-accent))] hover:opacity-75 transition-opacity">
          Edit prior-year ratings &amp; survey counts
        </button>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-[hsl(var(--pk-accent))] bg-[hsl(var(--pk-surface))] shadow-card overflow-x-auto mb-3">
      <div className="px-3 py-2 flex items-center justify-between border-b border-[hsl(var(--pk-border))]">
        <span className="text-2xs uppercase tracking-wide text-[hsl(var(--pk-ink-faint))] font-semibold">Edit prior-year rating &amp; survey counts — this survey period</span>
        <div className="flex items-center gap-2">
          <button onClick={() => setEditing(false)} className="text-2xs text-[hsl(var(--pk-ink-faint))] hover:text-[hsl(var(--pk-ink))] px-2 py-1">Cancel</button>
          <button
            onClick={save}
            disabled={saving}
            className={cn("rounded-md bg-[hsl(var(--pk-accent))] text-[hsl(var(--pk-accent-ink))] text-2xs font-medium px-3 py-1.5 hover:opacity-90 transition-opacity", saving && "opacity-40 pointer-events-none")}
          >
            {saving ? "Saving…" : "Save all"}
          </button>
        </div>
      </div>
      <table className="w-full text-sm min-w-[560px]">
        <thead>
          <tr className="text-2xs uppercase tracking-wide text-white bg-[hsl(var(--pk-navy))]">
            <th className="text-left font-medium px-3 py-2">Service</th>
            <th className="text-right font-medium px-3 py-2">Prior Rating</th>
            <th className="text-right font-medium px-3 py-2">Survey(s) Sent</th>
            <th className="text-right font-medium px-3 py-2">Response(s) Received</th>
          </tr>
        </thead>
        <tbody>
          {items.map((it, i) => (
            <tr key={it.service} className="border-t border-[hsl(var(--pk-border))]">
              <td className="px-3 py-1.5 text-[hsl(var(--pk-ink))]">{it.service}</td>
              <td className="px-2 py-1.5">
                <input type="number" step="0.1" value={drafts[i]?.priorRating ?? ""} onChange={(e) => setDraft(i, { priorRating: e.target.value })} className="w-20 rounded-md border border-[hsl(var(--pk-border))] px-2 py-1 text-xs text-right bg-[hsl(var(--pk-surface))] outline-none tnum" />
              </td>
              <td className="px-2 py-1.5">
                <input type="number" value={drafts[i]?.sent ?? ""} onChange={(e) => setDraft(i, { sent: e.target.value })} className="w-20 rounded-md border border-[hsl(var(--pk-border))] px-2 py-1 text-xs text-right bg-[hsl(var(--pk-surface))] outline-none tnum" />
              </td>
              <td className="px-2 py-1.5">
                <input type="number" value={drafts[i]?.received ?? ""} onChange={(e) => setDraft(i, { received: e.target.value })} className="w-20 rounded-md border border-[hsl(var(--pk-border))] px-2 py-1 text-xs text-right bg-[hsl(var(--pk-surface))] outline-none tnum" />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
