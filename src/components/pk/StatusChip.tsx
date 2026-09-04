import { cn } from "@/lib/utils";
import type { KpiStatus } from "@/types";

const MAP: Record<string, { label: string; cls: string; dot: string }> = {
  met: { label: "Met", cls: "bg-[hsl(var(--pk-good-soft))] text-[hsl(var(--pk-good))]", dot: "bg-[hsl(var(--pk-good))]" },
  "not-met": { label: "Not Met", cls: "bg-[hsl(var(--pk-bad-soft))] text-[hsl(var(--pk-bad))]", dot: "bg-[hsl(var(--pk-bad))]" },
  "not-measurable": { label: "Not Measurable", cls: "bg-[hsl(var(--pk-pending-soft))] text-[hsl(var(--pk-pending))]", dot: "bg-[hsl(var(--pk-pending))]" },
  warn: { label: "Attention", cls: "bg-[hsl(var(--pk-warn-soft))] text-[hsl(var(--pk-warn))]", dot: "bg-[hsl(var(--pk-warn))]" },
};

export function StatusChip({ status, label, className, dotOnly }: { status: KpiStatus | "warn"; label?: string; className?: string; dotOnly?: boolean }) {
  const m = MAP[status] ?? MAP["not-measurable"];
  if (dotOnly) {
    return <span className={cn("inline-block h-2 w-2 rounded-full", m.dot, className)} title={label ?? m.label} />;
  }
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap", m.cls, className)}>
      <span className={cn("h-1.5 w-1.5 rounded-full", m.dot)} />
      {label ?? m.label}
    </span>
  );
}

const WF_MAP: Record<string, { label: string; cls: string; dot: string }> = {
  submitted: { label: "Submitted", cls: "bg-[hsl(var(--pk-navy-soft))] text-[hsl(var(--pk-navy))]", dot: "bg-[hsl(var(--pk-navy))]" },
  published: { label: "Published", cls: "bg-[hsl(var(--pk-good-soft))] text-[hsl(var(--pk-good))]", dot: "bg-[hsl(var(--pk-good))]" },
  rejected: { label: "Rejected", cls: "bg-[hsl(var(--pk-bad-soft))] text-[hsl(var(--pk-bad))]", dot: "bg-[hsl(var(--pk-bad))]" },
};

export function WorkflowChip({ status, className }: { status: "submitted" | "published" | "rejected"; className?: string }) {
  const m = WF_MAP[status];
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap", m.cls, className)}>
      <span className={cn("h-1.5 w-1.5 rounded-full", m.dot)} />
      {m.label}
    </span>
  );
}
