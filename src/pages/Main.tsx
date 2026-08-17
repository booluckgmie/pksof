import { LayoutGrid, Wallet, Users2, ChevronRight, Lock, PenLine } from "lucide-react";
import { ScreenHeader } from "@/components/pk/ScreenHeader";
import { Gauge } from "@/components/pk/Gauge";
import { StatCard } from "@/components/pk/Misc";
import { InfoNote } from "@/components/pk/Misc";
import { PillarGate } from "@/components/pk/PillarGate";
import { NoDataState } from "@/components/pk/DataOrigin";
import type { ScreenId } from "@/lib/nav";
import { useSession } from "@/lib/session";
import { useWorkflow } from "@/lib/workflow";
import { kpis } from "@/data/kpis";
import { entities } from "@/data/entities";
import { entitySnapshot } from "@/data/factSeed";
import { periodById } from "@/data/periods";
import { cn } from "@/lib/utils";

const STATUS_TONE: Record<string, { rail: string; lt: string; label: string }> = {
  "on-track": { rail: "hsl(var(--pk-good))", lt: "hsl(var(--pk-good-lt))", label: "On track" },
  attention: { rail: "hsl(var(--pk-warn))", lt: "hsl(var(--pk-warn-lt))", label: "Attention" },
  "at-risk": { rail: "hsl(var(--pk-bad))", lt: "hsl(var(--pk-bad-lt))", label: "At risk" },
};

export function Main({ onNavigate }: { onNavigate: (id: ScreenId) => void }) {
  const { entityId, setEntityId, periodId, pillarLocked, isRestrictedPillar, entityName, canEnterData } = useSession();
  const { latestValue } = useWorkflow();
  const period = periodById(periodId);

  const results = kpis.map((k) => ({ k, r: latestValue(k.id, entityId, periodId) }));
  const met = results.filter((x) => x.r.status === "met").length;
  const notMet = results.filter((x) => x.r.status === "not-met").length;
  const notMeasurable = results.filter((x) => x.r.status === "not-measurable").length;
  const overall = results.reduce((sum, x) => sum + (x.r.weighted ?? 0), 0) * 100;
  const hasAnyData = results.some((x) => x.r.origin !== "none");

  const kpi1 = latestValue("KPI1", entityId, periodId);
  const kpi2 = latestValue("KPI2", entityId, periodId);
  const kpi9 = latestValue("KPI9", entityId, periodId);
  const kpi12 = latestValue("KPI12", entityId, periodId);

  const groupSnap = entitySnapshot[entityId] ?? entitySnapshot.HQ;
  const groupTone = STATUS_TONE[groupSnap.status] ?? STATUS_TONE["on-track"];

  const ranked = entities
    .map((e) => ({ e, snap: entitySnapshot[e.id] }))
    .sort((a, b) => b.snap.achievement - a.snap.achievement);
  const best = ranked[0];
  const worst = ranked[ranked.length - 1];
  const offTrack = ranked.filter((r) => r.snap.status !== "on-track");

  return (
    <div>
      <ScreenHeader
        id="MAIN"
        subtitle={
          isRestrictedPillar
            ? `Consolidated performance overview for ${entityName} — scoped to your assigned pillar.`
            : "Consolidated organisational performance overview across the Group."
        }
        onNavigate={onNavigate}
      />

      {/* Hero panel — group status + entity strip */}
      <div
        className="rounded-xl p-5 sm:p-6 mb-5 text-white"
        style={{ background: "linear-gradient(135deg, hsl(213 67% 13%) 0%, hsl(213 60% 18%) 55%, hsl(155 45% 18%) 100%)" }}
      >
        <div className="flex flex-wrap items-start justify-between gap-4 mb-5">
          <div>
            <div className="text-[10px] uppercase tracking-[0.14em] text-[hsl(var(--pk-accent-lt))] font-semibold">
              {isRestrictedPillar ? `${entityName} pillar` : "Group Headquarters · wholly owned by MOF Inc."}
            </div>
            <h1 className="font-head text-2xl sm:text-[28px] font-semibold tracking-tight mt-1">
              {isRestrictedPillar ? `${entityName} Performance` : "Group Performance"}
            </h1>
            <p className="text-[13px] text-white/55 mt-1 max-w-[42ch]">{period.label} reporting · {kpis.length} KPIs tracked across six strategic perspectives.</p>
          </div>
          {!isRestrictedPillar && (
            <div className="flex items-center gap-2.5 rounded-lg bg-white/[0.07] border border-white/15 px-3.5 py-2.5">
              <span className="h-2 w-2 rounded-full shrink-0" style={{ background: groupTone.lt }} />
              <div>
                <div className="text-[10px] uppercase tracking-[0.12em] text-white/45">Group status</div>
                <div className="text-[13px] font-semibold tnum">{overall.toFixed(1)}% · {groupTone.label}</div>
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between mb-2">
          <div className="text-[10px] uppercase tracking-[0.12em] text-white/45">Entity performance snapshot</div>
          {isRestrictedPillar && (
            <span className="flex items-center gap-1.5 text-[11px] text-white/45">
              <Lock className="h-3 w-3" />Other pillars are blurred — outside your assigned scope
            </span>
          )}
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-1 rounded-lg overflow-hidden bg-white/10">
          {entities.map((e) => {
            const snap = entitySnapshot[e.id];
            const active = e.id === entityId;
            const tone = STATUS_TONE[snap.status] ?? STATUS_TONE["on-track"];
            const tile = (
              <button
                key={e.id}
                disabled={pillarLocked}
                onClick={() => setEntityId(e.id)}
                className={cn(
                  "w-full text-left px-3.5 py-3 transition-colors",
                  active ? "bg-white/[0.14]" : "bg-[hsl(213,45%,15%)] hover:bg-white/[0.08]",
                  pillarLocked && !active && "opacity-40 cursor-not-allowed"
                )}
              >
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <span className="text-[10px] uppercase tracking-[0.1em] font-semibold text-white/55 truncate">{e.name}</span>
                  <span className="h-2 w-2 rounded-full shrink-0" style={{ background: tone.lt }} />
                </div>
                <div className="tnum text-xl font-semibold">{snap.achievement.toFixed(1)}%</div>
                <div className="text-[11px] mt-0.5" style={{ color: tone.lt }}>{tone.label}</div>
              </button>
            );
            return (
              <PillarGate key={e.id} restricted={isRestrictedPillar && !active} reason="Not your pillar">
                {tile}
              </PillarGate>
            );
          })}
        </div>
      </div>

      {!isRestrictedPillar && (
        <div className="flex mb-5 rounded-lg border border-[hsl(var(--pk-border))] bg-[hsl(var(--pk-surface))] shadow-card overflow-hidden">
          <div className="w-1 shrink-0" style={{ background: groupTone.rail }} />
          <div className="p-4 sm:p-5 flex-1 min-w-0">
            <div className="flex items-center justify-between gap-3 flex-wrap mb-2">
              <div className="text-[11px] uppercase tracking-[0.14em] text-[hsl(var(--pk-ink-faint))] font-semibold">What the numbers say</div>
              <span
                className="inline-flex items-center gap-1.5 rounded px-2 py-0.5 text-[11px] font-medium border"
                style={{ background: `${groupTone.rail}1a`, color: groupTone.rail, borderColor: `${groupTone.rail}40` }}
              >
                <span className="h-1.5 w-1.5 rounded-full" style={{ background: groupTone.rail }} />
                {isRestrictedPillar ? entityName : "Group"} {groupTone.label.toLowerCase()}
              </span>
            </div>
            <p className="text-[14.5px] sm:text-[15px] leading-relaxed text-[hsl(var(--pk-ink-soft))]">
              {isRestrictedPillar
                ? `${entityName}'s pillar is scoped to KPI 3 sub-metric reporting for this phase of the engagement — see the note below for what's expected.`
                : hasAnyData
                  ? <>Group weighted achievement is <strong className="text-[hsl(var(--pk-ink))]">{overall.toFixed(1)}%</strong> for {period.label}, with <strong className="text-[hsl(var(--pk-ink))]">{met} of {kpis.length}</strong> KPIs met{notMet > 0 ? <> and <strong className="text-[hsl(var(--pk-ink))]">{notMet}</strong> not met</> : ""}{notMeasurable > 0 ? <>; {notMeasurable} not yet measurable this period</> : ""}.</>
                  : <>No submissions have been published yet for {entityName} in {period.label} — switch to an earlier reporting period to see published figures.</>}
            </p>
            {!isRestrictedPillar && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4">
                <div className="border-l-2 pl-3" style={{ borderColor: STATUS_TONE[best.snap.status]?.rail }}>
                  <div className="text-[10px] uppercase tracking-[0.1em] text-[hsl(var(--pk-ink-faint))]">Strongest entity</div>
                  <div className="text-[13.5px] font-semibold text-[hsl(var(--pk-ink))]">{best.e.name}</div>
                  <div className="tnum text-[11px] text-[hsl(var(--pk-ink-faint))]">{best.snap.achievement.toFixed(1)}%</div>
                </div>
                <div className="border-l-2 pl-3" style={{ borderColor: STATUS_TONE[worst.snap.status]?.rail }}>
                  <div className="text-[10px] uppercase tracking-[0.1em] text-[hsl(var(--pk-ink-faint))]">Needs attention</div>
                  <div className="text-[13.5px] font-semibold text-[hsl(var(--pk-ink))]">{worst.e.name}</div>
                  <div className="tnum text-[11px] text-[hsl(var(--pk-ink-faint))]">{worst.snap.achievement.toFixed(1)}%</div>
                </div>
                <div className="border-l-2 pl-3" style={{ borderColor: "hsl(var(--pk-warn))" }}>
                  <div className="text-[10px] uppercase tracking-[0.1em] text-[hsl(var(--pk-ink-faint))]">Below target</div>
                  <div className="text-[13.5px] font-semibold text-[hsl(var(--pk-ink))]">{offTrack.length} of {entities.length} entities</div>
                  <div className="text-[11px] text-[hsl(var(--pk-ink-faint))] truncate">{offTrack.length ? offTrack.map((r) => r.e.name).join(", ") : "None — all on target"}</div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {entityId !== "HQ" && !isRestrictedPillar && (
        <InfoNote>
          Managed Entity screens for {entityName} follow within the 3-month engagement — Group HQ priority 1 is fully modelled first. Figures above are illustrative until {entityName}'s BRS is signed off.
        </InfoNote>
      )}

      {isRestrictedPillar ? (
        <div className="mt-5">
          <NoDataState
            title={`${entityName}'s own dashboards aren't built yet`}
            body={`Corporate Performance, Financial Health and Resource & People above are Group HQ's own scorecard — not ${entityName}'s. ${entityName}'s dedicated modules are scoped for a later phase of this engagement; today, this pillar's job is to keep its KPI 3 sub-metrics current.`}
            action={
              canEnterData ? (
                <button
                  onClick={() => onNavigate("DATA_ENTRY")}
                  className="mt-1 inline-flex items-center gap-1.5 rounded-md bg-[hsl(var(--pk-accent))] text-[hsl(var(--pk-accent-ink))] text-xs font-medium px-3 py-1.5 hover:opacity-90 transition-opacity"
                >
                  <PenLine className="h-3.5 w-3.5" />Go to Data Entry
                </button>
              ) : undefined
            }
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-5">
          <div className="rounded-lg border border-[hsl(var(--pk-border))] bg-[hsl(var(--pk-surface))] shadow-card hover:shadow-floating transition-shadow p-4">
            <div className="grid grid-cols-2 gap-2 mb-3">
              <StatCard label="Total KPIs" value={String(kpis.length)} />
              <StatCard label="KPI Met" value={String(met)} tone="good" />
              <StatCard label="KPI Not Met" value={String(notMet)} tone={notMet > 0 ? "bad" : "default"} />
              <StatCard label="Not Measurable" value={String(notMeasurable)} tone="pending" />
            </div>
            {!hasAnyData && (
              <p className="text-[11.5px] text-[hsl(var(--pk-ink-faint))] mt-2">No submissions published yet for this entity / period.</p>
            )}
          </div>

          <button onClick={() => onNavigate("CP001")} className="group rounded-lg border border-[hsl(var(--pk-border))] bg-[hsl(var(--pk-surface))] shadow-card p-4 text-left hover:border-[hsl(var(--pk-accent))] hover:shadow-floating transition-all flex flex-col items-center">
            <div className="w-full flex items-center justify-between mb-1">
              <span className="flex items-center gap-2 font-head font-semibold text-[hsl(var(--pk-ink))]"><LayoutGrid className="h-4 w-4 text-[hsl(var(--pk-accent))]" />Corporate Performance</span>
              <ChevronRight className="h-4 w-4 text-[hsl(var(--pk-ink-faint))] group-hover:text-[hsl(var(--pk-accent))]" />
            </div>
            <Gauge value={overall} cumulativeThreshold={period.cumulativeThreshold} mofThreshold={period.mofThreshold} size={180} />
            <div className="text-[11px] text-[hsl(var(--pk-ink-faint))] -mt-1">13 KPIs · 6 perspectives</div>
          </button>

          <div className="rounded-lg border border-[hsl(var(--pk-border))] bg-[hsl(var(--pk-surface))] shadow-card hover:shadow-floating transition-shadow p-4 flex flex-col gap-3">
            <button onClick={() => onNavigate("PFH001")} className="group flex items-center justify-between">
              <span className="flex items-center gap-2 font-head font-semibold text-[hsl(var(--pk-ink))]"><Wallet className="h-4 w-4 text-[hsl(var(--pk-accent))]" />Financial Health</span>
              <ChevronRight className="h-4 w-4 text-[hsl(var(--pk-ink-faint))] group-hover:text-[hsl(var(--pk-accent))]" />
            </button>
            <div className="grid grid-cols-2 gap-2">
              <StatCard label="PBT (KPI 1)" value={kpi1.ytdActual !== null ? `RM ${kpi1.ytdActual.toFixed(1)}m` : "—"} tone={kpi1.status === "met" ? "good" : kpi1.status === "not-met" ? "bad" : "default"} />
              <StatCard label="Cost-to-Income" value={kpi2.ytdActual !== null ? `${kpi2.ytdActual.toFixed(1)}%` : "—"} tone={kpi2.status === "met" ? "good" : kpi2.status === "not-met" ? "bad" : "default"} />
            </div>
            <button onClick={() => onNavigate("RP001")} className="group flex items-center justify-between mt-1">
              <span className="flex items-center gap-2 font-head font-semibold text-[hsl(var(--pk-ink))]"><Users2 className="h-4 w-4 text-[hsl(var(--pk-accent))]" />Resource &amp; People</span>
              <ChevronRight className="h-4 w-4 text-[hsl(var(--pk-ink-faint))] group-hover:text-[hsl(var(--pk-accent))]" />
            </button>
            <div className="grid grid-cols-2 gap-2">
              <StatCard label="Recruitment Index" value={kpi9.ytdActual !== null ? `${kpi9.ytdActual.toFixed(1)}%` : "—"} tone={kpi9.status === "met" ? "good" : "default"} />
              <StatCard label="Bumiputera Comp." value={kpi12.ytdActual !== null ? `${kpi12.ytdActual.toFixed(1)}%` : "—"} tone={kpi12.status === "met" ? "good" : "default"} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
