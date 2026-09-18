import { useRef, useState } from "react";
import { Download, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

export interface DownloadableCsvData {
  headers: string[];
  rows: (string | number | null)[][];
}

function csvEscape(value: string): string {
  return /[",\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;
}

function rowsToCsv(rows: (string | number | null)[][]): string {
  return rows.map((row) => row.map((cell) => csvEscape(cell === null || cell === undefined ? "" : String(cell))).join(",")).join("\n");
}

function triggerDownload(href: string, filename: string) {
  const a = document.createElement("a");
  a.href = href;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
}

/** Extracts a plain-text CSV straight from a `<table>` DOM node — same approach as the screen-
 * level Excel export's table reader, just scoped to one table instead of a whole screen. */
function tableToCsvRows(table: HTMLTableElement): (string | number | null)[][] {
  return Array.from(table.querySelectorAll("tr")).map((tr) =>
    Array.from(tr.querySelectorAll("th, td")).map((cell) => (cell.textContent ?? "").trim().replace(/\s+/g, " "))
  );
}

/**
 * Wraps a single table or chart with a hover-revealed "Download" affordance (upper right) offering
 * JPEG (a screenshot of just this element, via html2canvas) and CSV. CSV either comes from an
 * explicit `csvData` prop (needed for charts — there's no `<table>` DOM to read from) or, when
 * omitted, is read straight from the first `<table>` found inside — so wrapping an existing table
 * component needs no extra plumbing.
 */
export function DownloadableFrame({
  children,
  filename,
  csvData,
  className,
}: {
  children: React.ReactNode;
  /** Base filename, no extension — a timestamp-free name is fine since the browser dedupes. */
  filename: string;
  csvData?: DownloadableCsvData;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [busy, setBusy] = useState(false);

  const downloadJpeg = async () => {
    if (!ref.current || busy) return;
    setBusy(true);
    try {
      const html2canvas = (await import("html2canvas")).default;
      const canvas = await html2canvas(ref.current, {
        backgroundColor: "#ffffff",
        scale: 2,
        useCORS: true,
        ignoreElements: (el) => el.hasAttribute("data-download-frame-control"),
      });
      triggerDownload(canvas.toDataURL("image/jpeg", 0.92), `${filename}.jpeg`);
    } catch (err) {
      toast.error("Download failed", { description: err instanceof Error ? err.message : "Couldn't capture this as an image." });
    } finally {
      setBusy(false);
    }
  };

  const downloadCsv = () => {
    const table = csvData ? null : ref.current?.querySelector("table");
    const rows = csvData ? [csvData.headers, ...csvData.rows] : table ? tableToCsvRows(table) : null;
    if (!rows || rows.length === 0) {
      toast.error("No table data to export here.");
      return;
    }
    const blob = new Blob([rowsToCsv(rows)], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    triggerDownload(url, `${filename}.csv`);
    URL.revokeObjectURL(url);
  };

  return (
    <div ref={ref} className={cn("relative group/dlframe", className)}>
      {children}
      <div
        data-download-frame-control
        className="absolute top-1.5 right-1.5 opacity-0 group-hover/dlframe:opacity-100 focus-within:opacity-100 transition-opacity z-10"
      >
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              disabled={busy}
              title="Download"
              className="inline-flex items-center justify-center h-6 w-6 rounded-md border border-[hsl(var(--pk-border))] bg-[hsl(var(--pk-surface))] text-[hsl(var(--pk-ink-faint))] shadow-sm hover:text-[hsl(var(--pk-accent))] hover:bg-[hsl(var(--pk-surface-2))] transition-colors disabled:opacity-60"
            >
              {busy ? <Loader2 className="h-3 w-3 animate-spin" /> : <Download className="h-3 w-3" />}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-40">
            <DropdownMenuItem onClick={downloadJpeg} className="cursor-pointer text-xs">Download as JPEG</DropdownMenuItem>
            <DropdownMenuItem onClick={downloadCsv} className="cursor-pointer text-xs">Download as CSV</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
