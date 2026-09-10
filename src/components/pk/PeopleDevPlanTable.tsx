import { Fragment, useState } from "react";
import { Plus, Pencil, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { useSession } from "@/lib/session";
import { useDetails, PEOPLE_DEV_SUB_AREAS, type PeopleDevRecord, type PeopleDevSubArea } from "@/lib/details";
import { upsertDetailRecord, deleteDetailRecord } from "@/lib/api/details";
import { periodById } from "@/data/periods";
import type { InitiativeStatus } from "@/data/initiatives";
import type { PeriodId } from "@/types";
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
  statusNote: string;
}

const BLANK = (subArea: PeopleDevSubArea): FormState => ({ id: null, subArea, programme: "", start: "", end: "", status: "Planned", detail: "", statusNote: "" });

let seq = 1;
const newRecordId = () => `PDP-${Date.now().toString(36)}-${String(seq++).padStart(3, "0")}`;

// Detail/Status cells hold one bullet per line; a line that starts with leading whitespace
// renders as an indented sub-bullet, matching the client's own report tables (e.g. a top-level
// "Total sessions..." bullet with ELDP/MLDP/ISLDP breakdown nested under it).
function BulletList({ text }: { text: string }) {
  const lines = text.split("\n").map((l) => l.replace(/\s+$/, "")).filter((l) => l.trim().length > 0);
  if (lines.length === 0) return <span className="text-[hsl(var(--pk-ink-faint))]">—</span>;
  return (
    <ul className="flex flex-col gap-1">
      {lines.map((line, i) => {
        const nested = /^\s/.test(line);
        return (
          <li key={i} className={cn("flex gap-1.5 text-[12px] leading-snug", nested ? "ml-4 text-[hsl(var(--pk-ink-faint))]" : "text-[hsl(var(--pk-ink-soft))]")}>
            <span className="shrink-0">{nested ? "o" : "▪"}</span>
            <span>{line.trim()}</span>
          </li>
        );
      })}
    </ul>
  );
}

/**
 * KPI 10 — People Development Programme detail: the "Not measured" banner plus the full
 * grouped/editable table (No / Programme / Start / End / Detail / Status, one row per programme
 * under each of the 4 sub-areas). Shared between CP009 (its own dedicated screen) and CP007
 * (shown inline once the KPI10 card there is expanded) so both stay in sync — there is only one
 * implementation of this table, not two drifting copies.
 */
export function PeopleDevPlanTable({ periodId, kpi10YtdActual }: { periodId: PeriodId; kpi10YtdActual: number | null }) {
  const { entityId, canEnterData } = useSession();
  const { peopleDevRecordsFor, refresh } = useDetails();
  const period = periodById(periodId);
  const records = peopleDevRecordsFor(periodId);
  const [form, setForm] = useState<FormState | null>(null);
  const [saving, setSaving] = useState(false);
  const colSpanAll = canEnterData ? 7 : 6;

  const startAdd = (subArea: PeopleDevSubArea) => setForm(BLANK(subArea));
  const startEdit = (r: PeopleDevRecord) => setForm({ id: r.id, subArea: r.subArea, programme: r.programme, start: r.start, end: r.end, status: r.status, detail: r.detail, statusNote: r.statusNote });
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
        textNote: [form.start, form.end, form.status].join("|") + "|" + form.detail + "\u001F" + form.statusNote,
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
    <div className="rounded-lg border border-[hsl(var(--pk-border))] bg-[hsl(var(--pk-surface))] shadow-card overflow-hidden">
      {kpi10YtdActual === null && (
        <div className="m-3 inline-block rounded-md border border-[hsl(var(--pk-border))] bg-[hsl(var(--pk-surface-2))] px-3 py-1.5 text-[12px] font-semibold text-[hsl(var(--pk-ink))]">
          Not measured in {period.label.split(" ")[0]}. Progress only.
        </div>
      )}
      <div className="overflow-x-auto">
        <table className="w-full text-sm border-collapse min-w-[900px]">
          <thead>
            <tr className="bg-[hsl(var(--pk-navy))] text-white">
              <th rowSpan={2} className="w-10 px-3 py-2 text-left align-middle border border-[hsl(var(--pk-navy))]">No</th>
              <th rowSpan={2} className="px-3 py-2 text-left align-middle border border-[hsl(var(--pk-navy))]">People Development Programme</th>
              <th colSpan={2} className="px-3 py-1.5 text-center border border-[hsl(var(--pk-navy))]">Implementation Timeline</th>
              <th rowSpan={2} className="px-3 py-2 text-left align-middle border border-[hsl(var(--pk-navy))] w-[26%]">Detail</th>
              <th rowSpan={2} className="px-3 py-2 text-left align-middle border border-[hsl(var(--pk-navy))] w-[26%]">Status</th>
              {canEnterData && <th rowSpan={2} className="w-16 px-2 py-2 border border-[hsl(var(--pk-navy))]"></th>}
            </tr>
            <tr className="bg-[hsl(var(--pk-navy))] text-white">
              <th className="px-3 py-1.5 text-center text-[11px] font-medium border border-[hsl(var(--pk-navy))]">Start</th>
              <th className="px-3 py-1.5 text-center text-[11px] font-medium border border-[hsl(var(--pk-navy))]">End</th>
            </tr>
          </thead>
          <tbody>
            {PEOPLE_DEV_SUB_AREAS.map((subArea, gi) => {
              const rows = records.filter((r) => r.subArea === subArea);
              return (
                <Fragment key={subArea}>
                  <tr className="bg-[hsl(var(--pk-surface-2))]">
                    <td colSpan={colSpanAll} className="px-3 py-2 border border-[hsl(var(--pk-border))]">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-bold text-[hsl(var(--pk-ink))]">{gi + 1}&emsp;{subArea}</span>
                        {canEnterData && (
                          <button
                            onClick={() => startAdd(subArea)}
                            className="flex items-center gap-1 text-[11px] font-medium text-[hsl(var(--pk-accent))] hover:opacity-75 transition-opacity shrink-0"
                          >
                            <Plus className="h-3 w-3" />Add programme
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>

                  {rows.length === 0 && form?.subArea !== subArea && (
                    <tr>
                      <td colSpan={colSpanAll} className="px-3 py-3 text-[12px] text-[hsl(var(--pk-ink-faint))] border border-[hsl(var(--pk-border))]">No programmes recorded for this period yet.</td>
                    </tr>
                  )}

                  {rows.map((r, ri) => (
                    <Fragment key={r.id}>
                      {form?.id === r.id ? (
                        <tr>
                          <td colSpan={colSpanAll} className="p-0 border border-[hsl(var(--pk-border))]">
                            <RowForm form={form} setForm={setForm} onSave={save} onCancel={cancel} saving={saving} />
                          </td>
                        </tr>
                      ) : (
                        <tr className="align-top hover:bg-[hsl(var(--pk-surface-2))] transition-colors">
                          <td className="px-3 py-2.5 border border-[hsl(var(--pk-border))] text-[hsl(var(--pk-ink-faint))]">{String.fromCharCode(97 + ri)})</td>
                          <td className="px-3 py-2.5 border border-[hsl(var(--pk-border))] font-medium text-[hsl(var(--pk-ink))]">{r.programme}</td>
                          <td className="px-3 py-2.5 border border-[hsl(var(--pk-border))] text-center whitespace-nowrap">{r.start}</td>
                          <td className="px-3 py-2.5 border border-[hsl(var(--pk-border))] text-center whitespace-nowrap">{r.end}</td>
                          <td className="px-3 py-2.5 border border-[hsl(var(--pk-border))]"><BulletList text={r.detail} /></td>
                          <td className="px-3 py-2.5 border border-[hsl(var(--pk-border))]"><BulletList text={r.statusNote.trim() ? r.statusNote : r.status} /></td>
                          {canEnterData && (
                            <td className="px-2 py-2.5 border border-[hsl(var(--pk-border))]">
                              <div className="flex items-center gap-1">
                                <button onClick={() => startEdit(r)} className="p-1.5 rounded-md text-[hsl(var(--pk-ink-faint))] hover:text-[hsl(var(--pk-ink))] hover:bg-[hsl(var(--pk-surface-2))] transition-colors" title="Edit">
                                  <Pencil className="h-3.5 w-3.5" />
                                </button>
                                <button onClick={() => remove(r.id)} className="p-1.5 rounded-md text-[hsl(var(--pk-ink-faint))] hover:text-[hsl(var(--pk-bad))] hover:bg-[hsl(var(--pk-bad-soft))] transition-colors" title="Delete">
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              </div>
                            </td>
                          )}
                        </tr>
                      )}
                    </Fragment>
                  ))}

                  {form && form.id === null && form.subArea === subArea && (
                    <tr>
                      <td colSpan={colSpanAll} className="p-0 border border-[hsl(var(--pk-border))]">
                        <RowForm form={form} setForm={setForm} onSave={save} onCancel={cancel} saving={saving} />
                      </td>
                    </tr>
                  )}
                </Fragment>
              );
            })}
          </tbody>
        </table>
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
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        <label className="flex flex-col gap-1">
          <span className="text-[10.5px] uppercase tracking-wide text-[hsl(var(--pk-ink-faint))]">Detail — one bullet per line (indent a line for a sub-bullet)</span>
          <textarea
            value={form.detail}
            onChange={(e) => setForm({ ...form, detail: e.target.value })}
            rows={4}
            className="rounded-md border border-[hsl(var(--pk-border))] px-2.5 py-1.5 text-sm bg-[hsl(var(--pk-surface))] outline-none resize-none font-mono-pk"
            placeholder={"Continuation of 2025 LDPs\n  ELDP – 3 modules x 3 sessions"}
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-[10.5px] uppercase tracking-wide text-[hsl(var(--pk-ink-faint))]">Status update — one bullet per line (leave blank to just show "{form.status}" in the table)</span>
          <textarea
            value={form.statusNote}
            onChange={(e) => setForm({ ...form, statusNote: e.target.value })}
            rows={4}
            className="rounded-md border border-[hsl(var(--pk-border))] px-2.5 py-1.5 text-sm bg-[hsl(var(--pk-surface))] outline-none resize-none font-mono-pk"
            placeholder={"ELDP programmes will commence in April:\n  15 – 16 Apr"}
          />
        </label>
      </div>
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
