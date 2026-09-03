import { useEffect, useRef, useState } from "react";
import { Lock } from "lucide-react";
import { SessionProvider, useSession } from "@/lib/session";
import { WorkflowProvider } from "@/lib/workflow";
import { DetailsProvider } from "@/lib/details";
import { OrgSettingsProvider } from "@/lib/orgSettings";
import { KpiTargetsProvider } from "@/lib/kpiTargets";
import { Shell } from "@/components/layout/Shell";
import { LoginDialog } from "@/components/layout/LoginDialog";
import { Main } from "@/pages/Main";
import { CP001 } from "@/pages/cp/CP001";
import { CP002 } from "@/pages/cp/CP002";
import { CP003 } from "@/pages/cp/CP003";
import { CP004 } from "@/pages/cp/CP004";
import { CP005 } from "@/pages/cp/CP005";
import { CP006 } from "@/pages/cp/CP006";
import { CP007 } from "@/pages/cp/CP007";
import { CP008 } from "@/pages/cp/CP008";
import { PFH001 } from "@/pages/fh/PFH001";
import { PFH002 } from "@/pages/fh/PFH002";
import { PFH003 } from "@/pages/fh/PFH003";
import { PFH004 } from "@/pages/fh/PFH004";
import { PFH005 } from "@/pages/fh/PFH005";
import { RP001 } from "@/pages/rp/RP001";
import { RP001A } from "@/pages/rp/RP001A";
import { RP002 } from "@/pages/rp/RP002";
import { RP003 } from "@/pages/rp/RP003";
import { RP004 } from "@/pages/rp/RP004";
import { DataEntry } from "@/pages/workflow/DataEntry";
import { VerifyPublish } from "@/pages/workflow/VerifyPublish";
import { Settings } from "@/pages/workflow/Settings";
import { CP009 } from "@/pages/cp/CP009";
import { Glossary } from "@/pages/Glossary";
import { screens, type ScreenId } from "@/lib/nav";
import { Toaster } from "@/components/ui/sonner";
import { ScreenErrorBoundary } from "@/components/pk/ScreenErrorBoundary";
import { entities, entityById } from "@/data/entities";
import type { EntityId, Module } from "@/types";

const SCREEN_MAP: Record<ScreenId, React.ComponentType<{ onNavigate: (id: ScreenId) => void }>> = {
  MAIN: Main,
  CP001, CP002, CP003, CP004, CP005, CP006, CP007, CP008, CP009,
  PFH001, PFH002, PFH003, PFH004, PFH005,
  RP001, RP001A: RP001A, RP002, RP003, RP004,
  DATA_ENTRY: DataEntry,
  VERIFY_PUBLISH: VerifyPublish,
  SETTINGS: Settings,
  GLOSSARY: Glossary,
};

/** Prokhas' own dashboards — off-limits to a login scoped to a Managed Entity pillar. */
const HQ_ONLY_GROUPS = new Set(["cp", "fh", "rp"]);
/** Requires a real sign-in — browsing every other screen doesn't. */
const LOGIN_REQUIRED_SCREENS = new Set<ScreenId>(["DATA_ENTRY", "VERIFY_PUBLISH", "SETTINGS"]);
/** Maps a screen's nav group onto the Entity.modules code it corresponds to. */
const GROUP_MODULE: Partial<Record<string, Module>> = { cp: "CP", fh: "FH", rp: "RP" };

function isScreenId(v: string | null): v is ScreenId {
  return !!v && Object.prototype.hasOwnProperty.call(screens, v);
}

function isEntityId(v: string | null): v is EntityId {
  return !!v && entities.some((e) => e.id === v);
}

/** Main has no `?screen=` param at all — a bare root URL should stay a clean root URL. */
function readScreenFromUrl(): ScreenId {
  const s = new URLSearchParams(window.location.search).get("screen");
  return isScreenId(s) ? s : "MAIN";
}

/** Deep-links / Back-Forward can carry which entity was being viewed too, e.g. `?entity=SJPP`. */
function readEntityFromUrl(): EntityId {
  const e = new URLSearchParams(window.location.search).get("entity");
  return isEntityId(e) ? e : "HQ";
}

function AuthedApp() {
  const { loggedIn, isRestrictedPillar, homeEntityName, role, entityId, entityName, setEntityId } = useSession();
  const [screen, setScreen] = useState<ScreenId>(() => readScreenFromUrl());
  const [loginOpen, setLoginOpen] = useState(false);
  const prevLoggedIn = useRef(loggedIn);
  const entityFromUrlApplied = useRef(false);

  // Every navigation updates the address bar so the browser's Back/Forward buttons move between
  // screens, and any screen can be copied out of the address bar as a link straight back to it.
  const navigate = (id: ScreenId, opts?: { replace?: boolean }) => {
    const changed = id !== screen;
    setScreen(id);
    if (!changed && !opts?.replace) return;
    const url = new URL(window.location.href);
    if (id === "MAIN") url.searchParams.delete("screen");
    else url.searchParams.set("screen", id);
    if (opts?.replace) window.history.replaceState({ screen: id }, "", url);
    else window.history.pushState({ screen: id }, "", url);
  };

  // Back/Forward doesn't re-run navigate() — it moves the URL directly, so read it back into state.
  useEffect(() => {
    const onPopState = () => {
      setScreen(readScreenFromUrl());
      setEntityId(readEntityFromUrl());
    };
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Backspace is the browser's "go back" key on most platforms, but browsers only honour it as
  // history navigation while focus sits in a text field — everywhere else on the page it's a
  // no-op, which reads as "back is broken" on a dashboard that's mostly buttons and tables. Wire
  // it to the same history the Back button already drives, except while actually typing.
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "Backspace") return;
      const el = document.activeElement as HTMLElement | null;
      const typing = el && (el.tagName === "INPUT" || el.tagName === "TEXTAREA" || el.tagName === "SELECT" || el.isContentEditable);
      if (typing) return;
      e.preventDefault();
      window.history.back();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  // Sign-in and sign-out both land back on Main — never carries a gated screen across the switch.
  // Guarded to actual transitions (not the initial mount) so a deep link isn't reset on load.
  useEffect(() => {
    if (prevLoggedIn.current !== loggedIn) navigate("MAIN", { replace: true });
    prevLoggedIn.current = loggedIn;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loggedIn]);

  // Apply a deep-linked `?entity=` once on mount (after that, entityId is session-driven).
  useEffect(() => {
    if (entityFromUrlApplied.current) return;
    entityFromUrlApplied.current = true;
    const e = readEntityFromUrl();
    if (e !== "HQ") setEntityId(e);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Keeps the current history entry's `entity` param in sync with session state whenever it
  // changes, from any source (CP004's drill-down, the sidebar) — a `replace`, not a `push`, so it
  // rides along with whatever navigation already pushed the entry, rather than adding its own.
  useEffect(() => {
    const url = new URL(window.location.href);
    const current = url.searchParams.get("entity");
    if ((current ?? "HQ") === entityId) return;
    if (entityId === "HQ") url.searchParams.delete("entity");
    else url.searchParams.set("entity", entityId);
    window.history.replaceState({ screen, entity: entityId }, "", url);
  }, [entityId, screen]);

  const loginRequired = LOGIN_REQUIRED_SCREENS.has(screen) && !loggedIn;
  const settingsBlocked = screen === "SETTINGS" && loggedIn && role !== "admin";
  const group = screens[screen].group;
  const groupModule = GROUP_MODULE[group];
  // Corporate Performance is Prokhas' own scorecard — a Managed Entity has no CP dashboards of
  // its own, only Financial Health and Resource & People. This applies purely from the entity
  // currently being viewed, independent of login/role, so it also covers CP004's own
  // "drill into a Managed Entity" flow.
  const entityBlocksGroup = !!groupModule && !entityById(entityId).modules.includes(groupModule);
  const blocked = (isRestrictedPillar && HQ_ONLY_GROUPS.has(group)) || entityBlocksGroup || settingsBlocked || loginRequired;
  const Screen = SCREEN_MAP[screen];

  return (
    <Shell current={screen} onNavigate={navigate} onOpenLogin={() => setLoginOpen(true)}>
      {blocked ? (
        <div className="flex flex-col items-center justify-center text-center gap-3 rounded-lg border border-dashed border-[hsl(var(--pk-border))] py-16 px-6">
          <div className="h-10 w-10 rounded-full bg-[hsl(var(--pk-surface-2))] flex items-center justify-center">
            <Lock className="h-4 w-4 text-[hsl(var(--pk-ink-faint))]" />
          </div>
          <div className="font-head text-lg font-semibold text-[hsl(var(--pk-ink))]">
            {loginRequired
              ? "Sign in required"
              : settingsBlocked
                ? "System Administrator only"
                : entityBlocksGroup && !isRestrictedPillar
                  ? `Not part of ${entityName}'s dashboards`
                  : `Not part of ${homeEntityName}'s pillar`}
          </div>
          <p className="text-sm text-[hsl(var(--pk-ink-faint))] max-w-[46ch]">
            {loginRequired
              ? "Uploading data and verifying/publishing submissions needs a real sign-in — browsing the dashboards doesn't."
              : settingsBlocked
                ? "Organisation-wide settings are restricted to the System Administrator role."
                : entityBlocksGroup && !isRestrictedPillar
                  ? `Corporate Performance is Prokhas' own scorecard for managing the Group — ${entityName} doesn't have one of its own, only its Financial Health and Resource & People dashboards.`
                  : `This dashboard belongs to Prokhas' own scorecard. Your login is scoped to ${homeEntityName} and can't view it.`}
          </p>
          <button
            onClick={() => {
              if (loginRequired) { setLoginOpen(true); return; }
              if (entityBlocksGroup && !isRestrictedPillar && entityId !== "HQ") setEntityId("HQ");
              navigate("MAIN");
            }}
            className="mt-1 rounded-md bg-[hsl(var(--pk-accent))] text-[hsl(var(--pk-accent-ink))] text-xs font-medium px-3 py-1.5 hover:opacity-90 transition-opacity"
          >
            {loginRequired ? "Sign in" : entityBlocksGroup && !isRestrictedPillar ? "Back to Prokhas Group view" : "Back to Main Screen"}
          </button>
        </div>
      ) : (
        <ScreenErrorBoundary key={screen} onReset={() => navigate("MAIN")}>
          <Screen onNavigate={navigate} />
        </ScreenErrorBoundary>
      )}
      <LoginDialog open={loginOpen} onOpenChange={setLoginOpen} />
    </Shell>
  );
}

function App() {
  return (
    <OrgSettingsProvider>
      <KpiTargetsProvider>
        <SessionProvider>
          <WorkflowProvider>
            <DetailsProvider>
              <AuthedApp />
              <Toaster position="bottom-right" richColors />
            </DetailsProvider>
          </WorkflowProvider>
        </SessionProvider>
      </KpiTargetsProvider>
    </OrgSettingsProvider>
  );
}

export default App;
