export type ScreenId =
  | "MAIN"
  | "CP001" | "CP002" | "CP003" | "CP004" | "CP005" | "CP006" | "CP007" | "CP008" | "CP009"
  | "PFH001" | "PFH002" | "PFH003" | "PFH004" | "PFH005"
  | "RP001" | "RP001A" | "RP002" | "RP003" | "RP004"
  | "DATA_ENTRY" | "VERIFY_PUBLISH" | "SETTINGS"
  | "GLOSSARY";

export interface ScreenDef {
  id: ScreenId;
  code: string;
  label: string;
  level: "L0" | "L1" | "L2" | "L3";
  group: "main" | "cp" | "fh" | "rp" | "gov" | "ref";
  parent?: ScreenId;
}

export const screens: Record<ScreenId, ScreenDef> = {
  MAIN: { id: "MAIN", code: "MAIN001", label: "Performance Dashboard", level: "L1", group: "main" },

  CP001: { id: "CP001", code: "CP001", label: "Corporate Performance", level: "L1", group: "cp", parent: "MAIN" },
  CP002: { id: "CP002", code: "CP002", label: "Corporate KPI Performance Status", level: "L2", group: "cp", parent: "CP001" },
  CP003: { id: "CP003", code: "CP003", label: "Financial Perspective", level: "L2", group: "cp", parent: "CP001" },
  CP004: { id: "CP004", code: "CP004", label: "Mandate & Governance Perspective", level: "L2", group: "cp", parent: "CP001" },
  CP005: { id: "CP005", code: "CP005", label: "Customer Perspective", level: "L2", group: "cp", parent: "CP001" },
  CP006: { id: "CP006", code: "CP006", label: "Internal Business Process", level: "L2", group: "cp", parent: "CP001" },
  CP007: { id: "CP007", code: "CP007", label: "Organisational Capacity", level: "L2", group: "cp", parent: "CP001" },
  CP008: { id: "CP008", code: "CP008", label: "Bumiputera Empowerment", level: "L2", group: "cp", parent: "CP001" },
  CP009: { id: "CP009", code: "CP009", label: "People Development Programme", level: "L2", group: "cp", parent: "CP001" },

  PFH001: { id: "PFH001", code: "PFH001", label: "Financial Health Overview", level: "L2", group: "fh", parent: "MAIN" },
  PFH002: { id: "PFH002", code: "PFH002", label: "Financial Results (QoQ)", level: "L3", group: "fh", parent: "PFH001" },
  PFH003: { id: "PFH003", code: "PFH003", label: "Actual vs Budget vs PY", level: "L3", group: "fh", parent: "PFH001" },
  PFH004: { id: "PFH004", code: "PFH004", label: "Financial Position", level: "L3", group: "fh", parent: "PFH001" },
  PFH005: { id: "PFH005", code: "PFH005", label: "Related Party Transactions", level: "L3", group: "fh", parent: "PFH001" },

  RP001: { id: "RP001", code: "RP001", label: "Demographics and Recruitment Efficiency Index", level: "L2", group: "rp", parent: "MAIN" },
  RP001A: { id: "RP001A", code: "RP001a", label: "Staff Demographics Breakdown", level: "L3", group: "rp", parent: "RP001" },
  RP002: { id: "RP002", code: "RP002", label: "Approved Headcount & KPI 10", level: "L3", group: "rp", parent: "RP001" },
  RP003: { id: "RP003", code: "RP003", label: "Bumiputera Composition (KPI 12)", level: "L3", group: "rp", parent: "RP001" },
  RP004: { id: "RP004", code: "RP004", label: "Bumiputera Training (KPI 13)", level: "L3", group: "rp", parent: "RP001" },

  DATA_ENTRY: { id: "DATA_ENTRY", code: "ENTRY", label: "Data Entry", level: "L2", group: "gov", parent: "MAIN" },
  VERIFY_PUBLISH: { id: "VERIFY_PUBLISH", code: "VERIFY", label: "Verify & Publish", level: "L2", group: "gov", parent: "MAIN" },
  SETTINGS: { id: "SETTINGS", code: "SETTINGS", label: "Settings", level: "L2", group: "gov", parent: "MAIN" },

  GLOSSARY: { id: "GLOSSARY", code: "REF001", label: "Glossary", level: "L1", group: "ref", parent: "MAIN" },
};

export function breadcrumbTrail(id: ScreenId): ScreenDef[] {
  const trail: ScreenDef[] = [];
  let cur: ScreenId | undefined = id;
  while (cur) {
    trail.unshift(screens[cur]);
    cur = screens[cur].parent;
  }
  return trail;
}

/** Screen label, personalised to the signed-in pillar — the Main Screen is always "<Entity> Performance Dashboard". */
export function screenLabel(id: ScreenId, entityName: string): string {
  if (id === "MAIN") return `${entityName} Performance Dashboard`;
  return screens[id].label;
}

/** Breadcrumb-only label — RP001's own label is specific enough to be its page title but too
 * specific to double as the section crumb every RP screen's trail runs through (unlike CP001,
 * whose label "Corporate Performance" already works as both). Falls back to screenLabel for
 * everything else. */
export function breadcrumbLabel(id: ScreenId, entityName: string): string {
  if (id === "RP001") return "Resource & People";
  return screenLabel(id, entityName);
}

export const cpNav: ScreenId[] = ["CP001", "CP002", "CP003", "CP004", "CP005", "CP006", "CP007", "CP008", "CP009"];
export const fhNav: ScreenId[] = ["PFH001", "PFH002", "PFH003", "PFH004", "PFH005"];
// RP002-RP004 stay fully routable (URL, breadcrumb) — just hidden from the sidebar/search nav below.
export const rpNav: ScreenId[] = ["RP001", "RP001A"];

// Corporate Performance's own pager order: CP002 (a KPI-status table that duplicates CP001's
// own drill-downs) is skipped entirely, and so is CP009 — its full People Development Programme
// detail is already embedded directly on CP007's own KPI10 card (by design, per the client), so
// stepping Next from CP007 straight to CP009 would land on content just seen. CP009 stays fully
// reachable on its own (sidebar/search/URL), just not as its own stop in this linear reading order.
const cpPageOrder: ScreenId[] = ["CP001", "CP003", "CP004", "CP005", "CP006", "CP007", "CP008"];

/** The full "reading order" through the dashboard's own content — MAIN, then each pillar's
 * screens end to end, used by the bottom-of-page Previous/Next pager (see PageNav). Financial
 * Health and Resource & People simply follow their own sidebar order (fhNav/rpNav) — so RP002-004
 * (hidden from the sidebar/search nav) are hidden here too, not just Corporate Performance's own
 * KPI-numbering exceptions above. Excludes the utility screens (Data Entry, Verify & Publish,
 * Settings, Glossary) — those aren't part of the "next page" reading flow. */
export const pageOrder: ScreenId[] = ["MAIN", ...cpPageOrder, ...fhNav, ...rpNav];

/** The previous/next screen in `pageOrder` relative to `id` — null at either end, and both null
 * for a screen outside the reading order (e.g. Data Entry, Settings), so PageNav renders nothing. */
export function adjacentPages(id: ScreenId): { prev: ScreenDef | null; next: ScreenDef | null } {
  const i = pageOrder.indexOf(id);
  if (i === -1) return { prev: null, next: null };
  return {
    prev: i > 0 ? screens[pageOrder[i - 1]] : null,
    next: i < pageOrder.length - 1 ? screens[pageOrder[i + 1]] : null,
  };
}
