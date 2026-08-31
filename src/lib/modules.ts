import type { Module } from "@/types";

/** Canonical CP/FH/RP labels — the exact sheet names the Excel template writes
 * (src/lib/excelTemplate.ts's SHEET_NAMES) and Entity.modules' code order everywhere else in the
 * app, so login's pillar picker, the Uploads progress grid, and Data Entry's upload filter can't
 * drift into three different label sets. */
export const MODULE_LABEL: Record<Module, string> = {
  CP: "Corporate Performance",
  FH: "Financial Health",
  RP: "Resource & People",
};

export const MODULE_ORDER: Module[] = ["CP", "FH", "RP"];
