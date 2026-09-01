import { useState } from "react";
import { LayoutList, GanttChartSquare } from "lucide-react";
import { ScreenHeader } from "@/components/pk/ScreenHeader";
import { StatusChip } from "@/components/pk/StatusChip";
import { KpiMetricStrip } from "@/components/pk/KpiMetricStrip";
import { InitiativeStatusDot, StatusLegend } from "@/components/pk/Misc";
import { GanttChart } from "@/components/pk/GanttChart";
import type { ScreenId } from "@/lib/nav";
import { useSession } from "@/lib/session";
import { useWorkflow } from "@/lib/workflow";
import { useDetails, type Initiative } from "@/lib/details";
import { useKpiTargets } from "@/lib/kpiTargets";
import { periodById } from "@/data/periods";
import { cn } from "@/lib/utils";

function InitiativeTable({ title, weight, rows }: { title: string; weight: string; rows: Initiative[] }) {
  return (
    <div className="rounded-lg border border-[hsl(var(--pk-border))] bg-[hsl(var(--pk-surface))] shadow-card p-4">
      <div className="text-[11px] uppercase tracking-wide text-[hsl(var(--pk-ink-faint))] mb-1">{weight}</div>
      <div className="font-head font-semibold text-[hsl(var(--pk-ink))] mb-3">{title}</div>
      <div className="divide-y divide-[hsl(var(--pk-border))]">
        {rows.map((r) => (
          <div key={r.name} className="py-2.5">
            <div className="flex items-center justify-between gap-2">
              <span className="text-sm font-medium text-[hsl(var(--pk-ink))]">{r.name}</span>
              <InitiativeStatusDot status={r.status} />
            </div>
            <div className="flex items-center justify-between mt-0.5">
              <span className="text-[11px] text-[hsl(var(--pk-ink-faint))]">{r.start} → {r.end}</span>
              <span className="text-[11px] text-[hsl(var(--pk-accent))]">{r.nextAction}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function CP006({ onNavigate }: { onNavigate: (id: ScreenId) => void }) {
  const { entityId, periodId } = useSession();
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
  const [view, setView] = useState<"cards" | "timeline">("cards");

  return (
    <div>
      <ScreenHeader id="CP006" subtitle="Internal Business Process performance with strategic initiative tracking. Weight 20.0% · 2 KPIs." onNavigate={onNavigate} />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div className="rounded-lg border border-[hsl(var(--pk-border))] bg-[hsl(var(--pk-surface))] shadow-card p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="text-[11px] uppercase tracking-wide text-[hsl(var(--pk-ink-faint))]">KPI 7 · Weight 10.0%</div>
            <StatusChip status={kpi7.status} />
          </div>
          <div className="font-head font-semibold text-[hsl(var(--pk-ink))] mb-3">Process Improvements</div>
          <KpiMetricStrip
            weight="10.0%"
            fy={fy}
            periodLabel={periodLabel}
            fyTarget={String(kpi7FyTarget)}
            ytdTarget={kpi7.ytdTarget !== null ? String(kpi7.ytdTarget) : "—"}
            ytdActual={kpi7.ytdActual !== null ? String(kpi7.ytdActual) : "—"}
            achievement={kpi7.weighted !== null ? `${(kpi7.weighted * 100).toFixed(1)}%` : "—"}
            status={kpi7.status}
          />
        </div>
        <div className="rounded-lg border border-[hsl(var(--pk-border))] bg-[hsl(var(--pk-surface))] shadow-card p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="text-[11px] uppercase tracking-wide text-[hsl(var(--pk-ink-faint))]">KPI 8 · Weight 10.0%</div>
            <StatusChip status={kpi8.status} />
          </div>
          <div className="font-head font-semibold text-[hsl(var(--pk-ink))] mb-3">New Technology Implementation</div>
          <KpiMetricStrip
            weight="10.0%"
            fy={fy}
            periodLabel={periodLabel}
            fyTarget={String(kpi8FyTarget)}
            ytdTarget={kpi8.ytdTarget !== null ? String(kpi8.ytdTarget) : "—"}
            ytdActual={kpi8.ytdActual !== null ? String(kpi8.ytdActual) : "—"}
            achievement={kpi8.weighted !== null ? `${(kpi8.weighted * 100).toFixed(1)}%` : "—"}
            status={kpi8.status}
          />
        </div>
      </div>

      <div className="flex items-center justify-end mb-4">
        <div className="flex items-center gap-1 border border-[hsl(var(--pk-border))] rounded-lg p-1 bg-[hsl(var(--pk-surface))]">
          <button
            onClick={() => setView("cards")}
            className={cn("flex items-center gap-1.5 rounded-md px-2.5 py-1 text-[12px] font-medium transition-colors", view === "cards" ? "bg-[hsl(var(--pk-accent))] text-[hsl(var(--pk-accent-ink))]" : "text-[hsl(var(--pk-ink-faint))] hover:text-[hsl(var(--pk-ink))]")}
          >
            <LayoutList className="h-3.5 w-3.5" />Cards
          </button>
          <button
            onClick={() => setView("timeline")}
            className={cn("flex items-center gap-1.5 rounded-md px-2.5 py-1 text-[12px] font-medium transition-colors", view === "timeline" ? "bg-[hsl(var(--pk-accent))] text-[hsl(var(--pk-accent-ink))]" : "text-[hsl(var(--pk-ink-faint))] hover:text-[hsl(var(--pk-ink))]")}
          >
            <GanttChartSquare className="h-3.5 w-3.5" />Timeline
          </button>
        </div>
      </div>

      <div className="mb-4"><StatusLegend /></div>

      {view === "cards" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <InitiativeTable title="Process Improvement Initiatives" weight="Target: 3 initiatives · Q3 onward" rows={processInitiatives} />
          <InitiativeTable title="Technology & Digital Transformation" weight="Target: 6 initiatives · Q2 onward" rows={techInitiatives} />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="rounded-lg border border-[hsl(var(--pk-border))] bg-[hsl(var(--pk-surface))] shadow-card p-4">
            <div className="text-[11px] uppercase tracking-wide text-[hsl(var(--pk-ink-faint))] mb-3">Process Improvement Initiatives</div>
            <GanttChart rows={processInitiatives} />
          </div>
          <div className="rounded-lg border border-[hsl(var(--pk-border))] bg-[hsl(var(--pk-surface))] shadow-card p-4">
            <div className="text-[11px] uppercase tracking-wide text-[hsl(var(--pk-ink-faint))] mb-3">Technology &amp; Digital Transformation</div>
            <GanttChart rows={techInitiatives} />
          </div>
        </div>
      )}
    </div>
  );
}
