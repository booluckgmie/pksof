import { ScreenHeader } from "@/components/pk/ScreenHeader";
import { StatusChip } from "@/components/pk/StatusChip";
import { DataOriginBadge } from "@/components/pk/DataOrigin";
import { InfoTip } from "@/components/pk/InfoTip";
import type { ScreenId } from "@/lib/nav";
import { useSession } from "@/lib/session";
import { useWorkflow } from "@/lib/workflow";
import { kpis } from "@/data/kpis";
import { perspectives } from "@/data/perspectives";

const PERSPECTIVE_SCREEN: Record<string, ScreenId> = {
  FIN: "CP003", MG: "CP004", CUST: "CP005", IBP: "CP006", OC: "CP007", BE: "CP008",
};

function fmt(v: number | null, unit: string) {
  if (v === null) return "—";
  if (unit === "RM mil") return `RM ${v.toFixed(1)}m`;
  if (unit === "%") return `${v.toFixed(1)}%`;
  if (unit === "rating /5") return v.toFixed(1);
  return v.toFixed(0);
}

export function CP002({ onNavigate }: { onNavigate: (id: ScreenId) => void }) {
  const { entityId, periodId } = useSession();
  const { latestValue } = useWorkflow();

  let totalWeighted = 0;

  return (
    <div>
      <ScreenHeader id="CP002" subtitle="All KPI performance grouped by the six perspectives for the selected period." onNavigate={onNavigate} />

      <div className="rounded-lg border border-[hsl(var(--pk-border))] bg-[hsl(var(--pk-surface))] shadow-card overflow-x-auto">
        <table className="w-full text-sm min-w-[900px]">
          <thead>
            <tr className="text-[11px] uppercase tracking-wide text-[hsl(var(--pk-ink-faint))] bg-[hsl(var(--pk-surface-2))]">
              <th className="text-left font-medium px-3 py-2">Perspective</th>
              <th className="text-right font-medium px-3 py-2">Wt</th>
              <th className="text-left font-medium px-3 py-2">#</th>
              <th className="text-left font-medium px-3 py-2">KPI</th>
              <th className="text-right font-medium px-3 py-2">FY Target</th>
              <th className="text-right font-medium px-3 py-2">YTD Target</th>
              <th className="text-right font-medium px-3 py-2">YTD Actual</th>
              <th className="text-right font-medium px-3 py-2">
                <span className="inline-flex items-center gap-1">
                  Weighted
                  <InfoTip title="Weighted Achievement" side="bottom">
                    KPI Weight × Achievement, capped at the KPI's own weighting — a lower-is-better KPI (like Cost-to-Income Ratio) uses FY Target ÷ Actual instead.
                  </InfoTip>
                </span>
              </th>
              <th className="text-left font-medium px-3 py-2">Status</th>
              <th className="text-left font-medium px-3 py-2">Source</th>
            </tr>
          </thead>
          <tbody>
            {perspectives.map((p) => {
              const list = kpis.filter((k) => k.perspective === p.id);
              return list.map((k, i) => {
                const r = latestValue(k.id, entityId, periodId);
                totalWeighted += r.weighted ?? 0;
                return (
                  <tr
                    key={k.id}
                    onClick={() => onNavigate(PERSPECTIVE_SCREEN[p.id])}
                    className="border-t border-[hsl(var(--pk-border))] hover:bg-[hsl(var(--pk-surface-2))] cursor-pointer transition-colors"
                  >
                    {i === 0 && (
                      <td className="px-3 py-2 align-top font-medium text-[hsl(var(--pk-ink))]" rowSpan={list.length}>
                        {p.name}
                      </td>
                    )}
                    {i === 0 && (
                      <td className="px-3 py-2 align-top text-right tnum text-[hsl(var(--pk-ink-faint))]" rowSpan={list.length}>
                        {(p.weight * 100).toFixed(1)}%
                      </td>
                    )}
                    <td className="px-3 py-2 font-mono-pk text-[11px] text-[hsl(var(--pk-ink-faint))]">{k.no}</td>
                    <td className="px-3 py-2 text-[hsl(var(--pk-ink))]">
                      <span className="inline-flex items-center gap-1.5">
                        {k.name}
                        <InfoTip title={k.name}>
                          <div className="mb-1">{k.formulaNote}</div>
                          <div className="text-[hsl(var(--pk-ink-faint))]">Data owner: {k.dataOwner}</div>
                        </InfoTip>
                      </span>
                    </td>
                    <td className="px-3 py-2 text-right tnum">{k.fyTarget !== null ? fmt(k.fyTarget, k.unit) : "—"}</td>
                    <td className="px-3 py-2 text-right tnum text-[hsl(var(--pk-ink-faint))]">{fmt(r.ytdTarget, k.unit)}</td>
                    <td className="px-3 py-2 text-right tnum font-medium">{fmt(r.ytdActual, k.unit)}</td>
                    <td className="px-3 py-2 text-right tnum font-semibold">{r.weighted !== null ? `${(r.weighted * 100).toFixed(1)}%` : "—"}</td>
                    <td className="px-3 py-2"><StatusChip status={r.status} /></td>
                    <td className="px-3 py-2"><DataOriginBadge result={r} /></td>
                  </tr>
                );
              });
            })}
          </tbody>
          <tfoot>
            <tr className="border-t-2 border-[hsl(var(--pk-border))] bg-[hsl(var(--pk-surface-2))] font-semibold">
              <td className="px-3 py-2.5" colSpan={7}>Total</td>
              <td className="px-3 py-2.5 text-right tnum text-[hsl(var(--pk-accent))]">{(totalWeighted * 100).toFixed(1)}%</td>
              <td colSpan={2} />
            </tr>
          </tfoot>
        </table>
      </div>
      <p className="text-[11.5px] text-[hsl(var(--pk-ink-faint))] mt-3">
        Workflow: Draft → Submit → Review → Approve or Reject → Publish. Only approved (published) data is shown here — use{" "}
        <button className="underline underline-offset-2 hover:text-[hsl(var(--pk-accent))]" onClick={() => onNavigate("VERIFY_PUBLISH")}>Verify &amp; Publish</button> to action pending submissions.
      </p>
    </div>
  );
}
