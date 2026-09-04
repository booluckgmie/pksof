import { ScreenHeader } from "@/components/pk/ScreenHeader";
import { StatusChip } from "@/components/pk/StatusChip";
import { StackedBarTrend, LineTrend } from "@/components/pk/Charts";
import { KpiMetricStrip } from "@/components/pk/KpiMetricStrip";
import { DurationFilterBar, useDurationFilter } from "@/components/pk/DurationFilter";
import { PeriodPickerCompact, ComparePeriodsPicker, PeriodComparisonTable } from "@/components/pk/PeriodPicker";
import { cn } from "@/lib/utils";
import type { ScreenId } from "@/lib/nav";
import { useSession } from "@/lib/session";
import { useWorkflow } from "@/lib/workflow";
import { useDetails } from "@/lib/details";
import { useKpiTargets } from "@/lib/kpiTargets";
import { periods, periodById } from "@/data/periods";
import { useMemo, useState } from "react";
import type { PeriodId } from "@/types";

/** Mean of a department's own quarters that actually have a score — used both for the table's
 * trailing average column and to label it: two quarters reads as a half-year ("1H"), matching how
 * the client's own report names it; any other count falls back to a generic "Average". */
function meanOf(values: (number | null)[]): number | null {
  const known = values.filter((v): v is number => v !== null);
  return known.length > 0 ? known.reduce((s, v) => s + v, 0) / known.length : null;
}

export function CP005({ onNavigate }: { onNavigate: (id: ScreenId) => void }) {
  const { entityId, periodId, setPeriodId } = useSession();
  const [compareIds, setCompareIds] = useState<PeriodId[]>([]);
  const [selectedDept, setSelectedDept] = useState<string | null>(null);
  const { latestValue } = useWorkflow();
  const { timeCharterByDept } = useDetails();
  const { getFyTarget } = useKpiTargets();
  const kpi5 = latestValue("KPI5", entityId, periodId);
  const kpi6 = latestValue("KPI6", entityId, periodId);
  const period = periodById(periodId);
  const fy = period.fy;
  const periodLabel = period.label.replace(" FY", " ");
  const kpi5FyTarget = getFyTarget("KPI5", fy);
  const kpi6FyTarget = getFyTarget("KPI6", fy);

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

  const avgLabel = timeCharterByDept.periods.length === 2 ? `1H ${periodById(timeCharterByDept.periods[1].id).fy.replace("FY", "")}` : "Average";
  const selectedRow = selectedDept ? timeCharterByDept.departments.find((d) => d.department === selectedDept) : undefined;
  const chartLabel = selectedRow ? selectedRow.department : "Group average";
  const chartScores = selectedRow ? selectedRow.scores : timeCharterByDept.overallByPeriod;
  const chartData = useMemo(
    () =>
      timeCharterByDept.periods
        .map((p, i) => ({ label: p.label, value: chartScores[i] }))
        .filter((d): d is { label: string; value: number } => d.value !== null),
    [timeCharterByDept.periods, chartScores]
  );
  const overallAvg = meanOf(timeCharterByDept.overallByPeriod);

  return (
    <div>
      <ScreenHeader id="CP005" subtitle="Customer Perspective performance for Management and Board reporting. Weight 15.0% · 2 KPIs." onNavigate={onNavigate} />

      <div className="mb-4 flex flex-wrap items-center gap-x-5 gap-y-2">
        <div className="flex items-center gap-2">
          <span className="text-[11px] text-[hsl(var(--pk-ink-faint))]">Reporting period</span>
          <PeriodPickerCompact periodId={periodId} onChange={setPeriodId} />
        </div>
        <ComparePeriodsPicker selected={compareIds} onChange={setCompareIds} />
      </div>

      <PeriodComparisonTable
        periodIds={compareIds}
        onRemove={(id) => setCompareIds((prev) => prev.filter((x) => x !== id))}
        rows={[
          { label: "External Client Satisfaction — YTD Actual", get: (id) => { const r = latestValue("KPI5", entityId, id); return r.ytdActual !== null ? r.ytdActual.toFixed(1) : "—"; } },
          { label: "External Client Satisfaction — Weighted Achievement", get: (id) => { const r = latestValue("KPI5", entityId, id); return r.weighted !== null ? `${(r.weighted * 100).toFixed(1)}%` : "—"; } },
          { label: "Time Charter Compliance — Weighted Achievement", get: (id) => { const r = latestValue("KPI6", entityId, id); return r.weighted !== null ? `${(r.weighted * 100).toFixed(1)}%` : "—"; } },
        ]}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 items-start">
        <div className="lg:col-span-1 flex flex-col gap-5">
          <section className="rounded-xl border border-[hsl(var(--pk-border))] bg-[hsl(var(--pk-surface))] shadow-card p-5">
            <div className="flex items-center justify-between flex-wrap gap-2 mb-2">
              <div className="text-[11px] uppercase tracking-wide text-[hsl(var(--pk-ink-faint))]">KPI 5 · Weight 7.5% · bi-annual</div>
              <StatusChip status={kpi5.status} />
            </div>
            <div className="font-head font-bold text-[hsl(var(--pk-ink))] mb-2">External Client Satisfaction</div>
            <div className={cn("tnum font-head text-2xl font-semibold mb-3", kpi5.ytdActual !== null ? "text-[hsl(var(--pk-ink))]" : "text-[hsl(var(--pk-ink-faint))]")}>
              {kpi5.ytdActual !== null ? kpi5.ytdActual.toFixed(1) : "—"}
              <span className="text-sm font-head font-normal text-[hsl(var(--pk-ink-faint))]"> / target {kpi5.ytdTarget !== null ? kpi5.ytdTarget.toFixed(1) : "—"}</span>
            </div>
            <KpiMetricStrip
              weight="7.5%"
              fy={fy}
              periodLabel={periodLabel}
              fyTarget={kpi5FyTarget.toFixed(1)}
              ytdTarget={kpi5.ytdTarget !== null ? kpi5.ytdTarget.toFixed(1) : "—"}
              ytdActual={kpi5.ytdActual !== null ? kpi5.ytdActual.toFixed(1) : "—"}
              achievement={kpi5.weighted !== null ? `${(kpi5.weighted * 100).toFixed(1)}%` : "—"}
              status={kpi5.status}
            />
            {kpi5.ytdActual === null && (
              <p className="text-xs text-[hsl(var(--pk-ink-faint))] mb-1">{kpi5.note ?? "Not yet reported for this period."}</p>
            )}
            <div className="mt-2 pt-4 border-t border-[hsl(var(--pk-border))]">
              <div className="flex items-center justify-between flex-wrap gap-1.5 mb-2">
                <div className="text-[11px] font-bold uppercase tracking-wide text-[hsl(var(--pk-ink-faint))]">Historical trend</div>
                <DurationFilterBar duration={duration} onChange={setDuration} total={fullSatisfactionTrend.length} label="" />
              </div>
              <StackedBarTrend data={satisfactionTrend} />
            </div>
          </section>

          <section className="rounded-xl border border-[hsl(var(--pk-border))] bg-[hsl(var(--pk-surface))] shadow-card p-5">
            <div className="flex items-center justify-between flex-wrap gap-2 mb-2">
              <div className="text-[11px] uppercase tracking-wide text-[hsl(var(--pk-ink-faint))]">KPI 6 · Weight 7.5% · quarterly</div>
              <StatusChip status={kpi6.status} />
            </div>
            <div className="font-head font-bold text-[hsl(var(--pk-ink))] mb-3">Time Charter Compliance</div>
            <KpiMetricStrip
              weight="7.5%"
              fy={fy}
              periodLabel={periodLabel}
              fyTarget={`${kpi6FyTarget.toFixed(1)}%`}
              ytdTarget={kpi6.ytdTarget !== null ? `${kpi6.ytdTarget.toFixed(1)}%` : "—"}
              ytdActual={kpi6.ytdActual !== null ? `${kpi6.ytdActual.toFixed(1)}%` : "—"}
              achievement={kpi6.weighted !== null ? `${(kpi6.weighted * 100).toFixed(1)}%` : "—"}
              status={kpi6.status}
            />
            <p className="text-[11px] text-[hsl(var(--pk-ink-faint))]">Group average across {timeCharterByDept.departments.length || "—"} departments, scored quarterly.</p>

            {timeCharterByDept.periods.length > 0 && (
              <div className="mt-2 pt-4 border-t border-[hsl(var(--pk-border))]">
                <div className="flex items-center justify-between flex-wrap gap-1.5 mb-2">
                  <div className="text-[11px] font-bold uppercase tracking-wide text-[hsl(var(--pk-ink-faint))]">Scoring by quarter — {chartLabel}</div>
                  {selectedDept && (
                    <button
                      onClick={() => setSelectedDept(null)}
                      className="text-[11px] font-medium text-[hsl(var(--pk-accent))] hover:opacity-75 transition-opacity"
                    >
                      Reset to Group average
                    </button>
                  )}
                </div>
                <LineTrend data={chartData} unit="%" />
              </div>
            )}
          </section>
        </div>

        {timeCharterByDept.periods.length > 0 && (
          <div className="lg:col-span-2">
            <section className="rounded-xl border border-[hsl(var(--pk-border))] bg-[hsl(var(--pk-surface))] shadow-card p-5 h-full">
              <div className="text-[11px] uppercase tracking-wide text-[hsl(var(--pk-ink-faint))] mb-2">Summary of Results — click a department to chart its own trend</div>
              <div className="rounded-lg border border-[hsl(var(--pk-border))] overflow-x-auto">
                <table className="w-full text-sm min-w-[560px]">
                  <thead>
                    <tr className="text-[11px] uppercase tracking-wide text-white bg-[hsl(var(--pk-navy))]">
                      <th className="text-left font-medium px-3 py-2.5 w-10">No</th>
                      <th className="text-left font-medium px-3 py-2.5">Departments</th>
                      {timeCharterByDept.periods.map((p) => (
                        <th key={p.id} className="text-right font-medium px-3 py-2.5">{p.label}</th>
                      ))}
                      <th className="text-right font-medium px-3 py-2.5">{avgLabel}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {timeCharterByDept.departments.map((d, i) => {
                      const active = selectedDept === d.department;
                      return (
                        <tr
                          key={d.department}
                          onClick={() => setSelectedDept(active ? null : d.department)}
                          className={cn(
                            "border-t border-[hsl(var(--pk-border))] cursor-pointer transition-colors",
                            active ? "bg-[hsl(var(--pk-accent-soft))]" : "hover:bg-[hsl(var(--pk-surface-2))]"
                          )}
                        >
                          <td className="px-3 py-2 text-[hsl(var(--pk-ink-faint))]">{i + 1}</td>
                          <td className="px-3 py-2 font-medium text-[hsl(var(--pk-ink))]">{d.department}</td>
                          {d.scores.map((v, j) => (
                            <td key={timeCharterByDept.periods[j].id} className="text-right px-3 py-2 tnum text-[hsl(var(--pk-accent))]">{v !== null ? `${v.toFixed(1)}%` : "—"}</td>
                          ))}
                          <td className="text-right px-3 py-2 tnum font-semibold text-[hsl(var(--pk-accent))]">{(() => { const m = meanOf(d.scores); return m !== null ? `${m.toFixed(1)}%` : "—"; })()}</td>
                        </tr>
                      );
                    })}
                    <tr className="border-t-2 border-[hsl(var(--pk-border))] bg-[hsl(var(--pk-surface-2))] font-semibold">
                      <td className="px-3 py-2" colSpan={2}>Average Quarter Scoring</td>
                      {timeCharterByDept.overallByPeriod.map((v, j) => (
                        <td key={timeCharterByDept.periods[j].id} className="text-right px-3 py-2 tnum">{v !== null ? `${v.toFixed(1)}%` : "—"}</td>
                      ))}
                      <td className="text-right px-3 py-2 tnum">{overallAvg !== null ? `${overallAvg.toFixed(1)}%` : "—"}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </section>
          </div>
        )}
      </div>
    </div>
  );
}
