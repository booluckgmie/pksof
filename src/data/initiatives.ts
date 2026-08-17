/** Status values used across initiative/programme tracking tables — the underlying data now
 * lives in Supabase (detail_records, record_type in ('process_initiative','tech_initiative')),
 * shaped by src/lib/details.tsx. This file only keeps the shared type. */
export type InitiativeStatus = "Completed" | "In Progress" | "Planned" | "Delayed" | "On Hold";
