import type { Entity } from "@/types";

export const entities: Entity[] = [
  { id: "HQ", name: "Prokhas", fullName: "Prokhas", kind: "HQ", modules: ["CP", "FH", "RP"] },
  { id: "SJPP", name: "SJPP", fullName: "Syarikat Jaminan Pembiayaan Perniagaan", kind: "ME", modules: ["CP", "FH"] },
  { id: "SJKP", name: "SJKP", fullName: "Syarikat Jaminan Kredit Perumahan", kind: "ME", modules: ["CP", "FH"] },
  { id: "DANAHARTA", name: "DanaHarta", fullName: "Danaharta Nasional Berhad", kind: "ME", modules: ["CP", "FH"] },
  { id: "DANAINFRA", name: "DanaInfra", fullName: "DanaInfra Nasional Berhad", kind: "ME", modules: ["CP", "FH"] },
  { id: "GOVCO", name: "GovCo", fullName: "GovCo Holdings", kind: "ME", modules: ["CP", "FH"] },
];

export const entityById = (id: string) => entities.find((e) => e.id === id)!;
