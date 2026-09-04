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
  ('KPI6', 'HQ','Q1FY26', 95.0, 97.6, 'met', null),
  ('KPI7', 'HQ','Q1FY26', null, null, 'not-measurable', 'Initiatives planned to complete from Q3'),
  ('KPI8', 'HQ','Q1FY26', 6, 3, 'not-met', null),
  ('KPI9', 'HQ','Q1FY26', 80.0, 84.4, 'met', null),
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
insert into detail_metrics (entity_id, period_id, metric_key, dimension, dimension2, value, note) values ('HQ', 'Q1FY26', 'recruitment_index', 'Time to Hire (TTH)', 'score', null, '5 / 5 (Avg days to fulfil approved MRFs: 39 days)');
insert into detail_metrics (entity_id, period_id, metric_key, dimension, dimension2, value, note) values ('HQ', 'Q1FY26', 'recruitment_index', 'Time to Hire (TTH)', 'weighted', 0.2, 'Avg 39 days to fulfil approved MRFs');
insert into detail_metrics (entity_id, period_id, metric_key, dimension, dimension2, value, note) values ('HQ', 'Q1FY26', 'recruitment_index', 'Time to Hire (TTH)', 'computation', null, '5 / 5 x 20%');
insert into detail_metrics (entity_id, period_id, metric_key, dimension, dimension2, value, note) values ('HQ', 'Q1FY26', 'recruitment_index', 'MRF Fulfilment Rate', 'weight', 0.2, null);
insert into detail_metrics (entity_id, period_id, metric_key, dimension, dimension2, value, note) values ('HQ', 'Q1FY26', 'recruitment_index', 'MRF Fulfilment Rate', 'score', null, '57.1% - 2 (4 MRFs closed within 75 days of total 7 MRFs approved)');
insert into detail_metrics (entity_id, period_id, metric_key, dimension, dimension2, value, note) values ('HQ', 'Q1FY26', 'recruitment_index', 'MRF Fulfilment Rate', 'weighted', 0.08, '4 of 7 approved MRFs closed within 75 days');
insert into detail_metrics (entity_id, period_id, metric_key, dimension, dimension2, value, note) values ('HQ', 'Q1FY26', 'recruitment_index', 'MRF Fulfilment Rate', 'computation', null, '2 / 5 x 20%');
insert into detail_metrics (entity_id, period_id, metric_key, dimension, dimension2, value, note) values ('HQ', 'Q1FY26', 'recruitment_index', 'Quality of Hire', 'weight', 0.4, null);
insert into detail_metrics (entity_id, period_id, metric_key, dimension, dimension2, value, note) values ('HQ', 'Q1FY26', 'recruitment_index', 'Quality of Hire', 'score', null, '7 / 7');
insert into detail_metrics (entity_id, period_id, metric_key, dimension, dimension2, value, note) values ('HQ', 'Q1FY26', 'recruitment_index', 'Quality of Hire', 'weighted', 0.4, '7 confirmed of 7 hires');
insert into detail_metrics (entity_id, period_id, metric_key, dimension, dimension2, value, note) values ('HQ', 'Q1FY26', 'recruitment_index', 'Quality of Hire', 'computation', null, '7 / 7 x 40%');
insert into detail_metrics (entity_id, period_id, metric_key, dimension, dimension2, value, note) values ('HQ', 'Q1FY26', 'recruitment_index', 'Offer Acceptance Rate', 'weight', 0.2, null);
insert into detail_metrics (entity_id, period_id, metric_key, dimension, dimension2, value, note) values ('HQ', 'Q1FY26', 'recruitment_index', 'Offer Acceptance Rate', 'score', null, '9 / 11');
insert into detail_metrics (entity_id, period_id, metric_key, dimension, dimension2, value, note) values ('HQ', 'Q1FY26', 'recruitment_index', 'Offer Acceptance Rate', 'weighted', 0.164, '9 report-for-duty of 11 offers made');
insert into detail_metrics (entity_id, period_id, metric_key, dimension, dimension2, value, note) values ('HQ', 'Q1FY26', 'recruitment_index', 'Offer Acceptance Rate', 'computation', null, '9 / 11 x 20%');
insert into detail_metrics (entity_id, period_id, metric_key, dimension, dimension2, value, note) values ('HQ', 'Q1FY26', 'time_charter_dept_score', 'Administration & Security', '', 100.0, null);
insert into detail_metrics (entity_id, period_id, metric_key, dimension, dimension2, value, note) values ('HQ', 'Q1FY26', 'time_charter_dept_score', 'Credit', '', 100.0, null);
insert into detail_metrics (entity_id, period_id, metric_key, dimension, dimension2, value, note) values ('HQ', 'Q1FY26', 'time_charter_dept_score', 'Finance', '', 96.4, null);
insert into detail_metrics (entity_id, period_id, metric_key, dimension, dimension2, value, note) values ('HQ', 'Q1FY26', 'time_charter_dept_score', 'Guarantee Schemes - Claims', '', 99.7, null);
insert into detail_metrics (entity_id, period_id, metric_key, dimension, dimension2, value, note) values ('HQ', 'Q1FY26', 'time_charter_dept_score', 'Human Resources', '', 99.0, null);
insert into detail_metrics (entity_id, period_id, metric_key, dimension, dimension2, value, note) values ('HQ', 'Q1FY26', 'time_charter_dept_score', 'Information Technology', '', 98.0, null);
insert into detail_metrics (entity_id, period_id, metric_key, dimension, dimension2, value, note) values ('HQ', 'Q1FY26', 'time_charter_dept_score', 'Legal Affairs', '', 100.0, null);
insert into detail_metrics (entity_id, period_id, metric_key, dimension, dimension2, value, note) values ('HQ', 'Q1FY26', 'time_charter_dept_score', 'Operational Excellence', '', 97.0, null);
insert into detail_metrics (entity_id, period_id, metric_key, dimension, dimension2, value, note) values ('HQ', 'Q1FY26', 'time_charter_dept_score', 'Secretarial Services', '', 100.0, null);
insert into detail_metrics (entity_id, period_id, metric_key, dimension, dimension2, value, note) values ('HQ', 'Q1FY26', 'time_charter_dept_score', 'Syarikat Jaminan Kredit Perumahan (SJKP)', '', 100.0, null);
insert into detail_metrics (entity_id, period_id, metric_key, dimension, dimension2, value, note) values ('HQ', 'Q1FY26', 'time_charter_dept_score', 'Syarikat Jaminan Pembiayaan Perniagaan (SJPP)', '', 83.4, null);
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

-- Financial Results (QoQ) revamp -- pl_detail (Total Income components below PBT), revenue_by_source and
-- expense_by_category now carry actual+budget per quarter (Q1-Q4 FY2025 + Q1 FY2026), powering PFH002's
-- Current Quarter vs Preceding Quarter and Actual vs Budget drill-down tables. Q1FY26/Q4FY25 figures are
-- the client's real reported numbers; every other quarter is a proportional projection off the revenue/pbt
-- already seeded in financial_trend, using Q1FY26's own actual line-item mix as the split ratio.
insert into detail_metrics (entity_id, period_id, metric_key, dimension, dimension2, value, note) values
  ('HQ', 'Q1FY26', 'pl_detail', 'finance_income', 'actual', 6487, null),
  ('HQ', 'Q1FY26', 'pl_detail', 'other_income', 'actual', 46, null),
  ('HQ', 'Q1FY26', 'pl_detail', 'taxation', 'actual', -5535, null),
  ('HQ', 'Q1FY26', 'pl_detail', 'profit_after_tax', 'actual', 26030, null),
  ('HQ', 'Q1FY26', 'pl_detail', 'dividend', 'actual', 0, null),
  ('HQ', 'Q1FY26', 'pl_detail', 'finance_income', 'budget', 6266, null),
  ('HQ', 'Q1FY26', 'pl_detail', 'other_income', 'budget', 6, null),
  ('HQ', 'Q1FY26', 'pl_detail', 'taxation', 'budget', -5930, null),
  ('HQ', 'Q1FY26', 'pl_detail', 'profit_after_tax', 'budget', 18775, null),
  ('HQ', 'Q1FY26', 'pl_detail', 'dividend', 'budget', 0, null),
  ('HQ', 'Q4FY25', 'pl_detail', 'finance_income', 'actual', 6560, null),
  ('HQ', 'Q4FY25', 'pl_detail', 'other_income', 'actual', 84, null),
  ('HQ', 'Q4FY25', 'pl_detail', 'taxation', 'actual', -13364, null),
  ('HQ', 'Q4FY25', 'pl_detail', 'profit_after_tax', 'actual', 27632, null),
  ('HQ', 'Q4FY25', 'pl_detail', 'dividend', 'actual', -1439, null),
  ('HQ', 'Q1FY25', 'pl_detail', 'finance_income', 'actual', 4199, null),
  ('HQ', 'Q1FY25', 'pl_detail', 'other_income', 'actual', 30, null),
  ('HQ', 'Q1FY25', 'pl_detail', 'taxation', 'actual', -3472, null),
  ('HQ', 'Q1FY25', 'pl_detail', 'profit_after_tax', 'actual', 16328, null),
  ('HQ', 'Q1FY25', 'pl_detail', 'dividend', 'actual', 0, null),
  ('HQ', 'Q1FY25', 'pl_detail', 'finance_income', 'budget', 4056, null),
  ('HQ', 'Q1FY25', 'pl_detail', 'other_income', 'budget', 26, null),
  ('HQ', 'Q1FY25', 'pl_detail', 'taxation', 'budget', -2717, null),
  ('HQ', 'Q1FY25', 'pl_detail', 'profit_after_tax', 'budget', 12780, null),
  ('HQ', 'Q1FY25', 'pl_detail', 'dividend', 'budget', 0, null),
  ('HQ', 'Q2FY25', 'pl_detail', 'finance_income', 'actual', 5270, null),
  ('HQ', 'Q2FY25', 'pl_detail', 'other_income', 'actual', 37, null),
  ('HQ', 'Q2FY25', 'pl_detail', 'taxation', 'actual', -4051, null),
  ('HQ', 'Q2FY25', 'pl_detail', 'profit_after_tax', 'actual', 19049, null),
  ('HQ', 'Q2FY25', 'pl_detail', 'dividend', 'actual', 0, null),
  ('HQ', 'Q2FY25', 'pl_detail', 'finance_income', 'budget', 5090, null),
  ('HQ', 'Q2FY25', 'pl_detail', 'other_income', 'budget', 33, null),
  ('HQ', 'Q2FY25', 'pl_detail', 'taxation', 'budget', -3170, null),
  ('HQ', 'Q2FY25', 'pl_detail', 'profit_after_tax', 'budget', 14910, null),
  ('HQ', 'Q2FY25', 'pl_detail', 'dividend', 'budget', 0, null),
  ('HQ', 'Q3FY25', 'pl_detail', 'finance_income', 'actual', 5367, null),
  ('HQ', 'Q3FY25', 'pl_detail', 'other_income', 'actual', 38, null),
  ('HQ', 'Q3FY25', 'pl_detail', 'taxation', 'actual', -4279, null),
  ('HQ', 'Q3FY25', 'pl_detail', 'profit_after_tax', 'actual', 20121, null),
  ('HQ', 'Q3FY25', 'pl_detail', 'dividend', 'actual', 0, null),
  ('HQ', 'Q3FY25', 'pl_detail', 'finance_income', 'budget', 5184, null),
  ('HQ', 'Q3FY25', 'pl_detail', 'other_income', 'budget', 34, null),
  ('HQ', 'Q3FY25', 'pl_detail', 'taxation', 'budget', -3349, null),
  ('HQ', 'Q3FY25', 'pl_detail', 'profit_after_tax', 'budget', 15748, null),
  ('HQ', 'Q3FY25', 'pl_detail', 'dividend', 'budget', 0, null);
insert into detail_metrics (entity_id, period_id, metric_key, dimension, dimension2, value, note) values
  ('HQ', 'Q1FY26', 'revenue_by_source', 'danaharta_mgmt_fee', 'actual', 249, null),
  ('HQ', 'Q1FY26', 'revenue_by_source', 'govco_mgmt_fee', 'actual', 125, null),
  ('HQ', 'Q1FY26', 'revenue_by_source', 'sjkp_mgmt_fee', 'actual', 3355, null),
  ('HQ', 'Q1FY26', 'revenue_by_source', 'sjpp_mgmt_fee', 'actual', 34928, null),
  ('HQ', 'Q1FY26', 'revenue_by_source', 'danainfra_mgmt_fee', 'actual', 3300, null),
  ('HQ', 'Q1FY26', 'revenue_by_source', 'sap_services_fee', 'actual', 118, null),
  ('HQ', 'Q1FY26', 'revenue_by_source', 'outsourcing_services_fee', 'actual', 326, null),
  ('HQ', 'Q1FY26', 'revenue_by_source', 'secretarial_services_fee', 'actual', 185, null),
  ('HQ', 'Q1FY26', 'revenue_by_source', 'corporate_advisory_fee', 'actual', 0, null),
  ('HQ', 'Q1FY26', 'revenue_by_source', 'credit_advisory_fee', 'actual', 175, null),
  ('HQ', 'Q1FY26', 'revenue_by_source', 'acquired_loans_income', 'actual', 3892, null),
  ('HQ', 'Q1FY26', 'revenue_by_source', 'danaharta_mgmt_fee', 'budget', 246, null),
  ('HQ', 'Q1FY26', 'revenue_by_source', 'govco_mgmt_fee', 'budget', 125, null),
  ('HQ', 'Q1FY26', 'revenue_by_source', 'sjkp_mgmt_fee', 'budget', 3654, null),
  ('HQ', 'Q1FY26', 'revenue_by_source', 'sjpp_mgmt_fee', 'budget', 32920, null),
  ('HQ', 'Q1FY26', 'revenue_by_source', 'danainfra_mgmt_fee', 'budget', 3300, null),
  ('HQ', 'Q1FY26', 'revenue_by_source', 'sap_services_fee', 'budget', 87, null),
  ('HQ', 'Q1FY26', 'revenue_by_source', 'outsourcing_services_fee', 'budget', 259, null),
  ('HQ', 'Q1FY26', 'revenue_by_source', 'secretarial_services_fee', 'budget', 173, null),
  ('HQ', 'Q1FY26', 'revenue_by_source', 'corporate_advisory_fee', 'budget', 426, null),
  ('HQ', 'Q1FY26', 'revenue_by_source', 'credit_advisory_fee', 'budget', 175, null),
  ('HQ', 'Q1FY26', 'revenue_by_source', 'acquired_loans_income', 'budget', 0, null),
  ('HQ', 'Q4FY25', 'revenue_by_source', 'danaharta_mgmt_fee', 'actual', 245, null),
  ('HQ', 'Q4FY25', 'revenue_by_source', 'govco_mgmt_fee', 'actual', 125, null),
  ('HQ', 'Q4FY25', 'revenue_by_source', 'sjkp_mgmt_fee', 'actual', 3587, null),
  ('HQ', 'Q4FY25', 'revenue_by_source', 'sjpp_mgmt_fee', 'actual', 35705, null),
  ('HQ', 'Q4FY25', 'revenue_by_source', 'danainfra_mgmt_fee', 'actual', 3300, null),
  ('HQ', 'Q4FY25', 'revenue_by_source', 'sap_services_fee', 'actual', 187, null),
  ('HQ', 'Q4FY25', 'revenue_by_source', 'outsourcing_services_fee', 'actual', 332, null),
  ('HQ', 'Q4FY25', 'revenue_by_source', 'secretarial_services_fee', 'actual', 334, null),
  ('HQ', 'Q4FY25', 'revenue_by_source', 'corporate_advisory_fee', 'actual', 979, null),
  ('HQ', 'Q4FY25', 'revenue_by_source', 'credit_advisory_fee', 'actual', 175, null),
  ('HQ', 'Q4FY25', 'revenue_by_source', 'acquired_loans_income', 'actual', 11419, null),
  ('HQ', 'Q1FY25', 'revenue_by_source', 'danaharta_mgmt_fee', 'actual', 161, null),
  ('HQ', 'Q1FY25', 'revenue_by_source', 'govco_mgmt_fee', 'actual', 81, null),
  ('HQ', 'Q1FY25', 'revenue_by_source', 'sjkp_mgmt_fee', 'actual', 2172, null),
  ('HQ', 'Q1FY25', 'revenue_by_source', 'sjpp_mgmt_fee', 'actual', 22610, null),
  ('HQ', 'Q1FY25', 'revenue_by_source', 'danainfra_mgmt_fee', 'actual', 2136, null),
  ('HQ', 'Q1FY25', 'revenue_by_source', 'sap_services_fee', 'actual', 76, null),
  ('HQ', 'Q1FY25', 'revenue_by_source', 'outsourcing_services_fee', 'actual', 211, null),
  ('HQ', 'Q1FY25', 'revenue_by_source', 'secretarial_services_fee', 'actual', 120, null),
  ('HQ', 'Q1FY25', 'revenue_by_source', 'corporate_advisory_fee', 'actual', 0, null),
  ('HQ', 'Q1FY25', 'revenue_by_source', 'credit_advisory_fee', 'actual', 113, null),
  ('HQ', 'Q1FY25', 'revenue_by_source', 'acquired_loans_income', 'actual', 2519, null),
  ('HQ', 'Q1FY25', 'revenue_by_source', 'danaharta_mgmt_fee', 'budget', 143, null),
  ('HQ', 'Q1FY25', 'revenue_by_source', 'govco_mgmt_fee', 'budget', 72, null),
  ('HQ', 'Q1FY25', 'revenue_by_source', 'sjkp_mgmt_fee', 'budget', 1926, null),
  ('HQ', 'Q1FY25', 'revenue_by_source', 'sjpp_mgmt_fee', 'budget', 20047, null),
  ('HQ', 'Q1FY25', 'revenue_by_source', 'danainfra_mgmt_fee', 'budget', 1894, null),
  ('HQ', 'Q1FY25', 'revenue_by_source', 'sap_services_fee', 'budget', 68, null),
  ('HQ', 'Q1FY25', 'revenue_by_source', 'outsourcing_services_fee', 'budget', 187, null),
  ('HQ', 'Q1FY25', 'revenue_by_source', 'secretarial_services_fee', 'budget', 106, null),
  ('HQ', 'Q1FY25', 'revenue_by_source', 'corporate_advisory_fee', 'budget', 0, null),
  ('HQ', 'Q1FY25', 'revenue_by_source', 'credit_advisory_fee', 'budget', 100, null),
  ('HQ', 'Q1FY25', 'revenue_by_source', 'acquired_loans_income', 'budget', 2234, null),
  ('HQ', 'Q2FY25', 'revenue_by_source', 'danaharta_mgmt_fee', 'actual', 202, null),
  ('HQ', 'Q2FY25', 'revenue_by_source', 'govco_mgmt_fee', 'actual', 102, null),
  ('HQ', 'Q2FY25', 'revenue_by_source', 'sjkp_mgmt_fee', 'actual', 2726, null),
  ('HQ', 'Q2FY25', 'revenue_by_source', 'sjpp_mgmt_fee', 'actual', 28375, null),
  ('HQ', 'Q2FY25', 'revenue_by_source', 'danainfra_mgmt_fee', 'actual', 2681, null),
  ('HQ', 'Q2FY25', 'revenue_by_source', 'sap_services_fee', 'actual', 96, null),
  ('HQ', 'Q2FY25', 'revenue_by_source', 'outsourcing_services_fee', 'actual', 265, null),
  ('HQ', 'Q2FY25', 'revenue_by_source', 'secretarial_services_fee', 'actual', 150, null),
  ('HQ', 'Q2FY25', 'revenue_by_source', 'corporate_advisory_fee', 'actual', 0, null),
  ('HQ', 'Q2FY25', 'revenue_by_source', 'credit_advisory_fee', 'actual', 142, null),
  ('HQ', 'Q2FY25', 'revenue_by_source', 'acquired_loans_income', 'actual', 3162, null),
  ('HQ', 'Q2FY25', 'revenue_by_source', 'danaharta_mgmt_fee', 'budget', 179, null),
  ('HQ', 'Q2FY25', 'revenue_by_source', 'govco_mgmt_fee', 'budget', 90, null),
  ('HQ', 'Q2FY25', 'revenue_by_source', 'sjkp_mgmt_fee', 'budget', 2417, null),
  ('HQ', 'Q2FY25', 'revenue_by_source', 'sjpp_mgmt_fee', 'budget', 25159, null),
  ('HQ', 'Q2FY25', 'revenue_by_source', 'danainfra_mgmt_fee', 'budget', 2377, null),
  ('HQ', 'Q2FY25', 'revenue_by_source', 'sap_services_fee', 'budget', 85, null),
  ('HQ', 'Q2FY25', 'revenue_by_source', 'outsourcing_services_fee', 'budget', 235, null),
  ('HQ', 'Q2FY25', 'revenue_by_source', 'secretarial_services_fee', 'budget', 133, null),
  ('HQ', 'Q2FY25', 'revenue_by_source', 'corporate_advisory_fee', 'budget', 0, null),
  ('HQ', 'Q2FY25', 'revenue_by_source', 'credit_advisory_fee', 'budget', 126, null),
  ('HQ', 'Q2FY25', 'revenue_by_source', 'acquired_loans_income', 'budget', 2803, null),
  ('HQ', 'Q3FY25', 'revenue_by_source', 'danaharta_mgmt_fee', 'actual', 206, null),
  ('HQ', 'Q3FY25', 'revenue_by_source', 'govco_mgmt_fee', 'actual', 103, null),
  ('HQ', 'Q3FY25', 'revenue_by_source', 'sjkp_mgmt_fee', 'actual', 2776, null),
  ('HQ', 'Q3FY25', 'revenue_by_source', 'sjpp_mgmt_fee', 'actual', 28899, null),
  ('HQ', 'Q3FY25', 'revenue_by_source', 'danainfra_mgmt_fee', 'actual', 2730, null),
  ('HQ', 'Q3FY25', 'revenue_by_source', 'sap_services_fee', 'actual', 98, null),
  ('HQ', 'Q3FY25', 'revenue_by_source', 'outsourcing_services_fee', 'actual', 270, null),
  ('HQ', 'Q3FY25', 'revenue_by_source', 'secretarial_services_fee', 'actual', 153, null),
  ('HQ', 'Q3FY25', 'revenue_by_source', 'corporate_advisory_fee', 'actual', 0, null),
  ('HQ', 'Q3FY25', 'revenue_by_source', 'credit_advisory_fee', 'actual', 145, null),
  ('HQ', 'Q3FY25', 'revenue_by_source', 'acquired_loans_income', 'actual', 3220, null),
  ('HQ', 'Q3FY25', 'revenue_by_source', 'danaharta_mgmt_fee', 'budget', 183, null),
  ('HQ', 'Q3FY25', 'revenue_by_source', 'govco_mgmt_fee', 'budget', 92, null),
  ('HQ', 'Q3FY25', 'revenue_by_source', 'sjkp_mgmt_fee', 'budget', 2461, null),
  ('HQ', 'Q3FY25', 'revenue_by_source', 'sjpp_mgmt_fee', 'budget', 25623, null),
  ('HQ', 'Q3FY25', 'revenue_by_source', 'danainfra_mgmt_fee', 'budget', 2421, null),
  ('HQ', 'Q3FY25', 'revenue_by_source', 'sap_services_fee', 'budget', 87, null),
  ('HQ', 'Q3FY25', 'revenue_by_source', 'outsourcing_services_fee', 'budget', 239, null),
  ('HQ', 'Q3FY25', 'revenue_by_source', 'secretarial_services_fee', 'budget', 136, null),
  ('HQ', 'Q3FY25', 'revenue_by_source', 'corporate_advisory_fee', 'budget', 0, null),
  ('HQ', 'Q3FY25', 'revenue_by_source', 'credit_advisory_fee', 'budget', 128, null),
  ('HQ', 'Q3FY25', 'revenue_by_source', 'acquired_loans_income', 'budget', 2855, null);
insert into detail_metrics (entity_id, period_id, metric_key, dimension, dimension2, value, note) values
  ('HQ', 'Q1FY26', 'expense_by_category', 'admin_expenses', 'actual', -2299, null),
  ('HQ', 'Q1FY26', 'expense_by_category', 'personnel_expenses', 'actual', -16859, null),
  ('HQ', 'Q1FY26', 'expense_by_category', 'professional_fees', 'actual', -431, null),
  ('HQ', 'Q1FY26', 'expense_by_category', 'depreciation', 'actual', -663, null),
  ('HQ', 'Q1FY26', 'expense_by_category', 'depreciation_rou', 'actual', -767, null),
  ('HQ', 'Q1FY26', 'expense_by_category', 'other_expenses', 'actual', -33, null),
  ('HQ', 'Q1FY26', 'expense_by_category', 'interest_expense_lease', 'actual', -214, null),
  ('HQ', 'Q1FY26', 'expense_by_category', 'impairment_receivables', 'actual', -355, null),
  ('HQ', 'Q4FY25', 'expense_by_category', 'admin_expenses', 'actual', -3465, null),
  ('HQ', 'Q4FY25', 'expense_by_category', 'personnel_expenses', 'actual', -15823, null),
  ('HQ', 'Q4FY25', 'expense_by_category', 'professional_fees', 'actual', -870, null),
  ('HQ', 'Q4FY25', 'expense_by_category', 'depreciation', 'actual', -766, null),
  ('HQ', 'Q4FY25', 'expense_by_category', 'depreciation_rou', 'actual', -794, null),
  ('HQ', 'Q4FY25', 'expense_by_category', 'other_expenses', 'actual', -130, null),
  ('HQ', 'Q4FY25', 'expense_by_category', 'interest_expense_lease', 'actual', -227, null),
  ('HQ', 'Q4FY25', 'expense_by_category', 'impairment_receivables', 'actual', 39, null),
  ('HQ', 'Q1FY26', 'expense_by_category', 'admin_expenses', 'budget', -2438, null),
  ('HQ', 'Q1FY26', 'expense_by_category', 'personnel_expenses', 'budget', -17881, null),
  ('HQ', 'Q1FY26', 'expense_by_category', 'professional_fees', 'budget', -457, null),
  ('HQ', 'Q1FY26', 'expense_by_category', 'depreciation', 'budget', -703, null),
  ('HQ', 'Q1FY26', 'expense_by_category', 'depreciation_rou', 'budget', -814, null),
  ('HQ', 'Q1FY26', 'expense_by_category', 'other_expenses', 'budget', -35, null),
  ('HQ', 'Q1FY26', 'expense_by_category', 'interest_expense_lease', 'budget', -227, null),
  ('HQ', 'Q1FY26', 'expense_by_category', 'impairment_receivables', 'budget', -377, null),
  ('HQ', 'Q1FY25', 'expense_by_category', 'admin_expenses', 'actual', -1556, null),
  ('HQ', 'Q1FY25', 'expense_by_category', 'personnel_expenses', 'actual', -11407, null),
  ('HQ', 'Q1FY25', 'expense_by_category', 'professional_fees', 'actual', -292, null),
  ('HQ', 'Q1FY25', 'expense_by_category', 'depreciation', 'actual', -449, null),
  ('HQ', 'Q1FY25', 'expense_by_category', 'depreciation_rou', 'actual', -519, null),
  ('HQ', 'Q1FY25', 'expense_by_category', 'other_expenses', 'actual', -22, null),
  ('HQ', 'Q1FY25', 'expense_by_category', 'interest_expense_lease', 'actual', -145, null),
  ('HQ', 'Q1FY25', 'expense_by_category', 'impairment_receivables', 'actual', -240, null),
  ('HQ', 'Q1FY25', 'expense_by_category', 'admin_expenses', 'budget', -1633, null),
  ('HQ', 'Q1FY25', 'expense_by_category', 'personnel_expenses', 'budget', -11979, null),
  ('HQ', 'Q1FY25', 'expense_by_category', 'professional_fees', 'budget', -306, null),
  ('HQ', 'Q1FY25', 'expense_by_category', 'depreciation', 'budget', -471, null),
  ('HQ', 'Q1FY25', 'expense_by_category', 'depreciation_rou', 'budget', -545, null),
  ('HQ', 'Q1FY25', 'expense_by_category', 'other_expenses', 'budget', -23, null),
  ('HQ', 'Q1FY25', 'expense_by_category', 'interest_expense_lease', 'budget', -152, null),
  ('HQ', 'Q1FY25', 'expense_by_category', 'impairment_receivables', 'budget', -252, null),
  ('HQ', 'Q2FY25', 'expense_by_category', 'admin_expenses', 'actual', -2138, null),
  ('HQ', 'Q2FY25', 'expense_by_category', 'personnel_expenses', 'actual', -15678, null),
  ('HQ', 'Q2FY25', 'expense_by_category', 'professional_fees', 'actual', -401, null),
  ('HQ', 'Q2FY25', 'expense_by_category', 'depreciation', 'actual', -617, null),
  ('HQ', 'Q2FY25', 'expense_by_category', 'depreciation_rou', 'actual', -713, null),
  ('HQ', 'Q2FY25', 'expense_by_category', 'other_expenses', 'actual', -31, null),
  ('HQ', 'Q2FY25', 'expense_by_category', 'interest_expense_lease', 'actual', -199, null),
  ('HQ', 'Q2FY25', 'expense_by_category', 'impairment_receivables', 'actual', -330, null),
  ('HQ', 'Q2FY25', 'expense_by_category', 'admin_expenses', 'budget', -2195, null),
  ('HQ', 'Q2FY25', 'expense_by_category', 'personnel_expenses', 'budget', -16100, null),
  ('HQ', 'Q2FY25', 'expense_by_category', 'professional_fees', 'budget', -412, null),
  ('HQ', 'Q2FY25', 'expense_by_category', 'depreciation', 'budget', -633, null),
  ('HQ', 'Q2FY25', 'expense_by_category', 'depreciation_rou', 'budget', -732, null),
  ('HQ', 'Q2FY25', 'expense_by_category', 'other_expenses', 'budget', -32, null),
  ('HQ', 'Q2FY25', 'expense_by_category', 'interest_expense_lease', 'budget', -204, null),
  ('HQ', 'Q2FY25', 'expense_by_category', 'impairment_receivables', 'budget', -339, null),
  ('HQ', 'Q3FY25', 'expense_by_category', 'admin_expenses', 'actual', -2085, null),
  ('HQ', 'Q3FY25', 'expense_by_category', 'personnel_expenses', 'actual', -15287, null),
  ('HQ', 'Q3FY25', 'expense_by_category', 'professional_fees', 'actual', -391, null),
  ('HQ', 'Q3FY25', 'expense_by_category', 'depreciation', 'actual', -601, null),
  ('HQ', 'Q3FY25', 'expense_by_category', 'depreciation_rou', 'actual', -695, null),
  ('HQ', 'Q3FY25', 'expense_by_category', 'other_expenses', 'actual', -30, null),
  ('HQ', 'Q3FY25', 'expense_by_category', 'interest_expense_lease', 'actual', -194, null),
  ('HQ', 'Q3FY25', 'expense_by_category', 'impairment_receivables', 'actual', -322, null),
  ('HQ', 'Q3FY25', 'expense_by_category', 'admin_expenses', 'budget', -2163, null),
  ('HQ', 'Q3FY25', 'expense_by_category', 'personnel_expenses', 'budget', -15865, null),
  ('HQ', 'Q3FY25', 'expense_by_category', 'professional_fees', 'budget', -406, null),
  ('HQ', 'Q3FY25', 'expense_by_category', 'depreciation', 'budget', -624, null),
  ('HQ', 'Q3FY25', 'expense_by_category', 'depreciation_rou', 'budget', -722, null),
  ('HQ', 'Q3FY25', 'expense_by_category', 'other_expenses', 'budget', -31, null),
  ('HQ', 'Q3FY25', 'expense_by_category', 'interest_expense_lease', 'budget', -201, null),
  ('HQ', 'Q3FY25', 'expense_by_category', 'impairment_receivables', 'budget', -334, null);

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
-- Managed Entities Rating (KPI3) — per-KPI breakdown behind each entity's roll-up. Q1 FY2026 is the
-- client's real reported data (SJPP/SJKP/DanaInfra/GovCo); DanaHarta and all FY2025 quarters are
-- illustrative dummy data generated to keep every quarter/entity browsable.
insert into detail_records (id, entity_id, period_id, record_type, label, category, value_num, value_num2, text_note, flag) values ('SEED-0049', 'HQ', 'Q1FY25', 'managed_entity_kpi', 'Sessions with FIs, GoM agencies, & SME enablers (SMEs or business associations)', 'SJPP', 5, 0.36, 'a|Intensify marketing and strengthen relationship with target markets|80 sessions|20 sessions|35 sessions', null);
insert into detail_records (id, entity_id, period_id, record_type, label, category, value_num, value_num2, text_note, flag) values ('SEED-0050', 'HQ', 'Q2FY25', 'managed_entity_kpi', 'Sessions with FIs, GoM agencies, & SME enablers (SMEs or business associations)', 'SJPP', 5, 0.36, 'a|Intensify marketing and strengthen relationship with target markets|80 sessions|40 sessions|52 sessions', null);
insert into detail_records (id, entity_id, period_id, record_type, label, category, value_num, value_num2, text_note, flag) values ('SEED-0051', 'HQ', 'Q3FY25', 'managed_entity_kpi', 'Sessions with FIs, GoM agencies, & SME enablers (SMEs or business associations)', 'SJPP', 4, 0.29, 'a|Intensify marketing and strengthen relationship with target markets|80 sessions|60 sessions|68 sessions', null);
insert into detail_records (id, entity_id, period_id, record_type, label, category, value_num, value_num2, text_note, flag) values ('SEED-0052', 'HQ', 'Q4FY25', 'managed_entity_kpi', 'Sessions with FIs, GoM agencies, & SME enablers (SMEs or business associations)', 'SJPP', 4, 0.29, 'a|Intensify marketing and strengthen relationship with target markets|80 sessions|80 sessions|79 sessions', null);
insert into detail_records (id, entity_id, period_id, record_type, label, category, value_num, value_num2, text_note, flag) values ('SEED-0053', 'HQ', 'Q1FY26', 'managed_entity_kpi', 'Sessions with FIs, GoM agencies, & SME enablers (SMEs or business associations)', 'SJPP', 5, 0.36, 'a|Intensify marketing and strengthen relationship with target markets|100 sessions|25 sessions|58 sessions', null);
insert into detail_records (id, entity_id, period_id, record_type, label, category, value_num, value_num2, text_note, flag) values ('SEED-0054', 'HQ', 'Q2FY26', 'managed_entity_kpi', 'Sessions with FIs, GoM agencies, & SME enablers (SMEs or business associations)', 'SJPP', 5, 0.36, 'a|Intensify marketing and strengthen relationship with target markets|100 sessions|50 sessions|95 sessions', null);
insert into detail_records (id, entity_id, period_id, record_type, label, category, value_num, value_num2, text_note, flag) values ('SEED-0055', 'HQ', 'Q1FY25', 'managed_entity_kpi', 'Processing of applications until GNL issued', 'SJPP', 4, 0.29, 'b(i)|Ensure the stipulated deadlines are met and complied|5 WD|5 WD|3.5 WD', null);
insert into detail_records (id, entity_id, period_id, record_type, label, category, value_num, value_num2, text_note, flag) values ('SEED-0056', 'HQ', 'Q2FY25', 'managed_entity_kpi', 'Processing of applications until GNL issued', 'SJPP', 4, 0.29, 'b(i)|Ensure the stipulated deadlines are met and complied|5 WD|5 WD|3.2 WD', null);
insert into detail_records (id, entity_id, period_id, record_type, label, category, value_num, value_num2, text_note, flag) values ('SEED-0057', 'HQ', 'Q3FY25', 'managed_entity_kpi', 'Processing of applications until GNL issued', 'SJPP', 5, 0.36, 'b(i)|Ensure the stipulated deadlines are met and complied|5 WD|5 WD|2.8 WD', null);
insert into detail_records (id, entity_id, period_id, record_type, label, category, value_num, value_num2, text_note, flag) values ('SEED-0058', 'HQ', 'Q4FY25', 'managed_entity_kpi', 'Processing of applications until GNL issued', 'SJPP', 4, 0.29, 'b(i)|Ensure the stipulated deadlines are met and complied|5 WD|5 WD|3.0 WD', null);
insert into detail_records (id, entity_id, period_id, record_type, label, category, value_num, value_num2, text_note, flag) values ('SEED-0059', 'HQ', 'Q1FY26', 'managed_entity_kpi', 'Processing of applications until GNL issued', 'SJPP', 4, 0.29, 'b(i)|Ensure the stipulated deadlines are met and complied|5 WD|5 WD|3.0 WD', null);
insert into detail_records (id, entity_id, period_id, record_type, label, category, value_num, value_num2, text_note, flag) values ('SEED-0060', 'HQ', 'Q2FY26', 'managed_entity_kpi', 'Processing of applications until GNL issued', 'SJPP', 5, 0.36, 'b(i)|Ensure the stipulated deadlines are met and complied|5 WD|5 WD|2.8 WD', null);
insert into detail_records (id, entity_id, period_id, record_type, label, category, value_num, value_num2, text_note, flag) values ('SEED-0061', 'HQ', 'Q1FY25', 'managed_entity_kpi', 'Processing of issuance & renewal of guarantees request from the FIs', 'SJPP', 5, 0.36, 'b(ii)|Ensure the stipulated deadlines are met and complied|2 WD|2 WD|0.5 WD', null);
insert into detail_records (id, entity_id, period_id, record_type, label, category, value_num, value_num2, text_note, flag) values ('SEED-0062', 'HQ', 'Q2FY25', 'managed_entity_kpi', 'Processing of issuance & renewal of guarantees request from the FIs', 'SJPP', 5, 0.36, 'b(ii)|Ensure the stipulated deadlines are met and complied|2 WD|2 WD|0.3 WD', null);
insert into detail_records (id, entity_id, period_id, record_type, label, category, value_num, value_num2, text_note, flag) values ('SEED-0063', 'HQ', 'Q3FY25', 'managed_entity_kpi', 'Processing of issuance & renewal of guarantees request from the FIs', 'SJPP', 5, 0.36, 'b(ii)|Ensure the stipulated deadlines are met and complied|2 WD|2 WD|0.2 WD', null);
insert into detail_records (id, entity_id, period_id, record_type, label, category, value_num, value_num2, text_note, flag) values ('SEED-0064', 'HQ', 'Q4FY25', 'managed_entity_kpi', 'Processing of issuance & renewal of guarantees request from the FIs', 'SJPP', 5, 0.36, 'b(ii)|Ensure the stipulated deadlines are met and complied|2 WD|2 WD|0.0 WD', null);
insert into detail_records (id, entity_id, period_id, record_type, label, category, value_num, value_num2, text_note, flag) values ('SEED-0065', 'HQ', 'Q1FY26', 'managed_entity_kpi', 'Processing of issuance & renewal of guarantees request from the FIs', 'SJPP', 5, 0.36, 'b(ii)|Ensure the stipulated deadlines are met and complied|2 WD|2 WD|0.0 WD', null);
insert into detail_records (id, entity_id, period_id, record_type, label, category, value_num, value_num2, text_note, flag) values ('SEED-0066', 'HQ', 'Q2FY26', 'managed_entity_kpi', 'Processing of issuance & renewal of guarantees request from the FIs', 'SJPP', 5, 0.36, 'b(ii)|Ensure the stipulated deadlines are met and complied|2 WD|2 WD|0.0 WD', null);
insert into detail_records (id, entity_id, period_id, record_type, label, category, value_num, value_num2, text_note, flag) values ('SEED-0067', 'HQ', 'Q1FY25', 'managed_entity_kpi', 'Issuance of GC for DPGS customers', 'SJPP', 4, 0.29, 'b(iii)|Ensure the stipulated deadlines are met and complied|2 WD|2 WD|1.6 WD', null);
insert into detail_records (id, entity_id, period_id, record_type, label, category, value_num, value_num2, text_note, flag) values ('SEED-0068', 'HQ', 'Q2FY25', 'managed_entity_kpi', 'Issuance of GC for DPGS customers', 'SJPP', 4, 0.29, 'b(iii)|Ensure the stipulated deadlines are met and complied|2 WD|2 WD|1.5 WD', null);
insert into detail_records (id, entity_id, period_id, record_type, label, category, value_num, value_num2, text_note, flag) values ('SEED-0069', 'HQ', 'Q3FY25', 'managed_entity_kpi', 'Issuance of GC for DPGS customers', 'SJPP', 4, 0.29, 'b(iii)|Ensure the stipulated deadlines are met and complied|2 WD|2 WD|1.3 WD', null);
insert into detail_records (id, entity_id, period_id, record_type, label, category, value_num, value_num2, text_note, flag) values ('SEED-0070', 'HQ', 'Q4FY25', 'managed_entity_kpi', 'Issuance of GC for DPGS customers', 'SJPP', 5, 0.36, 'b(iii)|Ensure the stipulated deadlines are met and complied|2 WD|2 WD|1.2 WD', null);
insert into detail_records (id, entity_id, period_id, record_type, label, category, value_num, value_num2, text_note, flag) values ('SEED-0071', 'HQ', 'Q1FY26', 'managed_entity_kpi', 'Issuance of GC for DPGS customers', 'SJPP', 4, 0.29, 'b(iii)|Ensure the stipulated deadlines are met and complied|2 WD|2 WD|1.4 WD', null);
insert into detail_records (id, entity_id, period_id, record_type, label, category, value_num, value_num2, text_note, flag) values ('SEED-0072', 'HQ', 'Q2FY26', 'managed_entity_kpi', 'Issuance of GC for DPGS customers', 'SJPP', 5, 0.36, 'b(iii)|Ensure the stipulated deadlines are met and complied|2 WD|2 WD|1.2 WD', null);
insert into detail_records (id, entity_id, period_id, record_type, label, category, value_num, value_num2, text_note, flag) values ('SEED-0073', 'HQ', 'Q1FY25', 'managed_entity_kpi', 'Number of Malaysian businesses approved for SJPP-guaranteed financing', 'SJPP', 2, 0.14, 'c|Growth in underserved|12,000 businesses|3,000 businesses|2,200 businesses', null);
insert into detail_records (id, entity_id, period_id, record_type, label, category, value_num, value_num2, text_note, flag) values ('SEED-0074', 'HQ', 'Q2FY25', 'managed_entity_kpi', 'Number of Malaysian businesses approved for SJPP-guaranteed financing', 'SJPP', 2, 0.14, 'c|Growth in underserved|12,000 businesses|6,000 businesses|4,300 businesses', null);
insert into detail_records (id, entity_id, period_id, record_type, label, category, value_num, value_num2, text_note, flag) values ('SEED-0075', 'HQ', 'Q3FY25', 'managed_entity_kpi', 'Number of Malaysian businesses approved for SJPP-guaranteed financing', 'SJPP', 2, 0.14, 'c|Growth in underserved|12,000 businesses|9,000 businesses|6,500 businesses', null);
insert into detail_records (id, entity_id, period_id, record_type, label, category, value_num, value_num2, text_note, flag) values ('SEED-0076', 'HQ', 'Q4FY25', 'managed_entity_kpi', 'Number of Malaysian businesses approved for SJPP-guaranteed financing', 'SJPP', 3, 0.22, 'c|Growth in underserved|12,000 businesses|12,000 businesses|9,800 businesses', null);
insert into detail_records (id, entity_id, period_id, record_type, label, category, value_num, value_num2, text_note, flag) values ('SEED-0077', 'HQ', 'Q1FY26', 'managed_entity_kpi', 'Number of Malaysian businesses approved for SJPP-guaranteed financing', 'SJPP', 1, 0.07, 'c|Growth in underserved|13,500 businesses|3,375 businesses|2,681 businesses', null);
insert into detail_records (id, entity_id, period_id, record_type, label, category, value_num, value_num2, text_note, flag) values ('SEED-0078', 'HQ', 'Q2FY26', 'managed_entity_kpi', 'Number of Malaysian businesses approved for SJPP-guaranteed financing', 'SJPP', 3, 0.22, 'c|Growth in underserved|13,500 businesses|6,750 businesses|5,800 businesses', null);
insert into detail_records (id, entity_id, period_id, record_type, label, category, value_num, value_num2, text_note, flag) values ('SEED-0079', 'HQ', 'Q1FY25', 'managed_entity_kpi', 'Processing and issuance of NOG for applications', 'SJKP', 5, 0.36, 'd(i)|Ensure the stipulated deadlines are met and complied|5 WD|5 WD|2.0 WD', null);
insert into detail_records (id, entity_id, period_id, record_type, label, category, value_num, value_num2, text_note, flag) values ('SEED-0080', 'HQ', 'Q2FY25', 'managed_entity_kpi', 'Processing and issuance of NOG for applications', 'SJKP', 5, 0.36, 'd(i)|Ensure the stipulated deadlines are met and complied|5 WD|5 WD|1.8 WD', null);
insert into detail_records (id, entity_id, period_id, record_type, label, category, value_num, value_num2, text_note, flag) values ('SEED-0081', 'HQ', 'Q3FY25', 'managed_entity_kpi', 'Processing and issuance of NOG for applications', 'SJKP', 5, 0.36, 'd(i)|Ensure the stipulated deadlines are met and complied|5 WD|5 WD|1.5 WD', null);
insert into detail_records (id, entity_id, period_id, record_type, label, category, value_num, value_num2, text_note, flag) values ('SEED-0082', 'HQ', 'Q4FY25', 'managed_entity_kpi', 'Processing and issuance of NOG for applications', 'SJKP', 5, 0.36, 'd(i)|Ensure the stipulated deadlines are met and complied|5 WD|5 WD|1.2 WD', null);
insert into detail_records (id, entity_id, period_id, record_type, label, category, value_num, value_num2, text_note, flag) values ('SEED-0083', 'HQ', 'Q1FY26', 'managed_entity_kpi', 'Processing and issuance of NOG for applications', 'SJKP', 5, 0.36, 'd(i)|Ensure the stipulated deadlines are met and complied|5 WD|5 WD|1.0 WD', null);
insert into detail_records (id, entity_id, period_id, record_type, label, category, value_num, value_num2, text_note, flag) values ('SEED-0084', 'HQ', 'Q2FY26', 'managed_entity_kpi', 'Processing and issuance of NOG for applications', 'SJKP', 5, 0.36, 'd(i)|Ensure the stipulated deadlines are met and complied|5 WD|5 WD|0.8 WD', null);
insert into detail_records (id, entity_id, period_id, record_type, label, category, value_num, value_num2, text_note, flag) values ('SEED-0085', 'HQ', 'Q1FY25', 'managed_entity_kpi', 'Timely processing of Claims from participating FIs upon receipt of full supporting documents & legal action status as per requirement prior to GSC''s or GM''s approval', 'SJKP', 5, 0.36, 'd(ii)|Ensure the stipulated deadlines are met and complied|7 WD|7 WD|2.5 WD', null);
insert into detail_records (id, entity_id, period_id, record_type, label, category, value_num, value_num2, text_note, flag) values ('SEED-0086', 'HQ', 'Q2FY25', 'managed_entity_kpi', 'Timely processing of Claims from participating FIs upon receipt of full supporting documents & legal action status as per requirement prior to GSC''s or GM''s approval', 'SJKP', 5, 0.36, 'd(ii)|Ensure the stipulated deadlines are met and complied|7 WD|7 WD|2.2 WD', null);
insert into detail_records (id, entity_id, period_id, record_type, label, category, value_num, value_num2, text_note, flag) values ('SEED-0087', 'HQ', 'Q3FY25', 'managed_entity_kpi', 'Timely processing of Claims from participating FIs upon receipt of full supporting documents & legal action status as per requirement prior to GSC''s or GM''s approval', 'SJKP', 5, 0.36, 'd(ii)|Ensure the stipulated deadlines are met and complied|7 WD|7 WD|2.0 WD', null);
insert into detail_records (id, entity_id, period_id, record_type, label, category, value_num, value_num2, text_note, flag) values ('SEED-0088', 'HQ', 'Q4FY25', 'managed_entity_kpi', 'Timely processing of Claims from participating FIs upon receipt of full supporting documents & legal action status as per requirement prior to GSC''s or GM''s approval', 'SJKP', 5, 0.36, 'd(ii)|Ensure the stipulated deadlines are met and complied|7 WD|7 WD|1.8 WD', null);
insert into detail_records (id, entity_id, period_id, record_type, label, category, value_num, value_num2, text_note, flag) values ('SEED-0089', 'HQ', 'Q1FY26', 'managed_entity_kpi', 'Timely processing of Claims from participating FIs upon receipt of full supporting documents & legal action status as per requirement prior to GSC''s or GM''s approval', 'SJKP', 5, 0.36, 'd(ii)|Ensure the stipulated deadlines are met and complied|7 WD|7 WD|1.5 WD', null);
insert into detail_records (id, entity_id, period_id, record_type, label, category, value_num, value_num2, text_note, flag) values ('SEED-0090', 'HQ', 'Q2FY26', 'managed_entity_kpi', 'Timely processing of Claims from participating FIs upon receipt of full supporting documents & legal action status as per requirement prior to GSC''s or GM''s approval', 'SJKP', 5, 0.36, 'd(ii)|Ensure the stipulated deadlines are met and complied|7 WD|7 WD|1.3 WD', null);
insert into detail_records (id, entity_id, period_id, record_type, label, category, value_num, value_num2, text_note, flag) values ('SEED-0091', 'HQ', 'Q1FY25', 'managed_entity_kpi', 'Verification and reconciliation of monthly reports from participating FIs', 'SJKP', 4, 0.29, 'd(iii)|Ensure the stipulated deadlines are met and complied|5 WD|5 WD|3.5 WD', null);
insert into detail_records (id, entity_id, period_id, record_type, label, category, value_num, value_num2, text_note, flag) values ('SEED-0092', 'HQ', 'Q2FY25', 'managed_entity_kpi', 'Verification and reconciliation of monthly reports from participating FIs', 'SJKP', 4, 0.29, 'd(iii)|Ensure the stipulated deadlines are met and complied|5 WD|5 WD|3.3 WD', null);
insert into detail_records (id, entity_id, period_id, record_type, label, category, value_num, value_num2, text_note, flag) values ('SEED-0093', 'HQ', 'Q3FY25', 'managed_entity_kpi', 'Verification and reconciliation of monthly reports from participating FIs', 'SJKP', 4, 0.29, 'd(iii)|Ensure the stipulated deadlines are met and complied|5 WD|5 WD|3.2 WD', null);
insert into detail_records (id, entity_id, period_id, record_type, label, category, value_num, value_num2, text_note, flag) values ('SEED-0094', 'HQ', 'Q4FY25', 'managed_entity_kpi', 'Verification and reconciliation of monthly reports from participating FIs', 'SJKP', 4, 0.29, 'd(iii)|Ensure the stipulated deadlines are met and complied|5 WD|5 WD|3.1 WD', null);
insert into detail_records (id, entity_id, period_id, record_type, label, category, value_num, value_num2, text_note, flag) values ('SEED-0095', 'HQ', 'Q1FY26', 'managed_entity_kpi', 'Verification and reconciliation of monthly reports from participating FIs', 'SJKP', 4, 0.29, 'd(iii)|Ensure the stipulated deadlines are met and complied|5 WD|5 WD|3.0 WD', null);
insert into detail_records (id, entity_id, period_id, record_type, label, category, value_num, value_num2, text_note, flag) values ('SEED-0096', 'HQ', 'Q2FY26', 'managed_entity_kpi', 'Verification and reconciliation of monthly reports from participating FIs', 'SJKP', 4, 0.29, 'd(iii)|Ensure the stipulated deadlines are met and complied|5 WD|5 WD|2.8 WD', null);
insert into detail_records (id, entity_id, period_id, record_type, label, category, value_num, value_num2, text_note, flag) values ('SEED-0097', 'HQ', 'Q1FY25', 'managed_entity_kpi', 'Engagements with FIs and key stakeholders through regular sessions, events, and collaborations', 'SJKP', 5, 0.36, 'e|Enhance engagement and awareness|65 sessions|16 sessions|30 sessions', null);
insert into detail_records (id, entity_id, period_id, record_type, label, category, value_num, value_num2, text_note, flag) values ('SEED-0098', 'HQ', 'Q2FY25', 'managed_entity_kpi', 'Engagements with FIs and key stakeholders through regular sessions, events, and collaborations', 'SJKP', 5, 0.36, 'e|Enhance engagement and awareness|65 sessions|32 sessions|44 sessions', null);
insert into detail_records (id, entity_id, period_id, record_type, label, category, value_num, value_num2, text_note, flag) values ('SEED-0099', 'HQ', 'Q3FY25', 'managed_entity_kpi', 'Engagements with FIs and key stakeholders through regular sessions, events, and collaborations', 'SJKP', 5, 0.36, 'e|Enhance engagement and awareness|65 sessions|49 sessions|58 sessions', null);
insert into detail_records (id, entity_id, period_id, record_type, label, category, value_num, value_num2, text_note, flag) values ('SEED-0100', 'HQ', 'Q4FY25', 'managed_entity_kpi', 'Engagements with FIs and key stakeholders through regular sessions, events, and collaborations', 'SJKP', 4, 0.29, 'e|Enhance engagement and awareness|65 sessions|65 sessions|63 sessions', null);
insert into detail_records (id, entity_id, period_id, record_type, label, category, value_num, value_num2, text_note, flag) values ('SEED-0101', 'HQ', 'Q1FY26', 'managed_entity_kpi', 'Engagements with FIs and key stakeholders through regular sessions, events, and collaborations', 'SJKP', 5, 0.36, 'e|Enhance engagement and awareness|80 sessions|20 sessions|47 sessions', null);
insert into detail_records (id, entity_id, period_id, record_type, label, category, value_num, value_num2, text_note, flag) values ('SEED-0102', 'HQ', 'Q2FY26', 'managed_entity_kpi', 'Engagements with FIs and key stakeholders through regular sessions, events, and collaborations', 'SJKP', 5, 0.36, 'e|Enhance engagement and awareness|80 sessions|40 sessions|68 sessions', null);
insert into detail_records (id, entity_id, period_id, record_type, label, category, value_num, value_num2, text_note, flag) values ('SEED-0103', 'HQ', 'Q1FY25', 'managed_entity_kpi', 'Facilitate home financing access to segments identified in NB — assist 1st time house buyer to gain access to home financing under the SJKP schemes', 'SJKP', 2, 0.14, 'f|Home financing access|32,000 borrowers|8,000 borrowers|5,200 borrowers', null);
insert into detail_records (id, entity_id, period_id, record_type, label, category, value_num, value_num2, text_note, flag) values ('SEED-0104', 'HQ', 'Q2FY25', 'managed_entity_kpi', 'Facilitate home financing access to segments identified in NB — assist 1st time house buyer to gain access to home financing under the SJKP schemes', 'SJKP', 2, 0.14, 'f|Home financing access|32,000 borrowers|16,000 borrowers|10,800 borrowers', null);
insert into detail_records (id, entity_id, period_id, record_type, label, category, value_num, value_num2, text_note, flag) values ('SEED-0105', 'HQ', 'Q3FY25', 'managed_entity_kpi', 'Facilitate home financing access to segments identified in NB — assist 1st time house buyer to gain access to home financing under the SJKP schemes', 'SJKP', 2, 0.14, 'f|Home financing access|32,000 borrowers|24,000 borrowers|17,000 borrowers', null);
insert into detail_records (id, entity_id, period_id, record_type, label, category, value_num, value_num2, text_note, flag) values ('SEED-0106', 'HQ', 'Q4FY25', 'managed_entity_kpi', 'Facilitate home financing access to segments identified in NB — assist 1st time house buyer to gain access to home financing under the SJKP schemes', 'SJKP', 3, 0.22, 'f|Home financing access|32,000 borrowers|32,000 borrowers|24,500 borrowers', null);
insert into detail_records (id, entity_id, period_id, record_type, label, category, value_num, value_num2, text_note, flag) values ('SEED-0107', 'HQ', 'Q1FY26', 'managed_entity_kpi', 'Facilitate home financing access to segments identified in NB — assist 1st time house buyer to gain access to home financing under the SJKP schemes', 'SJKP', 1, 0.07, 'f|Home financing access|40,000 borrowers|10,000 borrowers|6,513 borrowers', null);
insert into detail_records (id, entity_id, period_id, record_type, label, category, value_num, value_num2, text_note, flag) values ('SEED-0108', 'HQ', 'Q2FY26', 'managed_entity_kpi', 'Facilitate home financing access to segments identified in NB — assist 1st time house buyer to gain access to home financing under the SJKP schemes', 'SJKP', 2, 0.14, 'f|Home financing access|40,000 borrowers|20,000 borrowers|14,200 borrowers', null);
insert into detail_records (id, entity_id, period_id, record_type, label, category, value_num, value_num2, text_note, flag) values ('SEED-0109', 'HQ', 'Q1FY25', 'managed_entity_kpi', 'Fundraising / financing activities (applicable for new mandate)', 'DanaInfra', 5, 0.36, 'g(i)|Timeliness of meeting requirements through timely|6 months from complete RFP|6 months from complete RFP|3.5 months', null);
insert into detail_records (id, entity_id, period_id, record_type, label, category, value_num, value_num2, text_note, flag) values ('SEED-0110', 'HQ', 'Q2FY25', 'managed_entity_kpi', 'Fundraising / financing activities (applicable for new mandate)', 'DanaInfra', 5, 0.36, 'g(i)|Timeliness of meeting requirements through timely|6 months from complete RFP|6 months from complete RFP|3.2 months', null);
insert into detail_records (id, entity_id, period_id, record_type, label, category, value_num, value_num2, text_note, flag) values ('SEED-0111', 'HQ', 'Q3FY25', 'managed_entity_kpi', 'Fundraising / financing activities (applicable for new mandate)', 'DanaInfra', 5, 0.36, 'g(i)|Timeliness of meeting requirements through timely|6 months from complete RFP|6 months from complete RFP|3.0 months', null);
insert into detail_records (id, entity_id, period_id, record_type, label, category, value_num, value_num2, text_note, flag) values ('SEED-0112', 'HQ', 'Q4FY25', 'managed_entity_kpi', 'Fundraising / financing activities (applicable for new mandate)', 'DanaInfra', 5, 0.36, 'g(i)|Timeliness of meeting requirements through timely|6 months from complete RFP|6 months from complete RFP|2.9 months', null);
insert into detail_records (id, entity_id, period_id, record_type, label, category, value_num, value_num2, text_note, flag) values ('SEED-0113', 'HQ', 'Q1FY26', 'managed_entity_kpi', 'Fundraising / financing activities (applicable for new mandate)', 'DanaInfra', 5, 0.36, 'g(i)|Timeliness of meeting requirements through timely|6 months from complete RFP|6 months from complete RFP|2.8 months', null);
insert into detail_records (id, entity_id, period_id, record_type, label, category, value_num, value_num2, text_note, flag) values ('SEED-0114', 'HQ', 'Q2FY26', 'managed_entity_kpi', 'Fundraising / financing activities (applicable for new mandate)', 'DanaInfra', 5, 0.36, 'g(i)|Timeliness of meeting requirements through timely|6 months from complete RFP|6 months from complete RFP|2.6 months', null);
insert into detail_records (id, entity_id, period_id, record_type, label, category, value_num, value_num2, text_note, flag) values ('SEED-0115', 'HQ', 'Q1FY25', 'managed_entity_kpi', 'Disbursement of funds made on disbursement date (applicable for existing mandates)', 'DanaInfra', 5, 0.36, 'g(ii)|Timeliness of meeting requirements through timely|90% of funding requests|90% of funding requests|95% of funding requests', null);
insert into detail_records (id, entity_id, period_id, record_type, label, category, value_num, value_num2, text_note, flag) values ('SEED-0116', 'HQ', 'Q2FY25', 'managed_entity_kpi', 'Disbursement of funds made on disbursement date (applicable for existing mandates)', 'DanaInfra', 5, 0.36, 'g(ii)|Timeliness of meeting requirements through timely|90% of funding requests|90% of funding requests|97% of funding requests', null);
insert into detail_records (id, entity_id, period_id, record_type, label, category, value_num, value_num2, text_note, flag) values ('SEED-0117', 'HQ', 'Q3FY25', 'managed_entity_kpi', 'Disbursement of funds made on disbursement date (applicable for existing mandates)', 'DanaInfra', 5, 0.36, 'g(ii)|Timeliness of meeting requirements through timely|90% of funding requests|90% of funding requests|98% of funding requests', null);
insert into detail_records (id, entity_id, period_id, record_type, label, category, value_num, value_num2, text_note, flag) values ('SEED-0118', 'HQ', 'Q4FY25', 'managed_entity_kpi', 'Disbursement of funds made on disbursement date (applicable for existing mandates)', 'DanaInfra', 5, 0.36, 'g(ii)|Timeliness of meeting requirements through timely|90% of funding requests|90% of funding requests|100% of funding requests', null);
insert into detail_records (id, entity_id, period_id, record_type, label, category, value_num, value_num2, text_note, flag) values ('SEED-0119', 'HQ', 'Q1FY26', 'managed_entity_kpi', 'Disbursement of funds made on disbursement date (applicable for existing mandates)', 'DanaInfra', 5, 0.36, 'g(ii)|Timeliness of meeting requirements through timely|90% of funding requests|90% of funding requests|100% of funding requests', null);
insert into detail_records (id, entity_id, period_id, record_type, label, category, value_num, value_num2, text_note, flag) values ('SEED-0120', 'HQ', 'Q2FY26', 'managed_entity_kpi', 'Disbursement of funds made on disbursement date (applicable for existing mandates)', 'DanaInfra', 5, 0.36, 'g(ii)|Timeliness of meeting requirements through timely|90% of funding requests|90% of funding requests|100% of funding requests', null);
insert into detail_records (id, entity_id, period_id, record_type, label, category, value_num, value_num2, text_note, flag) values ('SEED-0121', 'HQ', 'Q1FY25', 'managed_entity_kpi', 'Obtain optimal financing cost in fundraising', 'DanaInfra', 5, 0.36, 'h|Fundraising financing cost|>80% of fundraising achieved targeted financing cost|>80% of fundraising achieved targeted financing cost|92% of fundraising achieved targeted financing cost', null);
insert into detail_records (id, entity_id, period_id, record_type, label, category, value_num, value_num2, text_note, flag) values ('SEED-0122', 'HQ', 'Q2FY25', 'managed_entity_kpi', 'Obtain optimal financing cost in fundraising', 'DanaInfra', 5, 0.36, 'h|Fundraising financing cost|>80% of fundraising achieved targeted financing cost|>80% of fundraising achieved targeted financing cost|95% of fundraising achieved targeted financing cost', null);
insert into detail_records (id, entity_id, period_id, record_type, label, category, value_num, value_num2, text_note, flag) values ('SEED-0123', 'HQ', 'Q3FY25', 'managed_entity_kpi', 'Obtain optimal financing cost in fundraising', 'DanaInfra', 5, 0.36, 'h|Fundraising financing cost|>80% of fundraising achieved targeted financing cost|>80% of fundraising achieved targeted financing cost|97% of fundraising achieved targeted financing cost', null);
insert into detail_records (id, entity_id, period_id, record_type, label, category, value_num, value_num2, text_note, flag) values ('SEED-0124', 'HQ', 'Q4FY25', 'managed_entity_kpi', 'Obtain optimal financing cost in fundraising', 'DanaInfra', 5, 0.36, 'h|Fundraising financing cost|>80% of fundraising achieved targeted financing cost|>80% of fundraising achieved targeted financing cost|100% of fundraising achieved targeted financing cost', null);
insert into detail_records (id, entity_id, period_id, record_type, label, category, value_num, value_num2, text_note, flag) values ('SEED-0125', 'HQ', 'Q1FY26', 'managed_entity_kpi', 'Obtain optimal financing cost in fundraising', 'DanaInfra', 5, 0.36, 'h|Fundraising financing cost|>80% of fundraising achieved targeted financing cost|>80% of fundraising achieved targeted financing cost|100% of fundraising achieved targeted financing cost', null);
insert into detail_records (id, entity_id, period_id, record_type, label, category, value_num, value_num2, text_note, flag) values ('SEED-0126', 'HQ', 'Q2FY26', 'managed_entity_kpi', 'Obtain optimal financing cost in fundraising', 'DanaInfra', 5, 0.36, 'h|Fundraising financing cost|>80% of fundraising achieved targeted financing cost|>80% of fundraising achieved targeted financing cost|100% of fundraising achieved targeted financing cost', null);
insert into detail_records (id, entity_id, period_id, record_type, label, category, value_num, value_num2, text_note, flag) values ('SEED-0127', 'HQ', 'Q1FY25', 'managed_entity_kpi', 'Send reminder to MoF for GovCo''s upcoming principal / profit payments', 'GovCo', 5, 0.36, 'j|Principal / profit payments|4 weeks to principal / profit payment date|4 weeks to principal / profit payment date|9.5 weeks to principal / profit payment date', null);
insert into detail_records (id, entity_id, period_id, record_type, label, category, value_num, value_num2, text_note, flag) values ('SEED-0128', 'HQ', 'Q2FY25', 'managed_entity_kpi', 'Send reminder to MoF for GovCo''s upcoming principal / profit payments', 'GovCo', 5, 0.36, 'j|Principal / profit payments|4 weeks to principal / profit payment date|4 weeks to principal / profit payment date|10.2 weeks to principal / profit payment date', null);
insert into detail_records (id, entity_id, period_id, record_type, label, category, value_num, value_num2, text_note, flag) values ('SEED-0129', 'HQ', 'Q3FY25', 'managed_entity_kpi', 'Send reminder to MoF for GovCo''s upcoming principal / profit payments', 'GovCo', 5, 0.36, 'j|Principal / profit payments|4 weeks to principal / profit payment date|4 weeks to principal / profit payment date|10.8 weeks to principal / profit payment date', null);
insert into detail_records (id, entity_id, period_id, record_type, label, category, value_num, value_num2, text_note, flag) values ('SEED-0130', 'HQ', 'Q4FY25', 'managed_entity_kpi', 'Send reminder to MoF for GovCo''s upcoming principal / profit payments', 'GovCo', 5, 0.36, 'j|Principal / profit payments|4 weeks to principal / profit payment date|4 weeks to principal / profit payment date|11.2 weeks to principal / profit payment date', null);
insert into detail_records (id, entity_id, period_id, record_type, label, category, value_num, value_num2, text_note, flag) values ('SEED-0131', 'HQ', 'Q1FY26', 'managed_entity_kpi', 'Send reminder to MoF for GovCo''s upcoming principal / profit payments', 'GovCo', 5, 0.36, 'j|Principal / profit payments|4 weeks to principal / profit payment date|4 weeks to principal / profit payment date|11.7 weeks to principal / profit payment date', null);
insert into detail_records (id, entity_id, period_id, record_type, label, category, value_num, value_num2, text_note, flag) values ('SEED-0132', 'HQ', 'Q2FY26', 'managed_entity_kpi', 'Send reminder to MoF for GovCo''s upcoming principal / profit payments', 'GovCo', 5, 0.36, 'j|Principal / profit payments|4 weeks to principal / profit payment date|4 weeks to principal / profit payment date|12.1 weeks to principal / profit payment date', null);
insert into detail_records (id, entity_id, period_id, record_type, label, category, value_num, value_num2, text_note, flag) values ('SEED-0133', 'HQ', 'Q1FY25', 'managed_entity_kpi', 'Finalisation of outstanding recovery / settlement cases within the period', 'DanaHarta', 4, 0.29, 'k|Ensure timely closure of assigned mandates|90.0% of cases closed|90.0% of cases closed|80.0% of cases closed', null);
insert into detail_records (id, entity_id, period_id, record_type, label, category, value_num, value_num2, text_note, flag) values ('SEED-0134', 'HQ', 'Q2FY25', 'managed_entity_kpi', 'Finalisation of outstanding recovery / settlement cases within the period', 'DanaHarta', 4, 0.29, 'k|Ensure timely closure of assigned mandates|90.0% of cases closed|90.0% of cases closed|83.0% of cases closed', null);
insert into detail_records (id, entity_id, period_id, record_type, label, category, value_num, value_num2, text_note, flag) values ('SEED-0135', 'HQ', 'Q3FY25', 'managed_entity_kpi', 'Finalisation of outstanding recovery / settlement cases within the period', 'DanaHarta', 4, 0.29, 'k|Ensure timely closure of assigned mandates|90.0% of cases closed|90.0% of cases closed|86.0% of cases closed', null);
insert into detail_records (id, entity_id, period_id, record_type, label, category, value_num, value_num2, text_note, flag) values ('SEED-0136', 'HQ', 'Q4FY25', 'managed_entity_kpi', 'Finalisation of outstanding recovery / settlement cases within the period', 'DanaHarta', 4, 0.29, 'k|Ensure timely closure of assigned mandates|90.0% of cases closed|90.0% of cases closed|89.0% of cases closed', null);
insert into detail_records (id, entity_id, period_id, record_type, label, category, value_num, value_num2, text_note, flag) values ('SEED-0137', 'HQ', 'Q1FY26', 'managed_entity_kpi', 'Finalisation of outstanding recovery / settlement cases within the period', 'DanaHarta', 4, 0.29, 'k|Ensure timely closure of assigned mandates|90.0% of cases closed|90.0% of cases closed|84.0% of cases closed', null);
insert into detail_records (id, entity_id, period_id, record_type, label, category, value_num, value_num2, text_note, flag) values ('SEED-0138', 'HQ', 'Q2FY26', 'managed_entity_kpi', 'Finalisation of outstanding recovery / settlement cases within the period', 'DanaHarta', 4, 0.29, 'k|Ensure timely closure of assigned mandates|90.0% of cases closed|90.0% of cases closed|86.0% of cases closed', null);
insert into detail_records (id, entity_id, period_id, record_type, label, category, value_num, value_num2, text_note, flag) values ('SEED-0139', 'HQ', 'Q1FY25', 'managed_entity_kpi', 'Submission of quarterly recovery and compliance reports to relevant authorities', 'DanaHarta', 5, 0.36, 'l|Governance and reporting compliance|4 reports (timely)|1 reports (timely)|1 reports (timely)', null);
insert into detail_records (id, entity_id, period_id, record_type, label, category, value_num, value_num2, text_note, flag) values ('SEED-0140', 'HQ', 'Q2FY25', 'managed_entity_kpi', 'Submission of quarterly recovery and compliance reports to relevant authorities', 'DanaHarta', 5, 0.36, 'l|Governance and reporting compliance|4 reports (timely)|2 reports (timely)|2 reports (timely)', null);
insert into detail_records (id, entity_id, period_id, record_type, label, category, value_num, value_num2, text_note, flag) values ('SEED-0141', 'HQ', 'Q3FY25', 'managed_entity_kpi', 'Submission of quarterly recovery and compliance reports to relevant authorities', 'DanaHarta', 5, 0.36, 'l|Governance and reporting compliance|4 reports (timely)|3 reports (timely)|3 reports (timely)', null);
insert into detail_records (id, entity_id, period_id, record_type, label, category, value_num, value_num2, text_note, flag) values ('SEED-0142', 'HQ', 'Q4FY25', 'managed_entity_kpi', 'Submission of quarterly recovery and compliance reports to relevant authorities', 'DanaHarta', 5, 0.36, 'l|Governance and reporting compliance|4 reports (timely)|4 reports (timely)|4 reports (timely)', null);
insert into detail_records (id, entity_id, period_id, record_type, label, category, value_num, value_num2, text_note, flag) values ('SEED-0143', 'HQ', 'Q1FY26', 'managed_entity_kpi', 'Submission of quarterly recovery and compliance reports to relevant authorities', 'DanaHarta', 5, 0.36, 'l|Governance and reporting compliance|4 reports (timely)|1 reports (timely)|1 reports (timely)', null);
insert into detail_records (id, entity_id, period_id, record_type, label, category, value_num, value_num2, text_note, flag) values ('SEED-0144', 'HQ', 'Q2FY26', 'managed_entity_kpi', 'Submission of quarterly recovery and compliance reports to relevant authorities', 'DanaHarta', 5, 0.36, 'l|Governance and reporting compliance|4 reports (timely)|2 reports (timely)|2 reports (timely)', null);
insert into detail_records (id, entity_id, period_id, record_type, label, category, value_num, value_num2, text_note, flag) values ('SEED-0145', 'HQ', 'Q1FY25', 'managed_entity_kpi', 'Engagement sessions with government agencies and financial institutions', 'DanaHarta', 2, 0.14, 'm|Stakeholder engagement|20 sessions|5 sessions|3 sessions', null);
insert into detail_records (id, entity_id, period_id, record_type, label, category, value_num, value_num2, text_note, flag) values ('SEED-0146', 'HQ', 'Q2FY25', 'managed_entity_kpi', 'Engagement sessions with government agencies and financial institutions', 'DanaHarta', 3, 0.22, 'm|Stakeholder engagement|20 sessions|10 sessions|7 sessions', null);
insert into detail_records (id, entity_id, period_id, record_type, label, category, value_num, value_num2, text_note, flag) values ('SEED-0147', 'HQ', 'Q3FY25', 'managed_entity_kpi', 'Engagement sessions with government agencies and financial institutions', 'DanaHarta', 4, 0.29, 'm|Stakeholder engagement|20 sessions|15 sessions|13 sessions', null);
insert into detail_records (id, entity_id, period_id, record_type, label, category, value_num, value_num2, text_note, flag) values ('SEED-0148', 'HQ', 'Q4FY25', 'managed_entity_kpi', 'Engagement sessions with government agencies and financial institutions', 'DanaHarta', 4, 0.29, 'm|Stakeholder engagement|20 sessions|20 sessions|19 sessions', null);
insert into detail_records (id, entity_id, period_id, record_type, label, category, value_num, value_num2, text_note, flag) values ('SEED-0149', 'HQ', 'Q1FY26', 'managed_entity_kpi', 'Engagement sessions with government agencies and financial institutions', 'DanaHarta', 1, 0.07, 'm|Stakeholder engagement|20 sessions|5 sessions|2 sessions', null);
insert into detail_records (id, entity_id, period_id, record_type, label, category, value_num, value_num2, text_note, flag) values ('SEED-0150', 'HQ', 'Q2FY26', 'managed_entity_kpi', 'Engagement sessions with government agencies and financial institutions', 'DanaHarta', 2, 0.14, 'm|Stakeholder engagement|20 sessions|10 sessions|5 sessions', null);
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
-- Governance Index (KPI4) component breakdown — five equally-weighted (20% each) components.
-- Q1 FY2026 is the client's real reported data; FY2025 quarters are illustrative dummy data.
insert into detail_records (id, entity_id, period_id, record_type, label, category, value_num, value_num2, text_note, flag) values ('SEED-0151', 'HQ', 'Q1FY25', 'governance_kpi', 'Audit closure against the total audit observations due for implementation within the period', null, null, 11.2, '1|80.0%|45.0%|56.2', null);
insert into detail_records (id, entity_id, period_id, record_type, label, category, value_num, value_num2, text_note, flag) values ('SEED-0152', 'HQ', 'Q2FY25', 'governance_kpi', 'Audit closure against the total audit observations due for implementation within the period', null, null, 14.5, '1|80.0%|58.0%|72.5', null);
insert into detail_records (id, entity_id, period_id, record_type, label, category, value_num, value_num2, text_note, flag) values ('SEED-0153', 'HQ', 'Q3FY25', 'governance_kpi', 'Audit closure against the total audit observations due for implementation within the period', null, null, 17.5, '1|80.0%|70.0%|87.5', null);
insert into detail_records (id, entity_id, period_id, record_type, label, category, value_num, value_num2, text_note, flag) values ('SEED-0154', 'HQ', 'Q4FY25', 'governance_kpi', 'Audit closure against the total audit observations due for implementation within the period', null, null, 20.0, '1|80.0%|82.0%|102.5', null);
insert into detail_records (id, entity_id, period_id, record_type, label, category, value_num, value_num2, text_note, flag) values ('SEED-0155', 'HQ', 'Q1FY26', 'governance_kpi', 'Audit closure against the total audit observations due for implementation within the period', null, null, 13.2, '1|85.0%|56.0%|65.9', null);
insert into detail_records (id, entity_id, period_id, record_type, label, category, value_num, value_num2, text_note, flag) values ('SEED-0156', 'HQ', 'Q2FY26', 'governance_kpi', 'Audit closure against the total audit observations due for implementation within the period', null, null, 16.0, '1|85.0%|68.0%|80.0', null);
insert into detail_records (id, entity_id, period_id, record_type, label, category, value_num, value_num2, text_note, flag) values ('SEED-0157', 'HQ', 'Q1FY25', 'governance_kpi', 'Achieve satisfactory rating (rating 3) in audit findings within the period', null, null, 14.7, '2|Rating 3.0|Rating 2.2|73.3', null);
insert into detail_records (id, entity_id, period_id, record_type, label, category, value_num, value_num2, text_note, flag) values ('SEED-0158', 'HQ', 'Q2FY25', 'governance_kpi', 'Achieve satisfactory rating (rating 3) in audit findings within the period', null, null, 16.0, '2|Rating 3.0|Rating 2.4|80.0', null);
insert into detail_records (id, entity_id, period_id, record_type, label, category, value_num, value_num2, text_note, flag) values ('SEED-0159', 'HQ', 'Q3FY25', 'governance_kpi', 'Achieve satisfactory rating (rating 3) in audit findings within the period', null, null, 18.0, '2|Rating 3.0|Rating 2.7|90.0', null);
insert into detail_records (id, entity_id, period_id, record_type, label, category, value_num, value_num2, text_note, flag) values ('SEED-0160', 'HQ', 'Q4FY25', 'governance_kpi', 'Achieve satisfactory rating (rating 3) in audit findings within the period', null, null, 20.0, '2|Rating 3.0|Rating 3.1|103.3', null);
insert into detail_records (id, entity_id, period_id, record_type, label, category, value_num, value_num2, text_note, flag) values ('SEED-0161', 'HQ', 'Q1FY26', 'governance_kpi', 'Achieve satisfactory rating (rating 3) in audit findings within the period', null, null, 16.7, '2|Rating 3.0|Rating 2.5|83.3', null);
insert into detail_records (id, entity_id, period_id, record_type, label, category, value_num, value_num2, text_note, flag) values ('SEED-0162', 'HQ', 'Q2FY26', 'governance_kpi', 'Achieve satisfactory rating (rating 3) in audit findings within the period', null, null, 18.7, '2|Rating 3.0|Rating 2.8|93.3', null);
insert into detail_records (id, entity_id, period_id, record_type, label, category, value_num, value_num2, text_note, flag) values ('SEED-0163', 'HQ', 'Q1FY25', 'governance_kpi', 'Implementation of Risk Action Plan ("RAP") within the timeline', null, null, 15.5, '3|75.0%|58.0%|77.3', null);
insert into detail_records (id, entity_id, period_id, record_type, label, category, value_num, value_num2, text_note, flag) values ('SEED-0164', 'HQ', 'Q2FY25', 'governance_kpi', 'Implementation of Risk Action Plan ("RAP") within the timeline', null, null, 18.1, '3|75.0%|68.0%|90.7', null);
insert into detail_records (id, entity_id, period_id, record_type, label, category, value_num, value_num2, text_note, flag) values ('SEED-0165', 'HQ', 'Q3FY25', 'governance_kpi', 'Implementation of Risk Action Plan ("RAP") within the timeline', null, null, 20.0, '3|75.0%|76.0%|101.3', null);
insert into detail_records (id, entity_id, period_id, record_type, label, category, value_num, value_num2, text_note, flag) values ('SEED-0166', 'HQ', 'Q4FY25', 'governance_kpi', 'Implementation of Risk Action Plan ("RAP") within the timeline', null, null, 20.0, '3|75.0%|90.0%|120.0', null);
insert into detail_records (id, entity_id, period_id, record_type, label, category, value_num, value_num2, text_note, flag) values ('SEED-0167', 'HQ', 'Q1FY26', 'governance_kpi', 'Implementation of Risk Action Plan ("RAP") within the timeline', null, null, 20.0, '3|80.0%|100.0%|125.0', null);
insert into detail_records (id, entity_id, period_id, record_type, label, category, value_num, value_num2, text_note, flag) values ('SEED-0168', 'HQ', 'Q2FY26', 'governance_kpi', 'Implementation of Risk Action Plan ("RAP") within the timeline', null, null, 20.0, '3|80.0%|100.0%|125.0', null);
insert into detail_records (id, entity_id, period_id, record_type, label, category, value_num, value_num2, text_note, flag) values ('SEED-0169', 'HQ', 'Q1FY25', 'governance_kpi', 'Completion of Organisational Anti-Corruption Strategy ("OACS") initiatives as planned', null, null, 20.0, '4|75.0%|N/A – No initiatives due in Q1 2025|', null);
insert into detail_records (id, entity_id, period_id, record_type, label, category, value_num, value_num2, text_note, flag) values ('SEED-0170', 'HQ', 'Q2FY25', 'governance_kpi', 'Completion of Organisational Anti-Corruption Strategy ("OACS") initiatives as planned', null, null, 10.7, '4|75.0%|40.0%|53.3', null);
insert into detail_records (id, entity_id, period_id, record_type, label, category, value_num, value_num2, text_note, flag) values ('SEED-0171', 'HQ', 'Q3FY25', 'governance_kpi', 'Completion of Organisational Anti-Corruption Strategy ("OACS") initiatives as planned', null, null, 16.5, '4|75.0%|62.0%|82.7', null);
insert into detail_records (id, entity_id, period_id, record_type, label, category, value_num, value_num2, text_note, flag) values ('SEED-0172', 'HQ', 'Q4FY25', 'governance_kpi', 'Completion of Organisational Anti-Corruption Strategy ("OACS") initiatives as planned', null, null, 20.0, '4|75.0%|78.0%|104.0', null);
insert into detail_records (id, entity_id, period_id, record_type, label, category, value_num, value_num2, text_note, flag) values ('SEED-0173', 'HQ', 'Q1FY26', 'governance_kpi', 'Completion of Organisational Anti-Corruption Strategy ("OACS") initiatives as planned', null, null, 20.0, '4|80.0%|N/A – No initiatives due in Q1 2026|', null);
insert into detail_records (id, entity_id, period_id, record_type, label, category, value_num, value_num2, text_note, flag) values ('SEED-0174', 'HQ', 'Q2FY26', 'governance_kpi', 'Completion of Organisational Anti-Corruption Strategy ("OACS") initiatives as planned', null, null, 8.8, '4|80.0%|35.0%|43.8', null);
insert into detail_records (id, entity_id, period_id, record_type, label, category, value_num, value_num2, text_note, flag) values ('SEED-0175', 'HQ', 'Q1FY25', 'governance_kpi', 'Zero cases under Malaysian Anti-Corruption Commission ("MACC")', null, null, 20.0, '5|0 cases|0 cases|100.0', null);
insert into detail_records (id, entity_id, period_id, record_type, label, category, value_num, value_num2, text_note, flag) values ('SEED-0176', 'HQ', 'Q2FY25', 'governance_kpi', 'Zero cases under Malaysian Anti-Corruption Commission ("MACC")', null, null, 20.0, '5|0 cases|0 cases|100.0', null);
insert into detail_records (id, entity_id, period_id, record_type, label, category, value_num, value_num2, text_note, flag) values ('SEED-0177', 'HQ', 'Q3FY25', 'governance_kpi', 'Zero cases under Malaysian Anti-Corruption Commission ("MACC")', null, null, 20.0, '5|0 cases|0 cases|100.0', null);
insert into detail_records (id, entity_id, period_id, record_type, label, category, value_num, value_num2, text_note, flag) values ('SEED-0178', 'HQ', 'Q4FY25', 'governance_kpi', 'Zero cases under Malaysian Anti-Corruption Commission ("MACC")', null, null, 20.0, '5|0 cases|0 cases|100.0', null);
insert into detail_records (id, entity_id, period_id, record_type, label, category, value_num, value_num2, text_note, flag) values ('SEED-0179', 'HQ', 'Q1FY26', 'governance_kpi', 'Zero cases under Malaysian Anti-Corruption Commission ("MACC")', null, null, 20.0, '5|0 cases|0 cases|100.0', null);
insert into detail_records (id, entity_id, period_id, record_type, label, category, value_num, value_num2, text_note, flag) values ('SEED-0180', 'HQ', 'Q2FY26', 'governance_kpi', 'Zero cases under Malaysian Anti-Corruption Commission ("MACC")', null, null, 20.0, '5|0 cases|0 cases|100.0', null);
insert into detail_records (id, entity_id, period_id, record_type, label, category, value_num, value_num2, text_note, flag) values ('SEED-0024', 'HQ', 'Q1FY26', 'client_satisfaction', 'External Client Satisfaction', null, 4.7, null, 'Bi-annual client survey — next round scheduled Q2 FY2026', null);

-- Related Party Transactions (PFH005) — quarter-over-quarter, RM'000, matching the client's own
-- RPT report format: category (dimension) + "subheading|party" (dimension2).
insert into detail_metrics (entity_id, period_id, metric_key, dimension, dimension2, value, note) values ('HQ', 'Q4FY25', 'related_party_txn', 'A. Subsidiary companies', 'Management fee|PAMSB', 10277, null);
insert into detail_metrics (entity_id, period_id, metric_key, dimension, dimension2, value, note) values ('HQ', 'Q4FY25', 'related_party_txn', 'B. Related corporations', 'Management fee|PDNB', 245, null);
insert into detail_metrics (entity_id, period_id, metric_key, dimension, dimension2, value, note) values ('HQ', 'Q4FY25', 'related_party_txn', 'B. Related corporations', 'Management fee|SJPP', 35705, null);
insert into detail_metrics (entity_id, period_id, metric_key, dimension, dimension2, value, note) values ('HQ', 'Q4FY25', 'related_party_txn', 'B. Related corporations', 'Management fee|SJKP', 3587, null);
insert into detail_metrics (entity_id, period_id, metric_key, dimension, dimension2, value, note) values ('HQ', 'Q4FY25', 'related_party_txn', 'B. Related corporations', 'Management fee|DINB', 3300, null);
insert into detail_metrics (entity_id, period_id, metric_key, dimension, dimension2, value, note) values ('HQ', 'Q4FY25', 'related_party_txn', 'B. Related corporations', 'Management fee|GOVCO', 125, null);
insert into detail_metrics (entity_id, period_id, metric_key, dimension, dimension2, value, note) values ('HQ', 'Q4FY25', 'related_party_txn', 'B. Related corporations', 'Advisory / outsourcing services|DINB', 7, null);
insert into detail_metrics (entity_id, period_id, metric_key, dimension, dimension2, value, note) values ('HQ', 'Q1FY26', 'related_party_txn', 'A. Subsidiary companies', 'Management fee|PAMSB', 3503, null);
insert into detail_metrics (entity_id, period_id, metric_key, dimension, dimension2, value, note) values ('HQ', 'Q1FY26', 'related_party_txn', 'B. Related corporations', 'Management fee|PDNB', 249, null);
insert into detail_metrics (entity_id, period_id, metric_key, dimension, dimension2, value, note) values ('HQ', 'Q1FY26', 'related_party_txn', 'B. Related corporations', 'Management fee|SJPP', 34928, null);
insert into detail_metrics (entity_id, period_id, metric_key, dimension, dimension2, value, note) values ('HQ', 'Q1FY26', 'related_party_txn', 'B. Related corporations', 'Management fee|SJKP', 3355, null);
insert into detail_metrics (entity_id, period_id, metric_key, dimension, dimension2, value, note) values ('HQ', 'Q1FY26', 'related_party_txn', 'B. Related corporations', 'Management fee|DINB', 3300, null);
insert into detail_metrics (entity_id, period_id, metric_key, dimension, dimension2, value, note) values ('HQ', 'Q1FY26', 'related_party_txn', 'B. Related corporations', 'Management fee|GOVCO', 125, null);
insert into detail_metrics (entity_id, period_id, metric_key, dimension, dimension2, value, note) values ('HQ', 'Q1FY26', 'related_party_txn', 'B. Related corporations', 'Advisory / outsourcing services|DINB', 7, null);

-- People Development Programme (CP009) — not measured in Q1, progress-only reporting.
-- category is one of PEOPLE_DEV_SUB_AREAS in src/lib/details.tsx; text_note packs
-- "start|end|status|detail" the same way CP009's own add/edit form writes it.
insert into detail_records (id, entity_id, period_id, record_type, label, category, value_num, value_num2, text_note, flag) values ('PDP-Q1FY25-001', 'HQ', 'Q1FY25', 'people_dev_programme', 'Continuation of LDPs', 'Talent Management', null, null, 'May ''26|Dec ''26|Planned|Continuation of 2025 LDPs; implementation of planned modules as per the approved programme plan. Total sessions to be conducted in 2026: 23 sessions - ELDP 3 modules x 3 sessions, MLDP 3 modules x 4 sessions, ISLDP 2 modules x 1 session. Not yet started as of this reporting period.', null);
insert into detail_records (id, entity_id, period_id, record_type, label, category, value_num, value_num2, text_note, flag) values ('PDP-Q1FY25-002', 'HQ', 'Q1FY25', 'people_dev_programme', 'Introduction of Talent Pool Development Programme', 'Talent Management', null, null, 'May ''26|Jun ''26|Planned|Phases: identify talent pool; talent career-aspiration chat; external assessment of talents to reaffirm the 4Q dimension assessment by HOD; establish Talent Success Profile and map to each talent''s profile; develop programmes for talents to go through; brief/communicate to talents. Not yet started as of this reporting period.', null);
insert into detail_records (id, entity_id, period_id, record_type, label, category, value_num, value_num2, text_note, flag) values ('PDP-Q1FY25-003', 'HQ', 'Q1FY25', 'people_dev_programme', 'Data Analytics Skill Development', 'Talent Management', null, null, 'May ''26|Sep ''26|Planned|Source for suitable providers who are able to conduct programmes; obtain input from HODs to identify champion; obtain input from HODs on suitable module; roll-out programme. Not yet started as of this reporting period.', null);
insert into detail_records (id, entity_id, period_id, record_type, label, category, value_num, value_num2, text_note, flag) values ('PDP-Q1FY25-004', 'HQ', 'Q1FY25', 'people_dev_programme', 'Completion of JE for all jobs', 'Talent Management', null, null, 'Jan ''26|Dec ''26|Planned|Jan-May: ensure sourced suitable provider is able to match our requirement in JE; Jun-Dec: engagement with the vendor to complete first round of JE for identified anchoring roles. Not yet started as of this reporting period.', null);
insert into detail_records (id, entity_id, period_id, record_type, label, category, value_num, value_num2, text_note, flag) values ('PDP-Q1FY25-005', 'HQ', 'Q1FY25', 'people_dev_programme', 'Establishment of cross-functionality mobility programme', 'Succession Management', null, null, 'Oct ''26|Dec ''26|Planned|Develop programme framework; propose the development journey; obtain approval on programme. Not yet started as of this reporting period.', null);
insert into detail_records (id, entity_id, period_id, record_type, label, category, value_num, value_num2, text_note, flag) values ('PDP-Q1FY25-006', 'HQ', 'Q1FY25', 'people_dev_programme', 'Expansion of Succession Management to all Critical Positions', 'Succession Management', null, null, 'Apr ''26|Dec ''26|Planned|Phase 2A - retiring within 5 years, to complete to Individual Development Plan (IDP) stage. Phase 2B - all other positions, to complete to Successor Evaluation Stage. Not yet started as of this reporting period.', null);
insert into detail_records (id, entity_id, period_id, record_type, label, category, value_num, value_num2, text_note, flag) values ('PDP-Q1FY25-007', 'HQ', 'Q1FY25', 'people_dev_programme', 'Succession Management Online System', 'Succession Management', null, null, 'Jan ''26|Dec ''26|Planned|Jan-Mar: explore a system to monitor and track successors and their development plan; Apr-Oct: adoption of the system if it meets requirements. Not yet started as of this reporting period.', null);
insert into detail_records (id, entity_id, period_id, record_type, label, category, value_num, value_num2, text_note, flag) values ('PDP-Q1FY25-008', 'HQ', 'Q1FY25', 'people_dev_programme', 'Review of Competency Framework', 'Performance Management', null, null, 'Jun ''26|Dec ''26|Planned|Review of Prokhas'' Competency Framework to incorporate the 4Q dimensions. Not yet started as of this reporting period.', null);
insert into detail_records (id, entity_id, period_id, record_type, label, category, value_num, value_num2, text_note, flag) values ('PDP-Q1FY25-009', 'HQ', 'Q1FY25', 'people_dev_programme', 'PMS Online System Enhancement (2nd Phase)', 'Performance Management', null, null, 'Feb ''26|Dec ''26|Planned|Feb-May: updating the system platform to improve system integrity; Jun-Dec: continued areas for improvement. Not yet started as of this reporting period.', null);
insert into detail_records (id, entity_id, period_id, record_type, label, category, value_num, value_num2, text_note, flag) values ('PDP-Q1FY25-010', 'HQ', 'Q1FY25', 'people_dev_programme', 'Flexi-benefits module introduction', 'Talent/Culture Engagement', null, null, 'Jan ''26|Jun ''26|Planned|Addition of an extra module to manage the flexi-benefit, to be rolled out to staff (pending MOF''s approval of the proposal paper). This is the expected date of GO LIVE of the module - not yet confirmed when the approval will be given. Not yet started as of this reporting period.', null);
insert into detail_records (id, entity_id, period_id, record_type, label, category, value_num, value_num2, text_note, flag) values ('PDP-Q1FY25-011', 'HQ', 'Q1FY25', 'people_dev_programme', 'Deliver culture engagement communication campaigns as planned', 'Talent/Culture Engagement', null, null, 'Ongoing|80% complete|In Progress|Culture Launch & Awareness - 3 pillars: Culture Communication Campaign (posters, infographics, etc.); Culture Quiz Challenge (interactive quiz to help employees learn the pillars and their meaning); Culture Pledge Wall (employees write commitments on how they will practice the culture pillars). In progress as of this reporting period.', null);
insert into detail_records (id, entity_id, period_id, record_type, label, category, value_num, value_num2, text_note, flag) values ('PDP-Q2FY25-001', 'HQ', 'Q2FY25', 'people_dev_programme', 'Continuation of LDPs', 'Talent Management', null, null, 'May ''26|Dec ''26|Planned|Continuation of 2025 LDPs; implementation of planned modules as per the approved programme plan. Total sessions to be conducted in 2026: 23 sessions - ELDP 3 modules x 3 sessions, MLDP 3 modules x 4 sessions, ISLDP 2 modules x 1 session. Not yet started as of this reporting period.', null);
insert into detail_records (id, entity_id, period_id, record_type, label, category, value_num, value_num2, text_note, flag) values ('PDP-Q2FY25-002', 'HQ', 'Q2FY25', 'people_dev_programme', 'Introduction of Talent Pool Development Programme', 'Talent Management', null, null, 'May ''26|Jun ''26|Planned|Phases: identify talent pool; talent career-aspiration chat; external assessment of talents to reaffirm the 4Q dimension assessment by HOD; establish Talent Success Profile and map to each talent''s profile; develop programmes for talents to go through; brief/communicate to talents. Not yet started as of this reporting period.', null);
insert into detail_records (id, entity_id, period_id, record_type, label, category, value_num, value_num2, text_note, flag) values ('PDP-Q2FY25-003', 'HQ', 'Q2FY25', 'people_dev_programme', 'Data Analytics Skill Development', 'Talent Management', null, null, 'May ''26|Sep ''26|Planned|Source for suitable providers who are able to conduct programmes; obtain input from HODs to identify champion; obtain input from HODs on suitable module; roll-out programme. Not yet started as of this reporting period.', null);
insert into detail_records (id, entity_id, period_id, record_type, label, category, value_num, value_num2, text_note, flag) values ('PDP-Q2FY25-004', 'HQ', 'Q2FY25', 'people_dev_programme', 'Completion of JE for all jobs', 'Talent Management', null, null, 'Jan ''26|Dec ''26|Planned|Jan-May: ensure sourced suitable provider is able to match our requirement in JE; Jun-Dec: engagement with the vendor to complete first round of JE for identified anchoring roles. Not yet started as of this reporting period.', null);
insert into detail_records (id, entity_id, period_id, record_type, label, category, value_num, value_num2, text_note, flag) values ('PDP-Q2FY25-005', 'HQ', 'Q2FY25', 'people_dev_programme', 'Establishment of cross-functionality mobility programme', 'Succession Management', null, null, 'Oct ''26|Dec ''26|Planned|Develop programme framework; propose the development journey; obtain approval on programme. Not yet started as of this reporting period.', null);
insert into detail_records (id, entity_id, period_id, record_type, label, category, value_num, value_num2, text_note, flag) values ('PDP-Q2FY25-006', 'HQ', 'Q2FY25', 'people_dev_programme', 'Expansion of Succession Management to all Critical Positions', 'Succession Management', null, null, 'Apr ''26|Dec ''26|Planned|Phase 2A - retiring within 5 years, to complete to Individual Development Plan (IDP) stage. Phase 2B - all other positions, to complete to Successor Evaluation Stage. Not yet started as of this reporting period.', null);
insert into detail_records (id, entity_id, period_id, record_type, label, category, value_num, value_num2, text_note, flag) values ('PDP-Q2FY25-007', 'HQ', 'Q2FY25', 'people_dev_programme', 'Succession Management Online System', 'Succession Management', null, null, 'Jan ''26|Dec ''26|Planned|Jan-Mar: explore a system to monitor and track successors and their development plan; Apr-Oct: adoption of the system if it meets requirements. Not yet started as of this reporting period.', null);
insert into detail_records (id, entity_id, period_id, record_type, label, category, value_num, value_num2, text_note, flag) values ('PDP-Q2FY25-008', 'HQ', 'Q2FY25', 'people_dev_programme', 'Review of Competency Framework', 'Performance Management', null, null, 'Jun ''26|Dec ''26|Planned|Review of Prokhas'' Competency Framework to incorporate the 4Q dimensions. Not yet started as of this reporting period.', null);
insert into detail_records (id, entity_id, period_id, record_type, label, category, value_num, value_num2, text_note, flag) values ('PDP-Q2FY25-009', 'HQ', 'Q2FY25', 'people_dev_programme', 'PMS Online System Enhancement (2nd Phase)', 'Performance Management', null, null, 'Feb ''26|Dec ''26|Planned|Feb-May: updating the system platform to improve system integrity; Jun-Dec: continued areas for improvement. Not yet started as of this reporting period.', null);
insert into detail_records (id, entity_id, period_id, record_type, label, category, value_num, value_num2, text_note, flag) values ('PDP-Q2FY25-010', 'HQ', 'Q2FY25', 'people_dev_programme', 'Flexi-benefits module introduction', 'Talent/Culture Engagement', null, null, 'Jan ''26|Jun ''26|Planned|Addition of an extra module to manage the flexi-benefit, to be rolled out to staff (pending MOF''s approval of the proposal paper). This is the expected date of GO LIVE of the module - not yet confirmed when the approval will be given. Not yet started as of this reporting period.', null);
insert into detail_records (id, entity_id, period_id, record_type, label, category, value_num, value_num2, text_note, flag) values ('PDP-Q2FY25-011', 'HQ', 'Q2FY25', 'people_dev_programme', 'Deliver culture engagement communication campaigns as planned', 'Talent/Culture Engagement', null, null, 'Ongoing|80% complete|In Progress|Culture Launch & Awareness - 3 pillars: Culture Communication Campaign (posters, infographics, etc.); Culture Quiz Challenge (interactive quiz to help employees learn the pillars and their meaning); Culture Pledge Wall (employees write commitments on how they will practice the culture pillars). In progress as of this reporting period.', null);
insert into detail_records (id, entity_id, period_id, record_type, label, category, value_num, value_num2, text_note, flag) values ('PDP-Q3FY25-001', 'HQ', 'Q3FY25', 'people_dev_programme', 'Continuation of LDPs', 'Talent Management', null, null, 'May ''26|Dec ''26|Planned|Continuation of 2025 LDPs; implementation of planned modules as per the approved programme plan. Total sessions to be conducted in 2026: 23 sessions - ELDP 3 modules x 3 sessions, MLDP 3 modules x 4 sessions, ISLDP 2 modules x 1 session. Not yet started as of this reporting period.', null);
insert into detail_records (id, entity_id, period_id, record_type, label, category, value_num, value_num2, text_note, flag) values ('PDP-Q3FY25-002', 'HQ', 'Q3FY25', 'people_dev_programme', 'Introduction of Talent Pool Development Programme', 'Talent Management', null, null, 'May ''26|Jun ''26|Planned|Phases: identify talent pool; talent career-aspiration chat; external assessment of talents to reaffirm the 4Q dimension assessment by HOD; establish Talent Success Profile and map to each talent''s profile; develop programmes for talents to go through; brief/communicate to talents. Not yet started as of this reporting period.', null);
insert into detail_records (id, entity_id, period_id, record_type, label, category, value_num, value_num2, text_note, flag) values ('PDP-Q3FY25-003', 'HQ', 'Q3FY25', 'people_dev_programme', 'Data Analytics Skill Development', 'Talent Management', null, null, 'May ''26|Sep ''26|Planned|Source for suitable providers who are able to conduct programmes; obtain input from HODs to identify champion; obtain input from HODs on suitable module; roll-out programme. Not yet started as of this reporting period.', null);
insert into detail_records (id, entity_id, period_id, record_type, label, category, value_num, value_num2, text_note, flag) values ('PDP-Q3FY25-004', 'HQ', 'Q3FY25', 'people_dev_programme', 'Completion of JE for all jobs', 'Talent Management', null, null, 'Jan ''26|Dec ''26|Planned|Jan-May: ensure sourced suitable provider is able to match our requirement in JE; Jun-Dec: engagement with the vendor to complete first round of JE for identified anchoring roles. Not yet started as of this reporting period.', null);
insert into detail_records (id, entity_id, period_id, record_type, label, category, value_num, value_num2, text_note, flag) values ('PDP-Q3FY25-005', 'HQ', 'Q3FY25', 'people_dev_programme', 'Establishment of cross-functionality mobility programme', 'Succession Management', null, null, 'Oct ''26|Dec ''26|Planned|Develop programme framework; propose the development journey; obtain approval on programme. Not yet started as of this reporting period.', null);
insert into detail_records (id, entity_id, period_id, record_type, label, category, value_num, value_num2, text_note, flag) values ('PDP-Q3FY25-006', 'HQ', 'Q3FY25', 'people_dev_programme', 'Expansion of Succession Management to all Critical Positions', 'Succession Management', null, null, 'Apr ''26|Dec ''26|Planned|Phase 2A - retiring within 5 years, to complete to Individual Development Plan (IDP) stage. Phase 2B - all other positions, to complete to Successor Evaluation Stage. Not yet started as of this reporting period.', null);
insert into detail_records (id, entity_id, period_id, record_type, label, category, value_num, value_num2, text_note, flag) values ('PDP-Q3FY25-007', 'HQ', 'Q3FY25', 'people_dev_programme', 'Succession Management Online System', 'Succession Management', null, null, 'Jan ''26|Dec ''26|Planned|Jan-Mar: explore a system to monitor and track successors and their development plan; Apr-Oct: adoption of the system if it meets requirements. Not yet started as of this reporting period.', null);
insert into detail_records (id, entity_id, period_id, record_type, label, category, value_num, value_num2, text_note, flag) values ('PDP-Q3FY25-008', 'HQ', 'Q3FY25', 'people_dev_programme', 'Review of Competency Framework', 'Performance Management', null, null, 'Jun ''26|Dec ''26|Planned|Review of Prokhas'' Competency Framework to incorporate the 4Q dimensions. Not yet started as of this reporting period.', null);
insert into detail_records (id, entity_id, period_id, record_type, label, category, value_num, value_num2, text_note, flag) values ('PDP-Q3FY25-009', 'HQ', 'Q3FY25', 'people_dev_programme', 'PMS Online System Enhancement (2nd Phase)', 'Performance Management', null, null, 'Feb ''26|Dec ''26|Planned|Feb-May: updating the system platform to improve system integrity; Jun-Dec: continued areas for improvement. Not yet started as of this reporting period.', null);
insert into detail_records (id, entity_id, period_id, record_type, label, category, value_num, value_num2, text_note, flag) values ('PDP-Q3FY25-010', 'HQ', 'Q3FY25', 'people_dev_programme', 'Flexi-benefits module introduction', 'Talent/Culture Engagement', null, null, 'Jan ''26|Jun ''26|Planned|Addition of an extra module to manage the flexi-benefit, to be rolled out to staff (pending MOF''s approval of the proposal paper). This is the expected date of GO LIVE of the module - not yet confirmed when the approval will be given. Not yet started as of this reporting period.', null);
insert into detail_records (id, entity_id, period_id, record_type, label, category, value_num, value_num2, text_note, flag) values ('PDP-Q3FY25-011', 'HQ', 'Q3FY25', 'people_dev_programme', 'Deliver culture engagement communication campaigns as planned', 'Talent/Culture Engagement', null, null, 'Ongoing|80% complete|In Progress|Culture Launch & Awareness - 3 pillars: Culture Communication Campaign (posters, infographics, etc.); Culture Quiz Challenge (interactive quiz to help employees learn the pillars and their meaning); Culture Pledge Wall (employees write commitments on how they will practice the culture pillars). In progress as of this reporting period.', null);
insert into detail_records (id, entity_id, period_id, record_type, label, category, value_num, value_num2, text_note, flag) values ('PDP-Q4FY25-001', 'HQ', 'Q4FY25', 'people_dev_programme', 'Continuation of LDPs', 'Talent Management', null, null, 'May ''26|Dec ''26|Planned|Continuation of 2025 LDPs; implementation of planned modules as per the approved programme plan. Total sessions to be conducted in 2026: 23 sessions - ELDP 3 modules x 3 sessions, MLDP 3 modules x 4 sessions, ISLDP 2 modules x 1 session. Not yet started as of this reporting period.', null);
insert into detail_records (id, entity_id, period_id, record_type, label, category, value_num, value_num2, text_note, flag) values ('PDP-Q4FY25-002', 'HQ', 'Q4FY25', 'people_dev_programme', 'Introduction of Talent Pool Development Programme', 'Talent Management', null, null, 'May ''26|Jun ''26|Planned|Phases: identify talent pool; talent career-aspiration chat; external assessment of talents to reaffirm the 4Q dimension assessment by HOD; establish Talent Success Profile and map to each talent''s profile; develop programmes for talents to go through; brief/communicate to talents. Not yet started as of this reporting period.', null);
insert into detail_records (id, entity_id, period_id, record_type, label, category, value_num, value_num2, text_note, flag) values ('PDP-Q4FY25-003', 'HQ', 'Q4FY25', 'people_dev_programme', 'Data Analytics Skill Development', 'Talent Management', null, null, 'May ''26|Sep ''26|Planned|Source for suitable providers who are able to conduct programmes; obtain input from HODs to identify champion; obtain input from HODs on suitable module; roll-out programme. Not yet started as of this reporting period.', null);
insert into detail_records (id, entity_id, period_id, record_type, label, category, value_num, value_num2, text_note, flag) values ('PDP-Q4FY25-004', 'HQ', 'Q4FY25', 'people_dev_programme', 'Completion of JE for all jobs', 'Talent Management', null, null, 'Jan ''26|Dec ''26|Planned|Jan-May: ensure sourced suitable provider is able to match our requirement in JE; Jun-Dec: engagement with the vendor to complete first round of JE for identified anchoring roles. Not yet started as of this reporting period.', null);
insert into detail_records (id, entity_id, period_id, record_type, label, category, value_num, value_num2, text_note, flag) values ('PDP-Q4FY25-005', 'HQ', 'Q4FY25', 'people_dev_programme', 'Establishment of cross-functionality mobility programme', 'Succession Management', null, null, 'Oct ''26|Dec ''26|Planned|Develop programme framework; propose the development journey; obtain approval on programme. Not yet started as of this reporting period.', null);
insert into detail_records (id, entity_id, period_id, record_type, label, category, value_num, value_num2, text_note, flag) values ('PDP-Q4FY25-006', 'HQ', 'Q4FY25', 'people_dev_programme', 'Expansion of Succession Management to all Critical Positions', 'Succession Management', null, null, 'Apr ''26|Dec ''26|Planned|Phase 2A - retiring within 5 years, to complete to Individual Development Plan (IDP) stage. Phase 2B - all other positions, to complete to Successor Evaluation Stage. Not yet started as of this reporting period.', null);
insert into detail_records (id, entity_id, period_id, record_type, label, category, value_num, value_num2, text_note, flag) values ('PDP-Q4FY25-007', 'HQ', 'Q4FY25', 'people_dev_programme', 'Succession Management Online System', 'Succession Management', null, null, 'Jan ''26|Dec ''26|Planned|Jan-Mar: explore a system to monitor and track successors and their development plan; Apr-Oct: adoption of the system if it meets requirements. Not yet started as of this reporting period.', null);
insert into detail_records (id, entity_id, period_id, record_type, label, category, value_num, value_num2, text_note, flag) values ('PDP-Q4FY25-008', 'HQ', 'Q4FY25', 'people_dev_programme', 'Review of Competency Framework', 'Performance Management', null, null, 'Jun ''26|Dec ''26|Planned|Review of Prokhas'' Competency Framework to incorporate the 4Q dimensions. Not yet started as of this reporting period.', null);
insert into detail_records (id, entity_id, period_id, record_type, label, category, value_num, value_num2, text_note, flag) values ('PDP-Q4FY25-009', 'HQ', 'Q4FY25', 'people_dev_programme', 'PMS Online System Enhancement (2nd Phase)', 'Performance Management', null, null, 'Feb ''26|Dec ''26|Planned|Feb-May: updating the system platform to improve system integrity; Jun-Dec: continued areas for improvement. Not yet started as of this reporting period.', null);
insert into detail_records (id, entity_id, period_id, record_type, label, category, value_num, value_num2, text_note, flag) values ('PDP-Q4FY25-010', 'HQ', 'Q4FY25', 'people_dev_programme', 'Flexi-benefits module introduction', 'Talent/Culture Engagement', null, null, 'Jan ''26|Jun ''26|Planned|Addition of an extra module to manage the flexi-benefit, to be rolled out to staff (pending MOF''s approval of the proposal paper). This is the expected date of GO LIVE of the module - not yet confirmed when the approval will be given. Not yet started as of this reporting period.', null);
insert into detail_records (id, entity_id, period_id, record_type, label, category, value_num, value_num2, text_note, flag) values ('PDP-Q4FY25-011', 'HQ', 'Q4FY25', 'people_dev_programme', 'Deliver culture engagement communication campaigns as planned', 'Talent/Culture Engagement', null, null, 'Ongoing|80% complete|In Progress|Culture Launch & Awareness - 3 pillars: Culture Communication Campaign (posters, infographics, etc.); Culture Quiz Challenge (interactive quiz to help employees learn the pillars and their meaning); Culture Pledge Wall (employees write commitments on how they will practice the culture pillars). In progress as of this reporting period.', null);
insert into detail_records (id, entity_id, period_id, record_type, label, category, value_num, value_num2, text_note, flag) values ('SEED-0025', 'HQ', 'Q1FY26', 'people_dev_programme', 'Continuation of LDPs', 'Talent Management', null, null, 'May ''26|Dec ''26|Planned|Continuation of 2025 LDPs; implementation of planned modules as per the approved programme plan. Total sessions to be conducted in 2026: 23 sessions - ELDP 3 modules x 3 sessions, MLDP 3 modules x 4 sessions, ISLDP 2 modules x 1 session. The continuation of the 3rd module for ELDP will be organised on 15-16 April, 22-23 April and 29-30 April. The MLDP programme is tentatively to start in May 2026.', null);
insert into detail_records (id, entity_id, period_id, record_type, label, category, value_num, value_num2, text_note, flag) values ('SEED-0026', 'HQ', 'Q1FY26', 'people_dev_programme', 'Introduction of Talent Pool Development Programme', 'Talent Management', null, null, 'May ''26|Jun ''26|Planned|Phases: identify talent pool; talent career-aspiration chat; external assessment of talents to reaffirm the 4Q dimension assessment by HOD; establish Talent Success Profile and map to each talent''s profile; develop programmes for talents to go through; brief/communicate to talents. The 3rd 4Q assessment result will be presented to the People Panel to finalise the talent pool in the 2nd week of May, followed by career-aspiration sessions with Talents. External assessment will be conducted to identify development areas for Talent using the Talent Success Profile to address the gap.', null);
insert into detail_records (id, entity_id, period_id, record_type, label, category, value_num, value_num2, text_note, flag) values ('SEED-0027', 'HQ', 'Q1FY26', 'people_dev_programme', 'Data Analytics Skill Development', 'Talent Management', null, null, 'May ''26|Sep ''26|Planned|Source for suitable providers who are able to conduct programmes; obtain input from HODs to identify champion; obtain input from HODs on suitable module; roll-out programme. Not yet started as of this reporting period.', null);
insert into detail_records (id, entity_id, period_id, record_type, label, category, value_num, value_num2, text_note, flag) values ('SEED-0028', 'HQ', 'Q1FY26', 'people_dev_programme', 'Completion of JE for all jobs', 'Talent Management', null, null, 'Jan ''26|Dec ''26|In Progress|Jan-May: ensure sourced suitable provider is able to match our requirement in JE; Jun-Dec: engagement with the vendor to complete first round of JE for identified anchoring roles. Received four proposals from vendors based on the RFP issued. HRD will be reviewing and evaluating the submissions in accordance with the outlined evaluation criteria. The evaluation process, including necessary clarifications with the vendors, is expected to take approximately 2-3 weeks. Once finalised, HRD will submit a proposal for approval on the selection of vendor to conduct the Job Evaluation.', null);
insert into detail_records (id, entity_id, period_id, record_type, label, category, value_num, value_num2, text_note, flag) values ('SEED-0029', 'HQ', 'Q1FY26', 'people_dev_programme', 'Establishment of cross-functionality mobility programme', 'Succession Management', null, null, 'Oct ''26|Dec ''26|Planned|Develop programme framework; propose the development journey; obtain approval on programme. Yet to start.', null);
insert into detail_records (id, entity_id, period_id, record_type, label, category, value_num, value_num2, text_note, flag) values ('SEED-0030', 'HQ', 'Q1FY26', 'people_dev_programme', 'Expansion of Succession Management to all Critical Positions', 'Succession Management', null, null, 'Apr ''26|Dec ''26|Planned|Phase 2A - retiring within 5 years, to complete to Individual Development Plan (IDP) stage. Phase 2B - all other positions, to complete to Successor Evaluation Stage. Finalising revised forms, pending approval from HODiv.', null);
insert into detail_records (id, entity_id, period_id, record_type, label, category, value_num, value_num2, text_note, flag) values ('SEED-0031', 'HQ', 'Q1FY26', 'people_dev_programme', 'Succession Management Online System', 'Succession Management', null, null, 'Jan ''26|Dec ''26|In Progress|Jan-Mar: explore a system to monitor and track successors and their development plan; Apr-Oct: adoption of the system if it meets requirements. Delayed kick-off meeting to mid-April. Revised forms to be submitted to the vendor upon approval.', null);
insert into detail_records (id, entity_id, period_id, record_type, label, category, value_num, value_num2, text_note, flag) values ('SEED-0032', 'HQ', 'Q1FY26', 'people_dev_programme', 'Review of Competency Framework', 'Performance Management', null, null, 'Jun ''26|Dec ''26|Planned|Review of Prokhas'' Competency Framework to incorporate the 4Q dimensions. Yet to start.', null);
insert into detail_records (id, entity_id, period_id, record_type, label, category, value_num, value_num2, text_note, flag) values ('SEED-0033', 'HQ', 'Q1FY26', 'people_dev_programme', 'PMS Online System Enhancement (2nd Phase)', 'Performance Management', null, null, 'Feb ''26|Dec ''26|In Progress|Feb-May: updating the system platform to improve system integrity; Jun-Dec: continued areas for improvement. Re-platforming delayed to end-May. Phase 2 enhancement ongoing, developed by ITD.', null);
insert into detail_records (id, entity_id, period_id, record_type, label, category, value_num, value_num2, text_note, flag) values ('SEED-0034', 'HQ', 'Q1FY26', 'people_dev_programme', 'Flexi-benefits module introduction', 'Talent/Culture Engagement', null, null, 'Jan ''26|Jun ''26|In Progress|Addition of an extra module to manage the flexi-benefit, to be rolled out to staff (pending MOF''s approval of the proposal paper). This is the expected date of GO LIVE of the module - not yet confirmed when the approval will be given. In progress as of this reporting period.', null);
insert into detail_records (id, entity_id, period_id, record_type, label, category, value_num, value_num2, text_note, flag) values ('SEED-0035', 'HQ', 'Q1FY26', 'people_dev_programme', 'Deliver culture engagement communication campaigns as planned', 'Talent/Culture Engagement', null, null, 'Ongoing|80% complete|In Progress|Culture Launch & Awareness - 3 pillars: Culture Communication Campaign (posters, infographics, etc.); Culture Quiz Challenge (interactive quiz to help employees learn the pillars and their meaning); Culture Pledge Wall (employees write commitments on how they will practice the culture pillars). The 1st draft of the culture engagement framework, plan and activities to be presented to the HR HOD by end March.', null);
insert into detail_records (id, entity_id, period_id, record_type, label, category, value_num, value_num2, text_note, flag) values ('PDP-Q2FY26-001', 'HQ', 'Q2FY26', 'people_dev_programme', 'Continuation of LDPs', 'Talent Management', null, null, 'May ''26|Dec ''26|In Progress|Continuation of 2025 LDPs; implementation of planned modules as per the approved programme plan. Total sessions to be conducted in 2026: 23 sessions - ELDP 3 modules x 3 sessions, MLDP 3 modules x 4 sessions, ISLDP 2 modules x 1 session. In progress as of this reporting period.', null);
insert into detail_records (id, entity_id, period_id, record_type, label, category, value_num, value_num2, text_note, flag) values ('PDP-Q2FY26-002', 'HQ', 'Q2FY26', 'people_dev_programme', 'Introduction of Talent Pool Development Programme', 'Talent Management', null, null, 'May ''26|Jun ''26|In Progress|Phases: identify talent pool; talent career-aspiration chat; external assessment of talents to reaffirm the 4Q dimension assessment by HOD; establish Talent Success Profile and map to each talent''s profile; develop programmes for talents to go through; brief/communicate to talents. In progress as of this reporting period.', null);
insert into detail_records (id, entity_id, period_id, record_type, label, category, value_num, value_num2, text_note, flag) values ('PDP-Q2FY26-003', 'HQ', 'Q2FY26', 'people_dev_programme', 'Data Analytics Skill Development', 'Talent Management', null, null, 'May ''26|Sep ''26|In Progress|Source for suitable providers who are able to conduct programmes; obtain input from HODs to identify champion; obtain input from HODs on suitable module; roll-out programme. In progress as of this reporting period.', null);
insert into detail_records (id, entity_id, period_id, record_type, label, category, value_num, value_num2, text_note, flag) values ('PDP-Q2FY26-004', 'HQ', 'Q2FY26', 'people_dev_programme', 'Completion of JE for all jobs', 'Talent Management', null, null, 'Jan ''26|Dec ''26|In Progress|Jan-May: ensure sourced suitable provider is able to match our requirement in JE; Jun-Dec: engagement with the vendor to complete first round of JE for identified anchoring roles. In progress as of this reporting period.', null);
insert into detail_records (id, entity_id, period_id, record_type, label, category, value_num, value_num2, text_note, flag) values ('PDP-Q2FY26-005', 'HQ', 'Q2FY26', 'people_dev_programme', 'Establishment of cross-functionality mobility programme', 'Succession Management', null, null, 'Oct ''26|Dec ''26|Planned|Develop programme framework; propose the development journey; obtain approval on programme. Not yet started as of this reporting period.', null);
insert into detail_records (id, entity_id, period_id, record_type, label, category, value_num, value_num2, text_note, flag) values ('PDP-Q2FY26-006', 'HQ', 'Q2FY26', 'people_dev_programme', 'Expansion of Succession Management to all Critical Positions', 'Succession Management', null, null, 'Apr ''26|Dec ''26|In Progress|Phase 2A - retiring within 5 years, to complete to Individual Development Plan (IDP) stage. Phase 2B - all other positions, to complete to Successor Evaluation Stage. In progress as of this reporting period.', null);
insert into detail_records (id, entity_id, period_id, record_type, label, category, value_num, value_num2, text_note, flag) values ('PDP-Q2FY26-007', 'HQ', 'Q2FY26', 'people_dev_programme', 'Succession Management Online System', 'Succession Management', null, null, 'Jan ''26|Dec ''26|In Progress|Jan-Mar: explore a system to monitor and track successors and their development plan; Apr-Oct: adoption of the system if it meets requirements. In progress as of this reporting period.', null);
insert into detail_records (id, entity_id, period_id, record_type, label, category, value_num, value_num2, text_note, flag) values ('PDP-Q2FY26-008', 'HQ', 'Q2FY26', 'people_dev_programme', 'Review of Competency Framework', 'Performance Management', null, null, 'Jun ''26|Dec ''26|In Progress|Review of Prokhas'' Competency Framework to incorporate the 4Q dimensions. In progress as of this reporting period.', null);
insert into detail_records (id, entity_id, period_id, record_type, label, category, value_num, value_num2, text_note, flag) values ('PDP-Q2FY26-009', 'HQ', 'Q2FY26', 'people_dev_programme', 'PMS Online System Enhancement (2nd Phase)', 'Performance Management', null, null, 'Feb ''26|Dec ''26|In Progress|Feb-May: updating the system platform to improve system integrity; Jun-Dec: continued areas for improvement. In progress as of this reporting period.', null);
insert into detail_records (id, entity_id, period_id, record_type, label, category, value_num, value_num2, text_note, flag) values ('PDP-Q2FY26-010', 'HQ', 'Q2FY26', 'people_dev_programme', 'Flexi-benefits module introduction', 'Talent/Culture Engagement', null, null, 'Jan ''26|Jun ''26|In Progress|Addition of an extra module to manage the flexi-benefit, to be rolled out to staff (pending MOF''s approval of the proposal paper). This is the expected date of GO LIVE of the module - not yet confirmed when the approval will be given. In progress as of this reporting period.', null);
insert into detail_records (id, entity_id, period_id, record_type, label, category, value_num, value_num2, text_note, flag) values ('PDP-Q2FY26-011', 'HQ', 'Q2FY26', 'people_dev_programme', 'Deliver culture engagement communication campaigns as planned', 'Talent/Culture Engagement', null, null, 'Ongoing|80% complete|In Progress|Culture Launch & Awareness - 3 pillars: Culture Communication Campaign (posters, infographics, etc.); Culture Quiz Challenge (interactive quiz to help employees learn the pillars and their meaning); Culture Pledge Wall (employees write commitments on how they will practice the culture pillars). In progress as of this reporting period.', null);
-- FY2027 has no periods rows (seed.sql/periods stops at FY2026), so no PDP rows target it --
-- a period_id FK to a nonexistent 'Q1FY27' etc. would fail on every apply. 88 rows across 8 periods.


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
