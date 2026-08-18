import { useState, type ReactNode } from "react";
import { toast } from "sonner";
import { Download, RefreshCw, Bell, ChevronRight, Info, FileText, Presentation, Sheet, Loader2 } from "lucide-react";
import { breadcrumbTrail, screenLabel, type ScreenId } from "@/lib/nav";
import { cn } from "@/lib/utils";
import { useSession } from "@/lib/session";
import { periodById } from "@/data/periods";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { exportScreenAsExcel, exportScreenAsPdf, exportScreenAsPptx } from "@/lib/exportReport";

export function StatusLegend() {
  const items: { label: string; color: string }[] = [
    { label: "Completed", color: "hsl(var(--pk-good))" },
    { label: "In Progress", color: "hsl(var(--pk-navy))" },
    { label: "Planned", color: "hsl(var(--pk-warn))" },
    { label: "Delayed", color: "hsl(var(--pk-bad))" },
    { label: "On Hold", color: "hsl(var(--pk-pending))" },
  ];
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[11px] text-[hsl(var(--pk-ink-faint))]">
      {items.map((it) => (
        <span key={it.label} className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full" style={{ background: it.color }} />
          {it.label}
        </span>
      ))}
    </div>
  );
}

export function InitiativeStatusDot({ status }: { status: string }) {
  const c =
    status === "Completed" ? "hsl(var(--pk-good))"
    : status === "In Progress" ? "hsl(var(--pk-navy))"
    : status === "Planned" ? "hsl(var(--pk-warn))"
    : status === "Delayed" ? "hsl(var(--pk-bad))"
    : "hsl(var(--pk-pending))";
  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-medium" style={{ color: c }}>
      <span className="h-1.5 w-1.5 rounded-full" style={{ background: c }} />
      {status}
    </span>
  );
}

export function StatCard({ label, value, sub, tone, rail }: { label: string; value: string; sub?: string; tone?: "good" | "bad" | "pending" | "default"; rail?: boolean }) {
  const color =
    tone === "good" ? "hsl(var(--pk-good))" : tone === "bad" ? "hsl(var(--pk-bad))" : tone === "pending" ? "hsl(var(--pk-pending))" : "hsl(var(--pk-ink))";
  return (
    <div
      className={cn(
        "rounded-lg border border-[hsl(var(--pk-border))] bg-[hsl(var(--pk-surface))] shadow-card px-4 py-3 transition-shadow hover:shadow-floating",
        rail && "border-l-2"
      )}
      style={rail ? { borderLeftColor: color } : undefined}
    >
      <div className="text-[10px] uppercase tracking-[0.1em] text-[hsl(var(--pk-ink-faint))] font-semibold">{label}</div>
      <div className="tnum text-xl font-semibold mt-0.5" style={{ color }}>{value}</div>
      {sub && <div className="text-[11px] text-[hsl(var(--pk-ink-faint))] mt-0.5">{sub}</div>}
    </div>
  );
}

type ExportFormat = "pdf" | "pptx" | "excel" | "pdf-compact" | "pptx-compact";

const EXPORT_FORMATS: { format: ExportFormat; label: string; description: string; icon: typeof FileText }[] = [
  { format: "pdf", label: "Export as PDF", description: "Branded report — cover page + full snapshot", icon: FileText },
  { format: "pptx", label: "Export as PowerPoint", description: "Same report as slides", icon: Presentation },
  { format: "excel", label: "Export as Excel", description: "Raw tables from this screen", icon: Sheet },
];

const COMPACT_EXPORT_FORMATS: { format: ExportFormat; label: string; description: string; icon: typeof FileText }[] = [
  { format: "pdf-compact", label: "PDF (Compact)", description: "Smaller file, lower resolution — easier to email", icon: FileText },
  { format: "pptx-compact", label: "PowerPoint (Compact)", description: "Smaller file, lower resolution — easier to email", icon: Presentation },
];

export function ExportMenu({ screenId, label = "Export" }: { screenId: ScreenId; label?: string }) {
  const { entityName, periodId } = useSession();
  const [pending, setPending] = useState<ExportFormat | null>(null);

  const runExport = async (format: ExportFormat) => {
    if (pending) return;
    setPending(format);
    const ctx = { screenId, screenLabel: screenLabel(screenId, entityName), entityName, periodLabel: periodById(periodId).label };
    try {
      if (format === "pdf") await exportScreenAsPdf(ctx);
      else if (format === "pdf-compact") await exportScreenAsPdf(ctx, { compact: true });
      else if (format === "pptx") await exportScreenAsPptx(ctx);
      else if (format === "pptx-compact") await exportScreenAsPptx(ctx, { compact: true });
      else await exportScreenAsExcel(ctx);
      const formatLabel = format.startsWith("pptx") ? "PowerPoint" : format.startsWith("pdf") ? "PDF" : "Excel";
      toast.success(`${ctx.screenLabel} exported`, { description: `Saved as ${formatLabel}${format.endsWith("-compact") ? " (compact)" : ""}.` });
    } catch (err) {
      toast.error("Export failed", { description: err instanceof Error ? err.message : "Something went wrong generating the file." });
    } finally {
      setPending(null);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          disabled={pending !== null}
          className="inline-flex items-center gap-1.5 rounded-md border border-[hsl(var(--pk-border))] bg-[hsl(var(--pk-surface))] px-2.5 py-1.5 text-xs font-medium text-[hsl(var(--pk-ink-soft))] hover:bg-[hsl(var(--pk-surface-2))] transition-colors disabled:opacity-60"
        >
          {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}
          {label}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        {EXPORT_FORMATS.map(({ format, label: itemLabel, description, icon: Icon }) => (
          <DropdownMenuItem key={format} onClick={() => runExport(format)} className="gap-2.5 py-2 cursor-pointer">
            <Icon className="h-4 w-4 text-[hsl(var(--pk-accent))] shrink-0" />
            <div className="flex flex-col">
              <span className="text-[13px] font-medium">{itemLabel}</span>
              <span className="text-[11px] text-[hsl(var(--pk-ink-faint))]">{description}</span>
            </div>
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuLabel className="text-[10px] uppercase tracking-[0.08em] text-[hsl(var(--pk-ink-faint))] font-semibold px-2 py-1">
          Smaller file size
        </DropdownMenuLabel>
        {COMPACT_EXPORT_FORMATS.map(({ format, label: itemLabel, description, icon: Icon }) => (
          <DropdownMenuItem key={format} onClick={() => runExport(format)} className="gap-2.5 py-2 cursor-pointer">
            <Icon className="h-4 w-4 text-[hsl(var(--pk-ink-faint))] shrink-0" />
            <div className="flex flex-col">
              <span className="text-[13px] font-medium">{itemLabel}</span>
              <span className="text-[11px] text-[hsl(var(--pk-ink-faint))]">{description}</span>
            </div>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function RefreshButton({ onClick }: { onClick?: () => void }) {
  return (
    <button
      onClick={() => {
        onClick?.();
        toast.success("Dashboard refreshed", { description: "Figures reflect the latest Published data." });
      }}
      className="inline-flex items-center gap-1.5 rounded-md border border-[hsl(var(--pk-border))] bg-[hsl(var(--pk-surface))] px-2.5 py-1.5 text-xs font-medium text-[hsl(var(--pk-ink-soft))] hover:bg-[hsl(var(--pk-surface-2))] transition-colors"
    >
      <RefreshCw className="h-3.5 w-3.5" />
      Refresh
    </button>
  );
}

export function NotificationsBell({ count = 0 }: { count?: number }) {
  return (
    <button
      onClick={() => toast("Notifications", { description: count ? `${count} item(s) awaiting your action.` : "You're all caught up." })}
      className="relative inline-flex items-center justify-center rounded-md border border-[hsl(var(--pk-border))] bg-[hsl(var(--pk-surface))] h-8 w-8 hover:bg-[hsl(var(--pk-surface-2))] transition-colors"
    >
      <Bell className="h-4 w-4 text-[hsl(var(--pk-ink-soft))]" />
      {count > 0 && (
        <span className="absolute -top-1 -right-1 h-4 min-w-4 px-0.5 rounded-full bg-[hsl(var(--pk-bad))] text-white text-[9px] font-bold flex items-center justify-center">
          {count}
        </span>
      )}
    </button>
  );
}

export function Breadcrumb({ current, onNavigate }: { current: ScreenId; onNavigate: (id: ScreenId) => void }) {
  const trail = breadcrumbTrail(current);
  const { entityName } = useSession();
  return (
    <div className="flex items-center flex-wrap gap-1 text-xs text-[hsl(var(--pk-ink-faint))]">
      {trail.map((s, i) => (
        <span key={s.id} className="flex items-center gap-1">
          {i > 0 && <ChevronRight className="h-3 w-3" />}
          <button
            onClick={() => onNavigate(s.id)}
            className={cn(
              "hover:text-[hsl(var(--pk-accent))] transition-colors",
              i === trail.length - 1 && "text-[hsl(var(--pk-ink))] font-medium pointer-events-none"
            )}
          >
            {screenLabel(s.id, entityName)}
          </button>
        </span>
      ))}
    </div>
  );
}

export function LevelPill({ level }: { level: string }) {
  return (
    <span className="font-mono-pk text-[10px] px-1.5 py-0.5 rounded border border-[hsl(var(--pk-border))] text-[hsl(var(--pk-navy))] bg-[hsl(var(--pk-navy-soft))]">
      {level}
    </span>
  );
}

export function ProgressBar({ value, max, label }: { value: number; max: number; label?: string }) {
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0;
  return (
    <div>
      <div className="h-2.5 rounded-full bg-[hsl(var(--pk-surface-2))] overflow-hidden">
        <div className="h-full rounded-full bg-[hsl(var(--pk-accent))] transition-all" style={{ width: `${pct}%` }} />
      </div>
      {label && <div className="text-[11px] text-[hsl(var(--pk-ink-faint))] mt-1">{label}</div>}
    </div>
  );
}

export function InfoNote({ children }: { children: ReactNode }) {
  return (
    <div className="flex gap-2 rounded-md border border-[hsl(var(--pk-border))] bg-[hsl(var(--pk-surface-2))] px-3 py-2 text-xs text-[hsl(var(--pk-ink-soft))]">
      <Info className="h-3.5 w-3.5 shrink-0 mt-0.5 text-[hsl(var(--pk-accent))]" />
      <div>{children}</div>
    </div>
  );
}
