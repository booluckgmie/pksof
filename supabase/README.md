# Supabase setup

## 1. Run the migration

This session could not reach Supabase's servers to run this directly (network policy in the
sandbox it was written in blocks the connection) — it's untested against your live project.
Run it yourself:

- **Supabase Dashboard**: open your project → SQL Editor → run, in order: `migrations/0001_init.sql`,
  `migrations/0002_tighten_write_policies.sql`, `migrations/0003_detail_data.sql`,
  `migrations/0004_allow_pending_submission_edits.sql`, `migrations/0005_org_settings.sql`,
  `migrations/0006_monthly_periods.sql`, `migrations/0007_kpi_fy_targets.sql`,
  `migrations/0008_allow_published_edits.sql`, `migrations/0009_widen_detail_record_id.sql`,
  `migrations/0010_lock_published_submissions.sql`, `migrations/0011_remove_pmo_checker_role.sql`,
  `migrations/0012_upload_audit_trail.sql`, then `seed.sql`.
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
  `admin_expense_detail`, `personnel_expense_detail`, `pl_detail`, and `receivables_aging` —
  line-item figures added to close the gap between the dashboard and the client's own Q1 2026
  MEC report deck (revenue by counterparty, admin/personnel expense breakdowns, P&L items below
  PBT, receivables aging buckets). The 3-pillar Excel template (below) writes these exactly like
  any other `detail_metrics` row, but `src/lib/details.tsx` doesn't reshape them into chart data
  yet, so nothing renders on a dashboard screen from these fields today. Deliberately left out of
  this pass: the deposit/placement schedule and receivables aging by named client — both are
  multi-row datasets that belong in `detail_records` (like `related_party_txn`/initiatives), and
  no entry UI exists for those. Also left out: the monthly forecast schedule, a forward-budgeting
  artifact, a different kind of thing from the quarterly actuals this app reports.
  **Fixed in this pass**: the old template wrote balance-sheet line items to a metric key,
  `balance_sheet_detail`, that `details.tsx`'s `balanceSheet` reshaping never actually read (it
  reads `balance_sheet`/`balance_sheet_lines`) — anyone who filled in that section of the old
  template had it silently vanish. The new template targets the real keys.

## 3a. Data-entry template — 3 pillar sheets, one file per quarter

`scripts/generate_data_entry_template.py` (run `python3 scripts/generate_data_entry_template.py`
from the repo root, needs `pip install openpyxl`) generates one standard Data Entry workbook
**per reporting quarter** — `scripts/output/pksof_data_entry_<QID>.xlsx` for each of
Q2 FY2025 → Q2 FY2026 by default (5 files, matching a real submission cycle: one file per period,
not one giant multi-quarter file). Every file shares the identical 3-pillar layout — one sheet
per dashboard pillar (**Corporate Performance**, **Financial Health**, **Resource & People**),
each a flat table of every figure that pillar's screens display, one row per figure — but carries
only that single quarter's value column, headed with the exact period label (e.g. `Q2 FY2026`).
Uploading a file writes to whichever quarter its own column header names — Data Entry no longer
asks which period to submit for first, since each file carries its own period identity.

Each sheet also carries a **"Displayed on Dashboard"** column: a plain-language note, filled in
per section from the script's own `SCREEN_FOR` lookup, telling whoever is completing the sheet
which actual screen/tab that row's figure feeds (e.g. "CP004 Mandate & Governance — Governance
Index panel"), or that the row isn't surfaced anywhere yet. It's informational only — the parser
in `src/lib/excelTemplate.ts` ignores that column entirely and keys off `(sheet, label, sub)` same
as before, so this is purely a preparer-facing addition, not a schema change.

The same script also regenerates `src/lib/templateFields.generated.ts`, the lookup table
`src/lib/excelTemplate.ts`'s parser matches rows against — both are emitted from one Python
manifest in the script, so the template and the parser that reads it back can never drift out of
sync the way the old per-sheet `*_MAP` constants eventually could.

Anchor values for the Q1 FY2026 column are pulled live from this file's own `fact_kpi_results`/
`detail_metrics` inserts wherever that quarter is already seeded; every other cell is a
deterministic, smooth projection around that anchor (or a plausible fabricated base, for the
metric keys documented above as never having been seeded at all). Not covered by this template —
still entered directly in-app, since they're free-form catalogs rather than one number per
quarter: process/tech initiatives, People Development Programme (CP009), related-party
transactions, and CP003's PBT/CIR drill-down breakdown (`financial_breakdown`).

**Also fixed while auditing this**: `fact_kpi_results`'s Q1 FY2026 rows for KPI1, KPI2, KPI11 and
KPI12 still had this session's earlier, pre-correction figures (see CP003's metric-strip commit
and the Bumiputera Empowerment data-fix commit) — only `src/data/factSeed.ts`, the client-side
fallback, had been updated. Both now agree.
- **Still static** (`src/data/*.ts`): entities, perspectives, KPI definitions, periods, and a
  handful of genuinely-fixed reference constants (`industryBenchmark`, `priorYearTrained`, the
  People Development programme catalog in `src/lib/details.tsx`) that are organisational
  metadata rather than quarterly-reported figures.
- **Org-wide settings (`org_settings`, `0005`)**: currently just the fiscal year-end month —
  admin-editable from the Settings screen (System Administrator role only), read app-wide via
  `src/lib/orgSettings.tsx`'s `OrgSettingsProvider`. Falls back to `FISCAL_YEAR_END_MONTH` in
  `src/data/periods.ts` if Supabase isn't reachable.
- **Monthly periods (`0006`)**: adds `granularity`/`parent_period_id` columns to `periods` and 36
  month-level rows (one per quarter, 2025–2027), purely so `detail_metrics` can carry
  month-resolution Financial Trend figures (PFH002's Quarterly/Monthly toggle). KPI achievement
  scoring (`fact_kpi_results`/`submissions`) stays quarterly-only — that's the Group's actual
  assessment cadence, not something this widens. See `src/data/periods.ts`'s `monthPeriods`.
  **Entry path removed**: Data Entry's web form (including the "Monthly Financial Detail"
  mini-form that used to write these) was removed per client request — Data Entry is now
  Excel-template-upload only, and the template doesn't have a monthly sheet yet, so monthly
  figures currently need a direct Supabase write until that's added.
- **KPI FY targets (`kpi_fy_targets`, `0007`)**: per-(kpi_id, fy) override of each KPI's full-year
  target, admin-editable from the Settings screen's "KPI Targets" table. Falls back to the static
  `fyTarget` in `src/data/kpis.ts` when no override exists for a given FY. Read via
  `src/lib/kpiTargets.tsx`'s `KpiTargetsProvider`; `src/lib/workflow.tsx`'s `latestValue()` swaps
  it in wherever it previously read `kpiById(id).fyTarget` directly, so achievement scoring
  reflects the live per-FY target automatically. KPI metadata otherwise (name/weight/unit/
  direction) stays static — only the target resets year to year in practice.
- **People Development Programme (CP009)**: split out of CP007 (Organisational Capacity) into
  its own Corporate Performance screen, same as Bumiputera Empowerment (CP008) is its own screen
  rather than folded into another perspective — CP007 now shows only KPI9 (Recruitment Efficiency
  Index). A new `detail_records` `record_type` value, `'people_dev_programme'` — `category` holds
  the sub-area (Talent Management / Succession Management / Performance Management /
  Talent-Culture Engagement), `text_note` packs `start|end|status|detail`, same convention as
  `process_initiative`/`tech_initiative`. CP009 is the first screen with real add/edit/delete UI
  for a `detail_records` dataset (previously all ~15 of them were read-only, entered by writing
  rows to Supabase directly). `seed.sql` now carries the client's full Q1FY26 programme list
  (SEED-0025 through SEED-0035, 11 rows across all four sub-areas) — the detail column packs both
  the plan and the free-text progress note the client's source table showed as two separate
  columns, since CP009 only has one `detail` field per entry.
- **CP003 drill-down breakdown (`financial_breakdown`, new)**: clicking KPI1 (PBT) or KPI2
  (Cost-to-Income Ratio)'s trend chart reveals a line-item breakdown table — `category` is
  `'PBT'` or `'CIR'`, `value_num`/`value_num2` hold FY target/YTD actual, `text_note` packs YTD
  target as a plain number string (CIR's rows leave both null — that breakdown only ever showed
  a single actual-figures column in the client's source report, no per-line targets). This is a
  separate, hand-seeded dataset (SEED-0036 through SEED-0048) matching the client's reference
  figures exactly — it is **not** wired to the `revenue_by_source`/`expense_by_category`/
  `pl_detail` entry-only fields documented above; reshaping those into a target/actual/variance
  table would need per-line-item targets the entry schema doesn't carry today. Also: KPI1's FY
  target moved from a placeholder RM100.0m to the client's real RM106.2m, KPI2's from 58.0% to
  55.0%, and both KPIs' Q1FY26 YTD target/actual were corrected to match (`src/data/kpis.ts`,
  `src/data/factSeed.ts`).

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
`published`/`rejected`, and `fact_kpi_results` can only be written for a kpi/entity/period/value
that has a matching `published` row in `submissions` — so a figure can't be forged on the
dashboard without a real approval trail behind it.

**`0008_allow_published_edits.sql` briefly narrowed that guarantee, by explicit client request —
`0010_lock_published_submissions.sql` reverses it.** 0008 let a published submission's value/note
be edited directly from Data Entry's "Recent submissions" panel. The 28 Aug 2026 Prokhas progress
meeting decided the opposite: once a submission is locked/HoD-approved (i.e. `published`), it
cannot be edited — only a still-`submitted` (pending) row can. 0010 drops 0008's permissive
UPDATE policy, restoring the original guarantee that `submitted → published/rejected` is the only
mutation a submission ever gets. This also fixes a real bug 0008 had introduced:
`updateSubmissionValue()` (`src/lib/api/submissions.ts`) still filtered its `UPDATE` on
`status = 'submitted'`, so an "edit" of a published row matched zero rows in `submissions` and
silently failed to persist there, even though the UI showed a success toast and `fact_kpi_results`
*did* get the new value — the two tables drifted out of sync on every published-row edit. Reverting
the feature removes the code path that could do that. Data Entry's edit-pencil is now shown only
for `status === "submitted"` rows, matching the DB-level lock. (`periods.ts`'s
`isOpenForEntry: true` for every period is unrelated and unchanged — that's about which period a
*new* submission can target, not about editing an existing one after publish.)

That's still not identity-based, though. **Before this goes anywhere near production**: wire up
Supabase Auth, tie `app_users.id` to `auth.uid()`, and add policies so a submission's
`submitted_by` / a review's `reviewed_by` must match the signed-in user, and only users whose
role has `can_verify` can update `submissions.status`.

`detail_metrics`/`detail_records` (0003), `org_settings` (0005) and `kpi_fy_targets` (0007) are
all open write (`with check (true)`) — there's no approval-trail check to enforce the way there
is for KPI facts, since building a second maker-checker queue for these datasets was out of scope
for this pass. Same production caveat applies, doubly so: tie writes to a signed-in, role-checked
user before this is real.

**`0012_upload_audit_trail.sql`** adds the progress-tracking features from the 28 Aug 2026
Prokhas meeting: two new append-only tables, `upload_events` (one row per Excel upload — file
name, entity, sheets/periods present, uploader, timestamp, saved/failed row counts) and
`upload_event_rows` (one row per individual KPI/metric/record row that upload touched, with its
own saved/failed outcome and error message). Written from `handleSubmitParsed` in
`src/pages/workflow/DataEntry.tsx` on every upload, alongside the existing KPI-submission and
detail_metrics/detail_records writes — nothing about the upload's own effects changed, this only
adds a record of what happened. Neither table has an update/delete policy — an audit trail that
could be edited after the fact wouldn't be much of one.

Verify & Publish's new **Uploads** tab (`src/pages/workflow/VerifyPublish.tsx`) reads these two
tables: a per-entity progress summary (files/saved/failed), a searchable+paginated list of past
uploads, and a click-to-expand per-row detail view for each one — reusing the same `Pager`/search
pattern the Pending and Audit trail tabs already had. "Tracking by department" uses entity + the
sheet(s) present as the closest existing proxies, since the app has no separate department
dimension yet; the sheet names line up with the app's own CP/FH/RP pillar grouping.

**`0009_widen_detail_record_id.sql`** fixes a real bug, not a policy change: `detail_records.id`
was `varchar(40)`, sized back when ids were short hand-picked strings like `INIT-001`. The 3-pillar
Excel template's upload path derives a deterministic id per row instead — `TPL-<record_type>-
<slugified label>-<period_id>` — so re-uploading the same file updates the same row rather than
duplicating it. For longer labels (governance_index's checklist items in particular) that id runs
past 40 characters, so every one of those rows silently failed to save on upload with a
"value too long for type character varying(40)" error until this ran. Widened to `varchar(160)`.

**Entity-name/figure anonymization — still an open decision, not yet real.** CP004's Managed
Entities table masks other-entity names/figures (`anonymizedEntityLabel` in `src/lib/anonymize.ts`)
behind `isRestrictedPillar`, but that flag also fully blocks a restricted-pillar login from
reaching CP004 at all (`App.tsx`'s `HQ_ONLY_GROUPS` check) — so today, nobody who can load CP004
ever sees a masked row; the code path exists but is currently unreachable. The client's actual
ask ("remove entity names/metrics for other entities") needs a real scenario first — *which*
viewer role should see anonymized labels, and for *which* entities — before this does anything.
Don't treat the CP004 masking code as a finished feature; it's scaffolding for whenever that
scenario is defined.

**Dashboards are now public; login is only required to write.** The old full-page Login screen
is gone — `App.tsx` no longer gates rendering on `loggedIn`. Anyone who loads the site sees Main
and every CP/FH/PFH/RP screen immediately, unauthenticated, with a "Login" button in the top-right
(opens `LoginDialog` instead of navigating away). Only `DATA_ENTRY`, `VERIFY_PUBLISH`, and
`SETTINGS` require a real sign-in (`LOGIN_REQUIRED_SCREENS` in `App.tsx`) — this doesn't weaken
anything that was actually enforcing access before, since the old Login screen was a client-side
role picker with no real auth behind it either (see the note above this section) — it just makes
that fact honest instead of implying a login wall that wasn't backed by anything. Before this is
a real production public/private split, the same "wire up Supabase Auth" caveat above applies.

The sign-in dialog's role list is further trimmed to roles that can actually write (Reporting
Officer, Dept Head, System Administrator) — Board & Directors and Executive Management were
dropped since they're read-only and read access is already open to everyone. Signed-in "normal"
roles (Reporting Officer, Dept Head) get a slim sidebar (Main + their own Data Governance items);
the full CP/FH/RP screen menu is shown only to System Administrator — see `isAdminTier` in
`src/components/layout/Sidebar.tsx`.

**`0011_remove_pmo_checker_role.sql` retires the `checker` role** ("PMO & Administrator"), per the
28 Aug 2026 Prokhas meeting: "remove role: PMO & Administrator; Department Head will verify and
published." Department Head (`dept_head`) already had independent verify/publish rights scoped to
its own pillar and is now the only non-admin role that can approve & publish a submission — there
is no longer a cross-pillar checker role. The migration deletes any `app_users` row still on
`checker` and tightens that table's role check constraint to match; `src/types.ts`'s `Role` union
and `src/lib/roles.ts`'s `roleDefs` drop it too.

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
