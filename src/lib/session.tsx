import { createContext, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import type { EntityId, Module, PeriodId, Role } from "@/types";
import { roleById } from "@/lib/roles";
import { entityById } from "@/data/entities";
import { resolveCurrentPeriodId } from "@/data/periods";
import { logLogin } from "@/lib/api/activity";
import { MODULE_LABEL } from "@/lib/modules";
import { getSupabase } from "@/lib/supabase";

/** The period whose calendar quarter contains today — sessions default to it until the user picks another. */
const latestPeriodId: PeriodId = resolveCurrentPeriodId();

/** Everything a real sign-in resolves from `app_users` — distinct from `entityId`/`periodId`
 * below, which stay locally adjustable (an unrestricted role browsing a different Managed
 * Entity, or a different reporting period) independent of who's signed in. */
interface Identity {
  loggedIn: boolean;
  role: Role;
  userName: string;
  homeEntity: EntityId;
  assignedModule: Module | null;
  /** Mirrors app_users.must_change_password — true for every seeded "prokhas"-default account
   * until they set their own password. */
  mustChangePassword: boolean;
}

interface AppUserRow {
  id: string;
  display_name: string;
  role: Role;
  home_entity: EntityId;
  assigned_module: Module | null;
  must_change_password: boolean;
  active: boolean;
}

interface AuthedSession extends Identity {
  entityId: EntityId;
  periodId: PeriodId;
}

interface SessionContextValue extends AuthedSession {
  /** Resolves `username` -> email, then signs in with Supabase Auth. Returns an error message to
   * show the user, or null on success — deliberately the same message for "no such username" and
   * "wrong password" so a failed attempt doesn't reveal which half was wrong. */
  login: (username: string, password: string) => Promise<string | null>;
  logout: () => void;
  setEntityId: (id: EntityId) => void;
  setPeriodId: (id: PeriodId) => void;
  pillarLocked: boolean;
  moduleLocked: boolean;
  readOnly: boolean;
  canEnterData: boolean;
  canVerify: boolean;
  canDelete: boolean;
  roleLabel: string;
  /** True when this login is confined to a single Managed Entity pillar — sees only its own data. */
  isRestrictedPillar: boolean;
  homeEntityName: string;
  entityName: string;
  /** "Corporate Performance" / "Financial Health" / "Resource & People", or null if not moduleLocked. */
  assignedModuleLabel: string | null;
  /** True once the page-load session check has resolved (whether or not a session was found) —
   * lets App.tsx tell "still restoring a saved session" apart from "genuinely signed out", so a
   * refresh on a gated screen doesn't get bounced to MAIN while that check is still in flight. */
  authReady: boolean;
  /** True while a password-recovery link's one-time session is active. Distinct from a normal
   * `mustChangePassword` login, since no `app_users` identity is resolved for it. */
  passwordRecovery: boolean;
}

const SessionContext = createContext<SessionContextValue | null>(null);

const DEFAULT_IDENTITY: Identity = {
  loggedIn: false,
  role: "exec",
  userName: "",
  homeEntity: "HQ",
  assignedModule: null,
  mustChangePassword: false,
};

export function SessionProvider({ children }: { children: ReactNode }) {
  const [identity, setIdentity] = useState<Identity>(DEFAULT_IDENTITY);
  const [entityId, setEntityIdState] = useState<EntityId>("HQ");
  const [periodId, setPeriodId] = useState<PeriodId>(latestPeriodId);
  const [authReady, setAuthReady] = useState(false);
  const [passwordRecovery, setPasswordRecovery] = useState(false);
  // The auth.users id the current identity was last resolved from — so a token refresh (which
  // also fires an auth-state event) doesn't re-fire the login activity-log entry.
  const resolvedForUserId = useRef<string | null>(null);

  useEffect(() => {
    const supabase = getSupabase();

    async function resolveIdentity(userId: string | null, logIfNew: boolean) {
      if (!userId) {
        setIdentity(DEFAULT_IDENTITY);
        setEntityIdState("HQ");
        resolvedForUserId.current = null;
        return;
      }
      const { data, error } = await supabase
        .from("app_users")
        .select("id, display_name, role, home_entity, assigned_module, must_change_password, active")
        .eq("auth_user_id", userId)
        .maybeSingle();
      const row = data as AppUserRow | null;
      if (error || !row || !row.active) {
        // Supabase accepted the password, but there's no matching (or no longer active)
        // app_users row — not a valid login for this app. Clear the dangling auth session too,
        // so a deactivated account can't stay signed in on a device from before it was disabled.
        await supabase.auth.signOut();
        setIdentity(DEFAULT_IDENTITY);
        setEntityIdState("HQ");
        resolvedForUserId.current = null;
        return;
      }
      setIdentity({
        loggedIn: true,
        role: row.role,
        userName: row.display_name,
        homeEntity: row.home_entity,
        assignedModule: row.assigned_module,
        mustChangePassword: row.must_change_password,
      });
      setEntityIdState(row.home_entity);
      // A resolved identity supersedes recovery mode either way — covers the password-recovery
      // link's flow, where setting a new password fires USER_UPDATED and this re-resolves.
      setPasswordRecovery(false);
      if (logIfNew && resolvedForUserId.current !== userId) {
        logLogin({
          userName: row.display_name,
          role: row.role,
          entityId: row.home_entity,
          detail: row.assigned_module ? `Signed in as ${roleById(row.role).label} — ${MODULE_LABEL[row.assigned_module]}` : undefined,
        });
      }
      resolvedForUserId.current = userId;
    }

    supabase.auth.getSession().then(({ data }) => {
      resolveIdentity(data.session?.user.id ?? null, false).finally(() => setAuthReady(true));
    });

    const { data: subscription } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY") {
        // A recovery link's one-time session — not a real login, so no app_users lookup yet;
        // the "set a new password" screen handles it directly via supabase.auth.updateUser().
        setPasswordRecovery(true);
        return;
      }
      if (event === "SIGNED_OUT") {
        setPasswordRecovery(false);
        resolveIdentity(null, false);
        return;
      }
      if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED" || event === "USER_UPDATED") {
        resolveIdentity(session?.user.id ?? null, event === "SIGNED_IN");
      }
    });

    return () => subscription.subscription.unsubscribe();
  }, []);

  const value = useMemo<SessionContextValue>(() => {
    const roleDef = roleById(identity.role);
    return {
      ...identity,
      entityId,
      periodId,
      pillarLocked: roleDef.pillarLocked,
      moduleLocked: roleDef.moduleLocked,
      readOnly: roleDef.readOnly,
      canEnterData: roleDef.canEnterData,
      canVerify: roleDef.canVerify,
      canDelete: roleDef.canDelete,
      roleLabel: roleDef.label,
      isRestrictedPillar: roleDef.pillarLocked && identity.homeEntity !== "HQ",
      homeEntityName: entityById(identity.homeEntity).name,
      entityName: entityById(entityId).name,
      assignedModuleLabel: identity.assignedModule ? MODULE_LABEL[identity.assignedModule] : null,
      authReady,
      passwordRecovery,
      login: async (username, password) => {
        const trimmed = username.trim();
        if (!trimmed || !password) return "Enter your username and password.";
        const { data: email } = await getSupabase().rpc("resolve_login_email", { p_username: trimmed });
        if (!email) return "Incorrect username or password.";
        const { error } = await getSupabase().auth.signInWithPassword({ email, password });
        if (error) return "Incorrect username or password.";
        return null;
      },
      logout: () => {
        getSupabase().auth.signOut();
      },
      setEntityId: (id) =>
        setEntityIdState(roleById(identity.role).pillarLocked ? identity.homeEntity : id),
      setPeriodId: (id) => setPeriodId(id),
    };
  }, [identity, entityId, periodId, authReady, passwordRecovery]);

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession() {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error("useSession must be used within SessionProvider");
  return ctx;
}
