import { ScreenHeader } from "@/components/pk/ScreenHeader";
import { StatCard } from "@/components/pk/Misc";
import { SplitBar, GroupedBarTrend, Donut } from "@/components/pk/Charts";
import { FinancialYearQuarterPicker, useLocalPeriodId } from "@/components/pk/PeriodPicker";
import type { ScreenId } from "@/lib/nav";
import { useDetails } from "@/lib/details";

function SectionLabel({ children }: { children: React.ReactNode }) {
  return <div className="text-2xs uppercase tracking-wide text-[hsl(var(--pk-ink-faint))] font-semibold mb-2">{children}</div>;
}

/** Job Band Level (the client's own HRMS grade-code scheme) — "Management" is stored/keyed
 * exactly like every other screen's grade breakdown, but the client's own report calls that one
 * band "Managerial", so only the display label is overridden here, not the underlying key. */
const GRADE_INFO: Record<string, { code: string; displayLabel?: string }> = {
  "Top Management": { code: "SM1 – SM3" },
  "Senior Management": { code: "TS1 – TS2" },
  "Management": { code: "TS3 – TS5", displayLabel: "Managerial" },
  "Executive": { code: "TS6 – TS8" },
  "Non-Executive": { code: "OS1 – OS4" },
};

const AGE_BAND_COLORS: Record<string, string> = {
  "≤30": "hsl(151 55% 68%)",
  "31–40": "hsl(var(--pk-accent))",
  "41–50": "hsl(151 75% 40%)",
  "51+": "hsl(var(--pk-navy))",
};

/** Grade-code-level establishment listing (client HRMS export) — the granular rows behind
 * Section B's 5 approved bands and Section D's cross-tab. Reuses the "Management" →
 * "Managerial" key/label convention from GRADE_INFO above. Male/female split per code is a
 * proportional dummy allocation (the client's own export only gave code-level headcount, not
 * gender) that reconciles exactly to each band's real male/female/avgAge and to the page's
 * Section A gender totals — see Section D below. Fixed as at Q2 FY2026, independent of the
 * period-driven Supabase dataset the rest of this screen reads. */
const GRADE_CODE_ROWS: { code: string; qty: number; male: number; female: number; category: string }[] = [
  { code: "CEO", qty: 1, male: 1, female: 0, category: "Top Management" },
  { code: "SM1", qty: 0, male: 0, female: 0, category: "Top Management" },
  { code: "SM2", qty: 1, male: 1, female: 0, category: "Top Management" },
  { code: "SM3", qty: 5, male: 3, female: 2, category: "Top Management" },
  { code: "TS1", qty: 8, male: 4, female: 4, category: "Senior Management" },
  { code: "TS2", qty: 17, male: 10, female: 7, category: "Senior Management" },
  { code: "TS3", qty: 33, male: 17, female: 16, category: "Management" },
  { code: "TS4", qty: 42, male: 22, female: 20, category: "Management" },
  { code: "TS5", qty: 32, male: 16, female: 16, category: "Management" },
  { code: "TS6", qty: 36, male: 19, female: 17, category: "Executive" },
  { code: "TS7", qty: 15, male: 8, female: 7, category: "Executive" },
  { code: "TS8", qty: 28, male: 15, female: 13, category: "Executive" },
  { code: "OS1", qty: 6, male: 3, female: 3, category: "Non-Executive" },
  { code: "OS2", qty: 7, male: 4, female: 3, category: "Non-Executive" },
  { code: "OS3", qty: 1, male: 1, female: 0, category: "Non-Executive" },
  { code: "OS4", qty: 4, male: 2, female: 2, category: "Non-Executive" },
];

const GRADE_CATEGORY_ORDER = ["Top Management", "Senior Management", "Management", "Executive", "Non-Executive"];

const GRADE_CATEGORY_COLORS: Record<string, string> = {
  "Top Management": "hsl(var(--pk-navy))",
  "Senior Management": "hsl(var(--pk-accent))",
  "Management": "hsl(151 65% 45%)",
  "Executive": "hsl(151 45% 68%)",
  "Non-Executive": "hsl(220 9% 62%)",
};

/** Dummy per-band average age (the client's export didn't include this at code level either) —
 * applied uniformly to every code within a band. */
const GRADE_CATEGORY_AVG_AGE: Record<string, number> = {
  "Top Management": 51.5,
  "Senior Management": 46.0,
  "Management": 40.5,
  "Executive": 34.0,
  "Non-Executive": 35.5,
};

const GRADE_CODE_CATEGORY_TOTALS: Record<string, number> = Object.fromEntries(
  GRADE_CATEGORY_ORDER.map((cat) => [cat, GRADE_CODE_ROWS.filter((r) => r.category === cat).reduce((s, r) => s + r.qty, 0)])
);
const GRADE_CODE_CATEGORY_ROW_COUNTS: Record<string, number> = Object.fromEntries(
  GRADE_CATEGORY_ORDER.map((cat) => [cat, GRADE_CODE_ROWS.filter((r) => r.category === cat).length])
);
const GRADE_CODE_GRAND_TOTAL = GRADE_CODE_ROWS.reduce((s, r) => s + r.qty, 0);
const GRADE_CODE_MALE_TOTAL = GRADE_CODE_ROWS.reduce((s, r) => s + r.male, 0);
const GRADE_CODE_FEMALE_TOTAL = GRADE_CODE_ROWS.reduce((s, r) => s + r.female, 0);

export function RP001A({ onNavigate }: { onNavigate: (id: ScreenId) => void }) {
  const [periodId, setPeriodId] = useLocalPeriodId();
  const {
    genderBreakdownByPeriod, ageGenderBreakdownFor,
    ageBreakdownFor, headcountSummaryByPeriod, averageAgeByPeriod,
  } = useDetails();
  const genderBreakdown = genderBreakdownByPeriod[periodId];
  const ageBreakdown = ageBreakdownFor(periodId);
  const ageGenderBreakdown = ageGenderBreakdownFor(periodId);
  const headcountSummary = headcountSummaryByPeriod[periodId];
  const averageAge = averageAgeByPeriod[periodId];
  const totalEmployees = headcountSummary.totalEmployees || 1;

  return (
    <div>
      <ScreenHeader
        id="RP001A"
        subtitle="Resource & People · Headcount by Gender, Grade, Age Group and Job Band Level."
        onNavigate={onNavigate}
        periodId={periodId}
        right={<FinancialYearQuarterPicker periodId={periodId} onChange={setPeriodId} />}
      />

      <SectionLabel>Section A — Breakdown by Gender</SectionLabel>
      <div className="rounded-lg border border-[hsl(var(--pk-border))] bg-[hsl(var(--pk-surface))] shadow-card p-4 mb-5">
        <div className="flex flex-col sm:flex-row items-stretch gap-4">
          <div className="flex-1 flex flex-col justify-center">
            <SplitBar segments={[{ label: "Male", value: genderBreakdown.male, color: "hsl(var(--pk-navy))" }, { label: "Female", value: genderBreakdown.female, color: "hsl(var(--pk-accent))" }]} />
          </div>
          <div className="sm:w-52 shrink-0">
            <StatCard label="Total Employees" value={String(headcountSummary.totalEmployees)} />
          </div>
        </div>
        <p className="text-2xs text-[hsl(var(--pk-ink-faint))] mt-3">Gender is a mandatory HRMS field — no blanks permitted. Male + Female reconciles to Total Employees ({headcountSummary.totalEmployees}).</p>
      </div>

      <SectionLabel>Section B — Breakdown by Grade (5 approved bands)</SectionLabel>
      <div className="rounded-lg border border-[hsl(var(--pk-border))] bg-[hsl(var(--pk-surface))] shadow-card p-4 mb-5">
        <div className="flex flex-col sm:flex-row items-center gap-4">
          <div className="w-40 shrink-0">
            <Donut
              segments={GRADE_CATEGORY_ORDER.map((cat) => ({
                label: GRADE_INFO[cat]?.displayLabel ?? cat,
                value: GRADE_CODE_CATEGORY_TOTALS[cat],
                color: GRADE_CATEGORY_COLORS[cat],
              }))}
              centerValue={String(GRADE_CODE_GRAND_TOTAL)}
              centerLabel="Total Employees"
            />
          </div>
          <div className="flex-1 grid grid-cols-2 sm:grid-cols-3 gap-2.5 w-full">
            {GRADE_CATEGORY_ORDER.map((cat) => (
              <div key={cat} className="rounded-lg border border-[hsl(var(--pk-border))] bg-[hsl(var(--pk-surface-2))] px-3 py-2.5">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-[hsl(var(--pk-ink))]">
                  <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ background: GRADE_CATEGORY_COLORS[cat] }} />
                  {GRADE_INFO[cat]?.displayLabel ?? cat}
                </div>
                <div className="text-2xs text-[hsl(var(--pk-ink-faint))] mb-1">({GRADE_INFO[cat]?.code})</div>
                <div className="tnum font-head text-xl font-bold text-[hsl(var(--pk-ink))]">{GRADE_CODE_CATEGORY_TOTALS[cat]}</div>
                <div className="text-2xs text-[hsl(var(--pk-ink-faint))] tnum">{((GRADE_CODE_CATEGORY_TOTALS[cat] / GRADE_CODE_GRAND_TOTAL) * 100).toFixed(1)}%</div>
              </div>
            ))}
            <div className="rounded-lg border border-[hsl(var(--pk-border))] bg-[hsl(var(--pk-surface-2))] px-3 py-2.5">
              <div className="text-xs font-semibold text-[hsl(var(--pk-ink))]">Total Employees</div>
              <div className="tnum font-head text-xl font-bold text-[hsl(var(--pk-ink))] mt-1">{GRADE_CODE_GRAND_TOTAL}</div>
              <div className="text-2xs text-[hsl(var(--pk-ink-faint))] tnum">100.0%</div>
            </div>
          </div>
        </div>
        <p className="text-2xs text-[hsl(var(--pk-ink-faint))] mt-3">As at Q2 FY2026 · HRMS establishment listing (16 grade codes across 5 job band levels). Source: HRMS.</p>
      </div>

      <SectionLabel>Section C — Breakdown by Age Group (4 bands)</SectionLabel>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
        <div className="rounded-lg border border-[hsl(var(--pk-border))] bg-[hsl(var(--pk-surface))] shadow-card p-4">
          <div className="text-2xs font-bold underline text-[hsl(var(--pk-ink-faint))] mb-2">Male / Female Headcount per Age Band (HRMS)</div>
          <GroupedBarTrend
            data={ageGenderBreakdown.map((a) => ({ label: a.band, a: a.male, b: a.female }))}
            aLabel="Male"
            bLabel="Female"
            aColor="hsl(var(--pk-navy))"
            bColor="hsl(var(--pk-accent))"
          />
        </div>
        <div className="rounded-lg border border-[hsl(var(--pk-border))] bg-[hsl(var(--pk-surface))] shadow-card p-4">
          <div className="text-2xs font-bold underline text-[hsl(var(--pk-ink-faint))] mb-2">Workforce Age Profile — By Band</div>
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <div className="w-40 shrink-0">
              <Donut
                segments={ageBreakdown.map((a) => ({ label: a.band, value: a.count, color: AGE_BAND_COLORS[a.band] ?? "hsl(var(--pk-ink-faint))" }))}
                centerValue={String(headcountSummary.totalEmployees)}
                centerLabel="Total Employees"
              />
            </div>
            <table className="w-full text-xs">
              <thead>
                <tr className="text-3xs uppercase tracking-wide text-[hsl(var(--pk-ink-faint))] border-b border-[hsl(var(--pk-border))]">
                  <th className="text-left font-medium py-1.5">Age Band</th>
                  <th className="text-right font-medium py-1.5">Headcount</th>
                  <th className="text-right font-medium py-1.5">% of Workforce</th>
                </tr>
              </thead>
              <tbody>
                {ageBreakdown.map((a) => (
                  <tr key={a.band} className="border-b border-[hsl(var(--pk-border))] last:border-b-0">
                    <td className="py-1.5 flex items-center gap-1.5 text-[hsl(var(--pk-ink))]">
                      <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ background: AGE_BAND_COLORS[a.band] }} />
                      {a.band}
                    </td>
                    <td className="text-right py-1.5 tnum">{a.count}</td>
                    <td className="text-right py-1.5 tnum font-semibold text-[hsl(var(--pk-accent))]">{totalEmployees > 0 ? `${((a.count / totalEmployees) * 100).toFixed(1)}%` : "—"}</td>
                  </tr>
                ))}
                <tr className="font-semibold">
                  <td className="py-1.5 text-[hsl(var(--pk-ink))]">Total</td>
                  <td className="text-right py-1.5 tnum">{headcountSummary.totalEmployees}</td>
                  <td className="text-right py-1.5 tnum">100.0%</td>
                </tr>
              </tbody>
            </table>
          </div>
          <div className="flex items-center justify-between mt-3">
            <p className="text-2xs text-[hsl(var(--pk-ink-faint))]">Average Age: <span className="font-semibold text-[hsl(var(--pk-ink))]">{averageAge.toFixed(1)} years</span></p>
            <p className="text-2xs text-[hsl(var(--pk-ink-faint))]">Source: HRMS</p>
          </div>
        </div>
      </div>

      <SectionLabel>Section D — Cross-tab: Job Band Level × Gender × Average Age</SectionLabel>
      <div className="rounded-lg border border-[hsl(var(--pk-border))] bg-[hsl(var(--pk-surface))] shadow-card overflow-x-auto">
        <table className="w-full text-sm min-w-[680px]">
          <thead>
            <tr className="text-2xs uppercase tracking-wide text-[hsl(var(--pk-ink-faint))] bg-[hsl(var(--pk-surface-2))]">
              <th className="text-left font-medium px-3 py-2">Job Band Level</th>
              <th className="text-left font-medium px-3 py-2">Grade Code</th>
              <th className="text-right font-medium px-3 py-2">Male</th>
              <th className="text-right font-medium px-3 py-2">Female</th>
              <th className="text-right font-medium px-3 py-2">Total</th>
              <th className="text-right font-medium px-3 py-2">% of Workforce</th>
              <th className="text-right font-medium px-3 py-2">Average Age</th>
            </tr>
          </thead>
          <tbody>
            {GRADE_CODE_ROWS.map((row, i) => {
              const isFirstOfCategory = i === 0 || GRADE_CODE_ROWS[i - 1].category !== row.category;
              const info = GRADE_INFO[row.category];
              const rowTotal = row.male + row.female;
              const span = GRADE_CODE_CATEGORY_ROW_COUNTS[row.category];
              return (
                <tr key={row.code} className="border-t border-[hsl(var(--pk-border))]">
                  {isFirstOfCategory && (
                    <td className="px-3 py-2 font-medium text-[hsl(var(--pk-ink))] align-top" rowSpan={span}>
                      {info?.displayLabel ?? row.category}
                    </td>
                  )}
                  <td className="px-3 py-2 text-[hsl(var(--pk-ink-faint))]">{row.code}</td>
                  <td className="px-3 py-2 text-right tnum">{row.male}</td>
                  <td className="px-3 py-2 text-right tnum">{row.female}</td>
                  <td className="px-3 py-2 text-right tnum font-semibold">{rowTotal}</td>
                  <td className="px-3 py-2 text-right tnum">{totalEmployees > 0 ? `${((rowTotal / totalEmployees) * 100).toFixed(1)}%` : "—"}</td>
                  {isFirstOfCategory && (
                    <td className="px-3 py-2 text-right tnum align-top" rowSpan={span}>{GRADE_CATEGORY_AVG_AGE[row.category].toFixed(1)}</td>
                  )}
                </tr>
              );
            })}
            <tr className="border-t-2 border-[hsl(var(--pk-border))] bg-[hsl(var(--pk-surface-2))] font-semibold">
              <td className="px-3 py-2" colSpan={2}>Total</td>
              <td className="px-3 py-2 text-right tnum">{GRADE_CODE_MALE_TOTAL}</td>
              <td className="px-3 py-2 text-right tnum">{GRADE_CODE_FEMALE_TOTAL}</td>
              <td className="px-3 py-2 text-right tnum">{GRADE_CODE_GRAND_TOTAL}</td>
              <td className="px-3 py-2 text-right tnum">100.0%</td>
              <td className="px-3 py-2 text-right tnum">{averageAge.toFixed(1)}</td>
            </tr>
          </tbody>
        </table>
      </div>
      <p className="text-2xs text-[hsl(var(--pk-ink-faint))] mt-2 flex items-center justify-between flex-wrap gap-2">
        <span>As at Q2 FY2026 · Job Band Level derived from HRMS grade code (SM1–SM3, TS1–TS2, TS3–TS5, TS6–TS8, OS1–OS4). Total headcount shall reconcile with active employees.</span>
        <span>Source: HRMS</span>
      </p>
    </div>
  );
}
