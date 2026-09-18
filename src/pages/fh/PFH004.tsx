import { useState, Fragment } from "react";
import { ChevronRight } from "lucide-react";
import { ScreenHeader } from "@/components/pk/ScreenHeader";
import { FhTabs } from "@/components/pk/FhTabs";
import { InfoNote } from "@/components/pk/Misc";
import { PeriodPickerCompact, useLocalPeriodId } from "@/components/pk/PeriodPicker";
import { useDetails } from "@/lib/details";
import { periodEndDateLabel, periodEndDateWords } from "@/data/periods";
import { cn } from "@/lib/utils";
import type { ScreenId } from "@/lib/nav";

/** Accounting style — negative in parens, zero as a dash, thousands-separated, no decimals
 * (everything here is RM'000, same convention as FinancialResultsTable). */
function fmt(v: number | null): string {
  if (v === null) return "—";
  if (v === 0) return "-";
  const s = Math.abs(v).toLocaleString("en-MY", { maximumFractionDigits: 0 });
  return v < 0 ? `(${s})` : s;
}
function fmtPct(v: number | null): string {
  if (v === null) return "—";
  if (Math.abs(v) > 100) return v < 0 ? "(> 100)" : "> 100";
  const s = Math.abs(Math.round(v)).toString();
  return v < 0 ? `(${s})` : v === 0 ? "-" : s;
}
function fmtM(v: number | null): string {
  return v === null ? "—" : `RM${(Math.abs(v) / 1000).toFixed(1)} million`;
}
function variance(current: number | null, compare: number | null): { abs: number | null; pct: number | null } {
  if (current === null || compare === null) return { abs: null, pct: null };
  const abs = current - compare;
  const pct = compare !== 0 ? (abs / Math.abs(compare)) * 100 : null;
  return { abs, pct };
}

const TH = "text-2xs uppercase tracking-wide text-white bg-[hsl(var(--pk-navy))] text-right font-medium px-2 py-2.5 leading-tight";
const TD = "text-right px-2 py-2 tnum";

export function PFH004({ onNavigate }: { onNavigate: (id: ScreenId) => void }) {
  const [periodId, setPeriodId] = useLocalPeriodId();
  const { financialPositionFor, financialPositionBreakdownFor, agingOfReceivablesFor, otherInvestmentsDealsFor, cashEffectiveRateFor } = useDetails();
  const fp = financialPositionFor(periodId);
  const [openMain, setOpenMain] = useState<string | null>(null);
  const [openAging, setOpenAging] = useState(false);

  const toggleMain = (key: string) => {
    setOpenAging(false);
    setOpenMain((prev) => (prev === key ? null : key));
  };

  const isRealQuarter = periodId === "Q1FY26";
  const priorId = fp.priorId;

  return (
    <div>
      <ScreenHeader
        id="PFH004"
        subtitle="Statement of financial position — assets, equity and liabilities as at the reporting date."
        periodId={periodId}
        onNavigate={onNavigate}
        right={
          <div className="flex items-center gap-2">
            <span className="text-2xs text-[hsl(var(--pk-ink-faint))]">Reporting period</span>
            <PeriodPickerCompact periodId={periodId} onChange={setPeriodId} />
          </div>
        }
      />
      <FhTabs current="PFH004" onNavigate={onNavigate} />

      {!fp.hasData || !priorId ? (
        <div className="rounded-lg border border-dashed border-[hsl(var(--pk-border))] bg-[hsl(var(--pk-surface))] p-6 text-center">
          <p className="text-xs text-[hsl(var(--pk-ink-faint))]">No preceding-quarter figures to compare {fp.currentLabel} against yet.</p>
        </div>
      ) : (
        <>
          <div className="rounded-lg border border-[hsl(var(--pk-border))] bg-[hsl(var(--pk-surface))] shadow-card p-4 mb-4">
            <div className="text-center text-xs font-semibold text-[hsl(var(--pk-ink-soft))] mb-1">
              {periodEndDateWords(periodId)} vs {periodEndDateWords(priorId)}
            </div>
            <p className="text-center text-xs text-[hsl(var(--pk-ink-soft))] mb-3">
              The Group remains financially strong, with <span className="font-semibold text-[hsl(var(--pk-accent))]">shareholders' funds of {fmtM(fp.totalEquity.current)}</span> as of {periodEndDateWords(periodId)}.
            </p>
            <div className="grid grid-cols-1 lg:grid-cols-[1.4fr_1fr] gap-4">
              <div className="overflow-x-auto">
                <table className="w-full text-sm min-w-[480px]">
                  <thead>
                    <tr>
                      <th className="text-left font-medium px-2 py-2.5 text-2xs uppercase tracking-wide text-white bg-[hsl(var(--pk-navy))]">RM'000</th>
                      <th className={TH}>{periodEndDateLabel(periodId)}</th>
                      <th className={TH}>{periodEndDateLabel(priorId)}</th>
                      <th className={TH}>Variance<br />RM'000</th>
                      <th className={TH}>%</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { label: "Cash and other investments", current: fp.cashAndInvestments.current, prior: fp.cashAndInvestments.prior, bold: false },
                      { label: "Other assets", current: fp.otherAssets.current, prior: fp.otherAssets.prior, bold: false },
                      { label: "Total Assets", current: fp.totalAssets.current, prior: fp.totalAssets.prior, bold: true },
                      { label: "Total Liabilities", current: fp.totalLiabilities.current, prior: fp.totalLiabilities.prior, bold: true },
                      { label: "Shareholders' Fund", current: fp.totalEquity.current, prior: fp.totalEquity.prior, bold: true },
                    ].map((r) => {
                      const v = variance(r.current, r.prior);
                      return (
                        <tr key={r.label} className={cn("border-t border-[hsl(var(--pk-border))]", r.bold && "bg-[hsl(var(--pk-surface-2))]")}>
                          <td className={cn("px-2 py-2", r.bold ? "font-bold text-[hsl(var(--pk-ink))]" : "text-[hsl(var(--pk-ink-soft))]")}>{r.label}</td>
                          <td className={cn(TD, r.bold && "font-bold")}>{fmt(r.current)}</td>
                          <td className={cn(TD, r.bold && "font-bold")}>{fmt(r.prior)}</td>
                          <td className={cn(TD, "italic")}>{fmt(v.abs)}</td>
                          <td className={cn(TD, "italic")}>{fmtPct(v.pct)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <div className="rounded-md border border-dashed border-[hsl(var(--pk-accent))] bg-[hsl(var(--pk-accent-soft))] p-3">
                <div className="text-2xs uppercase tracking-wide text-[hsl(var(--pk-accent))] font-semibold mb-1.5">Highlights</div>
                {isRealQuarter ? (
                  <ul className="flex flex-col gap-2 text-xs text-[hsl(var(--pk-ink-soft))] leading-snug">
                    <li className="list-disc ml-3">Higher other investment and cash and cash equivalents by <span className="font-semibold">RM16.3 million</span>.</li>
                    <li className="list-disc ml-3">Increase in other assets by <span className="font-semibold">RM8.3 million</span> mainly attributed to the increase in placement profit receivable and reimbursable personnel cost incurred on behalf of MoF by RM6.1 million and RM1.3 million respectively.</li>
                    <li className="list-disc ml-3">Decrease in liabilities by <span className="font-semibold">RM2.6 million</span> mainly attributed to lower provision for tax by RM2.3 million being lower monthly instalment compared to {priorId ? periodEndDateWords(priorId).split(" ").slice(1).join(" ") : ""}.</li>
                  </ul>
                ) : (
                  <ul className="flex flex-col gap-2 text-xs text-[hsl(var(--pk-ink-soft))] leading-snug">
                    {(() => {
                      const ci = variance(fp.cashAndInvestments.current, fp.cashAndInvestments.prior);
                      const oa = variance(fp.otherAssets.current, fp.otherAssets.prior);
                      const tl = variance(fp.totalLiabilities.current, fp.totalLiabilities.prior);
                      return (
                        <>
                          <li className="list-disc ml-3">Cash and other investments {ci.abs !== null && ci.abs >= 0 ? "higher" : "lower"} by {fmtM(ci.abs)} against the preceding quarter.</li>
                          <li className="list-disc ml-3">Other assets {oa.abs !== null && oa.abs >= 0 ? "higher" : "lower"} by {fmtM(oa.abs)} against the preceding quarter.</li>
                          <li className="list-disc ml-3">Total liabilities {tl.abs !== null && tl.abs >= 0 ? "higher" : "lower"} by {fmtM(tl.abs)} against the preceding quarter.</li>
                        </>
                      );
                    })()}
                    <li className="text-2xs text-[hsl(var(--pk-ink-faint))] italic">Illustrative projection — driver commentary is only available for the reported quarter.</li>
                  </ul>
                )}
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-[hsl(var(--pk-border))] bg-[hsl(var(--pk-surface))] shadow-card overflow-hidden mb-4">
            <div className="px-4 pt-3.5 pb-1 font-head font-bold text-[hsl(var(--pk-ink))]">Financial Position</div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm table-fixed min-w-[640px]">
                <colgroup>
                  <col />
                  <col className="w-[16%]" />
                  <col className="w-[16%]" />
                  <col className="w-[18%]" />
                  <col className="w-[10%]" />
                </colgroup>
                <thead>
                  <tr>
                    <th className="text-left font-medium px-2 py-2.5 text-2xs uppercase tracking-wide text-white bg-[hsl(var(--pk-navy))]">RM'000</th>
                    <th className={TH}>{periodEndDateLabel(periodId)}</th>
                    <th className={TH}>{periodEndDateLabel(priorId)}</th>
                    <th className={TH}>Variance<br />RM'000</th>
                    <th className={TH}>%</th>
                  </tr>
                </thead>
                <tbody>
                  {fp.rows.map((r) => {
                    const v = variance(r.current, r.prior);
                    const isOpen = openMain === r.key;
                    return (
                      <Fragment key={r.key}>
                        <tr
                          onClick={r.drillable ? () => toggleMain(r.key) : undefined}
                          className={cn(
                            "border-t border-[hsl(var(--pk-border))]",
                            r.isTotal && "bg-[hsl(var(--pk-surface-2))]",
                            r.drillable && "cursor-pointer hover:bg-[hsl(var(--pk-surface-2))]"
                          )}
                        >
                          <td className={cn("px-2 py-2", r.isTotal ? "font-bold text-[hsl(var(--pk-ink))]" : "text-[hsl(var(--pk-ink-soft))]")}>
                            <span className="inline-flex items-center gap-1.5">
                              {r.label}
                              {r.drillable && <ChevronRight className={cn("h-3.5 w-3.5 text-[hsl(var(--pk-ink-faint))] transition-transform", isOpen && "rotate-90")} />}
                            </span>
                          </td>
                          <td className={cn(TD, r.isTotal && "font-bold")}>{fmt(r.current)}</td>
                          <td className={cn(TD, r.isTotal && "font-bold")}>{fmt(r.prior)}</td>
                          <td className={cn(TD, "italic")}>{fmt(v.abs)}</td>
                          <td className={cn(TD, "italic")}>{fmtPct(v.pct)}</td>
                        </tr>
                        {isOpen && r.key === "other_investments" && (() => {
                          const deals = otherInvestmentsDealsFor(periodId);
                          if (!deals) {
                            return (
                              <tr className="border-t border-[hsl(var(--pk-border))] bg-[hsl(var(--pk-accent-soft))]">
                                <td colSpan={5} className="px-2 py-2 pl-9 text-xs text-[hsl(var(--pk-ink-faint))] italic">No detailed deal schedule captured for {fp.currentLabel}.</td>
                              </tr>
                            );
                          }
                          return (
                            <tr className="border-t border-[hsl(var(--pk-border))] bg-[hsl(var(--pk-accent-soft))]">
                              <td colSpan={5} className="p-0">
                                <div className="overflow-x-auto p-2">
                                  <table className="w-full text-xs min-w-[640px]">
                                    <thead>
                                      <tr className="text-3xs uppercase tracking-wide text-white bg-[hsl(var(--pk-navy))]">
                                        <th className="text-left font-medium px-2 py-1">Deal Date</th>
                                        <th className="text-left font-medium px-2 py-1">Maturity Date</th>
                                        <th className="text-left font-medium px-2 py-1">Bank</th>
                                        <th className="text-left font-medium px-2 py-1">Rating</th>
                                        <th className="text-left font-medium px-2 py-1">Instrument</th>
                                        <th className="text-right font-medium px-2 py-1">Tenure (days)</th>
                                        <th className="text-right font-medium px-2 py-1">Interest</th>
                                        <th className="text-right font-medium px-2 py-1">Principal</th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {deals.deals.map((d, i) => (
                                        <tr key={i} className="border-t border-[hsl(var(--pk-border))]">
                                          <td className="px-2 py-1">{d.dealDate}</td>
                                          <td className="px-2 py-1">{d.maturityDate}</td>
                                          <td className="px-2 py-1">{d.bank}</td>
                                          <td className="px-2 py-1">{d.rating}</td>
                                          <td className="px-2 py-1">{d.instrument}</td>
                                          <td className="text-right px-2 py-1 tnum">{d.tenureDays}</td>
                                          <td className="text-right px-2 py-1 tnum">{d.interestPct.toFixed(2)}%</td>
                                          <td className="text-right px-2 py-1 tnum">{fmt(d.principal)}</td>
                                        </tr>
                                      ))}
                                      <tr className="border-t border-[hsl(var(--pk-border))] font-semibold">
                                        <td className="px-2 py-1" colSpan={7}>Total</td>
                                        <td className="text-right px-2 py-1 tnum">{fmt(deals.total)}</td>
                                      </tr>
                                    </tbody>
                                  </table>
                                  {deals.noteRate && <p className="text-3xs text-[hsl(var(--pk-ink-faint))] mt-2 px-2">{deals.noteRate}</p>}
                                </div>
                              </td>
                            </tr>
                          );
                        })()}
                        {isOpen && r.key !== "other_investments" && (() => {
                          const bd = financialPositionBreakdownFor(r.key as "property_equipment" | "rou_assets" | "receivables_deposits_prepayments" | "cash_equivalents" | "other_payables", periodId);
                          const rateHere = r.key === "cash_equivalents" ? cashEffectiveRateFor(periodId) : null;
                          const ratePrior = r.key === "cash_equivalents" && priorId ? cashEffectiveRateFor(priorId) : null;
                          return (
                            <>
                              {bd.rows.map((it) => {
                                const iv = variance(it.current, it.prior);
                                const isTradeReceivables = r.key === "receivables_deposits_prepayments" && it.key === "trade_receivables";
                                const agingAvailable = isTradeReceivables && !!agingOfReceivablesFor(periodId);
                                return (
                                  <Fragment key={it.key}>
                                    <tr
                                      onClick={agingAvailable ? () => setOpenAging((v) => !v) : undefined}
                                      className={cn("border-t border-[hsl(var(--pk-border))] bg-[hsl(var(--pk-accent-soft))]", agingAvailable && "cursor-pointer")}
                                    >
                                      <td className="px-2 py-1.5 pl-9 text-xs text-[hsl(var(--pk-ink-soft))]">
                                        <span className="inline-flex items-center gap-1.5">
                                          {it.label}
                                          {agingAvailable && <ChevronRight className={cn("h-3 w-3 text-[hsl(var(--pk-ink-faint))] transition-transform", openAging && "rotate-90")} />}
                                        </span>
                                      </td>
                                      <td className="text-right px-2 py-1.5 tnum text-xs">{fmt(it.current)}</td>
                                      <td className="text-right px-2 py-1.5 tnum text-xs">{fmt(it.prior)}</td>
                                      <td className="text-right px-2 py-1.5 tnum italic text-xs">{fmt(iv.abs)}</td>
                                      <td className="text-right px-2 py-1.5 tnum italic text-xs">{fmtPct(iv.pct)}</td>
                                    </tr>
                                    {isTradeReceivables && openAging && (() => {
                                      const aging = agingOfReceivablesFor(periodId);
                                      if (!aging) return null;
                                      return (
                                        <tr className="border-t border-[hsl(var(--pk-border))] bg-[hsl(var(--pk-surface-2))]">
                                          <td colSpan={5} className="p-0">
                                            <div className="p-2 pl-9">
                                              <div className="text-3xs uppercase tracking-wide text-[hsl(var(--pk-ink-faint))] font-semibold mb-1">Aging of Receivables</div>
                                              <table className="w-full text-xs">
                                                <tbody>
                                                  {aging.rows.map((ar) => (
                                                    <tr key={ar.key} className="border-t border-[hsl(var(--pk-border))]">
                                                      <td className="px-2 py-1">{ar.label}</td>
                                                      <td className="text-right px-2 py-1 tnum">{fmt(ar.current)}</td>
                                                      <td className="text-right px-2 py-1 tnum">{fmt(ar.prior)}</td>
                                                    </tr>
                                                  ))}
                                                  <tr className="border-t border-[hsl(var(--pk-border))] font-semibold">
                                                    <td className="px-2 py-1">Total Trade Receivables</td>
                                                    <td className="text-right px-2 py-1 tnum">{fmt(aging.totalCurrent)}</td>
                                                    <td className="text-right px-2 py-1 tnum">{fmt(aging.totalPrior)}</td>
                                                  </tr>
                                                  <tr className="border-t border-[hsl(var(--pk-border))]">
                                                    <td className="px-2 py-1">Less: Impairment loss on receivables</td>
                                                    <td className="text-right px-2 py-1 tnum">{fmt(aging.impairmentCurrent)}</td>
                                                    <td className="text-right px-2 py-1 tnum">{fmt(aging.impairmentPrior)}</td>
                                                  </tr>
                                                  <tr className="border-t border-[hsl(var(--pk-border))]">
                                                    <td className="px-2 py-1">Less: Expected Credit loss</td>
                                                    <td className="text-right px-2 py-1 tnum">{fmt(aging.eclCurrent)}</td>
                                                    <td className="text-right px-2 py-1 tnum">{fmt(aging.eclPrior)}</td>
                                                  </tr>
                                                  <tr className="border-t border-[hsl(var(--pk-border))] font-semibold">
                                                    <td className="px-2 py-1">Net Trade Receivables</td>
                                                    <td className="text-right px-2 py-1 tnum">{fmt(aging.netCurrent)}</td>
                                                    <td className="text-right px-2 py-1 tnum">{fmt(aging.netPrior)}</td>
                                                  </tr>
                                                </tbody>
                                              </table>
                                            </div>
                                          </td>
                                        </tr>
                                      );
                                    })()}
                                  </Fragment>
                                );
                              })}
                              <tr className="border-t border-[hsl(var(--pk-border))] bg-[hsl(var(--pk-accent-soft))] font-semibold">
                                <td className="px-2 py-1.5 pl-9 text-xs">{bd.totalLabel}</td>
                                <td className="text-right px-2 py-1.5 tnum text-xs">{fmt(bd.totalCurrent)}</td>
                                <td className="text-right px-2 py-1.5 tnum text-xs">{fmt(bd.totalPrior)}</td>
                                <td className="text-right px-2 py-1.5 tnum italic text-xs">{fmt(variance(bd.totalCurrent, bd.totalPrior).abs)}</td>
                                <td className="text-right px-2 py-1.5 tnum italic text-xs">{fmtPct(variance(bd.totalCurrent, bd.totalPrior).pct)}</td>
                              </tr>
                              {r.key === "cash_equivalents" && rateHere !== null && (
                                <tr className="border-t border-[hsl(var(--pk-border))] bg-[hsl(var(--pk-accent-soft))]">
                                  <td className="px-2 py-1.5 pl-9 text-xs italic text-[hsl(var(--pk-ink-faint))]">Effective Profit Rate</td>
                                  <td className="text-right px-2 py-1.5 tnum text-xs italic text-[hsl(var(--pk-ink-faint))]">{rateHere.toFixed(2)}%</td>
                                  <td className="text-right px-2 py-1.5 tnum text-xs italic text-[hsl(var(--pk-ink-faint))]">{ratePrior !== null ? `${ratePrior.toFixed(2)}%` : "—"}</td>
                                  <td />
                                  <td />
                                </tr>
                              )}
                            </>
                          );
                        })()}
                      </Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          <InfoNote>All Financial Position figures are in RM'000. Click a line item with an arrow to drill into its own breakdown.</InfoNote>
        </>
      )}
    </div>
  );
}
