-- Prokhas Group Performance Dashboard — initial schema
-- Target: Postgres (Supabase). Written to stay portable to MariaDB later:
--   - natural string primary keys (business codes like 'KPI1', 'Q1FY26') instead of
--     Postgres-only gen_random_uuid()/uuid type
--   - VARCHAR + CHECK constraints instead of Postgres ENUM types (MariaDB 10.2+ supports CHECK)
--   - NUMERIC(p,s) instead of Postgres-only types
--   - no JSONB columns — entity_modules is a normal join table instead of an array column
--   - no triggers/stored procedures for the maker-checker flow; that logic lives in the
--     application layer (two explicit statements in a transaction) so it ports cleanly
-- Row Level Security (RLS) policies at the bottom are Postgres/Supabase-specific and will
-- need an equivalent (e.g. view-based or application-layer) access control layer on MariaDB.

-- ── Reference tables ──────────────────────────────────────────────────────

create table entities (
  id         varchar(20)  primary key,
  name       varchar(100) not null,
  full_name  varchar(200) not null,
  kind       varchar(10)  not null check (kind in ('HQ','ME')),
  created_at timestamptz  not null default now()
);

create table entity_modules (
  entity_id varchar(20) not null references entities(id) on delete cascade,
  module    varchar(4)  not null check (module in ('CP','FH','RP')),
  primary key (entity_id, module)
);

create table perspectives (
  id          varchar(10)  primary key,
  code        varchar(10)  not null,
  name        varchar(100) not null,
  weight      numeric(6,4) not null,   -- fraction of 1.0
  screen_code varchar(10)  not null,
  icon        varchar(50)
);

create table kpis (
  id             varchar(10)   primary key,
  no             int           not null,
  name           varchar(200)  not null,
  perspective_id varchar(10)   not null references perspectives(id),
  weight         numeric(6,4)  not null,   -- fraction of 1.0
  unit           varchar(20)   not null,
  fy_target      numeric(14,4),
  direction      varchar(6)    not null check (direction in ('higher','lower')),
  formula_note   varchar(300),
  data_owner     varchar(100)
);

create table periods (
  id                    varchar(10) primary key,   -- e.g. 'Q1FY26'
  label                 varchar(20) not null,        -- e.g. 'Q1 FY2026'
  fy                    varchar(10) not null,        -- e.g. 'FY2026'
  quarter               smallint    not null check (quarter between 1 and 4),
  cumulative_threshold  numeric(5,4) not null,
  mof_threshold         numeric(5,4) not null,
  is_current            boolean not null default false,
  is_open_for_entry     boolean not null default false
);

-- ── Users (demo auth mapping — this prototype does not yet use Supabase Auth;
--    see the README note in src/lib/supabase.ts before using this in production) ──

create table app_users (
  id           varchar(50)  primary key,   -- corporate id / username
  display_name varchar(100) not null,
  role         varchar(20)  not null check (role in ('board','exec','dept_head','reporting_officer','checker','admin')),
  home_entity  varchar(20)  not null references entities(id),
  created_at   timestamptz  not null default now()
);

-- ── Facts: published KPI results shown on dashboards ─────────────────────

create table fact_kpi_results (
  kpi_id     varchar(10)  not null references kpis(id),
  entity_id  varchar(20)  not null references entities(id),
  period_id  varchar(10)  not null references periods(id),
  ytd_target numeric(14,4),
  ytd_actual numeric(14,4),
  status     varchar(20)  not null check (status in ('met','not-met','not-measurable')),
  note       varchar(300),
  updated_at timestamptz  not null default now(),
  primary key (kpi_id, entity_id, period_id)
);

-- ── Submissions: maker-checker workflow (Draft -> Submitted -> Published/Rejected) ──

-- submitted_by/reviewed_by are free text, not a foreign key to app_users: this prototype's
-- login accepts any typed corporate ID (no real auth yet), so a submission must not fail
-- just because the typed name isn't one of the seeded demo users.
create table submissions (
  id            varchar(40)  primary key,
  kpi_id        varchar(10)  not null references kpis(id),
  entity_id     varchar(20)  not null references entities(id),
  period_id     varchar(10)  not null references periods(id),
  value         numeric(14,4) not null,
  note          varchar(500),
  source        varchar(20)  not null check (source in ('web-form','excel-upload')),
  submitted_by  varchar(100) not null,
  submitted_at  timestamptz  not null default now(),
  status        varchar(20)  not null default 'submitted' check (status in ('submitted','published','rejected')),
  reviewed_by   varchar(100),
  reviewed_at   timestamptz,
  review_note   varchar(500)
);

create index idx_submissions_status on submissions(status);
create index idx_submissions_kpi_entity_period on submissions(kpi_id, entity_id, period_id);
create index idx_fact_entity_period on fact_kpi_results(entity_id, period_id);

-- ── Row Level Security ────────────────────────────────────────────────────
-- Prototype-grade policies: public read on reference/fact data (it's a dashboard,
-- not secret), open insert on submissions (anyone using the app can submit a KPI
-- update, same as the current in-memory prototype). There is no real login yet —
-- the app's "sign in" is a role-selector demo, not Supabase Auth — so these
-- policies cannot yet distinguish real users. Before this goes anywhere near
-- production: wire up Supabase Auth, add a policy that ties app_users.id to
-- auth.uid(), and restrict submissions/updates to the signed-in user's own rows
-- and reviewed_by updates to users whose role has can_verify = true.

alter table entities enable row level security;
alter table entity_modules enable row level security;
alter table perspectives enable row level security;
alter table kpis enable row level security;
alter table periods enable row level security;
alter table app_users enable row level security;
alter table fact_kpi_results enable row level security;
alter table submissions enable row level security;

create policy "public read entities" on entities for select using (true);
create policy "public read entity_modules" on entity_modules for select using (true);
create policy "public read perspectives" on perspectives for select using (true);
create policy "public read kpis" on kpis for select using (true);
create policy "public read periods" on periods for select using (true);
create policy "public read app_users" on app_users for select using (true);
create policy "public read fact_kpi_results" on fact_kpi_results for select using (true);

create policy "public read submissions" on submissions for select using (true);
create policy "public insert submissions" on submissions for insert with check (true);
create policy "public update submissions" on submissions for update using (true);

-- Publishing a submission also needs to write/update fact_kpi_results (the app
-- does this as a second statement after marking the submission published).
create policy "public insert fact_kpi_results" on fact_kpi_results for insert with check (true);
create policy "public update fact_kpi_results" on fact_kpi_results for update using (true);
