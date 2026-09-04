import { useState } from "react";
import { ScreenHeader } from "@/components/pk/ScreenHeader";
import { StatusChip } from "@/components/pk/StatusChip";
import { CategoryBar, LineTrend } from "@/components/pk/Charts";
import { KpiMetricStrip } from "@/components/pk/KpiMetricStrip";
import { DurationFilterBar, useDurationFilter } from "@/components/pk/DurationFilter";
import { PeriodPickerCompact, ComparePeriodsPicker, PeriodComparisonTable } from "@/components/pk/PeriodPicker";
import type { ScreenId } from "@/lib/nav";
import { useSession } from "@/lib/session";
import { useWorkflow } from "@/lib/workflow";
import { useDetails } from "@/lib/details";
import { useKpiTargets } from "@/lib/kpiTargets";
import { kpiById } from "@/data/kpis";
import { periods, periodById } from "@/data/periods";
import { cn } from "@/lib/utils";
import type { PeriodId } from "@/types";

const TABS = [
  { id: "composition", label: "Composition (KPI 12)" },
  { id: "procurement", label: "Procurement (KPI 11)" },
  { id: "training", label: "Training (KPI 13)" },
] as const;

export function CP008({ onNavigate }: { onNavigate: (id: ScreenId) => void }) {
  const { entityId, periodId, setPeriodId } = useSession();
  const { latestValue } = useWorkflow();
  const { bumiputeraProcurement, bumiputeraTrainingByPeriod, headcountSummaryByPeriod } = useDetails();
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
  const [tab, setTab] = useState<(typeof TABS)[number]["id"]>("composition");
  const [compareIds, setCompareIds] = useState<PeriodId[]>([]);

  const procTotal = bumiputeraProcurement.reduce((s, r) => s + r.ytdActual, 0);

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
      <ScreenHeader id="CP008" subtitle="Weight 5.0% · 3 KPIs — Composition, Procurement and Training." onNavigate={onNavigate} />

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
          { label: "Bumiputera Composition — Weighted Achievement", get: (id) => { const r = latestValue("KPI12", entityId, id); return r.weighted !== null ? `${(r.weighted * 100).toFixed(1)}%` : "—"; } },
          { label: "Bumiputera Procurement — Weighted Achievement", get: (id) => { const r = latestValue("KPI11", entityId, id); return r.weighted !== null ? `${(r.weighted * 100).toFixed(1)}%` : "—"; } },
          { label: "Bumiputera Training — Weighted Achievement", get: (id) => { const r = latestValue("KPI13", entityId, id); return r.weighted !== null ? `${(r.weighted * 100).toFixed(1)}%` : "—"; } },
        ]}
      />

      <div className="flex flex-wrap gap-1.5 mb-4">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={cn(
              "text-xs font-medium px-3 py-1.5 rounded-md border transition-colors",
              tab === t.id
                ? "bg-[hsl(var(--pk-accent))] text-[hsl(var(--pk-accent-ink))] border-[hsl(var(--pk-accent))]"
                : "border-[hsl(var(--pk-border))] text-[hsl(var(--pk-ink-soft))] hover:bg-[hsl(var(--pk-surface-2))]"
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "composition" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="rounded-lg border border-[hsl(var(--pk-border))] bg-[hsl(var(--pk-surface))] shadow-card p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="text-[11px] uppercase tracking-wide text-[hsl(var(--pk-ink-faint))]">KPI 12 · Weight 1.67%</div>
              <StatusChip status={kpi12.status} />
            </div>
            <div className="font-head font-bold text-[hsl(var(--pk-ink))] mb-3">Bumiputera Composition</div>
            <KpiMetricStrip
              weight="1.67%"
              fy={fy}
              periodLabel={periodLabel}
              fyTarget={`${kpi12FyTarget.toFixed(1)}%`}
              ytdTarget={kpi12.ytdTarget !== null ? `${kpi12.ytdTarget.toFixed(1)}%` : "—"}
              ytdActual={kpi12.ytdActual !== null ? `${kpi12.ytdActual.toFixed(1)}%` : "—"}
            />
            <CategoryBar
              segments={[
                { label: "Bumiputera", value: headcountSummary.bumiputera, color: "hsl(var(--pk-accent))" },
                { label: "Non-Bumiputera", value: headcountSummary.nonBumiputera, color: "hsl(var(--pk-surface-2))" },
              ]}
            />
            <div className="text-[11px] text-[hsl(var(--pk-ink-faint))] mt-2">Target {kpi12.ytdTarget}% · Actual {kpi12.ytdActual?.toFixed(1)}%</div>
          </div>

          {compositionTrend.length > 1 && (
            <div className="rounded-lg border border-[hsl(var(--pk-border))] bg-[hsl(var(--pk-surface))] shadow-card p-4">
              <div className="flex items-center justify-between flex-wrap gap-1.5 mb-1.5">
                <div className="text-[11px] font-bold underline text-[hsl(var(--pk-ink-faint))]">Composition trend by quarter</div>
                <DurationFilterBar duration={compDuration} onChange={setCompDuration} total={fullCompositionTrend.length} label="" />
              </div>
              <LineTrend data={compositionTrend} unit="%" />
            </div>
          )}
        </div>
      )}

      {tab === "procurement" && (
        <div className="rounded-lg border border-[hsl(var(--pk-border))] bg-[hsl(var(--pk-surface))] shadow-card p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="text-[11px] uppercase tracking-wide text-[hsl(var(--pk-ink-faint))]">KPI 11 · Weight 1.67%</div>
            <StatusChip status={kpi11.status} />
          </div>
          <div className="font-head font-bold text-[hsl(var(--pk-ink))] mb-3">Bumiputera Procurement</div>
          <KpiMetricStrip
            weight="1.67%"
            fy={fy}
            periodLabel={periodLabel}
            fyTarget={`RM ${kpi11FyTarget.toFixed(2)}m`}
            ytdTarget={kpi11.ytdTarget !== null ? `RM ${kpi11.ytdTarget.toFixed(2)}m` : "—"}
            ytdActual={kpi11.ytdActual !== null ? `RM ${kpi11.ytdActual.toFixed(2)}m` : "—"}
          />
          <div className="tnum font-head text-2xl font-semibold mb-4">RM {procTotal.toFixed(2)}m</div>
          <div className="flex flex-col gap-3">
            {bumiputeraProcurement.map((d) => {
              const pct = d.fyTarget > 0 ? Math.min(100, (d.ytdActual / d.fyTarget) * 100) : 0;
              return (
                <div key={d.dept}>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-[hsl(var(--pk-ink-soft))]">{d.dept}</span>
                    <span className="tnum text-[hsl(var(--pk-ink-faint))]">RM {d.ytdActual.toFixed(2)}m / {d.fyTarget.toFixed(2)}m · {pct.toFixed(0)}%</span>
                  </div>
                  <div className="h-2 rounded bg-[hsl(var(--pk-surface-2))]">
                    <div className="h-full rounded bg-[hsl(var(--pk-accent))]" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {tab === "training" && (
        <div className="rounded-lg border border-[hsl(var(--pk-border))] bg-[hsl(var(--pk-surface))] shadow-card p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="text-[11px] uppercase tracking-wide text-[hsl(var(--pk-ink-faint))]">KPI 13 · Weight 1.66%</div>
            <StatusChip status={kpi13.status} />
          </div>
          <div className="font-head font-bold text-[hsl(var(--pk-ink))] mb-3">Bumiputera Training</div>
          <KpiMetricStrip
            weight="1.66%"
            fy={fy}
            periodLabel={periodLabel}
            fyTarget={String(kpi13FyTarget)}
            ytdTarget={kpi13.ytdTarget !== null ? String(kpi13.ytdTarget) : "—"}
            ytdActual={kpi13.ytdActual !== null ? String(kpi13.ytdActual) : "—"}
          />
          <div className="grid grid-cols-3 gap-2 text-center">
            <div><div className="tnum font-head text-xl font-semibold">{bumiputeraTraining.poolIdentified}</div><div className="text-[10px] text-[hsl(var(--pk-ink-faint))]">Pool identified</div></div>
            <div><div className="tnum font-head text-xl font-semibold">{bumiputeraTraining.attendedOne}</div><div className="text-[10px] text-[hsl(var(--pk-ink-faint))]">Attended 1 programme</div></div>
            <div><div className="tnum font-head text-xl font-semibold">{bumiputeraTraining.attendedTwoPlus}</div><div className="text-[10px] text-[hsl(var(--pk-ink-faint))]">Attended 2+ programmes</div></div>
          </div>
          <p className="text-[11px] text-[hsl(var(--pk-ink-faint))] mt-3">Annual target {kpi13Target} staff{bumiputeraTraining.attendedOne === 0 ? " · training not yet commenced this financial year." : ` · stage: ${bumiputeraTraining.stage}.`}</p>
        </div>
      )}
    </div>
  );
}
