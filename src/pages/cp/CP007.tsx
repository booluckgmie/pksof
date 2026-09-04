import { BookUser, ChevronRight } from "lucide-react";
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

      <button
        type="button"
        onClick={() => onNavigate("CP009")}
        className="mt-4 w-full flex items-center justify-between gap-3 rounded-lg border border-[hsl(var(--pk-border))] bg-[hsl(var(--pk-surface))] shadow-card px-4 py-3 text-left hover:bg-[hsl(var(--pk-surface-2))] transition-colors"
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <BookUser className="h-4 w-4 text-[hsl(var(--pk-accent))] shrink-0" />
          <div className="min-w-0">
            <div className="text-sm font-medium text-[hsl(var(--pk-ink))]">People Development Programme</div>
            <div className="text-[11.5px] text-[hsl(var(--pk-ink-faint))]">KPI 10 · the other half of Organisational Capacity — CP009</div>
          </div>
        </div>
        <ChevronRight className="h-4 w-4 text-[hsl(var(--pk-ink-faint))] shrink-0" />
      </button>
    </div>
  );
}
