-- ── Tighten write RLS policies flagged by Supabase's security advisor ──────
-- 0001's "public insert/update ... with check (true)" policies on submissions
-- and fact_kpi_results are flagged because they let anyone holding the public
-- key write literally anything to those tables via the REST API, bypassing
-- the app's maker-checker workflow entirely.
--
-- Real Supabase Auth still isn't wired up (see supabase/README.md), so these
-- can't yet be tied to auth.uid()/app_users -- that's still the real fix,
-- tracked as a follow-up. In the meantime, replace the blanket "true" checks
-- with checks that enforce the actual state machine, so a client can no
-- longer forge data even without a real identity behind the request:
--   * a submission can only ever be *inserted* as 'submitted' (no skipping
--     the checker queue by inserting a pre-published row);
--   * a submission can only be *updated* out of 'submitted' into a reviewed
--     state, and never edited again once reviewed;
--   * fact_kpi_results can only be written for a kpi/entity/period/value that
--     has a matching *published* row in submissions -- i.e. every published
--     figure must trace back to something that went through the queue.

drop policy if exists "public insert submissions" on submissions;
drop policy if exists "public update submissions" on submissions;
drop policy if exists "public insert fact_kpi_results" on fact_kpi_results;
drop policy if exists "public update fact_kpi_results" on fact_kpi_results;

create policy "insert submissions as submitted" on submissions
  for insert
  with check (status = 'submitted');

create policy "update submissions from submitted" on submissions
  for update
  using (status = 'submitted')
  with check (status in ('published', 'rejected'));

create policy "insert fact_kpi_results from published submission" on fact_kpi_results
  for insert
  with check (
    exists (
      select 1 from submissions s
      where s.kpi_id = fact_kpi_results.kpi_id
        and s.entity_id = fact_kpi_results.entity_id
        and s.period_id = fact_kpi_results.period_id
        and s.status = 'published'
        and s.value = fact_kpi_results.ytd_actual
    )
  );

create policy "update fact_kpi_results from published submission" on fact_kpi_results
  for update
  using (
    exists (
      select 1 from submissions s
      where s.kpi_id = fact_kpi_results.kpi_id
        and s.entity_id = fact_kpi_results.entity_id
        and s.period_id = fact_kpi_results.period_id
        and s.status = 'published'
    )
  )
  with check (
    exists (
      select 1 from submissions s
      where s.kpi_id = fact_kpi_results.kpi_id
        and s.entity_id = fact_kpi_results.entity_id
        and s.period_id = fact_kpi_results.period_id
        and s.status = 'published'
        and s.value = fact_kpi_results.ytd_actual
    )
  );
