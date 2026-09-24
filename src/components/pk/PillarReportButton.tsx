/**
 * A compact "download the whole pillar's report" affordance for Main.tsx's three pillar cards —
 * distinct from ScreenHeader's per-screen ExportMenu, which only ever exports the one screen
 * currently on view.
 *
 * Post-UAT: PDF/PPT export is switched off app-wide until it's revisited — the client asked for
 * the button gone, not just disabled. Left as a no-op stub (call sites unchanged, `lib/exportReport`
 * and its pptxgenjs/jspdf dependencies untouched) so turning it back on for phase 2 is a one-line
 * revert of this file rather than re-threading every call site.
 */
export function PillarReportButton(_props: { bundleScreenId: string; pillarLabel: string; entityName: string; periodLabel: string }) {
  return null;
}
