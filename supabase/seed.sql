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

  ('KPI1', 'HQ','Q1FY26', 24.7, 31.6, 'met', null),
  ('KPI2', 'HQ','Q1FY26', 55.0, 40.6, 'met', null),
  ('KPI3', 'HQ','Q1FY26', 4.5,  4.2,  'not-met', null),
  ('KPI4', 'HQ','Q1FY26', null, null, 'not-measurable', 'Annual assessment scheduled Q4'),
  ('KPI5', 'HQ','Q1FY26', null, null, 'not-measurable', 'Bi-annual survey — next in Q2'),
  ('KPI6', 'HQ','Q1FY26', null, null, 'not-measurable', 'Baseline monitoring framework in progress'),
  ('KPI7', 'HQ','Q1FY26', null, null, 'not-measurable', 'Initiatives planned to complete from Q3'),
  ('KPI8', 'HQ','Q1FY26', 6, 3, 'not-met', null),
  ('KPI9', 'HQ','Q1FY26', 80.0, 88.7, 'met', null),
  ('KPI10','HQ','Q1FY26', null, null, 'not-measurable', 'Programmes commence Q2 onward'),
  ('KPI11','HQ','Q1FY26', 0.625, 1.03, 'met', null),
  ('KPI12','HQ','Q1FY26', 70.0, 92.4, 'met', null),
  ('KPI13','HQ','Q1FY26', null, null, 'not-measurable', 'Training commences Q2 onward');



-- ── Detail data (headcount/demographics, financial detail, initiatives) ───
-- Transcribed from src/data/headcount.ts, financialDetail.ts, initiatives.ts.
-- Q1-Q4 FY2025 (closed) + Q1 FY2026 seeded; Q2 FY2026 onward is intentionally
-- empty for real submission via the Data Entry screen's Workforce/Financial tabs.

insert into detail_metrics (entity_id, period_id, metric_key, dimension, dimension2, value, note) values ('HQ', 'Q1FY25', 'headcount_summary', 'total_employees', '', 208, null);
insert into detail_metrics (entity_id, period_id, metric_key, dimension, dimension2, value, note) values ('HQ', 'Q1FY25', 'headcount_summary', 'bumiputera', '', 179, null);
insert into detail_metrics (entity_id, period_id, metric_key, dimension, dimension2, value, note) values ('HQ', 'Q1FY25', 'headcount_summary', 'non_bumiputera', '', 29, null);
insert into detail_metrics (entity_id, period_id, metric_key, dimension, dimension2, value, note) values ('HQ', 'Q1FY25', 'headcount_summary', 'approved_headcount', '', 227, null);
insert into detail_metrics (entity_id, period_id, metric_key, dimension, dimension2, value, note) values ('HQ', 'Q1FY25', 'headcount_summary', 'filled_position', '', 208, null);
insert into detail_metrics (entity_id, period_id, metric_key, dimension, dimension2, value, note) values ('HQ', 'Q2FY25', 'headcount_summary', 'total_employees', '', 211, null);
insert into detail_metrics (entity_id, period_id, metric_key, dimension, dimension2, value, note) values ('HQ', 'Q2FY25', 'headcount_summary', 'bumiputera', '', 184, null);
insert into detail_metrics (entity_id, period_id, metric_key, dimension, dimension2, value, note) values ('HQ', 'Q2FY25', 'headcount_summary', 'non_bumiputera', '', 27, null);
insert into detail_metrics (entity_id, period_id, metric_key, dimension, dimension2, value, note) values ('HQ', 'Q2FY25', 'headcount_summary', 'approved_headcount', '', 228, null);
insert into detail_metrics (entity_id, period_id, metric_key, dimension, dimension2, value, note) values ('HQ', 'Q2FY25', 'headcount_summary', 'filled_position', '', 211, null);
insert into detail_metrics (entity_id, period_id, metric_key, dimension, dimension2, value, note) values ('HQ', 'Q3FY25', 'headcount_summary', 'total_employees', '', 214, null);
insert into detail_metrics (entity_id, period_id, metric_key, dimension, dimension2, value, note) values ('HQ', 'Q3FY25', 'headcount_summary', 'bumiputera', '', 188, null);
insert into detail_metrics (entity_id, period_id, metric_key, dimension, dimension2, value, note) values ('HQ', 'Q3FY25', 'headcount_summary', 'non_bumiputera', '', 26, null);
insert into detail_metrics (entity_id, period_id, metric_key, dimension, dimension2, value, note) values ('HQ', 'Q3FY25', 'headcount_summary', 'approved_headcount', '', 229, null);
insert into detail_metrics (entity_id, period_id, metric_key, dimension, dimension2, value, note) values ('HQ', 'Q3FY25', 'headcount_summary', 'filled_position', '', 214, null);
insert into detail_metrics (entity_id, period_id, metric_key, dimension, dimension2, value, note) values ('HQ', 'Q4FY25', 'headcount_summary', 'total_employees', '', 217, null);
insert into detail_metrics (entity_id, period_id, metric_key, dimension, dimension2, value, note) values ('HQ', 'Q4FY25', 'headcount_summary', 'bumiputera', '', 192, null);
insert into detail_metrics (entity_id, period_id, metric_key, dimension, dimension2, value, note) values ('HQ', 'Q4FY25', 'headcount_summary', 'non_bumiputera', '', 25, null);
insert into detail_metrics (entity_id, period_id, metric_key, dimension, dimension2, value, note) values ('HQ', 'Q4FY25', 'headcount_summary', 'approved_headcount', '', 231, null);
insert into detail_metrics (entity_id, period_id, metric_key, dimension, dimension2, value, note) values ('HQ', 'Q4FY25', 'headcount_summary', 'filled_position', '', 217, null);
insert into detail_metrics (entity_id, period_id, metric_key, dimension, dimension2, value, note) values ('HQ', 'Q1FY26', 'headcount_summary', 'total_employees', '', 225, null);
insert into detail_metrics (entity_id, period_id, metric_key, dimension, dimension2, value, note) values ('HQ', 'Q1FY26', 'headcount_summary', 'bumiputera', '', 208, null);
insert into detail_metrics (entity_id, period_id, metric_key, dimension, dimension2, value, note) values ('HQ', 'Q1FY26', 'headcount_summary', 'non_bumiputera', '', 17, null);
insert into detail_metrics (entity_id, period_id, metric_key, dimension, dimension2, value, note) values ('HQ', 'Q1FY26', 'headcount_summary', 'approved_headcount', '', 231, null);
insert into detail_metrics (entity_id, period_id, metric_key, dimension, dimension2, value, note) values ('HQ', 'Q1FY26', 'headcount_summary', 'filled_position', '', 225, null);
insert into detail_metrics (entity_id, period_id, metric_key, dimension, dimension2, value, note) values ('HQ', 'Q1FY25', 'gender_breakdown', 'male', '', 110, null);
insert into detail_metrics (entity_id, period_id, metric_key, dimension, dimension2, value, note) values ('HQ', 'Q1FY25', 'gender_breakdown', 'female', '', 98, null);
insert into detail_metrics (entity_id, period_id, metric_key, dimension, dimension2, value, note) values ('HQ', 'Q2FY25', 'gender_breakdown', 'male', '', 112, null);
insert into detail_metrics (entity_id, period_id, metric_key, dimension, dimension2, value, note) values ('HQ', 'Q2FY25', 'gender_breakdown', 'female', '', 99, null);
insert into detail_metrics (entity_id, period_id, metric_key, dimension, dimension2, value, note) values ('HQ', 'Q3FY25', 'gender_breakdown', 'male', '', 113, null);
insert into detail_metrics (entity_id, period_id, metric_key, dimension, dimension2, value, note) values ('HQ', 'Q3FY25', 'gender_breakdown', 'female', '', 101, null);
insert into detail_metrics (entity_id, period_id, metric_key, dimension, dimension2, value, note) values ('HQ', 'Q4FY25', 'gender_breakdown', 'male', '', 115, null);
insert into detail_metrics (entity_id, period_id, metric_key, dimension, dimension2, value, note) values ('HQ', 'Q4FY25', 'gender_breakdown', 'female', '', 102, null);
insert into detail_metrics (entity_id, period_id, metric_key, dimension, dimension2, value, note) values ('HQ', 'Q1FY26', 'gender_breakdown', 'male', '', 116, null);
insert into detail_metrics (entity_id, period_id, metric_key, dimension, dimension2, value, note) values ('HQ', 'Q1FY26', 'gender_breakdown', 'female', '', 103, null);
insert into detail_metrics (entity_id, period_id, metric_key, dimension, dimension2, value, note) values ('HQ', 'Q1FY25', 'grade_breakdown', 'Top Management', '', 7, null);
insert into detail_metrics (entity_id, period_id, metric_key, dimension, dimension2, value, note) values ('HQ', 'Q1FY25', 'grade_breakdown', 'Senior Management', '', 20, null);
insert into detail_metrics (entity_id, period_id, metric_key, dimension, dimension2, value, note) values ('HQ', 'Q1FY25', 'grade_breakdown', 'Management', '', 49, null);
insert into detail_metrics (entity_id, period_id, metric_key, dimension, dimension2, value, note) values ('HQ', 'Q1FY25', 'grade_breakdown', 'Executive', '', 98, null);
insert into detail_metrics (entity_id, period_id, metric_key, dimension, dimension2, value, note) values ('HQ', 'Q1FY25', 'grade_breakdown', 'Non-Executive', '', 34, null);
insert into detail_metrics (entity_id, period_id, metric_key, dimension, dimension2, value, note) values ('HQ', 'Q2FY25', 'grade_breakdown', 'Top Management', '', 7, null);
insert into detail_metrics (entity_id, period_id, metric_key, dimension, dimension2, value, note) values ('HQ', 'Q2FY25', 'grade_breakdown', 'Senior Management', '', 20, null);
insert into detail_metrics (entity_id, period_id, metric_key, dimension, dimension2, value, note) values ('HQ', 'Q2FY25', 'grade_breakdown', 'Management', '', 50, null);
insert into detail_metrics (entity_id, period_id, metric_key, dimension, dimension2, value, note) values ('HQ', 'Q2FY25', 'grade_breakdown', 'Executive', '', 100, null);
insert into detail_metrics (entity_id, period_id, metric_key, dimension, dimension2, value, note) values ('HQ', 'Q2FY25', 'grade_breakdown', 'Non-Executive', '', 34, null);
insert into detail_metrics (entity_id, period_id, metric_key, dimension, dimension2, value, note) values ('HQ', 'Q3FY25', 'grade_breakdown', 'Top Management', '', 7, null);
insert into detail_metrics (entity_id, period_id, metric_key, dimension, dimension2, value, note) values ('HQ', 'Q3FY25', 'grade_breakdown', 'Senior Management', '', 21, null);
insert into detail_metrics (entity_id, period_id, metric_key, dimension, dimension2, value, note) values ('HQ', 'Q3FY25', 'grade_breakdown', 'Management', '', 51, null);
insert into detail_metrics (entity_id, period_id, metric_key, dimension, dimension2, value, note) values ('HQ', 'Q3FY25', 'grade_breakdown', 'Executive', '', 101, null);
insert into detail_metrics (entity_id, period_id, metric_key, dimension, dimension2, value, note) values ('HQ', 'Q3FY25', 'grade_breakdown', 'Non-Executive', '', 34, null);
insert into detail_metrics (entity_id, period_id, metric_key, dimension, dimension2, value, note) values ('HQ', 'Q4FY25', 'grade_breakdown', 'Top Management', '', 7, null);
insert into detail_metrics (entity_id, period_id, metric_key, dimension, dimension2, value, note) values ('HQ', 'Q4FY25', 'grade_breakdown', 'Senior Management', '', 21, null);
insert into detail_metrics (entity_id, period_id, metric_key, dimension, dimension2, value, note) values ('HQ', 'Q4FY25', 'grade_breakdown', 'Management', '', 51, null);
insert into detail_metrics (entity_id, period_id, metric_key, dimension, dimension2, value, note) values ('HQ', 'Q4FY25', 'grade_breakdown', 'Executive', '', 103, null);
insert into detail_metrics (entity_id, period_id, metric_key, dimension, dimension2, value, note) values ('HQ', 'Q4FY25', 'grade_breakdown', 'Non-Executive', '', 35, null);
insert into detail_metrics (entity_id, period_id, metric_key, dimension, dimension2, value, note) values ('HQ', 'Q1FY26', 'grade_breakdown', 'Top Management', '', 7, null);
insert into detail_metrics (entity_id, period_id, metric_key, dimension, dimension2, value, note) values ('HQ', 'Q1FY26', 'grade_breakdown', 'Senior Management', '', 21, null);
insert into detail_metrics (entity_id, period_id, metric_key, dimension, dimension2, value, note) values ('HQ', 'Q1FY26', 'grade_breakdown', 'Management', '', 52, null);
insert into detail_metrics (entity_id, period_id, metric_key, dimension, dimension2, value, note) values ('HQ', 'Q1FY26', 'grade_breakdown', 'Executive', '', 104, null);
insert into detail_metrics (entity_id, period_id, metric_key, dimension, dimension2, value, note) values ('HQ', 'Q1FY26', 'grade_breakdown', 'Non-Executive', '', 35, null);
insert into detail_metrics (entity_id, period_id, metric_key, dimension, dimension2, value, note) values ('HQ', 'Q1FY25', 'age_breakdown', '≤30', '', 36, null);
insert into detail_metrics (entity_id, period_id, metric_key, dimension, dimension2, value, note) values ('HQ', 'Q1FY25', 'age_breakdown', '31–40', '', 87, null);
insert into detail_metrics (entity_id, period_id, metric_key, dimension, dimension2, value, note) values ('HQ', 'Q1FY25', 'age_breakdown', '41–50', '', 58, null);
insert into detail_metrics (entity_id, period_id, metric_key, dimension, dimension2, value, note) values ('HQ', 'Q1FY25', 'age_breakdown', '51+', '', 27, null);
insert into detail_metrics (entity_id, period_id, metric_key, dimension, dimension2, value, note) values ('HQ', 'Q2FY25', 'age_breakdown', '≤30', '', 37, null);
insert into detail_metrics (entity_id, period_id, metric_key, dimension, dimension2, value, note) values ('HQ', 'Q2FY25', 'age_breakdown', '31–40', '', 89, null);
insert into detail_metrics (entity_id, period_id, metric_key, dimension, dimension2, value, note) values ('HQ', 'Q2FY25', 'age_breakdown', '41–50', '', 59, null);
insert into detail_metrics (entity_id, period_id, metric_key, dimension, dimension2, value, note) values ('HQ', 'Q2FY25', 'age_breakdown', '51+', '', 26, null);
insert into detail_metrics (entity_id, period_id, metric_key, dimension, dimension2, value, note) values ('HQ', 'Q3FY25', 'age_breakdown', '≤30', '', 37, null);
insert into detail_metrics (entity_id, period_id, metric_key, dimension, dimension2, value, note) values ('HQ', 'Q3FY25', 'age_breakdown', '31–40', '', 90, null);
insert into detail_metrics (entity_id, period_id, metric_key, dimension, dimension2, value, note) values ('HQ', 'Q3FY25', 'age_breakdown', '41–50', '', 60, null);
insert into detail_metrics (entity_id, period_id, metric_key, dimension, dimension2, value, note) values ('HQ', 'Q3FY25', 'age_breakdown', '51+', '', 27, null);
insert into detail_metrics (entity_id, period_id, metric_key, dimension, dimension2, value, note) values ('HQ', 'Q4FY25', 'age_breakdown', '≤30', '', 38, null);
insert into detail_metrics (entity_id, period_id, metric_key, dimension, dimension2, value, note) values ('HQ', 'Q4FY25', 'age_breakdown', '31–40', '', 91, null);
insert into detail_metrics (entity_id, period_id, metric_key, dimension, dimension2, value, note) values ('HQ', 'Q4FY25', 'age_breakdown', '41–50', '', 61, null);
insert into detail_metrics (entity_id, period_id, metric_key, dimension, dimension2, value, note) values ('HQ', 'Q4FY25', 'age_breakdown', '51+', '', 27, null);
insert into detail_metrics (entity_id, period_id, metric_key, dimension, dimension2, value, note) values ('HQ', 'Q1FY26', 'age_breakdown', '≤30', '', 38, null);
insert into detail_metrics (entity_id, period_id, metric_key, dimension, dimension2, value, note) values ('HQ', 'Q1FY26', 'age_breakdown', '31–40', '', 92, null);
insert into detail_metrics (entity_id, period_id, metric_key, dimension, dimension2, value, note) values ('HQ', 'Q1FY26', 'age_breakdown', '41–50', '', 61, null);
insert into detail_metrics (entity_id, period_id, metric_key, dimension, dimension2, value, note) values ('HQ', 'Q1FY26', 'age_breakdown', '51+', '', 28, null);
insert into detail_metrics (entity_id, period_id, metric_key, dimension, dimension2, value, note) values ('HQ', 'Q1FY25', 'age_gender_breakdown', '≤30', 'male', 19, null);
insert into detail_metrics (entity_id, period_id, metric_key, dimension, dimension2, value, note) values ('HQ', 'Q1FY25', 'age_gender_breakdown', '≤30', 'female', 17, null);
insert into detail_metrics (entity_id, period_id, metric_key, dimension, dimension2, value, note) values ('HQ', 'Q1FY25', 'age_gender_breakdown', '31–40', 'male', 45, null);
insert into detail_metrics (entity_id, period_id, metric_key, dimension, dimension2, value, note) values ('HQ', 'Q1FY25', 'age_gender_breakdown', '31–40', 'female', 42, null);
insert into detail_metrics (entity_id, period_id, metric_key, dimension, dimension2, value, note) values ('HQ', 'Q1FY25', 'age_gender_breakdown', '41–50', 'male', 31, null);
insert into detail_metrics (entity_id, period_id, metric_key, dimension, dimension2, value, note) values ('HQ', 'Q1FY25', 'age_gender_breakdown', '41–50', 'female', 27, null);
insert into detail_metrics (entity_id, period_id, metric_key, dimension, dimension2, value, note) values ('HQ', 'Q1FY25', 'age_gender_breakdown', '51+', 'male', 15, null);
insert into detail_metrics (entity_id, period_id, metric_key, dimension, dimension2, value, note) values ('HQ', 'Q1FY25', 'age_gender_breakdown', '51+', 'female', 12, null);
insert into detail_metrics (entity_id, period_id, metric_key, dimension, dimension2, value, note) values ('HQ', 'Q2FY25', 'age_gender_breakdown', '≤30', 'male', 19, null);
insert into detail_metrics (entity_id, period_id, metric_key, dimension, dimension2, value, note) values ('HQ', 'Q2FY25', 'age_gender_breakdown', '≤30', 'female', 18, null);
insert into detail_metrics (entity_id, period_id, metric_key, dimension, dimension2, value, note) values ('HQ', 'Q2FY25', 'age_gender_breakdown', '31–40', 'male', 47, null);
insert into detail_metrics (entity_id, period_id, metric_key, dimension, dimension2, value, note) values ('HQ', 'Q2FY25', 'age_gender_breakdown', '31–40', 'female', 42, null);
insert into detail_metrics (entity_id, period_id, metric_key, dimension, dimension2, value, note) values ('HQ', 'Q2FY25', 'age_gender_breakdown', '41–50', 'male', 31, null);
insert into detail_metrics (entity_id, period_id, metric_key, dimension, dimension2, value, note) values ('HQ', 'Q2FY25', 'age_gender_breakdown', '41–50', 'female', 28, null);
insert into detail_metrics (entity_id, period_id, metric_key, dimension, dimension2, value, note) values ('HQ', 'Q2FY25', 'age_gender_breakdown', '51+', 'male', 15, null);
insert into detail_metrics (entity_id, period_id, metric_key, dimension, dimension2, value, note) values ('HQ', 'Q2FY25', 'age_gender_breakdown', '51+', 'female', 11, null);
insert into detail_metrics (entity_id, period_id, metric_key, dimension, dimension2, value, note) values ('HQ', 'Q3FY25', 'age_gender_breakdown', '≤30', 'male', 19, null);
insert into detail_metrics (entity_id, period_id, metric_key, dimension, dimension2, value, note) values ('HQ', 'Q3FY25', 'age_gender_breakdown', '≤30', 'female', 18, null);
insert into detail_metrics (entity_id, period_id, metric_key, dimension, dimension2, value, note) values ('HQ', 'Q3FY25', 'age_gender_breakdown', '31–40', 'male', 47, null);
insert into detail_metrics (entity_id, period_id, metric_key, dimension, dimension2, value, note) values ('HQ', 'Q3FY25', 'age_gender_breakdown', '31–40', 'female', 43, null);
insert into detail_metrics (entity_id, period_id, metric_key, dimension, dimension2, value, note) values ('HQ', 'Q3FY25', 'age_gender_breakdown', '41–50', 'male', 32, null);
insert into detail_metrics (entity_id, period_id, metric_key, dimension, dimension2, value, note) values ('HQ', 'Q3FY25', 'age_gender_breakdown', '41–50', 'female', 28, null);
insert into detail_metrics (entity_id, period_id, metric_key, dimension, dimension2, value, note) values ('HQ', 'Q3FY25', 'age_gender_breakdown', '51+', 'male', 15, null);
insert into detail_metrics (entity_id, period_id, metric_key, dimension, dimension2, value, note) values ('HQ', 'Q3FY25', 'age_gender_breakdown', '51+', 'female', 12, null);
insert into detail_metrics (entity_id, period_id, metric_key, dimension, dimension2, value, note) values ('HQ', 'Q4FY25', 'age_gender_breakdown', '≤30', 'male', 20, null);
insert into detail_metrics (entity_id, period_id, metric_key, dimension, dimension2, value, note) values ('HQ', 'Q4FY25', 'age_gender_breakdown', '≤30', 'female', 18, null);
insert into detail_metrics (entity_id, period_id, metric_key, dimension, dimension2, value, note) values ('HQ', 'Q4FY25', 'age_gender_breakdown', '31–40', 'male', 48, null);
insert into detail_metrics (entity_id, period_id, metric_key, dimension, dimension2, value, note) values ('HQ', 'Q4FY25', 'age_gender_breakdown', '31–40', 'female', 43, null);
insert into detail_metrics (entity_id, period_id, metric_key, dimension, dimension2, value, note) values ('HQ', 'Q4FY25', 'age_gender_breakdown', '41–50', 'male', 32, null);
insert into detail_metrics (entity_id, period_id, metric_key, dimension, dimension2, value, note) values ('HQ', 'Q4FY25', 'age_gender_breakdown', '41–50', 'female', 29, null);
insert into detail_metrics (entity_id, period_id, metric_key, dimension, dimension2, value, note) values ('HQ', 'Q4FY25', 'age_gender_breakdown', '51+', 'male', 15, null);
insert into detail_metrics (entity_id, period_id, metric_key, dimension, dimension2, value, note) values ('HQ', 'Q4FY25', 'age_gender_breakdown', '51+', 'female', 12, null);
insert into detail_metrics (entity_id, period_id, metric_key, dimension, dimension2, value, note) values ('HQ', 'Q1FY26', 'age_gender_breakdown', '≤30', 'male', 20, null);
insert into detail_metrics (entity_id, period_id, metric_key, dimension, dimension2, value, note) values ('HQ', 'Q1FY26', 'age_gender_breakdown', '≤30', 'female', 18, null);
insert into detail_metrics (entity_id, period_id, metric_key, dimension, dimension2, value, note) values ('HQ', 'Q1FY26', 'age_gender_breakdown', '31–40', 'male', 48, null);
insert into detail_metrics (entity_id, period_id, metric_key, dimension, dimension2, value, note) values ('HQ', 'Q1FY26', 'age_gender_breakdown', '31–40', 'female', 44, null);
insert into detail_metrics (entity_id, period_id, metric_key, dimension, dimension2, value, note) values ('HQ', 'Q1FY26', 'age_gender_breakdown', '41–50', 'male', 32, null);
insert into detail_metrics (entity_id, period_id, metric_key, dimension, dimension2, value, note) values ('HQ', 'Q1FY26', 'age_gender_breakdown', '41–50', 'female', 29, null);
insert into detail_metrics (entity_id, period_id, metric_key, dimension, dimension2, value, note) values ('HQ', 'Q1FY26', 'age_gender_breakdown', '51+', 'male', 16, null);
insert into detail_metrics (entity_id, period_id, metric_key, dimension, dimension2, value, note) values ('HQ', 'Q1FY26', 'age_gender_breakdown', '51+', 'female', 12, null);
insert into detail_metrics (entity_id, period_id, metric_key, dimension, dimension2, value, note) values ('HQ', 'Q1FY25', 'average_age', 'avg', '', 38.9, null);
insert into detail_metrics (entity_id, period_id, metric_key, dimension, dimension2, value, note) values ('HQ', 'Q2FY25', 'average_age', 'avg', '', 38.8, null);
insert into detail_metrics (entity_id, period_id, metric_key, dimension, dimension2, value, note) values ('HQ', 'Q3FY25', 'average_age', 'avg', '', 38.7, null);
insert into detail_metrics (entity_id, period_id, metric_key, dimension, dimension2, value, note) values ('HQ', 'Q4FY25', 'average_age', 'avg', '', 38.6, null);
insert into detail_metrics (entity_id, period_id, metric_key, dimension, dimension2, value, note) values ('HQ', 'Q1FY26', 'average_age', 'avg', '', 38.6, null);
insert into detail_metrics (entity_id, period_id, metric_key, dimension, dimension2, value, note) values ('HQ', 'Q1FY25', 'grade_gender_crosstab', 'Top Management', 'male', 5, null);
insert into detail_metrics (entity_id, period_id, metric_key, dimension, dimension2, value, note) values ('HQ', 'Q1FY25', 'grade_gender_crosstab', 'Top Management', 'female', 2, null);
insert into detail_metrics (entity_id, period_id, metric_key, dimension, dimension2, value, note) values ('HQ', 'Q1FY25', 'grade_gender_crosstab', 'Top Management', 'avgAge', 51.1, null);
insert into detail_metrics (entity_id, period_id, metric_key, dimension, dimension2, value, note) values ('HQ', 'Q1FY25', 'grade_gender_crosstab', 'Senior Management', 'male', 11, null);
insert into detail_metrics (entity_id, period_id, metric_key, dimension, dimension2, value, note) values ('HQ', 'Q1FY25', 'grade_gender_crosstab', 'Senior Management', 'female', 9, null);
insert into detail_metrics (entity_id, period_id, metric_key, dimension, dimension2, value, note) values ('HQ', 'Q1FY25', 'grade_gender_crosstab', 'Senior Management', 'avgAge', 45.6, null);
insert into detail_metrics (entity_id, period_id, metric_key, dimension, dimension2, value, note) values ('HQ', 'Q1FY25', 'grade_gender_crosstab', 'Management', 'male', 25, null);
insert into detail_metrics (entity_id, period_id, metric_key, dimension, dimension2, value, note) values ('HQ', 'Q1FY25', 'grade_gender_crosstab', 'Management', 'female', 24, null);
insert into detail_metrics (entity_id, period_id, metric_key, dimension, dimension2, value, note) values ('HQ', 'Q1FY25', 'grade_gender_crosstab', 'Management', 'avgAge', 40.3, null);
insert into detail_metrics (entity_id, period_id, metric_key, dimension, dimension2, value, note) values ('HQ', 'Q1FY25', 'grade_gender_crosstab', 'Executive', 'male', 50, null);
insert into detail_metrics (entity_id, period_id, metric_key, dimension, dimension2, value, note) values ('HQ', 'Q1FY25', 'grade_gender_crosstab', 'Executive', 'female', 48, null);
insert into detail_metrics (entity_id, period_id, metric_key, dimension, dimension2, value, note) values ('HQ', 'Q1FY25', 'grade_gender_crosstab', 'Executive', 'avgAge', 33.6, null);
insert into detail_metrics (entity_id, period_id, metric_key, dimension, dimension2, value, note) values ('HQ', 'Q1FY25', 'grade_gender_crosstab', 'Non-Executive', 'male', 19, null);
insert into detail_metrics (entity_id, period_id, metric_key, dimension, dimension2, value, note) values ('HQ', 'Q1FY25', 'grade_gender_crosstab', 'Non-Executive', 'female', 15, null);
insert into detail_metrics (entity_id, period_id, metric_key, dimension, dimension2, value, note) values ('HQ', 'Q1FY25', 'grade_gender_crosstab', 'Non-Executive', 'avgAge', 35.5, null);
insert into detail_metrics (entity_id, period_id, metric_key, dimension, dimension2, value, note) values ('HQ', 'Q2FY25', 'grade_gender_crosstab', 'Top Management', 'male', 5, null);
insert into detail_metrics (entity_id, period_id, metric_key, dimension, dimension2, value, note) values ('HQ', 'Q2FY25', 'grade_gender_crosstab', 'Top Management', 'female', 2, null);
insert into detail_metrics (entity_id, period_id, metric_key, dimension, dimension2, value, note) values ('HQ', 'Q2FY25', 'grade_gender_crosstab', 'Top Management', 'avgAge', 51.3, null);
insert into detail_metrics (entity_id, period_id, metric_key, dimension, dimension2, value, note) values ('HQ', 'Q2FY25', 'grade_gender_crosstab', 'Senior Management', 'male', 11, null);
insert into detail_metrics (entity_id, period_id, metric_key, dimension, dimension2, value, note) values ('HQ', 'Q2FY25', 'grade_gender_crosstab', 'Senior Management', 'female', 9, null);
insert into detail_metrics (entity_id, period_id, metric_key, dimension, dimension2, value, note) values ('HQ', 'Q2FY25', 'grade_gender_crosstab', 'Senior Management', 'avgAge', 45.7, null);
insert into detail_metrics (entity_id, period_id, metric_key, dimension, dimension2, value, note) values ('HQ', 'Q2FY25', 'grade_gender_crosstab', 'Management', 'male', 27, null);
insert into detail_metrics (entity_id, period_id, metric_key, dimension, dimension2, value, note) values ('HQ', 'Q2FY25', 'grade_gender_crosstab', 'Management', 'female', 23, null);
insert into detail_metrics (entity_id, period_id, metric_key, dimension, dimension2, value, note) values ('HQ', 'Q2FY25', 'grade_gender_crosstab', 'Management', 'avgAge', 40.4, null);
insert into detail_metrics (entity_id, period_id, metric_key, dimension, dimension2, value, note) values ('HQ', 'Q2FY25', 'grade_gender_crosstab', 'Executive', 'male', 50, null);
insert into detail_metrics (entity_id, period_id, metric_key, dimension, dimension2, value, note) values ('HQ', 'Q2FY25', 'grade_gender_crosstab', 'Executive', 'female', 50, null);
insert into detail_metrics (entity_id, period_id, metric_key, dimension, dimension2, value, note) values ('HQ', 'Q2FY25', 'grade_gender_crosstab', 'Executive', 'avgAge', 33.7, null);
insert into detail_metrics (entity_id, period_id, metric_key, dimension, dimension2, value, note) values ('HQ', 'Q2FY25', 'grade_gender_crosstab', 'Non-Executive', 'male', 19, null);
insert into detail_metrics (entity_id, period_id, metric_key, dimension, dimension2, value, note) values ('HQ', 'Q2FY25', 'grade_gender_crosstab', 'Non-Executive', 'female', 15, null);
insert into detail_metrics (entity_id, period_id, metric_key, dimension, dimension2, value, note) values ('HQ', 'Q2FY25', 'grade_gender_crosstab', 'Non-Executive', 'avgAge', 35.6, null);
insert into detail_metrics (entity_id, period_id, metric_key, dimension, dimension2, value, note) values ('HQ', 'Q3FY25', 'grade_gender_crosstab', 'Top Management', 'male', 5, null);
insert into detail_metrics (entity_id, period_id, metric_key, dimension, dimension2, value, note) values ('HQ', 'Q3FY25', 'grade_gender_crosstab', 'Top Management', 'female', 2, null);
insert into detail_metrics (entity_id, period_id, metric_key, dimension, dimension2, value, note) values ('HQ', 'Q3FY25', 'grade_gender_crosstab', 'Top Management', 'avgAge', 51.6, null);
insert into detail_metrics (entity_id, period_id, metric_key, dimension, dimension2, value, note) values ('HQ', 'Q3FY25', 'grade_gender_crosstab', 'Senior Management', 'male', 12, null);
insert into detail_metrics (entity_id, period_id, metric_key, dimension, dimension2, value, note) values ('HQ', 'Q3FY25', 'grade_gender_crosstab', 'Senior Management', 'female', 9, null);
insert into detail_metrics (entity_id, period_id, metric_key, dimension, dimension2, value, note) values ('HQ', 'Q3FY25', 'grade_gender_crosstab', 'Senior Management', 'avgAge', 45.9, null);
insert into detail_metrics (entity_id, period_id, metric_key, dimension, dimension2, value, note) values ('HQ', 'Q3FY25', 'grade_gender_crosstab', 'Management', 'male', 26, null);
insert into detail_metrics (entity_id, period_id, metric_key, dimension, dimension2, value, note) values ('HQ', 'Q3FY25', 'grade_gender_crosstab', 'Management', 'female', 25, null);
insert into detail_metrics (entity_id, period_id, metric_key, dimension, dimension2, value, note) values ('HQ', 'Q3FY25', 'grade_gender_crosstab', 'Management', 'avgAge', 40.5, null);
insert into detail_metrics (entity_id, period_id, metric_key, dimension, dimension2, value, note) values ('HQ', 'Q3FY25', 'grade_gender_crosstab', 'Executive', 'male', 51, null);
insert into detail_metrics (entity_id, period_id, metric_key, dimension, dimension2, value, note) values ('HQ', 'Q3FY25', 'grade_gender_crosstab', 'Executive', 'female', 50, null);
insert into detail_metrics (entity_id, period_id, metric_key, dimension, dimension2, value, note) values ('HQ', 'Q3FY25', 'grade_gender_crosstab', 'Executive', 'avgAge', 33.8, null);
insert into detail_metrics (entity_id, period_id, metric_key, dimension, dimension2, value, note) values ('HQ', 'Q3FY25', 'grade_gender_crosstab', 'Non-Executive', 'male', 19, null);
insert into detail_metrics (entity_id, period_id, metric_key, dimension, dimension2, value, note) values ('HQ', 'Q3FY25', 'grade_gender_crosstab', 'Non-Executive', 'female', 15, null);
insert into detail_metrics (entity_id, period_id, metric_key, dimension, dimension2, value, note) values ('HQ', 'Q3FY25', 'grade_gender_crosstab', 'Non-Executive', 'avgAge', 35.7, null);
insert into detail_metrics (entity_id, period_id, metric_key, dimension, dimension2, value, note) values ('HQ', 'Q4FY25', 'grade_gender_crosstab', 'Top Management', 'male', 5, null);
insert into detail_metrics (entity_id, period_id, metric_key, dimension, dimension2, value, note) values ('HQ', 'Q4FY25', 'grade_gender_crosstab', 'Top Management', 'female', 2, null);
insert into detail_metrics (entity_id, period_id, metric_key, dimension, dimension2, value, note) values ('HQ', 'Q4FY25', 'grade_gender_crosstab', 'Top Management', 'avgAge', 51.8, null);
insert into detail_metrics (entity_id, period_id, metric_key, dimension, dimension2, value, note) values ('HQ', 'Q4FY25', 'grade_gender_crosstab', 'Senior Management', 'male', 12, null);
insert into detail_metrics (entity_id, period_id, metric_key, dimension, dimension2, value, note) values ('HQ', 'Q4FY25', 'grade_gender_crosstab', 'Senior Management', 'female', 9, null);
insert into detail_metrics (entity_id, period_id, metric_key, dimension, dimension2, value, note) values ('HQ', 'Q4FY25', 'grade_gender_crosstab', 'Senior Management', 'avgAge', 46.0, null);
insert into detail_metrics (entity_id, period_id, metric_key, dimension, dimension2, value, note) values ('HQ', 'Q4FY25', 'grade_gender_crosstab', 'Management', 'male', 26, null);
insert into detail_metrics (entity_id, period_id, metric_key, dimension, dimension2, value, note) values ('HQ', 'Q4FY25', 'grade_gender_crosstab', 'Management', 'female', 25, null);
insert into detail_metrics (entity_id, period_id, metric_key, dimension, dimension2, value, note) values ('HQ', 'Q4FY25', 'grade_gender_crosstab', 'Management', 'avgAge', 40.7, null);
insert into detail_metrics (entity_id, period_id, metric_key, dimension, dimension2, value, note) values ('HQ', 'Q4FY25', 'grade_gender_crosstab', 'Executive', 'male', 52, null);
insert into detail_metrics (entity_id, period_id, metric_key, dimension, dimension2, value, note) values ('HQ', 'Q4FY25', 'grade_gender_crosstab', 'Executive', 'female', 51, null);
insert into detail_metrics (entity_id, period_id, metric_key, dimension, dimension2, value, note) values ('HQ', 'Q4FY25', 'grade_gender_crosstab', 'Executive', 'avgAge', 33.9, null);
insert into detail_metrics (entity_id, period_id, metric_key, dimension, dimension2, value, note) values ('HQ', 'Q4FY25', 'grade_gender_crosstab', 'Non-Executive', 'male', 20, null);
insert into detail_metrics (entity_id, period_id, metric_key, dimension, dimension2, value, note) values ('HQ', 'Q4FY25', 'grade_gender_crosstab', 'Non-Executive', 'female', 15, null);
insert into detail_metrics (entity_id, period_id, metric_key, dimension, dimension2, value, note) values ('HQ', 'Q4FY25', 'grade_gender_crosstab', 'Non-Executive', 'avgAge', 35.8, null);
insert into detail_metrics (entity_id, period_id, metric_key, dimension, dimension2, value, note) values ('HQ', 'Q1FY26', 'grade_gender_crosstab', 'Top Management', 'male', 5, null);
insert into detail_metrics (entity_id, period_id, metric_key, dimension, dimension2, value, note) values ('HQ', 'Q1FY26', 'grade_gender_crosstab', 'Top Management', 'female', 2, null);
insert into detail_metrics (entity_id, period_id, metric_key, dimension, dimension2, value, note) values ('HQ', 'Q1FY26', 'grade_gender_crosstab', 'Top Management', 'avgAge', 51.4, null);
insert into detail_metrics (entity_id, period_id, metric_key, dimension, dimension2, value, note) values ('HQ', 'Q1FY26', 'grade_gender_crosstab', 'Senior Management', 'male', 12, null);
insert into detail_metrics (entity_id, period_id, metric_key, dimension, dimension2, value, note) values ('HQ', 'Q1FY26', 'grade_gender_crosstab', 'Senior Management', 'female', 9, null);
insert into detail_metrics (entity_id, period_id, metric_key, dimension, dimension2, value, note) values ('HQ', 'Q1FY26', 'grade_gender_crosstab', 'Senior Management', 'avgAge', 45.9, null);
insert into detail_metrics (entity_id, period_id, metric_key, dimension, dimension2, value, note) values ('HQ', 'Q1FY26', 'grade_gender_crosstab', 'Management', 'male', 27, null);
insert into detail_metrics (entity_id, period_id, metric_key, dimension, dimension2, value, note) values ('HQ', 'Q1FY26', 'grade_gender_crosstab', 'Management', 'female', 25, null);
insert into detail_metrics (entity_id, period_id, metric_key, dimension, dimension2, value, note) values ('HQ', 'Q1FY26', 'grade_gender_crosstab', 'Management', 'avgAge', 40.6, null);
insert into detail_metrics (entity_id, period_id, metric_key, dimension, dimension2, value, note) values ('HQ', 'Q1FY26', 'grade_gender_crosstab', 'Executive', 'male', 52, null);
insert into detail_metrics (entity_id, period_id, metric_key, dimension, dimension2, value, note) values ('HQ', 'Q1FY26', 'grade_gender_crosstab', 'Executive', 'female', 52, null);
insert into detail_metrics (entity_id, period_id, metric_key, dimension, dimension2, value, note) values ('HQ', 'Q1FY26', 'grade_gender_crosstab', 'Executive', 'avgAge', 33.9, null);
insert into detail_metrics (entity_id, period_id, metric_key, dimension, dimension2, value, note) values ('HQ', 'Q1FY26', 'grade_gender_crosstab', 'Non-Executive', 'male', 20, null);
insert into detail_metrics (entity_id, period_id, metric_key, dimension, dimension2, value, note) values ('HQ', 'Q1FY26', 'grade_gender_crosstab', 'Non-Executive', 'female', 15, null);
insert into detail_metrics (entity_id, period_id, metric_key, dimension, dimension2, value, note) values ('HQ', 'Q1FY26', 'grade_gender_crosstab', 'Non-Executive', 'avgAge', 35.8, null);
insert into detail_metrics (entity_id, period_id, metric_key, dimension, dimension2, value, note) values ('HQ', 'Q1FY25', 'dept_headcount', 'Finance', 'approved', 22, null);
insert into detail_metrics (entity_id, period_id, metric_key, dimension, dimension2, value, note) values ('HQ', 'Q1FY25', 'dept_headcount', 'Finance', 'filled', 19, null);
insert into detail_metrics (entity_id, period_id, metric_key, dimension, dimension2, value, note) values ('HQ', 'Q1FY25', 'dept_headcount', 'Human Resource', 'approved', 16, null);
insert into detail_metrics (entity_id, period_id, metric_key, dimension, dimension2, value, note) values ('HQ', 'Q1FY25', 'dept_headcount', 'Human Resource', 'filled', 15, null);
insert into detail_metrics (entity_id, period_id, metric_key, dimension, dimension2, value, note) values ('HQ', 'Q1FY25', 'dept_headcount', 'Corporate Performance', 'approved', 14, null);
insert into detail_metrics (entity_id, period_id, metric_key, dimension, dimension2, value, note) values ('HQ', 'Q1FY25', 'dept_headcount', 'Corporate Performance', 'filled', 13, null);
insert into detail_metrics (entity_id, period_id, metric_key, dimension, dimension2, value, note) values ('HQ', 'Q1FY25', 'dept_headcount', 'IT & Digital', 'approved', 19, null);
insert into detail_metrics (entity_id, period_id, metric_key, dimension, dimension2, value, note) values ('HQ', 'Q1FY25', 'dept_headcount', 'IT & Digital', 'filled', 16, null);
insert into detail_metrics (entity_id, period_id, metric_key, dimension, dimension2, value, note) values ('HQ', 'Q1FY25', 'dept_headcount', 'Risk & Compliance', 'approved', 14, null);
insert into detail_metrics (entity_id, period_id, metric_key, dimension, dimension2, value, note) values ('HQ', 'Q1FY25', 'dept_headcount', 'Risk & Compliance', 'filled', 12, null);
insert into detail_metrics (entity_id, period_id, metric_key, dimension, dimension2, value, note) values ('HQ', 'Q2FY25', 'dept_headcount', 'Finance', 'approved', 23, null);
insert into detail_metrics (entity_id, period_id, metric_key, dimension, dimension2, value, note) values ('HQ', 'Q2FY25', 'dept_headcount', 'Finance', 'filled', 20, null);
insert into detail_metrics (entity_id, period_id, metric_key, dimension, dimension2, value, note) values ('HQ', 'Q2FY25', 'dept_headcount', 'Human Resource', 'approved', 17, null);
insert into detail_metrics (entity_id, period_id, metric_key, dimension, dimension2, value, note) values ('HQ', 'Q2FY25', 'dept_headcount', 'Human Resource', 'filled', 16, null);
insert into detail_metrics (entity_id, period_id, metric_key, dimension, dimension2, value, note) values ('HQ', 'Q2FY25', 'dept_headcount', 'Corporate Performance', 'approved', 15, null);
insert into detail_metrics (entity_id, period_id, metric_key, dimension, dimension2, value, note) values ('HQ', 'Q2FY25', 'dept_headcount', 'Corporate Performance', 'filled', 14, null);
insert into detail_metrics (entity_id, period_id, metric_key, dimension, dimension2, value, note) values ('HQ', 'Q2FY25', 'dept_headcount', 'IT & Digital', 'approved', 20, null);
insert into detail_metrics (entity_id, period_id, metric_key, dimension, dimension2, value, note) values ('HQ', 'Q2FY25', 'dept_headcount', 'IT & Digital', 'filled', 17, null);
insert into detail_metrics (entity_id, period_id, metric_key, dimension, dimension2, value, note) values ('HQ', 'Q2FY25', 'dept_headcount', 'Risk & Compliance', 'approved', 15, null);
insert into detail_metrics (entity_id, period_id, metric_key, dimension, dimension2, value, note) values ('HQ', 'Q2FY25', 'dept_headcount', 'Risk & Compliance', 'filled', 12, null);
insert into detail_metrics (entity_id, period_id, metric_key, dimension, dimension2, value, note) values ('HQ', 'Q3FY25', 'dept_headcount', 'Finance', 'approved', 23, null);
insert into detail_metrics (entity_id, period_id, metric_key, dimension, dimension2, value, note) values ('HQ', 'Q3FY25', 'dept_headcount', 'Finance', 'filled', 21, null);
insert into detail_metrics (entity_id, period_id, metric_key, dimension, dimension2, value, note) values ('HQ', 'Q3FY25', 'dept_headcount', 'Human Resource', 'approved', 17, null);
insert into detail_metrics (entity_id, period_id, metric_key, dimension, dimension2, value, note) values ('HQ', 'Q3FY25', 'dept_headcount', 'Human Resource', 'filled', 16, null);
insert into detail_metrics (entity_id, period_id, metric_key, dimension, dimension2, value, note) values ('HQ', 'Q3FY25', 'dept_headcount', 'Corporate Performance', 'approved', 15, null);
insert into detail_metrics (entity_id, period_id, metric_key, dimension, dimension2, value, note) values ('HQ', 'Q3FY25', 'dept_headcount', 'Corporate Performance', 'filled', 14, null);
insert into detail_metrics (entity_id, period_id, metric_key, dimension, dimension2, value, note) values ('HQ', 'Q3FY25', 'dept_headcount', 'IT & Digital', 'approved', 20, null);
insert into detail_metrics (entity_id, period_id, metric_key, dimension, dimension2, value, note) values ('HQ', 'Q3FY25', 'dept_headcount', 'IT & Digital', 'filled', 18, null);
insert into detail_metrics (entity_id, period_id, metric_key, dimension, dimension2, value, note) values ('HQ', 'Q3FY25', 'dept_headcount', 'Risk & Compliance', 'approved', 15, null);
insert into detail_metrics (entity_id, period_id, metric_key, dimension, dimension2, value, note) values ('HQ', 'Q3FY25', 'dept_headcount', 'Risk & Compliance', 'filled', 13, null);
insert into detail_metrics (entity_id, period_id, metric_key, dimension, dimension2, value, note) values ('HQ', 'Q4FY25', 'dept_headcount', 'Finance', 'approved', 24, null);
insert into detail_metrics (entity_id, period_id, metric_key, dimension, dimension2, value, note) values ('HQ', 'Q4FY25', 'dept_headcount', 'Finance', 'filled', 21, null);
insert into detail_metrics (entity_id, period_id, metric_key, dimension, dimension2, value, note) values ('HQ', 'Q4FY25', 'dept_headcount', 'Human Resource', 'approved', 18, null);
insert into detail_metrics (entity_id, period_id, metric_key, dimension, dimension2, value, note) values ('HQ', 'Q4FY25', 'dept_headcount', 'Human Resource', 'filled', 17, null);
insert into detail_metrics (entity_id, period_id, metric_key, dimension, dimension2, value, note) values ('HQ', 'Q4FY25', 'dept_headcount', 'Corporate Performance', 'approved', 15, null);
insert into detail_metrics (entity_id, period_id, metric_key, dimension, dimension2, value, note) values ('HQ', 'Q4FY25', 'dept_headcount', 'Corporate Performance', 'filled', 15, null);
insert into detail_metrics (entity_id, period_id, metric_key, dimension, dimension2, value, note) values ('HQ', 'Q4FY25', 'dept_headcount', 'IT & Digital', 'approved', 21, null);
insert into detail_metrics (entity_id, period_id, metric_key, dimension, dimension2, value, note) values ('HQ', 'Q4FY25', 'dept_headcount', 'IT & Digital', 'filled', 18, null);
insert into detail_metrics (entity_id, period_id, metric_key, dimension, dimension2, value, note) values ('HQ', 'Q4FY25', 'dept_headcount', 'Risk & Compliance', 'approved', 16, null);
insert into detail_metrics (entity_id, period_id, metric_key, dimension, dimension2, value, note) values ('HQ', 'Q4FY25', 'dept_headcount', 'Risk & Compliance', 'filled', 13, null);
insert into detail_metrics (entity_id, period_id, metric_key, dimension, dimension2, value, note) values ('HQ', 'Q1FY26', 'dept_headcount', 'Finance', 'approved', 24, null);
insert into detail_metrics (entity_id, period_id, metric_key, dimension, dimension2, value, note) values ('HQ', 'Q1FY26', 'dept_headcount', 'Finance', 'filled', 22, null);
insert into detail_metrics (entity_id, period_id, metric_key, dimension, dimension2, value, note) values ('HQ', 'Q1FY26', 'dept_headcount', 'Human Resource', 'approved', 18, null);
insert into detail_metrics (entity_id, period_id, metric_key, dimension, dimension2, value, note) values ('HQ', 'Q1FY26', 'dept_headcount', 'Human Resource', 'filled', 17, null);
insert into detail_metrics (entity_id, period_id, metric_key, dimension, dimension2, value, note) values ('HQ', 'Q1FY26', 'dept_headcount', 'Corporate Performance', 'approved', 15, null);
insert into detail_metrics (entity_id, period_id, metric_key, dimension, dimension2, value, note) values ('HQ', 'Q1FY26', 'dept_headcount', 'Corporate Performance', 'filled', 15, null);
insert into detail_metrics (entity_id, period_id, metric_key, dimension, dimension2, value, note) values ('HQ', 'Q1FY26', 'dept_headcount', 'IT & Digital', 'approved', 21, null);
insert into detail_metrics (entity_id, period_id, metric_key, dimension, dimension2, value, note) values ('HQ', 'Q1FY26', 'dept_headcount', 'IT & Digital', 'filled', 19, null);
insert into detail_metrics (entity_id, period_id, metric_key, dimension, dimension2, value, note) values ('HQ', 'Q1FY26', 'dept_headcount', 'Risk & Compliance', 'approved', 16, null);
insert into detail_metrics (entity_id, period_id, metric_key, dimension, dimension2, value, note) values ('HQ', 'Q1FY26', 'dept_headcount', 'Risk & Compliance', 'filled', 14, null);
insert into detail_metrics (entity_id, period_id, metric_key, dimension, dimension2, value, note) values ('HQ', 'Q1FY25', 'recruitment_index', 'Time to Hire (TTH)', 'weight', 0.2, null);
insert into detail_metrics (entity_id, period_id, metric_key, dimension, dimension2, value, note) values ('HQ', 'Q1FY25', 'recruitment_index', 'Time to Hire (TTH)', 'score', null, '4 / 5');
insert into detail_metrics (entity_id, period_id, metric_key, dimension, dimension2, value, note) values ('HQ', 'Q1FY25', 'recruitment_index', 'Time to Hire (TTH)', 'weighted', 0.16, 'Avg 48 days to fulfil approved MRFs');
insert into detail_metrics (entity_id, period_id, metric_key, dimension, dimension2, value, note) values ('HQ', 'Q1FY25', 'recruitment_index', 'MRF Fulfilment Rate', 'weight', 0.2, null);
insert into detail_metrics (entity_id, period_id, metric_key, dimension, dimension2, value, note) values ('HQ', 'Q1FY25', 'recruitment_index', 'MRF Fulfilment Rate', 'score', null, '3 / 5');
insert into detail_metrics (entity_id, period_id, metric_key, dimension, dimension2, value, note) values ('HQ', 'Q1FY25', 'recruitment_index', 'MRF Fulfilment Rate', 'weighted', 0.12, '3 of 5 approved MRFs closed within 75 days');
insert into detail_metrics (entity_id, period_id, metric_key, dimension, dimension2, value, note) values ('HQ', 'Q1FY25', 'recruitment_index', 'Quality of Hire', 'weight', 0.4, null);
insert into detail_metrics (entity_id, period_id, metric_key, dimension, dimension2, value, note) values ('HQ', 'Q1FY25', 'recruitment_index', 'Quality of Hire', 'score', null, '7 / 8');
insert into detail_metrics (entity_id, period_id, metric_key, dimension, dimension2, value, note) values ('HQ', 'Q1FY25', 'recruitment_index', 'Quality of Hire', 'weighted', 0.35, '7 confirmed of 8 hires');
insert into detail_metrics (entity_id, period_id, metric_key, dimension, dimension2, value, note) values ('HQ', 'Q1FY25', 'recruitment_index', 'Offer Acceptance Rate', 'weight', 0.2, null);
insert into detail_metrics (entity_id, period_id, metric_key, dimension, dimension2, value, note) values ('HQ', 'Q1FY25', 'recruitment_index', 'Offer Acceptance Rate', 'score', null, '8 / 12');
insert into detail_metrics (entity_id, period_id, metric_key, dimension, dimension2, value, note) values ('HQ', 'Q1FY25', 'recruitment_index', 'Offer Acceptance Rate', 'weighted', 0.1333, '8 report-for-duty of 12 offers made');
insert into detail_metrics (entity_id, period_id, metric_key, dimension, dimension2, value, note) values ('HQ', 'Q2FY25', 'recruitment_index', 'Time to Hire (TTH)', 'weight', 0.2, null);
insert into detail_metrics (entity_id, period_id, metric_key, dimension, dimension2, value, note) values ('HQ', 'Q2FY25', 'recruitment_index', 'Time to Hire (TTH)', 'score', null, '4 / 5');
insert into detail_metrics (entity_id, period_id, metric_key, dimension, dimension2, value, note) values ('HQ', 'Q2FY25', 'recruitment_index', 'Time to Hire (TTH)', 'weighted', 0.16, 'Avg 45 days to fulfil approved MRFs');
insert into detail_metrics (entity_id, period_id, metric_key, dimension, dimension2, value, note) values ('HQ', 'Q2FY25', 'recruitment_index', 'MRF Fulfilment Rate', 'weight', 0.2, null);
insert into detail_metrics (entity_id, period_id, metric_key, dimension, dimension2, value, note) values ('HQ', 'Q2FY25', 'recruitment_index', 'MRF Fulfilment Rate', 'score', null, '4 / 5');
insert into detail_metrics (entity_id, period_id, metric_key, dimension, dimension2, value, note) values ('HQ', 'Q2FY25', 'recruitment_index', 'MRF Fulfilment Rate', 'weighted', 0.16, '4 of 5 approved MRFs closed within 75 days');
insert into detail_metrics (entity_id, period_id, metric_key, dimension, dimension2, value, note) values ('HQ', 'Q2FY25', 'recruitment_index', 'Quality of Hire', 'weight', 0.4, null);
insert into detail_metrics (entity_id, period_id, metric_key, dimension, dimension2, value, note) values ('HQ', 'Q2FY25', 'recruitment_index', 'Quality of Hire', 'score', null, '7 / 8');
insert into detail_metrics (entity_id, period_id, metric_key, dimension, dimension2, value, note) values ('HQ', 'Q2FY25', 'recruitment_index', 'Quality of Hire', 'weighted', 0.35, '7 confirmed of 8 hires');
insert into detail_metrics (entity_id, period_id, metric_key, dimension, dimension2, value, note) values ('HQ', 'Q2FY25', 'recruitment_index', 'Offer Acceptance Rate', 'weight', 0.2, null);
insert into detail_metrics (entity_id, period_id, metric_key, dimension, dimension2, value, note) values ('HQ', 'Q2FY25', 'recruitment_index', 'Offer Acceptance Rate', 'score', null, '9 / 12');
insert into detail_metrics (entity_id, period_id, metric_key, dimension, dimension2, value, note) values ('HQ', 'Q2FY25', 'recruitment_index', 'Offer Acceptance Rate', 'weighted', 0.15, '9 report-for-duty of 12 offers made');
insert into detail_metrics (entity_id, period_id, metric_key, dimension, dimension2, value, note) values ('HQ', 'Q3FY25', 'recruitment_index', 'Time to Hire (TTH)', 'weight', 0.2, null);
insert into detail_metrics (entity_id, period_id, metric_key, dimension, dimension2, value, note) values ('HQ', 'Q3FY25', 'recruitment_index', 'Time to Hire (TTH)', 'score', null, '4 / 5');
insert into detail_metrics (entity_id, period_id, metric_key, dimension, dimension2, value, note) values ('HQ', 'Q3FY25', 'recruitment_index', 'Time to Hire (TTH)', 'weighted', 0.16, 'Avg 44 days to fulfil approved MRFs');
insert into detail_metrics (entity_id, period_id, metric_key, dimension, dimension2, value, note) values ('HQ', 'Q3FY25', 'recruitment_index', 'MRF Fulfilment Rate', 'weight', 0.2, null);
insert into detail_metrics (entity_id, period_id, metric_key, dimension, dimension2, value, note) values ('HQ', 'Q3FY25', 'recruitment_index', 'MRF Fulfilment Rate', 'score', null, '4 / 5');
insert into detail_metrics (entity_id, period_id, metric_key, dimension, dimension2, value, note) values ('HQ', 'Q3FY25', 'recruitment_index', 'MRF Fulfilment Rate', 'weighted', 0.16, '4 of 5 approved MRFs closed within 75 days');
insert into detail_metrics (entity_id, period_id, metric_key, dimension, dimension2, value, note) values ('HQ', 'Q3FY25', 'recruitment_index', 'Quality of Hire', 'weight', 0.4, null);
insert into detail_metrics (entity_id, period_id, metric_key, dimension, dimension2, value, note) values ('HQ', 'Q3FY25', 'recruitment_index', 'Quality of Hire', 'score', null, '8 / 8');
insert into detail_metrics (entity_id, period_id, metric_key, dimension, dimension2, value, note) values ('HQ', 'Q3FY25', 'recruitment_index', 'Quality of Hire', 'weighted', 0.4, '8 confirmed of 8 hires');
insert into detail_metrics (entity_id, period_id, metric_key, dimension, dimension2, value, note) values ('HQ', 'Q3FY25', 'recruitment_index', 'Offer Acceptance Rate', 'weight', 0.2, null);
insert into detail_metrics (entity_id, period_id, metric_key, dimension, dimension2, value, note) values ('HQ', 'Q3FY25', 'recruitment_index', 'Offer Acceptance Rate', 'score', null, '9 / 12');
insert into detail_metrics (entity_id, period_id, metric_key, dimension, dimension2, value, note) values ('HQ', 'Q3FY25', 'recruitment_index', 'Offer Acceptance Rate', 'weighted', 0.15, '9 report-for-duty of 12 offers made');
insert into detail_metrics (entity_id, period_id, metric_key, dimension, dimension2, value, note) values ('HQ', 'Q4FY25', 'recruitment_index', 'Time to Hire (TTH)', 'weight', 0.2, null);
insert into detail_metrics (entity_id, period_id, metric_key, dimension, dimension2, value, note) values ('HQ', 'Q4FY25', 'recruitment_index', 'Time to Hire (TTH)', 'score', null, '5 / 5');
insert into detail_metrics (entity_id, period_id, metric_key, dimension, dimension2, value, note) values ('HQ', 'Q4FY25', 'recruitment_index', 'Time to Hire (TTH)', 'weighted', 0.2, 'Avg 40 days to fulfil approved MRFs');
insert into detail_metrics (entity_id, period_id, metric_key, dimension, dimension2, value, note) values ('HQ', 'Q4FY25', 'recruitment_index', 'MRF Fulfilment Rate', 'weight', 0.2, null);
insert into detail_metrics (entity_id, period_id, metric_key, dimension, dimension2, value, note) values ('HQ', 'Q4FY25', 'recruitment_index', 'MRF Fulfilment Rate', 'score', null, '4 / 5');
insert into detail_metrics (entity_id, period_id, metric_key, dimension, dimension2, value, note) values ('HQ', 'Q4FY25', 'recruitment_index', 'MRF Fulfilment Rate', 'weighted', 0.16, '4 of 5 approved MRFs closed within 75 days');
insert into detail_metrics (entity_id, period_id, metric_key, dimension, dimension2, value, note) values ('HQ', 'Q4FY25', 'recruitment_index', 'Quality of Hire', 'weight', 0.4, null);
insert into detail_metrics (entity_id, period_id, metric_key, dimension, dimension2, value, note) values ('HQ', 'Q4FY25', 'recruitment_index', 'Quality of Hire', 'score', null, '8 / 8');
insert into detail_metrics (entity_id, period_id, metric_key, dimension, dimension2, value, note) values ('HQ', 'Q4FY25', 'recruitment_index', 'Quality of Hire', 'weighted', 0.4, '8 confirmed of 8 hires');
insert into detail_metrics (entity_id, period_id, metric_key, dimension, dimension2, value, note) values ('HQ', 'Q4FY25', 'recruitment_index', 'Offer Acceptance Rate', 'weight', 0.2, null);
insert into detail_metrics (entity_id, period_id, metric_key, dimension, dimension2, value, note) values ('HQ', 'Q4FY25', 'recruitment_index', 'Offer Acceptance Rate', 'score', null, '10 / 12');
insert into detail_metrics (entity_id, period_id, metric_key, dimension, dimension2, value, note) values ('HQ', 'Q4FY25', 'recruitment_index', 'Offer Acceptance Rate', 'weighted', 0.1667, '10 report-for-duty of 12 offers made');
insert into detail_metrics (entity_id, period_id, metric_key, dimension, dimension2, value, note) values ('HQ', 'Q1FY26', 'recruitment_index', 'Time to Hire (TTH)', 'weight', 0.2, null);
insert into detail_metrics (entity_id, period_id, metric_key, dimension, dimension2, value, note) values ('HQ', 'Q1FY26', 'recruitment_index', 'Time to Hire (TTH)', 'score', null, '5 / 5');
insert into detail_metrics (entity_id, period_id, metric_key, dimension, dimension2, value, note) values ('HQ', 'Q1FY26', 'recruitment_index', 'Time to Hire (TTH)', 'weighted', 0.2, 'Avg 42 days to fulfil approved MRFs');
insert into detail_metrics (entity_id, period_id, metric_key, dimension, dimension2, value, note) values ('HQ', 'Q1FY26', 'recruitment_index', 'MRF Fulfilment Rate', 'weight', 0.2, null);
insert into detail_metrics (entity_id, period_id, metric_key, dimension, dimension2, value, note) values ('HQ', 'Q1FY26', 'recruitment_index', 'MRF Fulfilment Rate', 'score', null, '3 / 5');
insert into detail_metrics (entity_id, period_id, metric_key, dimension, dimension2, value, note) values ('HQ', 'Q1FY26', 'recruitment_index', 'MRF Fulfilment Rate', 'weighted', 0.12, '5 of 8 approved MRFs closed within 75 days');
insert into detail_metrics (entity_id, period_id, metric_key, dimension, dimension2, value, note) values ('HQ', 'Q1FY26', 'recruitment_index', 'Quality of Hire', 'weight', 0.4, null);
insert into detail_metrics (entity_id, period_id, metric_key, dimension, dimension2, value, note) values ('HQ', 'Q1FY26', 'recruitment_index', 'Quality of Hire', 'score', null, '8 / 8');
insert into detail_metrics (entity_id, period_id, metric_key, dimension, dimension2, value, note) values ('HQ', 'Q1FY26', 'recruitment_index', 'Quality of Hire', 'weighted', 0.4, '8 confirmed of 8 hires');
insert into detail_metrics (entity_id, period_id, metric_key, dimension, dimension2, value, note) values ('HQ', 'Q1FY26', 'recruitment_index', 'Offer Acceptance Rate', 'weight', 0.2, null);
insert into detail_metrics (entity_id, period_id, metric_key, dimension, dimension2, value, note) values ('HQ', 'Q1FY26', 'recruitment_index', 'Offer Acceptance Rate', 'score', null, '10 / 12');
insert into detail_metrics (entity_id, period_id, metric_key, dimension, dimension2, value, note) values ('HQ', 'Q1FY26', 'recruitment_index', 'Offer Acceptance Rate', 'weighted', 0.1667, '10 report-for-duty of 12 offers made');
insert into detail_metrics (entity_id, period_id, metric_key, dimension, dimension2, value, note) values ('HQ', 'Q1FY25', 'resigned', 'count', '', 6, null);
insert into detail_metrics (entity_id, period_id, metric_key, dimension, dimension2, value, note) values ('HQ', 'Q2FY25', 'resigned', 'count', '', 4, null);
insert into detail_metrics (entity_id, period_id, metric_key, dimension, dimension2, value, note) values ('HQ', 'Q3FY25', 'resigned', 'count', '', 5, null);
insert into detail_metrics (entity_id, period_id, metric_key, dimension, dimension2, value, note) values ('HQ', 'Q4FY25', 'resigned', 'count', '', 3, null);
insert into detail_metrics (entity_id, period_id, metric_key, dimension, dimension2, value, note) values ('HQ', 'Q1FY26', 'resigned', 'count', '', 5, null);
insert into detail_metrics (entity_id, period_id, metric_key, dimension, dimension2, value, note) values ('HQ', 'Q1FY25', 'bumiputera_training', 'pool_identified', '', 135, null);
insert into detail_metrics (entity_id, period_id, metric_key, dimension, dimension2, value, note) values ('HQ', 'Q1FY25', 'bumiputera_training', 'attended_one', '', 30, null);
insert into detail_metrics (entity_id, period_id, metric_key, dimension, dimension2, value, note) values ('HQ', 'Q1FY25', 'bumiputera_training', 'attended_two_plus', '', 2, null);
insert into detail_metrics (entity_id, period_id, metric_key, dimension, dimension2, value, note) values ('HQ', 'Q1FY25', 'bumiputera_training', 'stage', '', null, 'Early stage');
insert into detail_metrics (entity_id, period_id, metric_key, dimension, dimension2, value, note) values ('HQ', 'Q2FY25', 'bumiputera_training', 'pool_identified', '', 138, null);
insert into detail_metrics (entity_id, period_id, metric_key, dimension, dimension2, value, note) values ('HQ', 'Q2FY25', 'bumiputera_training', 'attended_one', '', 65, null);
insert into detail_metrics (entity_id, period_id, metric_key, dimension, dimension2, value, note) values ('HQ', 'Q2FY25', 'bumiputera_training', 'attended_two_plus', '', 6, null);
insert into detail_metrics (entity_id, period_id, metric_key, dimension, dimension2, value, note) values ('HQ', 'Q2FY25', 'bumiputera_training', 'stage', '', null, 'In progress');
insert into detail_metrics (entity_id, period_id, metric_key, dimension, dimension2, value, note) values ('HQ', 'Q3FY25', 'bumiputera_training', 'pool_identified', '', 140, null);
insert into detail_metrics (entity_id, period_id, metric_key, dimension, dimension2, value, note) values ('HQ', 'Q3FY25', 'bumiputera_training', 'attended_one', '', 100, null);
insert into detail_metrics (entity_id, period_id, metric_key, dimension, dimension2, value, note) values ('HQ', 'Q3FY25', 'bumiputera_training', 'attended_two_plus', '', 11, null);
insert into detail_metrics (entity_id, period_id, metric_key, dimension, dimension2, value, note) values ('HQ', 'Q3FY25', 'bumiputera_training', 'stage', '', null, 'In progress');
insert into detail_metrics (entity_id, period_id, metric_key, dimension, dimension2, value, note) values ('HQ', 'Q4FY25', 'bumiputera_training', 'pool_identified', '', 140, null);
insert into detail_metrics (entity_id, period_id, metric_key, dimension, dimension2, value, note) values ('HQ', 'Q4FY25', 'bumiputera_training', 'attended_one', '', 132, null);
insert into detail_metrics (entity_id, period_id, metric_key, dimension, dimension2, value, note) values ('HQ', 'Q4FY25', 'bumiputera_training', 'attended_two_plus', '', 18, null);
insert into detail_metrics (entity_id, period_id, metric_key, dimension, dimension2, value, note) values ('HQ', 'Q4FY25', 'bumiputera_training', 'stage', '', null, 'Completed');
insert into detail_metrics (entity_id, period_id, metric_key, dimension, dimension2, value, note) values ('HQ', 'Q1FY26', 'bumiputera_training', 'pool_identified', '', 152, null);
insert into detail_metrics (entity_id, period_id, metric_key, dimension, dimension2, value, note) values ('HQ', 'Q1FY26', 'bumiputera_training', 'attended_one', '', 33, null);
insert into detail_metrics (entity_id, period_id, metric_key, dimension, dimension2, value, note) values ('HQ', 'Q1FY26', 'bumiputera_training', 'attended_two_plus', '', 1, null);
insert into detail_metrics (entity_id, period_id, metric_key, dimension, dimension2, value, note) values ('HQ', 'Q1FY26', 'bumiputera_training', 'stage', '', null, 'Progress reporting only in Q1 — formal measurement from Q2');
insert into detail_metrics (entity_id, period_id, metric_key, dimension, dimension2, value, note) values ('HQ', 'Q1FY25', 'financial_trend', 'revenue', '', 30.2, null);
insert into detail_metrics (entity_id, period_id, metric_key, dimension, dimension2, value, note) values ('HQ', 'Q1FY25', 'financial_trend', 'pbt', '', 19.8, null);
insert into detail_metrics (entity_id, period_id, metric_key, dimension, dimension2, value, note) values ('HQ', 'Q1FY25', 'financial_trend', 'cir', '', 61.4, null);
insert into detail_metrics (entity_id, period_id, metric_key, dimension, dimension2, value, note) values ('HQ', 'Q1FY25', 'financial_trend', 'net_margin', '', 41.2, null);
insert into detail_metrics (entity_id, period_id, metric_key, dimension, dimension2, value, note) values ('HQ', 'Q2FY25', 'financial_trend', 'revenue', '', 37.9, null);
insert into detail_metrics (entity_id, period_id, metric_key, dimension, dimension2, value, note) values ('HQ', 'Q2FY25', 'financial_trend', 'pbt', '', 23.1, null);
insert into detail_metrics (entity_id, period_id, metric_key, dimension, dimension2, value, note) values ('HQ', 'Q2FY25', 'financial_trend', 'cir', '', 57.8, null);
insert into detail_metrics (entity_id, period_id, metric_key, dimension, dimension2, value, note) values ('HQ', 'Q2FY25', 'financial_trend', 'net_margin', '', 43.9, null);
insert into detail_metrics (entity_id, period_id, metric_key, dimension, dimension2, value, note) values ('HQ', 'Q3FY25', 'financial_trend', 'revenue', '', 38.6, null);
insert into detail_metrics (entity_id, period_id, metric_key, dimension, dimension2, value, note) values ('HQ', 'Q3FY25', 'financial_trend', 'pbt', '', 24.4, null);
insert into detail_metrics (entity_id, period_id, metric_key, dimension, dimension2, value, note) values ('HQ', 'Q3FY25', 'financial_trend', 'cir', '', 55.1, null);
insert into detail_metrics (entity_id, period_id, metric_key, dimension, dimension2, value, note) values ('HQ', 'Q3FY25', 'financial_trend', 'net_margin', '', 45.7, null);
insert into detail_metrics (entity_id, period_id, metric_key, dimension, dimension2, value, note) values ('HQ', 'Q4FY25', 'financial_trend', 'revenue', '', 48.1, null);
insert into detail_metrics (entity_id, period_id, metric_key, dimension, dimension2, value, note) values ('HQ', 'Q4FY25', 'financial_trend', 'pbt', '', 33.6, null);
insert into detail_metrics (entity_id, period_id, metric_key, dimension, dimension2, value, note) values ('HQ', 'Q4FY25', 'financial_trend', 'cir', '', 49.6, null);
insert into detail_metrics (entity_id, period_id, metric_key, dimension, dimension2, value, note) values ('HQ', 'Q4FY25', 'financial_trend', 'net_margin', '', 49.8, null);
insert into detail_metrics (entity_id, period_id, metric_key, dimension, dimension2, value, note) values ('HQ', 'Q1FY26', 'financial_trend', 'revenue', '', 39.8, null);
insert into detail_metrics (entity_id, period_id, metric_key, dimension, dimension2, value, note) values ('HQ', 'Q1FY26', 'financial_trend', 'pbt', '', 27.5, null);
insert into detail_metrics (entity_id, period_id, metric_key, dimension, dimension2, value, note) values ('HQ', 'Q1FY26', 'financial_trend', 'cir', '', 44.2, null);
insert into detail_metrics (entity_id, period_id, metric_key, dimension, dimension2, value, note) values ('HQ', 'Q1FY26', 'financial_trend', 'net_margin', '', 52.1, null);
insert into detail_metrics (entity_id, period_id, metric_key, dimension, dimension2, value, note) values ('HQ', 'Q1FY26', 'actual_vs_budget', 'Revenue / Total Income', 'actual', 45.2, null);
insert into detail_metrics (entity_id, period_id, metric_key, dimension, dimension2, value, note) values ('HQ', 'Q1FY26', 'actual_vs_budget', 'Revenue / Total Income', 'budget', 40.6, null);
insert into detail_metrics (entity_id, period_id, metric_key, dimension, dimension2, value, note) values ('HQ', 'Q1FY26', 'actual_vs_budget', 'Revenue / Total Income', 'py', 42.0, null);
insert into detail_metrics (entity_id, period_id, metric_key, dimension, dimension2, value, note) values ('HQ', 'Q1FY26', 'actual_vs_budget', 'Staff Cost', 'actual', -14.9, null);
insert into detail_metrics (entity_id, period_id, metric_key, dimension, dimension2, value, note) values ('HQ', 'Q1FY26', 'actual_vs_budget', 'Staff Cost', 'budget', -15.6, null);
insert into detail_metrics (entity_id, period_id, metric_key, dimension, dimension2, value, note) values ('HQ', 'Q1FY26', 'actual_vs_budget', 'Staff Cost', 'py', -14.1, null);
insert into detail_metrics (entity_id, period_id, metric_key, dimension, dimension2, value, note) values ('HQ', 'Q1FY26', 'actual_vs_budget', 'Admin & Operating Cost', 'actual', -2.1, null);
insert into detail_metrics (entity_id, period_id, metric_key, dimension, dimension2, value, note) values ('HQ', 'Q1FY26', 'actual_vs_budget', 'Admin & Operating Cost', 'budget', -2.5, null);
insert into detail_metrics (entity_id, period_id, metric_key, dimension, dimension2, value, note) values ('HQ', 'Q1FY26', 'actual_vs_budget', 'Admin & Operating Cost', 'py', -2.0, null);
insert into detail_metrics (entity_id, period_id, metric_key, dimension, dimension2, value, note) values ('HQ', 'Q1FY26', 'actual_vs_budget', 'Total Cost', 'actual', -19.1, null);
insert into detail_metrics (entity_id, period_id, metric_key, dimension, dimension2, value, note) values ('HQ', 'Q1FY26', 'actual_vs_budget', 'Total Cost', 'budget', -20.3, null);
insert into detail_metrics (entity_id, period_id, metric_key, dimension, dimension2, value, note) values ('HQ', 'Q1FY26', 'actual_vs_budget', 'Total Cost', 'py', -18.4, null);
insert into detail_metrics (entity_id, period_id, metric_key, dimension, dimension2, value, note) values ('HQ', 'Q1FY26', 'actual_vs_budget', 'Profit Before Tax', 'actual', 27.5, null);
insert into detail_metrics (entity_id, period_id, metric_key, dimension, dimension2, value, note) values ('HQ', 'Q1FY26', 'actual_vs_budget', 'Profit Before Tax', 'budget', 21.6, null);
insert into detail_metrics (entity_id, period_id, metric_key, dimension, dimension2, value, note) values ('HQ', 'Q1FY26', 'actual_vs_budget', 'Profit Before Tax', 'py', 24.9, null);
insert into detail_metrics (entity_id, period_id, metric_key, dimension, dimension2, value, note) values ('HQ', 'Q1FY26', 'actual_vs_budget', 'Net Profit Margin (%)', 'actual', 52.1, null);
insert into detail_metrics (entity_id, period_id, metric_key, dimension, dimension2, value, note) values ('HQ', 'Q1FY26', 'actual_vs_budget', 'Net Profit Margin (%)', 'budget', 46.3, null);
insert into detail_metrics (entity_id, period_id, metric_key, dimension, dimension2, value, note) values ('HQ', 'Q1FY26', 'actual_vs_budget', 'Net Profit Margin (%)', 'py', 49.5, null);
insert into detail_metrics (entity_id, period_id, metric_key, dimension, dimension2, value, note) values ('HQ', 'Q1FY26', 'variance_commentary', 'revenue', '', null, 'Higher fee income from managed-entity mandates, partly offset by softer advisory revenue.');
insert into detail_metrics (entity_id, period_id, metric_key, dimension, dimension2, value, note) values ('HQ', 'Q1FY26', 'variance_commentary', 'staffCost', '', null, 'Lower than budget mainly on headcount phasing — 3 approved positions still in recruitment.');
insert into detail_metrics (entity_id, period_id, metric_key, dimension, dimension2, value, note) values ('HQ', 'Q1FY26', 'variance_commentary', 'adminCost', '', null, 'Computer system and corporate communication spend tracked below budget for the quarter.');
insert into detail_metrics (entity_id, period_id, metric_key, dimension, dimension2, value, note) values ('HQ', 'Q1FY26', 'variance_commentary', 'pbt', '', null, 'PBT ahead of budget on the back of stronger fee income and disciplined cost control.');
insert into detail_metrics (entity_id, period_id, metric_key, dimension, dimension2, value, note) values ('HQ', 'Q1FY26', 'variance_commentary', 'outlook', '', null, 'Management expects the favourable variance to normalise by Q3 as planned hiring completes.');
insert into detail_metrics (entity_id, period_id, metric_key, dimension, dimension2, value, note) values ('HQ', 'Q1FY25', 'balance_sheet', 'shareholders_fund', '', 560.1, null);
insert into detail_metrics (entity_id, period_id, metric_key, dimension, dimension2, value, note) values ('HQ', 'Q1FY25', 'balance_sheet', 'total_liabilities', '', 38.9, null);
insert into detail_metrics (entity_id, period_id, metric_key, dimension, dimension2, value, note) values ('HQ', 'Q2FY25', 'balance_sheet', 'shareholders_fund', '', 578.4, null);
insert into detail_metrics (entity_id, period_id, metric_key, dimension, dimension2, value, note) values ('HQ', 'Q2FY25', 'balance_sheet', 'total_liabilities', '', 36.2, null);
insert into detail_metrics (entity_id, period_id, metric_key, dimension, dimension2, value, note) values ('HQ', 'Q3FY25', 'balance_sheet', 'shareholders_fund', '', 601.7, null);
insert into detail_metrics (entity_id, period_id, metric_key, dimension, dimension2, value, note) values ('HQ', 'Q3FY25', 'balance_sheet', 'total_liabilities', '', 34.0, null);
insert into detail_metrics (entity_id, period_id, metric_key, dimension, dimension2, value, note) values ('HQ', 'Q4FY25', 'balance_sheet', 'shareholders_fund', '', 631.0, null);
insert into detail_metrics (entity_id, period_id, metric_key, dimension, dimension2, value, note) values ('HQ', 'Q4FY25', 'balance_sheet', 'total_liabilities', '', 33.5, null);
insert into detail_metrics (entity_id, period_id, metric_key, dimension, dimension2, value, note) values ('HQ', 'Q1FY26', 'balance_sheet', 'shareholders_fund', '', 654.6, null);
insert into detail_metrics (entity_id, period_id, metric_key, dimension, dimension2, value, note) values ('HQ', 'Q1FY26', 'balance_sheet', 'total_liabilities', '', 34.9, null);
insert into detail_metrics (entity_id, period_id, metric_key, dimension, dimension2, value, note) values ('HQ', 'Q1FY26', 'balance_sheet_lines', 'Cash & Equivalents', 'asset', 41.2, null);
insert into detail_metrics (entity_id, period_id, metric_key, dimension, dimension2, value, note) values ('HQ', 'Q1FY26', 'balance_sheet_lines', 'Fixed Income Investments', 'asset', 612.4, null);
insert into detail_metrics (entity_id, period_id, metric_key, dimension, dimension2, value, note) values ('HQ', 'Q1FY26', 'balance_sheet_lines', 'Receivables & Others', 'asset', 22.8, null);
insert into detail_metrics (entity_id, period_id, metric_key, dimension, dimension2, value, note) values ('HQ', 'Q1FY26', 'balance_sheet_lines', 'Fixed Assets (Net)', 'asset', 13.1, null);
insert into detail_metrics (entity_id, period_id, metric_key, dimension, dimension2, value, note) values ('HQ', 'Q1FY26', 'balance_sheet_lines', 'Trade & Other Payables', 'liability', 21.7, null);
insert into detail_metrics (entity_id, period_id, metric_key, dimension, dimension2, value, note) values ('HQ', 'Q1FY26', 'balance_sheet_lines', 'Deferred Revenue', 'liability', 3.4, null);
insert into detail_metrics (entity_id, period_id, metric_key, dimension, dimension2, value, note) values ('HQ', 'Q1FY26', 'balance_sheet_lines', 'Other Liabilities', 'liability', 9.8, null);
insert into detail_metrics (entity_id, period_id, metric_key, dimension, dimension2, value, note) values ('HQ', 'Q1FY26', 'managed_entity_ratings', 'SJPP', 'met', 4, null);
insert into detail_metrics (entity_id, period_id, metric_key, dimension, dimension2, value, note) values ('HQ', 'Q1FY26', 'managed_entity_ratings', 'SJPP', 'not_met', 1, null);
insert into detail_metrics (entity_id, period_id, metric_key, dimension, dimension2, value, note) values ('HQ', 'Q1FY26', 'managed_entity_ratings', 'SJPP', 'not_measured', 0, null);
insert into detail_metrics (entity_id, period_id, metric_key, dimension, dimension2, value, note) values ('HQ', 'Q1FY26', 'managed_entity_ratings', 'SJPP', 'achievement', 82, 'On track');
insert into detail_metrics (entity_id, period_id, metric_key, dimension, dimension2, value, note) values ('HQ', 'Q1FY26', 'managed_entity_ratings', 'SJKP', 'met', 3, null);
insert into detail_metrics (entity_id, period_id, metric_key, dimension, dimension2, value, note) values ('HQ', 'Q1FY26', 'managed_entity_ratings', 'SJKP', 'not_met', 2, null);
insert into detail_metrics (entity_id, period_id, metric_key, dimension, dimension2, value, note) values ('HQ', 'Q1FY26', 'managed_entity_ratings', 'SJKP', 'not_measured', 0, null);
insert into detail_metrics (entity_id, period_id, metric_key, dimension, dimension2, value, note) values ('HQ', 'Q1FY26', 'managed_entity_ratings', 'SJKP', 'achievement', 61, 'Attention');
insert into detail_metrics (entity_id, period_id, metric_key, dimension, dimension2, value, note) values ('HQ', 'Q1FY26', 'managed_entity_ratings', 'DanaInfra', 'met', 5, null);
insert into detail_metrics (entity_id, period_id, metric_key, dimension, dimension2, value, note) values ('HQ', 'Q1FY26', 'managed_entity_ratings', 'DanaInfra', 'not_met', 0, null);
insert into detail_metrics (entity_id, period_id, metric_key, dimension, dimension2, value, note) values ('HQ', 'Q1FY26', 'managed_entity_ratings', 'DanaInfra', 'not_measured', 0, null);
insert into detail_metrics (entity_id, period_id, metric_key, dimension, dimension2, value, note) values ('HQ', 'Q1FY26', 'managed_entity_ratings', 'DanaInfra', 'achievement', 97, 'On track');
insert into detail_metrics (entity_id, period_id, metric_key, dimension, dimension2, value, note) values ('HQ', 'Q1FY26', 'managed_entity_ratings', 'DanaHarta', 'met', 3, null);
insert into detail_metrics (entity_id, period_id, metric_key, dimension, dimension2, value, note) values ('HQ', 'Q1FY26', 'managed_entity_ratings', 'DanaHarta', 'not_met', 1, null);
insert into detail_metrics (entity_id, period_id, metric_key, dimension, dimension2, value, note) values ('HQ', 'Q1FY26', 'managed_entity_ratings', 'DanaHarta', 'not_measured', 1, null);
insert into detail_metrics (entity_id, period_id, metric_key, dimension, dimension2, value, note) values ('HQ', 'Q1FY26', 'managed_entity_ratings', 'DanaHarta', 'achievement', 74, 'On track');
insert into detail_metrics (entity_id, period_id, metric_key, dimension, dimension2, value, note) values ('HQ', 'Q1FY26', 'managed_entity_ratings', 'GovCo', 'met', 2, null);
insert into detail_metrics (entity_id, period_id, metric_key, dimension, dimension2, value, note) values ('HQ', 'Q1FY26', 'managed_entity_ratings', 'GovCo', 'not_met', 1, null);
insert into detail_metrics (entity_id, period_id, metric_key, dimension, dimension2, value, note) values ('HQ', 'Q1FY26', 'managed_entity_ratings', 'GovCo', 'not_measured', 2, null);
insert into detail_metrics (entity_id, period_id, metric_key, dimension, dimension2, value, note) values ('HQ', 'Q1FY26', 'managed_entity_ratings', 'GovCo', 'achievement', 63, 'Attention');
insert into detail_metrics (entity_id, period_id, metric_key, dimension, dimension2, value, note) values ('HQ', 'Q1FY26', 'bumiputera_procurement', 'Administration & Security', 'fy_target', 0.25, null);
insert into detail_metrics (entity_id, period_id, metric_key, dimension, dimension2, value, note) values ('HQ', 'Q1FY26', 'bumiputera_procurement', 'Administration & Security', 'ytd_actual', 0.130303, null);
insert into detail_metrics (entity_id, period_id, metric_key, dimension, dimension2, value, note) values ('HQ', 'Q1FY26', 'bumiputera_procurement', 'Corporate Communications', 'fy_target', 0.25, null);
insert into detail_metrics (entity_id, period_id, metric_key, dimension, dimension2, value, note) values ('HQ', 'Q1FY26', 'bumiputera_procurement', 'Corporate Communications', 'ytd_actual', 0.063298, null);
insert into detail_metrics (entity_id, period_id, metric_key, dimension, dimension2, value, note) values ('HQ', 'Q1FY26', 'bumiputera_procurement', 'Information Technology', 'fy_target', 2.0, null);
insert into detail_metrics (entity_id, period_id, metric_key, dimension, dimension2, value, note) values ('HQ', 'Q1FY26', 'bumiputera_procurement', 'Information Technology', 'ytd_actual', 0.833101, null);

insert into detail_records (id, entity_id, period_id, record_type, label, category, value_num, value_num2, text_note, flag) values ('SEED-0001', 'HQ', 'Q1FY26', 'process_initiative', 'eGLS Refresh Project', 'Q1-Q4', null, null, 'In Progress | Finalise design documents; development in progress', null);
insert into detail_records (id, entity_id, period_id, record_type, label, category, value_num, value_num2, text_note, flag) values ('SEED-0002', 'HQ', 'Q1FY26', 'process_initiative', 'Migration to New Email System', 'Q1-Q3', null, null, 'In Progress | Submit draft Future State Report in Apr', null);
insert into detail_records (id, entity_id, period_id, record_type, label, category, value_num, value_num2, text_note, flag) values ('SEED-0003', 'HQ', 'Q1FY26', 'process_initiative', 'Group / ME Performance Dashboard (Pilot)', 'Q1-Q3', null, null, 'In Progress | Requirements gathering with stakeholders', null);
insert into detail_records (id, entity_id, period_id, record_type, label, category, value_num, value_num2, text_note, flag) values ('SEED-0004', 'HQ', 'Q1FY26', 'tech_initiative', 'UPS Refresh Project', 'Q2-Q3', null, null, 'Planned | Memo approval', null);
insert into detail_records (id, entity_id, period_id, record_type, label, category, value_num, value_num2, text_note, flag) values ('SEED-0005', 'HQ', 'Q1FY26', 'tech_initiative', 'AI Infrastructure Project', 'Q1-Q3', null, null, 'In Progress | RFQ issuance', null);
insert into detail_records (id, entity_id, period_id, record_type, label, category, value_num, value_num2, text_note, flag) values ('SEED-0006', 'HQ', 'Q1FY26', 'tech_initiative', 'Server Refresh Project', 'Q1-Q4', null, null, 'In Progress | RFQ issuance', null);
insert into detail_records (id, entity_id, period_id, record_type, label, category, value_num, value_num2, text_note, flag) values ('SEED-0007', 'HQ', 'Q1FY26', 'tech_initiative', 'Secondary Internet Lease Line', 'Q2-Q3', null, null, 'Planned | Memo approval', null);
insert into detail_records (id, entity_id, period_id, record_type, label, category, value_num, value_num2, text_note, flag) values ('SEED-0008', 'HQ', 'Q1FY26', 'tech_initiative', 'Single Sign-On for Internal Apps', 'Q2-Q4', null, null, 'Planned | RFI finalisation', null);
insert into detail_records (id, entity_id, period_id, record_type, label, category, value_num, value_num2, text_note, flag) values ('SEED-0009', 'HQ', 'Q1FY26', 'tech_initiative', 'Phishing Simulation Subscription', 'Q1-Q2', null, null, 'In Progress | Evaluation', null);
insert into detail_records (id, entity_id, period_id, record_type, label, category, value_num, value_num2, text_note, flag) values ('SEED-0010', 'HQ', 'Q1FY26', 'time_charter_compliance', 'Client Enquiries', '2 working days', null, null, 'On Track', null);
insert into detail_records (id, entity_id, period_id, record_type, label, category, value_num, value_num2, text_note, flag) values ('SEED-0011', 'HQ', 'Q1FY26', 'time_charter_compliance', 'Management Requests', '5 working days', null, null, 'On Track', null);
insert into detail_records (id, entity_id, period_id, record_type, label, category, value_num, value_num2, text_note, flag) values ('SEED-0012', 'HQ', 'Q1FY26', 'time_charter_compliance', 'Stakeholder Reporting', '3 working days', null, null, 'Monitoring', null);
insert into detail_records (id, entity_id, period_id, record_type, label, category, value_num, value_num2, text_note, flag) values ('SEED-0013', 'HQ', 'Q1FY26', 'time_charter_compliance', 'Complaint Resolution', '14 working days', null, null, 'On Track', null);
insert into detail_records (id, entity_id, period_id, record_type, label, category, value_num, value_num2, text_note, flag) values ('SEED-0014', 'HQ', 'Q1FY26', 'governance_index', 'Audit closure against observations due', null, 0.85, null, 'Progress reporting only in Q1', null);
insert into detail_records (id, entity_id, period_id, record_type, label, category, value_num, value_num2, text_note, flag) values ('SEED-0015', 'HQ', 'Q1FY26', 'governance_index', 'Satisfactory rating (>=3) in audit findings', null, 3.0, null, 'Progress reporting only in Q1', null);
insert into detail_records (id, entity_id, period_id, record_type, label, category, value_num, value_num2, text_note, flag) values ('SEED-0016', 'HQ', 'Q1FY26', 'governance_index', 'Implementation of Risk Action Plan within timeline', null, 0.8, null, 'Progress reporting only in Q1', null);
insert into detail_records (id, entity_id, period_id, record_type, label, category, value_num, value_num2, text_note, flag) values ('SEED-0017', 'HQ', 'Q1FY26', 'governance_index', 'Completion of Anti-Corruption Strategy initiatives', null, 0.8, null, 'No initiatives due in Q1', null);
insert into detail_records (id, entity_id, period_id, record_type, label, category, value_num, value_num2, text_note, flag) values ('SEED-0018', 'HQ', 'Q1FY26', 'governance_index', 'Zero cases under MACC', null, 0, null, '0 cases recorded to date', null);
insert into detail_records (id, entity_id, period_id, record_type, label, category, value_num, value_num2, text_note, flag) values ('SEED-0019', 'HQ', 'Q1FY26', 'related_party_txn', 'Management fee — SJPP', 'SJPP', 31.9, null, 'Management Fee Income | Approved Basis', true);
insert into detail_records (id, entity_id, period_id, record_type, label, category, value_num, value_num2, text_note, flag) values ('SEED-0020', 'HQ', 'Q1FY26', 'related_party_txn', 'Management fee — SJKP', 'SJKP', 3.1, null, 'Management Fee Income | Approved Basis', true);
insert into detail_records (id, entity_id, period_id, record_type, label, category, value_num, value_num2, text_note, flag) values ('SEED-0021', 'HQ', 'Q1FY26', 'related_party_txn', 'Management fee — DanaInfra', 'DanaInfra', 3.0, null, 'Management Fee Income | Approved Basis', true);
insert into detail_records (id, entity_id, period_id, record_type, label, category, value_num, value_num2, text_note, flag) values ('SEED-0022', 'HQ', 'Q1FY26', 'related_party_txn', 'Advisory / outsourcing', 'DanaHarta', 0.1, null, 'Professional Services | Market Rate', true);
insert into detail_records (id, entity_id, period_id, record_type, label, category, value_num, value_num2, text_note, flag) values ('SEED-0023', 'HQ', 'Q1FY26', 'related_party_txn', 'Management fee — GovCo', 'GovCo', 0.1, null, 'Management Fee Income | Approved Basis', false);
insert into detail_records (id, entity_id, period_id, record_type, label, category, value_num, value_num2, text_note, flag) values ('SEED-0024', 'HQ', 'Q1FY26', 'client_satisfaction', 'External Client Satisfaction', null, 4.7, null, 'Bi-annual client survey — next round scheduled Q2 FY2026', null);

-- People Development Programme (CP009) — not measured in Q1, progress-only reporting.
-- category is one of PEOPLE_DEV_SUB_AREAS in src/lib/details.tsx; text_note packs
-- "start|end|status|detail" the same way CP009's own add/edit form writes it.
insert into detail_records (id, entity_id, period_id, record_type, label, category, value_num, value_num2, text_note, flag) values ('SEED-0025', 'HQ', 'Q1FY26', 'people_dev_programme', 'Continuation of LDPs', 'Talent Management', null, null, 'Apr ''26|Dec ''26|In Progress|Continuation of 2025 LDPs; implementation of planned modules per the approved programme plan. Total sessions in 2026: 23 — ELDP 3 modules x 3 sessions, MLDP 3 modules x 4 sessions, ISLDP 2 modules x 1 session. Status: ELDP programmes commence in April (15–16, 22–23, 29–30 Apr); MLDP programmes commence in May 2026.', null);
insert into detail_records (id, entity_id, period_id, record_type, label, category, value_num, value_num2, text_note, flag) values ('SEED-0026', 'HQ', 'Q1FY26', 'people_dev_programme', 'Introduction of Talent Pool Development Programme', 'Talent Management', null, null, 'Apr ''26|Jun ''26|In Progress|Phases: identify talent pool; talent career-aspiration conversations; external assessment of talents to reaffirm the 4Q dimension assessment by HOD; establish Talent Success Profile and map to each talent''s profile; develop programmes for talents to go through; brief/communicate to talents. Status: 3rd 4Q assessment result to be presented to the People Panel to finalise the talent pool in the 2nd week of May, followed by career-aspiration sessions with Talents. External assessment to be conducted to identify development areas using the Talent Success Profile to address the gap.', null);
insert into detail_records (id, entity_id, period_id, record_type, label, category, value_num, value_num2, text_note, flag) values ('SEED-0027', 'HQ', 'Q1FY26', 'people_dev_programme', 'Data Analytics Skill Development', 'Talent Management', null, null, 'May ''26|Sep ''26|Planned|Source suitable providers able to conduct programmes; obtain input from HODs to identify champion; obtain input from HODs on suitable module; roll out programme. Status: To commence in May 2026.', null);
insert into detail_records (id, entity_id, period_id, record_type, label, category, value_num, value_num2, text_note, flag) values ('SEED-0028', 'HQ', 'Q1FY26', 'people_dev_programme', 'Completion of JE for all jobs', 'Talent Management', null, null, 'Jan ''26|Dec ''26|In Progress|Jan–May: ensure sourced suitable provider can match requirements in JE; Jun–Dec: engagement with vendor to complete first round of JE for identified anchoring roles. Status: Received four proposals from vendors based on the RFP issued; HRD is reviewing and evaluating submissions against the outlined evaluation criteria, including necessary clarifications, expected to take approximately 2–3 weeks. Once finalised, HRD will submit a proposal for approval on the vendor selected to conduct the Job Evaluation.', null);
insert into detail_records (id, entity_id, period_id, record_type, label, category, value_num, value_num2, text_note, flag) values ('SEED-0029', 'HQ', 'Q1FY26', 'people_dev_programme', 'Establishment of cross-functionality mobility programme', 'Succession Management', null, null, 'Oct ''26|Dec ''26|Planned|Develop programme framework; propose the development journey; obtain approval on programme. Status: To commence in Oct 2026.', null);
insert into detail_records (id, entity_id, period_id, record_type, label, category, value_num, value_num2, text_note, flag) values ('SEED-0030', 'HQ', 'Q1FY26', 'people_dev_programme', 'Expansion of Succession Management to all Critical Positions', 'Succession Management', null, null, 'Apr ''26|Dec ''26|Planned|Phase 2A (retiring within 5 years): complete to Individual Development Plan stage. Phase 2B (all other positions): complete to Successor Evaluation Stage. Status: To commence in Apr 2026.', null);
insert into detail_records (id, entity_id, period_id, record_type, label, category, value_num, value_num2, text_note, flag) values ('SEED-0031', 'HQ', 'Q1FY26', 'people_dev_programme', 'Succession Management Online System', 'Succession Management', null, null, 'Jan ''26|Dec ''26|In Progress|Explore a system to monitor and track successors and their development plans; adopt the system if it meets requirements. Status: Kick-off conducted in Apr 2026. Phase 1: establishing a centralised succession management repository within the current HR system.', null);
insert into detail_records (id, entity_id, period_id, record_type, label, category, value_num, value_num2, text_note, flag) values ('SEED-0032', 'HQ', 'Q1FY26', 'people_dev_programme', 'Review of Competency Framework', 'Performance Management', null, null, 'Jun ''26|Dec ''26|Planned|Review Prokhas'' Competency Framework to incorporate the 4Q dimensions. Status: To commence in Jun 2026.', null);
insert into detail_records (id, entity_id, period_id, record_type, label, category, value_num, value_num2, text_note, flag) values ('SEED-0033', 'HQ', 'Q1FY26', 'people_dev_programme', 'PMS Online System Enhancement (2nd Phase)', 'Performance Management', null, null, 'Feb ''26|Dec ''26|In Progress|Feb–May: update the system platform to improve system integrity; Jun–Dec: continued areas for improvement. Status: Phase 2 enhancement is ongoing, developed by ITD.', null);
insert into detail_records (id, entity_id, period_id, record_type, label, category, value_num, value_num2, text_note, flag) values ('SEED-0034', 'HQ', 'Q1FY26', 'people_dev_programme', 'Flexi-benefits module introduction', 'Talent/Culture Engagement', null, null, 'Jan ''26|Jun ''26|Planned|Addition of an extra module to manage the flexi-benefit, to be rolled out to staff (pending MOF''s approval of the proposal paper). Status: This is the expected GO LIVE date of the module. Currently awaiting MOF approval on the flexi-benefits.', null);
insert into detail_records (id, entity_id, period_id, record_type, label, category, value_num, value_num2, text_note, flag) values ('SEED-0035', 'HQ', 'Q1FY26', 'people_dev_programme', 'Deliver culture engagement communication campaigns as planned', 'Talent/Culture Engagement', null, null, 'Ongoing|80% complete|In Progress|Culture Launch & Awareness — 3 pillars: Culture Communication Campaign (posters, infographics, etc.); Culture Quiz Challenge (interactive quiz to help employees learn the pillars and their meaning); Culture Pledge Wall (employees write commitments on how they will practice the culture pillars). Status: 1st draft of the culture engagement framework, implementation plan and activities completed and presented in Apr 2026. Finalisation and approval in progress in Q2 2026.', null);

-- KPI 1 (PBT) and KPI 2 (Cost-to-Income Ratio) drill-down breakdowns, shown when their trend
-- chart on CP003 is clicked. category distinguishes the two breakdown tables; value_num = FY
-- target, value_num2 = YTD actual, text_note packs YTD target as a plain number string (CIR's
-- rows leave both target fields null — that breakdown only ever showed an actual-figures
-- column in the client's source report).
insert into detail_records (id, entity_id, period_id, record_type, label, category, value_num, value_num2, text_note, flag) values ('SEED-0036', 'HQ', 'Q1FY26', 'financial_breakdown', 'Revenue', 'PBT', 181.0, 46.7, '41.4', null);
insert into detail_records (id, entity_id, period_id, record_type, label, category, value_num, value_num2, text_note, flag) values ('SEED-0037', 'HQ', 'Q1FY26', 'financial_breakdown', 'Other Income', 'PBT', 25.4, 6.5, '6.2', null);
insert into detail_records (id, entity_id, period_id, record_type, label, category, value_num, value_num2, text_note, flag) values ('SEED-0038', 'HQ', 'Q1FY26', 'financial_breakdown', 'Total Income', 'PBT', 206.4, 53.2, '47.6', null);
insert into detail_records (id, entity_id, period_id, record_type, label, category, value_num, value_num2, text_note, flag) values ('SEED-0039', 'HQ', 'Q1FY26', 'financial_breakdown', 'Expenses', 'PBT', -100.2, -21.6, '-22.9', null);
insert into detail_records (id, entity_id, period_id, record_type, label, category, value_num, value_num2, text_note, flag) values ('SEED-0040', 'HQ', 'Q1FY26', 'financial_breakdown', 'Profit Before Tax', 'PBT', 106.2, 31.6, '24.7', null);
insert into detail_records (id, entity_id, period_id, record_type, label, category, value_num, value_num2, text_note, flag) values ('SEED-0041', 'HQ', 'Q1FY26', 'financial_breakdown', 'Personnel expenses', 'CIR', null, 16.8, null, null);
insert into detail_records (id, entity_id, period_id, record_type, label, category, value_num, value_num2, text_note, flag) values ('SEED-0042', 'HQ', 'Q1FY26', 'financial_breakdown', 'Administrative expenses', 'CIR', null, 2.3, null, null);
insert into detail_records (id, entity_id, period_id, record_type, label, category, value_num, value_num2, text_note, flag) values ('SEED-0043', 'HQ', 'Q1FY26', 'financial_breakdown', 'Professional fees', 'CIR', null, 0.4, null, null);
insert into detail_records (id, entity_id, period_id, record_type, label, category, value_num, value_num2, text_note, flag) values ('SEED-0044', 'HQ', 'Q1FY26', 'financial_breakdown', 'Depreciation', 'CIR', null, 1.4, null, null);
insert into detail_records (id, entity_id, period_id, record_type, label, category, value_num, value_num2, text_note, flag) values ('SEED-0045', 'HQ', 'Q1FY26', 'financial_breakdown', 'Other expenses', 'CIR', null, 0.7, null, null);
insert into detail_records (id, entity_id, period_id, record_type, label, category, value_num, value_num2, text_note, flag) values ('SEED-0046', 'HQ', 'Q1FY26', 'financial_breakdown', 'Total Cost', 'CIR', null, 21.6, null, null);
insert into detail_records (id, entity_id, period_id, record_type, label, category, value_num, value_num2, text_note, flag) values ('SEED-0047', 'HQ', 'Q1FY26', 'financial_breakdown', 'Total Income', 'CIR', null, 53.2, null, null);
insert into detail_records (id, entity_id, period_id, record_type, label, category, value_num, value_num2, text_note, flag) values ('SEED-0048', 'HQ', 'Q1FY26', 'financial_breakdown', 'Cost-to-Income Ratio', 'CIR', null, 40.6, null, null);
