import { useState } from "react";
import { cn } from "@/lib/utils";

/** Options adapt to how much history is actually available — see DurationFilterBar. */
export const DURATION_OPTIONS = [
  { id: "2q", label: "Last 2Q", n: 2 },
  { id: "4q", label: "Last 4Q", n: 4 },
  { id: "8q", label: "Last 8Q", n: 8 },
  { id: "12q", label: "Last 12Q", n: 12 },
  { id: "all", label: "All", n: Infinity },
] as const;
export type DurationId = (typeof DURATION_OPTIONS)[number]["id"];

/** Slices the tail of a chronological (oldest→newest) array to the selected duration window. */
export function useDurationFilter<T>(data: T[], initial: DurationId = "8q") {
  const [duration, setDuration] = useState<DurationId>(initial);
  const n = DURATION_OPTIONS.find((d) => d.id === duration)!.n;
  const filtered = data.slice(Math.max(0, data.length - n));
  return { duration, setDuration, filtered } as const;
}

export function DurationFilterBar({
  duration,
  onChange,
  total,
  label = "Trend duration",
  className,
}: {
  duration: DurationId;
  onChange: (id: DurationId) => void;
  /** Total periods available — options that wouldn't narrow anything are hidden. */
  total: number;
  label?: string;
  className?: string;
}) {
  const options = DURATION_OPTIONS.filter((d) => d.n === Infinity || d.n < total);
  if (options.length <= 1) return null;
  return (
    <div className={cn("flex items-center gap-1.5 flex-wrap", className)}>
      {label && <span className="text-[11px] text-[hsl(var(--pk-ink-faint))] mr-1">{label}</span>}
      {options.map((d) => (
        <button
          key={d.id}
          onClick={() => onChange(d.id)}
          className={cn(
            "text-[11px] px-2.5 py-1 rounded-md border transition-colors",
            duration === d.id
              ? "bg-[hsl(var(--pk-accent))] text-[hsl(var(--pk-accent-ink))] border-[hsl(var(--pk-accent))]"
              : "border-[hsl(var(--pk-border))] text-[hsl(var(--pk-ink-soft))] hover:bg-[hsl(var(--pk-surface-2))]"
          )}
        >
          {d.label}
        </button>
      ))}
    </div>
  );
}
