import { Fragment, useState } from "react";
import { ScreenHeader } from "@/components/pk/ScreenHeader";
import { FhTabs } from "@/components/pk/FhTabs";
import { BarTrend, LineTrend, GroupedBarTrend } from "@/components/pk/Charts";
import { InfoNote } from "@/components/pk/Misc";
import { FinancialResultsTable } from "@/components/pk/FinancialResultsTable";
import { DurationFilterBar, useDurationFilter } from "@/components/pk/DurationFilter";
import { PeriodPickerCompact } from "@/components/pk/PeriodPicker";
import type { ScreenId } from "@/lib/nav";
import { useSession } from "@/lib/session";
import { useDetails } from "@/lib/details";
import { periods, periodById } from "@/data/periods";
import type { PeriodId } from "@/types";
import { cn } from "@/lib/utils";

const fmtM = (v: number | null) => (v === null ? "—" : `RM${(Math.abs(v) / 1000).toFixed(1)} million`);
const pctOf = (delta: number | null, base: number | null) => (delta === null || base === null || base === 0 ? null : (delta / Math.abs(base)) * 100);

export function PFH002({ onNavigate }: { onNavigate: (id: ScreenId) => void }) {
  const { periodId: sessionPeriodId, setPeriodId } = useSession();
  const { quarterlyTrend: fullTrend, monthlyTrendFor, financialResultsFor } = useDetails();
  const { duration, setDuration, filtered: quarterlyTrend } = useDurationFilter(fullTrend);
  const [granularity, setGranularity] = useState<"quarterly" | "monthly">("quarterly");
  const [monthQuarter, setMonthQuarter] = useState<PeriodId>(sessionPeriodId);
  const monthlyRaw = monthlyTrendFor(monthQuarter);
  const monthlyEnteredCount = monthlyRaw.filter((m) => m.pbt !== null || m.netMargin !== null).length;
  const monthlyPbt = monthlyRaw.filter((m) => m.pbt !== null).map((m) => ({ label: m.period, value: m.pbt as number }));
  const monthlyMargin = monthlyRaw.filter((m) => m.netMargin !== null).map((m) => ({ label: m.period, value: m.netMargin as number }));
  const rows = [
    { section: "INCOME METRICS", metric: "Revenue (RM Million)", values: quarterlyTrend.map((q) => q.revenue) },
    { section: "PROFIT METRICS", metric: "Profit Before Tax (RM Million)", values: quarterlyTrend.map((q) => q.pbt) },
    { metric: "Net Profit Margin (%)", values: quarterlyTrend.map((q) => q.netMargin) },
    { section: "COST METRICS", metric: "Cost-to-Income Ratio (%)", values: quarterlyTrend.map((q) => q.cir) },
  ];

  const period = periodById(sessionPeriodId);
  const results = financialResultsFor(sessionPeriodId);

  return (
    <div>
      <ScreenHeader id="PFH002" subtitle="Overview of YTD financial results — quarter-on-quarter and vs budget, with revenue/expense drill-down." onNavigate={onNavigate} />
      <FhTabs current="PFH002" onNavigate={onNavigate} />

      <div className="mb-4 flex items-center gap-2">
        <span className="text-[11px] text-[hsl(var(--pk-ink-faint))]">Reporting period</span>
        <PeriodPickerCompact periodId={sessionPeriodId} onChange={setPeriodId} />
      </div>

      {results.current && results.budget && (() => {
        const c = results.current!;
        const b = results.budget!.compare;
        const pbtDelta = c.pbt !== null && b.pbt !== null ? c.pbt - b.pbt : null;
        const pbtPct = pctOf(pbtDelta, b.pbt);
        const incomeDelta = c.totalIncome !== null && b.totalIncome !== null ? c.totalIncome - b.totalIncome : null;
        const incomePct = pctOf(incomeDelta, b.totalIncome);
        const expenseDelta = c.expenses !== null && b.expenses !== null ? c.expenses - b.expenses : null;
        const expensePct = pctOf(expenseDelta, b.expenses);
        const isRealQuarter = sessionPeriodId === "Q1FY26";
        return (
          <div className="rounded-lg border border-[hsl(var(--pk-border))] bg-[hsl(var(--pk-surface))] shadow-card p-4 mb-4">
            <div className="font-head font-bold text-[hsl(var(--pk-ink))] text-center mb-1">YTD Actual vs YTD Budget ({period.label})</div>
            {pbtDelta !== null && pbtPct !== null && (
              <p className="text-center text-[13px] text-[hsl(var(--pk-ink-soft))] mb-3">
                Overall, the Group recorded <span className="font-semibold text-[hsl(var(--pk-accent))]">{pbtDelta >= 0 ? "higher" : "lower"} PBT by {fmtM(pbtDelta)} ({Math.abs(pbtPct).toFixed(0)}%)</span> compared to the budget for the quarter.
              </p>
            )}
            <div className="grid grid-cols-1 lg:grid-cols-[1.4fr_1fr] gap-4">
              <div>
                <div className="text-[10px] text-[hsl(var(--pk-ink-faint))] text-center mb-1">RM million</div>
                <GroupedBarTrend
                  aLabel="Actual"
                  bLabel="Budget"
                  data={[
                    { label: "Total Income", a: Math.round((c.totalIncome ?? 0) / 100) / 10, b: Math.round((b.totalIncome ?? 0) / 100) / 10 },
                    { label: "Total Expenses", a: Math.round(Math.abs(c.expenses ?? 0) / 100) / 10, b: Math.round(Math.abs(b.expenses ?? 0) / 100) / 10 },
                    { label: "Profit Before Tax", a: Math.round((c.pbt ?? 0) / 100) / 10, b: Math.round((b.pbt ?? 0) / 100) / 10 },
                  ]}
                />
              </div>
              <div className="rounded-md border border-dashed border-[hsl(var(--pk-accent))] bg-[hsl(var(--pk-accent-soft))] p-3">
                <div className="text-[11px] uppercase tracking-wide text-[hsl(var(--pk-accent))] font-semibold mb-1.5">Highlights</div>
                {isRealQuarter ? (
                  <ul className="flex flex-col gap-2 text-[12px] text-[hsl(var(--pk-ink-soft))] leading-snug">
                    <li>Higher income by <span className="font-semibold">RM5.5 million (12%)</span> mainly attributable to higher income from acquired loans by RM3.9 million and fee from managing SJPP by RM2.0 million, offset by lower fee from advisory services by RM426,000.</li>
                    <li>Lower YTD expenses by <span className="font-semibold">RM1.3 million</span> mainly attributed to lower personnel cost incurred by RM768,000 — mainly lower salary and salary related expenses (headcount: 226, budget: 232); and lower administrative expenses by RM434,000 — mainly due to lower actual cost incurred for IT and Corporate Communication projects and activities.</li>
                  </ul>
                ) : (
                  <ul className="flex flex-col gap-2 text-[12px] text-[hsl(var(--pk-ink-soft))] leading-snug">
                    <li>Income was {incomeDelta !== null && incomePct !== null ? `${fmtM(incomeDelta)} (${Math.abs(incomePct).toFixed(0)}%) ${incomeDelta >= 0 ? "higher" : "lower"}` : "—"} than budget.</li>
                    <li>Expenses were {expenseDelta !== null && expensePct !== null ? `${fmtM(expenseDelta)} (${Math.abs(expensePct).toFixed(0)}%) ${expenseDelta >= 0 ? "higher" : "lower"}` : "—"} than budget.</li>
                    <li className="text-[11px] text-[hsl(var(--pk-ink-faint))] italic">Illustrative projection — driver commentary is only available for the reported quarter.</li>
                  </ul>
                )}
              </div>
            </div>
          </div>
        );
      })()}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
        {results.qoq ? (
          <FinancialResultsTable
            title="Current Quarter vs Preceding Quarter"
            currentLabel={period.label}
            compareLabel={results.qoq.compareLabel}
            current={results.current!}
            compare={results.qoq.compare}
            revenueCurrent={results.qoq.revenue}
            revenueCompare={results.qoq.revenueCompare}
            expensesCurrent={results.qoq.expenses}
            expensesCompare={results.qoq.expensesCompare}
          />
        ) : (
          <div className="rounded-lg border border-dashed border-[hsl(var(--pk-border))] bg-[hsl(var(--pk-surface))] p-6 text-center">
            <p className="text-[12.5px] text-[hsl(var(--pk-ink-faint))]">No preceding-quarter figures to compare {period.label} against yet.</p>
          </div>
        )}
        {results.budget ? (
          <FinancialResultsTable
            title="Actual vs Budget"
            currentLabel={`${period.label} Actual`}
            compareLabel={`${period.label} Budget`}
            current={results.current!}
            compare={results.budget.compare}
            revenueCurrent={results.budget.revenue}
            revenueCompare={results.budget.revenueCompare}
            expensesCurrent={results.budget.expenses}
            expensesCompare={results.budget.expensesCompare}
          />
        ) : (
          <div className="rounded-lg border border-dashed border-[hsl(var(--pk-border))] bg-[hsl(var(--pk-surface))] p-6 text-center">
            <p className="text-[12.5px] text-[hsl(var(--pk-ink-faint))]">No budget figures entered for {period.label} yet.</p>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between flex-wrap gap-2 mb-3">
        <DurationFilterBar duration={duration} onChange={setDuration} total={fullTrend.length} label="Metric trend duration" />
        <div className="flex items-center gap-1.5">
          {(["quarterly", "monthly"] as const).map((g) => (
            <button
              key={g}
              onClick={() => setGranularity(g)}
              className={cn(
                "text-[11px] px-2.5 py-1 rounded-md border transition-colors capitalize",
                granularity === g
                  ? "bg-[hsl(var(--pk-accent))] text-[hsl(var(--pk-accent-ink))] border-[hsl(var(--pk-accent))]"
                  : "border-[hsl(var(--pk-border))] text-[hsl(var(--pk-ink-soft))] hover:bg-[hsl(var(--pk-surface-2))]"
              )}
            >
              {g}
            </button>
          ))}
          {granularity === "monthly" && (
            <select
              value={monthQuarter}
              onChange={(e) => setMonthQuarter(e.target.value as PeriodId)}
              className="text-[11px] rounded-md border border-[hsl(var(--pk-border))] px-2 py-1 bg-[hsl(var(--pk-surface))] outline-none"
            >
              {periods.map((p) => <option key={p.id} value={p.id}>{p.label}</option>)}
            </select>
          )}
        </div>
      </div>

      {granularity === "monthly" && (
        monthlyEnteredCount === 0 ? (
          <div className="rounded-lg border border-dashed border-[hsl(var(--pk-border))] bg-[hsl(var(--pk-surface))] p-6 text-center mb-5">
            <p className="text-[12.5px] text-[hsl(var(--pk-ink-faint))]">No monthly figures entered yet for {periods.find((p) => p.id === monthQuarter)?.label} — add them from Data Entry's "Monthly Financial Detail" section.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
            <div className="rounded-lg border border-[hsl(var(--pk-border))] bg-[hsl(var(--pk-surface))] shadow-card p-4">
              <div className="text-xs font-bold underline text-[hsl(var(--pk-ink-soft))] mb-2">PBT by month — {periods.find((p) => p.id === monthQuarter)?.label}</div>
              <BarTrend data={monthlyPbt} unit="m" />
            </div>
            <div className="rounded-lg border border-[hsl(var(--pk-border))] bg-[hsl(var(--pk-surface))] shadow-card p-4">
              <div className="text-xs font-bold underline text-[hsl(var(--pk-ink-soft))] mb-2">Net Profit Margin by month — {periods.find((p) => p.id === monthQuarter)?.label}</div>
              <LineTrend data={monthlyMargin} unit="%" />
            </div>
          </div>
        )
      )}

      {granularity === "quarterly" && (
        <div className="rounded-lg border border-[hsl(var(--pk-border))] bg-[hsl(var(--pk-surface))] shadow-card overflow-x-auto mb-4">
          <table className="w-full text-sm min-w-[640px]">
            <thead>
              <tr className="text-[11px] uppercase tracking-wide text-[hsl(var(--pk-ink-faint))] bg-[hsl(var(--pk-surface-2))]">
                <th className="text-left font-medium px-3 py-2">Metric</th>
                {quarterlyTrend.map((q) => <th key={q.period} className="text-right font-medium px-3 py-2">{q.period}</th>)}
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <Fragment key={r.metric}>
                  {r.section && (
                    <tr><td colSpan={6} className="px-3 pt-3 pb-1 text-[10.5px] font-semibold uppercase tracking-wide text-[hsl(var(--pk-navy))]">{r.section}</td></tr>
                  )}
                  <tr className="border-t border-[hsl(var(--pk-border))]">
                    <td className="px-3 py-2 text-[hsl(var(--pk-ink))]">{r.metric}</td>
                    {r.values.map((v, i) => (
                      <td key={i} className={`px-3 py-2 text-right tnum ${i === r.values.length - 1 ? "font-semibold" : ""}`}>{v.toFixed(1)}</td>
                    ))}
                  </tr>
                </Fragment>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <InfoNote>All Overview figures are in RM'000. Click "REVENUE" or "Expenses" in either table to drill into that quarter's own breakdown by source/category. The Quarterly/Monthly toggle below switches only the supporting metric trend — KPI achievement scoring stays quarterly-only by design.</InfoNote>
    </div>
  );
}
