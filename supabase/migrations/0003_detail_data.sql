-- ── Detail data: everything the dashboard shows beyond the 13 headline KPIs ─
-- Workforce/demographic breakdowns, financial trend/balance-sheet figures,
-- initiatives, and related-party transactions were, until now, static dummy
-- arrays in src/data/headcount.ts, src/data/financialDetail.ts and
-- src/data/initiatives.ts. To make "every figure and chart" data-entry-driven
-- without a bespoke table per chart, this uses two general-purpose tables:
--
--   detail_metrics  — one row per (entity, period, metric, dimension) numeric
--                      figure. `metric_key` names which chart/series it feeds
--                      (e.g. 'gender_breakdown', 'financial_trend'); `dimension`
--                      / `dimension2` are that metric's axis labels (e.g.
--                      dimension='male' for gender_breakdown, or
--                      dimension='Finance', dimension2='approved' for
--                      dept_headcount). See src/lib/details.tsx for the full
--                      list of metric_key values and what each dimension means.
--
--   detail_records  — one row per free-form list item that carries more than
--                      a single number (initiatives, related-party
--                      transactions, governance checklist lines) — a label,
--                      an optional category, up to two numeric values, a note,
--                      and a boolean flag.
--
-- This keeps the schema small while still MariaDB-portable (plain varchar/
-- numeric columns, no JSONB). The tradeoff is the same one any EAV-style
-- design makes: less type safety per dataset than a bespoke table would give,
-- in exchange for not needing ~15 near-identical tables and API modules.

create table detail_metrics (
  entity_id   varchar(20)  not null references entities(id) on delete cascade,
  period_id   varchar(10)  not null references periods(id),
  metric_key  varchar(60)  not null,
  dimension   varchar(80)  not null,
  dimension2  varchar(80)  not null default '',
  value       numeric(14,4),
  note        varchar(500),
  updated_at  timestamptz  not null default now(),
  primary key (entity_id, period_id, metric_key, dimension, dimension2)
);

create table detail_records (
  id           varchar(40)  primary key,
  entity_id    varchar(20)  not null references entities(id) on delete cascade,
  period_id    varchar(10)  not null references periods(id),
  record_type  varchar(60)  not null,
  label        varchar(200) not null,
  category     varchar(120),
  value_num    numeric(14,4),
  value_num2   numeric(14,4),
  text_note    varchar(500),
  flag         boolean,
  updated_at   timestamptz  not null default now()
);

create index idx_detail_metrics_entity_period on detail_metrics(entity_id, period_id);
create index idx_detail_metrics_key on detail_metrics(metric_key);
create index idx_detail_records_entity_period on detail_records(entity_id, period_id);
create index idx_detail_records_type on detail_records(record_type);

alter table detail_metrics enable row level security;
alter table detail_records enable row level security;

create policy "public read detail_metrics" on detail_metrics for select using (true);
create policy "public read detail_records" on detail_records for select using (true);

-- Unlike fact_kpi_results/submissions (0002), this supporting data has no
-- maker-checker queue behind it -- there's nowhere for a review trail to come
-- from without duplicating that whole workflow for ~15 more datasets. Treat
-- this the same as submissions.insert pre-0002: open write, appropriate for a
-- prototype with no real auth, flagged here for the same tightening (tie to
-- auth.uid() + role) before production.
create policy "public write detail_metrics" on detail_metrics for insert with check (true);
create policy "public update detail_metrics" on detail_metrics for update using (true) with check (true);
create policy "public write detail_records" on detail_records for insert with check (true);
create policy "public update detail_records" on detail_records for update using (true) with check (true);
create policy "public delete detail_records" on detail_records for delete using (true);
