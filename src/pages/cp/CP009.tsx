import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { ScreenHeader } from "@/components/pk/ScreenHeader";
import { InfoNote } from "@/components/pk/Misc";
import { StatusChip } from "@/components/pk/StatusChip";
import { KpiMetricStrip } from "@/components/pk/KpiMetricStrip";
import { PeopleDevPlanTable } from "@/components/pk/PeopleDevPlanTable";
import { FinancialYearQuarterPicker, useLocalPeriodId } from "@/components/pk/PeriodPicker";
import { cn } from "@/lib/utils";
import { useSession } from "@/lib/session";
import { useWorkflow } from "@/lib/workflow";
import { useKpiTargets } from "@/lib/kpiTargets";
import { kpiById } from "@/data/kpis";
import { periodById } from "@/data/periods";
import type { ScreenId } from "@/lib/nav";

export function CP009({ onNavigate }: { onNavigate: (id: ScreenId) => void }) {
  const { entityId } = useSession();
  const [periodId, setPeriodId] = useLocalPeriodId();
  const { latestValue } = useWorkflow();
  const { getFyTarget } = useKpiTargets();
  const kpi10 = latestValue("KPI10", entityId, periodId);
  const period = periodById(periodId);
  const kpi10FyTarget = getFyTarget("KPI10", period.fy);
  // Open by default — this screen exists specifically to show KPI10's detail, so a visitor
  // shouldn't have to click through an extra collapsed card to see it. Still collapsible to
  // match CP004/CP006/CP007's card pattern.
  const [expanded, setExpanded] = useState(true);
  const toggle = () => setExpanded((e) => !e);
  const onToggleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") { e.preventDefault(); toggle(); }
  };

  return (
    <div>
      <ScreenHeader id="CP009" subtitle="Organisational Capacity performance: People Development Programme. Weight 10.0%." onNavigate={onNavigate} periodId={periodId} right={<FinancialYearQuarterPicker periodId={periodId} onChange={setPeriodId} />} />

      <div
        role="button"
        tabIndex={0}
        onClick={toggle}
        onKeyDown={onToggleKeyDown}
        className={cn(
          "text-left rounded-lg border bg-[hsl(var(--pk-surface))] shadow-card p-4 mb-4 cursor-pointer transition-colors",
          expanded ? "border-[hsl(var(--pk-accent))]" : "border-[hsl(var(--pk-border))] hover:bg-[hsl(var(--pk-surface-2))]"
        )}
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
        <KpiMetricStrip
          fy={period.fy}
          periodLabel={period.label.replace(" FY", " ")}
          fyTarget={`${kpi10FyTarget.toFixed(1)}%`}
          ytdTarget={kpi10.ytdTarget !== null ? `${kpi10.ytdTarget.toFixed(1)}%` : "—"}
          ytdActual={kpi10.ytdActual !== null ? `${kpi10.ytdActual.toFixed(1)}%` : "—"}
          achievement={kpi10.weighted !== null ? `${(kpi10.weighted * 100).toFixed(1)}%` : "—"}
          status={kpi10.status}
        />
        <div className="flex items-center justify-end">
          <span className="flex items-center gap-1 text-[11px] text-[hsl(var(--pk-accent))] shrink-0">
            {expanded ? "Hide details" : "View details"}
            <ChevronDown className={cn("h-3 w-3 transition-transform", expanded && "rotate-180")} />
          </span>
        </div>
      </div>

      {expanded && (
        <>
          <InfoNote>
            Talent Management, Succession Management, Performance Management and Talent/Culture Engagement, by reporting period. Add, edit or remove entries below for the currently selected reporting period (Reporting Officer or System Administrator only).
          </InfoNote>
          <div className="mt-4">
            <PeopleDevPlanTable periodId={periodId} kpi10YtdActual={kpi10.ytdActual} />
          </div>
        </>
      )}
    </div>
  );
}
