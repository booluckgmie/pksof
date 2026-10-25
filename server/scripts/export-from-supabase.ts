/**
 * One-time cutover migration: pulls every row out of the live Supabase project and inserts it
 * into MariaDB. Run this ONCE, when you're actually ready to cut over — not before, and not
 * automatically. It does NOT touch Supabase (read-only there) and TRUNCATEs the destination
 * MariaDB tables before inserting, so it's safe to re-run if something goes wrong partway (just
 * fix the issue and run it again from the top).
 *
 * Needs a DIRECT Postgres connection string (SUPABASE_DB_URL — Supabase dashboard -> Project
 * Settings -> Database -> Connection string -> "URI", the non-pooled one), not the usual
 * SUPABASE_URL/anon-key pair — that's what lets this read `auth.users.encrypted_password`
 * directly (PostgREST never exposes the `auth` schema), which is how existing passwords carry
 * over unchanged: Supabase's GoTrue hashes passwords with bcrypt, the exact same algorithm this
 * app's new password_hash column uses (see server/src/auth.ts) — so every seeded account's
 * current password just keeps working after cutover, with zero re-seeding of passwords needed.
 *
 * Usage: SUPABASE_DB_URL=postgres://... DB_HOST=... DB_USER=... DB_PASSWORD=... DB_NAME=...
 *        npm run migrate:export   (run from server/)
 */
import "dotenv/config";
import { Client as PgClient } from "pg";
import mysql from "mysql2/promise";

const SUPABASE_DB_URL = process.env.SUPABASE_DB_URL;
if (!SUPABASE_DB_URL) {
  console.error("SUPABASE_DB_URL is required — the direct Postgres connection string from Supabase's dashboard (Project Settings -> Database -> Connection string -> URI).");
  process.exit(1);
}

const pg = new PgClient({ connectionString: SUPABASE_DB_URL });
const mariadb = await mysql.createConnection({
  host: process.env.DB_HOST ?? "127.0.0.1",
  port: Number(process.env.DB_PORT ?? 3306),
  user: process.env.DB_USER ?? "pksof",
  password: process.env.DB_PASSWORD ?? "",
  database: process.env.DB_NAME ?? "pksof",
  multipleStatements: true,
});

/** Postgres `boolean`/`timestamptz` values need a small shape change for mysql2's placeholder
 * binding — everything else (varchar/numeric/int) passes through unchanged. */
function toMariaValue(v: unknown): unknown {
  if (v === null || v === undefined) return null;
  if (typeof v === "boolean") return v ? 1 : 0;
  if (v instanceof Date) return v.toISOString().slice(0, 19).replace("T", " ");
  return v;
}

async function copyTable(table: string, columns: string[], opts?: { where?: string; mapRow?: (row: Record<string, unknown>) => Record<string, unknown> }) {
  const sql = `SELECT ${columns.join(", ")} FROM ${table}${opts?.where ? ` ${opts.where}` : ""}`;
  const { rows } = await pg.query(sql);
  if (rows.length === 0) {
    console.log(`  ${table}: 0 rows`);
    return;
  }
  const mapped = opts?.mapRow ? rows.map(opts.mapRow) : rows;
  const cols = Object.keys(mapped[0]);
  await mariadb.query(`DELETE FROM ${table}`);
  const placeholders = mapped.map(() => `(${cols.map(() => "?").join(", ")})`).join(", ");
  const values = mapped.flatMap((r: Record<string, unknown>) => cols.map((c) => toMariaValue(r[c])));
  await mariadb.query(`INSERT INTO ${table} (${cols.join(", ")}) VALUES ${placeholders}`, values);
  console.log(`  ${table}: ${mapped.length} rows`);
}

async function main() {
  await pg.connect();
  console.log("Connected to Supabase (direct Postgres) and MariaDB. Exporting...\n");

  // Reference tables — order matters for foreign keys.
  await copyTable("entities", ["id", "name", "full_name", "kind", "created_at"]);
  await copyTable("entity_modules", ["entity_id", "module"]);
  await copyTable("perspectives", ["id", "code", "name", "weight", "screen_code", "icon"]);
  await copyTable("kpis", ["id", "no", "name", "perspective_id", "weight", "unit", "fy_target", "direction", "formula_note", "data_owner"]);
  await copyTable("periods", ["id", "label", "fy", "quarter", "cumulative_threshold", "mof_threshold", "is_current", "is_open_for_entry", "granularity", "parent_period_id"]);

  // app_users — joined against auth.users for its bcrypt password hash, since that lives in a
  // schema PostgREST never exposes. auth_user_id has no equivalent column anymore (see
  // server/schema.sql's own note) — password_hash replaces it entirely.
  {
    const { rows } = await pg.query(`
      SELECT u.id, u.display_name, u.role, u.home_entity, u.email, u.assigned_module,
             u.must_change_password, u.active, u.created_at, au.encrypted_password AS password_hash
      FROM app_users u
      LEFT JOIN auth.users au ON au.id = u.auth_user_id
    `);
    await mariadb.query("DELETE FROM app_users");
    const withFallback = rows.map((r: Record<string, unknown>) => ({
      ...r,
      // Should never happen in practice (every seeded account has a real auth.users row) — a
      // placeholder hash here just means that one account needs an admin password reset after
      // cutover, rather than the whole export failing.
      password_hash: r.password_hash ?? "$2a$10$00000000000000000000000000000000000000000000000000000",
    }));
    if (withFallback.length > 0) {
      const cols = ["id", "display_name", "role", "home_entity", "email", "assigned_module", "must_change_password", "active", "created_at", "password_hash"];
      const placeholders = withFallback.map(() => `(${cols.map(() => "?").join(", ")})`).join(", ");
      const values = withFallback.flatMap((r: Record<string, unknown>) => cols.map((c) => toMariaValue(r[c])));
      await mariadb.query(`INSERT INTO app_users (${cols.join(", ")}) VALUES ${placeholders}`, values);
    }
    console.log(`  app_users: ${withFallback.length} rows (passwords carried over as-is)`);
  }

  await copyTable("fact_kpi_results", ["kpi_id", "entity_id", "period_id", "ytd_target", "ytd_actual", "status", "note", "updated_at"]);
  await copyTable("submissions", ["id", "kpi_id", "entity_id", "period_id", "value", "note", "source", "submitted_by", "submitted_at", "status", "reviewed_by", "reviewed_at", "review_note"]);
  await copyTable("detail_metrics", ["entity_id", "period_id", "metric_key", "dimension", "dimension2", "value", "note", "updated_at"]);
  await copyTable("detail_records", ["id", "entity_id", "period_id", "record_type", "label", "category", "value_num", "value_num2", "text_note", "flag", "updated_at"]);
  await copyTable("org_settings", ["id", "fiscal_year_end_month", "updated_at", "updated_by"]);
  await copyTable("kpi_fy_targets", ["kpi_id", "fy", "fy_target", "updated_at", "updated_by"]);
  await copyTable("upload_events", ["id", "entity_id", "file_name", "sheets", "periods", "uploaded_by", "uploaded_at", "total_rows", "saved_rows", "failed_rows", "file_path"]);
  await copyTable("upload_event_rows", ["id", "upload_id", "dest", "sheet", "label", "period_id", "value", "status", "error_message"]);
  await copyTable("activity_log", ["id", "user_name", "role", "entity_id", "action", "detail", "created_at"]);
  await copyTable("detail_submissions", [
    "id", "dest", "module", "entity_id", "period_id", "metric_key", "dimension", "dimension2",
    "record_id", "record_type", "label", "category", "value_num", "value_num2", "text_note",
    "note", "source", "submitted_by", "submitted_at", "status", "reviewed_by", "reviewed_at", "review_note",
  ]);
  await copyTable("template_overflow_entries", [
    "id", "upload_id", "entity_id", "sheet", "period_label", "row_label", "row_sub", "raw_value",
    "reason", "conflict_with_value", "status", "resolved_by", "resolved_at", "resolution_note",
    "mapped_dest", "mapped_key", "created_at",
  ]);

  console.log("\nDone. Note: the original Excel files behind upload_events (the Supabase");
  console.log("\"upload-files\" Storage bucket) are NOT copied by this script — download them");
  console.log("yourself from the Supabase dashboard's Storage browser if you need them on the");
  console.log("new server too; the audit-trail rows above work fine without them.");

  await pg.end();
  await mariadb.end();
}

main().catch((err) => {
  console.error("Export failed:", err);
  process.exit(1);
});
