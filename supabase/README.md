# Supabase setup

## 1. Run the migration

This session could not reach Supabase's servers to run this directly (network policy in the
sandbox it was written in blocks the connection) — it's untested against your live project.
Run it yourself:

- **Supabase Dashboard**: open your project → SQL Editor → paste the contents of
  `migrations/0001_init.sql` → Run. Then `migrations/0002_tighten_write_policies.sql` → Run.
  Then `seed.sql`.
- **Supabase CLI** (alternative): `supabase db push` after linking the project, or run each
  file in order with `psql "$DATABASE_URL" -f <file>`.

If you already ran `0001_init.sql` before `0002` existed, just run `0002` on its own now — it
`drop`s and replaces the four write policies it targets, so it's safe to apply on top.

## 2. Point the app at your project

Copy `.env.example` to `.env` at the repo root and fill in your project's URL and
publishable (anon) key — both are on the Supabase dashboard under Settings → API.

## 3. What's wired up vs. still static

- **Live (Supabase-backed)**: `fact_kpi_results` (published KPI figures) and `submissions`
  (the maker-checker queue) — this is the "access page → submit → verify → publish → see it
  reflected" loop. `src/lib/workflow.tsx` fetches both on load and keeps them in state so
  `latestValue()` stays a synchronous call for the 19 screens that already call it that way;
  writes go to Supabase first, with a toast if a write fails.
- **Still static** (`src/data/*.ts`, unchanged): entities, perspectives, KPI definitions,
  periods, and the headcount/financial detail datasets used for charts and breakdowns. These
  rarely change and porting them was out of scope for this first pass — the SQL migration
  already has tables and seed rows for entities/perspectives/kpis/periods if you want to wire
  them up the same way later (same pattern as `src/lib/api/facts.ts`).

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

## 5. Porting to MariaDB later

The schema avoids Postgres-only features (no JSONB, no ENUM types, no `gen_random_uuid()` —
IDs are natural business keys like `'KPI1'`, `'Q1FY26'`) specifically so it translates to
MariaDB with mostly syntax-level changes. The one piece that won't port directly is Row Level
Security (Postgres/Supabase-specific) — you'll need an equivalent access-control layer
(views, or checks in the application layer) on MariaDB.
