import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import type { EntityId, Module, PeriodId, Role } from "@/types";
import { roleById } from "@/lib/roles";
import { entityById } from "@/data/entities";
import { resolveCurrentPeriodId } from "@/data/periods";
import { logLogin } from "@/lib/api/activity";
import { MODULE_LABEL } from "@/lib/modules";

/** The period whose calendar quarter contains today — sessions default to it until the user picks another. */
const latestPeriodId: PeriodId = resolveCurrentPeriodId();

interface AuthedSession {
  loggedIn: boolean;
  role: Role;
  userName: string;
  homeEntity: EntityId;
  entityId: EntityId;
  periodId: PeriodId;
  /** Set only for moduleLocked roles (Reporting Officer) — which one CP/FH/RP pillar within
   * `homeEntity` this login may upload/view. Null for every other role. */
  assignedModule: Module | null;
}

interface SessionContextValue extends AuthedSession {
  login: (args: { role: Role; userName: string; homeEntity: EntityId; periodId: PeriodId; assignedModule?: Module | null }) => void;
  logout: () => void;
  setEntityId: (id: EntityId) => void;
  setPeriodId: (id: PeriodId) => void;
  pillarLocked: boolean;
  moduleLocked: boolean;
  readOnly: boolean;
  canEnterData: boolean;
  canVerify: boolean;
  roleLabel: string;
  /** True when this login is confined to a single Managed Entity pillar — sees only its own data. */
  isRestrictedPillar: boolean;
  homeEntityName: string;
  entityName: string;
  /** "Corporate Performance" / "Financial Health" / "Resource & People", or null if not moduleLocked. */
  assignedModuleLabel: string | null;
}

const SessionContext = createContext<SessionContextValue | null>(null);

const DEFAULT: AuthedSession = {
  loggedIn: false,
  role: "exec",
  userName: "",
  homeEntity: "HQ",
  entityId: "HQ",
  periodId: latestPeriodId,
  assignedModule: null,
};

export function SessionProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthedSession>(DEFAULT);

  const value = useMemo<SessionContextValue>(() => {
    const roleDef = roleById(state.role);
    return {
      ...state,
      pillarLocked: roleDef.pillarLocked,
      moduleLocked: roleDef.moduleLocked,
      readOnly: roleDef.readOnly,
      canEnterData: roleDef.canEnterData,
      canVerify: roleDef.canVerify,
      roleLabel: roleDef.label,
      isRestrictedPillar: roleDef.pillarLocked && state.homeEntity !== "HQ",
      homeEntityName: entityById(state.homeEntity).name,
      entityName: entityById(state.entityId).name,
      assignedModuleLabel: state.assignedModule ? MODULE_LABEL[state.assignedModule] : null,
      login: ({ role, userName, homeEntity, periodId, assignedModule }) => {
        const mod = roleById(role).moduleLocked ? (assignedModule ?? entityById(homeEntity).modules[0]) : null;
        setState({ loggedIn: true, role, userName, homeEntity, entityId: homeEntity, periodId, assignedModule: mod });
        logLogin({ userName, role, entityId: homeEntity, detail: mod ? `Signed in as ${roleById(role).label} — ${MODULE_LABEL[mod]}` : undefined });
      },
      logout: () => setState(DEFAULT),
      setEntityId: (id) =>
        setState((s) => ({ ...s, entityId: roleById(s.role).pillarLocked ? s.homeEntity : id })),
      setPeriodId: (id) => setState((s) => ({ ...s, periodId: id })),
    };
  }, [state]);

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession() {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error("useSession must be used within SessionProvider");
  return ctx;
}
