import { ScreenHeader } from "@/components/pk/ScreenHeader";
import { StatusChip } from "@/components/pk/StatusChip";
import { InitiativeStatusDot, StatusLegend } from "@/components/pk/Misc";
import type { ScreenId } from "@/lib/nav";
import { useSession } from "@/lib/session";
import { useWorkflow } from "@/lib/workflow";
import { processInitiatives, techInitiatives } from "@/data/initiatives";

function InitiativeTable({ title, weight, rows }: { title: string; weight: string; rows: typeof processInitiatives }) {
  return (
    <div className="rounded-lg border border-[hsl(var(--pk-border))] bg-[hsl(var(--pk-surface))] p-4">
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
  const kpi7 = latestValue("KPI7", entityId, periodId);
  const kpi8 = latestValue("KPI8", entityId, periodId);

  return (
    <div>
      <ScreenHeader id="CP006" subtitle="Internal Business Process performance with strategic initiative tracking. Weight 20.0% · 2 KPIs." onNavigate={onNavigate} />
      <div className="flex items-center gap-4 mb-4">
        <span className="text-sm text-[hsl(var(--pk-ink-soft))]">KPI 7 Process Improvements <StatusChip status={kpi7.status} className="ml-1" /></span>
        <span className="text-sm text-[hsl(var(--pk-ink-soft))]">KPI 8 New Technology <StatusChip status={kpi8.status} className="ml-1" /></span>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <InitiativeTable title="Process Improvement Initiatives" weight="Target: 3 initiatives · Q3 onward" rows={processInitiatives} />
        <InitiativeTable title="Technology & Digital Transformation" weight="Target: 6 initiatives · Q2 onward" rows={techInitiatives} />
      </div>
      <div className="mt-4"><StatusLegend /></div>
    </div>
  );
}
