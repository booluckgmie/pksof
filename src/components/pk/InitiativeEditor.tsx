import { useState } from "react";
import { Plus, Pencil, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { useSession } from "@/lib/session";
import { useDetails } from "@/lib/details";
import { upsertDetailRecord, deleteDetailRecord } from "@/lib/api/details";
import type { InitiativeStatus } from "@/data/initiatives";
import type { PeriodId } from "@/types";
import { cn } from "@/lib/utils";

const STATUSES: InitiativeStatus[] = ["Planned", "In Progress", "Completed", "Delayed", "On Hold"];

interface FormState {
  id: string | null;
  name: string;
  start: string;
  end: string;
  status: InitiativeStatus;
  nextAction: string;
}

const BLANK: FormState = { id: null, name: "", start: "", end: "", status: "Planned", nextAction: "" };

let seq = 1;
const newRecordId = (recordType: string) => `${recordType.toUpperCase()}-${Date.now().toString(36)}-${String(seq++).padStart(3, "0")}`;

/**
 * Process/Technology Initiative rows (KPI7/KPI8, CP006) — the Excel template's own Instructions
 * sheet claims these "stay entered directly in-app", but until now nothing in the app actually
 * offered an add/edit form for them (CP006's InitiativeTable was read-only). Mirrors
 * PeopleDevPlanTable's own inline add/edit/delete pattern, one flat list (no sub-areas) since
 * Process/Tech Initiatives were never grouped that way.
 */
export function InitiativeEditor({ recordType, periodId }: { recordType: "process_initiative" | "tech_initiative"; periodId: PeriodId }) {
  const { entityId, canEnterData } = useSession();
  const { initiativeRecordsFor, refresh } = useDetails();
  const rows = initiativeRecordsFor(recordType, periodId);
  const [form, setForm] = useState<FormState | null>(null);
  const [saving, setSaving] = useState(false);

  const startAdd = () => setForm(BLANK);
  const startEdit = (r: (typeof rows)[number]) => setForm({ id: r.id, name: r.name, start: r.start, end: r.end, status: r.status, nextAction: r.nextAction });
  const cancel = () => setForm(null);

  const save = async () => {
    if (!form || !form.name.trim()) return;
    setSaving(true);
    try {
      await upsertDetailRecord({
        id: form.id ?? newRecordId(recordType),
        entityId,
        periodId,
        recordType,
        label: form.name.trim(),
        category: `${form.start}-${form.end}`,
        textNote: `${form.status} | ${form.nextAction}`,
      });
      await refresh();
      setForm(null);
    } catch {
      toast.error("Couldn't save this initiative — check your connection and try again.");
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id: string) => {
    try {
      await deleteDetailRecord(id);
      await refresh();
    } catch {
      toast.error("Couldn't delete this initiative — check your connection and try again.");
    }
  };

  if (!canEnterData) return null;

  return (
    <div className="rounded-lg border border-dashed border-[hsl(var(--pk-border))] bg-[hsl(var(--pk-surface-2))] p-3 mb-3 flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="text-2xs uppercase tracking-wide text-[hsl(var(--pk-ink-faint))] font-semibold">Manage initiatives — this quarter</span>
        {!form && (
          <button onClick={startAdd} className="flex items-center gap-1 text-2xs font-medium text-[hsl(var(--pk-accent))] hover:opacity-75 transition-opacity">
            <Plus className="h-3 w-3" />Add initiative
          </button>
        )}
      </div>

      {rows.length === 0 && !form && (
        <p className="text-2xs text-[hsl(var(--pk-ink-faint))]">Nothing entered for this quarter yet.</p>
      )}

      {rows.map((r) =>
        form?.id === r.id ? (
          <InitiativeRowForm key={r.id} form={form} setForm={setForm} onSave={save} onCancel={cancel} saving={saving} />
        ) : (
          <div key={r.id} className="flex items-center justify-between gap-2 rounded-md border border-[hsl(var(--pk-border))] bg-[hsl(var(--pk-surface))] px-3 py-2">
            <div className="min-w-0">
              <div className="text-xs font-medium text-[hsl(var(--pk-ink))] truncate">{r.name}</div>
              <div className="text-3xs text-[hsl(var(--pk-ink-faint))]">{r.start} → {r.end} · {r.status}{r.nextAction ? ` · ${r.nextAction}` : ""}</div>
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

      {form && form.id === null && <InitiativeRowForm form={form} setForm={setForm} onSave={save} onCancel={cancel} saving={saving} />}
    </div>
  );
}

function InitiativeRowForm({
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
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        <label className="flex flex-col gap-1 sm:col-span-2">
          <span className="text-3xs uppercase tracking-wide text-[hsl(var(--pk-ink-faint))]">Initiative name</span>
          <input
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="rounded-md border border-[hsl(var(--pk-border))] px-2.5 py-1.5 text-sm bg-[hsl(var(--pk-surface))] outline-none"
            placeholder="e.g. SOP Digitisation — Phase 2"
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-3xs uppercase tracking-wide text-[hsl(var(--pk-ink-faint))]">Start</span>
          <input value={form.start} onChange={(e) => setForm({ ...form, start: e.target.value })} className="rounded-md border border-[hsl(var(--pk-border))] px-2.5 py-1.5 text-sm bg-[hsl(var(--pk-surface))] outline-none" placeholder="e.g. Q1 FY26" />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-3xs uppercase tracking-wide text-[hsl(var(--pk-ink-faint))]">End</span>
          <input value={form.end} onChange={(e) => setForm({ ...form, end: e.target.value })} className="rounded-md border border-[hsl(var(--pk-border))] px-2.5 py-1.5 text-sm bg-[hsl(var(--pk-surface))] outline-none" placeholder="e.g. Q3 FY26" />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-3xs uppercase tracking-wide text-[hsl(var(--pk-ink-faint))]">Status</span>
          <select
            value={form.status}
            onChange={(e) => setForm({ ...form, status: e.target.value as InitiativeStatus })}
            className="rounded-md border border-[hsl(var(--pk-border))] px-2.5 py-1.5 text-sm bg-[hsl(var(--pk-surface))] outline-none"
          >
            {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-3xs uppercase tracking-wide text-[hsl(var(--pk-ink-faint))]">Next action</span>
          <input value={form.nextAction} onChange={(e) => setForm({ ...form, nextAction: e.target.value })} className="rounded-md border border-[hsl(var(--pk-border))] px-2.5 py-1.5 text-sm bg-[hsl(var(--pk-surface))] outline-none" placeholder="e.g. Vendor selection due 15 Mar" />
        </label>
      </div>
      <div className="flex items-center gap-2 justify-end">
        <button onClick={onCancel} className="flex items-center gap-1 text-2xs text-[hsl(var(--pk-ink-faint))] hover:text-[hsl(var(--pk-ink))] px-2.5 py-1.5">
          <X className="h-3.5 w-3.5" />Cancel
        </button>
        <button
          onClick={onSave}
          disabled={saving || !form.name.trim()}
          className={cn(
            "rounded-md bg-[hsl(var(--pk-accent))] text-[hsl(var(--pk-accent-ink))] text-2xs font-medium px-3 py-1.5 hover:opacity-90 transition-opacity",
            (saving || !form.name.trim()) && "opacity-40 pointer-events-none"
          )}
        >
          {saving ? "Saving…" : "Save"}
        </button>
      </div>
    </div>
  );
}
