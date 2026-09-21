import { useState } from "react";
import { Plus, Pencil, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { useSession } from "@/lib/session";
import { useDetails, MANAGED_ENTITY_NAMES } from "@/lib/details";
import { upsertDetailRecord, deleteDetailRecord } from "@/lib/api/details";
import type { PeriodId } from "@/types";
import { cn } from "@/lib/utils";

interface FormState {
  id: string | null;
  entity: string;
  no: string;
  section: string;
  label: string;
  fyTarget: string;
  ytdTarget: string;
  ytdActual: string;
}

const blank = (entity: string): FormState => ({ id: null, entity, no: "", section: "", label: "", fyTarget: "", ytdTarget: "", ytdActual: "" });

let seq = 1;
const newRecordId = () => `MEK-${Date.now().toString(36)}-${String(seq++).padStart(3, "0")}`;

/**
 * Managed Entities KPI item catalog (CP004, KPI3) — the Excel template only ever carries each
 * item's Rating/Weighted figure (it needs the item to already exist to have a row to upload
 * against); the item's own wording — its No/Section/label and FY/YTD Target/Actual text, which
 * mixes %, ratings and counts rather than a uniform number — has never had an in-app editor
 * despite the template's own Instructions sheet saying it "stays entered directly in-app". One
 * quarter at a time, same as the Rating/Weighted figures it sits alongside.
 */
export function ManagedEntityKpiEditor({ periodId }: { periodId: PeriodId }) {
  const { entityId, canEnterData } = useSession();
  const { managedEntityKpiItemsFor, refresh } = useDetails();
  const [entity, setEntity] = useState<string>(MANAGED_ENTITY_NAMES[0]);
  const [form, setForm] = useState<FormState | null>(null);
  const [saving, setSaving] = useState(false);
  const items = managedEntityKpiItemsFor(entity, periodId);

  if (!canEnterData) return null;

  const startAdd = () => setForm(blank(entity));
  const startEdit = (r: (typeof items)[number]) => setForm({ id: r.id, entity, no: r.no, section: r.section, label: r.label, fyTarget: r.fyTarget, ytdTarget: r.ytdTarget, ytdActual: r.ytdActual });
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
        recordType: "managed_entity_kpi",
        label: form.label.trim(),
        category: form.entity,
        valueNum: existing?.rating ?? null,
        valueNum2: existing?.weighted ?? null,
        textNote: [form.no, form.section, form.fyTarget, form.ytdTarget, form.ytdActual].join("|"),
      });
      await refresh();
      setForm(null);
    } catch {
      toast.error("Couldn't save this item — check your connection and try again.");
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id: string) => {
    try {
      await deleteDetailRecord(id);
      await refresh();
    } catch {
      toast.error("Couldn't delete this item — check your connection and try again.");
    }
  };

  return (
    <div className="rounded-lg border border-dashed border-[hsl(var(--pk-border))] bg-[hsl(var(--pk-surface-2))] p-3 mb-4 flex flex-col gap-2">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <span className="text-2xs uppercase tracking-wide text-[hsl(var(--pk-ink-faint))] font-semibold">Manage KPI item catalog — this quarter</span>
        <div className="flex items-center gap-2">
          <select
            value={entity}
            onChange={(e) => { setEntity(e.target.value); setForm(null); }}
            className="rounded-md border border-[hsl(var(--pk-border))] px-2 py-1 text-xs bg-[hsl(var(--pk-surface))] outline-none"
          >
            {MANAGED_ENTITY_NAMES.map((e) => <option key={e} value={e}>{e}</option>)}
          </select>
          {!form && (
            <button onClick={startAdd} className="flex items-center gap-1 text-2xs font-medium text-[hsl(var(--pk-accent))] hover:opacity-75 transition-opacity">
              <Plus className="h-3 w-3" />Add item
            </button>
          )}
        </div>
      </div>
      <p className="text-3xs text-[hsl(var(--pk-ink-faint))]">Rating and Weighted Rating come from the Excel upload — only the item's own wording is edited here.</p>

      {items.length === 0 && !form && <p className="text-2xs text-[hsl(var(--pk-ink-faint))]">No items entered for {entity} this quarter yet.</p>}

      {items.map((r) =>
        form?.id === r.id ? (
          <RowForm key={r.id} form={form} setForm={setForm} onSave={save} onCancel={cancel} saving={saving} />
        ) : (
          <div key={r.id} className="flex items-center justify-between gap-2 rounded-md border border-[hsl(var(--pk-border))] bg-[hsl(var(--pk-surface))] px-3 py-2">
            <div className="min-w-0">
              <div className="text-xs font-medium text-[hsl(var(--pk-ink))] truncate">{r.no ? `${r.no}) ` : ""}{r.label}</div>
              <div className="text-3xs text-[hsl(var(--pk-ink-faint))] truncate">{r.section ? `${r.section} · ` : ""}FY {r.fyTarget || "—"} · YTD Target {r.ytdTarget || "—"} · YTD Actual {r.ytdActual || "—"}</div>
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
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
        <label className="flex flex-col gap-1 sm:col-span-2">
          <span className="text-3xs uppercase tracking-wide text-[hsl(var(--pk-ink-faint))]">KPI item</span>
          <input value={form.label} onChange={(e) => setForm({ ...form, label: e.target.value })} className="rounded-md border border-[hsl(var(--pk-border))] px-2.5 py-1.5 text-sm bg-[hsl(var(--pk-surface))] outline-none" placeholder="e.g. Processing of applications until GNL issued" />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-3xs uppercase tracking-wide text-[hsl(var(--pk-ink-faint))]">No</span>
          <input value={form.no} onChange={(e) => setForm({ ...form, no: e.target.value })} className="rounded-md border border-[hsl(var(--pk-border))] px-2.5 py-1.5 text-sm bg-[hsl(var(--pk-surface))] outline-none" placeholder="e.g. a)" />
        </label>
        <label className="flex flex-col gap-1 sm:col-span-3">
          <span className="text-3xs uppercase tracking-wide text-[hsl(var(--pk-ink-faint))]">Section</span>
          <input value={form.section} onChange={(e) => setForm({ ...form, section: e.target.value })} className="rounded-md border border-[hsl(var(--pk-border))] px-2.5 py-1.5 text-sm bg-[hsl(var(--pk-surface))] outline-none" placeholder="e.g. Mandate Performance" />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-3xs uppercase tracking-wide text-[hsl(var(--pk-ink-faint))]">FY Target</span>
          <input value={form.fyTarget} onChange={(e) => setForm({ ...form, fyTarget: e.target.value })} className="rounded-md border border-[hsl(var(--pk-border))] px-2.5 py-1.5 text-sm bg-[hsl(var(--pk-surface))] outline-none" placeholder="e.g. 80 sessions" />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-3xs uppercase tracking-wide text-[hsl(var(--pk-ink-faint))]">YTD Target</span>
          <input value={form.ytdTarget} onChange={(e) => setForm({ ...form, ytdTarget: e.target.value })} className="rounded-md border border-[hsl(var(--pk-border))] px-2.5 py-1.5 text-sm bg-[hsl(var(--pk-surface))] outline-none" placeholder="e.g. 20 sessions" />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-3xs uppercase tracking-wide text-[hsl(var(--pk-ink-faint))]">YTD Actual</span>
          <input value={form.ytdActual} onChange={(e) => setForm({ ...form, ytdActual: e.target.value })} className="rounded-md border border-[hsl(var(--pk-border))] px-2.5 py-1.5 text-sm bg-[hsl(var(--pk-surface))] outline-none" placeholder="e.g. 22 sessions" />
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
