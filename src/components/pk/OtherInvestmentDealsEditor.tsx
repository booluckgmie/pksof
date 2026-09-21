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
  bank: string;
  instrument: string;
  dealDate: string;
  maturityDate: string;
  rating: string;
  tenureDays: string;
  principal: string;
  interestPct: string;
}

const BLANK: FormState = { id: null, bank: "", instrument: "", dealDate: "", maturityDate: "", rating: "", tenureDays: "", principal: "", interestPct: "" };

let seq = 1;
const newRecordId = () => `OID-${Date.now().toString(36)}-${String(seq++).padStart(3, "0")}`;

/**
 * Deal-level schedule behind PFH004's "Other investments" drill-down — unlike every other table
 * here, this record type has no Excel coverage at all, not even a numeric column (the Instructions
 * sheet still calls it out as "entered directly in-app", but nothing ever offered a form). One
 * quarter's snapshot at a time, matching how otherInvestmentsDealsFor's own read side has no
 * prior-period comparison either.
 */
export function OtherInvestmentDealsEditor({ periodId }: { periodId: PeriodId }) {
  const { entityId, canEnterData } = useSession();
  const { otherInvestmentDealItemsFor, refresh } = useDetails();
  const deals = otherInvestmentDealItemsFor(periodId);
  const [form, setForm] = useState<FormState | null>(null);
  const [saving, setSaving] = useState(false);

  if (!canEnterData) return null;

  const startAdd = () => setForm(BLANK);
  const startEdit = (d: (typeof deals)[number]) => setForm({ id: d.id, bank: d.bank, instrument: d.instrument, dealDate: d.dealDate, maturityDate: d.maturityDate, rating: d.rating, tenureDays: d.tenureDays, principal: String(d.principal), interestPct: String(d.interestPct) });
  const cancel = () => setForm(null);

  const save = async () => {
    if (!form || !form.bank.trim()) return;
    setSaving(true);
    try {
      await upsertDetailRecord({
        id: form.id ?? newRecordId(),
        entityId,
        periodId,
        recordType: "fp_other_investment_deal",
        label: form.bank.trim(),
        category: form.instrument || null,
        valueNum: form.principal.trim() === "" ? null : Number(form.principal),
        valueNum2: form.interestPct.trim() === "" ? null : Number(form.interestPct),
        textNote: [form.dealDate, form.maturityDate, form.rating, form.tenureDays].join("|"),
      });
      await refresh();
      setForm(null);
    } catch {
      toast.error("Couldn't save this deal — check your connection and try again.");
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id: string) => {
    try {
      await deleteDetailRecord(id);
      await refresh();
    } catch {
      toast.error("Couldn't delete this deal — check your connection and try again.");
    }
  };

  return (
    <div className="rounded-md border border-dashed border-[hsl(var(--pk-border))] bg-[hsl(var(--pk-surface))] p-2 flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="text-3xs uppercase tracking-wide text-[hsl(var(--pk-ink-faint))] font-semibold">Manage deals — {"this quarter's snapshot"}</span>
        {!form && (
          <button onClick={startAdd} className="flex items-center gap-1 text-2xs font-medium text-[hsl(var(--pk-accent))] hover:opacity-75 transition-opacity">
            <Plus className="h-3 w-3" />Add deal
          </button>
        )}
      </div>

      {deals.length === 0 && !form && <p className="text-2xs text-[hsl(var(--pk-ink-faint))] px-1">No deals entered for this quarter yet.</p>}

      {deals.map((d) =>
        form?.id === d.id ? (
          <RowForm key={d.id} form={form} setForm={setForm} onSave={save} onCancel={cancel} saving={saving} />
        ) : (
          <div key={d.id} className="flex items-center justify-between gap-2 rounded-md border border-[hsl(var(--pk-border))] bg-[hsl(var(--pk-surface-2))] px-2.5 py-1.5">
            <div className="min-w-0 text-xs text-[hsl(var(--pk-ink-soft))] truncate">
              <span className="font-medium text-[hsl(var(--pk-ink))]">{d.bank}</span> · {d.instrument || "—"} · {d.dealDate || "—"}→{d.maturityDate || "—"} · {d.rating || "—"} · {d.tenureDays || "—"}d · RM{d.principal.toLocaleString()} @ {d.interestPct}%
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <button onClick={() => startEdit(d)} className="p-1.5 rounded-md text-[hsl(var(--pk-ink-faint))] hover:text-[hsl(var(--pk-ink))] hover:bg-[hsl(var(--pk-surface-2))] transition-colors" title="Edit">
                <Pencil className="h-3.5 w-3.5" />
              </button>
              <button onClick={() => remove(d.id)} className="p-1.5 rounded-md text-[hsl(var(--pk-ink-faint))] hover:text-[hsl(var(--pk-bad))] hover:bg-[hsl(var(--pk-bad-soft))] transition-colors" title="Delete">
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
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        <label className="flex flex-col gap-1">
          <span className="text-3xs uppercase tracking-wide text-[hsl(var(--pk-ink-faint))]">Bank</span>
          <input value={form.bank} onChange={(e) => setForm({ ...form, bank: e.target.value })} className="rounded-md border border-[hsl(var(--pk-border))] px-2.5 py-1.5 text-sm bg-[hsl(var(--pk-surface))] outline-none" placeholder="e.g. Maybank" />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-3xs uppercase tracking-wide text-[hsl(var(--pk-ink-faint))]">Instrument</span>
          <input value={form.instrument} onChange={(e) => setForm({ ...form, instrument: e.target.value })} className="rounded-md border border-[hsl(var(--pk-border))] px-2.5 py-1.5 text-sm bg-[hsl(var(--pk-surface))] outline-none" placeholder="e.g. Fixed Deposit" />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-3xs uppercase tracking-wide text-[hsl(var(--pk-ink-faint))]">Rating</span>
          <input value={form.rating} onChange={(e) => setForm({ ...form, rating: e.target.value })} className="rounded-md border border-[hsl(var(--pk-border))] px-2.5 py-1.5 text-sm bg-[hsl(var(--pk-surface))] outline-none" placeholder="e.g. AAA" />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-3xs uppercase tracking-wide text-[hsl(var(--pk-ink-faint))]">Tenure (days)</span>
          <input value={form.tenureDays} onChange={(e) => setForm({ ...form, tenureDays: e.target.value })} className="rounded-md border border-[hsl(var(--pk-border))] px-2.5 py-1.5 text-sm bg-[hsl(var(--pk-surface))] outline-none" placeholder="e.g. 90" />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-3xs uppercase tracking-wide text-[hsl(var(--pk-ink-faint))]">Deal date</span>
          <input value={form.dealDate} onChange={(e) => setForm({ ...form, dealDate: e.target.value })} className="rounded-md border border-[hsl(var(--pk-border))] px-2.5 py-1.5 text-sm bg-[hsl(var(--pk-surface))] outline-none" placeholder="e.g. 12/01/2026" />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-3xs uppercase tracking-wide text-[hsl(var(--pk-ink-faint))]">Maturity date</span>
          <input value={form.maturityDate} onChange={(e) => setForm({ ...form, maturityDate: e.target.value })} className="rounded-md border border-[hsl(var(--pk-border))] px-2.5 py-1.5 text-sm bg-[hsl(var(--pk-surface))] outline-none" placeholder="e.g. 12/04/2026" />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-3xs uppercase tracking-wide text-[hsl(var(--pk-ink-faint))]">Principal (RM'000)</span>
          <input type="number" value={form.principal} onChange={(e) => setForm({ ...form, principal: e.target.value })} className="rounded-md border border-[hsl(var(--pk-border))] px-2.5 py-1.5 text-sm bg-[hsl(var(--pk-surface))] outline-none tnum" placeholder="e.g. 5000" />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-3xs uppercase tracking-wide text-[hsl(var(--pk-ink-faint))]">Interest (%)</span>
          <input type="number" step="0.01" value={form.interestPct} onChange={(e) => setForm({ ...form, interestPct: e.target.value })} className="rounded-md border border-[hsl(var(--pk-border))] px-2.5 py-1.5 text-sm bg-[hsl(var(--pk-surface))] outline-none tnum" placeholder="e.g. 3.35" />
        </label>
      </div>
      <div className="flex items-center gap-2 justify-end">
        <button onClick={onCancel} className="flex items-center gap-1 text-2xs text-[hsl(var(--pk-ink-faint))] hover:text-[hsl(var(--pk-ink))] px-2.5 py-1.5">
          <X className="h-3.5 w-3.5" />Cancel
        </button>
        <button
          onClick={onSave}
          disabled={saving || !form.bank.trim()}
          className={cn(
            "rounded-md bg-[hsl(var(--pk-accent))] text-[hsl(var(--pk-accent-ink))] text-2xs font-medium px-3 py-1.5 hover:opacity-90 transition-opacity",
            (saving || !form.bank.trim()) && "opacity-40 pointer-events-none"
          )}
        >
          {saving ? "Saving…" : "Save"}
        </button>
      </div>
    </div>
  );
}
