import { useEffect, useState, type ReactNode } from "react";
import { Menu, Search, LogIn, LogOut, LayoutGrid } from "lucide-react";
import { Sidebar } from "@/components/layout/Sidebar";
import { CommandPalette } from "@/components/layout/CommandPalette";
import { useSession } from "@/lib/session";
import { cn } from "@/lib/utils";
import { screens, type ScreenId } from "@/lib/nav";

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
              "rounded-full px-3 py-1 text-[12px] font-medium whitespace-nowrap transition-colors",
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
 * own Group HQ mark only exists once logged in, so guests browsing the public dashboards had
 * no persistent way back to Main other than a breadcrumb buried in each screen's content. */
function BrandHome({ current, onNavigate }: { current: ScreenId; onNavigate: (id: ScreenId) => void }) {
  const onMain = current === "MAIN";
  return (
    <button
      onClick={() => onNavigate("MAIN")}
      title="Back to Main Screen"
      className={cn(
        "flex items-center gap-2 shrink-0 rounded-md pl-1.5 pr-2.5 py-1 -ml-1.5 transition-colors",
        onMain ? "cursor-default" : "hover:bg-[hsl(var(--pk-surface-2))]"
      )}
    >
      <span className="h-7 w-7 shrink-0 rounded-md bg-[hsl(var(--pk-navy))] flex items-center justify-center">
        <LayoutGrid className="h-3.5 w-3.5 text-[hsl(var(--pk-accent-lt))]" />
      </span>
      <span className="leading-tight text-left">
        <span className="block font-head font-semibold text-[13.5px] tracking-tight text-[hsl(var(--pk-ink))]">
          Group <span className="text-[hsl(var(--pk-accent))]">HQ</span>
        </span>
        <span className="hidden sm:block text-[10px] text-[hsl(var(--pk-ink-faint))] -mt-0.5">Performance Dashboard</span>
      </span>
    </button>
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
  const { loggedIn, userName, roleLabel, logout, isRestrictedPillar } = useSession();
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
    <div className="flex min-h-screen bg-[hsl(var(--pk-paper))]">
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
            <BrandHome current={current} onNavigate={onNavigate} />
          </div>
          <PillarNav current={current} onNavigate={onNavigate} isRestrictedPillar={isRestrictedPillar} />
          <div className="flex items-center gap-2.5 shrink-0">
            <button
              onClick={() => setPaletteOpen(true)}
              className="flex items-center gap-1.5 rounded-md border border-[hsl(var(--pk-border))] px-2.5 py-1.5 text-[12px] text-[hsl(var(--pk-ink-faint))] hover:text-[hsl(var(--pk-ink))] hover:bg-[hsl(var(--pk-surface-2))] transition-colors"
            >
              <Search className="h-3.5 w-3.5 shrink-0" />
              <span className="hidden sm:inline">Search screens…</span>
              <kbd className="hidden sm:inline font-mono-pk text-[10px] px-1 rounded border border-[hsl(var(--pk-border))]">⌘K</kbd>
            </button>
            {loggedIn ? (
              <button
                onClick={logout}
                className="flex items-center gap-1.5 text-[12px] text-[hsl(var(--pk-ink-faint))] hover:text-[hsl(var(--pk-ink))] transition-colors"
                title="Sign out"
              >
                <span className="hidden sm:inline truncate max-w-[160px]">{userName} · {roleLabel}</span>
                <LogOut className="h-4 w-4 shrink-0" />
              </button>
            ) : (
              <button
                onClick={onOpenLogin}
                className="flex items-center gap-1.5 rounded-md bg-[hsl(var(--pk-accent))] text-[hsl(var(--pk-accent-ink))] text-[12.5px] font-medium px-3 py-1.5 hover:opacity-90 transition-opacity"
              >
                <LogIn className="h-3.5 w-3.5" />Login
              </button>
            )}
          </div>
        </div>
        <main id="screen-content" className="flex-1 px-3.5 sm:px-6 py-4 sm:py-6 max-w-[1180px] w-full mx-auto bg-[hsl(var(--pk-paper))]">{children}</main>
      </div>
      <CommandPalette open={paletteOpen} onOpenChange={setPaletteOpen} onNavigate={onNavigate} />
    </div>
  );
}
