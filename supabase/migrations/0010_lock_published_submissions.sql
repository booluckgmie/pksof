-- Reverses migration 0008. Per the 28 Aug 2026 Prokhas progress meeting: "after lock/HoD
-- approved, cannot edit" -- a published figure is meant to be immutable once released, full
-- stop. 0008 had opened a permissive UPDATE policy so a published submission's value could be
-- corrected in place; that's now the wrong principle, and it also masked a real bug --
-- updateSubmissionValue() (src/lib/api/submissions.ts) still filtered on status = 'submitted',
-- so an "edit" of a published row silently matched zero rows in `submissions` while still
-- pushing the new figure into fact_kpi_results, leaving the two tables out of sync. Dropping
-- this policy restores "submitted -> published/rejected is the only mutation a submission ever
-- gets" as a database-enforced guarantee, matching migration 0002's original intent.
drop policy if exists "edit published submissions in place" on submissions;
