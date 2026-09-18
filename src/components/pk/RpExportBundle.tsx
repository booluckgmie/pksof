import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { RP001 } from "@/pages/rp/RP001";
import { RP001A } from "@/pages/rp/RP001A";
import { RP002 } from "@/pages/rp/RP002";
import { RP003 } from "@/pages/rp/RP003";
import { RP004 } from "@/pages/rp/RP004";
import { screens } from "@/lib/nav";

// Same off-screen-bundle technique as FhExportBundle, generalized to Resource & People's own
// five screens — the pillar-level "full report" download (Main.tsx) needs every RP screen
// captured as one document, including RP002-004 (hidden from the sidebar/search nav but still
// real content — see nav.ts's rpNav comment), not just whichever RP screen is currently mounted.
const RP_EXPORT_SCREENS = [
  { id: "RP001" as const, Comp: RP001 },
  { id: "RP001A" as const, Comp: RP001A },
  { id: "RP002" as const, Comp: RP002 },
  { id: "RP003" as const, Comp: RP003 },
  { id: "RP004" as const, Comp: RP004 },
];

export const RP_EXPORT_BUNDLE_ID = "rp-export-bundle";

let setActiveRef: ((active: boolean) => void) | null = null;
let readyResolvers: (() => void)[] = [];

/** Mounts every Resource & People screen off-screen so exportReport.ts can capture all five
 * as one combined report, resolving once they've laid out and painted. Always pair with a call
 * to releaseRpExportBundle() (e.g. in a `finally`) once done reading/capturing the returned element. */
export function requestRpExportBundle(): Promise<HTMLElement> {
  return new Promise((resolve, reject) => {
    if (!setActiveRef) {
      reject(new Error("The Resource & People export bundle isn't mounted."));
      return;
    }
    readyResolvers.push(() => {
      const el = document.getElementById(RP_EXPORT_BUNDLE_ID);
      if (el) resolve(el);
      else reject(new Error("The Resource & People export bundle failed to render."));
    });
    setActiveRef(true);
  });
}

export function releaseRpExportBundle() {
  setActiveRef?.(false);
}

export function RpExportBundle() {
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
    <div id={RP_EXPORT_BUNDLE_ID} style={{ position: "fixed", top: 0, left: -20000, width: 1180, background: "#ffffff" }}>
      <style>{`#${RP_EXPORT_BUNDLE_ID} [data-screen-chrome] { display: none !important; }`}</style>
      {RP_EXPORT_SCREENS.map(({ id, Comp }) => (
        <div key={id} data-export-section-title={screens[id].label} style={{ paddingBottom: 32 }}>
          <Comp onNavigate={noop} />
        </div>
      ))}
    </div>,
    document.body
  );
}
