import { ScreenHeader } from "@/components/pk/ScreenHeader";
import { StatCard } from "@/components/pk/Misc";
import { CategoryBar, GroupedBarTrend } from "@/components/pk/Charts";
import type { ScreenId } from "@/lib/nav";
import { useSession } from "@/lib/session";
import { useDetails } from "@/lib/details";

function SectionLabel({ children }: { children: React.ReactNode }) {
  return <div className="text-[11px] uppercase tracking-wide text-[hsl(var(--pk-ink-faint))] font-semibold mb-2">{children}</div>;
}

const AGE_BAR_COLORS = ["hsl(var(--pk-accent))", "hsl(var(--pk-navy))", "hsl(var(--pk-warn))", "hsl(var(--pk-pending))"];

export function RP001A({ onNavigate }: { onNavigate: (id: ScreenId) => void }) {
  const { periodId } = useSession();
  const {
    genderBreakdownByPeriod, ageGenderBreakdownFor, averageAgeByPeriod, gradeGenderCrossTabFor,
    gradeBreakdownFor, ageBreakdownFor, headcountSummaryByPeriod,
  } = useDetails();
  const genderBreakdown = genderBreakdownByPeriod[periodId];
  const gradeBreakdown = gradeBreakdownFor(periodId);
  const ageBreakdown = ageBreakdownFor(periodId);
  const ageGenderBreakdown = ageGenderBreakdownFor(periodId);
  const averageAge = averageAgeByPeriod[periodId];
  const gradeGenderCrossTab = gradeGenderCrossTabFor(periodId);
  const headcountSummary = headcountSummaryByPeriod[periodId];

  return (
    <div>
      <ScreenHeader id="RP001A" subtitle="Resource & People · Headcount by Gender, Grade and Age Group." onNavigate={onNavigate} />

      <SectionLabel>Section A — Breakdown by Gender</SectionLabel>
      <div className="rounded-lg border border-[hsl(var(--pk-border))] bg-[hsl(var(--pk-surface))] shadow-card p-4 mb-5">
        <CategoryBar segments={[{ label: "Male", value: genderBreakdown.male, color: "hsl(var(--pk-navy))" }, { label: "Female", value: genderBreakdown.female, color: "hsl(var(--pk-accent))" }]} />
        <p className="text-[11px] text-[hsl(var(--pk-ink-faint))] mt-2">Gender is a mandatory HRMS field — no blanks permitted. Male + Female reconciles to Total Employees ({headcountSummary.totalEmployees}).</p>
      </div>

      <SectionLabel>Section B — Breakdown by Grade (5 approved bands)</SectionLabel>
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 mb-5">
        {gradeBreakdown.map((g) => (
          <StatCard key={g.grade} label={g.grade} value={String(g.count)} />
        ))}
      </div>

      <SectionLabel>Section C — Breakdown by Age Group (4 bands)</SectionLabel>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
        <div className="rounded-lg border border-[hsl(var(--pk-border))] bg-[hsl(var(--pk-surface))] shadow-card p-4">
          <div className="text-[11px] text-[hsl(var(--pk-ink-faint))] mb-2">Male / female headcount per age band (HRMS)</div>
          <GroupedBarTrend
            data={ageGenderBreakdown.map((a) => ({ label: a.band, a: a.male, b: a.female }))}
            aLabel="Male"
            bLabel="Female"
            aColor="hsl(var(--pk-navy))"
            bColor="hsl(var(--pk-accent))"
          />
        </div>
        <div className="rounded-lg border border-[hsl(var(--pk-border))] bg-[hsl(var(--pk-surface))] shadow-card p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="text-[11px] uppercase tracking-wide text-[hsl(var(--pk-ink-faint))]">Age Profile — by band</div>
            <div className="text-[11px] text-[hsl(var(--pk-ink-faint))]">Average age <span className="tnum font-semibold text-[hsl(var(--pk-ink))]">{averageAge}</span> years</div>
          </div>
          <CategoryBar segments={ageBreakdown.map((a, i) => ({ label: a.band, value: a.count, color: AGE_BAR_COLORS[i] }))} />
          <p className="text-[11px] text-[hsl(var(--pk-ink-faint))] mt-3">Source: HRMS</p>
        </div>
      </div>

      <SectionLabel>Section D — Cross-tab: Grade × Gender × Average Age</SectionLabel>
      <div className="rounded-lg border border-[hsl(var(--pk-border))] bg-[hsl(var(--pk-surface))] shadow-card overflow-x-auto">
        <table className="w-full text-sm min-w-[480px]">
          <thead>
            <tr className="text-[11px] uppercase tracking-wide text-[hsl(var(--pk-ink-faint))] bg-[hsl(var(--pk-surface-2))]">
              <th className="text-left font-medium px-3 py-2">Grade band</th>
              <th className="text-right font-medium px-3 py-2">Male</th>
              <th className="text-right font-medium px-3 py-2">Female</th>
              <th className="text-right font-medium px-3 py-2">Total</th>
              <th className="text-right font-medium px-3 py-2">Average age</th>
            </tr>
          </thead>
          <tbody>
            {gradeGenderCrossTab.map((r) => (
              <tr key={r.grade} className="border-t border-[hsl(var(--pk-border))]">
                <td className="px-3 py-2 text-[hsl(var(--pk-ink))]">{r.grade}</td>
                <td className="px-3 py-2 text-right tnum">{r.male}</td>
                <td className="px-3 py-2 text-right tnum">{r.female}</td>
                <td className="px-3 py-2 text-right tnum font-semibold">{r.male + r.female}</td>
                <td className="px-3 py-2 text-right tnum">{r.avgAge.toFixed(1)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
