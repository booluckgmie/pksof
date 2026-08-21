import { useState } from "react";
import { LayoutGrid, Wallet, Users2, ChevronRight, ChevronDown, PenLine } from "lucide-react";
import { ScreenHeader } from "@/components/pk/ScreenHeader";
import { Gauge } from "@/components/pk/Gauge";
import { StatCard } from "@/components/pk/Misc";
import { InfoNote } from "@/components/pk/Misc";
import { NoDataState } from "@/components/pk/DataOrigin";
import { cpNav, fhNav, rpNav, screens, type ScreenId } from "@/lib/nav";
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

/** Collapsed by default so the Main screen stays compact as more sub-pages/wording get added —
 * expand to jump straight into any L2/L3 screen under this pillar without going via its hub. */
function SubpageDropdown({ ids, onNavigate }: { ids: ScreenId[]; onNavigate: (id: ScreenId) => void }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="mt-1 -mx-1">
      <button
        onClick={(e) => { e.stopPropagation(); setOpen((o) => !o); }}
        className="flex items-center gap-1 px-1 py-1 text-[11px] text-[hsl(var(--pk-ink-faint))] hover:text-[hsl(var(--pk-ink))] transition-colors"
      >
        <ChevronDown className={cn("h-3 w-3 transition-transform", open && "rotate-180")} />
        {open ? "Hide sections" : `View ${ids.length} sections`}
      </button>
      {open && (
        <div className="flex flex-col mt-0.5 rounded-md border border-[hsl(var(--pk-border))] overflow-hidden">
          {ids.map((id) => (
            <button
              key={id}
              onClick={(e) => { e.stopPropagation(); onNavigate(id); }}
              className="flex items-center justify-between px-2.5 py-1.5 text-[12px] text-left text-[hsl(var(--pk-ink-soft))] hover:bg-[hsl(var(--pk-surface-2))] hover:text-[hsl(var(--pk-ink))] transition-colors border-t border-[hsl(var(--pk-border))] first:border-t-0"
            >
              <span className="truncate">{screens[id].label}</span>
              <ChevronRight className="h-3 w-3 shrink-0 text-[hsl(var(--pk-ink-faint))]" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export function Main({ onNavigate }: { onNavigate: (id: ScreenId) => void }) {
  const { entityId, periodId, isRestrictedPillar, entityName, canEnterData } = useSession();
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

  // Main shows at most 3 entities — the Group's own scorecard plus its top 2 by achievement,
  // rather than every entity in the portfolio. Figures are illustrative until each entity's
  // BRS is signed off (see the InfoNote below).
  const topEntities = entities
    .map((e) => ({ e, snap: entitySnapshot[e.id] }))
    .sort((a, b) => (a.e.id === "HQ" ? -1 : b.e.id === "HQ" ? 1 : b.snap.achievement - a.snap.achievement))
    .slice(0, 3);

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
      </div>

      {!isRestrictedPillar && (
        <div className="rounded-lg border border-[hsl(var(--pk-border))] bg-[hsl(var(--pk-surface))] shadow-card hover:shadow-floating transition-shadow p-4 mb-5">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <StatCard label="Total KPIs" value={String(kpis.length)} />
            <StatCard label="KPI Met" value={String(met)} tone="good" />
            <StatCard label="KPI Not Met" value={String(notMet)} tone={notMet > 0 ? "bad" : "default"} />
            <StatCard label="Not Measurable" value={String(notMeasurable)} tone="pending" />
          </div>
          {!hasAnyData && (
            <p className="text-[11.5px] text-[hsl(var(--pk-ink-faint))] mt-2">No submissions published yet for this entity / period.</p>
          )}
        </div>
      )}

      {!isRestrictedPillar && (
        <div className="rounded-lg border border-[hsl(var(--pk-border))] bg-[hsl(var(--pk-surface))] shadow-card p-4 mb-5">
          <div className="text-[11px] uppercase tracking-[0.12em] text-[hsl(var(--pk-ink-faint))] font-semibold mb-2.5">Entity Snapshot</div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            {topEntities.map(({ e, snap }) => {
              const tone = STATUS_TONE[snap.status] ?? STATUS_TONE["on-track"];
              return (
                <div key={e.id} className="rounded-md border border-[hsl(var(--pk-border))] px-3.5 py-3">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="text-[12.5px] font-semibold text-[hsl(var(--pk-ink))] truncate">{e.name}</span>
                    <span className="h-2 w-2 rounded-full shrink-0" style={{ background: tone.lt }} />
                  </div>
                  <div className="tnum text-xl font-semibold text-[hsl(var(--pk-ink))]">{snap.achievement.toFixed(1)}%</div>
                  <div className="text-[11px]" style={{ color: tone.rail }}>{tone.label}</div>
                </div>
              );
            })}
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-5 items-start">
          <div className="rounded-lg border border-[hsl(var(--pk-border))] bg-[hsl(var(--pk-surface))] shadow-card hover:shadow-floating transition-shadow p-4">
            <button onClick={() => onNavigate("CP001")} className="group w-full flex flex-col items-center text-left">
              <div className="w-full flex items-center justify-between mb-1">
                <span className="flex items-center gap-2 font-head font-semibold text-[hsl(var(--pk-ink))]"><LayoutGrid className="h-4 w-4 text-[hsl(var(--pk-accent))]" />Corporate Performance</span>
                <ChevronRight className="h-4 w-4 text-[hsl(var(--pk-ink-faint))] group-hover:text-[hsl(var(--pk-accent))]" />
              </div>
              <Gauge value={overall} cumulativeThreshold={period.cumulativeThreshold} mofThreshold={period.mofThreshold} size={180} />
              <div className="text-[11px] text-[hsl(var(--pk-ink-faint))] -mt-1">13 KPIs · 6 perspectives</div>
            </button>
            <SubpageDropdown ids={cpNav} onNavigate={onNavigate} />
          </div>

          <div className="rounded-lg border border-[hsl(var(--pk-border))] bg-[hsl(var(--pk-surface))] shadow-card hover:shadow-floating transition-shadow p-4 flex flex-col gap-3">
            <button onClick={() => onNavigate("PFH001")} className="group flex items-center justify-between">
              <span className="flex items-center gap-2 font-head font-semibold text-[hsl(var(--pk-ink))]"><Wallet className="h-4 w-4 text-[hsl(var(--pk-accent))]" />Financial Health</span>
              <ChevronRight className="h-4 w-4 text-[hsl(var(--pk-ink-faint))] group-hover:text-[hsl(var(--pk-accent))]" />
            </button>
            <div className="grid grid-cols-2 gap-2">
              <StatCard label="PBT (KPI 1)" value={kpi1.ytdActual !== null ? `RM ${kpi1.ytdActual.toFixed(1)}m` : "—"} tone={kpi1.status === "met" ? "good" : kpi1.status === "not-met" ? "bad" : "default"} />
              <StatCard label="Cost-to-Income" value={kpi2.ytdActual !== null ? `${kpi2.ytdActual.toFixed(1)}%` : "—"} tone={kpi2.status === "met" ? "good" : kpi2.status === "not-met" ? "bad" : "default"} />
            </div>
            <SubpageDropdown ids={fhNav} onNavigate={onNavigate} />
          </div>

          <div className="rounded-lg border border-[hsl(var(--pk-border))] bg-[hsl(var(--pk-surface))] shadow-card hover:shadow-floating transition-shadow p-4 flex flex-col gap-3">
            <button onClick={() => onNavigate("RP001")} className="group flex items-center justify-between">
              <span className="flex items-center gap-2 font-head font-semibold text-[hsl(var(--pk-ink))]"><Users2 className="h-4 w-4 text-[hsl(var(--pk-accent))]" />Resource &amp; People</span>
              <ChevronRight className="h-4 w-4 text-[hsl(var(--pk-ink-faint))] group-hover:text-[hsl(var(--pk-accent))]" />
            </button>
            <div className="grid grid-cols-2 gap-2">
              <StatCard label="Recruitment Index" value={kpi9.ytdActual !== null ? `${kpi9.ytdActual.toFixed(1)}%` : "—"} tone={kpi9.status === "met" ? "good" : "default"} />
              <StatCard label="Bumiputera Comp." value={kpi12.ytdActual !== null ? `${kpi12.ytdActual.toFixed(1)}%` : "—"} tone={kpi12.status === "met" ? "good" : "default"} />
            </div>
            <SubpageDropdown ids={rpNav} onNavigate={onNavigate} />
          </div>
        </div>
      )}
    </div>
  );
}
