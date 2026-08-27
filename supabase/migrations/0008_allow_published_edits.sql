-- Allow a published submission's value/note to be edited in place, per client request.
-- 0002_tighten_write_policies.sql's "update submissions from submitted" policy only permits
-- moving a row *out of* 'submitted' into a reviewed state — once status = 'published', the
-- USING clause never matches again, so the row can never be touched. This adds a second
-- permissive UPDATE policy so a published row can also be updated while staying published
-- (correcting a figure directly, without reopening the maker-checker review step).
--
-- Trade-off, spelled out: this weakens the audit-trail guarantee described in
-- supabase/README.md's security note — a published figure can now change with no visible
-- approval trail behind the new value, unlike the submitted -> published/rejected transition
-- which still requires going through the checker queue. Kept as narrow as the requested
-- capability allows: status must stay 'published' (this policy can't be used to skip review
-- some other way, e.g. to publish a still-'submitted' row directly).

create policy "edit published submissions in place" on submissions
  for update
  using (status = 'published')
  with check (status = 'published');
