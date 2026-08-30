import { ChevronRight } from "lucide-react";
import { ScreenHeader } from "@/components/pk/ScreenHeader";
import { StatCard } from "@/components/pk/Misc";
import { StatusChip } from "@/components/pk/StatusChip";
import { InfoTip } from "@/components/pk/InfoTip";
import { CategoryBar, BarTrend } from "@/components/pk/Charts";
import { DurationFilterBar, useDurationFilter } from "@/components/pk/DurationFilter";
import type { ScreenId } from "@/lib/nav";
import { useSession } from "@/lib/session";
import { useWorkflow } from "@/lib/workflow";
import { useDetails } from "@/lib/details";

function SectionLabel({ children }: { children: React.ReactNode }) {
  return <div className="text-[11px] uppercase tracking-wide text-[hsl(var(--pk-ink-faint))] font-semibold mb-2">{children}</div>;
}

export function RP001({ onNavigate }: { onNavigate: (id: ScreenId) => void }) {
  const { entityId, periodId } = useSession();
  const { latestValue } = useWorkflow();
  const { headcountSummaryByPeriod, headcountTrend: fullHeadcountTrend, recruitmentIndexByPeriod } = useDetails();
  const { duration, setDuration, filtered: headcountTrend } = useDurationFilter(fullHeadcountTrend);
  const kpi9 = latestValue("KPI9", entityId, periodId);
  const recruitmentIndex = recruitmentIndexByPeriod[periodId];
  const totalWeighted = recruitmentIndex?.reduce((s, m) => s + m.weighted, 0) ?? null;
  const headcountSummary = headcountSummaryByPeriod[periodId];

  return (
    <div>
      <ScreenHeader id="RP001" subtitle="Resource & People · Demographics and Recruitment Efficiency Index. Perspective weight fixed at 20%." onNavigate={onNavigate} />

      <SectionLabel>Section A — Demographics: Total Headcount</SectionLabel>
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 mb-5">
        <StatCard label="Total Employees" value={String(headcountSummary.totalEmployees)} />
        <StatCard label="Bumiputera" value={String(headcountSummary.bumiputera)} tone="good" />
        <StatCard label="Non-Bumiputera" value={String(headcountSummary.nonBumiputera)} />
        <StatCard label="Approved Headcount" value={String(headcountSummary.approvedHeadcount)} />
        <StatCard label="Vacant Position" value={String(headcountSummary.approvedHeadcount - headcountSummary.filledPosition)} tone="pending" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
        <div className="rounded-lg border border-[hsl(var(--pk-border))] bg-[hsl(var(--pk-surface))] shadow-card p-4">
          <div className="flex items-center justify-between flex-wrap gap-1.5">
            <div className="text-xs font-medium text-[hsl(var(--pk-ink-soft))]">Headcount Trend — minimum 4 quarters</div>
            <DurationFilterBar duration={duration} onChange={setDuration} total={fullHeadcountTrend.length} label="" />
          </div>
          <div className="text-[11px] text-[hsl(var(--pk-ink-faint))] mb-2">Actual headcount (HRMS) vs approved establishment</div>
          <BarTrend data={headcountTrend.map((h) => ({ label: h.period.replace(" FY", " '"), value: h.actual }))} />
        </div>
        <button onClick={() => onNavigate("RP001A")} className="group rounded-lg border border-[hsl(var(--pk-border))] bg-[hsl(var(--pk-surface))] shadow-card p-4 text-left hover:border-[hsl(var(--pk-accent))] transition-colors">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-[hsl(var(--pk-ink-soft))]">Workforce composition — click for full breakdown</span>
            <ChevronRight className="h-4 w-4 text-[hsl(var(--pk-ink-faint))] group-hover:text-[hsl(var(--pk-accent))]" />
          </div>
          <CategoryBar
            segments={[
              { label: "Bumiputera", value: headcountSummary.bumiputera, color: "hsl(var(--pk-accent))" },
              { label: "Non-Bumiputera", value: headcountSummary.nonBumiputera, color: "hsl(var(--pk-surface-2))" },
            ]}
          />
        </button>
      </div>

      <SectionLabel>Section B — KPI 9: Recruitment Efficiency Index</SectionLabel>
      <div className="rounded-lg border border-[hsl(var(--pk-border))] bg-[hsl(var(--pk-surface))] shadow-card p-4">
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
        {recruitmentIndex && totalWeighted !== null ? (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[560px]">
                <thead>
                  <tr className="text-[11px] uppercase tracking-wide text-[hsl(var(--pk-ink-faint))]">
                    <th className="text-left font-medium py-1.5">Metric</th>
                    <th className="text-right font-medium py-1.5">Weight</th>
                    <th className="text-left font-medium py-1.5">Score</th>
                    <th className="text-left font-medium py-1.5">Computation</th>
                    <th className="text-right font-medium py-1.5">Weight Score</th>
                  </tr>
                </thead>
                <tbody>
                  {recruitmentIndex.map((m) => (
                    <tr key={m.metric} className="border-t border-[hsl(var(--pk-border))]">
                      <td className="py-2 text-[hsl(var(--pk-ink))]">{m.metric}</td>
                      <td className="text-right py-2 tnum">{(m.weight * 100).toFixed(0)}%</td>
                      <td className="py-2 tnum">{m.score}</td>
                      <td className="py-2 tnum text-[hsl(var(--pk-ink-faint))]">{m.score} × {(m.weight * 100).toFixed(0)}%</td>
                      <td className="text-right py-2 tnum font-semibold">{(m.weighted * 100).toFixed(1)}%</td>
                    </tr>
                  ))}
                  <tr className="border-t-2 border-[hsl(var(--pk-border))] bg-[hsl(var(--pk-surface-2))] font-semibold">
                    <td className="py-2 px-0 text-[hsl(var(--pk-ink))]" colSpan={4}>Total achievement</td>
                    <td className="text-right py-2 tnum text-[hsl(var(--pk-accent))]">{(totalWeighted * 100).toFixed(1)}%</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div className="mt-2 flex flex-col gap-0.5">
              {recruitmentIndex.map((m) => (
                <div key={m.metric} className="text-[11px] text-[hsl(var(--pk-ink-faint))]">
                  <span className="font-medium text-[hsl(var(--pk-ink-soft))]">{m.metric}:</span> {m.note}
                </div>
              ))}
            </div>
          </>
        ) : (
          <p className="text-[11.5px] text-[hsl(var(--pk-ink-faint))]">Component breakdown not tracked for this reporting period in the prototype.</p>
        )}
      </div>
    </div>
  );
}
