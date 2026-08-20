import { ChevronRight } from "lucide-react";
import { ScreenHeader } from "@/components/pk/ScreenHeader";
import { StatusChip } from "@/components/pk/StatusChip";
import { InitiativeStatusDot } from "@/components/pk/Misc";
import { InfoTip } from "@/components/pk/InfoTip";
import type { ScreenId } from "@/lib/nav";
import { useSession } from "@/lib/session";
import { useWorkflow } from "@/lib/workflow";
import { useDetails, peopleDevProgrammes } from "@/lib/details";

export function CP007({ onNavigate }: { onNavigate: (id: ScreenId) => void }) {
  const { entityId, periodId } = useSession();
  const { latestValue } = useWorkflow();
  const { recruitmentIndexByPeriod } = useDetails();
  const kpi9 = latestValue("KPI9", entityId, periodId);
  const kpi10 = latestValue("KPI10", entityId, periodId);
  const recruitmentIndex = recruitmentIndexByPeriod[periodId];

  return (
    <div>
      <ScreenHeader id="CP007" subtitle="Organisational Capacity performance: recruitment efficiency and people development. Weight 20.0%." onNavigate={onNavigate} />

      <div className="rounded-lg border border-[hsl(var(--pk-border))] bg-[hsl(var(--pk-surface))] shadow-card p-4 mb-4">
        <div className="flex items-center justify-between mb-3">
          <div>
            <div className="text-[11px] uppercase tracking-wide text-[hsl(var(--pk-ink-faint))]">KPI 9 · Weight 10.0%</div>
            <div className="font-head font-semibold text-[hsl(var(--pk-ink))] inline-flex items-center gap-1.5">
              Recruitment Efficiency Index
              <InfoTip title="Recruitment Efficiency Index">
                Sum of four weighted components — Time to Hire, MRF Fulfilment, Quality of Hire, Offer Acceptance. Each component's score is out of 5 (or a ratio), multiplied by its own weight.
              </InfoTip>
            </div>
          </div>
          <div className="text-right">
            <div className="tnum font-head text-2xl font-semibold">{kpi9.ytdActual !== null ? `${kpi9.ytdActual.toFixed(1)}%` : "—"}</div>
            <StatusChip status={kpi9.status} />
          </div>
        </div>
        {recruitmentIndex ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[520px]">
              <thead>
                <tr className="text-[11px] uppercase tracking-wide text-[hsl(var(--pk-ink-faint))]">
                  <th className="text-left font-medium py-1.5">Metric</th>
                  <th className="text-right font-medium py-1.5">Weight</th>
                  <th className="text-left font-medium py-1.5">Score</th>
                  <th className="text-right font-medium py-1.5">Weighted</th>
                </tr>
              </thead>
              <tbody>
                {recruitmentIndex.map((m) => (
                  <tr key={m.metric} className="border-t border-[hsl(var(--pk-border))]">
                    <td className="py-2">
                      <div className="text-[hsl(var(--pk-ink))]">{m.metric}</div>
                      <div className="text-[11px] text-[hsl(var(--pk-ink-faint))]">{m.note}</div>
                    </td>
                    <td className="text-right py-2 tnum">{(m.weight * 100).toFixed(0)}%</td>
                    <td className="py-2 tnum">{m.score}</td>
                    <td className="text-right py-2 tnum font-semibold">{(m.weighted * 100).toFixed(1)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-[11.5px] text-[hsl(var(--pk-ink-faint))]">Component breakdown not tracked for this reporting period in the prototype.</p>
        )}
      </div>

      <div className="rounded-lg border border-[hsl(var(--pk-border))] bg-[hsl(var(--pk-surface))] shadow-card p-4">
        <div className="flex items-center justify-between mb-3">
          <div>
            <div className="text-[11px] uppercase tracking-wide text-[hsl(var(--pk-ink-faint))]">KPI 10 · Weight 10.0%</div>
            <div className="font-head font-semibold text-[hsl(var(--pk-ink))]">People Development Programme</div>
          </div>
          <StatusChip status={kpi10.status} />
        </div>
        <div className="divide-y divide-[hsl(var(--pk-border))]">
          {peopleDevProgrammes.map((p) => (
            <div key={p.programme} className="flex items-center justify-between py-2 text-sm gap-3">
              <span className="text-[hsl(var(--pk-ink-soft))]">{p.programme}</span>
              <span className="text-[11px] text-[hsl(var(--pk-ink-faint))] shrink-0">{p.start} → {p.end}</span>
              <InitiativeStatusDot status={p.status} />
            </div>
          ))}
        </div>
        <button
          onClick={() => onNavigate("RP005")}
          className="group flex items-center gap-1 text-[11.5px] font-medium text-[hsl(var(--pk-accent))] hover:opacity-75 transition-opacity mt-3"
        >
          Manage full programme detail by sub-area
          <ChevronRight className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}
