import { useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { ScreenHeader } from "@/components/pk/ScreenHeader";
import { StatusChip } from "@/components/pk/StatusChip";
import { RecruitmentIndexCardHeader, RecruitmentIndexTable } from "@/components/pk/RecruitmentIndexScorecard";
import { FinancialYearQuarterPicker, useLocalPeriodId } from "@/components/pk/PeriodPicker";
import { cn } from "@/lib/utils";
import type { ScreenId } from "@/lib/nav";
import { useSession } from "@/lib/session";
import { useWorkflow } from "@/lib/workflow";
import { useDetails } from "@/lib/details";
import { useKpiTargets } from "@/lib/kpiTargets";
import { kpiById } from "@/data/kpis";
import { periodById } from "@/data/periods";

export function CP007({ onNavigate }: { onNavigate: (id: ScreenId) => void }) {
  const { entityId } = useSession();
  const [periodId, setPeriodId] = useLocalPeriodId();
  const { latestValue } = useWorkflow();
  const { recruitmentIndexByPeriod } = useDetails();
  const { getFyTarget } = useKpiTargets();
  const kpi9 = latestValue("KPI9", entityId, periodId);
  const kpi10 = latestValue("KPI10", entityId, periodId);
  const recruitmentIndex = recruitmentIndexByPeriod[periodId];
  const period = periodById(periodId);
  const kpi10FyTarget = getFyTarget("KPI10", period.fy);
  const [expanded, setExpanded] = useState(false);
  const toggle = () => setExpanded((e) => !e);
  const onToggleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") { e.preventDefault(); toggle(); }
  };

  return (
    <div>
      <ScreenHeader id="CP007" subtitle="Organisational Capacity performance: Recruitment Efficiency Index and People Development Programme. Weight 20.0% combined." onNavigate={onNavigate} periodId={periodId} right={<FinancialYearQuarterPicker periodId={periodId} onChange={setPeriodId} />} />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div
          role="button"
          tabIndex={0}
          onClick={toggle}
          onKeyDown={onToggleKeyDown}
          className={cn(
            "text-left rounded-lg border bg-[hsl(var(--pk-surface))] shadow-card p-4 cursor-pointer transition-colors",
            expanded ? "border-[hsl(var(--pk-accent))]" : "border-[hsl(var(--pk-border))] hover:bg-[hsl(var(--pk-surface-2))]"
          )}
        >
          <RecruitmentIndexCardHeader
            kpi9={kpi9}
            weightPct={`${(kpiById("KPI9").weight * 100).toFixed(1)}%`}
            fy={period.fy}
            periodLabel={period.label.replace(" FY", " ")}
            fyTarget={getFyTarget("KPI9", period.fy)}
            headline
          />
          <div className="flex items-center justify-end">
            <span className="flex items-center gap-1 text-[11px] text-[hsl(var(--pk-accent))] shrink-0">
              {expanded ? "Hide details" : "View details"}
              <ChevronDown className={cn("h-3 w-3 transition-transform", expanded && "rotate-180")} />
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={() => onNavigate("CP009")}
          className="text-left rounded-lg border border-[hsl(var(--pk-border))] bg-[hsl(var(--pk-surface))] shadow-card p-4 hover:bg-[hsl(var(--pk-surface-2))] transition-colors"
        >
          <div className="flex items-center justify-between mb-2">
            <div className="text-[11px] uppercase tracking-wide text-[hsl(var(--pk-ink-faint))]">KPI 10 · Weight {`${(kpiById("KPI10").weight * 100).toFixed(1)}%`}</div>
            <StatusChip status={kpi10.status} />
          </div>
          <div className="font-head font-bold text-[hsl(var(--pk-ink))] mb-2">People Development Programme</div>
          <div className="flex items-baseline gap-2 mb-2">
            <span className="tnum font-head text-2xl font-semibold">{kpi10.ytdActual !== null ? `${kpi10.ytdActual.toFixed(1)}%` : "—"}</span>
            <span className="text-sm text-[hsl(var(--pk-ink-faint))]">/ target {kpi10FyTarget.toFixed(1)}%</span>
          </div>
          <p className="text-[11.5px] text-[hsl(var(--pk-ink-faint))] mb-3">
            {kpi10.ytdActual !== null ? `${period.label} completion ${kpi10.ytdActual.toFixed(1)}% against the annual target.` : "Progress reporting only — see CP009 for the full programme breakdown."}
          </p>
          <div className="flex items-center justify-end">
            <span className="flex items-center gap-1 text-[11px] text-[hsl(var(--pk-accent))] shrink-0">
              Open People Development Programme
              <ChevronRight className="h-3 w-3" />
            </span>
          </div>
        </button>
      </div>

      {expanded && (
        <div className="rounded-lg border border-[hsl(var(--pk-border))] bg-[hsl(var(--pk-surface))] shadow-card p-4 mb-4">
          <RecruitmentIndexTable recruitmentIndex={recruitmentIndex} />
        </div>
      )}
    </div>
  );
}
