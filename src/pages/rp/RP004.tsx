import { ScreenHeader } from "@/components/pk/ScreenHeader";
import { StatCard, InitiativeStatusDot, ProgressBar } from "@/components/pk/Misc";
import { StatusChip } from "@/components/pk/StatusChip";
import { InfoTip } from "@/components/pk/InfoTip";
import type { ScreenId } from "@/lib/nav";
import { useSession } from "@/lib/session";
import { useWorkflow } from "@/lib/workflow";
import { kpiById } from "@/data/kpis";
import { useDetails, industryBenchmark, priorYearTrained } from "@/lib/details";
import { periodById } from "@/data/periods";

function SectionLabel({ children }: { children: React.ReactNode }) {
  return <div className="text-[11px] uppercase tracking-wide text-[hsl(var(--pk-ink-faint))] font-semibold mb-2">{children}</div>;
}

export function RP004({ onNavigate }: { onNavigate: (id: ScreenId) => void }) {
  const { entityId, periodId } = useSession();
  const { latestValue } = useWorkflow();
  const { headcountSummaryByPeriod, bumiputeraTrainingByPeriod, resignedByPeriod } = useDetails();
  const kpi13 = latestValue("KPI13", entityId, periodId);
  const kpi13Def = kpiById("KPI13");
  const period = periodById(periodId);
  const headcountSummary = headcountSummaryByPeriod[periodId];
  const bumiputeraTraining = bumiputeraTrainingByPeriod[periodId];
  const resigned = resignedByPeriod[periodId];
  const turnoverRate = headcountSummary.totalEmployees > 0 ? (resigned / headcountSummary.totalEmployees) * 100 : 0;
  const target = kpi13Def.fyTarget ?? 0;
  const notCommenced = bumiputeraTraining.attendedOne === 0;

  return (
    <div>
      <ScreenHeader id="RP004" subtitle="Resource & People · Turnover analysis and Bumiputera Training." onNavigate={onNavigate} />

      <SectionLabel>Section A — Demographics: Turnover Rate</SectionLabel>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mb-5">
        <StatCard label="Total Employees" value={String(headcountSummary.totalEmployees)} sub="HRMS active employees" />
        <StatCard label={`Employees Resigned (${period.label.split(" ")[0]})`} value={String(resigned)} sub="Resigned during quarter" />
        <StatCard label="Turnover Rate" value={`${turnoverRate.toFixed(1)}%`} tone="good" sub="Resigned ÷ Total × 100" />
        <StatCard label="Industry Benchmark" value={`${industryBenchmark.toFixed(1)}%`} sub="Financial services" />
      </div>

      <div className="flex items-center gap-1.5 mb-2">
        <SectionLabel>Section B — KPI 13: Bumiputera Training &amp; Development</SectionLabel>
        <InfoTip title="KPI 13 formula">Staff completing at least 2 registered competency-development programmes, against the annual target of {target} staff.</InfoTip>
      </div>
      <div className="rounded-lg border border-[hsl(var(--pk-border))] bg-[hsl(var(--pk-surface))] p-4">
        <div className="flex items-center justify-between mb-3">
          <div>
            <div className="text-[11px] uppercase tracking-wide text-[hsl(var(--pk-ink-faint))]">KPI 13 · Weight 1.66%</div>
            <div className="font-head font-semibold text-[hsl(var(--pk-ink))]">Bumiputera Training &amp; Development</div>
          </div>
          <StatusChip status={kpi13.status} />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div className="rounded-md bg-[hsl(var(--pk-surface-2))] p-3">
            <div className="text-[10px] uppercase tracking-wide text-[hsl(var(--pk-ink-faint))] mb-2">Programme Status Overview</div>
            <dl className="flex flex-col gap-1.5 text-xs">
              <div className="flex justify-between"><dt className="text-[hsl(var(--pk-ink-faint))]">FY2025 actual</dt><dd className="tnum font-semibold text-[hsl(var(--pk-ink))]">{priorYearTrained} staff trained</dd></div>
              <div className="flex justify-between"><dt className="text-[hsl(var(--pk-ink-faint))]">Annual target</dt><dd className="tnum font-semibold text-[hsl(var(--pk-ink))]">{target} staff</dd></div>
              <div className="flex justify-between"><dt className="text-[hsl(var(--pk-ink-faint))]">Completed to date</dt><dd className="tnum font-semibold text-[hsl(var(--pk-ink))]">{bumiputeraTraining.attendedOne} of {target}</dd></div>
              <div className="flex justify-between"><dt className="text-[hsl(var(--pk-ink-faint))]">Stage</dt><dd className="font-semibold text-[hsl(var(--pk-warn))]">{bumiputeraTraining.stage}</dd></div>
            </dl>
          </div>
          <div className="rounded-md bg-[hsl(var(--pk-surface-2))] p-3">
            <div className="text-[10px] uppercase tracking-wide text-[hsl(var(--pk-ink-faint))] mb-2">Training Progress</div>
            <ProgressBar value={bumiputeraTraining.attendedOne} max={target} label={`${bumiputeraTraining.attendedOne} of ${target} completed (${((bumiputeraTraining.attendedOne / target) * 100).toFixed(1)}%)`} />
            <p className="text-[11px] text-[hsl(var(--pk-ink-faint))] mt-2.5 leading-snug">Participant statistics, programme objectives and training progress are displayed with programme updates until measurement commences.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 mb-4">
          <StatCard label="Pool Identified" value={String(bumiputeraTraining.poolIdentified)} />
          <StatCard label="Attended ≥1 Programme" value={String(bumiputeraTraining.attendedOne)} tone="good" />
          <StatCard label="Attended ≥2 Programmes" value={String(bumiputeraTraining.attendedTwoPlus)} tone="pending" />
        </div>

        <div className="text-[10px] uppercase tracking-wide text-[hsl(var(--pk-ink-faint))] mb-1">Progress Updates</div>
        <div className="divide-y divide-[hsl(var(--pk-border))]">
          <div className="flex items-center justify-between py-2 text-sm">
            <span className="text-[hsl(var(--pk-ink-soft))]">Competency development programme</span>
            <span className="text-[11px] text-[hsl(var(--pk-ink-faint))] mr-3">{notCommenced ? "Next milestone: Programme commencement" : `As of ${period.label}`}</span>
            <InitiativeStatusDot status={notCommenced ? "Planned" : "In Progress"} />
          </div>
          <div className="flex items-center justify-between py-2 text-sm">
            <span className="text-[hsl(var(--pk-ink-soft))]">Bumiputera training ({target} staff)</span>
            <span className="text-[11px] text-[hsl(var(--pk-ink-faint))] mr-3">{bumiputeraTraining.attendedOne} of {target} completed as of {period.label}</span>
            <InitiativeStatusDot status={notCommenced ? "Planned" : bumiputeraTraining.attendedOne >= target ? "Completed" : "In Progress"} />
          </div>
        </div>
        <p className="text-[11.5px] text-[hsl(var(--pk-ink-faint))] mt-3">
          {notCommenced
            ? "KPI remains Not Measurable until scheduled programmes commence for this financial year."
            : `KPI ${kpi13.status === "met" ? "Met" : kpi13.status === "not-met" ? "Not Met" : "tracked"} as of ${period.label}.`}
        </p>
      </div>
    </div>
  );
}
