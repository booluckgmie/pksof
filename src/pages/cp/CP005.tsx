import { Fragment } from "react";
import { ChevronDown } from "lucide-react";
import { ScreenHeader } from "@/components/pk/ScreenHeader";
import { StatusChip } from "@/components/pk/StatusChip";
import { StackedBarTrend } from "@/components/pk/Charts";
import { KpiMetricStrip } from "@/components/pk/KpiMetricStrip";
import { PeriodPickerCompact, ComparePeriodsPicker, PeriodComparisonTable } from "@/components/pk/PeriodPicker";
import { cn } from "@/lib/utils";
import type { ScreenId } from "@/lib/nav";
import { useSession } from "@/lib/session";
import { useWorkflow } from "@/lib/workflow";
import { useDetails } from "@/lib/details";
import { useKpiTargets } from "@/lib/kpiTargets";
import { useCurrentPeriodId } from "@/lib/orgSettings";
import { periodById } from "@/data/periods";
import { useState } from "react";
import type { PeriodId } from "@/types";

/** KPI 5's own survey years that predate this dashboard's data (only FY2025 onward is tracked
 * live) — illustrative history so the yearly trend doesn't open on a single bar. */
const KPI5_DUMMY_HISTORY: { fy: string; target: number; actual: number }[] = [
  { fy: "FY2023", target: 4.3, actual: 4.2 },
  { fy: "FY2024", target: 4.4, actual: 4.5 },
];

const TH_CLASS = "text-left font-bold px-3 py-2.5 whitespace-nowrap";
const TH_RIGHT_CLASS = "text-right font-bold px-3 py-2.5 whitespace-nowrap";

/** Mean of a department's own quarters that actually have a score — used both for the table's
 * trailing average column and to label it: two quarters reads as a half-year ("1H"), matching how
 * the client's own report names it; any other count falls back to a generic "Average". */
function meanOf(values: (number | null)[]): number | null {
  const known = values.filter((v): v is number => v !== null);
  return known.length > 0 ? known.reduce((s, v) => s + v, 0) / known.length : null;
}

export function CP005({ onNavigate }: { onNavigate: (id: ScreenId) => void }) {
  const { entityId } = useSession();
  // Local to this screen only — see CP003's own Reporting period filter for why.
  const [periodId, setPeriodId] = useState<PeriodId>(useCurrentPeriodId());
  const [compareIds, setCompareIds] = useState<PeriodId[]>([]);
  const [showServiceDetail, setShowServiceDetail] = useState(false);
  const { latestValue } = useWorkflow();
  const { timeCharterByDept, clientSatisfactionServicesFor } = useDetails();
  const { getFyTarget } = useKpiTargets();
  const kpi6 = latestValue("KPI6", entityId, periodId);
  const period = periodById(periodId);
  const fy = period.fy;
  const periodLabel = period.label.replace(" FY", " ");
  const kpi6FyTarget = getFyTarget("KPI6", fy);

  // KPI 5 is a bi-annual survey reported once a year (year-end), not something that varies by
  // quarter — regardless of which quarter the page's own picker is on, its card always shows the
  // selected FY's own annual result (Q4 of that FY), and its trend is a bar per year, not per
  // quarter.
  const kpi5PeriodId = `Q4FY${fy.slice(-2)}` as PeriodId;
  const kpi5 = latestValue("KPI5", entityId, kpi5PeriodId);
  const kpi5FyTarget = getFyTarget("KPI5", fy);
  const kpi5PeriodLabel = fy.replace("FY", "");

  const satisfactionYearlyTrend = [
    ...KPI5_DUMMY_HISTORY.map((y) => ({
      label: y.fy,
      segments: [
        { label: "Actual", value: y.actual, color: y.actual >= y.target ? "hsl(var(--pk-good))" : "hsl(var(--pk-warn))" },
        { label: "Gap to target", value: Math.max(y.target - y.actual, 0), color: "hsl(var(--pk-surface-2))" },
      ],
    })),
    ...["FY2025", "FY2026"]
      .map((yFy) => ({ yFy, r: latestValue("KPI5", entityId, `Q4FY${yFy.slice(-2)}` as PeriodId) }))
      .filter((x) => x.r.ytdActual !== null)
      .map(({ yFy, r }) => ({
        label: yFy,
        segments: [
          { label: "Actual", value: r.ytdActual as number, color: r.status === "met" ? "hsl(var(--pk-good))" : "hsl(var(--pk-warn))" },
          { label: "Gap to target", value: Math.max((r.ytdTarget ?? 0) - (r.ytdActual as number), 0), color: "hsl(var(--pk-surface-2))" },
        ],
      })),
  ];

  const avgLabel = timeCharterByDept.periods.length === 2 ? `1H ${periodById(timeCharterByDept.periods[1].id).fy.replace("FY", "")}` : "Average";
  const overallAvg = meanOf(timeCharterByDept.overallByPeriod);
  const serviceBreakdown = clientSatisfactionServicesFor(kpi5PeriodId);

  return (
    <div>
      <ScreenHeader id="CP005" subtitle="Customer Perspective performance for Management and Board reporting. Weight 15.0% · 2 KPIs." periodId={periodId} onNavigate={onNavigate} />

      <div className="mb-4 flex flex-wrap items-center gap-x-5 gap-y-2">
        <div className="flex items-center gap-2">
          <span className="text-2xs text-[hsl(var(--pk-ink-faint))]">Reporting period</span>
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

      <div className="grid grid-cols-1 lg:grid-cols-6 gap-5 items-start">
        <div className="lg:col-span-2 flex flex-col gap-5">
          <section
            role="button"
            tabIndex={0}
            onClick={() => serviceBreakdown.hasData && setShowServiceDetail((v) => !v)}
            onKeyDown={(e) => { if (serviceBreakdown.hasData && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); setShowServiceDetail((v) => !v); } }}
            className={cn(
              "text-left rounded-xl border bg-[hsl(var(--pk-surface))] shadow-card p-5 transition-colors",
              serviceBreakdown.hasData && "cursor-pointer",
              showServiceDetail ? "border-[hsl(var(--pk-accent))]" : "border-[hsl(var(--pk-border))] hover:bg-[hsl(var(--pk-surface-2))]"
            )}
          >
            <div className="flex items-center justify-between flex-wrap gap-2 mb-2">
              <div className="text-2xs font-bold uppercase tracking-wide text-[hsl(var(--pk-ink-faint))]">KPI 5 · Weight 7.5% · bi-annual</div>
              <StatusChip status={kpi5.status} />
            </div>
            <div className="font-head font-bold text-[hsl(var(--pk-ink))] mb-2">External Client Satisfaction</div>
            <div className={cn("tnum font-head text-2xl font-semibold mb-3", kpi5.ytdActual !== null ? "text-[hsl(var(--pk-ink))]" : "text-[hsl(var(--pk-ink-faint))]")}>
              {kpi5.ytdActual !== null ? kpi5.ytdActual.toFixed(1) : "—"}
              <span className="text-sm font-head font-normal text-[hsl(var(--pk-ink-faint))]"> / target {kpi5.ytdTarget !== null ? kpi5.ytdTarget.toFixed(1) : "—"}</span>
            </div>
            <KpiMetricStrip
              fy={fy}
              periodLabel={kpi5PeriodLabel}
              fyTarget={kpi5FyTarget.toFixed(1)}
              ytdTarget={kpi5.ytdTarget !== null ? kpi5.ytdTarget.toFixed(1) : "—"}
              ytdActual={kpi5.ytdActual !== null ? kpi5.ytdActual.toFixed(1) : "—"}
              achievement={kpi5.weighted !== null ? `${(kpi5.weighted * 100).toFixed(1)}%` : "—"}
              status={kpi5.status}
            />
            {kpi5.ytdActual === null && (
              <p className="text-xs text-[hsl(var(--pk-ink-faint))] mb-1">{kpi5.note ?? "Not yet reported for this year."}</p>
            )}
            <div className="mt-2 pt-4 border-t border-[hsl(var(--pk-border))]">
              <div className="text-2xs font-bold uppercase tracking-wide text-[hsl(var(--pk-ink-faint))] mb-2">Historical trend (by year)</div>
              <StackedBarTrend data={satisfactionYearlyTrend} />
            </div>
            {serviceBreakdown.hasData && (
              <div className="flex items-center justify-end mt-2">
                <span className="flex items-center gap-1 text-2xs text-[hsl(var(--pk-accent))] shrink-0">
                  {showServiceDetail ? "Hide service breakdown" : "View service breakdown"}
                  <ChevronDown className={cn("h-3 w-3 transition-transform", showServiceDetail && "rotate-180")} />
                </span>
              </div>
            )}
          </section>
        </div>

        {timeCharterByDept.periods.length > 0 && (
          <div className="lg:col-span-4 flex flex-col gap-5">
            <section className="rounded-xl border border-[hsl(var(--pk-border))] bg-[hsl(var(--pk-surface))] shadow-card p-5">
              <div className="flex items-center justify-between flex-wrap gap-2 mb-2">
                <div className="text-2xs font-bold uppercase tracking-wide text-[hsl(var(--pk-ink-faint))]">KPI 6 · Weight 7.5% · quarterly</div>
                <StatusChip status={kpi6.status} />
              </div>
              <div className="font-head font-bold text-[hsl(var(--pk-ink))] mb-3">Time Charter Compliance</div>
              <KpiMetricStrip
                fy={fy}
                periodLabel={periodLabel}
                fyTarget={`${kpi6FyTarget.toFixed(1)}%`}
                ytdTarget={kpi6.ytdTarget !== null ? `${kpi6.ytdTarget.toFixed(1)}%` : "—"}
                ytdActual={kpi6.ytdActual !== null ? `${kpi6.ytdActual.toFixed(1)}%` : "—"}
                achievement={kpi6.weighted !== null ? `${(kpi6.weighted * 100).toFixed(1)}%` : "—"}
                status={kpi6.status}
              />
              <p className="text-2xs text-[hsl(var(--pk-ink-faint))]">Group average across {timeCharterByDept.departments.length || "—"} departments, scored quarterly.</p>
            </section>

            <section className="rounded-xl border border-[hsl(var(--pk-border))] bg-[hsl(var(--pk-surface))] shadow-card p-5">
              <div className="text-2xs uppercase tracking-wide text-[hsl(var(--pk-ink-faint))] mb-2">Summary of Results</div>
              <div className="rounded-lg border border-[hsl(var(--pk-border))] overflow-x-auto">
                <table className="w-full text-sm min-w-[560px]">
                  <thead>
                    <tr className="text-2xs uppercase tracking-wide text-white bg-[hsl(var(--pk-navy))]">
                      <th className="text-left font-medium px-3 py-2.5 w-10">No</th>
                      <th className="text-left font-medium px-3 py-2.5">Departments</th>
                      {timeCharterByDept.periods.map((p) => (
                        <th key={p.id} className="text-right font-medium px-3 py-2.5">{p.label}</th>
                      ))}
                      <th className="text-right font-medium px-3 py-2.5">{avgLabel}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {timeCharterByDept.departments.map((d, i) => (
                      <tr key={d.department} className="border-t border-[hsl(var(--pk-border))]">
                        <td className="px-3 py-2 text-[hsl(var(--pk-ink-faint))]">{i + 1}</td>
                        <td className="px-3 py-2 font-medium text-[hsl(var(--pk-ink))]">{d.department}</td>
                        {d.scores.map((v, j) => (
                          <td key={timeCharterByDept.periods[j].id} className="text-right px-3 py-2 tnum text-[hsl(var(--pk-accent))]">{v !== null ? `${v.toFixed(1)}%` : "—"}</td>
                        ))}
                        <td className="text-right px-3 py-2 tnum font-semibold text-[hsl(var(--pk-accent))]">{(() => { const m = meanOf(d.scores); return m !== null ? `${m.toFixed(1)}%` : "—"; })()}</td>
                      </tr>
                    ))}
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

      {showServiceDetail && serviceBreakdown.hasData && (
        <>
          <div className="text-2xs uppercase tracking-wide text-[hsl(var(--pk-ink-faint))] mb-2 mt-5">External Client Satisfaction — Summary of Results</div>
          <div className="rounded-lg border border-[hsl(var(--pk-border))] bg-[hsl(var(--pk-surface))] shadow-card overflow-x-auto mb-4">
            <table className="w-full text-sm min-w-[760px]">
              <thead>
                <tr className="text-2xs uppercase tracking-wide text-white bg-[hsl(var(--pk-navy))] divide-x divide-white/15">
                  <th rowSpan={2} className={cn(TH_CLASS, "align-bottom")}>Services</th>
                  <th rowSpan={2} className={cn(TH_RIGHT_CLASS, "align-bottom")}>Prior Rating</th>
                  <th colSpan={4} className="text-center font-bold px-3 py-1.5 border-b border-white/15">Current Analysis</th>
                </tr>
                <tr className="text-2xs uppercase tracking-wide text-white bg-[hsl(var(--pk-navy))] divide-x divide-white/15">
                  <th className={TH_RIGHT_CLASS}>Avg Service Rating</th>
                  <th className={TH_RIGHT_CLASS}>Surveys Sent</th>
                  <th className={TH_RIGHT_CLASS}>Responses Received</th>
                  <th className={TH_RIGHT_CLASS}>% of Responses</th>
                </tr>
              </thead>
              <tbody>
                {(() => {
                  let lastCategory = "";
                  return serviceBreakdown.services.map((s) => {
                    const showCategory = s.category !== lastCategory;
                    lastCategory = s.category;
                    return (
                      <Fragment key={s.service}>
                        {showCategory && (
                          <tr>
                            <td colSpan={6} className="pt-2.5 pb-1 px-3 text-2xs uppercase tracking-wide text-[hsl(var(--pk-ink-faint))] font-medium bg-[hsl(var(--pk-surface-2))]">
                              {s.category}
                            </td>
                          </tr>
                        )}
                        <tr className="border-t border-[hsl(var(--pk-border))] divide-x divide-[hsl(var(--pk-border))]">
                          <td className="px-3 py-2 text-[hsl(var(--pk-ink))]">{s.service}</td>
                          <td className="px-3 py-2 text-right tnum text-[hsl(var(--pk-ink-faint))]">{s.priorRating !== null ? s.priorRating.toFixed(1) : "—"}</td>
                          <td className="px-3 py-2 text-right tnum font-medium">
                            {s.rating !== null ? (
                              <span className="inline-flex items-center gap-1.5 justify-end">
                                {s.rating.toFixed(1)}
                                <span className="text-[hsl(var(--pk-accent))] font-normal">{s.band}</span>
                              </span>
                            ) : "—"}
                          </td>
                          <td className="px-3 py-2 text-right tnum">{s.sent ?? "—"}</td>
                          <td className="px-3 py-2 text-right tnum">{s.received ?? "—"}</td>
                          <td className="px-3 py-2 text-right tnum">{s.responseRate !== null ? `${s.responseRate}%` : "—"}</td>
                        </tr>
                      </Fragment>
                    );
                  });
                })()}
                {serviceBreakdown.total && (
                  <tr className="border-t-2 border-[hsl(var(--pk-border))] bg-[hsl(var(--pk-surface-2))] font-semibold divide-x divide-[hsl(var(--pk-border))]">
                    <td className="px-3 py-2.5">Corp. Average Rating</td>
                    <td className="px-3 py-2.5 text-right tnum">{serviceBreakdown.total.priorRating !== null ? serviceBreakdown.total.priorRating.toFixed(1) : "—"}</td>
                    <td className="px-3 py-2.5 text-right tnum">
                      <span className="inline-flex items-center gap-1.5 justify-end">
                        {serviceBreakdown.total.rating !== null ? serviceBreakdown.total.rating.toFixed(1) : "—"}
                        <span className="text-[hsl(var(--pk-accent))] font-normal">{serviceBreakdown.total.band}</span>
                      </span>
                    </td>
                    <td className="px-3 py-2.5 text-right tnum">{serviceBreakdown.total.sent ?? "—"}</td>
                    <td className="px-3 py-2.5 text-right tnum">{serviceBreakdown.total.received ?? "—"}</td>
                    <td className="px-3 py-2.5 text-right tnum">{serviceBreakdown.total.responseRate !== null ? `${serviceBreakdown.total.responseRate}%` : "—"}</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
