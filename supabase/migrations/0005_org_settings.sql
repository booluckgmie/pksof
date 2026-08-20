-- ── Org-wide settings: currently just the fiscal year-end month ─────────────
-- Per Progress Meeting #1: the Dec fiscal year-end was a hardcoded assumption
-- (src/data/periods.ts's FISCAL_YEAR_END_MONTH constant) that the client
-- wants admin-settable and documented in writing, in case the Group ever
-- moves off a calendar-year FY. Single-row table rather than a generic
-- key/value store — there's exactly one org-wide setting today, and adding
-- more later is a column-add, not a schema redesign.

create table org_settings (
  id                      integer primary key default 1 check (id = 1),
  fiscal_year_end_month   integer not null default 11 check (fiscal_year_end_month between 0 and 11),
  updated_at              timestamptz not null default now(),
  updated_by              varchar(120)
);

insert into org_settings (id, fiscal_year_end_month) values (1, 11);

alter table org_settings enable row level security;

create policy "public read org_settings" on org_settings for select using (true);

-- Same open-write caveat as detail_metrics/detail_records (0003) -- no real
-- auth yet to check against. The System Administrator-only screen is an
-- application-layer gate, not a database one; tie this to auth.uid() + role
-- before production, same as everything else flagged in supabase/README.md.
create policy "public update org_settings" on org_settings for update using (true) with check (true);
