// Report export (PDF / PPTX / Excel) for the current screen.
//
// Visual language follows the client's own Q1 2026 CKPI/MEC report decks (uploaded
// reference files): white background, bold blue ALL-CAPS section titles, a thin
// green-to-blue gradient rule under the header, "Strictly Confidential" + copyright
// footer with page numbers, and a wordmark top-right — "Group HQ" here since the app
// itself is generic (see the de-branding pass in git history), not the client's logo.
//
// PDF/PPTX both wrap a full-resolution screenshot of the live screen (html2canvas) in
// that branded cover + header/footer chrome, so every one of the 19 screens gets a
// real, current-data export without a bespoke layout per screen. Excel instead scrapes
// the screen's own <table> elements — those already hold clean tabular data.

const NAVY_HEX = "0B2159"; // pptxgenjs / manual hex, no '#'
const TITLE_BLUE_HEX = "0B2FA0";
const ACCENT_EMERALD_HEX = "10B981";
const INK_FAINT_HEX = "6C7D88";
const GRADIENT_STOPS_HEX = ["10B981", "2E8F8E", "3E6FAE", "0B2FA0"]; // emerald -> navy, approximates the reference's gradient rule

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

function timestamp() {
  const d = new Date();
  return `${pad2(d.getDate())} ${d.toLocaleString("en-US", { month: "long" })} ${d.getFullYear()}, ${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
}

function filenameFor(screenLabel: string, ext: string, suffix = "") {
  const slug = screenLabel.replace(/[^a-z0-9]+/gi, "_").replace(/^_+|_+$/g, "");
  const d = new Date();
  const stamp = `${d.getFullYear()}${pad2(d.getMonth() + 1)}${pad2(d.getDate())}`;
  return `GroupHQ_${slug}_${stamp}${suffix}.${ext}`;
}

export interface ExportContext {
  screenId: string;
  screenLabel: string;
  entityName: string;
  periodLabel: string;
}

export interface ExportOptions {
  /** Smaller file, lower resolution — trades icon/text crispness for a file that's easy to email. */
  compact?: boolean;
}

interface QualitySettings {
  scale: number;
  format: "PNG" | "JPEG";
  jpegQuality?: number;
  maxSlicePx: number;
}

// Standard: fixed high capture scale (not the display's devicePixelRatio, which is 1 on
// most desktop monitors) — this is what actually determines icon/text sharpness once the
// image is placed at print size; the old scale of ~1.5-2 combined with JPEG compression
// was what crushed thin lucide-icon strokes into faint outlines. Slices are lossless PNG,
// capped short so a tall screen spans more pages rather than losing detail to stay short.
//
// Compact: lower scale + lossy JPEG — a fraction of the file size, still legible, meant
// for emailing/sharing rather than printing. Slices can run much taller per page since
// there's no PNG size pressure, so page count stays closer to what it was originally.
const STANDARD_QUALITY: QualitySettings = { scale: 2, format: "PNG", maxSlicePx: 2200 };
const COMPACT_QUALITY: QualitySettings = { scale: 1.25, format: "JPEG", jpegQuality: 0.7, maxSlicePx: 4500 };

// (html2canvas's `foreignObjectRendering` option looked like a more direct fidelity fix —
// it routes the capture through the browser's own SVG rasterizer instead of html2canvas's
// manual DOM painter — but it corrupts the capture for this layout: cropped/misaligned
// output, not just lower fidelity. Left off; scale + format below is the safe lever.)

async function captureContent(scale: number): Promise<{ canvas: HTMLCanvasElement }> {
  const el = document.getElementById("screen-content");
  if (!el) throw new Error("Could not find the screen content to export.");
  const html2canvas = (await import("html2canvas")).default;
  const canvas = await html2canvas(el, {
    backgroundColor: "#ffffff",
    scale,
    useCORS: true,
    windowWidth: el.scrollWidth,
    windowHeight: el.scrollHeight,
  });
  return { canvas };
}

function canvasSlice(canvas: HTMLCanvasElement, offsetPx: number, sliceH: number, quality: QualitySettings): string {
  const sliceCanvas = document.createElement("canvas");
  sliceCanvas.width = canvas.width;
  sliceCanvas.height = sliceH;
  const sctx = sliceCanvas.getContext("2d")!;
  if (quality.format === "JPEG") {
    sctx.fillStyle = "#ffffff";
    sctx.fillRect(0, 0, sliceCanvas.width, sliceCanvas.height);
  }
  sctx.drawImage(canvas, 0, offsetPx, canvas.width, sliceH, 0, 0, canvas.width, sliceH);
  return quality.format === "JPEG"
    ? sliceCanvas.toDataURL("image/jpeg", quality.jpegQuality)
    : sliceCanvas.toDataURL("image/png");
}

// ---------- PDF ----------

export async function exportScreenAsPdf(ctx: ExportContext, options: ExportOptions = {}): Promise<void> {
  const quality = options.compact ? COMPACT_QUALITY : STANDARD_QUALITY;
  const { jsPDF } = await import("jspdf");
  const { canvas } = await captureContent(quality.scale);

  const doc = new jsPDF({ orientation: "landscape", unit: "pt", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const margin = 36;
  let page = 1;

  const drawGradientRule = (y: number) => {
    const segW = pageW / GRADIENT_STOPS_HEX.length;
    GRADIENT_STOPS_HEX.forEach((hex, i) => {
      doc.setFillColor(hex);
      doc.rect(i * segW, y, segW + 1, 3, "F");
    });
  };

  const drawFooter = () => {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(INK_FAINT_HEX);
    doc.text("Strictly Confidential", margin, pageH - 18);
    doc.text(`Copyright © Group HQ. All rights reserved.  [ ${page} ]`, pageW - margin, pageH - 18, { align: "right" });
  };

  const drawWordmark = (x: number, y: number) => {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.setTextColor(NAVY_HEX);
    const groupW = doc.getTextWidth("Group ");
    doc.text("Group ", x, y);
    doc.setTextColor(ACCENT_EMERALD_HEX);
    doc.text("HQ", x + groupW, y);
  };

  // Cover page
  drawWordmark(pageW - margin - 60, margin + 14);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(30);
  doc.setTextColor(TITLE_BLUE_HEX);
  const titleLines = doc.splitTextToSize(ctx.screenLabel, pageW - margin * 2 - 200);
  doc.text(titleLines, margin, pageH / 2 - 60);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(13);
  doc.setTextColor(NAVY_HEX);
  const subY = pageH / 2 - 60 + titleLines.length * 34 + 20;
  doc.text(`${ctx.entityName}  ·  ${ctx.periodLabel} reporting`, margin, subY);

  doc.setDrawColor(TITLE_BLUE_HEX);
  doc.setLineWidth(1);
  doc.line(margin, subY + 16, margin + 360, subY + 16);

  doc.setFontSize(10);
  doc.setTextColor(INK_FAINT_HEX);
  doc.text(`Generated ${timestamp()}`, margin, pageH - 60);
  doc.text("Strictly Confidential", margin, pageH - 44);
  drawGradientRule(pageH - 6);

  // Content pages — the screenshot, split to fit as many pages as needed
  const contentTop = margin + 50;
  const contentW = pageW - margin * 2;
  const usablePageH = pageH - contentTop - 40;
  const pxPerPt = canvas.width / contentW;
  const sliceHeightPx = Math.min(Math.floor(usablePageH * pxPerPt), quality.maxSlicePx);
  let offsetPx = 0;

  while (offsetPx < canvas.height) {
    doc.addPage();
    page += 1;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.setTextColor(TITLE_BLUE_HEX);
    doc.text(ctx.screenLabel.toUpperCase(), margin, margin + 8);
    drawWordmark(pageW - margin - 60, margin + 6);
    drawGradientRule(margin + 18);

    const sliceH = Math.min(sliceHeightPx, canvas.height - offsetPx);
    const sliceImg = canvasSlice(canvas, offsetPx, sliceH, quality);
    const sliceHpt = (sliceH * contentW) / canvas.width;
    doc.addImage(sliceImg, quality.format, margin, contentTop, contentW, sliceHpt);

    drawFooter();
    offsetPx += sliceHeightPx;
  }

  doc.save(filenameFor(ctx.screenLabel, "pdf", options.compact ? "_compact" : ""));
}

// ---------- PPTX ----------

export async function exportScreenAsPptx(ctx: ExportContext, options: ExportOptions = {}): Promise<void> {
  const quality = options.compact ? COMPACT_QUALITY : STANDARD_QUALITY;
  const PptxGenJS = (await import("pptxgenjs")).default;
  const { canvas } = await captureContent(quality.scale);

  const pres = new PptxGenJS();
  pres.layout = "LAYOUT_WIDE"; // 13.33in x 7.5in, matches the reference decks' 960x540pt slides

  const slideW = 13.33;
  const slideH = 7.5;
  const margin = 0.45;

  const addGradientRule = (slide: import("pptxgenjs").default.PresSlide, y: number) => {
    const segW = slideW / GRADIENT_STOPS_HEX.length;
    GRADIENT_STOPS_HEX.forEach((hex, i) => {
      slide.addShape("rect", { x: i * segW, y, w: segW + 0.02, h: 0.03, fill: { color: hex }, line: { type: "none" } });
    });
  };

  const addFooter = (slide: import("pptxgenjs").default.PresSlide, pageNum: number) => {
    slide.addText("Strictly Confidential", {
      x: margin, y: slideH - 0.35, w: 3, h: 0.25, fontSize: 8, color: INK_FAINT_HEX, fontFace: "Arial", margin: 0,
    });
    slide.addText(`Copyright © Group HQ. All rights reserved.  [ ${pageNum} ]`, {
      x: slideW - 3.5 - margin, y: slideH - 0.35, w: 3.5, h: 0.25, fontSize: 8, color: INK_FAINT_HEX, fontFace: "Arial", align: "right", margin: 0,
    });
  };

  const addWordmark = (slide: import("pptxgenjs").default.PresSlide, y: number) => {
    slide.addText(
      [
        { text: "Group ", options: { color: NAVY_HEX, bold: true } },
        { text: "HQ", options: { color: ACCENT_EMERALD_HEX, bold: true } },
      ],
      { x: slideW - margin - 1.4, y, w: 1.4, h: 0.3, fontSize: 16, fontFace: "Arial", align: "right", margin: 0 }
    );
  };

  // Cover slide
  const cover = pres.addSlide();
  cover.background = { color: "FFFFFF" };
  addWordmark(cover, margin);
  cover.addText(ctx.screenLabel, {
    x: margin, y: slideH / 2 - 1.1, w: slideW - margin * 2 - 2, h: 1.4,
    fontSize: 32, bold: true, color: TITLE_BLUE_HEX, fontFace: "Arial", valign: "top", margin: 0,
  });
  cover.addText(`${ctx.entityName}  ·  ${ctx.periodLabel} reporting`, {
    x: margin, y: slideH / 2 + 0.35, w: slideW - margin * 2, h: 0.4,
    fontSize: 15, color: NAVY_HEX, fontFace: "Arial", margin: 0,
  });
  cover.addShape("line", { x: margin, y: slideH / 2 + 0.85, w: 4.5, h: 0, line: { color: TITLE_BLUE_HEX, width: 1 } });
  cover.addText(`Generated ${timestamp()}\nStrictly Confidential`, {
    x: margin, y: slideH - 1.1, w: 4, h: 0.6, fontSize: 10, color: INK_FAINT_HEX, fontFace: "Arial", margin: 0, lineSpacingMultiple: 1.3,
  });
  addGradientRule(cover, slideH - 0.05);

  // Content slides — the screenshot, split across as many slides as needed
  const contentTop = 1.1;
  const contentW = slideW - margin * 2;
  const usableSlideH = slideH - contentTop - 0.55;
  const pxPerIn = canvas.width / contentW;
  const sliceHeightPx = Math.min(Math.floor(usableSlideH * pxPerIn), quality.maxSlicePx);
  let offsetPx = 0;
  let pageNum = 1;

  while (offsetPx < canvas.height) {
    pageNum += 1;
    const slide = pres.addSlide();
    slide.background = { color: "FFFFFF" };

    slide.addText(ctx.screenLabel.toUpperCase(), {
      x: margin, y: 0.25, w: slideW - margin * 2 - 1.6, h: 0.45,
      fontSize: 18, bold: true, color: TITLE_BLUE_HEX, fontFace: "Arial", margin: 0,
    });
    addWordmark(slide, 0.28);
    addGradientRule(slide, 0.78);

    const sliceH = Math.min(sliceHeightPx, canvas.height - offsetPx);
    const sliceImg = canvasSlice(canvas, offsetPx, sliceH, quality);
    const sliceHIn = (sliceH * contentW) / canvas.width;
    slide.addImage({ data: sliceImg, x: margin, y: contentTop, w: contentW, h: sliceHIn });

    addFooter(slide, pageNum);
    offsetPx += sliceHeightPx;
  }

  await pres.writeFile({ fileName: filenameFor(ctx.screenLabel, "pptx", options.compact ? "_compact" : "") });
}

// Flattens an HTML table into a rectangular grid, repeating a cell's text into every
// slot its rowSpan/colSpan covers — without this, grouped tables (e.g. a "Perspective"
// column spanning several KPI rows) shift every following column out of alignment.
function tableToGrid(table: HTMLTableElement): string[][] {
  const htmlRows = Array.from(table.rows);
  const grid: string[][] = htmlRows.map(() => []);
  const occupied = new Set<string>(); // "r,c" keys already filled by an earlier span

  htmlRows.forEach((row, r) => {
    let c = 0;
    Array.from(row.cells).forEach((cell) => {
      while (occupied.has(`${r},${c}`)) c += 1;
      const text = (cell as HTMLTableCellElement).innerText.trim();
      const rowSpan = cell.rowSpan || 1;
      const colSpan = cell.colSpan || 1;
      for (let dr = 0; dr < rowSpan; dr++) {
        for (let dc = 0; dc < colSpan; dc++) {
          const rr = r + dr;
          const cc = c + dc;
          if (rr >= grid.length) continue;
          grid[rr][cc] = dr === 0 && dc === 0 ? text : "";
          occupied.add(`${rr},${cc}`);
        }
      }
      c += colSpan;
    });
  });

  return grid;
}

// ---------- Excel ----------

export async function exportScreenAsExcel(ctx: ExportContext): Promise<void> {
  const XLSX = await import("xlsx");
  const el = document.getElementById("screen-content");
  if (!el) throw new Error("Could not find the screen content to export.");

  const wb = XLSX.utils.book_new();

  const summary = XLSX.utils.aoa_to_sheet([
    ["Group Performance Dashboard — Export"],
    [],
    ["Screen", ctx.screenLabel],
    ["Entity", ctx.entityName],
    ["Reporting period", ctx.periodLabel],
    ["Generated", timestamp()],
    ["Classification", "Strictly Confidential"],
  ]);
  summary["!cols"] = [{ wch: 18 }, { wch: 50 }];
  XLSX.utils.book_append_sheet(wb, summary, "Summary");

  const tables = Array.from(el.querySelectorAll("table"));
  if (tables.length === 0) {
    const note = XLSX.utils.aoa_to_sheet([["This screen has no tabular data to export — see the PDF/PPT export for a full visual snapshot instead."]]);
    XLSX.utils.book_append_sheet(wb, note, "Data");
  } else {
    const usedNames = new Set<string>();
    tables.forEach((table, i) => {
      const caption = table.querySelector("caption")?.textContent?.trim();
      const heading = table.closest("section, div")?.querySelector("h1, h2, h3")?.textContent?.trim();
      let name = (caption || heading || `Table ${i + 1}`).replace(/[[\]:\\/?*]/g, " ").trim().slice(0, 28) || `Table ${i + 1}`;
      let suffix = 2;
      const base = name;
      while (usedNames.has(name)) {
        name = `${base.slice(0, 28 - String(suffix).length - 1)} ${suffix}`;
        suffix += 1;
      }
      usedNames.add(name);

      const rows = tableToGrid(table);
      const sheet = XLSX.utils.aoa_to_sheet(rows);
      XLSX.utils.book_append_sheet(wb, sheet, name);
    });
  }

  XLSX.writeFile(wb, filenameFor(ctx.screenLabel, "xlsx"));
}
