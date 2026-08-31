-- detail_records.text_note was varchar(500), sized for the original short operational notes.
-- The People Development Programme's "start|end|status|detail" packed text (src/lib/details.tsx,
-- CP009's add/edit form) can run well past that once a quarter's narrative detail is fully
-- transcribed -- e.g. seed.sql's SEED-0026/SEED-0028 rows run to ~610 chars -- so every seed/
-- upload of those rows silently failed with "value too long for type character varying(500)".
-- Widen the column; 2000 comfortably covers the longest transcribed note with headroom.
alter table detail_records alter column text_note type varchar(2000);
