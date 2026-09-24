import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { ScreenHeader } from "@/components/pk/ScreenHeader";
import { StatusChip } from "@/components/pk/StatusChip";
import { KpiMetricStrip } from "@/components/pk/KpiMetricStrip";
import { RecruitmentIndexCardHeader, RecruitmentIndexTable } from "@/components/pk/RecruitmentIndexScorecard";
import { DownloadableFrame } from "@/components/pk/DownloadableFrame";
import { ArrowRight } from "lucide-react";
import { FinancialYearQuarterPicker, useLocalPeriodId } from "@/components/pk/PeriodPicker";
import { cn } from "@/lib/utils";
import type { ScreenId } from "@/lib/nav";
import { useSession } from "@/lib/session";
import { useWorkflow } from "@/lib/workflow";
import { useDetails } from "@/lib/details";
import { useKpiTargets } from "@/lib/kpiTargets";
import { kpiById } from "@/data/kpis";
import { periodById } from "@/data/periods";

type Expanded = "kpi9" | "kpi10" | null;

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
  const [expanded, setExpanded] = useState<Expanded>(null);
  const toggle = (key: Exclude<Expanded, null>) => setExpanded((e) => (e === key ? null : key));
  const onToggleKeyDown = (key: Exclude<Expanded, null>) => (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") { e.preventDefault(); toggle(key); }
  };

  return (
    <div>
      <ScreenHeader id="CP007" subtitle="Organisational Capacity Performance: Recruitment Efficiency Index and People Development Programme. Weight 20.0% combined." onNavigate={onNavigate} periodId={periodId} right={<FinancialYearQuarterPicker periodId={periodId} onChange={setPeriodId} />} />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div
          role="button"
          tabIndex={0}
          onClick={() => toggle("kpi9")}
          onKeyDown={onToggleKeyDown("kpi9")}
          className={cn(
            "text-left rounded-lg border bg-[hsl(var(--pk-surface))] shadow-card p-4 cursor-pointer transition-colors",
            expanded === "kpi9" ? "border-[hsl(var(--pk-accent))]" : "border-[hsl(var(--pk-border))] hover:bg-[hsl(var(--pk-surface-2))]"
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
            <span className="flex items-center gap-1 text-2xs text-[hsl(var(--pk-accent))] shrink-0">
              {expanded === "kpi9" ? "Hide details" : "View details"}
              <ChevronDown className={cn("h-3 w-3 transition-transform", expanded === "kpi9" && "rotate-180")} />
            </span>
          </div>
        </div>

        <div
          role="button"
          tabIndex={0}
          onClick={() => toggle("kpi10")}
          onKeyDown={onToggleKeyDown("kpi10")}
          className={cn(
            "text-left rounded-lg border bg-[hsl(var(--pk-surface))] shadow-card p-4 cursor-pointer transition-colors",
            expanded === "kpi10" ? "border-[hsl(var(--pk-accent))]" : "border-[hsl(var(--pk-border))] hover:bg-[hsl(var(--pk-surface-2))]"
          )}
        >
          <div className="flex items-center justify-between mb-2">
            <div className="text-2xs font-bold uppercase tracking-wide text-[hsl(var(--pk-ink-faint))]">KPI 10 · Weight {`${(kpiById("KPI10").weight * 100).toFixed(1)}%`}</div>
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
            <span className="flex items-center gap-1 text-2xs text-[hsl(var(--pk-accent))] shrink-0">
              {expanded === "kpi10" ? "Hide details" : "View details"}
              <ChevronDown className={cn("h-3 w-3 transition-transform", expanded === "kpi10" && "rotate-180")} />
            </span>
          </div>
        </div>
      </div>

      {expanded === "kpi9" && (
        recruitmentIndex ? (
          <DownloadableFrame filename="cp007-recruitment-index-detail" className="rounded-lg border border-[hsl(var(--pk-border))] bg-[hsl(var(--pk-surface))] shadow-card p-4 mb-4">
            <RecruitmentIndexTable recruitmentIndex={recruitmentIndex} />
          </DownloadableFrame>
        ) : (
          <div className="rounded-lg border border-[hsl(var(--pk-border))] bg-[hsl(var(--pk-surface))] shadow-card p-4 mb-4">
            <RecruitmentIndexTable recruitmentIndex={recruitmentIndex} />
          </div>
        )
      )}

      {expanded === "kpi10" && (
        // The full editable table lives on CP009 (its own dedicated screen, open by default) —
        // showing it again here too meant Next/Next through the bottom pager landed a tester on
        // the exact same content they'd just seen expanded, which 3 separate UAT reviewers read
        // as a navigation bug ("duplication of KPI10"). This card now only previews the summary
        // (already shown above) and points at CP009 for the real thing, so there's one place to
        // add/edit/remove a programme, not two.
        <div className="mb-4 rounded-lg border border-dashed border-[hsl(var(--pk-border))] bg-[hsl(var(--pk-surface))] p-4 flex items-center justify-between gap-3 flex-wrap">
          <p className="text-xs text-[hsl(var(--pk-ink-faint))] max-w-[46ch]">
            The full People Development Programme detail — grouped by sub-area, with add/edit/remove — lives on its own screen.
          </p>
          <button
            onClick={() => onNavigate("CP009")}
            className="inline-flex items-center gap-1.5 rounded-md bg-[hsl(var(--pk-accent))] text-[hsl(var(--pk-accent-ink))] text-xs font-medium px-3 py-1.5 hover:opacity-90 transition-opacity shrink-0"
          >
            View full detail on CP009<ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}
