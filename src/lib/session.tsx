import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import type { EntityId, PeriodId, Role } from "@/types";
import { roleById } from "@/lib/roles";
import { entityById } from "@/data/entities";
import { resolveCurrentPeriodId } from "@/data/periods";
import { logLogin } from "@/lib/api/activity";

/** The period whose calendar quarter contains today — sessions default to it until the user picks another. */
const latestPeriodId: PeriodId = resolveCurrentPeriodId();

interface AuthedSession {
  loggedIn: boolean;
  role: Role;
  userName: string;
  homeEntity: EntityId;
  entityId: EntityId;
  periodId: PeriodId;
}

interface SessionContextValue extends AuthedSession {
  login: (args: { role: Role; userName: string; homeEntity: EntityId; periodId: PeriodId }) => void;
  logout: () => void;
  setEntityId: (id: EntityId) => void;
  setPeriodId: (id: PeriodId) => void;
  pillarLocked: boolean;
  readOnly: boolean;
  canEnterData: boolean;
  canVerify: boolean;
  roleLabel: string;
  /** True when this login is confined to a single Managed Entity pillar — sees only its own data. */
  isRestrictedPillar: boolean;
  homeEntityName: string;
  entityName: string;
}

const SessionContext = createContext<SessionContextValue | null>(null);

const DEFAULT: AuthedSession = {
  loggedIn: false,
  role: "exec",
  userName: "",
  homeEntity: "HQ",
  entityId: "HQ",
  periodId: latestPeriodId,
};

export function SessionProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthedSession>(DEFAULT);

  const value = useMemo<SessionContextValue>(() => {
    const roleDef = roleById(state.role);
    return {
      ...state,
      pillarLocked: roleDef.pillarLocked,
      readOnly: roleDef.readOnly,
      canEnterData: roleDef.canEnterData,
      canVerify: roleDef.canVerify,
      roleLabel: roleDef.label,
      isRestrictedPillar: roleDef.pillarLocked && state.homeEntity !== "HQ",
      homeEntityName: entityById(state.homeEntity).name,
      entityName: entityById(state.entityId).name,
      login: ({ role, userName, homeEntity, periodId }) => {
        setState({ loggedIn: true, role, userName, homeEntity, entityId: homeEntity, periodId });
        logLogin({ userName, role, entityId: homeEntity });
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
