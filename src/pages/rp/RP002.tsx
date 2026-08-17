import { ScreenHeader } from "@/components/pk/ScreenHeader";
import { StatCard, InitiativeStatusDot } from "@/components/pk/Misc";
import { StatusChip } from "@/components/pk/StatusChip";
import { InfoTip } from "@/components/pk/InfoTip";
import type { ScreenId } from "@/lib/nav";
import { useSession } from "@/lib/session";
import { useWorkflow } from "@/lib/workflow";
import { useDetails, peopleDevProgrammes } from "@/lib/details";
import { periodById } from "@/data/periods";

function SectionLabel({ children }: { children: React.ReactNode }) {
  return <div className="text-[11px] uppercase tracking-wide text-[hsl(var(--pk-ink-faint))] font-semibold mb-2">{children}</div>;
}

export function RP002({ onNavigate }: { onNavigate: (id: ScreenId) => void }) {
  const { entityId, periodId } = useSession();
  const { latestValue } = useWorkflow();
  const { headcountSummaryByPeriod, departmentHeadcountFor } = useDetails();
  const kpi10 = latestValue("KPI10", entityId, periodId);
  const headcountSummary = headcountSummaryByPeriod[periodId];
  const departmentHeadcount = departmentHeadcountFor(periodId);
  const vacant = headcountSummary.approvedHeadcount - headcountSummary.filledPosition;
  const period = periodById(periodId);

  return (
    <div>
      <ScreenHeader id="RP002" subtitle="Resource & People · Approved establishment and People Development Programme." onNavigate={onNavigate} />

      <div className="flex items-center gap-1.5 mb-2">
        <SectionLabel>Section A — Demographics: Approved Headcount</SectionLabel>
        <InfoTip title="Vacancy Movement">
          Approved establishment is sourced from the Organisation Structure; filled positions come from HRMS active employees. Vacancy = Approved Headcount − Filled Position.
        </InfoTip>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 mb-5">
        <StatCard label="Approved Headcount" value={String(headcountSummary.approvedHeadcount)} sub="Approved establishment" />
        <StatCard label="Filled Position" value={String(headcountSummary.filledPosition)} tone="good" sub="Active employees" />
        <StatCard label="Vacant Position" value={String(vacant)} tone="pending" sub="Approved − filled" />
      </div>

      <div className="rounded-lg border border-[hsl(var(--pk-border))] bg-[hsl(var(--pk-surface))] p-4 mb-5">
        <div className="text-xs font-medium text-[hsl(var(--pk-ink-soft))] mb-3">Approved vs filled by department</div>
        <div className="flex flex-col gap-2.5">
          {departmentHeadcount.map((d) => (
            <div key={d.dept} className="flex items-center gap-3">
              <span className="w-40 text-xs text-[hsl(var(--pk-ink-soft))] shrink-0">{d.dept}</span>
              <div className="flex-1 h-3 rounded-full bg-[hsl(var(--pk-surface-2))] overflow-hidden relative">
                <div className="h-full bg-[hsl(var(--pk-accent))] rounded-full" style={{ width: `${d.approved > 0 ? (d.filled / d.approved) * 100 : 0}%` }} />
              </div>
              <span className="tnum text-xs text-[hsl(var(--pk-ink-faint))] w-16 text-right shrink-0">{d.filled} / {d.approved}</span>
            </div>
          ))}
        </div>
      </div>

      <SectionLabel>Section B — KPI 10: People Development Programme</SectionLabel>
      <div className="rounded-lg border border-[hsl(var(--pk-border))] bg-[hsl(var(--pk-surface))] p-4">
        <div className="flex items-center justify-between mb-1">
          <div>
            <div className="text-[11px] uppercase tracking-wide text-[hsl(var(--pk-ink-faint))]">KPI 10 · Weight 10.0%</div>
            <div className="font-head font-semibold text-[hsl(var(--pk-ink))]">People Development Programme</div>
          </div>
          <StatusChip status={kpi10.status} />
        </div>
        <p className="text-xs text-[hsl(var(--pk-ink-faint))] mb-3">
          {kpi10.ytdActual !== null
            ? `${period.label} completion ${kpi10.ytdActual.toFixed(1)}% against an annual target of ${kpi10.ytdTarget?.toFixed(1) ?? "—"}%.`
            : `Not measured in ${period.label} — progress reporting only. Annual target 100.0%.`} Four programme streams under monitoring.
        </p>
        <div className="divide-y divide-[hsl(var(--pk-border))]">
          {peopleDevProgrammes.map((p) => (
            <div key={p.programme} className="py-2.5">
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm font-medium text-[hsl(var(--pk-ink))]">{p.programme}</span>
                <InitiativeStatusDot status={p.status} />
              </div>
              <div className="flex items-start justify-between gap-3 mt-0.5">
                <p className="text-[11.5px] text-[hsl(var(--pk-ink-faint))] leading-snug">{p.detail}</p>
                <span className="text-[11px] text-[hsl(var(--pk-ink-faint))] shrink-0 whitespace-nowrap">{p.start} → {p.end}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
