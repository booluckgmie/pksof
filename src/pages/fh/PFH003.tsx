import { useState } from "react";
import { toast } from "sonner";
import { Save } from "lucide-react";
import { ScreenHeader } from "@/components/pk/ScreenHeader";
import { FhTabs } from "@/components/pk/FhTabs";
import { InfoNote } from "@/components/pk/Misc";
import type { ScreenId } from "@/lib/nav";
import { actualVsBudget, varianceCommentary } from "@/data/financialDetail";
import { useSession } from "@/lib/session";

export function PFH003({ onNavigate }: { onNavigate: (id: ScreenId) => void }) {
  const { userName, readOnly } = useSession();
  const [commentary, setCommentary] = useState(varianceCommentary);

  const save = () => {
    toast.success("Commentary updated", { description: `Recorded in the audit trail — ${userName || "Finance user"}, ${new Date().toLocaleString()}.` });
  };

  const fields: { key: keyof typeof varianceCommentary; label: string }[] = [
    { key: "revenue", label: "Revenue commentary" },
    { key: "staffCost", label: "Staff cost commentary" },
    { key: "adminCost", label: "Admin cost commentary" },
    { key: "pbt", label: "PBT commentary" },
    { key: "outlook", label: "Financial outlook" },
  ];

  return (
    <div>
      <ScreenHeader id="PFH003" subtitle="Comparative analysis of actual performance, approved budget and previous year." onNavigate={onNavigate} />
      <FhTabs current="PFH003" onNavigate={onNavigate} />

      <div className="rounded-lg border border-[hsl(var(--pk-border))] bg-[hsl(var(--pk-surface))] overflow-x-auto mb-5">
        <table className="w-full text-sm min-w-[560px]">
          <thead>
            <tr className="text-[11px] uppercase tracking-wide text-[hsl(var(--pk-ink-faint))] bg-[hsl(var(--pk-surface-2))]">
              <th className="text-left font-medium px-3 py-2">Item (RM M)</th>
              <th className="text-right font-medium px-3 py-2">Actual</th>
              <th className="text-right font-medium px-3 py-2">Budget</th>
              <th className="text-right font-medium px-3 py-2">Variance</th>
              <th className="text-right font-medium px-3 py-2">Previous Yr</th>
            </tr>
          </thead>
          <tbody>
            {actualVsBudget.map((r) => {
              const variance = r.actual - r.budget;
              const favourable = r.item.includes("Cost") ? variance < 0 : variance > 0;
              return (
                <tr key={r.item} className="border-t border-[hsl(var(--pk-border))]">
                  <td className="px-3 py-2 text-[hsl(var(--pk-ink))]">{r.item}</td>
                  <td className="px-3 py-2 text-right tnum font-medium">{r.actual.toFixed(1)}</td>
                  <td className="px-3 py-2 text-right tnum text-[hsl(var(--pk-ink-faint))]">{r.budget.toFixed(1)}</td>
                  <td className={`px-3 py-2 text-right tnum font-semibold ${favourable ? "text-[hsl(var(--pk-good))]" : "text-[hsl(var(--pk-bad))]"}`}>
                    {variance > 0 ? "+" : ""}{variance.toFixed(1)}
                  </td>
                  <td className="px-3 py-2 text-right tnum text-[hsl(var(--pk-ink-faint))]">{r.py.toFixed(1)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="text-[11px] uppercase tracking-wide text-[hsl(var(--pk-ink-faint))] mb-2">Variance Commentary — direct on-screen editing (Finance only)</div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
        {fields.map((f) => (
          <div key={f.key} className="rounded-lg border border-[hsl(var(--pk-border))] bg-[hsl(var(--pk-surface))] p-3.5">
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-[hsl(var(--pk-ink))]">{f.label}</label>
              {!readOnly && (
                <button onClick={save} className="flex items-center gap-1 text-[11px] text-[hsl(var(--pk-accent))] hover:underline">
                  <Save className="h-3 w-3" />Save
                </button>
              )}
            </div>
            <textarea
              value={commentary[f.key]}
              onChange={(e) => setCommentary((c) => ({ ...c, [f.key]: e.target.value }))}
              disabled={readOnly}
              rows={2}
              className="w-full text-sm bg-transparent border border-[hsl(var(--pk-border))] rounded-md px-2.5 py-2 outline-none text-[hsl(var(--pk-ink-soft))] disabled:opacity-70 focus:border-[hsl(var(--pk-accent))]"
            />
          </div>
        ))}
      </div>
      <InfoNote>
        This is the one screen where figures don't drive the edit path — commentary is typed directly by Finance and logged to the audit trail. Every other figure on this dashboard arrives only through Data Entry → Verify &amp; Publish.
      </InfoNote>
    </div>
  );
}
