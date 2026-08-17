# Supabase setup

## 1. Run the migration

This session could not reach Supabase's servers to run this directly (network policy in the
sandbox it was written in blocks the connection) — it's untested against your live project.
Run it yourself:

- **Supabase Dashboard**: open your project → SQL Editor → paste the contents of
  `migrations/0001_init.sql` → Run. Then do the same with `seed.sql`.
- **Supabase CLI** (alternative): `supabase db push` after linking the project, or
  `psql "$DATABASE_URL" -f supabase/migrations/0001_init.sql && psql "$DATABASE_URL" -f supabase/seed.sql`.

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

The "Sign in" screen accepts any typed corporate ID (a demo/prototype pattern, not real auth).
The RLS policies in the migration are correspondingly permissive: public read on everything,
open insert/update on submissions. **Before this goes anywhere near production**: wire up
Supabase Auth, tie `app_users.id` to `auth.uid()`, and tighten the policies so a submission's
`submitted_by` / a review's `reviewed_by` must match the signed-in user, and only users whose
role has `can_verify` can update `submissions.status`.

## 5. Porting to MariaDB later

The schema avoids Postgres-only features (no JSONB, no ENUM types, no `gen_random_uuid()` —
IDs are natural business keys like `'KPI1'`, `'Q1FY26'`) specifically so it translates to
MariaDB with mostly syntax-level changes. The one piece that won't port directly is Row Level
Security (Postgres/Supabase-specific) — you'll need an equivalent access-control layer
(views, or checks in the application layer) on MariaDB.
