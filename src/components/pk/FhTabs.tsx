import { fhNav, screens } from "@/lib/nav";
import type { ScreenId } from "@/lib/nav";
import { cn } from "@/lib/utils";

export function FhTabs({ current, onNavigate }: { current: ScreenId; onNavigate: (id: ScreenId) => void }) {
  return (
    <div className="flex items-center gap-1 border-b border-[hsl(var(--pk-border))] mb-5 overflow-x-auto">
      {fhNav.map((id) => (
        <button
          key={id}
          onClick={() => onNavigate(id)}
          className={cn(
            "px-3.5 py-2 text-[13px] font-medium whitespace-nowrap border-b-2 -mb-px transition-colors",
            current === id
              ? "border-[hsl(var(--pk-accent))] text-[hsl(var(--pk-accent))]"
              : "border-transparent text-[hsl(var(--pk-ink-faint))] hover:text-[hsl(var(--pk-ink))]"
          )}
        >
          {screens[id].label}
        </button>
      ))}
    </div>
  );
}
