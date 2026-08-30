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
  },
  {
    id: "exec",
    label: "Executive Management",
    description: "Full access with drill-down, across all entities.",
    canEnterData: false,
    canVerify: false,
    readOnly: true,
    pillarLocked: false,
  },
  {
    id: "dept_head",
    label: "Department Head",
    description: "Dashboards within scope, plus verify-and-publish sign-off for their own pillar.",
    canEnterData: false,
    canVerify: true,
    readOnly: true,
    pillarLocked: true,
  },
  {
    id: "reporting_officer",
    label: "Reporting Officer",
    description: "Data input where permitted, plus report generation. Own pillar only.",
    canEnterData: true,
    canVerify: false,
    readOnly: false,
    pillarLocked: true,
  },
  {
    id: "admin",
    label: "System Administrator",
    description: "Full access and maintenance, unrestricted.",
    canEnterData: true,
    canVerify: true,
    readOnly: false,
    pillarLocked: false,
  },
];

export const roleById = (id: string) => roleDefs.find((r) => r.id === id)!;
