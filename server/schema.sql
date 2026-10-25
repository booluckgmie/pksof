-- Group Performance Dashboard — MariaDB schema
-- Translated 1:1 from the Postgres/Supabase schema (supabase/migrations/0001..0021), whose own
-- header comment says it was deliberately written to port cleanly to MariaDB: string primary
-- keys instead of Postgres uuid/gen_random_uuid(), VARCHAR+CHECK instead of enum types,
-- NUMERIC(p,s)->DECIMAL(p,s), no JSONB, no triggers/stored procedures.
--
-- Two real differences from the Postgres schema, both deliberate:
--   1. No Row Level Security (MariaDB has none) — every access rule RLS used to enforce is now
--      enforced in server/src/middleware and the route handlers themselves. See
--      DEPLOY_INTERNAL.md for the mapping.
--   2. app_users no longer has `auth_user_id` (a Postgres uuid pointing at Supabase's own
--      auth.users table) — there is no separate auth schema anymore. It gains `password_hash`
--      directly, and a new `password_reset_tokens` table replaces Supabase Auth's built-in
--      recovery-link mechanism. See server/src/auth.ts.
--
-- Requires MariaDB 10.2.6+ (CHECK constraints are parsed-but-ignored before that version).
-- Run once against an empty database: `mysql -u root -p < schema.sql`, or let
-- server/Dockerfile's entrypoint apply it automatically on first boot (see docker-compose.yml).

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ── Reference tables ─────────────────────────────────────────────────────────

CREATE TABLE entities (
  id         VARCHAR(20)  PRIMARY KEY,
  name       VARCHAR(100) NOT NULL,
  full_name  VARCHAR(200) NOT NULL,
  kind       VARCHAR(10)  NOT NULL CHECK (kind IN ('HQ','ME')),
  created_at DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE entity_modules (
  entity_id VARCHAR(20) NOT NULL,
  module    VARCHAR(4)  NOT NULL CHECK (module IN ('CP','FH','RP')),
  PRIMARY KEY (entity_id, module),
  CONSTRAINT fk_entity_modules_entity FOREIGN KEY (entity_id) REFERENCES entities(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE perspectives (
  id          VARCHAR(10)   PRIMARY KEY,
  code        VARCHAR(10)   NOT NULL,
  name        VARCHAR(100)  NOT NULL,
  weight      DECIMAL(6,4)  NOT NULL,   -- fraction of 1.0
  screen_code VARCHAR(10)   NOT NULL,
  icon        VARCHAR(50)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE kpis (
  id             VARCHAR(10)   PRIMARY KEY,
  no             INT           NOT NULL,
  name           VARCHAR(200)  NOT NULL,
  perspective_id VARCHAR(10)   NOT NULL,
  weight         DECIMAL(6,4)  NOT NULL,   -- fraction of 1.0
  unit           VARCHAR(20)   NOT NULL,
  fy_target      DECIMAL(14,4),
  direction      VARCHAR(6)    NOT NULL CHECK (direction IN ('higher','lower')),
  formula_note   VARCHAR(300),
  data_owner     VARCHAR(100),
  CONSTRAINT fk_kpis_perspective FOREIGN KEY (perspective_id) REFERENCES perspectives(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE periods (
  id                    VARCHAR(10)  PRIMARY KEY,   -- e.g. 'Q1FY26', or 'Q1FY26-M1' for a month row
  label                 VARCHAR(20)  NOT NULL,        -- e.g. 'Q1 FY2026', or 'Jan 2026'
  fy                    VARCHAR(10)  NOT NULL,        -- e.g. 'FY2026'
  quarter               SMALLINT     NOT NULL CHECK (quarter BETWEEN 1 AND 4),
  cumulative_threshold  DECIMAL(5,4) NOT NULL,
  mof_threshold         DECIMAL(5,4) NOT NULL,
  is_current            BOOLEAN      NOT NULL DEFAULT FALSE,
  is_open_for_entry     BOOLEAN      NOT NULL DEFAULT FALSE,
  granularity           VARCHAR(10)  NOT NULL DEFAULT 'quarter' CHECK (granularity IN ('quarter','month')),
  parent_period_id      VARCHAR(10),
  CONSTRAINT fk_periods_parent FOREIGN KEY (parent_period_id) REFERENCES periods(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ── Users / auth ──────────────────────────────────────────────────────────────
-- Self-contained: no separate auth.users schema (that was Supabase's own, not ours to port).
-- password_hash is a bcrypt hash, set at account creation and on every reset — see
-- server/src/auth.ts and server/src/routes/auth.ts / admin.ts.

CREATE TABLE app_users (
  id                   VARCHAR(50)  PRIMARY KEY,   -- corporate id / username, e.g. 'nhba'
  display_name         VARCHAR(100) NOT NULL,
  role                 VARCHAR(20)  NOT NULL CHECK (role IN ('board','exec','dept_head','reporting_officer','approving_officer','admin')),
  home_entity          VARCHAR(20)  NOT NULL,
  email                VARCHAR(150) NOT NULL,
  assigned_module      VARCHAR(4)   CHECK (assigned_module IN ('CP','FH','RP')),
  password_hash        VARCHAR(255) NOT NULL,
  must_change_password BOOLEAN      NOT NULL DEFAULT TRUE,
  active                BOOLEAN      NOT NULL DEFAULT TRUE,
  created_at           DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_app_users_entity FOREIGN KEY (home_entity) REFERENCES entities(id),
  UNIQUE KEY uq_app_users_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- One-time password-reset links ("forgot password"), replacing Supabase Auth's built-in
-- recovery-link mechanism. `token_hash` stores sha256(raw token) — the raw token only ever
-- exists in the emailed URL and the requester's browser, never at rest. See
-- server/src/routes/auth.ts's forgot-password / reset-password handlers.
CREATE TABLE password_reset_tokens (
  id         VARCHAR(40)  PRIMARY KEY,
  user_id    VARCHAR(50)  NOT NULL,
  token_hash VARCHAR(64)  NOT NULL,   -- sha256 hex digest, fixed 64 chars
  expires_at DATETIME     NOT NULL,
  used_at    DATETIME,
  created_at DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_reset_tokens_user FOREIGN KEY (user_id) REFERENCES app_users(id) ON DELETE CASCADE,
  KEY idx_reset_tokens_token_hash (token_hash),
  KEY idx_reset_tokens_user (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ── Facts: published KPI results shown on dashboards ───────────────────────────

CREATE TABLE fact_kpi_results (
  kpi_id     VARCHAR(10)   NOT NULL,
  entity_id  VARCHAR(20)   NOT NULL,
  period_id  VARCHAR(10)   NOT NULL,
  ytd_target DECIMAL(14,4),
  ytd_actual DECIMAL(14,4),
  status     VARCHAR(20)   NOT NULL CHECK (status IN ('met','not-met','not-measurable')),
  note       VARCHAR(300),
  updated_at DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (kpi_id, entity_id, period_id),
  CONSTRAINT fk_fact_kpi FOREIGN KEY (kpi_id) REFERENCES kpis(id),
  CONSTRAINT fk_fact_entity FOREIGN KEY (entity_id) REFERENCES entities(id),
  CONSTRAINT fk_fact_period FOREIGN KEY (period_id) REFERENCES periods(id),
  KEY idx_fact_entity_period (entity_id, period_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ── Submissions: maker-checker workflow (Draft -> Submitted -> Published/Rejected) ──
-- submitted_by/reviewed_by are free text, not a foreign key to app_users — a submission must
-- not fail just because the name on it doesn't match an app_users row exactly (e.g. a backfilled
-- historical entry). Same as the original Postgres schema's own comment on this table.

CREATE TABLE submissions (
  id            VARCHAR(40)  PRIMARY KEY,
  kpi_id        VARCHAR(10)  NOT NULL,
  entity_id     VARCHAR(20)  NOT NULL,
  period_id     VARCHAR(10)  NOT NULL,
  value         DECIMAL(14,4) NOT NULL,
  note          VARCHAR(500),
  source        VARCHAR(20)  NOT NULL CHECK (source IN ('web-form','excel-upload')),
  submitted_by  VARCHAR(100) NOT NULL,
  submitted_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  status        VARCHAR(20)  NOT NULL DEFAULT 'submitted' CHECK (status IN ('submitted','published','rejected')),
  reviewed_by   VARCHAR(100),
  reviewed_at   DATETIME,
  review_note   VARCHAR(500),
  CONSTRAINT fk_submissions_kpi FOREIGN KEY (kpi_id) REFERENCES kpis(id),
  CONSTRAINT fk_submissions_entity FOREIGN KEY (entity_id) REFERENCES entities(id),
  CONSTRAINT fk_submissions_period FOREIGN KEY (period_id) REFERENCES periods(id),
  KEY idx_submissions_status (status),
  KEY idx_submissions_kpi_entity_period (kpi_id, entity_id, period_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ── Detail data: everything the dashboard shows beyond the 13 headline KPIs ────

CREATE TABLE detail_metrics (
  entity_id   VARCHAR(20)  NOT NULL,
  period_id   VARCHAR(10)  NOT NULL,
  metric_key  VARCHAR(60)  NOT NULL,
  dimension   VARCHAR(80)  NOT NULL,
  dimension2  VARCHAR(80)  NOT NULL DEFAULT '',
  value       DECIMAL(14,4),
  note        VARCHAR(2000),
  updated_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (entity_id, period_id, metric_key, dimension, dimension2),
  CONSTRAINT fk_detail_metrics_entity FOREIGN KEY (entity_id) REFERENCES entities(id) ON DELETE CASCADE,
  CONSTRAINT fk_detail_metrics_period FOREIGN KEY (period_id) REFERENCES periods(id),
  KEY idx_detail_metrics_entity_period (entity_id, period_id),
  KEY idx_detail_metrics_key (metric_key)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE detail_records (
  id           VARCHAR(160) PRIMARY KEY,
  entity_id    VARCHAR(20)  NOT NULL,
  period_id    VARCHAR(10)  NOT NULL,
  record_type  VARCHAR(60)  NOT NULL,
  label        VARCHAR(200) NOT NULL,
  category     VARCHAR(120),
  value_num    DECIMAL(14,4),
  value_num2   DECIMAL(14,4),
  text_note    VARCHAR(2000),
  flag         BOOLEAN,
  updated_at   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_detail_records_entity FOREIGN KEY (entity_id) REFERENCES entities(id) ON DELETE CASCADE,
  CONSTRAINT fk_detail_records_period FOREIGN KEY (period_id) REFERENCES periods(id),
  KEY idx_detail_records_entity_period (entity_id, period_id),
  KEY idx_detail_records_type (record_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ── Org-wide settings (single row) ─────────────────────────────────────────────

CREATE TABLE org_settings (
  id                    INT          PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  fiscal_year_end_month INT          NOT NULL DEFAULT 11 CHECK (fiscal_year_end_month BETWEEN 0 AND 11),
  updated_at            DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  updated_by            VARCHAR(120)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT INTO org_settings (id, fiscal_year_end_month) VALUES (1, 11);

-- ── Yearly-configurable KPI FY targets ─────────────────────────────────────────

CREATE TABLE kpi_fy_targets (
  kpi_id      VARCHAR(10)   NOT NULL,
  fy          VARCHAR(10)   NOT NULL,
  fy_target   DECIMAL(14,4) NOT NULL,
  updated_at  DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  updated_by  VARCHAR(120),
  PRIMARY KEY (kpi_id, fy)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ── Upload audit trail ──────────────────────────────────────────────────────────

CREATE TABLE upload_events (
  id           VARCHAR(40)  PRIMARY KEY,
  entity_id    VARCHAR(20)  NOT NULL,
  file_name    VARCHAR(255) NOT NULL,
  sheets       VARCHAR(200) NOT NULL,
  periods      VARCHAR(200) NOT NULL,
  uploaded_by  VARCHAR(100) NOT NULL,
  uploaded_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  total_rows   INT          NOT NULL DEFAULT 0,
  saved_rows   INT          NOT NULL DEFAULT 0,
  failed_rows  INT          NOT NULL DEFAULT 0,
  -- Relative path under UPLOAD_DIR (see server/src/routes/uploads.ts) — replaces the Supabase
  -- Storage public-URL path, same "<upload_event id>/<original file name>" convention.
  file_path    VARCHAR(300),
  CONSTRAINT fk_upload_events_entity FOREIGN KEY (entity_id) REFERENCES entities(id) ON DELETE CASCADE,
  KEY idx_upload_events_entity (entity_id),
  KEY idx_upload_events_uploaded_at (uploaded_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE upload_event_rows (
  id            VARCHAR(60)  PRIMARY KEY,
  upload_id     VARCHAR(40)  NOT NULL,
  dest          VARCHAR(10)  NOT NULL CHECK (dest IN ('kpi','metric','record')),
  sheet         VARCHAR(60)  NOT NULL,
  label         VARCHAR(200) NOT NULL,
  period_id     VARCHAR(10)  NOT NULL,
  value         DECIMAL(14,4),
  status        VARCHAR(10)  NOT NULL CHECK (status IN ('saved','failed')),
  error_message VARCHAR(500),
  CONSTRAINT fk_upload_rows_event FOREIGN KEY (upload_id) REFERENCES upload_events(id) ON DELETE CASCADE,
  KEY idx_upload_event_rows_upload (upload_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ── User activity log (sign-ins) ────────────────────────────────────────────────

CREATE TABLE activity_log (
  id          VARCHAR(40)  PRIMARY KEY,
  user_name   VARCHAR(100) NOT NULL,
  role        VARCHAR(30)  NOT NULL,
  entity_id   VARCHAR(20),
  action      VARCHAR(20)  NOT NULL CHECK (action IN ('login')),
  detail      VARCHAR(200),
  created_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_activity_log_entity FOREIGN KEY (entity_id) REFERENCES entities(id) ON DELETE SET NULL,
  KEY idx_activity_log_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ── Detail submissions: maker-checker queue for detail_metrics/detail_records ──

CREATE TABLE detail_submissions (
  id            VARCHAR(40)  PRIMARY KEY,
  dest          VARCHAR(10)  NOT NULL CHECK (dest IN ('metric','record')),
  module        VARCHAR(2)   NOT NULL CHECK (module IN ('CP','FH','RP')),
  entity_id     VARCHAR(20)  NOT NULL,
  period_id     VARCHAR(10)  NOT NULL,

  metric_key    VARCHAR(60),
  dimension     VARCHAR(80),
  dimension2    VARCHAR(80),

  record_id     VARCHAR(160),
  record_type   VARCHAR(60),
  label         VARCHAR(200),
  category      VARCHAR(120),

  value_num     DECIMAL(14,4),
  value_num2    DECIMAL(14,4),
  text_note     VARCHAR(2000),

  note          VARCHAR(500),
  source        VARCHAR(20)  NOT NULL CHECK (source IN ('web-form','excel-upload','backfill')),
  submitted_by  VARCHAR(100) NOT NULL,
  submitted_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  status        VARCHAR(20)  NOT NULL DEFAULT 'submitted' CHECK (status IN ('submitted','published','rejected')),
  reviewed_by   VARCHAR(100),
  reviewed_at   DATETIME,
  review_note   VARCHAR(500),
  CONSTRAINT fk_detail_submissions_entity FOREIGN KEY (entity_id) REFERENCES entities(id),
  CONSTRAINT fk_detail_submissions_period FOREIGN KEY (period_id) REFERENCES periods(id),
  KEY idx_detail_submissions_status (status),
  KEY idx_detail_submissions_module (module),
  KEY idx_detail_submissions_entity_period (entity_id, period_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ── Upload "customize queue" — unmatched/conflicting Excel upload content ──────

CREATE TABLE template_overflow_entries (
  id                   VARCHAR(40)  PRIMARY KEY,
  upload_id            VARCHAR(40)  NOT NULL,
  entity_id            VARCHAR(20)  NOT NULL,

  sheet                VARCHAR(60)  NOT NULL,
  period_label         VARCHAR(40),
  row_label            VARCHAR(300),
  row_sub              VARCHAR(200),
  raw_value            VARCHAR(2000),

  reason               VARCHAR(20)  NOT NULL CHECK (reason IN
                         ('unmatched_row','unmatched_column','non_numeric_value','conflict')),
  conflict_with_value  VARCHAR(2000),

  status               VARCHAR(20)  NOT NULL DEFAULT 'pending'
                         CHECK (status IN ('pending','mapped','ignored','flagged_for_template')),
  resolved_by          VARCHAR(100),
  resolved_at          DATETIME,
  resolution_note      VARCHAR(500),
  mapped_dest          VARCHAR(10)  CHECK (mapped_dest IN ('kpi','metric','record')),
  mapped_key           VARCHAR(300),

  created_at           DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_overflow_upload FOREIGN KEY (upload_id) REFERENCES upload_events(id) ON DELETE CASCADE,
  CONSTRAINT fk_overflow_entity FOREIGN KEY (entity_id) REFERENCES entities(id) ON DELETE CASCADE,
  KEY idx_template_overflow_upload (upload_id),
  KEY idx_template_overflow_entity (entity_id),
  KEY idx_template_overflow_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

SET FOREIGN_KEY_CHECKS = 1;
