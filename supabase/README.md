# Supabase setup

## 1. Run the migration

This session could not reach Supabase's servers to run this directly (network policy in the
sandbox it was written in blocks the connection) — it's untested against your live project.
Run it yourself:

- **Supabase Dashboard**: open your project → SQL Editor → run, in order: `migrations/0001_init.sql`,
  `migrations/0002_tighten_write_policies.sql`, `migrations/0003_detail_data.sql`,
  `migrations/0004_allow_pending_submission_edits.sql`, then `seed.sql`.
- **Supabase CLI** (alternative): `supabase db push` after linking the project, or run each
  file in order with `psql "$DATABASE_URL" -f <file>`.

If you already ran `0001`/`0002` before `0003` existed, just run `0003` and re-run `seed.sql` —
`0003` only adds new tables, and `seed.sql`'s inserts are safe to re-run once you've truncated
(see the troubleshooting note below if you hit a duplicate-key error on `entities`).

## 2. Point the app at your project

Copy `.env.example` to `.env` at the repo root and fill in your project's URL and
publishable (anon) key — both are on the Supabase dashboard under Settings → API.

## 3. What's wired up vs. still static

- **Live (Supabase-backed), maker-checker workflow**: `fact_kpi_results` (published KPI
  figures) and `submissions` (the maker-checker queue) — the 13 headline scorecard KPIs.
  `src/lib/workflow.tsx` fetches both on load and keeps them in state so `latestValue()` stays
  a synchronous call for the screens that already call it that way; writes go to Supabase
  first, with a toast if a write fails.
- **Live (Supabase-backed), direct writes**: `detail_metrics` and `detail_records` (see
  `migrations/0003_detail_data.sql`) — everything else the dashboard shows: workforce/
  demographic breakdowns, financial trend/balance sheet, initiatives, related-party
  transactions. `src/lib/details.tsx` fetches both on load and reshapes the raw rows back into
  the exact per-chart data structures the screens expect. There's no maker-checker queue behind
  this data (see the security note below) — writes from Data Entry's "Workforce & Financial
  Snapshot" tab or an Excel upload save immediately.
- **Entry-only, no display yet**: `revenue_by_source`, `expense_by_category`,
  `admin_expense_detail`, `personnel_expense_detail`, `pl_detail`, `balance_sheet_detail`, and
  `receivables_aging` — 90 line-item figures added to close the gap between the dashboard and
  the client's own Q1 2026 MEC report deck (revenue by counterparty, admin/personnel expense
  breakdowns, P&L items below PBT, a fuller balance sheet, receivables aging buckets). Both
  Data Entry's web form ("Workforce, Financial & Other Detail" tab) and the Excel template's new
  "Financial Detail" sheet write these — `upsertDetailMetric`/`parseDetailTemplate` handle them
  exactly like any other `detail_metrics` row — but `src/lib/details.tsx` doesn't reshape them
  into chart data yet, so nothing renders on a dashboard screen from these fields today. See the
  metricKey/dimension pairs in `DataEntry.tsx`'s `DETAIL_FIELDS` (search "Revenue by Source"
  onward) before building the display side, so the shape matches what's already being entered.
  Deliberately left out of this pass: the deposit/placement schedule and receivables aging by
  named client. Both are multi-row datasets that belong in `detail_records` (like
  `related_party_txn`/initiatives), and no entry UI exists yet for *any* `detail_records`
  dataset — those currently only get populated by writing rows to Supabase directly. Also left
  out: the monthly forecast schedule, a forward-budgeting artifact, a different kind of thing
  from the quarterly actuals this app reports.
- **Still static** (`src/data/*.ts`): entities, perspectives, KPI definitions, periods, and a
  handful of genuinely-fixed reference constants (`industryBenchmark`, `priorYearTrained`, the
  People Development programme catalog in `src/lib/details.tsx`) that are organisational
  metadata rather than quarterly-reported figures.

## 4. Security note — this app has no real login yet

The "Sign in" screen accepts any typed corporate ID (a demo/prototype pattern, not real auth),
so no RLS policy here can check *who* is writing — there's no `auth.uid()` to check against.
Read access is deliberately public (it's a dashboard, not secret data).

Writes are a different story: the publishable key is exposed in the deployed bundle, so
`0001`'s original `with check (true)` on inserts/updates meant literally anyone with that key
could write straight to the tables via the REST API, skipping the app's maker-checker flow
entirely — Supabase's own security advisor flags exactly this. `0002_tighten_write_policies.sql`
closes that without real auth by enforcing the state machine at the database level instead:
a submission can only be inserted as `submitted`, can only move from `submitted` to
`published`/`rejected` (never edited again after review), and `fact_kpi_results` can only be
written for a kpi/entity/period/value that has a matching `published` row in `submissions` — so
a figure can't be forged on the dashboard without a real approval trail behind it.

That's still not identity-based, though. **Before this goes anywhere near production**: wire up
Supabase Auth, tie `app_users.id` to `auth.uid()`, and add policies so a submission's
`submitted_by` / a review's `reviewed_by` must match the signed-in user, and only users whose
role has `can_verify` can update `submissions.status`.

`detail_metrics`/`detail_records` (0003) are open write (`with check (true)`) — there's no
approval-trail check to enforce the way there is for KPI facts, since building a second
maker-checker queue for ~15 more datasets was out of scope for this pass. Same production
caveat applies, doubly so: tie writes to a signed-in, role-checked user before this is real.

## 5. Troubleshooting: "duplicate key value violates unique constraint" on `entities`

Means `entities` already has rows from an earlier seed run (e.g. from before a rename). Since
this is prototype data with no real submissions to preserve, the clean fix is to wipe every app
table and re-seed:

```sql
truncate table
  submissions, fact_kpi_results, detail_records, detail_metrics,
  app_users, entity_modules, kpis, periods, perspectives, entities
restart identity cascade;
```

Then re-run `seed.sql`.

## 6. Porting to MariaDB later

The schema avoids Postgres-only features (no JSONB, no ENUM types, no `gen_random_uuid()` —
IDs are natural business keys like `'KPI1'`, `'Q1FY26'`) specifically so it translates to
MariaDB with mostly syntax-level changes. The one piece that won't port directly is Row Level
Security (Postgres/Supabase-specific) — you'll need an equivalent access-control layer
(views, or checks in the application layer) on MariaDB.
