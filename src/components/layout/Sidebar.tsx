import {
  LayoutGrid, TrendingUp, Landmark, ShieldCheck, Users, Workflow, GraduationCap, Handshake,
  Wallet, ClipboardList, FileText, Scale, ArrowLeftRight, User, IdCard, LogOut, PenLine, CheckSquare, Lock, X,
  Settings as SettingsIcon, BookUser, BookOpen,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { cpNav, fhNav, rpNav, screens, type ScreenId } from "@/lib/nav";
import { useSession } from "@/lib/session";
import { entities } from "@/data/entities";
import { periods } from "@/data/periods";

const CP_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  CP001: LayoutGrid, CP002: ClipboardList, CP003: Landmark, CP004: ShieldCheck,
  CP005: Users, CP006: Workflow, CP007: GraduationCap, CP008: Handshake, CP009: BookUser,
};
const FH_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  PFH001: Wallet, PFH002: TrendingUp, PFH003: Scale, PFH004: FileText, PFH005: ArrowLeftRight,
};
const RP_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  RP001: Users, RP001A: IdCard, RP002: ClipboardList, RP003: TrendingUp, RP004: GraduationCap,
};

function NavTag({ id, icon: Icon, active, onClick }: { id: ScreenId; icon: React.ComponentType<{ className?: string }>; active: boolean; onClick: () => void }) {
  const s = screens[id];
  return (
    <button
      onClick={onClick}
      title={s.label}
      className={cn(
        "flex w-full items-center gap-2.5 rounded-md pl-2.5 pr-2.5 py-1.5 text-left transition-colors border-l-2",
        active
          ? "bg-white/10 text-white border-[hsl(var(--pk-accent-lt))]"
          : "text-white/55 hover:text-white/90 hover:bg-white/5 border-transparent"
      )}
    >
      <Icon className="h-3.5 w-3.5 shrink-0" />
      <span className="text-[13px] truncate">{s.label}</span>
    </button>
  );
}

function TagRow({ ids, icons, current, onNavigate }: { ids: ScreenId[]; icons: Record<string, React.ComponentType<{ className?: string }>>; current: ScreenId; onNavigate: (id: ScreenId) => void }) {
  return (
    <div className="flex flex-col gap-0.5 px-2">
      {ids.map((id) => (
        <NavTag key={id} id={id} icon={icons[id]} active={current === id} onClick={() => onNavigate(id)} />
      ))}
    </div>
  );
}

function GroupLabel({ children }: { children: React.ReactNode }) {
  return <div className="px-2.5 pt-4 pb-1 text-[10px] uppercase tracking-[0.12em] text-white/35 font-semibold">{children}</div>;
}

/** Entity + reporting period pickers, moved into the sidebar so they read as global session context rather than a per-page filter. */
function SidebarFilters({ current }: { current: ScreenId }) {
  const { entityId, setEntityId, periodId, setPeriodId, pillarLocked, entityName } = useSession();
  const fyGroups = Array.from(new Set(periods.map((p) => p.fy)));
  const onMain = current === "MAIN";
  // Managed Entities have no data yet, so there's nothing real to pick — a dropdown of
  // disabled options is just noise. Only render a real <select> once more than one entity
  // actually has something behind it.
  const selectableEntities = entities.filter((e) => e.id === "HQ");
  const hasChoice = selectableEntities.length > 1;

  return (
    <div className="px-4 py-3 border-b border-white/10 flex flex-col gap-2.5 shrink-0">
      <div>
        <div className="text-[10px] uppercase tracking-wide text-white/40 font-semibold mb-1">Entity</div>
        {pillarLocked ? (
          <div className="flex items-center gap-1.5 text-sm font-medium text-white">
            <Lock className="h-3 w-3 text-white/40 shrink-0" />
            <span className="truncate">{entityName}</span>
          </div>
        ) : onMain ? (
          <>
            <div className="text-sm font-medium text-white truncate">{entityName}</div>
            <p className="text-[10.5px] text-white/35 mt-1 leading-snug">Main shows the Group rollup — switch entity from within a perspective screen.</p>
          </>
        ) : hasChoice ? (
          <>
            <select
              value={entityId}
              onChange={(e) => setEntityId(e.target.value as never)}
              className="w-full bg-white/5 border border-white/10 rounded-md px-2 py-1.5 text-sm font-medium text-white outline-none cursor-pointer focus:border-white/30"
            >
              {selectableEntities.map((e) => (
                <option key={e.id} value={e.id} className="text-[hsl(var(--pk-ink))]">{e.name}</option>
              ))}
            </select>
            <p className="text-[10.5px] text-white/35 mt-1 leading-snug">Managed Entities join once their own figures are seeded.</p>
          </>
        ) : (
          <>
            <div className="text-sm font-medium text-white truncate">{entityName}</div>
            <p className="text-[10.5px] text-white/35 mt-1 leading-snug">Managed Entities join once their own figures are seeded.</p>
          </>
        )}
      </div>

      <div>
        <div className="text-[10px] uppercase tracking-wide text-white/40 font-semibold mb-1">Reporting Period</div>
        <select
          value={periodId}
          onChange={(e) => setPeriodId(e.target.value as never)}
          className="w-full bg-white/5 border border-white/10 rounded-md px-2 py-1.5 text-sm font-medium text-white outline-none cursor-pointer focus:border-white/30"
        >
          {fyGroups.map((fy) => (
            <optgroup key={fy} label={fy} className="text-[hsl(var(--pk-ink))]">
              {periods.filter((p) => p.fy === fy).map((p) => (
                <option key={p.id} value={p.id} className="text-[hsl(var(--pk-ink))]">{p.label}</option>
              ))}
            </optgroup>
          ))}
        </select>
      </div>
    </div>
  );
}

export function Sidebar({
  current,
  onNavigate,
  mobileOpen = false,
  onCloseMobile,
}: {
  current: ScreenId;
  onNavigate: (id: ScreenId) => void;
  mobileOpen?: boolean;
  onCloseMobile?: () => void;
}) {
  const { role, roleLabel, userName, canEnterData, canVerify, logout, isRestrictedPillar, homeEntityName } = useSession();
  // "Main/admin users" get the full perspective submenu; "normal" upload/verify roles get a
  // slim sidebar (Main + their own Data Governance items) — they can still reach every screen
  // as a guest would, via Main's own subpage dropdowns, without the full tree taking up space.
  const isAdminTier = role === "admin" || role === "checker";

  // Navigating does NOT auto-close the sidebar — Shell now mounts/unmounts the whole sidebar
  // for its persistent show/hide toggle, and treating every nav click as a "close" would hide
  // it after the very first click. Closing is an explicit action: the X button or backdrop tap
  // below, or the hamburger toggle in Shell's topbar.
  const navigate = (id: ScreenId) => {
    onNavigate(id);
  };

  return (
    <>
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={onCloseMobile}
          aria-hidden="true"
        />
      )}
      <aside
        className={cn(
          "w-72 sm:w-64 shrink-0 h-screen flex flex-col bg-[hsl(var(--pk-navy))] text-white",
          "border-t-2 border-[hsl(var(--pk-accent))]",
          "fixed inset-y-0 left-0 z-50 transition-transform duration-200 lg:sticky lg:top-0 lg:translate-x-0",
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex items-center gap-2.5 px-4 h-14 border-b border-white/10 shrink-0">
          <div className="leading-tight flex-1 min-w-0">
            <div className="font-head font-semibold text-[16px] tracking-tight">
              Group <span className="text-[hsl(var(--pk-accent-lt))]">HQ</span>
            </div>
            <div className="text-[10px] text-white/40 -mt-0.5 tracking-wide">Group Performance Dashboard</div>
          </div>
          <button onClick={onCloseMobile} className="text-white/50 hover:text-white transition-colors shrink-0 lg:hidden" title="Close menu">
            <X className="h-5 w-5" />
          </button>
        </div>

        <SidebarFilters current={current} />

        <nav className="flex-1 overflow-y-auto px-0 pb-4">
          <div className="pt-3 px-2">
            <NavTag id="MAIN" icon={LayoutGrid} active={current === "MAIN"} onClick={() => navigate("MAIN")} />
          </div>

          {isRestrictedPillar ? (
            <div className="mx-2 mt-4 rounded-md border border-white/10 border-l-2 border-l-[hsl(var(--pk-warn-lt))] bg-white/5 px-2.5 py-2.5">
              <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-[0.12em] text-white/45 font-semibold">
                <Lock className="h-3 w-3" />Scoped to {homeEntityName}
              </div>
              <p className="text-[11.5px] text-white/55 mt-1.5 leading-snug">
                {`Corporate Performance, Financial Health and Resource & People are Group HQ's own dashboards — not part of ${homeEntityName}'s pillar. ${homeEntityName}'s own modules are scoped for a later phase of this engagement.`}
              </p>
            </div>
          ) : isAdminTier ? (
            <>
              <GroupLabel>Corporate Performance</GroupLabel>
              <TagRow ids={cpNav} icons={CP_ICONS} current={current} onNavigate={navigate} />

              <GroupLabel>Financial Health</GroupLabel>
              <TagRow ids={fhNav} icons={FH_ICONS} current={current} onNavigate={navigate} />

              <GroupLabel>Resource &amp; People</GroupLabel>
              <TagRow ids={rpNav} icons={RP_ICONS} current={current} onNavigate={navigate} />
            </>
          ) : (
            <div className="mx-2 mt-4 rounded-md border border-white/10 bg-white/5 px-2.5 py-2.5">
              <p className="text-[11.5px] text-white/55 leading-snug">
                The full screen menu is available to System Administrator and PMO & Administrator roles. You can still open any dashboard screen without signing in — sign out to browse them.
              </p>
            </div>
          )}

          {(canEnterData || canVerify || role === "admin") && (
            <>
              <GroupLabel>Data Governance</GroupLabel>
              <div className="flex flex-col gap-1 px-2">
                {canEnterData && <NavTag id="DATA_ENTRY" icon={PenLine} active={current === "DATA_ENTRY"} onClick={() => navigate("DATA_ENTRY")} />}
                {canVerify && <NavTag id="VERIFY_PUBLISH" icon={CheckSquare} active={current === "VERIFY_PUBLISH"} onClick={() => navigate("VERIFY_PUBLISH")} />}
                {role === "admin" && <NavTag id="SETTINGS" icon={SettingsIcon} active={current === "SETTINGS"} onClick={() => navigate("SETTINGS")} />}
              </div>
            </>
          )}

          <GroupLabel>Reference</GroupLabel>
          <div className="flex flex-col gap-1 px-2">
            <NavTag id="GLOSSARY" icon={BookOpen} active={current === "GLOSSARY"} onClick={() => navigate("GLOSSARY")} />
          </div>
        </nav>

        <div className="border-t border-white/10 p-3 flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-full bg-white/10 flex items-center justify-center shrink-0">
            <User className="h-4 w-4 text-white/70" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-[12.5px] font-medium truncate">{userName}</div>
            <div className="text-[10.5px] text-white/45 truncate">{roleLabel}</div>
          </div>
          <button onClick={logout} className="text-white/45 hover:text-white transition-colors shrink-0" title="Sign out">
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </aside>
    </>
  );
}
