export interface GlossaryTerm {
  term: string;
  definition: string;
}

/** Abbreviations used across the dashboard's screens — reference only, not tied to any KPI. */
export const glossaryTerms: GlossaryTerm[] = [
  { term: "4Q", definition: "4 Quotients" },
  { term: "AI", definition: "Artificial Intelligence" },
  { term: "BUR", definition: "Business Unit Representatives" },
  { term: "CDMS", definition: "Consolidated Debt Monitoring System" },
  { term: "CGP", definition: "Cloud Governance Policy" },
  { term: "CM", definition: "Capital Markets Department" },
  { term: "CSA", definition: "Current State Assessment" },
  { term: "ELDP", definition: "Executive Leadership Development Programme" },
  { term: "FSR", definition: "Future State Report" },
  { term: "ICTC", definition: "Information & Communications Technology Committee" },
  { term: "IDP", definition: "Individual Development Plan" },
  { term: "ISLDP", definition: "Inspire Senior Leadership Development Programme" },
  { term: "JE", definition: "Job Evaluation" },
  { term: "LDP", definition: "Leadership Development Programme" },
  { term: "MLDP", definition: "Manager Leadership Development Programme" },
  { term: "MRF", definition: "Manpower Requisition Form" },
  { term: "OED", definition: "Operational Excellence Department" },
  { term: "PMS", definition: "Performance Management System" },
  { term: "RFI", definition: "Request For Information" },
  { term: "RFQ", definition: "Request For Quotation" },
  { term: "SSO", definition: "Single Sign-On" },
  { term: "UAT", definition: "User Acceptance Test" },
  { term: "UI", definition: "User Interface" },
  { term: "UPS", definition: "Uninterruptible Power Supply" },
];
