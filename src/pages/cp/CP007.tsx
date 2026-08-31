import { ScreenHeader } from "@/components/pk/ScreenHeader";
import { RecruitmentIndexScorecard } from "@/components/pk/RecruitmentIndexScorecard";
import type { ScreenId } from "@/lib/nav";
import { useSession } from "@/lib/session";
import { useWorkflow } from "@/lib/workflow";
import { useDetails } from "@/lib/details";
import { useKpiTargets } from "@/lib/kpiTargets";
import { kpiById } from "@/data/kpis";
import { periodById } from "@/data/periods";

export function CP007({ onNavigate }: { onNavigate: (id: ScreenId) => void }) {
  const { entityId, periodId } = useSession();
  const { latestValue } = useWorkflow();
  const { recruitmentIndexByPeriod } = useDetails();
  const { getFyTarget } = useKpiTargets();
  const kpi9 = latestValue("KPI9", entityId, periodId);
  const recruitmentIndex = recruitmentIndexByPeriod[periodId];
  const period = periodById(periodId);

  return (
    <div>
      <ScreenHeader id="CP007" subtitle="Organisational Capacity performance: Recruitment Efficiency Index. Weight 10.0%." onNavigate={onNavigate} />
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
