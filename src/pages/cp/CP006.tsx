import { useState } from "react";
import { ChevronDown, LayoutList, GanttChartSquare } from "lucide-react";
import { ScreenHeader } from "@/components/pk/ScreenHeader";
import { StatusChip } from "@/components/pk/StatusChip";
import { KpiMetricStrip } from "@/components/pk/KpiMetricStrip";
import { InitiativeStatusDot, StatusLegend } from "@/components/pk/Misc";
import { GanttChart } from "@/components/pk/GanttChart";
import { FinancialYearQuarterPicker, useLocalPeriodId } from "@/components/pk/PeriodPicker";
import type { ScreenId } from "@/lib/nav";
import { useSession } from "@/lib/session";
import { useWorkflow } from "@/lib/workflow";
import { useDetails, type Initiative } from "@/lib/details";
import { useKpiTargets } from "@/lib/kpiTargets";
import { periodById } from "@/data/periods";
import { cn } from "@/lib/utils";

function InitiativeTable({ rows }: { rows: Initiative[] }) {
  return (
    <div className="divide-y divide-[hsl(var(--pk-border))]">
      {rows.map((r) => (
        <div key={r.name} className="py-2.5">
          <div className="flex items-center justify-between gap-2">
            <span className="text-sm font-medium text-[hsl(var(--pk-ink))]">{r.name}</span>
            <InitiativeStatusDot status={r.status} />
          </div>
          <div className="flex items-center justify-between mt-0.5">
            <span className="text-2xs text-[hsl(var(--pk-ink-faint))]">{r.start} → {r.end}</span>
            <span className="text-2xs text-[hsl(var(--pk-accent))]">{r.nextAction}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

export function CP006({ onNavigate }: { onNavigate: (id: ScreenId) => void }) {
  const { entityId } = useSession();
  const [periodId, setPeriodId] = useLocalPeriodId();
  const { latestValue } = useWorkflow();
  const { processInitiatives, techInitiatives } = useDetails();
  const { getFyTarget } = useKpiTargets();
  const kpi7 = latestValue("KPI7", entityId, periodId);
  const kpi8 = latestValue("KPI8", entityId, periodId);
  const period = periodById(periodId);
  const fy = period.fy;
  const periodLabel = period.label.replace(" FY", " ");
  const kpi7FyTarget = getFyTarget("KPI7", fy);
  const kpi8FyTarget = getFyTarget("KPI8", fy);
  const [expanded, setExpanded] = useState<"process" | "tech" | null>(null);
  const toggle = (key: "process" | "tech") => setExpanded((e) => (e === key ? null : key));
  const onToggleKeyDown = (key: "process" | "tech") => (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") { e.preventDefault(); toggle(key); }
  };
  const [view, setView] = useState<"cards" | "timeline">("cards");

  return (
    <div>
      <ScreenHeader id="CP006" subtitle="Internal Business Process performance with strategic initiative tracking. Weight 20.0% · 2 KPIs." onNavigate={onNavigate} periodId={periodId} right={<FinancialYearQuarterPicker periodId={periodId} onChange={setPeriodId} />} />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div
          role="button"
          tabIndex={0}
          onClick={() => toggle("process")}
          onKeyDown={onToggleKeyDown("process")}
          className={cn(
            "text-left rounded-lg border bg-[hsl(var(--pk-surface))] shadow-card p-4 cursor-pointer transition-colors",
            expanded === "process" ? "border-[hsl(var(--pk-accent))]" : "border-[hsl(var(--pk-border))] hover:bg-[hsl(var(--pk-surface-2))]"
          )}
        >
          <div className="flex items-center justify-between mb-2">
            <div className="text-2xs font-bold uppercase tracking-wide text-[hsl(var(--pk-ink-faint))]">KPI 7 · Weight 10.0%</div>
            <StatusChip status={kpi7.status} />
          </div>
          <div className="font-head font-bold text-[hsl(var(--pk-ink))] mb-2">Process Improvements</div>
          <div className="flex items-baseline gap-2 mb-2">
            <span className="tnum font-head text-2xl font-semibold">{kpi7.ytdActual !== null ? kpi7.ytdActual : "—"}</span>
            <span className="text-sm text-[hsl(var(--pk-ink-faint))]">/ target {kpi7.ytdTarget ?? "—"} initiatives</span>
          </div>
          <KpiMetricStrip
            fy={fy}
            periodLabel={periodLabel}
            fyTarget={String(kpi7FyTarget)}
            ytdTarget={kpi7.ytdTarget !== null ? String(kpi7.ytdTarget) : "—"}
            ytdActual={kpi7.ytdActual !== null ? String(kpi7.ytdActual) : "—"}
            achievement={kpi7.weighted !== null ? `${(kpi7.weighted * 100).toFixed(1)}%` : "—"}
            status={kpi7.status}
          />
          <div className="flex items-center justify-end">
            <span className="flex items-center gap-1 text-2xs text-[hsl(var(--pk-accent))] shrink-0">
              {expanded === "process" ? "Hide initiatives" : "View initiatives"}
              <ChevronDown className={cn("h-3 w-3 transition-transform", expanded === "process" && "rotate-180")} />
            </span>
          </div>
        </div>

        <div
          role="button"
          tabIndex={0}
          onClick={() => toggle("tech")}
          onKeyDown={onToggleKeyDown("tech")}
          className={cn(
            "text-left rounded-lg border bg-[hsl(var(--pk-surface))] shadow-card p-4 cursor-pointer transition-colors",
            expanded === "tech" ? "border-[hsl(var(--pk-accent))]" : "border-[hsl(var(--pk-border))] hover:bg-[hsl(var(--pk-surface-2))]"
          )}
        >
          <div className="flex items-center justify-between mb-2">
            <div className="text-2xs font-bold uppercase tracking-wide text-[hsl(var(--pk-ink-faint))]">KPI 8 · Weight 10.0%</div>
            <StatusChip status={kpi8.status} />
          </div>
          <div className="font-head font-bold text-[hsl(var(--pk-ink))] mb-2">New Technology Implementation</div>
          <div className="flex items-baseline gap-2 mb-2">
            <span className="tnum font-head text-2xl font-semibold">{kpi8.ytdActual !== null ? kpi8.ytdActual : "—"}</span>
            <span className="text-sm text-[hsl(var(--pk-ink-faint))]">/ target {kpi8.ytdTarget ?? "—"} initiatives</span>
          </div>
          <KpiMetricStrip
            fy={fy}
            periodLabel={periodLabel}
            fyTarget={String(kpi8FyTarget)}
            ytdTarget={kpi8.ytdTarget !== null ? String(kpi8.ytdTarget) : "—"}
            ytdActual={kpi8.ytdActual !== null ? String(kpi8.ytdActual) : "—"}
            achievement={kpi8.weighted !== null ? `${(kpi8.weighted * 100).toFixed(1)}%` : "—"}
            status={kpi8.status}
          />
          <div className="flex items-center justify-end">
            <span className="flex items-center gap-1 text-2xs text-[hsl(var(--pk-accent))] shrink-0">
              {expanded === "tech" ? "Hide initiatives" : "View initiatives"}
              <ChevronDown className={cn("h-3 w-3 transition-transform", expanded === "tech" && "rotate-180")} />
            </span>
          </div>
        </div>
      </div>

      {expanded && (
        <>
          <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
            <div className="text-2xs uppercase tracking-wide text-[hsl(var(--pk-ink-faint))]">
              {expanded === "process" ? "Process Improvement Initiatives — Target: 3 initiatives · Q3 onward" : "Technology & Digital Transformation — Target: 6 initiatives · Q2 onward"}
            </div>
            <div className="flex items-center gap-1 border border-[hsl(var(--pk-border))] rounded-lg p-1 bg-[hsl(var(--pk-surface))]">
              <button
                onClick={() => setView("cards")}
                className={cn("flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition-colors", view === "cards" ? "bg-[hsl(var(--pk-accent))] text-[hsl(var(--pk-accent-ink))]" : "text-[hsl(var(--pk-ink-faint))] hover:text-[hsl(var(--pk-ink))]")}
              >
                <LayoutList className="h-3.5 w-3.5" />Cards
              </button>
              <button
                onClick={() => setView("timeline")}
                className={cn("flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition-colors", view === "timeline" ? "bg-[hsl(var(--pk-accent))] text-[hsl(var(--pk-accent-ink))]" : "text-[hsl(var(--pk-ink-faint))] hover:text-[hsl(var(--pk-ink))]")}
              >
                <GanttChartSquare className="h-3.5 w-3.5" />Timeline
              </button>
            </div>
          </div>

          <div className="mb-3"><StatusLegend /></div>

          <div className="rounded-lg border border-[hsl(var(--pk-border))] bg-[hsl(var(--pk-surface))] shadow-card p-4 mb-4">
            {view === "cards" ? (
              <InitiativeTable rows={expanded === "process" ? processInitiatives : techInitiatives} />
            ) : (
              <GanttChart rows={expanded === "process" ? processInitiatives : techInitiatives} />
            )}
          </div>
        </>
      )}
    </div>
  );
}
