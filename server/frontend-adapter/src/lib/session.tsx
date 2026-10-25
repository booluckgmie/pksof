// Replaces src/lib/session.tsx. Keeps the exact same useSession() shape every screen already
// depends on (SessionContextValue below is unchanged) — only how identity is established
// changes: a JWT in localStorage + GET /api/auth/me instead of Supabase's own session object +
// onAuthStateChange. See apiClient.ts for the token storage helpers this uses.
import { createContext, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import type { EntityId, Module, PeriodId, Role } from "@/types";
import { roleById } from "@/lib/roles";
import { entityById } from "@/data/entities";
import { resolveCurrentPeriodId } from "@/data/periods";
import { MODULE_LABEL } from "@/lib/modules";
import { apiFetch, ApiError, getToken, setToken } from "@/lib/apiClient";

const latestPeriodId: PeriodId = resolveCurrentPeriodId();

interface Identity {
  loggedIn: boolean;
  role: Role;
  userName: string;
  homeEntity: EntityId;
  assignedModule: Module | null;
  mustChangePassword: boolean;
}

interface MeResponseUser {
  id: string; displayName: string; role: Role; homeEntity: EntityId; email: string;
  assignedModule: Module | null; mustChangePassword: boolean;
}

interface AuthedSession extends Identity {
  entityId: EntityId;
  periodId: PeriodId;
}

interface SessionContextValue extends AuthedSession {
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
  isRestrictedPillar: boolean;
  homeEntityName: string;
  entityName: string;
  assignedModuleLabel: string | null;
  authReady: boolean;
  /** True while a password-reset link (its one-time token is in the URL — see
   * ResetPassword.tsx) is active and hasn't been used yet. Unlike the old Supabase-session-event
   * version, this is a pure read of the URL, not an auth-state subscription. */
  passwordRecovery: boolean;
  /** Re-resolves identity from the current token (e.g. after change-password clears
   * mustChangePassword) — there's no auth-state event to react to anymore, so a caller that
   * just changed something about its own account calls this directly instead. */
  refreshIdentity: () => Promise<void>;
}

const SessionContext = createContext<SessionContextValue | null>(null);

const DEFAULT_IDENTITY: Identity = {
  loggedIn: false, role: "exec", userName: "", homeEntity: "HQ", assignedModule: null, mustChangePassword: false,
};

function toIdentity(user: MeResponseUser): Identity {
  return {
    loggedIn: true, role: user.role, userName: user.displayName, homeEntity: user.homeEntity,
    assignedModule: user.assignedModule, mustChangePassword: user.mustChangePassword,
  };
}

export function SessionProvider({ children }: { children: ReactNode }) {
  const [identity, setIdentity] = useState<Identity>(DEFAULT_IDENTITY);
  const [entityId, setEntityIdState] = useState<EntityId>("HQ");
  const [periodId, setPeriodId] = useState<PeriodId>(latestPeriodId);
  const [authReady, setAuthReady] = useState(false);
  const resolvedForUserId = useRef<string | null>(null);

  const passwordRecovery = useMemo(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get("screen") === "RESET_PASSWORD" && Boolean(params.get("token")) && !identity.loggedIn;
  }, [identity.loggedIn]);

  const restoreIdentity = async () => {
    const token = getToken();
    if (!token) {
      setIdentity(DEFAULT_IDENTITY);
      return;
    }
    try {
      const { user } = await apiFetch<{ user: MeResponseUser }>("/auth/me");
      setIdentity(toIdentity(user));
      setEntityIdState(user.homeEntity);
      resolvedForUserId.current = user.id;
    } catch {
      // Expired/invalid token — same as never having signed in.
      setToken(null);
      setIdentity(DEFAULT_IDENTITY);
    }
  };

  useEffect(() => {
    restoreIdentity().finally(() => setAuthReady(true));
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
        try {
          const { token, user } = await apiFetch<{ token: string; user: MeResponseUser }>("/auth/login", {
            method: "POST",
            body: { username: trimmed, password },
          });
          setToken(token);
          setIdentity(toIdentity(user));
          setEntityIdState(user.homeEntity);
          resolvedForUserId.current = user.id;
          return null;
        } catch (err) {
          return err instanceof ApiError ? err.message : "Incorrect username or password.";
        }
      },
      logout: () => {
        setToken(null);
        setIdentity(DEFAULT_IDENTITY);
        setEntityIdState("HQ");
        resolvedForUserId.current = null;
        void apiFetch("/auth/logout", { method: "POST" }).catch(() => {});
      },
      setEntityId: (id) => setEntityIdState(roleById(identity.role).pillarLocked ? identity.homeEntity : id),
      setPeriodId: (id) => setPeriodId(id),
      refreshIdentity: restoreIdentity,
    };
  }, [identity, entityId, periodId, authReady, passwordRecovery]);

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession() {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error("useSession must be used within SessionProvider");
  return ctx;
}
