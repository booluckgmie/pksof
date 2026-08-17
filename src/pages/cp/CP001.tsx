import { ScreenHeader } from "@/components/pk/ScreenHeader";
import { Gauge } from "@/components/pk/Gauge";
import { PerspectiveCard } from "@/components/pk/PerspectiveCard";
import { InfoTip } from "@/components/pk/InfoTip";
import type { ScreenId } from "@/lib/nav";
import { useSession } from "@/lib/session";
import { useWorkflow } from "@/lib/workflow";
import { kpis } from "@/data/kpis";
import { perspectives } from "@/data/perspectives";
import { perspectiveRollup } from "@/lib/scoring";
import { periodById } from "@/data/periods";

const PERSPECTIVE_SCREEN: Record<string, ScreenId> = {
  FIN: "CP003", MG: "CP004", CUST: "CP005", IBP: "CP006", OC: "CP007", BE: "CP008",
};

export function CP001({ onNavigate }: { onNavigate: (id: ScreenId) => void }) {
  const { entityId, periodId } = useSession();
  const { latestValue } = useWorkflow();
  const period = periodById(periodId);
  const getResult = (kpiId: string) => latestValue(kpiId, entityId, periodId);

  const overall = kpis.reduce((sum, k) => sum + (getResult(k.id).weighted ?? 0), 0) * 100;

  return (
    <div>
      <ScreenHeader id="CP001" subtitle="Consolidated achievement across all six Strategic Perspectives, with drill-down to KPI detail." onNavigate={onNavigate} />

      <div className="rounded-lg border border-[hsl(var(--pk-border))] bg-[hsl(var(--pk-surface))] p-5 flex flex-col md:flex-row items-center gap-6 mb-6">
        <Gauge value={overall} cumulativeThreshold={period.cumulativeThreshold} mofThreshold={period.mofThreshold} label="YTD achievement" size={220} />
        <div className="flex-1 w-full overflow-x-auto">
          <table className="w-full text-sm min-w-[420px]">
            <thead>
              <tr className="text-[11px] uppercase tracking-wide text-[hsl(var(--pk-ink-faint))]">
                <th className="text-left font-medium pb-1.5">Metric</th>
                <th className="text-right font-medium pb-1.5">YTD</th>
                <th className="text-right font-medium pb-1.5">Q2</th>
                <th className="text-right font-medium pb-1.5">Q3</th>
                <th className="text-right font-medium pb-1.5">Q4</th>
              </tr>
            </thead>
            <tbody className="tnum">
              <tr className="border-t border-[hsl(var(--pk-border))]">
                <td className="py-1.5 text-[hsl(var(--pk-ink-soft))]">Cumulative Threshold</td>
                <td className="text-right py-1.5">25.0%</td><td className="text-right py-1.5 text-[hsl(var(--pk-ink-faint))]">50.0%</td><td className="text-right py-1.5 text-[hsl(var(--pk-ink-faint))]">75.0%</td><td className="text-right py-1.5 text-[hsl(var(--pk-ink-faint))]">100.0%</td>
              </tr>
              <tr className="border-t border-[hsl(var(--pk-border))]">
                <td className="py-1.5 text-[hsl(var(--pk-ink-soft))]">MOF's Threshold</td>
                <td className="text-right py-1.5">20.0%</td><td className="text-right py-1.5 text-[hsl(var(--pk-ink-faint))]">40.0%</td><td className="text-right py-1.5 text-[hsl(var(--pk-ink-faint))]">60.0%</td><td className="text-right py-1.5 text-[hsl(var(--pk-ink-faint))]">80.0%</td>
              </tr>
              <tr className="border-t border-[hsl(var(--pk-border))] font-semibold">
                <td className="py-1.5 text-[hsl(var(--pk-ink))]">
                  <span className="inline-flex items-center gap-1.5">
                    Result (Weighted Achievement)
                    <InfoTip title="Weighted Achievement">
                      Capped at each KPI's own weighting — over-performance on one KPI never compensates a shortfall elsewhere. Sum of all 13 KPIs' weighted achievement, per MOF guidance.
                    </InfoTip>
                  </span>
                </td>
                <td className="text-right py-1.5 text-[hsl(var(--pk-good))]">{overall.toFixed(1)}%</td><td className="text-right py-1.5 text-[hsl(var(--pk-ink-faint))]">N/A</td><td className="text-right py-1.5 text-[hsl(var(--pk-ink-faint))]">N/A</td><td className="text-right py-1.5 text-[hsl(var(--pk-ink-faint))]">N/A</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div className="text-[11px] uppercase tracking-wide text-[hsl(var(--pk-ink-faint))] mb-2">Strategic Perspectives Performance (YTD)</div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {perspectives.map((p) => {
          const roll = perspectiveRollup(p.id, getResult);
          return (
            <PerspectiveCard
              key={p.id}
              name={p.name}
              weight={p.weight}
              achievement={roll.achievementPct}
              kpiCount={roll.kpiCount}
              onOpen={() => onNavigate(PERSPECTIVE_SCREEN[p.id])}
            />
          );
        })}
      </div>
    </div>
  );
}
