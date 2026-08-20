import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { toast } from "sonner";
import { FISCAL_YEAR_END_MONTH } from "@/data/periods";
import { fetchFiscalYearEndMonth, updateFiscalYearEndMonth } from "@/lib/api/orgSettings";

interface OrgSettingsContextValue {
  fiscalYearEndMonth: number;
  loading: boolean;
  setFiscalYearEndMonth: (month: number, updatedBy: string) => Promise<void>;
}

const OrgSettingsContext = createContext<OrgSettingsContextValue | null>(null);

/**
 * Loads the admin-editable org_settings row on mount (falling back to the static
 * FISCAL_YEAR_END_MONTH constant if Supabase isn't reachable) and exposes it app-wide.
 * See supabase/migrations/0005_org_settings.sql and the Settings screen (SETTINGS).
 */
export function OrgSettingsProvider({ children }: { children: ReactNode }) {
  const [fiscalYearEndMonth, setMonth] = useState(FISCAL_YEAR_END_MONTH);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    fetchFiscalYearEndMonth()
      .then((month) => { if (!cancelled) setMonth(month); })
      .catch((err) => console.error("Failed to load org settings from Supabase", err))
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  const setFiscalYearEndMonth = async (month: number, updatedBy: string) => {
    const previous = fiscalYearEndMonth;
    setMonth(month);
    try {
      await updateFiscalYearEndMonth(month, updatedBy);
    } catch (err) {
      setMonth(previous);
      toast.error("Couldn't save the fiscal year-end setting — check your connection and try again.");
      throw err;
    }
  };

  return (
    <OrgSettingsContext.Provider value={{ fiscalYearEndMonth, loading, setFiscalYearEndMonth }}>
      {children}
    </OrgSettingsContext.Provider>
  );
}

export function useOrgSettings() {
  const ctx = useContext(OrgSettingsContext);
  if (!ctx) throw new Error("useOrgSettings must be used within OrgSettingsProvider");
  return ctx;
}
