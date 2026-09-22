import { useState } from "react";
import { toast } from "sonner";
import { FileDown, FileText, Presentation, Loader2 } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { exportScreenAsPdf, exportScreenAsPptx } from "@/lib/exportReport";

type ReportFormat = "pdf" | "pptx";

const REPORT_FORMATS: { format: ReportFormat; label: string; icon: typeof FileText }[] = [
  { format: "pdf", label: "Download as PDF", icon: FileText },
  { format: "pptx", label: "Download as PowerPoint", icon: Presentation },
];

/**
 * A compact "download the whole pillar's report" affordance for Main.tsx's three pillar cards —
 * distinct from ScreenHeader's per-screen ExportMenu, which only ever exports the one screen
 * currently on view. `bundleScreenId` is one of the pseudo screen-ids exportReport.ts maps to a
 * full off-screen module bundle (CP_PILLAR_REPORT_ID / "PFH001" / RP_PILLAR_REPORT_ID) — see
 * exportReport.ts's PILLAR_BUNDLES. `pillarLabel` is passed explicitly rather than derived from
 * screenLabel() because the bundle's entry screen doesn't always carry a pillar-level title
 * (RP001's own label is KPI9-specific, not "Resource & People" — see nav.ts's breadcrumbLabel).
 */
export function PillarReportButton({
  bundleScreenId,
  pillarLabel,
  entityName,
  periodLabel,
}: {
  bundleScreenId: string;
  pillarLabel: string;
  entityName: string;
  periodLabel: string;
}) {
  const [pending, setPending] = useState<ReportFormat | null>(null);

  const runExport = async (format: ReportFormat) => {
    if (pending) return;
    setPending(format);
    const ctx = { screenId: bundleScreenId, screenLabel: pillarLabel, entityName, periodLabel };
    try {
      if (format === "pdf") await exportScreenAsPdf(ctx);
      else await exportScreenAsPptx(ctx);
      toast.success(`${pillarLabel} report exported`, { description: `Saved as ${format === "pdf" ? "PDF" : "PowerPoint"}.` });
    } catch (err) {
      toast.error("Report export failed", { description: err instanceof Error ? err.message : "Something went wrong generating the file." });
    } finally {
      setPending(null);
    }
  };

  return (
    <div className="flex items-center justify-end pt-1 -mb-1">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          {/* Styled as a real bordered button, not a faint caption link — UAT (TC-016/TC-017)
           * found this easy to miss entirely when it was just small faint text. */}
          <button
            disabled={pending !== null}
            title={`Download full ${pillarLabel} report`}
            className="inline-flex items-center gap-1.5 rounded-md border border-[hsl(var(--pk-border))] bg-[hsl(var(--pk-surface))] px-2.5 py-1.5 text-2xs font-medium text-[hsl(var(--pk-ink-soft))] hover:text-[hsl(var(--pk-accent))] hover:border-[hsl(var(--pk-accent))] hover:bg-[hsl(var(--pk-surface-2))] transition-colors disabled:opacity-60"
          >
            {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <FileDown className="h-3.5 w-3.5" />}
            Full report
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-52">
          {REPORT_FORMATS.map(({ format, label, icon: Icon }) => (
            <DropdownMenuItem key={format} onClick={() => runExport(format)} className="gap-2 cursor-pointer text-xs">
              <Icon className="h-3.5 w-3.5 text-[hsl(var(--pk-accent))] shrink-0" />
              {label}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
