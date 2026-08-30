import { ScreenHeader } from "@/components/pk/ScreenHeader";
import { StatusChip } from "@/components/pk/StatusChip";
import { StackedBarTrend } from "@/components/pk/Charts";
import { DurationFilterBar, useDurationFilter } from "@/components/pk/DurationFilter";
import { PeriodPickerCompact } from "@/components/pk/PeriodPicker";
import { cn } from "@/lib/utils";
import type { ScreenId } from "@/lib/nav";
import { useSession } from "@/lib/session";
import { useWorkflow } from "@/lib/workflow";
import { useDetails } from "@/lib/details";
import { useKpiTargets } from "@/lib/kpiTargets";
import { periods, periodById } from "@/data/periods";

export function CP005({ onNavigate }: { onNavigate: (id: ScreenId) => void }) {
  const { entityId, periodId, setPeriodId } = useSession();
  const { latestValue } = useWorkflow();
  const { timeCharterCompliance } = useDetails();
  const { getFyTarget } = useKpiTargets();
  const kpi5 = latestValue("KPI5", entityId, periodId);
  const kpi6 = latestValue("KPI6", entityId, periodId);
  const kpi5Target = kpi5.ytdTarget ?? getFyTarget("KPI5", periodById(periodId).fy);

  const fullSatisfactionTrend = periods
    .map((p) => ({ p, r: latestValue("KPI5", entityId, p.id) }))
    .filter((x) => x.r.ytdActual !== null)
    .map(({ p, r }) => ({
      label: p.label.replace("FY20", "FY"),
      segments: [
        { label: "Actual", value: r.ytdActual as number, color: r.status === "met" ? "hsl(var(--pk-good))" : "hsl(var(--pk-warn))" },
        { label: "Gap to target", value: Math.max((r.ytdTarget ?? 0) - (r.ytdActual as number), 0), color: "hsl(var(--pk-surface-2))" },
      ],
    }));
  const { duration, setDuration, filtered: satisfactionTrend } = useDurationFilter(fullSatisfactionTrend);

  return (
    <div>
      <ScreenHeader id="CP005" subtitle="Customer Perspective performance for Management and Board reporting. Weight 15.0% · 2 KPIs." onNavigate={onNavigate} />

      <div className="mb-4 flex items-center gap-2">
        <span className="text-[11px] text-[hsl(var(--pk-ink-faint))]">Reporting period</span>
        <PeriodPickerCompact periodId={periodId} onChange={setPeriodId} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="rounded-lg border border-[hsl(var(--pk-border))] bg-[hsl(var(--pk-surface))] shadow-card p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="text-[11px] uppercase tracking-wide text-[hsl(var(--pk-ink-faint))]">KPI 5 · Weight 7.5% · bi-annual</div>
            <StatusChip status={kpi5.status} />
          </div>
          <div className="font-head font-semibold text-[hsl(var(--pk-ink))] mb-2">External Client Satisfaction</div>
          <div className={cn("tnum font-head text-2xl font-semibold", kpi5.ytdActual !== null ? "text-[hsl(var(--pk-ink))]" : "text-[hsl(var(--pk-ink-faint))]")}>
            {kpi5.ytdActual !== null ? kpi5.ytdActual.toFixed(1) : "—"}
            <span className="text-sm font-sans font-normal text-[hsl(var(--pk-ink-faint))]"> / target {kpi5Target.toFixed(1)}</span>
          </div>
          {kpi5.ytdActual === null && (
            <p className="text-xs text-[hsl(var(--pk-ink-faint))] mt-2">{kpi5.note ?? "Not yet reported for this period."}</p>
          )}
          <div className="mt-3">
            <div className="flex items-center justify-between flex-wrap gap-1.5 mb-1.5">
              <div className="text-[11px] text-[hsl(var(--pk-ink-faint))]">Historical trend — bi-annual survey rounds only</div>
              <DurationFilterBar duration={duration} onChange={setDuration} total={fullSatisfactionTrend.length} label="" />
            </div>
            <StackedBarTrend data={satisfactionTrend} />
          </div>
        </div>

        <div className="rounded-lg border border-[hsl(var(--pk-border))] bg-[hsl(var(--pk-surface))] shadow-card p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="text-[11px] uppercase tracking-wide text-[hsl(var(--pk-ink-faint))]">KPI 6 · Weight 7.5% · quarterly</div>
            <StatusChip status={kpi6.status} />
          </div>
          <div className="font-head font-semibold text-[hsl(var(--pk-ink))] mb-3">Time Charter Compliance</div>
          <div className="divide-y divide-[hsl(var(--pk-border))]">
            {timeCharterCompliance.map((t) => (
              <div key={t.service} className="flex items-center justify-between py-1.5 text-sm">
                <span className="text-[hsl(var(--pk-ink-soft))]">{t.service}</span>
                <span className="text-[11.5px] text-[hsl(var(--pk-ink-faint))]">{t.targetSla}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
