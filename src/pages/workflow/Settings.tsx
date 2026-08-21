import { useState } from "react";
import { ScreenHeader } from "@/components/pk/ScreenHeader";
import { InfoNote } from "@/components/pk/Misc";
import { useSession } from "@/lib/session";
import { useOrgSettings } from "@/lib/orgSettings";
import { useKpiTargets } from "@/lib/kpiTargets";
import { kpis } from "@/data/kpis";
import { periods } from "@/data/periods";
import type { ScreenId } from "@/lib/nav";

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const FY_OPTIONS = [...new Set(periods.map((p) => p.fy))];

export function Settings({ onNavigate: _onNavigate }: { onNavigate: (id: ScreenId) => void }) {
  const { userName } = useSession();
  const { fiscalYearEndMonth, loading, setFiscalYearEndMonth } = useOrgSettings();
  const [draft, setDraft] = useState(fiscalYearEndMonth);
  const [saving, setSaving] = useState(false);

  const dirty = draft !== fiscalYearEndMonth;

  const handleSave = async () => {
    setSaving(true);
    try {
      await setFiscalYearEndMonth(draft, userName);
    } finally {
      setSaving(false);
    }
  };

  const { getFyTarget, getOverride, setFyTarget } = useKpiTargets();
  const [targetFy, setTargetFy] = useState(FY_OPTIONS[FY_OPTIONS.length - 1]);
  const [kpiDrafts, setKpiDrafts] = useState<Record<string, string>>({});
  const [savingKpi, setSavingKpi] = useState<string | null>(null);

  const handleSaveKpiTarget = async (kpiId: string) => {
    const raw = kpiDrafts[kpiId];
    const value = Number(raw);
    if (raw === undefined || raw.trim() === "" || Number.isNaN(value)) return;
    setSavingKpi(kpiId);
    try {
      await setFyTarget(kpiId, targetFy, value, userName);
      setKpiDrafts((prev) => {
        const next = { ...prev };
        delete next[kpiId];
        return next;
      });
    } finally {
      setSavingKpi(null);
    }
  };

  return (
    <div>
      <ScreenHeader id="SETTINGS" subtitle="Organisation-wide configuration — System Administrator only." onNavigate={_onNavigate} />

      <div className="rounded-lg border border-[hsl(var(--pk-border))] bg-[hsl(var(--pk-surface))] shadow-card p-4 max-w-lg">
        <div className="text-[11px] uppercase tracking-wide text-[hsl(var(--pk-ink-faint))] font-semibold mb-1">Fiscal year-end</div>
        <p className="text-[12.5px] text-[hsl(var(--pk-ink-faint))] mb-3">
          Every quarter label (Q1–Q4) and cumulative threshold across the dashboard is derived from this one
          value. Currently a calendar-year FY (December year-end) — change it here if the Group ever moves
          off a calendar-year FY. No code change or redeploy required.
        </p>
        <div className="flex items-center gap-2">
          <select
            value={draft}
            onChange={(e) => setDraft(Number(e.target.value))}
            disabled={loading}
            className="rounded-md border border-[hsl(var(--pk-border))] px-2.5 py-1.5 text-sm text-[hsl(var(--pk-ink))] bg-[hsl(var(--pk-surface))] outline-none disabled:opacity-50"
          >
            {MONTHS.map((m, i) => (
              <option key={m} value={i}>{m}</option>
            ))}
          </select>
          <button
            onClick={handleSave}
            disabled={!dirty || saving || loading}
            className="rounded-md bg-[hsl(var(--pk-accent))] text-[hsl(var(--pk-accent-ink))] text-xs font-medium px-3 py-1.5 hover:opacity-90 transition-opacity disabled:opacity-40 disabled:pointer-events-none"
          >
            {saving ? "Saving…" : "Save"}
          </button>
        </div>
        {dirty && !saving && (
          <p className="text-[11px] text-[hsl(var(--pk-warn))] mt-2">Unsaved change — click Save to apply.</p>
        )}
      </div>

      <div className="mt-4 max-w-lg">
        <InfoNote>
          Takes effect for new sign-ins immediately and for the "current quarter" default going forward.
          Quarters already shown in the picker keep their existing FY2025/FY2026/FY2027 labels — this
          setting doesn't retroactively relabel historical periods, only where new quarter boundaries fall.
        </InfoNote>
      </div>

      <div className="rounded-lg border border-[hsl(var(--pk-border))] bg-[hsl(var(--pk-surface))] shadow-card p-4 max-w-2xl mt-6">
        <div className="flex items-center justify-between gap-3 mb-1 flex-wrap">
          <div className="text-[11px] uppercase tracking-wide text-[hsl(var(--pk-ink-faint))] font-semibold">KPI Targets</div>
          <label className="flex items-center gap-1.5">
            <span className="text-[10.5px] uppercase tracking-wide text-[hsl(var(--pk-ink-faint))]">Fiscal year</span>
            <select
              value={targetFy}
              onChange={(e) => setTargetFy(e.target.value)}
              className="rounded-md border border-[hsl(var(--pk-border))] px-2 py-1 text-[12.5px] bg-[hsl(var(--pk-surface))] outline-none"
            >
              {FY_OPTIONS.map((fy) => <option key={fy} value={fy}>{fy}</option>)}
            </select>
          </label>
        </div>
        <p className="text-[12.5px] text-[hsl(var(--pk-ink-faint))] mb-3">
          Adjustable at year-end — each KPI's full-year target can be reset per fiscal year without a code
          change. Leave a row blank to keep using the base target from the KPI catalogue.
        </p>
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[480px]">
            <thead>
              <tr className="text-[11px] uppercase tracking-wide text-[hsl(var(--pk-ink-faint))]">
                <th className="text-left font-medium pb-1.5">KPI</th>
                <th className="text-right font-medium pb-1.5 pr-2 w-24">{targetFy} target</th>
                <th className="text-right font-medium pb-1.5 pl-2 w-32">New target</th>
                <th className="w-16"></th>
              </tr>
            </thead>
            <tbody>
              {kpis.map((k) => {
                const override = getOverride(k.id, targetFy);
                const live = getFyTarget(k.id, targetFy);
                const draftValue = kpiDrafts[k.id] ?? "";
                const rowDirty = draftValue.trim() !== "" && Number(draftValue) !== live;
                return (
                  <tr key={k.id} className="border-t border-[hsl(var(--pk-border))]">
                    <td className="py-2 pr-2">
                      <span className="font-medium text-[hsl(var(--pk-ink))]">KPI {k.no} — {k.name}</span>
                      {override !== undefined && <span className="text-[10.5px] text-[hsl(var(--pk-accent))] ml-1.5">(override)</span>}
                    </td>
                    <td className="py-2 pr-2 text-right tnum">{live}{k.unit === "%" ? "%" : ""}</td>
                    <td className="py-2 pl-2">
                      <input
                        value={draftValue}
                        onChange={(e) => setKpiDrafts((prev) => ({ ...prev, [k.id]: e.target.value }))}
                        type="number"
                        step="any"
                        placeholder={String(live)}
                        className="w-full rounded-md border border-[hsl(var(--pk-border))] px-2 py-1 text-sm bg-transparent outline-none focus:border-[hsl(var(--pk-accent))] tnum text-right"
                      />
                    </td>
                    <td className="py-2 pl-2 text-right">
                      <button
                        onClick={() => handleSaveKpiTarget(k.id)}
                        disabled={!rowDirty || savingKpi === k.id}
                        className="text-[11.5px] font-medium text-[hsl(var(--pk-accent))] disabled:opacity-30 disabled:pointer-events-none"
                      >
                        {savingKpi === k.id ? "Saving…" : "Save"}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
