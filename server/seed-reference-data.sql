-- Reference data (entities, entity_modules, perspectives, kpis, periods) — transcribed from
-- supabase/seed.sql, which itself transcribes src/data/{entities,perspectives,kpis,periods}.ts.
-- These tables exist only so other tables can foreign-key against them; the frontend keeps its
-- own static copies and never queries these over the API (see server/ROUTES.md) — this file
-- just needs to run once, right after schema.sql, so those foreign keys have something to point
-- at before the real data import (scripts/export-from-supabase.ts) runs.
--
-- NOT included here: app_users, or any of the business data (fact_kpi_results, submissions,
-- detail_metrics, detail_records, ...) — those come from your live Supabase project via
-- scripts/export-from-supabase.ts at actual cutover time, not from this static file.
--
-- periods stops at FY2026, matching the live Supabase project today (see migration
-- 0006_monthly_periods.sql's own note) — add FY2027 rows here (and to src/data/periods.ts) when
-- that year actually starts.

INSERT INTO entities (id, name, full_name, kind) VALUES
  ('HQ',        'Group HQ',  'Group Headquarters',                     'HQ'),
  ('SJPP',      'SJPP',      'Syarikat Jaminan Pembiayaan Perniagaan',  'ME'),
  ('SJKP',      'SJKP',      'Syarikat Jaminan Kredit Perumahan',       'ME'),
  ('DANAHARTA', 'DanaHarta', 'Danaharta Nasional Berhad',               'ME'),
  ('DANAINFRA', 'DanaInfra', 'DanaInfra Nasional Berhad',               'ME'),
  ('GOVCO',     'GovCo',     'GovCo Holdings',                          'ME');

INSERT INTO entity_modules (entity_id, module) VALUES
  ('HQ','CP'), ('HQ','FH'), ('HQ','RP'),
  ('SJPP','CP'), ('SJPP','FH'),
  ('SJKP','CP'), ('SJKP','FH'),
  ('DANAHARTA','CP'), ('DANAHARTA','FH'),
  ('DANAINFRA','CP'), ('DANAINFRA','FH'),
  ('GOVCO','CP'), ('GOVCO','FH');

INSERT INTO perspectives (id, code, name, weight, screen_code, icon) VALUES
  ('FIN',  'CP003', 'Financial',                 0.25, 'CP003', 'landmark'),
  ('MG',   'CP004', 'Mandate & Governance',      0.15, 'CP004', 'shield-check'),
  ('CUST', 'CP005', 'Customer',                  0.15, 'CP005', 'users'),
  ('IBP',  'CP006', 'Internal Business Process', 0.20, 'CP006', 'workflow'),
  ('OC',   'CP007', 'Organisational Capacity',   0.20, 'CP007', 'graduation-cap'),
  ('BE',   'CP008', 'Bumiputera Empowerment',    0.05, 'CP008', 'handshake');

INSERT INTO kpis (id, no, name, perspective_id, weight, unit, fy_target, direction, formula_note, data_owner) VALUES
  ('KPI1',  1,  'Profit Before Tax (PBT)',       'FIN',  0.1250, 'RM mil',      100.0, 'higher', 'YTD Actual ÷ FY Target × Weight', 'Finance'),
  ('KPI2',  2,  'Cost-to-Income Ratio',          'FIN',  0.1250, '%',           58.0,  'lower',  'FY Target ÷ YTD Actual × Weight (capped)', 'Finance'),
  ('KPI3',  3,  'Managed Entities Rating',       'MG',   0.0750, 'rating /5',   4.5,   'higher', 'YTD Actual ÷ FY Target × Weight', 'Strategy & Performance'),
  ('KPI4',  4,  'Governance Index',              'MG',   0.0750, '%',           100.0, 'higher', '5-component index, annual assessment in Q4', 'Risk & Compliance'),
  ('KPI5',  5,  'External Client Satisfaction',  'CUST', 0.0750, 'rating /5',   4.7,   'higher', 'Bi-annual survey', 'Corporate Communications'),
  ('KPI6',  6,  'Time Charter Compliance',       'CUST', 0.0750, '%',           95.0,  'higher', 'Service-level compliance, quarterly', 'Operations'),
  ('KPI7',  7,  'Process Improvements',          'IBP',  0.1000, 'initiatives', 3,     'higher', 'Count of completed initiatives', 'Operational Excellence'),
  ('KPI8',  8,  'New Technology Implementation', 'IBP',  0.1000, 'initiatives', 6,     'higher', 'Count of completed initiatives', 'IT Department'),
  ('KPI9',  9,  'Recruitment Efficiency Index',  'OC',   0.1000, '%',           80.0,  'higher', 'TTH 20% + MRF Fulfilment 20% + Quality of Hire 40% + Offer Acceptance 20%', 'Human Resource'),
  ('KPI10', 10, 'People Development Programme',  'OC',   0.1000, '%',           100.0, 'higher', 'Programme completion rate', 'Human Resource'),
  ('KPI11', 11, 'Bumiputera Procurement',         'BE',   0.0167, 'RM mil',      2.2,   'higher', 'YTD Actual ÷ FY Target × Weight', 'Administration & Security'),
  ('KPI12', 12, 'Bumiputera Composition',         'BE',   0.0167, '%',           70.0,  'higher', 'Bumiputera staff ÷ Total staff × 100', 'Human Resource'),
  ('KPI13', 13, 'Bumiputera Training',            'BE',   0.0166, 'staff',       120,   'higher', 'Staff completing ≥2 registered programmes', 'Human Resource');

INSERT INTO periods (id, label, fy, quarter, cumulative_threshold, mof_threshold, is_current, is_open_for_entry) VALUES
  ('Q1FY25', 'Q1 FY2025', 'FY2025', 1, 0.25, 0.20, FALSE, TRUE),
  ('Q2FY25', 'Q2 FY2025', 'FY2025', 2, 0.50, 0.40, FALSE, TRUE),
  ('Q3FY25', 'Q3 FY2025', 'FY2025', 3, 0.75, 0.60, FALSE, TRUE),
  ('Q4FY25', 'Q4 FY2025', 'FY2025', 4, 1.00, 0.80, FALSE, TRUE),
  ('Q1FY26', 'Q1 FY2026', 'FY2026', 1, 0.25, 0.20, FALSE, TRUE),
  ('Q2FY26', 'Q2 FY2026', 'FY2026', 2, 0.50, 0.40, FALSE, TRUE),
  ('Q3FY26', 'Q3 FY2026', 'FY2026', 3, 0.75, 0.60, FALSE, TRUE),
  ('Q4FY26', 'Q4 FY2026', 'FY2026', 4, 1.00, 0.80, FALSE, TRUE);
-- is_current is informational only (same note as the Postgres seed) — the frontend resolves the
-- default period from today's real date (src/data/periods.ts's resolveCurrentPeriodId), not this
-- column.

INSERT INTO periods (id, label, fy, quarter, cumulative_threshold, mof_threshold, is_current, is_open_for_entry, granularity, parent_period_id) VALUES
  ('Q1FY25-M1', 'Jan 2025', 'FY2025', 1, 0.25, 0.20, FALSE, FALSE, 'month', 'Q1FY25'),
  ('Q1FY25-M2', 'Feb 2025', 'FY2025', 1, 0.25, 0.20, FALSE, FALSE, 'month', 'Q1FY25'),
  ('Q1FY25-M3', 'Mar 2025', 'FY2025', 1, 0.25, 0.20, FALSE, FALSE, 'month', 'Q1FY25'),
  ('Q2FY25-M1', 'Apr 2025', 'FY2025', 2, 0.50, 0.40, FALSE, FALSE, 'month', 'Q2FY25'),
  ('Q2FY25-M2', 'May 2025', 'FY2025', 2, 0.50, 0.40, FALSE, FALSE, 'month', 'Q2FY25'),
  ('Q2FY25-M3', 'Jun 2025', 'FY2025', 2, 0.50, 0.40, FALSE, FALSE, 'month', 'Q2FY25'),
  ('Q3FY25-M1', 'Jul 2025', 'FY2025', 3, 0.75, 0.60, FALSE, FALSE, 'month', 'Q3FY25'),
  ('Q3FY25-M2', 'Aug 2025', 'FY2025', 3, 0.75, 0.60, FALSE, FALSE, 'month', 'Q3FY25'),
  ('Q3FY25-M3', 'Sep 2025', 'FY2025', 3, 0.75, 0.60, FALSE, FALSE, 'month', 'Q3FY25'),
  ('Q4FY25-M1', 'Oct 2025', 'FY2025', 4, 1.00, 0.80, FALSE, FALSE, 'month', 'Q4FY25'),
  ('Q4FY25-M2', 'Nov 2025', 'FY2025', 4, 1.00, 0.80, FALSE, FALSE, 'month', 'Q4FY25'),
  ('Q4FY25-M3', 'Dec 2025', 'FY2025', 4, 1.00, 0.80, FALSE, FALSE, 'month', 'Q4FY25'),
  ('Q1FY26-M1', 'Jan 2026', 'FY2026', 1, 0.25, 0.20, FALSE, FALSE, 'month', 'Q1FY26'),
  ('Q1FY26-M2', 'Feb 2026', 'FY2026', 1, 0.25, 0.20, FALSE, FALSE, 'month', 'Q1FY26'),
  ('Q1FY26-M3', 'Mar 2026', 'FY2026', 1, 0.25, 0.20, FALSE, FALSE, 'month', 'Q1FY26'),
  ('Q2FY26-M1', 'Apr 2026', 'FY2026', 2, 0.50, 0.40, FALSE, FALSE, 'month', 'Q2FY26'),
  ('Q2FY26-M2', 'May 2026', 'FY2026', 2, 0.50, 0.40, FALSE, FALSE, 'month', 'Q2FY26'),
  ('Q2FY26-M3', 'Jun 2026', 'FY2026', 2, 0.50, 0.40, FALSE, FALSE, 'month', 'Q2FY26'),
  ('Q3FY26-M1', 'Jul 2026', 'FY2026', 3, 0.75, 0.60, FALSE, FALSE, 'month', 'Q3FY26'),
  ('Q3FY26-M2', 'Aug 2026', 'FY2026', 3, 0.75, 0.60, FALSE, FALSE, 'month', 'Q3FY26'),
  ('Q3FY26-M3', 'Sep 2026', 'FY2026', 3, 0.75, 0.60, FALSE, FALSE, 'month', 'Q3FY26'),
  ('Q4FY26-M1', 'Oct 2026', 'FY2026', 4, 1.00, 0.80, FALSE, FALSE, 'month', 'Q4FY26'),
  ('Q4FY26-M2', 'Nov 2026', 'FY2026', 4, 1.00, 0.80, FALSE, FALSE, 'month', 'Q4FY26'),
  ('Q4FY26-M3', 'Dec 2026', 'FY2026', 4, 1.00, 0.80, FALSE, FALSE, 'month', 'Q4FY26');
