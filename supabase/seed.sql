-- Group Performance Dashboard — seed data
-- Transcribed exactly from the app's existing dummy dataset
-- (src/data/entities.ts, perspectives.ts, kpis.ts, periods.ts, factSeed.ts)
-- so the Supabase-backed app shows identical figures to the static prototype.

-- ── Entities ───────────────────────────────────────────────────────────

insert into entities (id, name, full_name, kind) values
  ('HQ',   'Group HQ',  'Group Headquarters',                     'HQ'),
  ('SJPP',      'SJPP',      'Syarikat Jaminan Pembiayaan Perniagaan',  'ME'),
  ('SJKP',      'SJKP',      'Syarikat Jaminan Kredit Perumahan',       'ME'),
  ('DANAHARTA', 'DanaHarta', 'Danaharta Nasional Berhad',               'ME'),
  ('DANAINFRA', 'DanaInfra', 'DanaInfra Nasional Berhad',               'ME'),
  ('GOVCO',     'GovCo',     'GovCo Holdings',                         'ME');

insert into entity_modules (entity_id, module) values
  ('HQ','CP'), ('HQ','FH'), ('HQ','RP'),
  ('SJPP','CP'), ('SJPP','FH'),
  ('SJKP','CP'), ('SJKP','FH'),
  ('DANAHARTA','CP'), ('DANAHARTA','FH'),
  ('DANAINFRA','CP'), ('DANAINFRA','FH'),
  ('GOVCO','CP'), ('GOVCO','FH');

-- ── Perspectives ───────────────────────────────────────────────────────

insert into perspectives (id, code, name, weight, screen_code, icon) values
  ('FIN',  'CP003', 'Financial',                    0.25, 'CP003', 'landmark'),
  ('MG',   'CP004', 'Mandate & Governance',         0.15, 'CP004', 'shield-check'),
  ('CUST', 'CP005', 'Customer',                     0.15, 'CP005', 'users'),
  ('IBP',  'CP006', 'Internal Business Process',    0.20, 'CP006', 'workflow'),
  ('OC',   'CP007', 'Organisational Capacity',      0.20, 'CP007', 'graduation-cap'),
  ('BE',   'CP008', 'Bumiputera Empowerment',       0.05, 'CP008', 'handshake');

-- ── KPIs ───────────────────────────────────────────────────────────────

insert into kpis (id, no, name, perspective_id, weight, unit, fy_target, direction, formula_note, data_owner) values
  ('KPI1',  1,  'Profit Before Tax (PBT)',           'FIN',  0.1250, 'RM mil',      100.0, 'higher', 'YTD Actual ÷ FY Target × Weight',                                              'Finance'),
  ('KPI2',  2,  'Cost-to-Income Ratio',              'FIN',  0.1250, '%',           58.0,  'lower',  'FY Target ÷ YTD Actual × Weight (capped)',                                     'Finance'),
  ('KPI3',  3,  'Managed Entities Rating',           'MG',   0.0750, 'rating /5',   4.5,   'higher', 'YTD Actual ÷ FY Target × Weight',                                              'Strategy & Performance'),
  ('KPI4',  4,  'Governance Index',                  'MG',   0.0750, '%',           100.0, 'higher', '5-component index, annual assessment in Q4',                                  'Risk & Compliance'),
  ('KPI5',  5,  'External Client Satisfaction',      'CUST', 0.0750, 'rating /5',   4.7,   'higher', 'Bi-annual survey',                                                             'Corporate Communications'),
  ('KPI6',  6,  'Time Charter Compliance',           'CUST', 0.0750, '%',           95.0,  'higher', 'Service-level compliance, quarterly',                                          'Operations'),
  ('KPI7',  7,  'Process Improvements',              'IBP',  0.1000, 'initiatives', 3,     'higher', 'Count of completed initiatives',                                               'Operational Excellence'),
  ('KPI8',  8,  'New Technology Implementation',     'IBP',  0.1000, 'initiatives', 6,     'higher', 'Count of completed initiatives',                                               'IT Department'),
  ('KPI9',  9,  'Recruitment Efficiency Index',      'OC',   0.1000, '%',           80.0,  'higher', 'TTH 20% + MRF Fulfilment 20% + Quality of Hire 40% + Offer Acceptance 20%',   'Human Resource'),
  ('KPI10', 10, 'People Development Programme',      'OC',   0.1000, '%',           100.0, 'higher', 'Programme completion rate',                                                    'Human Resource'),
  ('KPI11', 11, 'Bumiputera Procurement',            'BE',   0.0167, 'RM mil',      2.2,   'higher', 'YTD Actual ÷ FY Target × Weight',                                              'Administration & Security'),
  ('KPI12', 12, 'Bumiputera Composition',            'BE',   0.0167, '%',           70.0,  'higher', 'Bumiputera staff ÷ Total staff × 100',                                         'Human Resource'),
  ('KPI13', 13, 'Bumiputera Training',               'BE',   0.0166, 'staff',       120,   'higher', 'Staff completing ≥2 registered programmes',                                    'Human Resource');

-- ── Periods ────────────────────────────────────────────────────────────

insert into periods (id, label, fy, quarter, cumulative_threshold, mof_threshold, is_current, is_open_for_entry) values
  ('Q1FY25', 'Q1 FY2025', 'FY2025', 1, 0.25, 0.20, false, false),
  ('Q2FY25', 'Q2 FY2025', 'FY2025', 2, 0.50, 0.40, false, false),
  ('Q3FY25', 'Q3 FY2025', 'FY2025', 3, 0.75, 0.60, false, false),
  ('Q4FY25', 'Q4 FY2025', 'FY2025', 4, 1.00, 0.80, false, false),
  ('Q1FY26', 'Q1 FY2026', 'FY2026', 1, 0.25, 0.20, true,  true),
  ('Q2FY26', 'Q2 FY2026', 'FY2026', 2, 0.50, 0.40, false, true),
  ('Q3FY26', 'Q3 FY2026', 'FY2026', 3, 0.75, 0.60, false, false),
  ('Q4FY26', 'Q4 FY2026', 'FY2026', 4, 1.00, 0.80, false, false);
-- Note: is_current above is informational only — the app resolves the default period
-- from today's real date (see src/data/periods.ts resolveCurrentPeriodId), not this flag.

-- ── Demo users (one per role; this app has no real auth yet — see migration notes) ──

insert into app_users (id, display_name, role, home_entity) values
  ('ahmad.najmi',  'Ahmad Najmi',  'exec',              'HQ'),
  ('board.member',  'Board Member', 'board',             'HQ'),
  ('hafiz.deptlead','Hafiz Rahman', 'dept_head',         'HQ'),
  ('siti.aminah',  'Siti Aminah',  'reporting_officer', 'SJKP'),
  ('pmo.checker',  'PMO Checker',  'checker',           'HQ'),
  ('sys.admin',    'System Admin', 'admin',             'HQ');

-- ── Fact KPI results (published figures) ──────────────────────────────
-- FY2025: closed year, all four quarters final. FY2026: Q1 seeded as already
-- published; Q2-Q4 intentionally absent — submit them via Data Entry.

insert into fact_kpi_results (kpi_id, entity_id, period_id, ytd_target, ytd_actual, status, note) values
  ('KPI1','HQ','Q1FY25', 25.0,  19.8, 'not-met', null),
  ('KPI1','HQ','Q2FY25', 50.0,  23.1, 'not-met', null),
  ('KPI1','HQ','Q3FY25', 75.0,  24.4, 'not-met', null),
  ('KPI1','HQ','Q4FY25', 100.0, 33.6, 'not-met', null),

  ('KPI2','HQ','Q1FY25', 58.0, 61.4, 'not-met', null),
  ('KPI2','HQ','Q2FY25', 58.0, 57.8, 'met',     null),
  ('KPI2','HQ','Q3FY25', 58.0, 55.1, 'met',     null),
  ('KPI2','HQ','Q4FY25', 58.0, 49.6, 'met',     null),

  ('KPI3','HQ','Q1FY25', 4.5, 4.1, 'not-met', null),
  ('KPI3','HQ','Q2FY25', 4.5, 4.2, 'not-met', null),
  ('KPI3','HQ','Q3FY25', 4.5, 4.3, 'not-met', null),
  ('KPI3','HQ','Q4FY25', 4.5, 4.3, 'not-met', null),

  ('KPI4','HQ','Q1FY25', null,  null, 'not-measurable', 'Annual assessment — results at FY close'),
  ('KPI4','HQ','Q2FY25', null,  null, 'not-measurable', 'Annual assessment — results at FY close'),
  ('KPI4','HQ','Q3FY25', null,  null, 'not-measurable', 'Annual assessment — results at FY close'),
  ('KPI4','HQ','Q4FY25', 100.0, 94.0, 'not-met',        null),

  ('KPI5','HQ','Q1FY25', null, null, 'not-measurable', 'Bi-annual survey — next in Q2'),
  ('KPI5','HQ','Q2FY25', 4.7,  4.5,  'not-met',        null),
  ('KPI5','HQ','Q3FY25', null, null, 'not-measurable', 'Bi-annual survey — next in Q4'),
  ('KPI5','HQ','Q4FY25', 4.7,  4.6,  'not-met',        null),

  ('KPI6','HQ','Q1FY25', 95.0, 94.0, 'not-met', null),
  ('KPI6','HQ','Q2FY25', 95.0, 95.5, 'met',     null),
  ('KPI6','HQ','Q3FY25', 95.0, 96.2, 'met',     null),
  ('KPI6','HQ','Q4FY25', 95.0, 96.8, 'met',     null),

  ('KPI7','HQ','Q1FY25', 1, 0, 'not-met', null),
  ('KPI7','HQ','Q2FY25', 2, 1, 'not-met', null),
  ('KPI7','HQ','Q3FY25', 2, 2, 'met',     null),
  ('KPI7','HQ','Q4FY25', 3, 3, 'met',     null),

  ('KPI8','HQ','Q1FY25', 2, 1, 'not-met', null),
  ('KPI8','HQ','Q2FY25', 3, 2, 'not-met', null),
  ('KPI8','HQ','Q3FY25', 5, 4, 'not-met', null),
  ('KPI8','HQ','Q4FY25', 6, 5, 'not-met', null),

  ('KPI9','HQ','Q1FY25', 80.0, 76.3, 'not-met', null),
  ('KPI9','HQ','Q2FY25', 80.0, 82.0, 'met',     null),
  ('KPI9','HQ','Q3FY25', 80.0, 87.0, 'met',     null),
  ('KPI9','HQ','Q4FY25', 80.0, 92.7, 'met',     null),

  ('KPI10','HQ','Q1FY25', null,  null, 'not-measurable', 'Programmes had not yet commenced'),
  ('KPI10','HQ','Q2FY25', 100.0, 45.0, 'not-met',        null),
  ('KPI10','HQ','Q3FY25', 100.0, 70.0, 'not-met',        null),
  ('KPI10','HQ','Q4FY25', 100.0, 88.0, 'not-met',        null),

  ('KPI11','HQ','Q1FY25', 0.55, 0.50, 'not-met', null),
  ('KPI11','HQ','Q2FY25', 1.10, 1.15, 'met',     null),
  ('KPI11','HQ','Q3FY25', 1.65, 1.80, 'met',     null),
  ('KPI11','HQ','Q4FY25', 2.20, 2.40, 'met',     null),

  ('KPI12','HQ','Q1FY25', 70.0, 86.0, 'met', null),
  ('KPI12','HQ','Q2FY25', 70.0, 87.0, 'met', null),
  ('KPI12','HQ','Q3FY25', 70.0, 88.0, 'met', null),
  ('KPI12','HQ','Q4FY25', 70.0, 88.5, 'met', null),

  ('KPI13','HQ','Q1FY25', 30,  30,  'met', null),
  ('KPI13','HQ','Q2FY25', 60,  65,  'met', null),
  ('KPI13','HQ','Q3FY25', 90,  100, 'met', null),
  ('KPI13','HQ','Q4FY25', 120, 132, 'met', null),

  ('KPI1', 'HQ','Q1FY26', 23.2, 27.5, 'met', null),
  ('KPI2', 'HQ','Q1FY26', 58.0, 44.2, 'met', null),
  ('KPI3', 'HQ','Q1FY26', 4.5,  4.2,  'not-met', null),
  ('KPI4', 'HQ','Q1FY26', null, null, 'not-measurable', 'Annual assessment scheduled Q4'),
  ('KPI5', 'HQ','Q1FY26', null, null, 'not-measurable', 'Bi-annual survey — next in Q2'),
  ('KPI6', 'HQ','Q1FY26', null, null, 'not-measurable', 'Baseline monitoring framework in progress'),
  ('KPI7', 'HQ','Q1FY26', null, null, 'not-measurable', 'Initiatives planned to complete from Q3'),
  ('KPI8', 'HQ','Q1FY26', null, null, 'not-measurable', 'Initiatives planned to complete from Q2'),
  ('KPI9', 'HQ','Q1FY26', 80.0, 88.7, 'met', null),
  ('KPI10','HQ','Q1FY26', null, null, 'not-measurable', 'Programmes commence Q2 onward'),
  ('KPI11','HQ','Q1FY26', 0.55, 0.82, 'met', null),
  ('KPI12','HQ','Q1FY26', 70.0, 90.7, 'met', null),
  ('KPI13','HQ','Q1FY26', null, null, 'not-measurable', 'Training commences Q2 onward');
