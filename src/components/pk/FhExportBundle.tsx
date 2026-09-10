import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { PFH001 } from "@/pages/fh/PFH001";
import { PFH002 } from "@/pages/fh/PFH002";
import { PFH003 } from "@/pages/fh/PFH003";
import { PFH004 } from "@/pages/fh/PFH004";
import { PFH005 } from "@/pages/fh/PFH005";
import { screens } from "@/lib/nav";

// Financial Health is reported as one module (PFH001 "Financial Health Overview" is the parent
// screen, PFH002-005 its tabs — see FhTabs) even though only one tab is ever mounted at a time.
// Exporting from PFH001 is expected to produce the whole module's report, not just the Overview
// tab's own cards, so this renders all five off-screen (hidden behind the viewport, not
// display:none, so layout/measurement still happens) and exportReport.ts captures the lot as one
// image, using each screen's own nav label as its section title — no DOM-heuristic guessing.
const FH_EXPORT_SCREENS = [
  { id: "PFH001" as const, Comp: PFH001 },
  { id: "PFH002" as const, Comp: PFH002 },
  { id: "PFH003" as const, Comp: PFH003 },
  { id: "PFH004" as const, Comp: PFH004 },
  { id: "PFH005" as const, Comp: PFH005 },
];

export const FH_EXPORT_BUNDLE_ID = "fh-export-bundle";

let setActiveRef: ((active: boolean) => void) | null = null;
let readyResolvers: (() => void)[] = [];

/** Mounts every Financial Health screen off-screen so exportReport.ts can capture all five as
 * one combined report, resolving once they've laid out and painted. Always pair with a call to
 * releaseFhExportBundle() (e.g. in a `finally`) once done reading/capturing the returned element. */
export function requestFhExportBundle(): Promise<HTMLElement> {
  return new Promise((resolve, reject) => {
    if (!setActiveRef) {
      reject(new Error("The Financial Health export bundle isn't mounted."));
      return;
    }
    readyResolvers.push(() => {
      const el = document.getElementById(FH_EXPORT_BUNDLE_ID);
      if (el) resolve(el);
      else reject(new Error("The Financial Health export bundle failed to render."));
    });
    setActiveRef(true);
  });
}

export function releaseFhExportBundle() {
  setActiveRef?.(false);
}

export function FhExportBundle() {
  const [active, setActive] = useState(false);

  useEffect(() => {
    setActiveRef = setActive;
    return () => {
      setActiveRef = null;
    };
  }, []);

  useEffect(() => {
    if (!active) return;
    // Two animation frames either side of paint before waking the caller — the charts are
    // synchronous SVG, but this gives layout a tick to settle before anything measures it.
    let raf2 = 0;
    const raf1 = requestAnimationFrame(() => {
      raf2 = requestAnimationFrame(() => {
        const resolvers = readyResolvers;
        readyResolvers = [];
        resolvers.forEach((r) => r());
      });
    });
    return () => {
      cancelAnimationFrame(raf1);
      cancelAnimationFrame(raf2);
    };
  }, [active]);

  if (!active) return null;
  const noop = () => {};

  return createPortal(
    <div id={FH_EXPORT_BUNDLE_ID} style={{ position: "fixed", top: 0, left: -20000, width: 1180, background: "#ffffff" }}>
      <style>{`#${FH_EXPORT_BUNDLE_ID} [data-screen-chrome] { display: none !important; }`}</style>
      {FH_EXPORT_SCREENS.map(({ id, Comp }) => (
        <div key={id} data-export-section-title={screens[id].label} style={{ paddingBottom: 32 }}>
          <Comp onNavigate={noop} />
        </div>
      ))}
    </div>,
    document.body
  );
}
