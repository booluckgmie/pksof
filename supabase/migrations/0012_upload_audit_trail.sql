-- Progress-tracking features from the 28 Aug 2026 Prokhas meeting: an audit trail for Excel
-- uploads (which file, who, when, what it wrote — down to the individual row) plus a place for
-- Data Entry / Verify & Publish to show upload history and per-entity/per-pillar progress.
--
-- Two append-only tables, written once per upload from src/pages/workflow/DataEntry.tsx and never
-- updated or deleted after — an audit trail that could itself be edited after the fact wouldn't be
-- much of one. No maker-checker queue behind this (matches detail_metrics/detail_records' own
-- "no approval trail, prototype-open-write, tie to a signed-in role before production" caveat —
-- see supabase/README.md).
--
--   upload_events      — one row per upload action: the file, who, when, which entity, which
--                         pillar sheets were present, and a saved/failed row-count summary.
--   upload_event_rows  — one row per individual KPI/metric/record row that upload touched, with
--                         its own outcome — this is the "individual details" behind each upload.

create table upload_events (
  id           varchar(40)  primary key,
  entity_id    varchar(20)  not null references entities(id) on delete cascade,
  file_name    varchar(255) not null,
  sheets       varchar(200) not null,   -- comma-joined sheet names present in the file
  periods      varchar(200) not null,   -- comma-joined period labels found in the file
  uploaded_by  varchar(100) not null,
  uploaded_at  timestamptz  not null default now(),
  total_rows   integer      not null default 0,
  saved_rows   integer      not null default 0,
  failed_rows  integer      not null default 0
);

create table upload_event_rows (
  id            varchar(60)  primary key,   -- app-generated: '<upload_id>-<row index>'
  upload_id     varchar(40)  not null references upload_events(id) on delete cascade,
  dest          varchar(10)  not null check (dest in ('kpi', 'metric', 'record')),
  sheet         varchar(60)  not null,
  label         varchar(200) not null,
  period_id     varchar(10)  not null,
  value         numeric(14,4),
  status        varchar(10)  not null check (status in ('saved', 'failed')),
  error_message varchar(500)
);

create index idx_upload_events_entity on upload_events(entity_id);
create index idx_upload_events_uploaded_at on upload_events(uploaded_at desc);
create index idx_upload_event_rows_upload on upload_event_rows(upload_id);

alter table upload_events enable row level security;
alter table upload_event_rows enable row level security;

create policy "public read upload_events" on upload_events for select using (true);
create policy "public write upload_events" on upload_events for insert with check (true);
create policy "public read upload_event_rows" on upload_event_rows for select using (true);
create policy "public write upload_event_rows" on upload_event_rows for insert with check (true);
-- Deliberately no update/delete policy on either table — once written, an upload's audit record
-- is permanent. Same production caveat as the rest of this schema: tie the insert policy to a
-- signed-in, role-checked user before this is real (see README's RLS section).
