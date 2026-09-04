import { StatusChip } from "@/components/pk/StatusChip";
import { InfoTip } from "@/components/pk/InfoTip";
import { KpiMetricStrip } from "@/components/pk/KpiMetricStrip";
import type { RecruitmentMetric } from "@/lib/details";
import type { KpiResult } from "@/lib/workflow";

/** The client's own scorecard groups Time to Hire's two components (average days, MRF
 * fulfilment rate) under one merged "Time to Hire (TTH)" label — everything else is its own
 * row. Presentation-only: the two components stay separately weighted/scored in the data,
 * matching every other reporting period's shape. */
const METRIC_ACHIEVEMENT: Record<string, string> = {
  "Time to Hire (TTH)": "Average number of days taken to fill approved vacant positions",
  "MRF Fulfilment Rate": "% of all approved MRF filled (until Issuance of Offer Letter)",
  "Quality of Hire": "Number of confirmed hires",
  "Offer Acceptance Rate": "Number of Report for Duty",
};
const METRIC_GROUP: Record<string, string> = { "MRF Fulfilment Rate": "Time to Hire (TTH)" };

/**
 * KPI 9 — Recruitment Efficiency Index, rendered exactly to the client's own MOF-format
 * scorecard: a Weight/FY Target/YTD Target/YTD Actual/Weighted Achievement strip, then a
 * Metric / Weight / Performance Achievement / Score / Computation / Weighted Score table, then
 * the operational notes behind each row. Shared between CP007 (Organisational Capacity, this
 * KPI's own perspective screen) and RP001 (Resource & People, Section B) so both stay visually
 * identical and in sync — this was previously two separate, drifting table implementations.
 */
export function RecruitmentIndexScorecard({
  kpi9,
  recruitmentIndex,
  weightPct,
  fy,
  periodLabel,
  fyTarget,
}: {
  kpi9: KpiResult;
  recruitmentIndex: RecruitmentMetric[] | undefined;
  weightPct: string;
  fy: string;
  periodLabel: string;
  fyTarget: number;
}) {
  const totalWeighted = recruitmentIndex?.reduce((s, m) => s + m.weighted, 0) ?? null;

  return (
    <div className="rounded-lg border border-[hsl(var(--pk-border))] bg-[hsl(var(--pk-surface))] shadow-card p-4">
      <div className="flex items-center justify-between mb-3">
        <div>
          <div className="text-[11px] uppercase tracking-wide text-[hsl(var(--pk-ink-faint))]">KPI 9 · Weight {weightPct}</div>
          <div className="font-head font-bold text-[hsl(var(--pk-ink))] inline-flex items-center gap-1.5">
            Recruitment Efficiency Index
            <InfoTip title="Recruitment Efficiency Index">
              Sum of four weighted components — Time to Hire, MRF Fulfilment, Quality of Hire, Offer Acceptance. Each component's score is out of 5 (or a ratio), multiplied by its own weight.
            </InfoTip>
          </div>
        </div>
        <StatusChip status={kpi9.status} />
      </div>

      <KpiMetricStrip
        fy={fy}
        periodLabel={periodLabel}
        fyTarget={`${fyTarget.toFixed(1)}%`}
        ytdTarget={kpi9.ytdTarget !== null ? `${kpi9.ytdTarget.toFixed(1)}%` : "N/A"}
        ytdActual={kpi9.ytdActual !== null ? `${kpi9.ytdActual.toFixed(1)}%` : "—"}
        achievement={kpi9.weighted !== null ? `${(kpi9.weighted * 100).toFixed(1)}%` : "—"}
        status={kpi9.status}
      />

      {recruitmentIndex && totalWeighted !== null ? (
        <>
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[680px]">
              <thead>
                <tr className="text-[11px] uppercase tracking-wide text-white bg-[hsl(var(--pk-navy))]">
                  <th className="text-left font-medium px-3 py-2">Metric</th>
                  <th className="text-right font-medium px-3 py-2">Weight</th>
                  <th className="text-left font-medium px-3 py-2">Performance Achievement</th>
                  <th className="text-left font-medium px-3 py-2">Score</th>
                  <th className="text-left font-medium px-3 py-2">Computation</th>
                  <th className="text-right font-medium px-3 py-2">Weighted Score</th>
                </tr>
              </thead>
              <tbody>
                {recruitmentIndex.map((m, i) => {
                  const scoreDisplay = m.score || (m.weight > 0 ? `${Math.round((m.weighted / m.weight) * 100)}%` : "—");
                  const grouped = METRIC_GROUP[m.metric];
                  const next = recruitmentIndex[i + 1];
                  const rowspan = !grouped && next && METRIC_GROUP[next.metric] === m.metric ? 2 : 1;
                  return (
                    <tr key={m.metric} className="border-t border-[hsl(var(--pk-border))]">
                      {!grouped && (
                        <td className="px-3 py-2 align-top font-medium text-[hsl(var(--pk-ink))]" rowSpan={rowspan}>{m.metric}</td>
                      )}
                      <td className="text-right px-3 py-2 tnum">{(m.weight * 100).toFixed(0)}%</td>
                      <td className="px-3 py-2 text-[hsl(var(--pk-ink-soft))]">{METRIC_ACHIEVEMENT[m.metric] ?? m.metric}</td>
                      <td className="px-3 py-2 tnum text-[hsl(var(--pk-ink-faint))]">{scoreDisplay}</td>
                      <td className="px-3 py-2 tnum text-[hsl(var(--pk-ink-faint))]">{m.computation || `${scoreDisplay} x ${(m.weight * 100).toFixed(0)}%`}</td>
                      <td className="text-right px-3 py-2 tnum font-semibold">{(m.weighted * 100).toFixed(1)}%</td>
                    </tr>
                  );
                })}
                <tr className="border-t-2 border-[hsl(var(--pk-border))] bg-[hsl(var(--pk-surface-2))] font-semibold">
                  <td className="px-3 py-2" colSpan={5}>Total</td>
                  <td className="text-right px-3 py-2 tnum text-[hsl(var(--pk-accent))]">{(totalWeighted * 100).toFixed(1)}%</td>
                </tr>
              </tbody>
            </table>
          </div>
          <div className="mt-3 flex flex-col gap-1.5">
            <div className="text-[11px] font-medium text-[hsl(var(--pk-ink-soft))]">Notes:</div>
            <div className="text-[11px] text-[hsl(var(--pk-ink-faint))]">
              i. Scoring (out of 5): 1 – 75 days (score 5), 76 – 150 days (score 4), 151 – 225 days (score 3), 226 – 300 days (score 2), &gt;300 days (score 1)
            </div>
            <div className="text-[11px] text-[hsl(var(--pk-ink-faint))]">
              ii. Scoring (out of 5): 90 – 100% (score 5), 80 – 89% (score 4), 70 – 79% days (score 3), 50 – 69% days (score 2), &lt;50% (score 1)
            </div>
          </div>
          <p className="text-[11px] text-[hsl(var(--pk-ink-faint))] mt-2">MRF: Manpower Requisition Form.</p>
        </>
      ) : (
        <p className="text-[11.5px] text-[hsl(var(--pk-ink-faint))]">Component breakdown not tracked for this reporting period.</p>
      )}
    </div>
  );
}
