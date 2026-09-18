import { ScreenHeader } from "@/components/pk/ScreenHeader";
import { KpiPerformanceTable } from "@/components/pk/KpiPerformanceTable";
import { DownloadableFrame } from "@/components/pk/DownloadableFrame";
import { FinancialYearQuarterPicker, useLocalPeriodId } from "@/components/pk/PeriodPicker";
import type { ScreenId } from "@/lib/nav";
import { useSession } from "@/lib/session";
import { useWorkflow } from "@/lib/workflow";

export function CP002({ onNavigate }: { onNavigate: (id: ScreenId) => void }) {
  const { entityId } = useSession();
  const [periodId, setPeriodId] = useLocalPeriodId();
  const { latestValue } = useWorkflow();
  const getResult = (kpiId: string) => latestValue(kpiId, entityId, periodId);

  return (
    <div>
      <ScreenHeader id="CP002" subtitle="All KPI performance grouped by the six perspectives for the selected period." onNavigate={onNavigate} periodId={periodId} right={<FinancialYearQuarterPicker periodId={periodId} onChange={setPeriodId} />} />

      <DownloadableFrame filename="cp002-kpi-performance-status">
        <KpiPerformanceTable getResult={getResult} onNavigate={onNavigate} />
      </DownloadableFrame>
      <p className="text-2xs text-[hsl(var(--pk-ink-faint))] mt-3">
        Workflow: Draft → Submit → Review → Approve or Reject → Publish. Only approved (published) data is shown here — use{" "}
        <button className="underline underline-offset-2 hover:text-[hsl(var(--pk-accent))]" onClick={() => onNavigate("VERIFY_PUBLISH")}>Verify &amp; Publish</button> to action pending submissions.
      </p>
    </div>
  );
}
