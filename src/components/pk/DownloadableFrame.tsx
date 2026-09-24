import { useRef, useState } from "react";
import { Download, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

export interface DownloadableCsvData {
  headers: string[];
  rows: (string | number | null)[][];
}

function triggerDownload(href: string, filename: string) {
  const a = document.createElement("a");
  a.href = href;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
}

/** Extracts plain rows straight from a `<table>` DOM node — same approach as the screen-level
 * Excel export's table reader, just scoped to one table instead of a whole screen. */
function tableToRows(table: HTMLTableElement): (string | number | null)[][] {
  return Array.from(table.querySelectorAll("tr")).map((tr) =>
    Array.from(tr.querySelectorAll("th, td")).map((cell) => (cell.textContent ?? "").trim().replace(/\s+/g, " "))
  );
}

/**
 * Wraps a single table or chart with a hover-revealed "Download" affordance (upper right) offering
 * JPEG (a screenshot of just this element, via html2canvas) and Excel (a real .xlsx, built via
 * exceljs — see downloadExcel below for why not a plain .csv). The row data either comes from an
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
    // A wide table (e.g. many quarters of columns) sits inside its own horizontally-scrollable
    // wrapper (`.overflow-x-auto`) so it doesn't blow out the page layout. html2canvas faithfully
    // screenshots what's on screen, which means it only captures whatever fits in that wrapper's
    // visible width — anything the viewer would have had to scroll right to see gets silently cut
    // off the exported JPEG (see UAT TC-031). Temporarily lifting the clip before capture, and
    // restoring it after, gets the full table into the image without changing on-screen behaviour.
    const scrollers = Array.from(ref.current.querySelectorAll<HTMLElement>(".overflow-x-auto, .overflow-auto"));
    const restore = scrollers.map((el) => ({ el, overflow: el.style.overflow, width: el.style.width }));
    const frameRestore = { overflow: ref.current.style.overflow, width: ref.current.style.width };
    scrollers.forEach((el) => {
      el.style.overflow = "visible";
      el.style.width = `${el.scrollWidth}px`;
    });
    // Expanding the scrollers can make them wider than `ref.current` itself, which html2canvas
    // measures and clips to independently of its now-wider children — so the wrapper also needs to
    // grow to fit before capture, or the same clipping just happens one level up instead.
    ref.current.style.overflow = "visible";
    ref.current.style.width = `${ref.current.scrollWidth}px`;
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
      restore.forEach(({ el, overflow, width }) => {
        el.style.overflow = overflow;
        el.style.width = width;
      });
      ref.current.style.overflow = frameRestore.overflow;
      ref.current.style.width = frameRestore.width;
      setBusy(false);
    }
  };

  // A plain .csv has no way to record its own text encoding, so Excel — which opens a .csv by
  // double-click far more often than any other app — falls back to guessing (usually Windows-1252),
  // turning any non-ASCII character (the "—" this app uses throughout) into "â€”" mojibake. A .csv
  // also carries no column-width metadata, so Excel's default ~8-character columns leave longer
  // figures visually spilling out of their cell. A real .xlsx sidesteps both: native UTF-8 and
  // columns sized to their content — see UAT TC-020/TC-021.
  const downloadExcel = async () => {
    if (busy) return;
    const table = csvData ? null : ref.current?.querySelector("table");
    const rows = csvData ? [csvData.headers, ...csvData.rows] : table ? tableToRows(table) : null;
    if (!rows || rows.length === 0) {
      toast.error("No table data to export here.");
      return;
    }
    setBusy(true);
    try {
      const { default: ExcelJS } = await import("exceljs");
      const wb = new ExcelJS.Workbook();
      const ws = wb.addWorksheet("Data");
      ws.addRows(rows);
      const headerRow = ws.getRow(1);
      headerRow.font = { bold: true };
      const colCount = Math.max(...rows.map((r) => r.length));
      for (let c = 1; c <= colCount; c++) {
        const widest = rows.reduce((max, r) => Math.max(max, String(r[c - 1] ?? "").length), 0);
        ws.getColumn(c).width = Math.min(Math.max(widest + 2, 10), 60);
      }
      const buffer = await wb.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
      const url = URL.createObjectURL(blob);
      triggerDownload(url, `${filename}.xlsx`);
      URL.revokeObjectURL(url);
    } catch (err) {
      toast.error("Download failed", { description: err instanceof Error ? err.message : "Couldn't build the Excel file." });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div ref={ref} className={cn("relative group/dlframe", className)}>
      {children}
      {/* Post-UAT: JPEG/Excel download switched off app-wide until it's revisited — client asked
       * for the button gone, not just disabled. The handlers above are left in place (and still
       * correct, including the wide-table capture fix) so re-enabling is just deleting this one
       * `false &&` guard, not re-threading every DownloadableFrame call site. */}
      {false && (
      <div
        data-download-frame-control
        // Always visible below `sm` — touch devices only fake :hover on a first tap, which would
        // otherwise cost a mobile user an extra tap just to reveal this before they can use it.
        className="absolute top-1.5 right-1.5 opacity-100 sm:opacity-0 sm:group-hover/dlframe:opacity-100 sm:focus-within:opacity-100 transition-opacity z-10"
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
            <DropdownMenuItem onClick={downloadExcel} className="cursor-pointer text-xs">Download as Excel</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      )}
    </div>
  );
}
