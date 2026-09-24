import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Menu, Search, LogIn, LogOut, User, BookOpen } from "lucide-react";
import { Sidebar } from "@/components/layout/Sidebar";
import { CommandPalette } from "@/components/layout/CommandPalette";
import { UPLOADER_ROLES } from "@/components/layout/LoginDialog";
import { NotificationsBell } from "@/components/pk/Misc";
import { InstallAppButton } from "@/components/pk/InstallAppButton";
import { PageNav } from "@/components/pk/PageNav";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useSession } from "@/lib/session";
import { useWorkflow, scopePendingFor } from "@/lib/workflow";
import { useOrgSettings } from "@/lib/orgSettings";
import { cn } from "@/lib/utils";
import { screens, type ScreenId } from "@/lib/nav";
import { entityById } from "@/data/entities";
import { resolveCurrentPeriodId } from "@/data/periods";
import prokhasLogo from "@/assets/prokhas-logo.png";

/** Purely cosmetic: this internal deployment builds a staging bundle and a production bundle
 * from the exact same source against the exact same Supabase project, so nothing in the data
 * distinguishes them — without this, someone could easily mistake one tab for the other. Reads
 * `VITE_APP_ENV` (set per build in `.env.staging` / `.env.production`, see DEPLOY.md), so it
 * renders nothing unless the build was actually made for staging. */
function StagingBanner() {
  if (import.meta.env.VITE_APP_ENV !== "staging") return null;
  return (
    <div className="sticky top-0 z-40 shrink-0 bg-amber-400 text-amber-950 text-center text-2xs font-semibold uppercase tracking-wide py-1">
      Staging environment — not for official reporting
    </div>
  );
}

const PILLAR_NAV: { id: ScreenId; label: string; group: string }[] = [
  { id: "MAIN", label: "Main", group: "main" },
  { id: "CP001", label: "Corporate Performance", group: "cp" },
  { id: "PFH001", label: "Financial Health", group: "fh" },
  { id: "RP001", label: "Resource & People", group: "rp" },
];

/** Top-level pillar switcher, styled as a pill row — lets a guest (no sidebar) or a collapsed-
 * sidebar user jump straight to any pillar's overview from anywhere, one click. Hidden for
 * restricted-pillar logins, same gate the sidebar itself already uses for the CP/FH/RP menu. */
function PillarNav({ current, onNavigate, isRestrictedPillar }: { current: ScreenId; onNavigate: (id: ScreenId) => void; isRestrictedPillar: boolean }) {
  if (isRestrictedPillar) return null;
  const activeGroup = screens[current].group;
  return (
    <div className="hidden lg:flex flex-1 justify-center min-w-0 px-2">
      <div className="flex items-center gap-0.5 rounded-full border border-[hsl(var(--pk-border))] bg-[hsl(var(--pk-surface-2)/0.6)] px-1 py-1">
        {PILLAR_NAV.map((p) => (
          <button
            key={p.id}
            onClick={() => onNavigate(p.id)}
            className={cn(
              "rounded-full px-3 py-1 text-xs font-medium whitespace-nowrap transition-colors",
              activeGroup === p.group
                ? "bg-[hsl(var(--pk-surface))] text-[hsl(var(--pk-accent))] shadow-sm"
                : "text-[hsl(var(--pk-ink-faint))] hover:text-[hsl(var(--pk-ink))]"
            )}
          >
            {p.label}
          </button>
        ))}
      </div>
    </div>
  );
}

/** Always-visible brand mark, doubles as the "back to overview" affordance — the sidebar's
 * own Prokhas mark only exists once logged in, so guests browsing the public dashboards had
 * no persistent way back to Main other than a breadcrumb buried in each screen's content. */
/** The one button that's always a safe, working "reset" — regardless of what screen or which
 * entity's context you're currently viewing, it always lands back on Prokhas' own Main Screen.
 * Previously it only called onNavigate("MAIN"), which is a no-op once already on MAIN — the exact
 * state a Managed Entity drill-down leaves you in (still entityId=that entity), so the button
 * looked "off" and did nothing. It also always renders as active (no disabled-looking state),
 * since it's meant to work as a safety net from anywhere, including when it would be a no-op. */
function BrandHome({ onNavigate }: { onNavigate: (id: ScreenId) => void }) {
  const { entityId, setEntityId } = useSession();
  return (
    <button
      onClick={() => {
        if (entityId !== "HQ") setEntityId("HQ");
        onNavigate("MAIN");
      }}
      title="Back to Performance Dashboard"
      className="flex items-center gap-2 shrink-0 rounded-md pl-1.5 pr-2.5 py-1 -ml-1.5 transition-colors hover:bg-[hsl(var(--pk-surface-2))]"
    >
      <img src={prokhasLogo} alt="Prokhas" className="h-6 w-auto shrink-0" />
      <span className="hidden sm:block leading-tight text-left border-l border-[hsl(var(--pk-border))] pl-2.5 ml-0.5">
        <span className="block text-3xs text-[hsl(var(--pk-ink-faint))]">Performance Dashboard</span>
      </span>
    </button>
  );
}

/** The top bar's account button — a dropdown to quickly switch role (demo convenience, since
 * this prototype has no real identity provider) or sign out, rather than a bare logout button. */
function UserMenu() {
  const { role, roleLabel, userName, login, logout } = useSession();
  const { fiscalYearEndMonth } = useOrgSettings();
  const latestPeriodId = useMemo(() => resolveCurrentPeriodId(new Date(), fiscalYearEndMonth), [fiscalYearEndMonth]);

  const switchRole = (nextRole: typeof UPLOADER_ROLES[number]) => {
    if (nextRole.id === role) return;
    const homeEntity = "HQ" as const;
    login({
      role: nextRole.id,
      userName: userName || "reporting.officer",
      homeEntity,
      periodId: latestPeriodId,
      assignedModule: nextRole.moduleLocked ? entityById(homeEntity).modules[0] : null,
    });
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className="h-8 w-8 shrink-0 rounded-full bg-[hsl(var(--pk-navy))] flex items-center justify-center text-white/85 hover:opacity-90 transition-opacity"
          title={`${userName} · ${roleLabel} — account`}
        >
          <User className="h-4 w-4" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="text-2xs text-[hsl(var(--pk-ink-faint))] font-normal">Switch role</DropdownMenuLabel>
        {UPLOADER_ROLES.map((r) => (
          <DropdownMenuItem key={r.id} disabled={r.id === role} onClick={() => switchRole(r)} className="cursor-pointer">
            {r.label}
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={logout} className="cursor-pointer text-[hsl(var(--pk-bad))]">
          <LogOut className="h-3.5 w-3.5 mr-2" />
          Logout
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function Shell({
  current,
  onNavigate,
  onOpenLogin,
  children,
}: {
  current: ScreenId;
  onNavigate: (id: ScreenId) => void;
  onOpenLogin: () => void;
  children: ReactNode;
}) {
  const { loggedIn, isRestrictedPillar, pillarLocked, entityId, assignedModule, canVerify } = useSession();
  const { pending: allPending } = useWorkflow();
  const pending = canVerify ? scopePendingFor(allPending, { pillarLocked, entityId, assignedModule }) : [];
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const showSidebar = loggedIn && sidebarOpen;

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div className="flex flex-col min-h-screen bg-[hsl(var(--pk-paper))]">
      <StagingBanner />
      <div className="flex flex-1 min-h-0">
      {showSidebar && (
        <Sidebar current={current} onNavigate={onNavigate} mobileOpen onCloseMobile={() => setSidebarOpen(false)} />
      )}
      <div className="flex-1 min-w-0 flex flex-col">
        <div
          className={cn(
            "sticky top-0 z-30 flex items-center justify-between gap-2 px-3 sm:px-4 py-2.5 border-b transition-all duration-200",
            scrolled
              ? "backdrop-blur-md bg-[hsl(var(--pk-surface)/0.85)] border-[hsl(var(--pk-border)/0.7)] shadow-sm"
              : "bg-[hsl(var(--pk-surface))] border-[hsl(var(--pk-border))]"
          )}
        >
          <div className="flex items-center gap-1.5 min-w-0">
            {loggedIn && (
              <button
                onClick={() => setSidebarOpen((v) => !v)}
                className="shrink-0 h-8 w-8 flex items-center justify-center rounded-md text-[hsl(var(--pk-ink-soft))] hover:bg-[hsl(var(--pk-surface-2))] transition-colors"
                title={showSidebar ? "Hide menu" : "Show menu"}
              >
                <Menu className="h-5 w-5" />
              </button>
            )}
            <BrandHome onNavigate={onNavigate} />
          </div>
          <PillarNav current={current} onNavigate={onNavigate} isRestrictedPillar={isRestrictedPillar} />
          <div className="flex items-center gap-2.5 shrink-0">
            <InstallAppButton />
            <button
              onClick={() => onNavigate("GLOSSARY")}
              title="Glossary"
              className="shrink-0 h-8 w-8 flex items-center justify-center rounded-md text-[hsl(var(--pk-ink-soft))] hover:bg-[hsl(var(--pk-surface-2))] transition-colors"
            >
              <BookOpen className="h-4 w-4" />
            </button>
            <button
              onClick={() => setPaletteOpen(true)}
              className="flex items-center gap-1.5 rounded-md border border-[hsl(var(--pk-border))] px-2.5 py-1.5 text-xs text-[hsl(var(--pk-ink-faint))] hover:text-[hsl(var(--pk-ink))] hover:bg-[hsl(var(--pk-surface-2))] transition-colors"
            >
              <Search className="h-3.5 w-3.5 shrink-0" />
              <span className="hidden sm:inline">Search screens…</span>
              <kbd className="hidden sm:inline font-mono-pk text-3xs px-1 rounded border border-[hsl(var(--pk-border))]">⌘K</kbd>
            </button>
            {loggedIn ? (
              <>
                <UserMenu />
                <NotificationsBell count={pending.length} onClick={() => onNavigate("VERIFY_PUBLISH")} />
              </>
            ) : (
              <button
                onClick={onOpenLogin}
                className="flex items-center gap-1.5 rounded-md bg-[hsl(var(--pk-accent))] text-[hsl(var(--pk-accent-ink))] text-xs font-medium px-3 py-1.5 hover:opacity-90 transition-opacity"
              >
                <LogIn className="h-3.5 w-3.5" />Login
              </button>
            )}
          </div>
        </div>
        <main id="screen-content" className="flex-1 px-3.5 sm:px-6 py-4 sm:py-6 max-w-[1180px] w-full mx-auto bg-[hsl(var(--pk-paper))]">{children}</main>
        <div className="px-3.5 sm:px-6 pb-4 sm:pb-6 max-w-[1180px] w-full mx-auto bg-[hsl(var(--pk-paper))]">
          <PageNav current={current} onNavigate={onNavigate} />
        </div>
        <footer className="shrink-0 border-t border-[hsl(var(--pk-border))] px-3.5 sm:px-6 py-3 text-center text-2xs text-[hsl(var(--pk-ink-faint))]">
          Designed by Operational Excellence Department (OED) &middot; Prokhas Sdn Bhd
        </footer>
      </div>
      </div>
      <CommandPalette open={paletteOpen} onOpenChange={setPaletteOpen} onNavigate={onNavigate} />
    </div>
  );
}
