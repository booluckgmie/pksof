import { ScreenHeader } from "@/components/pk/ScreenHeader";
import { StatCard } from "@/components/pk/Misc";
import { SplitBar, GroupedBarTrend } from "@/components/pk/Charts";
import { cn } from "@/lib/utils";
import type { ScreenId } from "@/lib/nav";
import { useSession } from "@/lib/session";
import { useDetails } from "@/lib/details";

function SectionLabel({ children }: { children: React.ReactNode }) {
  return <div className="text-[11px] uppercase tracking-wide text-[hsl(var(--pk-ink-faint))] font-semibold mb-2">{children}</div>;
}

/** Heat-shaded cell per age band — darker/more saturated fill for a larger headcount, so the
 * concentration reads at a glance without a separate legend or an "average age" figure. */
function AgeHeatmap({ data, total }: { data: { band: string; count: number }[]; total: number }) {
  const max = Math.max(...data.map((d) => d.count), 1);
  return (
    <div className="grid gap-1.5" style={{ gridTemplateColumns: `repeat(${data.length}, minmax(0, 1fr))` }}>
      {data.map((d) => {
        const intensity = d.count / max;
        const dark = intensity > 0.55;
        return (
          <div
            key={d.band}
            className="rounded-md px-2 py-3.5 text-center"
            style={{ background: `hsl(var(--pk-accent) / ${(0.12 + intensity * 0.78).toFixed(2)})` }}
          >
            <div className={cn("text-[10px] uppercase tracking-wide", dark ? "text-white/75" : "text-[hsl(var(--pk-ink-faint))]")}>{d.band}</div>
            <div className={cn("tnum font-head text-lg font-semibold mt-0.5", dark ? "text-white" : "text-[hsl(var(--pk-ink))]")}>{d.count}</div>
            <div className={cn("text-[10px] mt-0.5", dark ? "text-white/65" : "text-[hsl(var(--pk-ink-faint))]")}>{total > 0 ? `${((d.count / total) * 100).toFixed(0)}%` : "—"}</div>
          </div>
        );
      })}
    </div>
  );
}

export function RP001A({ onNavigate }: { onNavigate: (id: ScreenId) => void }) {
  const { periodId } = useSession();
  const {
    genderBreakdownByPeriod, ageGenderBreakdownFor, gradeGenderCrossTabFor,
    gradeBreakdownFor, ageBreakdownFor, headcountSummaryByPeriod,
  } = useDetails();
  const genderBreakdown = genderBreakdownByPeriod[periodId];
  const gradeBreakdown = gradeBreakdownFor(periodId);
  const ageBreakdown = ageBreakdownFor(periodId);
  const ageGenderBreakdown = ageGenderBreakdownFor(periodId);
  const gradeGenderCrossTab = gradeGenderCrossTabFor(periodId);
  const headcountSummary = headcountSummaryByPeriod[periodId];

  return (
    <div>
      <ScreenHeader id="RP001A" subtitle="Resource & People · Headcount by Gender, Grade and Age Group." onNavigate={onNavigate} />

      <SectionLabel>Section A — Breakdown by Gender</SectionLabel>
      <div className="rounded-lg border border-[hsl(var(--pk-border))] bg-[hsl(var(--pk-surface))] shadow-card p-4 mb-5">
        <SplitBar segments={[{ label: "Male", value: genderBreakdown.male, color: "hsl(var(--pk-navy))" }, { label: "Female", value: genderBreakdown.female, color: "hsl(var(--pk-accent))" }]} />
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
          <div className="text-[11px] font-bold underline text-[hsl(var(--pk-ink-faint))] mb-2">Male / female headcount per age band (HRMS)</div>
          <GroupedBarTrend
            data={ageGenderBreakdown.map((a) => ({ label: a.band, a: a.male, b: a.female }))}
            aLabel="Male"
            bLabel="Female"
            aColor="hsl(var(--pk-navy))"
            bColor="hsl(var(--pk-accent))"
          />
        </div>
        <div className="rounded-lg border border-[hsl(var(--pk-border))] bg-[hsl(var(--pk-surface))] shadow-card p-4">
          <div className="text-[11px] uppercase tracking-wide text-[hsl(var(--pk-ink-faint))] mb-2">Age Profile — by band</div>
          <AgeHeatmap data={ageBreakdown} total={headcountSummary.totalEmployees} />
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
