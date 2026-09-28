import { ScreenHeader } from "@/components/pk/ScreenHeader";
import { StatCard } from "@/components/pk/Misc";
import { GroupedBarTrend, Donut } from "@/components/pk/Charts";
import { FinancialYearQuarterPicker, useLocalPeriodId } from "@/components/pk/PeriodPicker";
import { DownloadableFrame } from "@/components/pk/DownloadableFrame";
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

const GRADE_CATEGORY_ORDER = ["Top Management", "Senior Management", "Management", "Executive", "Non-Executive"];

const GRADE_CATEGORY_COLORS: Record<string, string> = {
  "Top Management": "hsl(var(--pk-navy))",
  "Senior Management": "hsl(var(--pk-accent))",
  "Management": "hsl(151 65% 45%)",
  "Executive": "hsl(151 45% 68%)",
  "Non-Executive": "hsl(220 9% 62%)",
};

export function RP001A({ onNavigate }: { onNavigate: (id: ScreenId) => void }) {
  const [periodId, setPeriodId] = useLocalPeriodId();
  const {
    genderBreakdownByPeriod, ageGenderBreakdownFor,
    ageBreakdownFor, headcountSummaryByPeriod, averageAgeByPeriod,
    departmentHeadcountFor, gradeBreakdownFor, gradeGenderCrossTabFor,
  } = useDetails();
  const genderBreakdown = genderBreakdownByPeriod[periodId];
  const ageBreakdown = ageBreakdownFor(periodId);
  const ageGenderBreakdown = ageGenderBreakdownFor(periodId);
  const headcountSummary = headcountSummaryByPeriod[periodId];
  const averageAge = averageAgeByPeriod[periodId];
  const totalEmployees = headcountSummary.totalEmployees || 1;
  const departmentHeadcount = departmentHeadcountFor(periodId);
  const deptApprovedTotal = departmentHeadcount.reduce((s, d) => s + d.approved, 0);
  const deptFilledTotal = departmentHeadcount.reduce((s, d) => s + d.filled, 0);

  // Section B/D used to be a hardcoded, period-independent grade-code exhibit (SM1–SM3, TS1–TS8,
  // etc.) that never changed no matter which quarter was selected — real per-quarter uploads only
  // ever collect grade data at these 5 broader Job Band Levels, not per individual grade code, so
  // that's the granularity now shown here too.
  const gradeByCategory: Record<string, number> = Object.fromEntries(gradeBreakdownFor(periodId).map((g) => [g.grade, g.count]));
  const gradeTotal = GRADE_CATEGORY_ORDER.reduce((s, cat) => s + (gradeByCategory[cat] ?? 0), 0) || 1;
  const crossTabByCategory: Record<string, { male: number; female: number; avgAge: number }> = Object.fromEntries(
    gradeGenderCrossTabFor(periodId).map((g) => [g.grade, g])
  );
  const crossTabMaleTotal = GRADE_CATEGORY_ORDER.reduce((s, cat) => s + (crossTabByCategory[cat]?.male ?? 0), 0);
  const crossTabFemaleTotal = GRADE_CATEGORY_ORDER.reduce((s, cat) => s + (crossTabByCategory[cat]?.female ?? 0), 0);
  const crossTabGrandTotal = crossTabMaleTotal + crossTabFemaleTotal || 1;

  return (
    <div>
      <ScreenHeader
        id="RP001A"
        subtitle="Resource & People · Headcount by Gender, Grade, Age Group, Job Band Level and Department."
        onNavigate={onNavigate}
        periodId={periodId}
        right={<FinancialYearQuarterPicker periodId={periodId} onChange={setPeriodId} />}
      />

      <SectionLabel>Section A — Breakdown by Gender</SectionLabel>
      <div className="rounded-lg border border-[hsl(var(--pk-border))] bg-[hsl(var(--pk-surface))] shadow-card p-4 mb-5">
        <div className="flex flex-col sm:flex-row items-center gap-4">
          <div className="w-40 shrink-0">
            <Donut
              segments={[
                { label: "Male", value: genderBreakdown.male, color: "hsl(var(--pk-navy))" },
                { label: "Female", value: genderBreakdown.female, color: "hsl(var(--pk-accent))" },
              ]}
              centerValue={String(headcountSummary.totalEmployees)}
              centerLabel="Total Employee(s)"
            />
          </div>
          <div className="sm:w-52 shrink-0">
            <StatCard label="Total Employee(s)" value={String(headcountSummary.totalEmployees)} />
          </div>
        </div>
      </div>

      <SectionLabel>Section B — Breakdown by Grade (5 approved bands)</SectionLabel>
      <DownloadableFrame
        filename="rp001a-breakdown-by-grade"
        className="rounded-lg border border-[hsl(var(--pk-border))] bg-[hsl(var(--pk-surface))] shadow-card p-4 mb-5"
        csvData={{
          headers: ["Job Band Level", "Grade Code", "Headcount", "% of Workforce"],
          rows: GRADE_CATEGORY_ORDER.map((cat) => [
            GRADE_INFO[cat]?.displayLabel ?? cat,
            GRADE_INFO[cat]?.code ?? "—",
            gradeByCategory[cat] ?? 0,
            `${Math.round(((gradeByCategory[cat] ?? 0) / gradeTotal) * 100)}%`,
          ]),
        }}
      >
        <div className="flex flex-col sm:flex-row items-center gap-4">
          <div className="w-40 shrink-0">
            <Donut
              segments={GRADE_CATEGORY_ORDER.map((cat) => ({
                label: GRADE_INFO[cat]?.displayLabel ?? cat,
                value: gradeByCategory[cat] ?? 0,
                color: GRADE_CATEGORY_COLORS[cat],
              }))}
              centerValue={String(gradeTotal)}
              centerLabel="Total Employee(s)"
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
                <div className="tnum font-head text-xl font-bold text-[hsl(var(--pk-ink))]">{gradeByCategory[cat] ?? 0}</div>
                <div className="text-2xs text-[hsl(var(--pk-ink-faint))] tnum">{Math.round(((gradeByCategory[cat] ?? 0) / gradeTotal) * 100)}%</div>
              </div>
            ))}
            <div className="rounded-lg border border-[hsl(var(--pk-border))] bg-[hsl(var(--pk-surface-2))] px-3 py-2.5">
              <div className="text-xs font-semibold text-[hsl(var(--pk-ink))]">Total Employee(s)</div>
              <div className="tnum font-head text-xl font-bold text-[hsl(var(--pk-ink))] mt-1">{gradeTotal}</div>
              <div className="text-2xs text-[hsl(var(--pk-ink-faint))] tnum">100%</div>
            </div>
          </div>
        </div>
        <p className="text-2xs text-[hsl(var(--pk-ink-faint))] mt-3">Job Band Level derived from HRMS grade code (SM1–SM3, TS1–TS2, TS3–TS5, TS6–TS8, OS1–OS4). Source: HRMS.</p>
      </DownloadableFrame>

      <SectionLabel>Section C — Breakdown by Age Group (4 bands)</SectionLabel>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
        <div className="rounded-lg border border-[hsl(var(--pk-border))] bg-[hsl(var(--pk-surface))] shadow-card p-4">
          <div className="text-2xs font-bold underline text-[hsl(var(--pk-ink-faint))] mb-2">Male / Female Headcount per Age Band (HRMS)</div>
          <DownloadableFrame
            filename="rp001a-age-band-by-gender"
            csvData={{
              headers: ["Age Band", "Male", "Female"],
              rows: ageGenderBreakdown.map((a) => [a.band, a.male, a.female]),
            }}
          >
            <GroupedBarTrend
              data={ageGenderBreakdown.map((a) => ({ label: a.band, a: a.male, b: a.female }))}
              aLabel="Male"
              bLabel="Female"
              aColor="hsl(var(--pk-navy))"
              bColor="hsl(var(--pk-accent))"
            />
          </DownloadableFrame>
        </div>
        <div className="rounded-lg border border-[hsl(var(--pk-border))] bg-[hsl(var(--pk-surface))] shadow-card p-4">
          <div className="text-2xs font-bold underline text-[hsl(var(--pk-ink-faint))] mb-2">Workforce Age Profile — By Band</div>
          <DownloadableFrame filename="rp001a-workforce-age-profile" className="flex flex-col sm:flex-row items-center gap-4">
            <div className="w-40 shrink-0">
              <Donut
                segments={ageBreakdown.map((a) => ({ label: a.band, value: a.count, color: AGE_BAND_COLORS[a.band] ?? "hsl(var(--pk-ink-faint))" }))}
                centerValue={String(headcountSummary.totalEmployees)}
                centerLabel="Total Employee(s)"
              />
            </div>
            <table className="w-full text-xs">
              <thead>
                <tr className="text-3xs uppercase tracking-wide text-white bg-[hsl(var(--pk-navy))]">
                  <th className="text-left font-medium px-2 py-1.5">Age Band</th>
                  <th className="text-right font-medium px-2 py-1.5">Headcount</th>
                  <th className="text-right font-medium px-2 py-1.5">% of Workforce</th>
                </tr>
              </thead>
              <tbody>
                {ageBreakdown.map((a) => (
                  <tr key={a.band} className="border-b border-[hsl(var(--pk-border))] last:border-b-0">
                    <td className="px-2 py-1.5 flex items-center gap-1.5 text-[hsl(var(--pk-ink))]">
                      <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ background: AGE_BAND_COLORS[a.band] }} />
                      {a.band}
                    </td>
                    <td className="text-right px-2 py-1.5 tnum">{a.count}</td>
                    <td className="text-right px-2 py-1.5 tnum font-semibold text-[hsl(var(--pk-accent))]">{totalEmployees > 0 ? `${Math.round((a.count / totalEmployees) * 100)}%` : "—"}</td>
                  </tr>
                ))}
                <tr className="font-semibold">
                  <td className="px-2 py-1.5 text-[hsl(var(--pk-ink))]">Total</td>
                  <td className="text-right px-2 py-1.5 tnum">{headcountSummary.totalEmployees}</td>
                  <td className="text-right px-2 py-1.5 tnum">100%</td>
                </tr>
              </tbody>
            </table>
          </DownloadableFrame>
          <div className="flex items-center justify-between mt-3">
            <p className="text-2xs text-[hsl(var(--pk-ink-faint))]">Average Age: <span className="font-semibold text-[hsl(var(--pk-ink))]">{averageAge.toFixed(1)} years</span></p>
            <p className="text-2xs text-[hsl(var(--pk-ink-faint))]">Source: HRMS</p>
          </div>
        </div>
      </div>

      <SectionLabel>Section D — Cross-tab: Job Band Level × Gender × Average Age</SectionLabel>
      <DownloadableFrame
        filename="rp001a-job-band-gender-age-crosstab"
        className="rounded-lg border border-[hsl(var(--pk-border))] bg-[hsl(var(--pk-surface))] shadow-card overflow-x-auto"
        csvData={{
          headers: ["Job Band Level", "Male", "Female", "Total", "% of Workforce", "Average Age"],
          rows: [
            ...GRADE_CATEGORY_ORDER.map((cat) => {
              const c = crossTabByCategory[cat] ?? { male: 0, female: 0, avgAge: 0 };
              const rowTotal = c.male + c.female;
              return [
                GRADE_INFO[cat]?.displayLabel ?? cat, c.male, c.female, rowTotal,
                `${Math.round((rowTotal / crossTabGrandTotal) * 100)}%`,
                c.avgAge.toFixed(1),
              ];
            }),
            ["Total", crossTabMaleTotal, crossTabFemaleTotal, crossTabMaleTotal + crossTabFemaleTotal, "100%", averageAge.toFixed(1)],
          ],
        }}
      >
        <table className="w-full text-sm min-w-[560px]">
          <thead>
            <tr className="text-2xs uppercase tracking-wide text-white bg-[hsl(var(--pk-navy))]">
              <th className="text-left font-medium px-3 py-2">Job Band Level</th>
              <th className="text-right font-medium px-3 py-2">Male</th>
              <th className="text-right font-medium px-3 py-2">Female</th>
              <th className="text-right font-medium px-3 py-2">Total</th>
              <th className="text-right font-medium px-3 py-2">% of Workforce</th>
              <th className="text-right font-medium px-3 py-2">Average Age</th>
            </tr>
          </thead>
          <tbody>
            {GRADE_CATEGORY_ORDER.map((cat) => {
              const c = crossTabByCategory[cat] ?? { male: 0, female: 0, avgAge: 0 };
              const rowTotal = c.male + c.female;
              return (
                <tr key={cat} className="border-t border-[hsl(var(--pk-border))]">
                  <td className="px-3 py-2 font-medium text-[hsl(var(--pk-ink))]">{GRADE_INFO[cat]?.displayLabel ?? cat}</td>
                  <td className="px-3 py-2 text-right tnum">{c.male}</td>
                  <td className="px-3 py-2 text-right tnum">{c.female}</td>
                  <td className="px-3 py-2 text-right tnum font-semibold">{rowTotal}</td>
                  <td className="px-3 py-2 text-right tnum">{Math.round((rowTotal / crossTabGrandTotal) * 100)}%</td>
                  <td className="px-3 py-2 text-right tnum">{c.avgAge.toFixed(1)}</td>
                </tr>
              );
            })}
            <tr className="border-t-2 border-[hsl(var(--pk-border))] bg-[hsl(var(--pk-surface-2))] font-semibold">
              <td className="px-3 py-2">Total</td>
              <td className="px-3 py-2 text-right tnum">{crossTabMaleTotal}</td>
              <td className="px-3 py-2 text-right tnum">{crossTabFemaleTotal}</td>
              <td className="px-3 py-2 text-right tnum">{crossTabMaleTotal + crossTabFemaleTotal}</td>
              <td className="px-3 py-2 text-right tnum">100%</td>
              <td className="px-3 py-2 text-right tnum">{averageAge.toFixed(1)}</td>
            </tr>
          </tbody>
        </table>
      </DownloadableFrame>
      <p className="text-2xs text-[hsl(var(--pk-ink-faint))] mt-2 flex items-center justify-between flex-wrap gap-2">
        <span>Job Band Level derived from HRMS grade code (SM1–SM3, TS1–TS2, TS3–TS5, TS6–TS8, OS1–OS4). Total headcount shall reconcile with active employees.</span>
        <span>Source: HRMS</span>
      </p>

      <SectionLabel>Section E — Department Headcount (Approved vs Filled)</SectionLabel>
      <DownloadableFrame
        filename="rp001a-department-headcount"
        className="rounded-lg border border-[hsl(var(--pk-border))] bg-[hsl(var(--pk-surface))] shadow-card overflow-x-auto mb-2"
        csvData={{
          headers: ["Department", "Approved", "Filled", "Vacancy"],
          rows: [
            ...departmentHeadcount.map((d) => [d.dept, d.approved, d.filled, d.approved - d.filled]),
            ["Total", deptApprovedTotal, deptFilledTotal, deptApprovedTotal - deptFilledTotal],
          ],
        }}
      >
        <table className="w-full text-sm min-w-[480px]">
          <thead>
            <tr className="text-2xs uppercase tracking-wide text-white bg-[hsl(var(--pk-navy))]">
              <th className="text-left font-medium px-3 py-2">Department</th>
              <th className="text-right font-medium px-3 py-2">Approved</th>
              <th className="text-right font-medium px-3 py-2">Filled</th>
              <th className="text-right font-medium px-3 py-2">Vacancy</th>
            </tr>
          </thead>
          <tbody>
            {departmentHeadcount.map((d) => (
              <tr key={d.dept} className="border-t border-[hsl(var(--pk-border))]">
                <td className="px-3 py-2 text-[hsl(var(--pk-ink))]">{d.dept}</td>
                <td className="px-3 py-2 text-right tnum">{d.approved}</td>
                <td className="px-3 py-2 text-right tnum">{d.filled}</td>
                <td className="px-3 py-2 text-right tnum">{d.approved - d.filled}</td>
              </tr>
            ))}
            <tr className="border-t-2 border-[hsl(var(--pk-border))] bg-[hsl(var(--pk-surface-2))] font-semibold">
              <td className="px-3 py-2">Total</td>
              <td className="px-3 py-2 text-right tnum">{deptApprovedTotal}</td>
              <td className="px-3 py-2 text-right tnum">{deptFilledTotal}</td>
              <td className="px-3 py-2 text-right tnum">{deptApprovedTotal - deptFilledTotal}</td>
            </tr>
          </tbody>
        </table>
      </DownloadableFrame>
      <p className="text-2xs text-[hsl(var(--pk-ink-faint))] text-right">Source: HRMS</p>
    </div>
  );
}
