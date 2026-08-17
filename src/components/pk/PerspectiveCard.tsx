import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

export function PerspectiveCard({
  name,
  weight,
  achievement,
  kpiCount,
  onOpen,
}: {
  name: string;
  weight: number;
  achievement: number | null;
  kpiCount: number;
  onOpen: () => void;
}) {
  const status = achievement === null ? "pending" : achievement >= 80 ? "good" : achievement >= 50 ? "warn" : "bad";
  const barColor =
    status === "good" ? "hsl(var(--pk-good))" : status === "warn" ? "hsl(var(--pk-warn))" : status === "bad" ? "hsl(var(--pk-bad))" : "hsl(var(--pk-pending))";

  return (
    <button
      onClick={onOpen}
      className={cn(
        "group text-left rounded-lg border border-[hsl(var(--pk-border))] bg-[hsl(var(--pk-surface))] shadow-card",
        "p-4 flex flex-col gap-2.5 hover:border-[hsl(var(--pk-accent))] hover:shadow-md transition-all"
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="text-[11px] uppercase tracking-wide text-[hsl(var(--pk-ink-faint))]">Weight {(weight * 100).toFixed(1)}%</div>
          <div className="font-head text-[15px] font-semibold text-[hsl(var(--pk-ink))] leading-snug mt-0.5">{name}</div>
        </div>
        <ChevronRight className="h-4 w-4 text-[hsl(var(--pk-ink-faint))] group-hover:text-[hsl(var(--pk-accent))] group-hover:translate-x-0.5 transition-all shrink-0 mt-1" />
      </div>
      <div className="flex items-end justify-between">
        <div className="tnum font-head text-2xl font-semibold" style={{ color: barColor }}>
          {achievement === null ? "—" : `${achievement.toFixed(1)}%`}
        </div>
        <div className="text-[11px] text-[hsl(var(--pk-ink-faint))]">{kpiCount} KPI{kpiCount !== 1 ? "s" : ""}</div>
      </div>
      <div className="h-1.5 rounded-full bg-[hsl(var(--pk-surface-2))] overflow-hidden">
        <div className="h-full rounded-full" style={{ width: `${Math.min(100, achievement ?? 0)}%`, background: barColor }} />
      </div>
    </button>
  );
}
