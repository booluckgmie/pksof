import prokhasLogoUrl from "@/assets/prokhas-logo.png";
import { requestFhExportBundle, releaseFhExportBundle } from "@/components/pk/FhExportBundle";
import { requestCpExportBundle, releaseCpExportBundle } from "@/components/pk/CpExportBundle";
import { requestRpExportBundle, releaseRpExportBundle } from "@/components/pk/RpExportBundle";

// Report export (PDF / PPTX / Excel) for the current screen.
//
// Visual language follows the client's own Q1 2026 CKPI/MEC report decks (uploaded
// reference files): white background, bold blue ALL-CAPS section titles, a thin
// green-to-blue gradient rule under the header, "Strictly Confidential" + copyright
// footer with page numbers, and the real Prokhas logo top-right (src/assets/prokhas-logo.png).
//
// PDF and PPTX both wrap a full-resolution screenshot of the live screen (html2canvas), then
// slice it along section boundaries instead of arbitrary fixed-height cuts, so a page/slide
// never cuts through a section without carrying its title — each one is headed by the section
// it belongs to, with "(part N of M)" appended when a section itself needs more than one
// page/slide. Excel instead reads the screen's own DOM: `<table>` elements verbatim, plus a
// generic extractor (dl lists, label/value rows, standalone cards) for the many screens that
// present real figures without a literal <table> — so export always reflects the figures on
// screen rather than falling back to "nothing to export" for non-tabular layouts.
//
// Financial Health is one module split across five tabs (PFH001 "Overview" + PFH002-005, see
// FhTabs) that are never mounted simultaneously. Exporting from PFH001 is expected to produce
// the whole module's report, not just the Overview tab's own cards, so that case mounts all
// five off-screen via FhExportBundle and captures them together, one explicit section per
// screen (title = that screen's own nav label, not guessed from its DOM).

const NAVY_HEX = "0B2159"; // pptxgenjs / manual hex, no '#'
const TITLE_BLUE_HEX = "0B2FA0";
const INK_FAINT_HEX = "6C7D88";
const GRADIENT_STOPS_HEX = ["10B981", "2E8F8E", "3E6FAE", "0B2FA0"]; // emerald -> navy, approximates the reference's gradient rule

// Fixed high capture scale (not the display's devicePixelRatio, which is 1 on most desktop
// monitors) — this is what actually determines icon/text sharpness once the image is placed
// at print size. Slices are lossless PNG, capped short so a tall screen spans more pages
// rather than losing detail to stay short.
const CAPTURE_SCALE = 2;
const MAX_SLICE_PX = 2200;

// (html2canvas's `foreignObjectRendering` option looked like a more direct fidelity fix —
// it routes the capture through the browser's own SVG rasterizer instead of html2canvas's
// manual DOM painter — but it corrupts the capture for this layout: cropped/misaligned
// output, not just lower fidelity. Left off; scale above is the safe lever.)

/** Financial Health's parent/overview screen — exporting from here bundles all five FH tabs
 * into one report instead of just this screen's own content. See FhExportBundle.
 *
 * "CP_PILLAR_REPORT" / "RP_PILLAR_REPORT" are pseudo screen-ids, never a real ScreenId — they
 * exist only so Main.tsx's per-pillar "download full report" button can request the whole
 * Corporate Performance / Resource & People module the same way PFH001 already bundles all of
 * Financial Health, without changing what a normal visit-then-export from CP001/RP001's own
 * page produces (still just that one screen). */
export const CP_PILLAR_REPORT_ID = "CP_PILLAR_REPORT";
export const RP_PILLAR_REPORT_ID = "RP_PILLAR_REPORT";

const PILLAR_BUNDLES: Record<string, { request: () => Promise<HTMLElement>; release: () => void }> = {
  PFH001: { request: requestFhExportBundle, release: releaseFhExportBundle },
  [CP_PILLAR_REPORT_ID]: { request: requestCpExportBundle, release: releaseCpExportBundle },
  [RP_PILLAR_REPORT_ID]: { request: requestRpExportBundle, release: releaseRpExportBundle },
};

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

function timestamp() {
  const d = new Date();
  return `${pad2(d.getDate())} ${d.toLocaleString("en-US", { month: "long" })} ${d.getFullYear()}, ${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
}

function filenameFor(screenLabel: string, ext: string) {
  const slug = screenLabel.replace(/[^a-z0-9]+/gi, "_").replace(/^_+|_+$/g, "");
  const d = new Date();
  const stamp = `${d.getFullYear()}${pad2(d.getMonth() + 1)}${pad2(d.getDate())}`;
  return `GroupHQ_${slug}_${stamp}.${ext}`;
}

export interface ExportContext {
  screenId: string;
  screenLabel: string;
  entityName: string;
  periodLabel: string;
}

async function resolveCaptureTarget(ctx: ExportContext): Promise<{ el: HTMLElement; usingBundle: boolean }> {
  const bundle = PILLAR_BUNDLES[ctx.screenId];
  if (bundle) {
    const el = await bundle.request();
    return { el, usingBundle: true };
  }
  const el = document.getElementById("screen-content");
  if (!el) throw new Error("Could not find the screen content to export.");
  return { el, usingBundle: false };
}

async function captureContent(ctx: ExportContext): Promise<{ canvas: HTMLCanvasElement; el: HTMLElement; usingBundle: boolean }> {
  const { el, usingBundle } = await resolveCaptureTarget(ctx);
  const html2canvas = (await import("html2canvas")).default;
  const canvas = await html2canvas(el, {
    backgroundColor: "#ffffff",
    scale: CAPTURE_SCALE,
    useCORS: true,
    windowWidth: el.scrollWidth,
    windowHeight: el.scrollHeight,
  });
  return { canvas, el, usingBundle };
}

// JPEG, not PNG — these slices are opaque screenshots (html2canvas is always given a white
// backgroundColor), so there's no alpha channel to lose, and PNG's lossless DEFLATE compresses
// anti-aliased text/gradients far worse than JPEG does. A multi-screen pillar bundle (20-30+
// pages) was landing near 60MB at PNG; JPEG at this quality brings the same report under 2MB.
const SLICE_JPEG_QUALITY = 0.82;

function canvasSlice(canvas: HTMLCanvasElement, offsetPx: number, sliceH: number): string {
  const sliceCanvas = document.createElement("canvas");
  sliceCanvas.width = canvas.width;
  sliceCanvas.height = sliceH;
  const sctx = sliceCanvas.getContext("2d")!;
  sctx.drawImage(canvas, 0, offsetPx, canvas.width, sliceH, 0, 0, canvas.width, sliceH);
  return sliceCanvas.toDataURL("image/jpeg", SLICE_JPEG_QUALITY);
}

// Loads the real Prokhas logo (src/assets/prokhas-logo.png, the same file used in-app) as a
// data URL so jsPDF/pptxgenjs can embed it — both libraries need image bytes, not a URL.
let logoPromise: Promise<{ dataUrl: string; aspect: number }> | null = null;
function loadLogo(): Promise<{ dataUrl: string; aspect: number }> {
  if (!logoPromise) {
    logoPromise = (async () => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => reject(new Error("Could not load the Prokhas logo."));
        img.src = prokhasLogoUrl;
      });
      const canvas = document.createElement("canvas");
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      canvas.getContext("2d")!.drawImage(img, 0, 0);
      return { dataUrl: canvas.toDataURL("image/png"), aspect: img.naturalWidth / img.naturalHeight };
    })();
  }
  return logoPromise;
}

// ---------- Section detection (shared by PDF + PPTX) ----------

interface ExportSection {
  title: string;
  top: number;
  bottom: number;
}

// Every screen in this app lays its content out as a sequence of `.shadow-card` panels (the
// dashboard's one consistent "content panel" convention — see e.g. RP002/RP003/PFH002), so
// those panels double as natural section boundaries. Anything before the first card (stat
// tiles, filter bars) is bundled into a leading "Overview" section; anything between/after
// cards rides along with the section it visually sits under.
function sectionTitle(card: HTMLElement, index: number): string {
  const selectors = ["caption", "h2", "h3", ".font-head.font-bold", ".text-xs.font-bold.underline"];
  for (const sel of selectors) {
    const t = card.querySelector(sel)?.textContent?.trim();
    if (t) return t.replace(/\s+/g, " ").slice(0, 70);
  }
  const labelish = Array.from(card.querySelectorAll<HTMLElement>("div, span")).find((n) => {
    const c = n.className;
    return typeof c === "string" && c.includes("uppercase") && c.includes("tracking-wide") && (c.includes("font-semibold") || c.includes("font-bold"));
  });
  const lt = labelish?.textContent?.trim();
  if (lt) return lt.replace(/\s+/g, " ").slice(0, 70);
  return `Section ${index + 1}`;
}

function pixelRangeFor(el: HTMLElement, rootRect: DOMRect, scaleY: number, canvasHeight: number): { top: number; bottom: number } {
  const r = el.getBoundingClientRect();
  return {
    top: Math.max(0, Math.round((r.top - rootRect.top) * scaleY)),
    bottom: Math.min(canvasHeight, Math.round((r.bottom - rootRect.top) * scaleY)),
  };
}

function computeCardSections(root: HTMLElement, canvas: HTMLCanvasElement): ExportSection[] {
  const rootRect = root.getBoundingClientRect();
  const scaleY = canvas.height / root.scrollHeight;
  const allCards = Array.from(root.querySelectorAll<HTMLElement>(".shadow-card"));
  const nestable = allCards.filter((el) => !allCards.some((other) => other !== el && other.contains(el)));
  // StatCard tiles also carry the `.shadow-card` class, so a row of 3-4 summary tiles
  // (`grid-cols-2 sm:grid-cols-4` etc.) would otherwise register as that many one-line
  // "sections". Those tiles aren't standalone content — they ride along with whatever
  // section they sit under — so drop any card that's one of 3+ `.shadow-card` siblings
  // under the same parent, keeping only the real content panels (usually 1-2 per row).
  const topCards = nestable.filter((el) => {
    const parent = el.parentElement;
    if (!parent) return true;
    return nestable.filter((c) => c.parentElement === parent).length < 3;
  });

  if (topCards.length === 0) {
    return [{ title: "Overview", top: 0, bottom: canvas.height }];
  }

  const sections: ExportSection[] = [];
  topCards.forEach((card, i) => {
    const { bottom: cardBottom } = pixelRangeFor(card, rootRect, scaleY, canvas.height);
    let top: number;
    if (i === 0) {
      const { top: cardTopRaw } = pixelRangeFor(card, rootRect, scaleY, canvas.height);
      if (cardTopRaw > 30) sections.push({ title: "Overview", top: 0, bottom: cardTopRaw });
      top = cardTopRaw;
    } else {
      top = sections[sections.length - 1].bottom;
    }
    sections.push({ title: sectionTitle(card, i), top, bottom: Math.max(cardBottom, top + 1) });
  });
  sections[sections.length - 1].bottom = canvas.height; // absorb any trailing content (footnotes etc.) into the last section

  return sections;
}

// Used for the Financial Health bundle: each of the five screens is marked with an explicit
// `data-export-section-title` (its own nav label), so boundaries come from that instead of
// guessing from card headings — and are forced contiguous so no pixel row between two markers
// is ever dropped or double-counted.
function computeMarkedSections(root: HTMLElement, canvas: HTMLCanvasElement): ExportSection[] {
  const rootRect = root.getBoundingClientRect();
  const scaleY = canvas.height / root.scrollHeight;
  const markers = Array.from(root.querySelectorAll<HTMLElement>("[data-export-section-title]"));
  if (markers.length === 0) return computeCardSections(root, canvas);

  const sections: ExportSection[] = markers.map((el) => {
    const { top, bottom } = pixelRangeFor(el, rootRect, scaleY, canvas.height);
    return { title: el.dataset.exportSectionTitle!, top, bottom };
  });
  for (let i = 1; i < sections.length; i++) sections[i].top = sections[i - 1].bottom;
  sections[sections.length - 1].bottom = canvas.height;
  return sections;
}

function computeSections(root: HTMLElement, canvas: HTMLCanvasElement, usingBundle: boolean): ExportSection[] {
  return usingBundle ? computeMarkedSections(root, canvas) : computeCardSections(root, canvas);
}

// Splits each section into as many equal-height slices as it needs to fit the given max page
// height, so a page/slide never spans two sections — every page carries its section's own
// title (with "(part N of M)" once a section needs more than one).
interface RenderPage {
  title: string;
  offsetPx: number;
  sliceH: number;
}

function paginateSections(sections: ExportSection[], maxHeightPx: number): RenderPage[] {
  const pages: RenderPage[] = [];
  sections.forEach((section) => {
    const total = Math.max(1, Math.ceil((section.bottom - section.top) / maxHeightPx));
    let offset = section.top;
    let part = 1;
    while (offset < section.bottom) {
      const sliceH = Math.min(maxHeightPx, section.bottom - offset);
      pages.push({ title: total > 1 ? `${section.title} (${part} of ${total})` : section.title, offsetPx: offset, sliceH });
      offset += maxHeightPx;
      part += 1;
    }
  });
  return pages;
}

// ---------- PDF ----------

export async function exportScreenAsPdf(ctx: ExportContext): Promise<void> {
  const [{ jsPDF }, { INTER_REGULAR_BASE64, INTER_BOLD_BASE64 }] = await Promise.all([
    import("jspdf"),
    import("@/lib/fonts/interFontData"),
  ]);
  const [{ canvas, el, usingBundle }, logo] = await Promise.all([captureContent(ctx), loadLogo()]);

  try {
    // 960x540pt — the reference decks' actual page size (confirmed via pdfinfo on the
    // uploaded Q1 2026 CKPI/MEC PDFs) and exactly the PPTX slide's 13.33in x 7.5in
    // widescreen at 72pt/in. Matching page size means both exports scale identically.
    const doc = new jsPDF({ orientation: "landscape", unit: "pt", format: [960, 540] });

    // jsPDF has no built-in Inter — embed it so the PDF matches the app's own type instead of
    // falling back to Helvetica. PPTX/Excel intentionally keep their own defaults (Arial/Calibri).
    doc.addFileToVFS("Inter-Regular.ttf", INTER_REGULAR_BASE64);
    doc.addFont("Inter-Regular.ttf", "Inter", "normal");
    doc.addFileToVFS("Inter-Bold.ttf", INTER_BOLD_BASE64);
    doc.addFont("Inter-Bold.ttf", "Inter", "bold");

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
      doc.setFont("Inter", "normal");
      doc.setFontSize(8);
      doc.setTextColor(INK_FAINT_HEX);
      doc.text("Strictly Confidential", margin, pageH - 18);
      doc.text(`Copyright © Prokhas. All rights reserved.  [ ${page} ]`, pageW - margin, pageH - 18, { align: "right" });
    };

    const drawLogo = (w: number, y: number) => {
      const h = w / logo.aspect;
      doc.addImage(logo.dataUrl, "PNG", pageW - margin - w, y, w, h);
    };

    // Cover page
    drawLogo(90, margin);
    doc.setFont("Inter", "bold");
    doc.setFontSize(30);
    doc.setTextColor(TITLE_BLUE_HEX);
    const titleLines = doc.splitTextToSize(ctx.screenLabel, pageW - margin * 2 - 200);
    doc.text(titleLines, margin, pageH / 2 - 60);

    doc.setFont("Inter", "normal");
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

    // Content pages — one section per run of pages, never spanning two sections on one page
    const contentTop = margin + 50;
    const contentW = pageW - margin * 2;
    const usablePageH = pageH - contentTop - 40;
    const pxPerPt = canvas.width / contentW;
    const sliceHeightPx = Math.min(Math.floor(usablePageH * pxPerPt), MAX_SLICE_PX);
    const sections = computeSections(el, canvas, usingBundle);
    const pages = paginateSections(sections, sliceHeightPx);

    pages.forEach((pg) => {
      doc.addPage();
      page += 1;

      doc.setFont("Inter", "bold");
      doc.setFontSize(16);
      doc.setTextColor(TITLE_BLUE_HEX);
      doc.text(pg.title.toUpperCase(), margin, margin + 8);
      drawLogo(70, margin - 8);
      drawGradientRule(margin + 18);

      const sliceImg = canvasSlice(canvas, pg.offsetPx, pg.sliceH);
      const sliceHpt = (pg.sliceH * contentW) / canvas.width;
      doc.addImage(sliceImg, "JPEG", margin, contentTop, contentW, sliceHpt);

      drawFooter();
    });

    doc.save(filenameFor(ctx.screenLabel, "pdf"));
  } finally {
    if (usingBundle) PILLAR_BUNDLES[ctx.screenId]?.release();
  }
}

// ---------- PPTX ----------

export async function exportScreenAsPptx(ctx: ExportContext): Promise<void> {
  const PptxGenJS = (await import("pptxgenjs")).default;
  const [{ canvas, el, usingBundle }, logo] = await Promise.all([captureContent(ctx), loadLogo()]);

  try {
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
      slide.addText(`Copyright © Prokhas. All rights reserved.  [ ${pageNum} ]`, {
        x: slideW - 3.5 - margin, y: slideH - 0.35, w: 3.5, h: 0.25, fontSize: 8, color: INK_FAINT_HEX, fontFace: "Arial", align: "right", margin: 0,
      });
    };

    const addLogo = (slide: import("pptxgenjs").default.PresSlide, w: number, y: number) => {
      const h = w / logo.aspect;
      slide.addImage({ data: logo.dataUrl, x: slideW - margin - w, y, w, h });
    };

    // Cover slide
    const cover = pres.addSlide();
    cover.background = { color: "FFFFFF" };
    addLogo(cover, 1.3, margin);
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

    // Content slides — one section per run of slides (each `.shadow-card` panel, or each FH
    // tab when bundled), captured from the same screenshot and cropped to that section's own
    // pixel range, so a slide never cuts through a section without carrying its title.
    const contentTop = 1.05;
    const contentW = slideW - margin * 2;
    const usableSlideH = slideH - contentTop - 0.55;
    const pxPerIn = canvas.width / contentW;
    const maxSliceHeightPx = Math.min(Math.floor(usableSlideH * pxPerIn), MAX_SLICE_PX);
    const sections = computeSections(el, canvas, usingBundle);
    const pages = paginateSections(sections, maxSliceHeightPx);
    let pageNum = 1;

    pages.forEach((pg) => {
      pageNum += 1;
      const slide = pres.addSlide();
      slide.background = { color: "FFFFFF" };

      slide.addText(pg.title.toUpperCase(), {
        x: margin, y: 0.22, w: slideW - margin * 2 - 1.6, h: 0.4,
        fontSize: 18, bold: true, color: TITLE_BLUE_HEX, fontFace: "Arial", margin: 0,
      });
      slide.addText(ctx.screenLabel, {
        x: margin, y: 0.58, w: slideW - margin * 2 - 1.6, h: 0.25,
        fontSize: 10, color: INK_FAINT_HEX, fontFace: "Arial", margin: 0,
      });
      addLogo(slide, 1.0, 0.25);
      addGradientRule(slide, 0.92);

      const sliceImg = canvasSlice(canvas, pg.offsetPx, pg.sliceH);
      const sliceHIn = (pg.sliceH * contentW) / canvas.width;
      slide.addImage({ data: sliceImg, x: margin, y: contentTop, w: contentW, h: sliceHIn });

      addFooter(slide, pageNum);
    });

    await pres.writeFile({ fileName: filenameFor(ctx.screenLabel, "pptx") });
  } finally {
    if (usingBundle) PILLAR_BUNDLES[ctx.screenId]?.release();
  }
}

