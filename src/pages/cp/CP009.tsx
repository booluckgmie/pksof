import { useState } from "react";
import { Plus, Pencil, Trash2, X, GraduationCap, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import { ScreenHeader } from "@/components/pk/ScreenHeader";
import { InfoNote, InitiativeStatusDot } from "@/components/pk/Misc";
import { StatusChip } from "@/components/pk/StatusChip";
import { useSession } from "@/lib/session";
import { useWorkflow } from "@/lib/workflow";
import { useDetails, PEOPLE_DEV_SUB_AREAS, type PeopleDevRecord, type PeopleDevSubArea } from "@/lib/details";
import { upsertDetailRecord, deleteDetailRecord } from "@/lib/api/details";
import type { InitiativeStatus } from "@/data/initiatives";
import type { ScreenId } from "@/lib/nav";
import { cn } from "@/lib/utils";

const STATUSES: InitiativeStatus[] = ["Planned", "In Progress", "Completed", "Delayed", "On Hold"];

interface FormState {
  id: string | null;
  subArea: PeopleDevSubArea;
  programme: string;
  start: string;
  end: string;
  status: InitiativeStatus;
  detail: string;
}

const BLANK = (subArea: PeopleDevSubArea): FormState => ({ id: null, subArea, programme: "", start: "", end: "", status: "Planned", detail: "" });

let seq = 1;
const newRecordId = () => `PDP-${Date.now().toString(36)}-${String(seq++).padStart(3, "0")}`;

export function CP009({ onNavigate }: { onNavigate: (id: ScreenId) => void }) {
  const { entityId, periodId, canEnterData } = useSession();
  const { latestValue } = useWorkflow();
  const { peopleDevRecordsFor, refresh } = useDetails();
  const kpi10 = latestValue("KPI10", entityId, periodId);
  const records = peopleDevRecordsFor(periodId);
  const [form, setForm] = useState<FormState | null>(null);
  const [saving, setSaving] = useState(false);

  const startAdd = (subArea: PeopleDevSubArea) => setForm(BLANK(subArea));
  const startEdit = (r: PeopleDevRecord) => setForm({ id: r.id, subArea: r.subArea, programme: r.programme, start: r.start, end: r.end, status: r.status, detail: r.detail });
  const cancel = () => setForm(null);

  const save = async () => {
    if (!form || !form.programme.trim()) return;
    setSaving(true);
    try {
      await upsertDetailRecord({
        id: form.id ?? newRecordId(),
        entityId,
        periodId,
        recordType: "people_dev_programme",
        label: form.programme.trim(),
        category: form.subArea,
        textNote: [form.start, form.end, form.status, form.detail].join("|"),
      });
      await refresh();
      setForm(null);
    } catch {
      toast.error("Couldn't save this programme — check your connection and try again.");
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id: string) => {
    try {
      await deleteDetailRecord(id);
      await refresh();
    } catch {
      toast.error("Couldn't delete this programme — check your connection and try again.");
    }
  };

  return (
    <div>
      <ScreenHeader id="CP009" subtitle="Organisational Capacity performance: People Development Programme. Weight 10.0%." onNavigate={onNavigate} />

      <div className="rounded-lg border border-[hsl(var(--pk-border))] bg-[hsl(var(--pk-surface))] shadow-card p-4 mb-4 flex items-center justify-between">
        <div>
          <div className="text-[11px] uppercase tracking-wide text-[hsl(var(--pk-ink-faint))]">KPI 10 · Weighted Achievement {kpi10.weighted !== null ? (kpi10.weighted * 100).toFixed(1) : "—"}%</div>
          <div className="font-head font-bold text-[hsl(var(--pk-ink))]">People Development Programme</div>
        </div>
        <StatusChip status={kpi10.status} />
      </div>

      <InfoNote>
        Talent Management, Succession Management, Performance Management and Talent/Culture Engagement, by reporting period. {canEnterData ? "Add, edit or remove entries below for the currently selected reporting period." : "Read-only for your role — Reporting Officer or System Administrator can edit."}
      </InfoNote>

      <button
        type="button"
        onClick={() => onNavigate("CP007")}
        className="mt-3 w-full flex items-center justify-between gap-3 rounded-lg border border-[hsl(var(--pk-border))] bg-[hsl(var(--pk-surface))] shadow-card px-4 py-3 text-left hover:bg-[hsl(var(--pk-surface-2))] transition-colors"
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <GraduationCap className="h-4 w-4 text-[hsl(var(--pk-accent))] shrink-0" />
          <div className="min-w-0">
            <div className="text-sm font-medium text-[hsl(var(--pk-ink))]">Recruitment Efficiency Index</div>
            <div className="text-[11.5px] text-[hsl(var(--pk-ink-faint))]">KPI 9 · the other half of Organisational Capacity — CP007</div>
          </div>
        </div>
        <ChevronRight className="h-4 w-4 text-[hsl(var(--pk-ink-faint))] shrink-0" />
      </button>

      <div className="flex flex-col gap-4 mt-4">
        {PEOPLE_DEV_SUB_AREAS.map((subArea) => {
          const rows = records.filter((r) => r.subArea === subArea);
          return (
            <div key={subArea} className="rounded-lg border border-[hsl(var(--pk-border))] bg-[hsl(var(--pk-surface))] shadow-card overflow-hidden">
              <div className="flex items-center justify-between px-4 py-2.5 bg-[hsl(var(--pk-surface-2))]">
                <div className="text-[11px] uppercase tracking-wide text-[hsl(var(--pk-ink-faint))] font-semibold">{subArea}</div>
                {canEnterData && (
                  <button
                    onClick={() => startAdd(subArea)}
                    className="flex items-center gap-1 text-[11px] font-medium text-[hsl(var(--pk-accent))] hover:opacity-75 transition-opacity"
                  >
                    <Plus className="h-3 w-3" />Add programme
                  </button>
                )}
              </div>

              {rows.length === 0 && form?.subArea !== subArea && (
                <p className="text-[12px] text-[hsl(var(--pk-ink-faint))] px-4 py-3">No programmes recorded for this period yet.</p>
              )}

              <div className="divide-y divide-[hsl(var(--pk-border))]">
                {rows.map((r) => (
                  <div key={r.id}>
                    {form?.id === r.id ? (
                      <RowForm form={form} setForm={setForm} onSave={save} onCancel={cancel} saving={saving} />
                    ) : (
                      <div className="px-4 py-3 flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-[hsl(var(--pk-ink))]">{r.programme}</span>
                            <InitiativeStatusDot status={r.status} />
                          </div>
                          <div className="text-[11px] text-[hsl(var(--pk-ink-faint))] mt-0.5">{r.start} → {r.end}</div>
                          {r.detail && <p className="text-[12px] text-[hsl(var(--pk-ink-soft))] mt-1.5">{r.detail}</p>}
                        </div>
                        {canEnterData && (
                          <div className="flex items-center gap-1 shrink-0">
                            <button onClick={() => startEdit(r)} className="p-1.5 rounded-md text-[hsl(var(--pk-ink-faint))] hover:text-[hsl(var(--pk-ink))] hover:bg-[hsl(var(--pk-surface-2))] transition-colors" title="Edit">
                              <Pencil className="h-3.5 w-3.5" />
                            </button>
                            <button onClick={() => remove(r.id)} className="p-1.5 rounded-md text-[hsl(var(--pk-ink-faint))] hover:text-[hsl(var(--pk-bad))] hover:bg-[hsl(var(--pk-bad-soft))] transition-colors" title="Delete">
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
                {form && form.id === null && form.subArea === subArea && (
                  <RowForm form={form} setForm={setForm} onSave={save} onCancel={cancel} saving={saving} />
                )}
              </div>
            </div>
          );
        })}
      </div>
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
    <div className="px-4 py-3 bg-[hsl(var(--pk-surface-2))] flex flex-col gap-2.5">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        <label className="flex flex-col gap-1">
          <span className="text-[10.5px] uppercase tracking-wide text-[hsl(var(--pk-ink-faint))]">Programme name</span>
          <input
            value={form.programme}
            onChange={(e) => setForm({ ...form, programme: e.target.value })}
            className="rounded-md border border-[hsl(var(--pk-border))] px-2.5 py-1.5 text-sm bg-[hsl(var(--pk-surface))] outline-none"
            placeholder="e.g. Leadership Development Programme"
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-[10.5px] uppercase tracking-wide text-[hsl(var(--pk-ink-faint))]">Status</span>
          <select
            value={form.status}
            onChange={(e) => setForm({ ...form, status: e.target.value as InitiativeStatus })}
            className="rounded-md border border-[hsl(var(--pk-border))] px-2.5 py-1.5 text-sm bg-[hsl(var(--pk-surface))] outline-none"
          >
            {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-[10.5px] uppercase tracking-wide text-[hsl(var(--pk-ink-faint))]">Start (e.g. Apr '26)</span>
          <input value={form.start} onChange={(e) => setForm({ ...form, start: e.target.value })} className="rounded-md border border-[hsl(var(--pk-border))] px-2.5 py-1.5 text-sm bg-[hsl(var(--pk-surface))] outline-none" />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-[10.5px] uppercase tracking-wide text-[hsl(var(--pk-ink-faint))]">End (e.g. Dec '26)</span>
          <input value={form.end} onChange={(e) => setForm({ ...form, end: e.target.value })} className="rounded-md border border-[hsl(var(--pk-border))] px-2.5 py-1.5 text-sm bg-[hsl(var(--pk-surface))] outline-none" />
        </label>
      </div>
      <label className="flex flex-col gap-1">
        <span className="text-[10.5px] uppercase tracking-wide text-[hsl(var(--pk-ink-faint))]">Detail</span>
        <textarea
          value={form.detail}
          onChange={(e) => setForm({ ...form, detail: e.target.value })}
          rows={2}
          className="rounded-md border border-[hsl(var(--pk-border))] px-2.5 py-1.5 text-sm bg-[hsl(var(--pk-surface))] outline-none resize-none"
        />
      </label>
      <div className="flex items-center gap-2 justify-end">
        <button onClick={onCancel} className="flex items-center gap-1 text-[11.5px] text-[hsl(var(--pk-ink-faint))] hover:text-[hsl(var(--pk-ink))] px-2.5 py-1.5">
          <X className="h-3.5 w-3.5" />Cancel
        </button>
        <button
          onClick={onSave}
          disabled={saving || !form.programme.trim()}
          className={cn(
            "rounded-md bg-[hsl(var(--pk-accent))] text-[hsl(var(--pk-accent-ink))] text-[11.5px] font-medium px-3 py-1.5 hover:opacity-90 transition-opacity",
            (saving || !form.programme.trim()) && "opacity-40 pointer-events-none"
          )}
        >
          {saving ? "Saving…" : "Save"}
        </button>
      </div>
    </div>
  );
}
