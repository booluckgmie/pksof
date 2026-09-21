import { useState } from "react";
import { Plus, Pencil, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { useSession } from "@/lib/session";
import { useDetails } from "@/lib/details";
import { upsertDetailRecord, deleteDetailRecord } from "@/lib/api/details";
import type { PeriodId } from "@/types";
import { cn } from "@/lib/utils";

interface FormState {
  id: string | null;
  no: string;
  label: string;
  fyTarget: string;
  ytdActual: string;
  achievement: string;
}

const BLANK: FormState = { id: null, no: "", label: "", fyTarget: "", ytdActual: "", achievement: "" };

let seq = 1;
const newRecordId = () => `GOV-${Date.now().toString(36)}-${String(seq++).padStart(3, "0")}`;

/**
 * Governance Index component breakdown (CP004, KPI4) — same gap as ManagedEntityKpiEditor: the
 * Excel template only ever carries the Weighted figure, and the component's own wording (label,
 * FY Target, YTD Actual, Achievement — "not yet due" is itself a wording value, not a number) has
 * never had an in-app editor. One quarter at a time.
 */
export function GovernanceKpiEditor({ periodId }: { periodId: PeriodId }) {
  const { entityId, canEnterData } = useSession();
  const { governanceKpiItemsFor, refresh } = useDetails();
  const items = governanceKpiItemsFor(periodId);
  const [form, setForm] = useState<FormState | null>(null);
  const [saving, setSaving] = useState(false);

  if (!canEnterData) return null;

  const startAdd = () => setForm(BLANK);
  const startEdit = (r: (typeof items)[number]) => setForm({ id: r.id, no: String(r.no), label: r.label, fyTarget: r.fyTarget, ytdActual: r.ytdActual, achievement: r.achievement });
  const cancel = () => setForm(null);

  const save = async () => {
    if (!form || !form.label.trim()) return;
    setSaving(true);
    const existing = items.find((i) => i.id === form.id);
    try {
      await upsertDetailRecord({
        id: form.id ?? newRecordId(),
        entityId,
        periodId,
        recordType: "governance_kpi",
        label: form.label.trim(),
        category: null,
        valueNum2: existing?.weighted ?? null,
        textNote: [form.no, form.fyTarget, form.ytdActual, form.achievement].join("|"),
      });
      await refresh();
      setForm(null);
    } catch {
      toast.error("Couldn't save this component — check your connection and try again.");
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id: string) => {
    try {
      await deleteDetailRecord(id);
      await refresh();
    } catch {
      toast.error("Couldn't delete this component — check your connection and try again.");
    }
  };

  return (
    <div className="rounded-lg border border-dashed border-[hsl(var(--pk-border))] bg-[hsl(var(--pk-surface-2))] p-3 mb-3 flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="text-2xs uppercase tracking-wide text-[hsl(var(--pk-ink-faint))] font-semibold">Manage components — this quarter</span>
        {!form && (
          <button onClick={startAdd} className="flex items-center gap-1 text-2xs font-medium text-[hsl(var(--pk-accent))] hover:opacity-75 transition-opacity">
            <Plus className="h-3 w-3" />Add component
          </button>
        )}
      </div>
      <p className="text-3xs text-[hsl(var(--pk-ink-faint))]">Weighted Achievement comes from the Excel upload — only the component's own wording is edited here. Leave Achievement blank for a component not yet due this quarter.</p>

      {items.length === 0 && !form && <p className="text-2xs text-[hsl(var(--pk-ink-faint))]">Nothing entered for this quarter yet.</p>}

      {items.map((r) =>
        form?.id === r.id ? (
          <RowForm key={r.id} form={form} setForm={setForm} onSave={save} onCancel={cancel} saving={saving} />
        ) : (
          <div key={r.id} className="flex items-center justify-between gap-2 rounded-md border border-[hsl(var(--pk-border))] bg-[hsl(var(--pk-surface))] px-3 py-2">
            <div className="min-w-0">
              <div className="text-xs font-medium text-[hsl(var(--pk-ink))] truncate">{r.no ? `${r.no}. ` : ""}{r.label}</div>
              <div className="text-3xs text-[hsl(var(--pk-ink-faint))]">FY {r.fyTarget || "—"} · YTD Actual {r.ytdActual || "—"} · Achievement {r.achievement || "not yet due"}</div>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <button onClick={() => startEdit(r)} className="p-1.5 rounded-md text-[hsl(var(--pk-ink-faint))] hover:text-[hsl(var(--pk-ink))] hover:bg-[hsl(var(--pk-surface-2))] transition-colors" title="Edit">
                <Pencil className="h-3.5 w-3.5" />
              </button>
              <button onClick={() => remove(r.id)} className="p-1.5 rounded-md text-[hsl(var(--pk-ink-faint))] hover:text-[hsl(var(--pk-bad))] hover:bg-[hsl(var(--pk-bad-soft))] transition-colors" title="Delete">
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        )
      )}

      {form && form.id === null && <RowForm form={form} setForm={setForm} onSave={save} onCancel={cancel} saving={saving} />}
    </div>
  );
}

function RowForm({
  form, setForm, onSave, onCancel, saving,
}: {
  form: FormState;
  setForm: (f: FormState) => void;
  onSave: () => void;
  onCancel: () => void;
  saving: boolean;
}) {
  return (
    <div className="rounded-md border border-[hsl(var(--pk-accent))] bg-[hsl(var(--pk-surface))] px-3 py-2.5 flex flex-col gap-2.5">
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5">
        <label className="flex flex-col gap-1 sm:col-span-3">
          <span className="text-3xs uppercase tracking-wide text-[hsl(var(--pk-ink-faint))]">Component</span>
          <input value={form.label} onChange={(e) => setForm({ ...form, label: e.target.value })} className="rounded-md border border-[hsl(var(--pk-border))] px-2.5 py-1.5 text-sm bg-[hsl(var(--pk-surface))] outline-none" placeholder="e.g. Implementation of Risk Action Plan (RAP) within the timeline" />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-3xs uppercase tracking-wide text-[hsl(var(--pk-ink-faint))]">No</span>
          <input value={form.no} onChange={(e) => setForm({ ...form, no: e.target.value })} className="rounded-md border border-[hsl(var(--pk-border))] px-2.5 py-1.5 text-sm bg-[hsl(var(--pk-surface))] outline-none" placeholder="e.g. 3" />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-3xs uppercase tracking-wide text-[hsl(var(--pk-ink-faint))]">FY Target</span>
          <input value={form.fyTarget} onChange={(e) => setForm({ ...form, fyTarget: e.target.value })} className="rounded-md border border-[hsl(var(--pk-border))] px-2.5 py-1.5 text-sm bg-[hsl(var(--pk-surface))] outline-none" placeholder="e.g. 100% within timeline" />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-3xs uppercase tracking-wide text-[hsl(var(--pk-ink-faint))]">YTD Actual</span>
          <input value={form.ytdActual} onChange={(e) => setForm({ ...form, ytdActual: e.target.value })} className="rounded-md border border-[hsl(var(--pk-border))] px-2.5 py-1.5 text-sm bg-[hsl(var(--pk-surface))] outline-none" placeholder="e.g. On track" />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-3xs uppercase tracking-wide text-[hsl(var(--pk-ink-faint))]">Achievement (blank = not yet due)</span>
          <input value={form.achievement} onChange={(e) => setForm({ ...form, achievement: e.target.value })} className="rounded-md border border-[hsl(var(--pk-border))] px-2.5 py-1.5 text-sm bg-[hsl(var(--pk-surface))] outline-none" placeholder="e.g. Met" />
        </label>
      </div>
      <div className="flex items-center gap-2 justify-end">
        <button onClick={onCancel} className="flex items-center gap-1 text-2xs text-[hsl(var(--pk-ink-faint))] hover:text-[hsl(var(--pk-ink))] px-2.5 py-1.5">
          <X className="h-3.5 w-3.5" />Cancel
        </button>
        <button
          onClick={onSave}
          disabled={saving || !form.label.trim()}
          className={cn(
            "rounded-md bg-[hsl(var(--pk-accent))] text-[hsl(var(--pk-accent-ink))] text-2xs font-medium px-3 py-1.5 hover:opacity-90 transition-opacity",
            (saving || !form.label.trim()) && "opacity-40 pointer-events-none"
          )}
        >
          {saving ? "Saving…" : "Save"}
        </button>
      </div>
    </div>
  );
}
