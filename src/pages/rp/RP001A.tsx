import { ScreenHeader } from "@/components/pk/ScreenHeader";
import { StatCard } from "@/components/pk/Misc";
import { DonutStat, GroupedBarTrend } from "@/components/pk/Charts";
import type { ScreenId } from "@/lib/nav";
import { useSession } from "@/lib/session";
import { useDetails } from "@/lib/details";

function SectionLabel({ children }: { children: React.ReactNode }) {
  return <div className="text-[11px] uppercase tracking-wide text-[hsl(var(--pk-ink-faint))] font-semibold mb-2">{children}</div>;
}

const AGE_DONUT_COLORS = ["hsl(var(--pk-accent))", "hsl(var(--pk-navy))", "hsl(var(--pk-warn))", "hsl(var(--pk-pending))"];

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
      <div className="rounded-lg border border-[hsl(var(--pk-border))] bg-[hsl(var(--pk-surface))] p-4 mb-5">
        <DonutStat segments={[{ label: "Male", value: genderBreakdown.male, color: "hsl(var(--pk-navy))" }, { label: "Female", value: genderBreakdown.female, color: "hsl(var(--pk-accent))" }]} />
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
        <div className="rounded-lg border border-[hsl(var(--pk-border))] bg-[hsl(var(--pk-surface))] p-4">
          <div className="text-[11px] text-[hsl(var(--pk-ink-faint))] mb-2">Male / female headcount per age band (HRMS)</div>
          <GroupedBarTrend
            data={ageGenderBreakdown.map((a) => ({ label: a.band, a: a.male, b: a.female }))}
            aLabel="Male"
            bLabel="Female"
            aColor="hsl(var(--pk-navy))"
            bColor="hsl(var(--pk-accent))"
          />
        </div>
        <div className="rounded-lg border border-[hsl(var(--pk-border))] bg-[hsl(var(--pk-surface))] p-4">
          <div className="text-[11px] uppercase tracking-wide text-[hsl(var(--pk-ink-faint))] mb-2">Age Profile — Summary</div>
          <div className="flex items-center gap-4">
            <svg viewBox="0 0 100 100" width={104} height={104}>
              {(() => {
                const total = ageBreakdown.reduce((s, a) => s + a.count, 0) || 1;
                const r = 42;
                const c = 2 * Math.PI * r;
                let acc = 0;
                return ageBreakdown.map((a, i) => {
                  const frac = a.count / total;
                  const dash = frac * c;
                  const el = (
                    <circle
                      key={a.band}
                      cx={50}
                      cy={50}
                      r={r}
                      fill="none"
                      stroke={AGE_DONUT_COLORS[i]}
                      strokeWidth={14}
                      strokeDasharray={`${dash} ${c - dash}`}
                      strokeDashoffset={-acc}
                      transform="rotate(-90 50 50)"
                    />
                  );
                  acc += dash;
                  return el;
                });
              })()}
              <text x={50} y={47} textAnchor="middle" fontSize={16} fontWeight={700} className="fill-[hsl(var(--pk-ink))] tnum">{averageAge}</text>
              <text x={50} y={60} textAnchor="middle" fontSize={7} className="fill-[hsl(var(--pk-ink-faint))]">AVG AGE</text>
            </svg>
            <div className="flex flex-col gap-1.5">
              {ageBreakdown.map((a, i) => {
                const total = ageBreakdown.reduce((s, x) => s + x.count, 0) || 1;
                const pct = ((a.count / total) * 100).toFixed(1);
                return (
                  <div key={a.band} className="flex items-center gap-2 text-xs">
                    <span className="h-2.5 w-2.5 rounded-sm shrink-0" style={{ background: AGE_DONUT_COLORS[i] }} />
                    <span className="text-[hsl(var(--pk-ink-soft))] w-12">{a.band}</span>
                    <span className="tnum font-semibold text-[hsl(var(--pk-ink))]">{a.count}</span>
                    <span className="tnum text-[hsl(var(--pk-ink-faint))]">({pct}%)</span>
                  </div>
                );
              })}
            </div>
          </div>
          <p className="text-[11px] text-[hsl(var(--pk-ink-faint))] mt-3">Average age {averageAge} years · Source: HRMS</p>
        </div>
      </div>

      <SectionLabel>Section D — Cross-tab: Grade × Gender × Average Age</SectionLabel>
      <div className="rounded-lg border border-[hsl(var(--pk-border))] bg-[hsl(var(--pk-surface))] overflow-x-auto">
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
