import { useState, Fragment } from "react";
import { Lock, ChevronRight, ChevronDown } from "lucide-react";
import { ScreenHeader } from "@/components/pk/ScreenHeader";
import { StatusChip } from "@/components/pk/StatusChip";
import { InfoTip } from "@/components/pk/InfoTip";
import { KpiMetricStrip } from "@/components/pk/KpiMetricStrip";
import { FinancialYearQuarterPicker, useLocalPeriodId } from "@/components/pk/PeriodPicker";
import { cn } from "@/lib/utils";
import { anonymizedEntityLabel } from "@/lib/anonymize";
import type { ScreenId } from "@/lib/nav";
import { useSession } from "@/lib/session";
import { useWorkflow } from "@/lib/workflow";
import { useDetails } from "@/lib/details";
import { useKpiTargets } from "@/lib/kpiTargets";
import { useCurrentPeriodId } from "@/lib/orgSettings";
import { periodById, periodsUpTo } from "@/data/periods";

/** Bold, non-wrapping header cells so the header row's height never shifts with content —
 * shared by every table on this screen. */
const TH_CLASS = "text-left font-bold px-3 py-2.5 whitespace-nowrap";
const TH_RIGHT_CLASS = "text-right font-bold px-3 py-2.5 whitespace-nowrap";

/** Splits a value like "80 sessions" or "12,000 businesses" into its leading quantity and the
 * descriptive word(s) after it, so long unit text wraps onto its own line under the number
 * instead of stretching the column or wrapping mid-number. Values that don't start with a
 * number/percentage (e.g. "Rating 3.0") are left as a single line. */
function splitUnit(value: string): { qty: string; unit: string } | null {
  const m = value.match(/^([\d,.]+%?)\s+(.+)$/);
  return m ? { qty: m[1], unit: m[2] } : null;
}

function ValueCell({ value }: { value: string }) {
  if (!value) return <>—</>;
  const split = splitUnit(value);
  if (!split) return <>{value}</>;
  return (
    <span className="inline-flex flex-col items-end leading-tight">
      <span>{split.qty}</span>
      <span className="text-3xs text-[hsl(var(--pk-ink-faint))] whitespace-normal text-right">{split.unit}</span>
    </span>
  );
}

export function CP004({ onNavigate }: { onNavigate: (id: ScreenId) => void }) {
  const { entityId, isRestrictedPillar, homeEntityName } = useSession();
  const [periodId, setPeriodId] = useLocalPeriodId();
  const { latestValue } = useWorkflow();
  const { managedEntityRatingsFor, managedEntityKpiQuarterlyFor, governanceKpiFor } = useDetails();
  const managedEntityRatings = managedEntityRatingsFor(periodId);
  const { getFyTarget } = useKpiTargets();
  const kpi3 = latestValue("KPI3", entityId, periodId);
  const kpi4 = latestValue("KPI4", entityId, periodId);
  const period = periodById(periodId);
  const fy = period.fy;
  // Quarters of the selected FY that have actually been reported (never a future, un-entered
  // quarter) — the column set for the "add Q1-Q4" breakdown below.
  const quartersInFy = periodsUpTo(useCurrentPeriodId()).filter((p) => p.fy === fy);
  const periodLabel = period.label.replace(" FY", " ");
  const kpi3FyTarget = getFyTarget("KPI3", fy);
  const kpi4FyTarget = getFyTarget("KPI4", fy);
  const [expanded, setExpanded] = useState<"ratings" | "governance" | null>(null);
  const toggle = (key: "ratings" | "governance") => setExpanded((e) => (e === key ? null : key));
  const onToggleKeyDown = (key: "ratings" | "governance") => (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") { e.preventDefault(); toggle(key); }
  };
  const [selectedEntity, setSelectedEntity] = useState<string | null>(null);
  const governanceItems = governanceKpiFor(periodId);
  const governanceNotFullyDue = governanceItems.some((g) => !g.achievement);

  return (
    <div>
      <ScreenHeader id="CP004" subtitle="Mandate & Governance performance, including the managed-entity KPI summary. Weight 15.0%." onNavigate={onNavigate} periodId={periodId} right={<FinancialYearQuarterPicker periodId={periodId} onChange={setPeriodId} />} />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div
          role="button"
          tabIndex={0}
          onClick={() => toggle("ratings")}
          onKeyDown={onToggleKeyDown("ratings")}
          className={cn(
            "text-left rounded-lg border bg-[hsl(var(--pk-surface))] shadow-card p-4 cursor-pointer transition-colors",
            expanded === "ratings" ? "border-[hsl(var(--pk-accent))]" : "border-[hsl(var(--pk-border))] hover:bg-[hsl(var(--pk-surface-2))]"
          )}
        >
          <div className="flex items-center justify-between mb-2">
            <div className="text-2xs uppercase tracking-wide text-[hsl(var(--pk-ink-faint))]">KPI 3 · Weight 7.5%</div>
            <StatusChip status={kpi3.status} />
          </div>
          <div className="font-head font-bold text-[hsl(var(--pk-ink))] mb-2 inline-flex items-center gap-1.5">
            Managed Entities Rating
            <InfoTip title="Weighted Achievement">YTD Actual ÷ FY Target × Weight, capped at 7.5%. Rolled up from each Managed Entity's own quarterly rating.</InfoTip>
          </div>
          <div className="flex items-baseline gap-2 mb-2">
            <span className="tnum font-head text-2xl font-semibold">{kpi3.ytdActual !== null ? kpi3.ytdActual.toFixed(1) : "—"}</span>
            <span className="text-sm text-[hsl(var(--pk-ink-faint))]">/ target {kpi3.ytdTarget ?? "—"}</span>
          </div>
          <KpiMetricStrip
            fy={fy}
            periodLabel={periodLabel}
            fyTarget={kpi3FyTarget.toFixed(1)}
            ytdTarget={kpi3.ytdTarget !== null ? kpi3.ytdTarget.toFixed(1) : "—"}
            ytdActual={kpi3.ytdActual !== null ? kpi3.ytdActual.toFixed(1) : "—"}
            achievement={kpi3.weighted !== null ? `${(kpi3.weighted * 100).toFixed(1)}%` : "—"}
            status={kpi3.status}
          />
          <div className="flex items-center justify-end">
            <span className="flex items-center gap-1 text-2xs text-[hsl(var(--pk-accent))] shrink-0">
              {expanded === "ratings" ? "Hide details" : "View details"}
              <ChevronDown className={cn("h-3 w-3 transition-transform", expanded === "ratings" && "rotate-180")} />
            </span>
          </div>
        </div>
        <div
          role="button"
          tabIndex={0}
          onClick={() => toggle("governance")}
          onKeyDown={onToggleKeyDown("governance")}
          className={cn(
            "text-left rounded-lg border bg-[hsl(var(--pk-surface))] shadow-card p-4 cursor-pointer transition-colors",
            expanded === "governance" ? "border-[hsl(var(--pk-accent))]" : "border-[hsl(var(--pk-border))] hover:bg-[hsl(var(--pk-surface-2))]"
          )}
        >
          <div className="flex items-center justify-between mb-2">
            <div className="text-2xs uppercase tracking-wide text-[hsl(var(--pk-ink-faint))]">KPI 4 · Weight 7.5%</div>
            <StatusChip status={kpi4.status} />
          </div>
          <div className="font-head font-bold text-[hsl(var(--pk-ink))] mb-2 inline-flex items-center gap-1.5">
            Governance Index
            <InfoTip title="Not Measurable KPIs">Do not reduce achievement — progress updates run until the annual assessment. Full assessment scheduled Q4 FY2026.</InfoTip>
          </div>
          <div className="flex items-baseline gap-2 mb-2">
            <span className="tnum font-head text-2xl font-semibold">{kpi4.ytdActual !== null ? `${kpi4.ytdActual.toFixed(1)}%` : "—"}</span>
            <span className="text-sm text-[hsl(var(--pk-ink-faint))]">/ target {kpi4.ytdTarget !== null ? `${kpi4.ytdTarget.toFixed(1)}%` : "—"}</span>
          </div>
          <KpiMetricStrip
            fy={fy}
            periodLabel={periodLabel}
            fyTarget={`${kpi4FyTarget.toFixed(1)}%`}
            ytdTarget={kpi4.ytdTarget !== null ? `${kpi4.ytdTarget.toFixed(1)}%` : "—"}
            ytdActual={kpi4.ytdActual !== null ? `${kpi4.ytdActual.toFixed(1)}%` : "—"}
            achievement={kpi4.weighted !== null ? `${(kpi4.weighted * 100).toFixed(1)}%` : "—"}
            status={kpi4.status}
          />
          <div className="flex items-center justify-end">
            <span className="flex items-center gap-1 text-2xs text-[hsl(var(--pk-accent))] shrink-0">
              {expanded === "governance" ? "Hide updates" : "View updates"}
              <ChevronDown className={cn("h-3 w-3 transition-transform", expanded === "governance" && "rotate-180")} />
            </span>
          </div>
          {kpi4.ytdActual === null && (
            <p className="text-2xs text-[hsl(var(--pk-ink-faint))] mt-1.5">Full annual assessment scheduled Q4 FY2026 — components below report progress only.</p>
          )}
        </div>
      </div>

      {expanded === "ratings" && (
        <>
          <div className="flex items-center justify-between mb-2">
            <div className="text-2xs uppercase tracking-wide text-[hsl(var(--pk-ink-faint))]">Managed Entities Performance Summary</div>
            {isRestrictedPillar && (
              <span className="flex items-center gap-1.5 text-2xs text-[hsl(var(--pk-ink-faint))]">
                <Lock className="h-3 w-3" />Other entities' names and figures are hidden from your pillar
              </span>
            )}
          </div>
          <div className="rounded-lg border border-[hsl(var(--pk-border))] bg-[hsl(var(--pk-surface))] shadow-card overflow-x-auto mb-4">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-2xs uppercase tracking-wide text-white bg-[hsl(var(--pk-navy))] divide-x divide-white/15">
                  <th className={TH_CLASS}>Entity</th>
                  <th className={TH_RIGHT_CLASS}>KPI Met</th>
                  <th className={TH_RIGHT_CLASS}>Not Met</th>
                  <th className={TH_RIGHT_CLASS}>Not Measured</th>
                  <th className={TH_RIGHT_CLASS}>Achievement</th>
                  <th className={TH_CLASS}>Status</th>
                </tr>
              </thead>
              <tbody>
                {managedEntityRatings.map((r, i) => {
                  const restricted = isRestrictedPillar && r.entity !== homeEntityName;
                  const items = managedEntityKpiQuarterlyFor(r.entity, fy);
                  const clickable = !restricted && items.length > 0;
                  const isOpen = clickable && selectedEntity === r.entity;
                  let lastSection = "";
                  const totalWeighted = items.reduce((s, d) => s + (d.byQuarter[period.quarter]?.weighted ?? 0), 0);
                  const nestedColCount = 3 + quartersInFy.length + 2; // No, KPI, FY Target, Q1..Qn, Rating, Weighted Rating
                  return (
                    <Fragment key={r.entity}>
                      <tr
                        onClick={clickable ? (e) => { e.stopPropagation(); setSelectedEntity((cur) => (cur === r.entity ? null : r.entity)); } : undefined}
                        className={cn("border-t border-[hsl(var(--pk-border))] divide-x divide-[hsl(var(--pk-border))]", isOpen && "bg-[hsl(var(--pk-surface-2))]", clickable && "cursor-pointer hover:bg-[hsl(var(--pk-surface-2))]")}
                      >
                        <td className="px-3 py-2 font-medium text-[hsl(var(--pk-ink))]">
                          <span className="inline-flex items-center gap-1.5">
                            {restricted ? anonymizedEntityLabel(i) : r.entity}
                            {restricted && <Lock className="h-3 w-3 text-[hsl(var(--pk-ink-faint))]" />}
                            {clickable && <ChevronRight className={cn("h-3 w-3 text-[hsl(var(--pk-ink-faint))] transition-transform", isOpen && "rotate-90")} />}
                          </span>
                        </td>
                        <td className="px-3 py-2 text-right tnum text-[hsl(var(--pk-good))]">{restricted ? "—" : r.met}</td>
                        <td className="px-3 py-2 text-right tnum text-[hsl(var(--pk-bad))]">{restricted ? "—" : r.notMet}</td>
                        <td className="px-3 py-2 text-right tnum text-[hsl(var(--pk-pending))]">{restricted ? "—" : r.notMeasured}</td>
                        <td className="px-3 py-2 text-right tnum font-semibold">{restricted ? "—" : `${r.achievement}%`}</td>
                        <td className="px-3 py-2">{restricted ? <span className="text-[hsl(var(--pk-ink-faint))]">—</span> : <StatusChip status={r.status === "On track" ? "met" : "warn"} label={r.status} dotOnly />}</td>
                      </tr>
                      {isOpen && (
                        <tr className="border-t border-[hsl(var(--pk-border))]">
                          <td colSpan={6} className="p-0">
                            <div className="bg-[hsl(var(--pk-accent-soft))] px-3 py-3 overflow-x-auto">
                              <table className="w-full text-xs">
                                <thead>
                                  <tr className="text-2xs uppercase tracking-wide text-white bg-[hsl(var(--pk-navy))] divide-x divide-white/15">
                                    <th className={cn(TH_CLASS, "py-1.5 pl-2 pr-2 w-8")}>No</th>
                                    <th className={cn(TH_CLASS, "py-1.5 pr-2")}>KPI</th>
                                    <th className={cn(TH_RIGHT_CLASS, "py-1.5 px-2")}>FY Target</th>
                                    {quartersInFy.map((q) => (
                                      <th key={q.id} className={cn(TH_RIGHT_CLASS, "py-1.5 px-2", q.quarter === period.quarter && "bg-white/10")}>Q{q.quarter}</th>
                                    ))}
                                    <th className={cn(TH_RIGHT_CLASS, "py-1.5 px-2")}>Rating</th>
                                    <th className={cn(TH_RIGHT_CLASS, "py-1.5 pl-2 pr-2")}>Weighted Rating</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {items.map((d, di) => {
                                    const showSection = d.section !== lastSection;
                                    lastSection = d.section;
                                    const cur = d.byQuarter[period.quarter];
                                    const critical = (cur?.rating ?? 0) <= 1;
                                    return (
                                      <Fragment key={`${d.no}-${di}`}>
                                        {showSection && d.section && (
                                          <tr>
                                            <td colSpan={nestedColCount} className="pt-2 pb-1 text-2xs uppercase tracking-wide text-[hsl(var(--pk-ink-faint))] font-medium">
                                              {d.section}
                                            </td>
                                          </tr>
                                        )}
                                        <tr className="border-t border-[hsl(var(--pk-border))]/60 divide-x divide-[hsl(var(--pk-border))]/60">
                                          <td className="py-1.5 pr-2 text-[hsl(var(--pk-ink-faint))] align-top">{d.no}</td>
                                          <td className="py-1.5 pr-2 text-[hsl(var(--pk-ink-soft))] align-top">{d.label}</td>
                                          <td className="py-1.5 px-2 text-right tnum align-top"><ValueCell value={d.fyTarget} /></td>
                                          {quartersInFy.map((q) => {
                                            const qData = d.byQuarter[q.quarter];
                                            return (
                                              <td key={q.id} className={cn("py-1.5 px-2 text-right tnum align-top", q.quarter === period.quarter && "bg-[hsl(var(--pk-surface-2))] font-semibold")}>
                                                {qData ? <ValueCell value={qData.ytdActual} /> : "—"}
                                              </td>
                                            );
                                          })}
                                          <td className={cn("py-1.5 px-2 text-right tnum align-top", critical ? "text-[hsl(var(--pk-bad))] font-semibold" : "text-[hsl(var(--pk-ink))]")}>{cur?.rating ?? "—"}</td>
                                          <td className={cn("py-1.5 pl-2 text-right tnum align-top", critical && "text-[hsl(var(--pk-bad))] font-semibold")}>{cur ? cur.weighted.toFixed(2) : "—"}</td>
                                        </tr>
                                      </Fragment>
                                    );
                                  })}
                                  <tr className="border-t border-[hsl(var(--pk-border))] font-semibold">
                                    <td colSpan={nestedColCount - 1} className="py-1.5 pr-2 text-right">Total weighted rating</td>
                                    <td className="py-1.5 pl-2 text-right tnum">{totalWeighted.toFixed(2)}</td>
                                  </tr>
                                </tbody>
                              </table>
                            </div>
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}

      {expanded === "governance" && (
        <>
          <div className="text-2xs uppercase tracking-wide text-[hsl(var(--pk-ink-faint))] mb-2">Governance Index — Component Breakdown</div>
          {governanceNotFullyDue && (
            <div className="rounded-md border border-[hsl(var(--pk-border))] bg-[hsl(var(--pk-surface-2))] px-3 py-1.5 text-2xs text-[hsl(var(--pk-ink-faint))] mb-2 inline-block">
              Not fully measured this quarter — progress only for components not yet due.
            </div>
          )}
          <div className="rounded-lg border border-[hsl(var(--pk-border))] bg-[hsl(var(--pk-surface))] shadow-card overflow-x-auto mb-4">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-2xs uppercase tracking-wide text-white bg-[hsl(var(--pk-navy))] divide-x divide-white/15">
                  <th className={cn(TH_CLASS, "w-8")}>No</th>
                  <th className={TH_CLASS}>KPI</th>
                  <th className={TH_RIGHT_CLASS}>FY Target</th>
                  <th className={TH_RIGHT_CLASS}>YTD Actual</th>
                  <th className={TH_RIGHT_CLASS}>Achievement</th>
                  <th className={TH_RIGHT_CLASS}>Weighted Achievement</th>
                </tr>
              </thead>
              <tbody>
                {(() => {
                  const weightPerItem = governanceItems.length > 0 ? 100 / governanceItems.length : 0;
                  return governanceItems.map((g) => {
                    const notMet = g.weighted < weightPerItem;
                    return (
                      <tr key={g.no} className={cn("border-t border-[hsl(var(--pk-border))] divide-x divide-[hsl(var(--pk-border))]", notMet && "bg-[hsl(var(--pk-bad-soft))]")}>
                        <td className="px-3 py-2 text-[hsl(var(--pk-ink-faint))]">{g.no}</td>
                        <td className="px-3 py-2 text-[hsl(var(--pk-ink-soft))]">{g.label}</td>
                        <td className="px-3 py-2 text-right tnum"><ValueCell value={g.fyTarget} /></td>
                        <td className="px-3 py-2 text-right tnum"><ValueCell value={g.ytdActual} /></td>
                        <td className="px-3 py-2 text-right tnum">{g.achievement ? `${g.achievement}%` : "—"}</td>
                        <td className={cn("px-3 py-2 text-right tnum font-semibold", notMet && "text-[hsl(var(--pk-bad))]")}>{g.weighted.toFixed(1)}%</td>
                      </tr>
                    );
                  });
                })()}
                <tr className="border-t border-[hsl(var(--pk-border))] bg-[hsl(var(--pk-surface-2))] font-semibold divide-x divide-[hsl(var(--pk-border))]">
                  <td colSpan={5} className="px-3 py-2 text-right">Total weighted achievement</td>
                  <td className="px-3 py-2 text-right tnum">{governanceItems.reduce((s, g) => s + g.weighted, 0).toFixed(1)}%</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p className="text-2xs text-[hsl(var(--pk-ink-faint))] mt-2 flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-sm shrink-0 bg-[hsl(var(--pk-bad-soft))] border border-[hsl(var(--pk-bad))]" />
            Highlighted rows have a Weighted Achievement below the component's full weight — not yet met.
          </p>
        </>
      )}
    </div>
  );
}
