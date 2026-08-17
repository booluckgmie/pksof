import { kpisByPerspective } from "@/data/kpis";
import { perspectives } from "@/data/perspectives";
import type { KpiResult } from "@/lib/workflow";

export function perspectiveRollup(perspectiveId: string, getResult: (kpiId: string) => KpiResult) {
  const list = kpisByPerspective(perspectiveId);
  const p = perspectives.find((x) => x.id === perspectiveId)!;
  let weightedSum = 0;
  let met = 0, notMet = 0, notMeasurable = 0;
  for (const k of list) {
    const r = getResult(k.id);
    weightedSum += r.weighted ?? 0;
    if (r.status === "met") met++;
    else if (r.status === "not-met") notMet++;
    else notMeasurable++;
  }
  const allBlank = notMeasurable === list.length;
  const achievementPct = allBlank ? null : p.weight > 0 ? (weightedSum / p.weight) * 100 : 0;
  return { perspective: p, kpiCount: list.length, met, notMet, notMeasurable, achievementPct, weightedSum };
}
