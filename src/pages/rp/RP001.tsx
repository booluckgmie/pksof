import { ChevronRight } from "lucide-react";
import { ScreenHeader } from "@/components/pk/ScreenHeader";
import { StatCard } from "@/components/pk/Misc";
import { CategoryBar, BarTrend } from "@/components/pk/Charts";
import { DurationFilterBar, useDurationFilter } from "@/components/pk/DurationFilter";
import { RecruitmentIndexScorecard } from "@/components/pk/RecruitmentIndexScorecard";
import type { ScreenId } from "@/lib/nav";
import { useSession } from "@/lib/session";
import { useWorkflow } from "@/lib/workflow";
import { useDetails } from "@/lib/details";
import { useKpiTargets } from "@/lib/kpiTargets";
import { kpiById } from "@/data/kpis";
import { periodById } from "@/data/periods";

function SectionLabel({ children }: { children: React.ReactNode }) {
  return <div className="text-[11px] uppercase tracking-wide text-[hsl(var(--pk-ink-faint))] font-semibold mb-2">{children}</div>;
}

export function RP001({ onNavigate }: { onNavigate: (id: ScreenId) => void }) {
  const { entityId, periodId } = useSession();
  const { latestValue } = useWorkflow();
  const { headcountSummaryByPeriod, headcountTrend: fullHeadcountTrend, recruitmentIndexByPeriod } = useDetails();
  const { getFyTarget } = useKpiTargets();
  const { duration, setDuration, filtered: headcountTrend } = useDurationFilter(fullHeadcountTrend);
  const kpi9 = latestValue("KPI9", entityId, periodId);
  const recruitmentIndex = recruitmentIndexByPeriod[periodId];
  const headcountSummary = headcountSummaryByPeriod[periodId];
  const period = periodById(periodId);

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
            <div className="text-xs font-bold underline text-[hsl(var(--pk-ink-soft))]">Headcount Trend — minimum 4 quarters</div>
            <DurationFilterBar duration={duration} onChange={setDuration} total={fullHeadcountTrend.length} label="" />
          </div>
          <div className="text-[11px] text-[hsl(var(--pk-ink-faint))] mb-2">Actual headcount (HRMS) vs approved establishment</div>
          <BarTrend data={headcountTrend.map((h) => ({ label: h.period.replace(" FY", " '"), value: h.actual }))} />
        </div>
        <button onClick={() => onNavigate("RP001A")} className="group rounded-lg border border-[hsl(var(--pk-border))] bg-[hsl(var(--pk-surface))] shadow-card p-4 text-left hover:border-[hsl(var(--pk-accent))] transition-colors">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold underline text-[hsl(var(--pk-ink-soft))]">Workforce composition — click for full breakdown</span>
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
      <RecruitmentIndexScorecard
        kpi9={kpi9}
        recruitmentIndex={recruitmentIndex}
        weightPct={`${(kpiById("KPI9").weight * 100).toFixed(1)}%`}
        fy={period.fy}
        periodLabel={period.label.replace(" FY", " ")}
        fyTarget={getFyTarget("KPI9", period.fy)}
      />
    </div>
  );
}
