-- ── Allow correcting a pending submission's value before it's reviewed ──────
-- 0002's "update submissions from submitted" policy required the *new* row's
-- status to land on 'published' or 'rejected' -- so a submitter correcting a
-- typo in their own still-pending submission (status staying 'submitted')
-- was rejected by RLS along with everything else, since 'submitted' wasn't in
-- the allowed target list. Broaden the with check to also allow the row to
-- stay 'submitted': a submission can still only be edited while it's pending
-- (using clause unchanged), and once it moves to published/rejected it's
-- immutable again -- this only opens up in-place corrections before review,
-- not after.

drop policy if exists "update submissions from submitted" on submissions;

create policy "update submissions from submitted" on submissions
  for update
  using (status = 'submitted')
  with check (status in ('submitted', 'published', 'rejected'));
