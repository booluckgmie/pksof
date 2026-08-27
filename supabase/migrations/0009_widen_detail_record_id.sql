-- detail_records.id was varchar(40), sized for the original handful of hand-picked ids
-- (e.g. 'INIT-001'). The 3-pillar Excel template (scripts/generate_data_entry_template.py)
-- derives a deterministic id per row instead -- `TPL-<record_type>-<slugified label>-<period_id>`
-- -- so it can upsert idempotently on re-upload. For longer labels (e.g. governance_index's
-- "Completion of Anti-Corruption Strategy initiatives") that id runs to ~80 chars, well past the
-- 40-char cap, so every upload of those rows failed with a silent "value too long for type
-- character varying(40)" error. Widen the column; 160 comfortably covers the longest label
-- (varchar(200), see 0003) plus the TPL-/record_type/period_id wrapper.
alter table detail_records alter column id type varchar(160);
