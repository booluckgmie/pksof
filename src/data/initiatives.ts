// SAMPLE / DUMMY DATA — illustrative only.

export type InitiativeStatus = "Completed" | "In Progress" | "Planned" | "Delayed" | "On Hold";

export const processInitiatives = [
  { name: "eGLS Refresh Project", start: "Q1", end: "Q4", status: "In Progress" as InitiativeStatus, nextAction: "Finalise design documents; development in progress" },
  { name: "Migration to New Email System", start: "Q1", end: "Q3", status: "In Progress" as InitiativeStatus, nextAction: "Submit draft Future State Report in Apr" },
  { name: "Group / ME Performance Dashboard (Pilot)", start: "Q1", end: "Q3", status: "In Progress" as InitiativeStatus, nextAction: "Requirements gathering with stakeholders" },
];

export const techInitiatives = [
  { name: "UPS Refresh Project", start: "Q2", end: "Q3", status: "Planned" as InitiativeStatus, nextAction: "Memo approval" },
  { name: "AI Infrastructure Project", start: "Q1", end: "Q3", status: "In Progress" as InitiativeStatus, nextAction: "RFQ issuance" },
  { name: "Server Refresh Project", start: "Q1", end: "Q4", status: "In Progress" as InitiativeStatus, nextAction: "RFQ issuance" },
  { name: "Secondary Internet Lease Line", start: "Q2", end: "Q3", status: "Planned" as InitiativeStatus, nextAction: "Memo approval" },
  { name: "Single Sign-On for Internal Apps", start: "Q2", end: "Q4", status: "Planned" as InitiativeStatus, nextAction: "RFI finalisation" },
  { name: "Phishing Simulation Subscription", start: "Q1", end: "Q2", status: "In Progress" as InitiativeStatus, nextAction: "Evaluation" },
];

export const managedEntityRatings = [
  { entity: "SJPP", met: 4, notMet: 1, notMeasured: 0, total: 5, achievement: 82, status: "On track" as const },
  { entity: "SJKP", met: 3, notMet: 2, notMeasured: 0, total: 5, achievement: 61, status: "Attention" as const },
  { entity: "DanaInfra", met: 5, notMet: 0, notMeasured: 0, total: 5, achievement: 97, status: "On track" as const },
  { entity: "DanaHarta", met: 3, notMet: 1, notMeasured: 1, total: 5, achievement: 74, status: "On track" as const },
  { entity: "GovCo", met: 2, notMet: 1, notMeasured: 2, total: 5, achievement: 63, status: "Attention" as const },
];

export const clientSatisfaction = {
  fyTarget: 4.7,
  ytdActual: null as number | null,
  note: "Bi-annual client survey — next round scheduled Q2 FY2026",
};

export const timeCharterCompliance = [
  { service: "Client Enquiries", targetSla: "2 working days", status: "On Track" as const },
  { service: "Management Requests", targetSla: "5 working days", status: "On Track" as const },
  { service: "Stakeholder Reporting", targetSla: "3 working days", status: "Monitoring" as const },
  { service: "Complaint Resolution", targetSla: "14 working days", status: "On Track" as const },
];

export const governanceIndex = [
  { item: "Audit closure against observations due", target: 0.85, note: "Progress reporting only in Q1" },
  { item: "Satisfactory rating (≥3) in audit findings", target: 3.0, note: "Progress reporting only in Q1" },
  { item: "Implementation of Risk Action Plan within timeline", target: 0.80, note: "Progress reporting only in Q1" },
  { item: "Completion of Anti-Corruption Strategy initiatives", target: 0.80, note: "No initiatives due in Q1" },
  { item: "Zero cases under MACC", target: 0, note: "0 cases recorded to date" },
];

export const bumiputeraProcurement = [
  { dept: "Administration & Security", fyTarget: 0.25, ytdActual: 0.11 },
  { dept: "Corporate Communications", fyTarget: 0.25, ytdActual: 0.06 },
  { dept: "Information Technology", fyTarget: 1.70, ytdActual: 0.65 },
];
