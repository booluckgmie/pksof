import { QoQHorizontalBars } from "@/components/pk/Charts";
import { InfoNote } from "@/components/pk/Misc";
import { FinancialResultsTable } from "@/components/pk/FinancialResultsTable";
import { PeriodPickerCompact } from "@/components/pk/PeriodPicker";
import { useDetails } from "@/lib/details";
import { periodById } from "@/data/periods";
import type { PeriodId } from "@/types";

const fmtM = (v: number | null) => (v === null ? "—" : `RM${(Math.abs(v) / 1000).toFixed(1)} million`);
const pctOf = (delta: number | null, base: number | null) => (delta === null || base === null || base === 0 ? null : (delta / Math.abs(base)) * 100);
const shortQ = (label: string) => label.replace(" FY20", "'");

/**
 * Shared body for both Financial Results tabs — the YTD highlight card and the comparison
 * table (Current Quarter vs Preceding Quarter on PFH002, Actual vs Budget on PFH003).
 * `tableKind` picks which single comparison table this instance renders — full width,
 * since each screen now shows only one.
 */
export function FinancialResultsOverview({
  periodId,
  setPeriodId,
  tableKind,
}: {
  periodId: PeriodId;
  setPeriodId: (id: PeriodId) => void;
  tableKind: "qoq" | "budget";
}) {
  const { financialResultsFor } = useDetails();
  const period = periodById(periodId);
  const results = financialResultsFor(periodId);

  return (
    <div>
      <div className="mb-4 flex items-center gap-2">
        <span className="text-2xs text-[hsl(var(--pk-ink-faint))]">Reporting period</span>
        <PeriodPickerCompact periodId={periodId} onChange={setPeriodId} />
      </div>

      {tableKind === "qoq" && results.current && results.qoq && (() => {
        const c = results.current!;
        const b = results.qoq!.compare;
        const pbtDelta = c.pbt !== null && b.pbt !== null ? c.pbt - b.pbt : null;
        const incomeDelta = c.totalIncome !== null && b.totalIncome !== null ? c.totalIncome - b.totalIncome : null;
        const incomePct = pctOf(incomeDelta, b.totalIncome);
        const expenseDelta = c.expenses !== null && b.expenses !== null ? Math.abs(c.expenses) - Math.abs(b.expenses) : null;
        const expensePct = pctOf(expenseDelta, b.expenses !== null ? Math.abs(b.expenses) : null);
        const isRealQuarter = periodId === "Q1FY26";
        return (
          <div className="rounded-lg border border-[hsl(var(--pk-border))] bg-[hsl(var(--pk-surface))] shadow-card p-4 mb-4">
            <div className="font-head font-bold text-[hsl(var(--pk-ink))] text-center mb-1">Overview of Quarterly Financial Results</div>
            <div className="text-center text-xs font-semibold text-[hsl(var(--pk-ink-soft))] mb-1">{shortQ(period.label)} vs {shortQ(results.qoq.compareLabel)} (3-month)</div>
            {pbtDelta !== null && (
              <p className="text-center text-xs text-[hsl(var(--pk-ink-soft))] mb-3">
                The Group recorded <span className="font-semibold text-[hsl(var(--pk-accent))]">{pbtDelta >= 0 ? "an increase" : "a drop"} in PBT by {fmtM(pbtDelta)}</span> compared to the preceding quarter.
              </p>
            )}
            <div className="grid grid-cols-1 lg:grid-cols-[1.4fr_1fr] gap-4">
              <QoQHorizontalBars
                currentLabel={shortQ(period.label)}
                compareLabel={shortQ(results.qoq.compareLabel)}
                categories={[
                  { label: "Total Income", current: c.totalIncome ?? 0, compare: b.totalIncome ?? 0 },
                  { label: "Total Expenses", current: Math.abs(c.expenses ?? 0), compare: Math.abs(b.expenses ?? 0) },
                  { label: "Profit Before Tax", current: c.pbt ?? 0, compare: b.pbt ?? 0 },
                ]}
              />
              <div className="rounded-md border border-dashed border-[hsl(var(--pk-accent))] bg-[hsl(var(--pk-accent-soft))] p-3">
                <div className="text-2xs uppercase tracking-wide text-[hsl(var(--pk-accent))] font-semibold mb-1.5">Highlights (current quarter against preceding quarter)</div>
                {isRealQuarter ? (
                  <ul className="flex flex-col gap-2 text-xs text-[hsl(var(--pk-ink-soft))] leading-snug">
                    <li>Lower income by <span className="font-semibold">RM9.8 million</span> mainly due to lower income from acquired loans by RM7.5 million and fee from advisory services by RM1.0 million.</li>
                    <li>
                      Lower expenses by <span className="font-semibold">RM415,000</span> attributed to the following:
                      <ul className="flex flex-col gap-1 mt-1 ml-3">
                        <li className="list-disc">lower administrative expenses by RM1.2 million due to lower computer system expenses and corporate communication expenses; and</li>
                        <li className="list-disc">lower professional fees by RM439,000;</li>
                        <li className="list-disc">however, offset by higher personnel expenses by RM1.0 million.</li>
                      </ul>
                    </li>
                  </ul>
                ) : (
                  <ul className="flex flex-col gap-2 text-xs text-[hsl(var(--pk-ink-soft))] leading-snug">
                    <li>Income was {incomeDelta !== null && incomePct !== null ? `${fmtM(incomeDelta)} (${Math.abs(incomePct).toFixed(0)}%) ${incomeDelta >= 0 ? "higher" : "lower"}` : "—"} than the preceding quarter.</li>
                    <li>Expenses were {expenseDelta !== null && expensePct !== null ? `${fmtM(expenseDelta)} (${Math.abs(expensePct).toFixed(0)}%) ${expenseDelta >= 0 ? "higher" : "lower"}` : "—"} than the preceding quarter.</li>
                    <li className="text-2xs text-[hsl(var(--pk-ink-faint))] italic">Illustrative projection — driver commentary is only available for the reported quarter.</li>
                  </ul>
                )}
              </div>
            </div>
          </div>
        );
      })()}

      {tableKind === "budget" && results.current && results.budget && (() => {
        const c = results.current!;
        const b = results.budget!.compare;
        const pbtDelta = c.pbt !== null && b.pbt !== null ? c.pbt - b.pbt : null;
        const pbtPct = pctOf(pbtDelta, b.pbt);
        const incomeDelta = c.totalIncome !== null && b.totalIncome !== null ? c.totalIncome - b.totalIncome : null;
        const incomePct = pctOf(incomeDelta, b.totalIncome);
        const expenseDelta = c.expenses !== null && b.expenses !== null ? c.expenses - b.expenses : null;
        const expensePct = pctOf(expenseDelta, b.expenses);
        const isRealQuarter = periodId === "Q1FY26";
        return (
          <div className="rounded-lg border border-[hsl(var(--pk-border))] bg-[hsl(var(--pk-surface))] shadow-card p-4 mb-4">
            <div className="font-head font-bold text-[hsl(var(--pk-ink))] text-center mb-1">YTD Actual vs YTD Budget ({period.label})</div>
            {pbtDelta !== null && pbtPct !== null && (
              <p className="text-center text-xs text-[hsl(var(--pk-ink-soft))] mb-3">
                Overall, the Group recorded <span className="font-semibold text-[hsl(var(--pk-accent))]">{pbtDelta >= 0 ? "higher" : "lower"} PBT by {fmtM(pbtDelta)} ({Math.abs(pbtPct).toFixed(0)}%)</span> compared to the budget for the quarter.
              </p>
            )}
            <div className="grid grid-cols-1 lg:grid-cols-[1.4fr_1fr] gap-4">
              <QoQHorizontalBars
                currentLabel="Actual"
                compareLabel="Budget"
                categories={[
                  { label: "Total Income", current: c.totalIncome ?? 0, compare: b.totalIncome ?? 0 },
                  { label: "Total Expenses", current: Math.abs(c.expenses ?? 0), compare: Math.abs(b.expenses ?? 0) },
                  { label: "Profit Before Tax", current: c.pbt ?? 0, compare: b.pbt ?? 0 },
                ]}
              />
              <div className="rounded-md border border-dashed border-[hsl(var(--pk-accent))] bg-[hsl(var(--pk-accent-soft))] p-3">
                <div className="text-2xs uppercase tracking-wide text-[hsl(var(--pk-accent))] font-semibold mb-1.5">Highlights</div>
                {isRealQuarter ? (
                  <ul className="flex flex-col gap-2 text-xs text-[hsl(var(--pk-ink-soft))] leading-snug">
                    <li>Higher income by <span className="font-semibold">RM5.5 million (12%)</span> mainly attributable to higher income from acquired loans by RM3.9 million and fee from managing SJPP by RM2.0 million, offset by lower fee from advisory services by RM426,000.</li>
                    <li>Lower YTD expenses by <span className="font-semibold">RM1.3 million</span> mainly attributed to lower personnel cost incurred by RM768,000 — mainly lower salary and salary related expenses (headcount: 226, budget: 232); and lower administrative expenses by RM434,000 — mainly due to lower actual cost incurred for IT and Corporate Communication projects and activities.</li>
                  </ul>
                ) : (
                  <ul className="flex flex-col gap-2 text-xs text-[hsl(var(--pk-ink-soft))] leading-snug">
                    <li>Income was {incomeDelta !== null && incomePct !== null ? `${fmtM(incomeDelta)} (${Math.abs(incomePct).toFixed(0)}%) ${incomeDelta >= 0 ? "higher" : "lower"}` : "—"} than budget.</li>
                    <li>Expenses were {expenseDelta !== null && expensePct !== null ? `${fmtM(expenseDelta)} (${Math.abs(expensePct).toFixed(0)}%) ${expenseDelta >= 0 ? "higher" : "lower"}` : "—"} than budget.</li>
                    <li className="text-2xs text-[hsl(var(--pk-ink-faint))] italic">Illustrative projection — driver commentary is only available for the reported quarter.</li>
                  </ul>
                )}
              </div>
            </div>
          </div>
        );
      })()}

      <div className="mb-4">
        {tableKind === "qoq" ? (
          results.qoq ? (
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
              <p className="text-xs text-[hsl(var(--pk-ink-faint))]">No preceding-quarter figures to compare {period.label} against yet.</p>
            </div>
          )
        ) : results.budget ? (
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
            <p className="text-xs text-[hsl(var(--pk-ink-faint))]">No budget figures entered for {period.label} yet.</p>
          </div>
        )}
      </div>

      <InfoNote>All Overview figures are in RM'000. Click "REVENUE" or "Expenses" in the table to drill into that quarter's own breakdown by source/category.</InfoNote>
    </div>
  );
}
