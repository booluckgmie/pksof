import { ScreenHeader } from "@/components/pk/ScreenHeader";
import { FhTabs } from "@/components/pk/FhTabs";
import { FinancialResultsOverview } from "@/components/pk/FinancialResultsOverview";
import { useLocalPeriodId } from "@/components/pk/PeriodPicker";
import type { ScreenId } from "@/lib/nav";

export function PFH003({ onNavigate }: { onNavigate: (id: ScreenId) => void }) {
  const [periodId, setPeriodId] = useLocalPeriodId();

  return (
    <div>
      <ScreenHeader id="PFH003" subtitle="Comparative analysis of actual performance against approved budget." periodId={periodId} onNavigate={onNavigate} />
      <FhTabs current="PFH003" onNavigate={onNavigate} />
      <FinancialResultsOverview periodId={periodId} setPeriodId={setPeriodId} tableKind="budget" />
    </div>
  );
}
