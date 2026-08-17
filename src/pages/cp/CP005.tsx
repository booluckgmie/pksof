import { ScreenHeader } from "@/components/pk/ScreenHeader";
import { StatusChip } from "@/components/pk/StatusChip";
import type { ScreenId } from "@/lib/nav";
import { useSession } from "@/lib/session";
import { useWorkflow } from "@/lib/workflow";
import { useDetails } from "@/lib/details";

export function CP005({ onNavigate }: { onNavigate: (id: ScreenId) => void }) {
  const { entityId, periodId } = useSession();
  const { latestValue } = useWorkflow();
  const { timeCharterCompliance } = useDetails();
  const kpi5 = latestValue("KPI5", entityId, periodId);
  const kpi6 = latestValue("KPI6", entityId, periodId);

  return (
    <div>
      <ScreenHeader id="CP005" subtitle="Customer Perspective performance for Management and Board reporting. Weight 15.0% · 2 KPIs." onNavigate={onNavigate} />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="rounded-lg border border-[hsl(var(--pk-border))] bg-[hsl(var(--pk-surface))] p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="text-[11px] uppercase tracking-wide text-[hsl(var(--pk-ink-faint))]">KPI 5 · Weight 7.5% · bi-annual</div>
            <StatusChip status={kpi5.status} />
          </div>
          <div className="font-head font-semibold text-[hsl(var(--pk-ink))] mb-2">External Client Satisfaction</div>
          <div className="tnum font-head text-2xl font-semibold text-[hsl(var(--pk-ink-faint))]">— <span className="text-sm font-sans font-normal">/ target 4.7</span></div>
          <p className="text-xs text-[hsl(var(--pk-ink-faint))] mt-2">No survey conducted this quarter → Not Measurable. Next round scheduled Q2 FY2026.</p>
        </div>

        <div className="rounded-lg border border-[hsl(var(--pk-border))] bg-[hsl(var(--pk-surface))] p-4">
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
