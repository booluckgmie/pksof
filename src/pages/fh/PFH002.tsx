import { ScreenHeader } from "@/components/pk/ScreenHeader";
import { FhTabs } from "@/components/pk/FhTabs";
import { FinancialResultsOverview } from "@/components/pk/FinancialResultsOverview";
import { useLocalPeriodId } from "@/components/pk/PeriodPicker";
import type { ScreenId } from "@/lib/nav";

export function PFH002({ onNavigate }: { onNavigate: (id: ScreenId) => void }) {
  const [periodId, setPeriodId] = useLocalPeriodId();

  return (
    <div>
      <ScreenHeader id="PFH002" subtitle="Quarter-on-quarter comparison of YTD financial results." periodId={periodId} onNavigate={onNavigate} />
      <FhTabs current="PFH002" onNavigate={onNavigate} />
      <FinancialResultsOverview periodId={periodId} setPeriodId={setPeriodId} tableKind="qoq" />
    </div>
  );
}
