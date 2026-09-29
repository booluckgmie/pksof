-- Same bug 0009 already fixed for detail_records.id, reintroduced in 0016: detail_submissions.
-- record_id carries the same deterministic id DataEntry.tsx builds for a record-dest row
-- (`TPL-<record_type>-<slugified label>-<period_id>`, see src/pages/workflow/DataEntry.tsx's
-- `recordId: id`) — the same value that lands in detail_records.id once approved. That column was
-- widened to varchar(160) in 0009 for exactly this reason (long labels like Governance Index's
-- "Completion of Anti-Corruption Strategy initiatives" run past 40 chars), but detail_submissions
-- was created fresh in 0016 with record_id back at varchar(40), so every Excel upload of a
-- long-labelled Financial Health/Resource & People record row fails with a silent "value too long
-- for type character varying(40)" error. Match 0009's width so the two columns stay in sync.
alter table detail_submissions alter column record_id type varchar(160);

-- Same class of bug, same fix, for text_note: 0013 widened detail_records.text_note to varchar(2000)
-- because packed narrative text (e.g. People Development Programme's "start|end|status|detail" rows)
-- runs well past 500 chars. detail_submissions.text_note holds that same value pre-approval, so it
-- needs the same width or an Excel upload with a long note fails the same silent way.
alter table detail_submissions alter column text_note type varchar(2000);
