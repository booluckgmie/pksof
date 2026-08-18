import { useState, type ReactNode } from "react";
import { Menu } from "lucide-react";
import { Sidebar } from "@/components/layout/Sidebar";
import type { ScreenId } from "@/lib/nav";

export function Shell({ current, onNavigate, children }: { current: ScreenId; onNavigate: (id: ScreenId) => void; children: ReactNode }) {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-[hsl(var(--pk-paper))]">
      <Sidebar current={current} onNavigate={onNavigate} mobileOpen={mobileNavOpen} onCloseMobile={() => setMobileNavOpen(false)} />
      <div className="flex-1 min-w-0 flex flex-col">
        <div className="shrink-0 border-b border-[hsl(var(--pk-border))] bg-[hsl(var(--pk-surface))] flex items-center px-3 py-2.5 lg:hidden">
          <button
            onClick={() => setMobileNavOpen(true)}
            className="shrink-0 h-8 w-8 -ml-1 flex items-center justify-center rounded-md text-[hsl(var(--pk-ink-soft))] hover:bg-[hsl(var(--pk-surface-2))] transition-colors"
            title="Open menu"
          >
            <Menu className="h-5 w-5" />
          </button>
        </div>
        <main id="screen-content" className="flex-1 px-3.5 sm:px-6 py-4 sm:py-6 max-w-[1180px] w-full mx-auto bg-[hsl(var(--pk-paper))]">{children}</main>
      </div>
    </div>
  );
}
