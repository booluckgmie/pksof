import { useState } from "react";
import { ScreenHeader } from "@/components/pk/ScreenHeader";
import { InfoNote } from "@/components/pk/Misc";
import { useSession } from "@/lib/session";
import { useOrgSettings } from "@/lib/orgSettings";
import type { ScreenId } from "@/lib/nav";

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

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
    </div>
  );
}
