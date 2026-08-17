import type { Perspective } from "@/types";

export const perspectives: Perspective[] = [
  { id: "FIN", code: "CP003", name: "Financial", weight: 0.25, screenCode: "CP003", icon: "landmark" },
  { id: "MG", code: "CP004", name: "Mandate & Governance", weight: 0.15, screenCode: "CP004", icon: "shield-check" },
  { id: "CUST", code: "CP005", name: "Customer", weight: 0.15, screenCode: "CP005", icon: "users" },
  { id: "IBP", code: "CP006", name: "Internal Business Process", weight: 0.20, screenCode: "CP006", icon: "workflow" },
  { id: "OC", code: "CP007", name: "Organisational Capacity", weight: 0.20, screenCode: "CP007", icon: "graduation-cap" },
  { id: "BE", code: "CP008", name: "Bumiputera Empowerment", weight: 0.05, screenCode: "CP008", icon: "handshake" },
];

export const perspectiveById = (id: string) => perspectives.find((p) => p.id === id)!;
