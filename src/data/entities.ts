import type { Entity } from "@/types";

/** Corporate Performance is Prokhas' own scorecard for managing the Group — a Managed Entity
 * doesn't have one of its own, only its Financial Health and Resource & People pillars (which
 * feed CP004's "Managed Entities Rating" roll-up back up to Prokhas). Only HQ carries CP. */
export const entities: Entity[] = [
  { id: "HQ", name: "Prokhas", fullName: "Prokhas", kind: "HQ", modules: ["CP", "FH", "RP"] },
  { id: "SJPP", name: "SJPP", fullName: "Syarikat Jaminan Pembiayaan Perniagaan", kind: "ME", modules: ["FH", "RP"] },
  { id: "SJKP", name: "SJKP", fullName: "Syarikat Jaminan Kredit Perumahan", kind: "ME", modules: ["FH", "RP"] },
  { id: "DANAHARTA", name: "DanaHarta", fullName: "Danaharta Nasional Berhad", kind: "ME", modules: ["FH", "RP"] },
  { id: "DANAINFRA", name: "DanaInfra", fullName: "DanaInfra Nasional Berhad", kind: "ME", modules: ["FH", "RP"] },
  { id: "GOVCO", name: "GovCo", fullName: "GovCo Holdings", kind: "ME", modules: ["FH", "RP"] },
];

export const entityById = (id: string) => entities.find((e) => e.id === id)!;
