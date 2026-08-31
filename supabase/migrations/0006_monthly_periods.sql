-- ── Monthly granularity for trend/detail data ────────────────────────────────
-- Per Progress Meeting #1: "support monthly view, not just quarterly." KPI
-- achievement scoring (fact_kpi_results/submissions) stays quarterly-only --
-- that's the Group's actual assessment cadence, a business rule, not a gap to
-- close. What this adds is monthly-resolution rows for Financial Trend detail
-- data (PFH001/PFH002), so Finance can optionally enter month-level figures
-- inside a quarter without changing how KPIs are measured.
--
-- Each calendar month gets its own `periods` row (id like 'Q1FY26-M1') tagged
-- granularity='month' with parent_period_id pointing at its quarter, so
-- detail_metrics/detail_records (which FK to periods.id) can reference a
-- month directly with zero schema change to those tables. quarter/
-- cumulative_threshold/mof_threshold are copied from the parent quarter on
-- month rows purely to satisfy NOT NULL -- nothing reads those columns for a
-- 'month' row today.

alter table periods add column granularity varchar(10) not null default 'quarter' check (granularity in ('quarter', 'month'));
alter table periods add column parent_period_id varchar(10) references periods(id);

insert into periods (id, label, fy, quarter, cumulative_threshold, mof_threshold, is_current, is_open_for_entry, granularity, parent_period_id) values
  ('Q1FY25-M1', 'Jan 2025', 'FY2025', 1, 0.25, 0.20, false, false, 'month', 'Q1FY25'),
  ('Q1FY25-M2', 'Feb 2025', 'FY2025', 1, 0.25, 0.20, false, false, 'month', 'Q1FY25'),
  ('Q1FY25-M3', 'Mar 2025', 'FY2025', 1, 0.25, 0.20, false, false, 'month', 'Q1FY25'),
  ('Q2FY25-M1', 'Apr 2025', 'FY2025', 2, 0.50, 0.40, false, false, 'month', 'Q2FY25'),
  ('Q2FY25-M2', 'May 2025', 'FY2025', 2, 0.50, 0.40, false, false, 'month', 'Q2FY25'),
  ('Q2FY25-M3', 'Jun 2025', 'FY2025', 2, 0.50, 0.40, false, false, 'month', 'Q2FY25'),
  ('Q3FY25-M1', 'Jul 2025', 'FY2025', 3, 0.75, 0.60, false, false, 'month', 'Q3FY25'),
  ('Q3FY25-M2', 'Aug 2025', 'FY2025', 3, 0.75, 0.60, false, false, 'month', 'Q3FY25'),
  ('Q3FY25-M3', 'Sep 2025', 'FY2025', 3, 0.75, 0.60, false, false, 'month', 'Q3FY25'),
  ('Q4FY25-M1', 'Oct 2025', 'FY2025', 4, 1.00, 0.80, false, false, 'month', 'Q4FY25'),
  ('Q4FY25-M2', 'Nov 2025', 'FY2025', 4, 1.00, 0.80, false, false, 'month', 'Q4FY25'),
  ('Q4FY25-M3', 'Dec 2025', 'FY2025', 4, 1.00, 0.80, false, false, 'month', 'Q4FY25'),
  ('Q1FY26-M1', 'Jan 2026', 'FY2026', 1, 0.25, 0.20, false, false, 'month', 'Q1FY26'),
  ('Q1FY26-M2', 'Feb 2026', 'FY2026', 1, 0.25, 0.20, false, false, 'month', 'Q1FY26'),
  ('Q1FY26-M3', 'Mar 2026', 'FY2026', 1, 0.25, 0.20, false, false, 'month', 'Q1FY26'),
  ('Q2FY26-M1', 'Apr 2026', 'FY2026', 2, 0.50, 0.40, false, false, 'month', 'Q2FY26'),
  ('Q2FY26-M2', 'May 2026', 'FY2026', 2, 0.50, 0.40, false, false, 'month', 'Q2FY26'),
  ('Q2FY26-M3', 'Jun 2026', 'FY2026', 2, 0.50, 0.40, false, false, 'month', 'Q2FY26'),
  ('Q3FY26-M1', 'Jul 2026', 'FY2026', 3, 0.75, 0.60, false, false, 'month', 'Q3FY26'),
  ('Q3FY26-M2', 'Aug 2026', 'FY2026', 3, 0.75, 0.60, false, false, 'month', 'Q3FY26'),
  ('Q3FY26-M3', 'Sep 2026', 'FY2026', 3, 0.75, 0.60, false, false, 'month', 'Q3FY26'),
  ('Q4FY26-M1', 'Oct 2026', 'FY2026', 4, 1.00, 0.80, false, false, 'month', 'Q4FY26'),
  ('Q4FY26-M2', 'Nov 2026', 'FY2026', 4, 1.00, 0.80, false, false, 'month', 'Q4FY26'),
  ('Q4FY26-M3', 'Dec 2026', 'FY2026', 4, 1.00, 0.80, false, false, 'month', 'Q4FY26');
-- FY2027 quarters are never seeded (seed.sql stops at FY2026), so no FY2027 month rows here --
-- a parent_period_id FK to a nonexistent 'Q1FY27' etc. would fail on every apply.
