/**
 * Ongoing backup sync: run on a schedule (e.g. nightly, via cron) on the internal server once
 * MariaDB is primary. Reads every business table from MariaDB and upserts it into the Supabase
 * project, so Supabase stays a live, current online backup — per your instruction to keep
 * receiving data there, not just freeze it at cutover.
 *
 * Full-table upsert every run, not incremental — simplest correct option at this data's actual
 * size (a few thousand rows in the largest tables), and avoids the drift bugs an incremental
 * watermark-based sync could introduce if a run is ever missed.
 *
 * Deliberately excluded: app_users' credential columns. MariaDB's password_hash has no
 * Supabase-side equivalent (Supabase Auth isn't used post-cutover), so only the business columns
 * sync — Supabase's copy of app_users shows who's who, but logging into it isn't part of what
 * this backup is for (see DEPLOY_INTERNAL.md's note on this). The original Excel files behind
 * upload_events also aren't synced back (MariaDB's local disk storage has no Supabase Storage
 * equivalent wired up here) — only the audit-trail rows about them.
 *
 * Usage: SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... DB_HOST=... npm run migrate:sync
 * (run from server/; cron example in DEPLOY_INTERNAL.md)
 */
import "dotenv/config";
import { createClient } from "@supabase/supabase-js";
import mysql from "mysql2/promise";

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.log("SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY not set — backup sync is disabled. Nothing to do.");
  process.exit(0);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
const mariadb = await mysql.createConnection({
  host: process.env.DB_HOST ?? "127.0.0.1",
  port: Number(process.env.DB_PORT ?? 3306),
  user: process.env.DB_USER ?? "pksof",
  password: process.env.DB_PASSWORD ?? "",
  database: process.env.DB_NAME ?? "pksof",
  decimalNumbers: true,
  dateStrings: true,
});

async function syncTable(table: string, columns: string[], conflictTarget: string | string[]) {
  const [rows] = await mariadb.query(`SELECT ${columns.join(", ")} FROM ${table}`);
  const list = rows as Record<string, unknown>[];
  if (list.length === 0) {
    console.log(`  ${table}: nothing to sync`);
    return;
  }
  // Supabase's PostgREST upsert caps a single request's payload — chunk defensively.
  const CHUNK = 500;
  for (let i = 0; i < list.length; i += CHUNK) {
    const chunk = list.slice(i, i + CHUNK).map((r) => {
      const out: Record<string, unknown> = {};
      for (const c of columns) out[c] = r[c] === undefined ? null : r[c];
      return out;
    });
    const { error } = await supabase.from(table).upsert(chunk, { onConflict: Array.isArray(conflictTarget) ? conflictTarget.join(",") : conflictTarget });
    if (error) throw new Error(`${table}: ${error.message}`);
  }
  console.log(`  ${table}: ${list.length} rows synced`);
}

async function main() {
  console.log(`[${new Date().toISOString()}] Syncing MariaDB -> Supabase backup...\n`);

  // Reference tables rarely change, but cheap enough to sync every run too — keeps Supabase's
  // copy self-consistent even if someone edits org_settings/kpi_fy_targets directly.
  await syncTable("entities", ["id", "name", "full_name", "kind"], "id");
  await syncTable("entity_modules", ["entity_id", "module"], ["entity_id", "module"]);
  await syncTable("perspectives", ["id", "code", "name", "weight", "screen_code", "icon"], "id");
  await syncTable("kpis", ["id", "no", "name", "perspective_id", "weight", "unit", "fy_target", "direction", "formula_note", "data_owner"], "id");
  await syncTable("periods", ["id", "label", "fy", "quarter", "cumulative_threshold", "mof_threshold", "is_current", "is_open_for_entry", "granularity", "parent_period_id"], "id");

  // app_users — business columns only, see the file header note on why password-related
  // columns are excluded.
  await syncTable("app_users", ["id", "display_name", "role", "home_entity", "email", "assigned_module", "must_change_password", "active"], "id");

  await syncTable("fact_kpi_results", ["kpi_id", "entity_id", "period_id", "ytd_target", "ytd_actual", "status", "note"], ["kpi_id", "entity_id", "period_id"]);
  await syncTable("submissions", ["id", "kpi_id", "entity_id", "period_id", "value", "note", "source", "submitted_by", "submitted_at", "status", "reviewed_by", "reviewed_at", "review_note"], "id");
  await syncTable("detail_metrics", ["entity_id", "period_id", "metric_key", "dimension", "dimension2", "value", "note"], ["entity_id", "period_id", "metric_key", "dimension", "dimension2"]);
  await syncTable("detail_records", ["id", "entity_id", "period_id", "record_type", "label", "category", "value_num", "value_num2", "text_note", "flag"], "id");
  await syncTable("org_settings", ["id", "fiscal_year_end_month", "updated_by"], "id");
  await syncTable("kpi_fy_targets", ["kpi_id", "fy", "fy_target", "updated_by"], ["kpi_id", "fy"]);
  await syncTable("upload_events", ["id", "entity_id", "file_name", "sheets", "periods", "uploaded_by", "uploaded_at", "total_rows", "saved_rows", "failed_rows"], "id");
  await syncTable("upload_event_rows", ["id", "upload_id", "dest", "sheet", "label", "period_id", "value", "status", "error_message"], "id");
  await syncTable("activity_log", ["id", "user_name", "role", "entity_id", "action", "detail", "created_at"], "id");
  await syncTable("detail_submissions", [
    "id", "dest", "module", "entity_id", "period_id", "metric_key", "dimension", "dimension2",
    "record_id", "record_type", "label", "category", "value_num", "value_num2", "text_note",
    "note", "source", "submitted_by", "submitted_at", "status", "reviewed_by", "reviewed_at", "review_note",
  ], "id");
  await syncTable("template_overflow_entries", [
    "id", "upload_id", "entity_id", "sheet", "period_label", "row_label", "row_sub", "raw_value",
    "reason", "conflict_with_value", "status", "resolved_by", "resolved_at", "resolution_note",
    "mapped_dest", "mapped_key", "created_at",
  ], "id");

  console.log("\nSync complete.");
  await mariadb.end();
}

main().catch((err) => {
  console.error("Sync failed:", err);
  process.exit(1);
});
