-- ── Detail submissions: maker-checker queue for detail_metrics/detail_records ──
--
-- Until now, only the 13-KPI Scorecard sheet routed through submissions/Verify & Publish —
-- Financial Health and Resource & People's own figures (dest='metric'/'record' rows in the Excel
-- template — see src/lib/excelTemplate.ts, src/lib/templateFields.generated.ts) were written
-- straight to detail_metrics/detail_records by DataEntry.tsx's upload handler, with no review
-- step at all: an uploaded figure appeared on every dashboard immediately, and never showed up
-- for a Head of Department to verify. This table gives that data the same queue.
--
-- Can't reuse `submissions` itself: its `kpi_id` column is `not null references kpis(id)`, and a
-- metric/record payload's key (e.g. metric_key='financial_trend') has no row in the 13-entry
-- `kpis` table to reference — inserting one would violate that foreign key. A new, parallel table
-- avoids widening (and so weakening) a FK that's doing real work for the KPI queue.
--
-- Unlike `submissions` -> fact_kpi_results (where publishing writes a *derived* status/weighted
-- row), publishing a detail_submissions row writes the *same* shape of row detail_metrics/
-- detail_records already holds — the app performs that upsert itself as a second statement after
-- marking the row published (see src/lib/workflow.tsx's approveDetail), same pattern as the KPI
-- side's approveOne. Until approved, nothing in detail_metrics/detail_records is touched, so a
-- pending upload never appears on a dashboard ahead of review.
create table detail_submissions (
  id            varchar(40)  primary key,
  dest          varchar(10)  not null check (dest in ('metric', 'record')),
  module        varchar(2)   not null check (module in ('CP', 'FH', 'RP')),
  entity_id     varchar(20)  not null references entities(id),
  period_id     varchar(10)  not null references periods(id),

  -- dest = 'metric'
  metric_key    varchar(60),
  dimension     varchar(80),
  dimension2    varchar(80),

  -- dest = 'record'
  record_id     varchar(40),
  record_type   varchar(60),
  label         varchar(200),
  category      varchar(120),

  value_num     numeric(14,4),
  value_num2    numeric(14,4),
  text_note     varchar(500),

  note          varchar(500),
  source        varchar(20)  not null check (source in ('web-form', 'excel-upload', 'backfill')),
  submitted_by  varchar(100) not null,
  submitted_at  timestamptz  not null default now(),
  status        varchar(20)  not null default 'submitted' check (status in ('submitted', 'published', 'rejected')),
  reviewed_by   varchar(100),
  reviewed_at   timestamptz,
  review_note   varchar(500)
);

create index idx_detail_submissions_status on detail_submissions(status);
create index idx_detail_submissions_module on detail_submissions(module);
create index idx_detail_submissions_entity_period on detail_submissions(entity_id, period_id);

alter table detail_submissions enable row level security;

create policy "public read detail_submissions" on detail_submissions for select using (true);

-- Same state machine as submissions (0001 + 0002 + 0004, collapsed to their final effect since
-- this table starts fresh): insert only as 'submitted', update only while still 'submitted' —
-- either correcting the pending row in place or moving it to 'published'/'rejected'. Once
-- reviewed, immutable (no equivalent of 0008's published-edit policy — 0010 reversed that one for
-- the same reason it'd apply here: a checked figure shouldn't change with no visible trail).
create policy "insert detail_submissions as submitted" on detail_submissions
  for insert
  with check (status = 'submitted');

create policy "update detail_submissions from submitted" on detail_submissions
  for update
  using (status = 'submitted')
  with check (status in ('submitted', 'published', 'rejected'));

-- detail_metrics/detail_records' own write policies (0003) stay open ("public write ... with
-- check (true)") rather than being tightened to require a matching published detail_submissions
-- row the way fact_kpi_results was in 0002 — several in-app editors (GovernanceKpiEditor,
-- ManagedEntityKpiEditor, InitiativeEditor, ClientSatisfactionServiceEditor,
-- OtherInvestmentDealsEditor, PeopleDevPlanTable, VarianceCommentaryPanel) still write straight to
-- these tables on every save with no queue behind them at all; gating the tables themselves would
-- break every one of those on the spot. The gate here is application-layer only, enforced by
-- DataEntry.tsx routing Excel-upload metric/record rows through detail_submissions instead of
-- calling upsertDetailMetric/upsertDetailRecord directly — same "not yet DB-enforced" state
-- fact_kpi_results was in before 0002, flagged here for the same future tightening once those
-- editors are migrated to the same queue.
