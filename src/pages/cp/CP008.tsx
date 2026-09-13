import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { ScreenHeader } from "@/components/pk/ScreenHeader";
import { StatusChip } from "@/components/pk/StatusChip";
import { Donut, LineTrend } from "@/components/pk/Charts";
import { KpiMetricStrip } from "@/components/pk/KpiMetricStrip";
import { DurationFilterBar, useDurationFilter } from "@/components/pk/DurationFilter";
import { PeriodPickerCompact, ComparePeriodsPicker, PeriodComparisonTable } from "@/components/pk/PeriodPicker";
import type { ScreenId } from "@/lib/nav";
import { useSession } from "@/lib/session";
import { useWorkflow } from "@/lib/workflow";
import { useDetails } from "@/lib/details";
import { useKpiTargets } from "@/lib/kpiTargets";
import { useCurrentPeriodId } from "@/lib/orgSettings";
import { kpiById } from "@/data/kpis";
import { periods, periodById, periodEndDateWords } from "@/data/periods";
import { cn } from "@/lib/utils";
import type { PeriodId } from "@/types";

const fmtRM = (v: number) => v.toLocaleString("en-MY", { maximumFractionDigits: 0 });

type Tab = "composition" | "procurement" | "training";

export function CP008({ onNavigate }: { onNavigate: (id: ScreenId) => void }) {
  const { entityId } = useSession();
  // Local to this screen only — see CP003's own Reporting period filter for why.
  const [periodId, setPeriodId] = useState<PeriodId>(useCurrentPeriodId());
  const { latestValue } = useWorkflow();
  const { bumiputeraProcurementFor, bumiputeraTrainingByPeriod, headcountSummaryByPeriod } = useDetails();
  const { getFyTarget } = useKpiTargets();
  const kpi11 = latestValue("KPI11", entityId, periodId);
  const kpi12 = latestValue("KPI12", entityId, periodId);
  const kpi13 = latestValue("KPI13", entityId, periodId);
  const bumiputeraTraining = bumiputeraTrainingByPeriod[periodId];
  const headcountSummary = headcountSummaryByPeriod[periodId];
  const period = periodById(periodId);
  const fy = period.fy;
  const periodLabel = period.label.replace(" FY", " ");
  const kpi11FyTarget = getFyTarget("KPI11", fy);
  const kpi12FyTarget = getFyTarget("KPI12", fy);
  const kpi13FyTarget = getFyTarget("KPI13", fy);
  const kpi13Target = kpiById("KPI13").fyTarget ?? 0;
  const [expanded, setExpanded] = useState<Tab | null>(null);
  const toggle = (key: Tab) => setExpanded((e) => (e === key ? null : key));
  const onToggleKeyDown = (key: Tab) => (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") { e.preventDefault(); toggle(key); }
  };
  const [compareIds, setCompareIds] = useState<PeriodId[]>([]);

  const bumiputeraProcurement = bumiputeraProcurementFor(periodId);
  const procTotals = bumiputeraProcurement.reduce(
    (s, r) => ({ fyTarget: s.fyTarget + r.fyTarget, ytdTarget: s.ytdTarget + r.ytdTarget, ytdActual: s.ytdActual + r.ytdActual, variance: s.variance + r.variance }),
    { fyTarget: 0, ytdTarget: 0, ytdActual: 0, variance: 0 }
  );

  const fullCompositionTrend = periods
    .map((p) => {
      const s = headcountSummaryByPeriod[p.id];
      const total = s.bumiputera + s.nonBumiputera;
      return { label: p.label.replace("FY20", "FY"), value: total > 0 ? (s.bumiputera / total) * 100 : null };
    })
    .filter((d): d is { label: string; value: number } => d.value !== null);
  const { duration: compDuration, setDuration: setCompDuration, filtered: compositionTrend } = useDurationFilter(fullCompositionTrend);

  return (
    <div>
      <ScreenHeader id="CP008" subtitle="Weight 5.0% · 3 KPIs — Composition, Procurement and Training." periodId={periodId} onNavigate={onNavigate} />

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
          { label: "Bumiputera Composition — Weighted Achievement", get: (id) => { const r = latestValue("KPI12", entityId, id); return r.weighted !== null ? `${(r.weighted * 100).toFixed(1)}%` : "—"; } },
          { label: "Bumiputera Procurement — Weighted Achievement", get: (id) => { const r = latestValue("KPI11", entityId, id); return r.weighted !== null ? `${(r.weighted * 100).toFixed(1)}%` : "—"; } },
          { label: "Bumiputera Training — Weighted Achievement", get: (id) => { const r = latestValue("KPI13", entityId, id); return r.weighted !== null ? `${(r.weighted * 100).toFixed(1)}%` : "—"; } },
        ]}
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <div
          role="button"
          tabIndex={0}
          onClick={() => toggle("procurement")}
          onKeyDown={onToggleKeyDown("procurement")}
          className={cn(
            "text-left rounded-lg border bg-[hsl(var(--pk-surface))] shadow-card p-4 cursor-pointer transition-colors",
            expanded === "procurement" ? "border-[hsl(var(--pk-accent))]" : "border-[hsl(var(--pk-border))] hover:bg-[hsl(var(--pk-surface-2))]"
          )}
        >
          <div className="flex items-center justify-between mb-2">
            <div className="text-2xs font-bold uppercase tracking-wide text-[hsl(var(--pk-ink-faint))]">KPI 11 · Weight 1.67%</div>
            <StatusChip status={kpi11.status} />
          </div>
          <div className="font-head font-bold text-[hsl(var(--pk-ink))] mb-2">Bumiputera Procurement</div>
          <div className="flex items-baseline gap-2 mb-2">
            <span className="tnum font-head text-2xl font-semibold">{kpi11.ytdActual !== null ? `RM ${kpi11.ytdActual.toFixed(2)}m` : "—"}</span>
            <span className="text-sm text-[hsl(var(--pk-ink-faint))]">/ target {kpi11.ytdTarget !== null ? `RM ${kpi11.ytdTarget.toFixed(2)}m` : "—"}</span>
          </div>
          <KpiMetricStrip
            fy={fy}
            periodLabel={periodLabel}
            fyTarget={`RM ${kpi11FyTarget.toFixed(2)}m`}
            ytdTarget={kpi11.ytdTarget !== null ? `RM ${kpi11.ytdTarget.toFixed(2)}m` : "—"}
            ytdActual={kpi11.ytdActual !== null ? `RM ${kpi11.ytdActual.toFixed(2)}m` : "—"}
            achievement={kpi11.weighted !== null ? `${(kpi11.weighted * 100).toFixed(1)}%` : "—"}
            status={kpi11.status}
          />
          <div className="flex items-center justify-end">
            <span className="flex items-center gap-1 text-2xs text-[hsl(var(--pk-accent))] shrink-0">
              {expanded === "procurement" ? "Hide details" : "View details"}
              <ChevronDown className={cn("h-3 w-3 transition-transform", expanded === "procurement" && "rotate-180")} />
            </span>
          </div>
        </div>

        <div
          role="button"
          tabIndex={0}
          onClick={() => toggle("composition")}
          onKeyDown={onToggleKeyDown("composition")}
          className={cn(
            "text-left rounded-lg border bg-[hsl(var(--pk-surface))] shadow-card p-4 cursor-pointer transition-colors",
            expanded === "composition" ? "border-[hsl(var(--pk-accent))]" : "border-[hsl(var(--pk-border))] hover:bg-[hsl(var(--pk-surface-2))]"
          )}
        >
          <div className="flex items-center justify-between mb-2">
            <div className="text-2xs font-bold uppercase tracking-wide text-[hsl(var(--pk-ink-faint))]">KPI 12 · Weight 1.67%</div>
            <StatusChip status={kpi12.status} />
          </div>
          <div className="font-head font-bold text-[hsl(var(--pk-ink))] mb-2">Bumiputera Composition</div>
          <div className="flex items-baseline gap-2 mb-2">
            <span className="tnum font-head text-2xl font-semibold">{kpi12.ytdActual !== null ? `${kpi12.ytdActual.toFixed(1)}%` : "—"}</span>
            <span className="text-sm text-[hsl(var(--pk-ink-faint))]">/ target {kpi12.ytdTarget !== null ? `${kpi12.ytdTarget}%` : "—"}</span>
          </div>
          <KpiMetricStrip
            fy={fy}
            periodLabel={periodLabel}
            fyTarget={`${kpi12FyTarget.toFixed(1)}%`}
            ytdTarget={kpi12.ytdTarget !== null ? `${kpi12.ytdTarget.toFixed(1)}%` : "—"}
            ytdActual={kpi12.ytdActual !== null ? `${kpi12.ytdActual.toFixed(1)}%` : "—"}
            achievement={kpi12.weighted !== null ? `${(kpi12.weighted * 100).toFixed(1)}%` : "—"}
            status={kpi12.status}
          />
          <div className="flex items-center justify-end">
            <span className="flex items-center gap-1 text-2xs text-[hsl(var(--pk-accent))] shrink-0">
              {expanded === "composition" ? "Hide details" : "View details"}
              <ChevronDown className={cn("h-3 w-3 transition-transform", expanded === "composition" && "rotate-180")} />
            </span>
          </div>
        </div>

        <div
          role="button"
          tabIndex={0}
          onClick={() => toggle("training")}
          onKeyDown={onToggleKeyDown("training")}
          className={cn(
            "text-left rounded-lg border bg-[hsl(var(--pk-surface))] shadow-card p-4 cursor-pointer transition-colors",
            expanded === "training" ? "border-[hsl(var(--pk-accent))]" : "border-[hsl(var(--pk-border))] hover:bg-[hsl(var(--pk-surface-2))]"
          )}
        >
          <div className="flex items-center justify-between mb-2">
            <div className="text-2xs font-bold uppercase tracking-wide text-[hsl(var(--pk-ink-faint))]">KPI 13 · Weight 1.66%</div>
            <StatusChip status={kpi13.status} />
          </div>
          <div className="font-head font-bold text-[hsl(var(--pk-ink))] mb-2">Bumiputera Training</div>
          <div className="flex items-baseline gap-2 mb-2">
            <span className="tnum font-head text-2xl font-semibold">{kpi13.ytdActual !== null ? kpi13.ytdActual : "—"}</span>
            <span className="text-sm text-[hsl(var(--pk-ink-faint))]">/ target {kpi13.ytdTarget ?? "—"} staff</span>
          </div>
          <KpiMetricStrip
            fy={fy}
            periodLabel={periodLabel}
            fyTarget={String(kpi13FyTarget)}
            ytdTarget={kpi13.ytdTarget !== null ? String(kpi13.ytdTarget) : "—"}
            ytdActual={kpi13.ytdActual !== null ? String(kpi13.ytdActual) : "—"}
            achievement={kpi13.weighted !== null ? `${(kpi13.weighted * 100).toFixed(1)}%` : "—"}
            status={kpi13.status}
          />
          <div className="flex items-center justify-end">
            <span className="flex items-center gap-1 text-2xs text-[hsl(var(--pk-accent))] shrink-0">
              {expanded === "training" ? "Hide details" : "View details"}
              <ChevronDown className={cn("h-3 w-3 transition-transform", expanded === "training" && "rotate-180")} />
            </span>
          </div>
        </div>
      </div>

      {expanded === "composition" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div className="rounded-lg border border-[hsl(var(--pk-border))] bg-[hsl(var(--pk-surface))] shadow-card p-4">
            <div className="text-2xs font-bold underline text-[hsl(var(--pk-ink-faint))] mb-2">Bumiputera Composition</div>
            <div className="flex flex-col sm:flex-row items-center gap-4">
              <div className="w-36 shrink-0">
                <Donut
                  segments={[
                    { label: "Bumiputera Employees", value: headcountSummary.bumiputera, color: "hsl(var(--pk-accent))" },
                    { label: "Non-Bumiputera Employees", value: headcountSummary.nonBumiputera, color: "hsl(var(--pk-navy))" },
                  ]}
                  centerValue={headcountSummary.bumiputera + headcountSummary.nonBumiputera > 0 ? `${((headcountSummary.bumiputera / (headcountSummary.bumiputera + headcountSummary.nonBumiputera)) * 100).toFixed(0)}%` : "—"}
                  centerLabel="Bumiputera"
                />
              </div>
              <table className="w-full text-xs">
                <tbody>
                  <tr className="border-b border-[hsl(var(--pk-border))]">
                    <td className="py-1.5 flex items-center gap-1.5 text-[hsl(var(--pk-ink-soft))]">
                      <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ background: "hsl(var(--pk-accent))" }} />
                      Bumiputera Employees
                    </td>
                    <td className="text-right py-1.5 tnum font-semibold">{headcountSummary.bumiputera}</td>
                  </tr>
                  <tr className="border-b border-[hsl(var(--pk-border))]">
                    <td className="py-1.5 flex items-center gap-1.5 text-[hsl(var(--pk-ink-soft))]">
                      <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ background: "hsl(var(--pk-navy))" }} />
                      Non-Bumiputera Employees
                    </td>
                    <td className="text-right py-1.5 tnum font-semibold">{headcountSummary.nonBumiputera}</td>
                  </tr>
                  <tr className="border-b border-[hsl(var(--pk-border))] font-semibold">
                    <td className="py-1.5 text-[hsl(var(--pk-ink))]">Total Employees as at {periodEndDateWords(periodId)}</td>
                    <td className="text-right py-1.5 tnum">{headcountSummary.bumiputera + headcountSummary.nonBumiputera}</td>
                  </tr>
                  <tr>
                    <td className="py-1.5 text-[hsl(var(--pk-ink))] italic">% of Bumiputera Employees</td>
                    <td className="text-right py-1.5 tnum font-semibold text-[hsl(var(--pk-accent))]">{kpi12.ytdActual !== null ? `${kpi12.ytdActual.toFixed(1)}%` : "—"}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
          {compositionTrend.length > 1 && (
            <div className="rounded-lg border border-[hsl(var(--pk-border))] bg-[hsl(var(--pk-surface))] shadow-card p-4">
              <div className="flex items-center justify-between flex-wrap gap-1.5 mb-1.5">
                <div className="text-2xs font-bold underline text-[hsl(var(--pk-ink-faint))]">Composition trend by quarter</div>
                <DurationFilterBar duration={compDuration} onChange={setCompDuration} total={fullCompositionTrend.length} label="" />
              </div>
              <LineTrend data={compositionTrend} unit="%" />
            </div>
          )}
        </div>
      )}

      {expanded === "procurement" && (
        <div className="rounded-lg border border-[hsl(var(--pk-border))] bg-[hsl(var(--pk-surface))] shadow-card overflow-hidden mb-4">
          <div className="px-4 pt-3.5 pb-1 font-head font-bold text-[hsl(var(--pk-ink))]">Bumiputera Procurement by Department</div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[520px]">
              <thead>
                <tr className="text-2xs uppercase tracking-wide text-white bg-[hsl(var(--pk-navy))]">
                  <th className="text-left font-medium px-3 py-2.5">Department</th>
                  <th className="text-right font-medium px-3 py-2.5">FY Target (RM)</th>
                  <th className="text-right font-medium px-3 py-2.5">YTD {periodLabel} Target (RM)</th>
                  <th className="text-right font-medium px-3 py-2.5">YTD {periodLabel} Actual (RM)</th>
                  <th className="text-right font-medium px-3 py-2.5">Variance against Target (RM)</th>
                </tr>
              </thead>
              <tbody>
                {bumiputeraProcurement.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-3 py-4 text-center text-xs text-[hsl(var(--pk-ink-faint))]">No department-level data for {period.label} yet.</td>
                  </tr>
                ) : (
                  bumiputeraProcurement.map((d) => (
                    <tr key={d.dept} className="border-t border-[hsl(var(--pk-border))]">
                      <td className="px-3 py-2 text-[hsl(var(--pk-ink-soft))]">{d.dept}</td>
                      <td className="text-right px-3 py-2 tnum">{fmtRM(d.fyTarget)}</td>
                      <td className="text-right px-3 py-2 tnum">{fmtRM(d.ytdTarget)}</td>
                      <td className="text-right px-3 py-2 tnum">{fmtRM(d.ytdActual)}</td>
                      <td className={cn("text-right px-3 py-2 tnum", d.variance < 0 && "text-[hsl(var(--pk-bad))]")}>{fmtRM(d.variance)}</td>
                    </tr>
                  ))
                )}
                {bumiputeraProcurement.length > 0 && (
                  <tr className="border-t border-[hsl(var(--pk-border))] bg-[hsl(var(--pk-surface-2))] font-bold">
                    <td className="px-3 py-2 text-[hsl(var(--pk-ink))]">Total</td>
                    <td className="text-right px-3 py-2 tnum">{fmtRM(procTotals.fyTarget)}</td>
                    <td className="text-right px-3 py-2 tnum">{fmtRM(procTotals.ytdTarget)}</td>
                    <td className="text-right px-3 py-2 tnum">{fmtRM(procTotals.ytdActual)}</td>
                    <td className={cn("text-right px-3 py-2 tnum", procTotals.variance < 0 && "text-[hsl(var(--pk-bad))]")}>{fmtRM(procTotals.variance)}</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {expanded === "training" && (
        <div className="rounded-lg border border-[hsl(var(--pk-border))] bg-[hsl(var(--pk-surface))] shadow-card p-4 mb-4">
          <div className="font-head font-bold text-[hsl(var(--pk-ink))] mb-3">Bumiputera Training</div>
          {kpi13.status === "not-measurable" && (
            <div className="inline-block rounded-md border border-[hsl(var(--pk-border))] bg-[hsl(var(--pk-surface-2))] px-3 py-1.5 text-xs font-bold text-[hsl(var(--pk-ink))] mb-3">
              Not measured in {periodLabel}. Progress only.
            </div>
          )}
          <p className="text-xs text-[hsl(var(--pk-ink-soft))] mb-3">
            Prokhas has identified a population / pool of <span className="font-semibold">{bumiputeraTraining.poolIdentified} Bumiputera employees</span> (from Junior Executive to Senior Manager) during the period to undergo competency development through the completion of at least two (2) registered programmes.
          </p>
          <p className="text-2xs text-[hsl(var(--pk-ink-faint))] mb-2">Status of completion of Bumiputera Competency Development Programmes as at {periodEndDateWords(periodId)}:</p>
          <div className="rounded-lg border border-[hsl(var(--pk-border))] overflow-hidden">
            <table className="w-full text-sm">
              <tbody>
                <tr className="border-b border-[hsl(var(--pk-border))]">
                  <td className="px-3 py-2 text-[hsl(var(--pk-ink-soft))]">Bumiputera staff attended one (1) programme</td>
                  <td className="text-right px-3 py-2 tnum font-semibold">{bumiputeraTraining.attendedOne} staff</td>
                </tr>
                <tr>
                  <td className="px-3 py-2 font-bold text-[hsl(var(--pk-ink))]">Bumiputera attended at least two (2) programmes</td>
                  <td className="text-right px-3 py-2 tnum font-bold">{bumiputeraTraining.attendedTwoPlus} staff</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p className="text-2xs text-[hsl(var(--pk-ink-faint))] mt-3">Annual target {kpi13Target} staff{bumiputeraTraining.attendedOne === 0 ? " · training not yet commenced this financial year." : ` · stage: ${bumiputeraTraining.stage}.`}</p>
        </div>
      )}
    </div>
  );
}
