import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { toast } from "sonner";
import { kpiById } from "@/data/kpis";
import { fetchKpiFyTargets, upsertKpiFyTarget, type KpiFyTargetRow } from "@/lib/api/kpiTargets";

interface KpiTargetsContextValue {
  loading: boolean;
  /** Live override if a System Administrator has set one for this KPI/FY, else the static
   * kpis.ts fyTarget. Never null for a real KPI id — kpis.ts always has a base value. */
  getFyTarget: (kpiId: string, fy: string) => number;
  /** The override for a KPI/FY if one exists — undefined means "using the static default". */
  getOverride: (kpiId: string, fy: string) => number | undefined;
  setFyTarget: (kpiId: string, fy: string, fyTarget: number, updatedBy: string) => Promise<void>;
}

const KpiTargetsContext = createContext<KpiTargetsContextValue | null>(null);

/** Loads kpi_fy_targets overrides on mount — see supabase/migrations/0007_kpi_fy_targets.sql
 * and the Settings screen's "KPI Targets" section. */
export function KpiTargetsProvider({ children }: { children: ReactNode }) {
  const [rows, setRows] = useState<KpiFyTargetRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    fetchKpiFyTargets()
      .then((r) => { if (!cancelled) setRows(r); })
      .catch((err) => console.error("Failed to load KPI FY targets from Supabase", err))
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  const getOverride = (kpiId: string, fy: string) => rows.find((r) => r.kpiId === kpiId && r.fy === fy)?.fyTarget;

  const getFyTarget = (kpiId: string, fy: string) => getOverride(kpiId, fy) ?? kpiById(kpiId).fyTarget ?? 0;

  const setFyTarget = async (kpiId: string, fy: string, fyTarget: number, updatedBy: string) => {
    const previous = rows;
    setRows((prev) => {
      const next = prev.filter((r) => !(r.kpiId === kpiId && r.fy === fy));
      next.push({ kpiId, fy, fyTarget });
      return next;
    });
    try {
      await upsertKpiFyTarget({ kpiId, fy, fyTarget, updatedBy });
    } catch (err) {
      setRows(previous);
      toast.error("Couldn't save this FY target — check your connection and try again.");
      throw err;
    }
  };

  return (
    <KpiTargetsContext.Provider value={{ loading, getFyTarget, getOverride, setFyTarget }}>
      {children}
    </KpiTargetsContext.Provider>
  );
}

export function useKpiTargets() {
  const ctx = useContext(KpiTargetsContext);
  if (!ctx) throw new Error("useKpiTargets must be used within KpiTargetsProvider");
  return ctx;
}
