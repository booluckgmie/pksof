-- ── Yearly-configurable KPI FY targets ───────────────────────────────────────
-- Per client request: "Convert KPI settings to be configurable on a yearly
-- basis (adjustable at year-end)." KPI metadata (id/name/weight/unit/direction)
-- stays in the static src/data/kpis.ts array — those don't change year to
-- year. The one thing that genuinely gets reset at year-end is each KPI's
-- full-year target, so that's what this table overrides, keyed by (kpi_id, fy)
-- rather than a single value forever. A System Administrator edits these from
-- the Settings screen; src/lib/kpiTargets.tsx falls back to kpis.ts's static
-- fyTarget when no override row exists for a given FY yet.

create table kpi_fy_targets (
  kpi_id      varchar(10)  not null,
  fy          varchar(10)  not null,
  fy_target   numeric(14,4) not null,
  updated_at  timestamptz  not null default now(),
  updated_by  varchar(120),
  primary key (kpi_id, fy)
);

alter table kpi_fy_targets enable row level security;

create policy "public read kpi_fy_targets" on kpi_fy_targets for select using (true);

-- Same open-write caveat as detail_metrics/org_settings — no real auth yet to
-- check against. The Settings screen's System-Administrator-only gate is an
-- application-layer check, not a database one; see supabase/README.md.
create policy "public write kpi_fy_targets" on kpi_fy_targets for insert with check (true);
create policy "public update kpi_fy_targets" on kpi_fy_targets for update using (true) with check (true);
