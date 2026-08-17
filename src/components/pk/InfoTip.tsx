import { useState, type ReactNode } from "react";
import * as PopoverPrimitive from "@radix-ui/react-popover";
import { Info } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * A small "i" icon that reveals a calculation/formula explanation on hover or click.
 * Keeps the surrounding UI free of persistent rule paragraphs — the detail is one
 * interaction away instead of always on screen.
 */
export function InfoTip({
  title,
  children,
  className,
  side = "top",
}: {
  title?: string;
  children: ReactNode;
  className?: string;
  side?: "top" | "right" | "bottom" | "left";
}) {
  const [open, setOpen] = useState(false);

  return (
    <PopoverPrimitive.Root open={open} onOpenChange={setOpen}>
      <PopoverPrimitive.Trigger asChild>
        <button
          type="button"
          onMouseEnter={() => setOpen(true)}
          onMouseLeave={() => setOpen(false)}
          onClick={(e) => {
            e.stopPropagation();
            setOpen((o) => !o);
          }}
          aria-label={title ? `Show calculation for ${title}` : "Show calculation"}
          className={cn(
            "inline-flex items-center justify-center h-4 w-4 rounded-full text-[hsl(var(--pk-ink-faint))] hover:text-[hsl(var(--pk-accent))] hover:bg-[hsl(var(--pk-accent-soft))] transition-colors shrink-0",
            className
          )}
        >
          <Info className="h-3.5 w-3.5" />
        </button>
      </PopoverPrimitive.Trigger>
      <PopoverPrimitive.Portal>
        <PopoverPrimitive.Content
          side={side}
          sideOffset={8}
          onMouseEnter={() => setOpen(true)}
          onMouseLeave={() => setOpen(false)}
          className="z-50 w-64 rounded-md border border-[hsl(var(--pk-border))] bg-[hsl(var(--pk-surface))] px-3 py-2.5 text-xs text-[hsl(var(--pk-ink-soft))] shadow-lg data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95"
        >
          {title && <div className="font-semibold text-[hsl(var(--pk-ink))] mb-1">{title}</div>}
          <div className="leading-snug">{children}</div>
          <PopoverPrimitive.Arrow className="fill-[hsl(var(--pk-surface))]" width={10} height={5} />
        </PopoverPrimitive.Content>
      </PopoverPrimitive.Portal>
    </PopoverPrimitive.Root>
  );
}
