import { useState, type ReactNode } from "react";
import { Menu, Search, LogIn, LogOut } from "lucide-react";
import { Sidebar } from "@/components/layout/Sidebar";
import { CommandPalette } from "@/components/layout/CommandPalette";
import { useSession } from "@/lib/session";
import type { ScreenId } from "@/lib/nav";

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
  const { loggedIn, userName, roleLabel, logout } = useSession();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const showSidebar = loggedIn && sidebarOpen;

  return (
    <div className="flex min-h-screen bg-[hsl(var(--pk-paper))]">
      {showSidebar && (
        <Sidebar current={current} onNavigate={onNavigate} mobileOpen onCloseMobile={() => setSidebarOpen(false)} />
      )}
      <div className="flex-1 min-w-0 flex flex-col">
        <div className="shrink-0 border-b border-[hsl(var(--pk-border))] bg-[hsl(var(--pk-surface))] flex items-center justify-between gap-2 px-3 sm:px-4 py-2.5">
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
          </div>
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
