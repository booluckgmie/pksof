-- detail_metrics.note was varchar(500), sized for the original short operational notes
-- (variance_commentary's driver sentences, recruitment_index's score/computation strings). The
-- new section_highlight box (src/components/pk/HighlightEditor.tsx) writes a full narrative
-- paragraph per section per quarter -- the "Actual vs Budget vs PY" one alone ran past 500 chars
-- covering Income/Expenses/PBT commentary in one box -- so saving it failed with "value too long
-- for type character varying(500)", surfaced to the user as a generic "check your connection"
-- toast. Same class of bug as 0013's detail_records.text_note widening; same fix.
alter table detail_metrics alter column note type varchar(2000);
