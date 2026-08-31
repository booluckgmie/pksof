-- Reverses part of 0012's "no update/delete policy" stance. Per request: Head of Department and
-- System Administrator need to be able to remove a mistaken or duplicate upload record from the
-- Upload History log. This only deletes the audit-trail row (upload_events, cascading to
-- upload_event_rows via its existing "on delete cascade" FK from 0012) — it does NOT touch the
-- KPI submissions, detail_metrics, or detail_records that upload already wrote; those are a
-- separate, already-committed write and this is not an "undo".
create policy "public delete upload_events" on upload_events for delete using (true);
create policy "public delete upload_event_rows" on upload_event_rows for delete using (true);
-- Same production caveat as every other "public" policy in this schema (see README's RLS
-- section): tie this to a signed-in, role-checked user (admin/dept_head only) before this is real.
