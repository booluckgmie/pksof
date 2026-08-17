import type { ReactNode } from "react";
import { Lock } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Wraps content that belongs to a pillar other than the signed-in user's own.
 * When `restricted`, the content is blurred and unselectable, with a small
 * lock badge explaining why — the data still renders (so layout stays intact)
 * but nothing in it is legible or copyable.
 */
export function PillarGate({
  restricted,
  reason = "Outside your assigned pillar",
  className,
  badgeClassName,
  children,
}: {
  restricted: boolean;
  reason?: string;
  className?: string;
  badgeClassName?: string;
  children: ReactNode;
}) {
  if (!restricted) return <>{children}</>;
  return (
    <div className={cn("relative", className)}>
      <div className="blur-[4px] opacity-45 select-none pointer-events-none grayscale-[35%]" aria-hidden="true">
        {children}
      </div>
      <div className="absolute inset-0 flex items-center justify-center px-2">
        <span
          className={cn(
            "flex items-center gap-1.5 rounded-full bg-[hsl(var(--pk-ink))] text-white text-[10.5px] font-medium px-2.5 py-1 shadow whitespace-nowrap",
            badgeClassName
          )}
        >
          <Lock className="h-3 w-3 shrink-0" />
          {reason}
        </span>
      </div>
    </div>
  );
}

/** Row-safe variant: blurs in place (no absolute overlay) so it stays valid inside a <tr>. */
export function pillarRowClass(restricted: boolean) {
  return restricted ? "blur-[3px] opacity-45 select-none" : "";
}
