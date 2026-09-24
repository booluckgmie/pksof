import type { RoleDef } from "@/types";

export const roleDefs: RoleDef[] = [
  {
    id: "board",
    label: "Board & Directors",
    description: "Strategic dashboards and reports — read-only, all entities.",
    canEnterData: false,
    canVerify: false,
    readOnly: true,
    pillarLocked: false,
    moduleLocked: false,
  },
  {
    id: "exec",
    label: "Executive Management",
    description: "Full access with drill-down, across all entities.",
    canEnterData: false,
    canVerify: false,
    readOnly: true,
    pillarLocked: false,
    moduleLocked: false,
  },
  {
    id: "dept_head",
    label: "Department Head",
    description: "Dashboards within scope, plus verify-and-publish sign-off for their own pillar.",
    canEnterData: false,
    canVerify: true,
    readOnly: true,
    pillarLocked: true,
    // Was false — but the description above (and UAT feedback: "HOD to be assigned by pillar",
    // reviewers able to reach and act on other pillars' screens) both say a Department Head is
    // scoped to one pillar per entity, same shape as Reporting Officer. Now asks for a Pillar at
    // login (LoginDialog already renders that picker for any moduleLocked role) and every screen
    // outside that pillar is blocked the same way a Reporting Officer's is (see App.tsx).
    moduleLocked: true,
  },
  {
    id: "reporting_officer",
    label: "Reporting Officer",
    description: "Data input for one CP/FH/RP pillar within their entity, plus report generation.",
    canEnterData: true,
    canVerify: false,
    readOnly: false,
    pillarLocked: true,
    moduleLocked: true,
  },
  {
    id: "admin",
    label: "System Administrator",
    description: "Full access and maintenance, unrestricted.",
    canEnterData: true,
    canVerify: true,
    readOnly: false,
    pillarLocked: false,
    moduleLocked: false,
  },
];

export const roleById = (id: string) => roleDefs.find((r) => r.id === id)!;
