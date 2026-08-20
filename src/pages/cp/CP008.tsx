import { useState } from "react";
import { ScreenHeader } from "@/components/pk/ScreenHeader";
import { StatusChip } from "@/components/pk/StatusChip";
import { CategoryBar } from "@/components/pk/Charts";
import type { ScreenId } from "@/lib/nav";
import { useSession } from "@/lib/session";
import { useWorkflow } from "@/lib/workflow";
import { useDetails } from "@/lib/details";
import { kpiById } from "@/data/kpis";
import { cn } from "@/lib/utils";

const TABS = [
  { id: "composition", label: "Composition (KPI 12)" },
  { id: "procurement", label: "Procurement (KPI 11)" },
  { id: "training", label: "Training (KPI 13)" },
] as const;

export function CP008({ onNavigate }: { onNavigate: (id: ScreenId) => void }) {
  const { entityId, periodId } = useSession();
  const { latestValue } = useWorkflow();
  const { bumiputeraProcurement, bumiputeraTrainingByPeriod, headcountSummaryByPeriod } = useDetails();
  const kpi11 = latestValue("KPI11", entityId, periodId);
  const kpi12 = latestValue("KPI12", entityId, periodId);
  const kpi13 = latestValue("KPI13", entityId, periodId);
  const bumiputeraTraining = bumiputeraTrainingByPeriod[periodId];
  const headcountSummary = headcountSummaryByPeriod[periodId];
  const kpi13Target = kpiById("KPI13").fyTarget ?? 0;
  const [tab, setTab] = useState<(typeof TABS)[number]["id"]>("composition");

  const procTotal = bumiputeraProcurement.reduce((s, r) => s + r.ytdActual, 0);

  return (
    <div>
      <ScreenHeader id="CP008" subtitle="Weight 5.0% · 3 KPIs — Composition, Procurement and Training." onNavigate={onNavigate} />

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
        <div className="rounded-lg border border-[hsl(var(--pk-border))] bg-[hsl(var(--pk-surface))] shadow-card p-4 max-w-md">
          <div className="flex items-center justify-between mb-2">
            <div className="text-[11px] uppercase tracking-wide text-[hsl(var(--pk-ink-faint))]">KPI 12 · Weight 1.67%</div>
            <StatusChip status={kpi12.status} />
          </div>
          <div className="font-head font-semibold text-[hsl(var(--pk-ink))] mb-3">Bumiputera Composition</div>
          <CategoryBar
            segments={[
              { label: "Bumiputera", value: headcountSummary.bumiputera, color: "hsl(var(--pk-accent))" },
              { label: "Non-Bumiputera", value: headcountSummary.nonBumiputera, color: "hsl(var(--pk-surface-2))" },
            ]}
          />
          <div className="text-[11px] text-[hsl(var(--pk-ink-faint))] mt-2">Target {kpi12.ytdTarget}% · Actual {kpi12.ytdActual?.toFixed(1)}%</div>
        </div>
      )}

      {tab === "procurement" && (
        <div className="rounded-lg border border-[hsl(var(--pk-border))] bg-[hsl(var(--pk-surface))] shadow-card p-4 max-w-md">
          <div className="flex items-center justify-between mb-2">
            <div className="text-[11px] uppercase tracking-wide text-[hsl(var(--pk-ink-faint))]">KPI 11 · Weight 1.67%</div>
            <StatusChip status={kpi11.status} />
          </div>
          <div className="font-head font-semibold text-[hsl(var(--pk-ink))] mb-3">Bumiputera Procurement</div>
          <div className="tnum font-head text-2xl font-semibold mb-3">RM {procTotal.toFixed(2)}m</div>
          <div className="divide-y divide-[hsl(var(--pk-border))]">
            {bumiputeraProcurement.map((d) => (
              <div key={d.dept} className="flex items-center justify-between py-1.5 text-xs">
                <span className="text-[hsl(var(--pk-ink-soft))]">{d.dept}</span>
                <span className="tnum">{d.ytdActual.toFixed(2)} / {d.fyTarget.toFixed(2)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === "training" && (
        <div className="rounded-lg border border-[hsl(var(--pk-border))] bg-[hsl(var(--pk-surface))] shadow-card p-4 max-w-md">
          <div className="flex items-center justify-between mb-2">
            <div className="text-[11px] uppercase tracking-wide text-[hsl(var(--pk-ink-faint))]">KPI 13 · Weight 1.66%</div>
            <StatusChip status={kpi13.status} />
          </div>
          <div className="font-head font-semibold text-[hsl(var(--pk-ink))] mb-3">Bumiputera Training</div>
          <div className="grid grid-cols-2 gap-2 text-center">
            <div><div className="tnum font-head text-xl font-semibold">{bumiputeraTraining.poolIdentified}</div><div className="text-[10px] text-[hsl(var(--pk-ink-faint))]">Pool identified</div></div>
            <div><div className="tnum font-head text-xl font-semibold">{bumiputeraTraining.attendedOne}</div><div className="text-[10px] text-[hsl(var(--pk-ink-faint))]">Attended 1 programme</div></div>
          </div>
          <p className="text-[11px] text-[hsl(var(--pk-ink-faint))] mt-3">Annual target {kpi13Target} staff{bumiputeraTraining.attendedOne === 0 ? " · training not yet commenced this financial year." : ` · stage: ${bumiputeraTraining.stage}.`}</p>
        </div>
      )}
    </div>
  );
}
