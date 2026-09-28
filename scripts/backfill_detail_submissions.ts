// One-off backfill for migration 0016 (detail_submissions): every currently-live detail_metrics/
// detail_records row that's part of the downloadable Excel template (i.e. anything a Head of
// Department could plausibly need to sign off on) gets a matching 'submitted' detail_submissions
// row, source='backfill', so it shows up in Verify & Publish's Pending tab for retroactive
// approval — without touching the live value itself (nothing here writes to detail_metrics/
// detail_records; approving a backfilled row later just re-writes the same figure that's already
// displayed). Rows whose metric_key/dimension or record_type/label isn't in the template manifest
// (TEMPLATE_FIELDS) are skipped — those are written by in-app editors that don't go through this
// queue yet (see migration 0016's own comment) and were never uploaded via Data Entry in the
// first place.
//
// Run once (idempotency-guarded — refuses to run again if detail_submissions already has rows):
//   set -a; source .env; set +a
//   node --experimental-strip-types scripts/backfill_detail_submissions.ts
import { createClient } from "@supabase/supabase-js";
import { TEMPLATE_FIELDS } from "../src/lib/templateFields.generated.ts";

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;
if (!SUPABASE_URL || !SUPABASE_KEY) {
  throw new Error("Set VITE_SUPABASE_URL / VITE_SUPABASE_PUBLISHABLE_KEY first, e.g.: set -a; source .env; set +a");
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const MODULE_BY_LABEL: Record<string, "CP" | "FH" | "RP"> = {
  "Corporate Performance": "CP",
  "Financial Health": "FH",
  "Resource & People": "RP",
};

const metricSheet = new Map<string, string>();
const recordSheet = new Map<string, string>();
for (const f of TEMPLATE_FIELDS) {
  if (f.dest === "metric") metricSheet.set(`${f.metricKey}|${f.dimension}`, f.sheet);
  if (f.dest === "record") recordSheet.set(`${f.recordType}|${f.recordLabel}`, f.sheet);
}

async function fetchAll<T>(table: string): Promise<T[]> {
  const pageSize = 1000;
  const rows: T[] = [];
  for (let from = 0; ; from += pageSize) {
    const { data, error } = await supabase.from(table).select("*").range(from, from + pageSize - 1);
    if (error) throw error;
    rows.push(...(data as T[]));
    if (data.length < pageSize) break;
  }
  return rows;
}

interface MetricRow { entity_id: string; period_id: string; metric_key: string; dimension: string; dimension2: string; value: number | null; note: string | null; }
interface RecordRow { id: string; entity_id: string; period_id: string; record_type: string; label: string; category: string | null; value_num: number | null; value_num2: number | null; text_note: string | null; }

async function main() {
  const { data: existing, error: existingErr } = await supabase.from("detail_submissions").select("id").limit(1);
  if (existingErr) throw existingErr;
  if (existing.length > 0) {
    console.log("detail_submissions already has rows — refusing to run twice. Delete source='backfill' rows first if you need to redo this.");
    return;
  }

  const metrics = await fetchAll<MetricRow>("detail_metrics");
  const records = await fetchAll<RecordRow>("detail_records");

  const rows: Record<string, unknown>[] = [];
  let skippedMetrics = 0;
  let skippedRecords = 0;

  for (const m of metrics) {
    const sheet = metricSheet.get(`${m.metric_key}|${m.dimension}`);
    if (!sheet) { skippedMetrics++; continue; }
    rows.push({
      id: `BKF-M-${rows.length + 1}`,
      dest: "metric",
      module: MODULE_BY_LABEL[sheet],
      entity_id: m.entity_id,
      period_id: m.period_id,
      metric_key: m.metric_key,
      dimension: m.dimension,
      dimension2: m.dimension2,
      value_num: m.value,
      source: "backfill",
      submitted_by: "System (retroactive backfill)",
      status: "submitted",
    });
  }

  for (const r of records) {
    const sheet = recordSheet.get(`${r.record_type}|${r.label}`);
    if (!sheet) { skippedRecords++; continue; }
    rows.push({
      id: `BKF-R-${r.id}`,
      dest: "record",
      module: MODULE_BY_LABEL[sheet],
      entity_id: r.entity_id,
      period_id: r.period_id,
      record_id: r.id,
      record_type: r.record_type,
      label: r.label,
      category: r.category,
      value_num: r.value_num,
      value_num2: r.value_num2,
      text_note: r.text_note,
      source: "backfill",
      submitted_by: "System (retroactive backfill)",
      status: "submitted",
    });
  }

  console.log(
    `Matched ${rows.length} rows to backfill (${skippedMetrics} metric + ${skippedRecords} record rows skipped — not part of the Excel template manifest, i.e. in-app-editor-only data).`
  );

  const chunkSize = 500;
  for (let i = 0; i < rows.length; i += chunkSize) {
    const chunk = rows.slice(i, i + chunkSize);
    const { error } = await supabase.from("detail_submissions").insert(chunk);
    if (error) throw error;
    console.log(`Inserted ${Math.min(i + chunkSize, rows.length)} / ${rows.length}`);
  }
  console.log("Done.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
