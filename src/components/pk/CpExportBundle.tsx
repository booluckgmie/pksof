import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { CP001 } from "@/pages/cp/CP001";
import { CP002 } from "@/pages/cp/CP002";
import { CP003 } from "@/pages/cp/CP003";
import { CP004 } from "@/pages/cp/CP004";
import { CP005 } from "@/pages/cp/CP005";
import { CP006 } from "@/pages/cp/CP006";
import { CP007 } from "@/pages/cp/CP007";
import { CP008 } from "@/pages/cp/CP008";
import { CP009 } from "@/pages/cp/CP009";
import { screens } from "@/lib/nav";

// Same off-screen-bundle technique as FhExportBundle, generalized to Corporate Performance's
// own nine screens — the pillar-level "full report" download (Main.tsx) needs all of CP001-009
// captured as one document, not just whichever CP screen is currently mounted.
const CP_EXPORT_SCREENS = [
  { id: "CP001" as const, Comp: CP001 },
  { id: "CP002" as const, Comp: CP002 },
  { id: "CP003" as const, Comp: CP003 },
  { id: "CP004" as const, Comp: CP004 },
  { id: "CP005" as const, Comp: CP005 },
  { id: "CP006" as const, Comp: CP006 },
  { id: "CP007" as const, Comp: CP007 },
  { id: "CP008" as const, Comp: CP008 },
  { id: "CP009" as const, Comp: CP009 },
];

export const CP_EXPORT_BUNDLE_ID = "cp-export-bundle";

let setActiveRef: ((active: boolean) => void) | null = null;
let readyResolvers: (() => void)[] = [];

/** Mounts every Corporate Performance screen off-screen so exportReport.ts can capture all nine
 * as one combined report, resolving once they've laid out and painted. Always pair with a call
 * to releaseCpExportBundle() (e.g. in a `finally`) once done reading/capturing the returned element. */
export function requestCpExportBundle(): Promise<HTMLElement> {
  return new Promise((resolve, reject) => {
    if (!setActiveRef) {
      reject(new Error("The Corporate Performance export bundle isn't mounted."));
      return;
    }
    readyResolvers.push(() => {
      const el = document.getElementById(CP_EXPORT_BUNDLE_ID);
      if (el) resolve(el);
      else reject(new Error("The Corporate Performance export bundle failed to render."));
    });
    setActiveRef(true);
  });
}

export function releaseCpExportBundle() {
  setActiveRef?.(false);
}

export function CpExportBundle() {
  const [active, setActive] = useState(false);

  useEffect(() => {
    setActiveRef = setActive;
    return () => {
      setActiveRef = null;
    };
  }, []);

  useEffect(() => {
    if (!active) return;
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
    <div id={CP_EXPORT_BUNDLE_ID} style={{ position: "fixed", top: 0, left: -20000, width: 1180, background: "#ffffff" }}>
      <style>{`#${CP_EXPORT_BUNDLE_ID} [data-screen-chrome] { display: none !important; }`}</style>
      {CP_EXPORT_SCREENS.map(({ id, Comp }) => (
        <div key={id} data-export-section-title={screens[id].label} style={{ paddingBottom: 32 }}>
          <Comp onNavigate={noop} />
        </div>
      ))}
    </div>,
    document.body
  );
}
