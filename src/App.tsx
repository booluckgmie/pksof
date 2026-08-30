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

function isScreenId(v: string | null): v is ScreenId {
  return !!v && Object.prototype.hasOwnProperty.call(screens, v);
}

/** Main has no `?screen=` param at all — a bare root URL should stay a clean root URL. */
function readScreenFromUrl(): ScreenId {
  const s = new URLSearchParams(window.location.search).get("screen");
  return isScreenId(s) ? s : "MAIN";
}

function AuthedApp() {
  const { loggedIn, isRestrictedPillar, homeEntityName, role } = useSession();
  const [screen, setScreen] = useState<ScreenId>(() => readScreenFromUrl());
  const [loginOpen, setLoginOpen] = useState(false);
  const prevLoggedIn = useRef(loggedIn);

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
    const onPopState = () => setScreen(readScreenFromUrl());
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  // Sign-in and sign-out both land back on Main — never carries a gated screen across the switch.
  // Guarded to actual transitions (not the initial mount) so a deep link isn't reset on load.
  useEffect(() => {
    if (prevLoggedIn.current !== loggedIn) navigate("MAIN", { replace: true });
    prevLoggedIn.current = loggedIn;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loggedIn]);

  const loginRequired = LOGIN_REQUIRED_SCREENS.has(screen) && !loggedIn;
  const settingsBlocked = screen === "SETTINGS" && loggedIn && role !== "admin";
  const blocked = (isRestrictedPillar && HQ_ONLY_GROUPS.has(screens[screen].group)) || settingsBlocked || loginRequired;
  const Screen = SCREEN_MAP[screen];

  return (
    <Shell current={screen} onNavigate={navigate} onOpenLogin={() => setLoginOpen(true)}>
      {blocked ? (
        <div className="flex flex-col items-center justify-center text-center gap-3 rounded-lg border border-dashed border-[hsl(var(--pk-border))] py-16 px-6">
          <div className="h-10 w-10 rounded-full bg-[hsl(var(--pk-surface-2))] flex items-center justify-center">
            <Lock className="h-4 w-4 text-[hsl(var(--pk-ink-faint))]" />
          </div>
          <div className="font-head text-lg font-semibold text-[hsl(var(--pk-ink))]">
            {loginRequired ? "Sign in required" : settingsBlocked ? "System Administrator only" : `Not part of ${homeEntityName}'s pillar`}
          </div>
          <p className="text-sm text-[hsl(var(--pk-ink-faint))] max-w-[46ch]">
            {loginRequired
              ? "Uploading data and verifying/publishing submissions needs a real sign-in — browsing the dashboards doesn't."
              : settingsBlocked
                ? "Organisation-wide settings are restricted to the System Administrator role."
                : `This dashboard belongs to Prokhas' own scorecard. Your login is scoped to ${homeEntityName} and can't view it.`}
          </p>
          <button
            onClick={() => (loginRequired ? setLoginOpen(true) : navigate("MAIN"))}
            className="mt-1 rounded-md bg-[hsl(var(--pk-accent))] text-[hsl(var(--pk-accent-ink))] text-xs font-medium px-3 py-1.5 hover:opacity-90 transition-opacity"
          >
            {loginRequired ? "Sign in" : "Back to Main Screen"}
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
