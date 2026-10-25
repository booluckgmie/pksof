# Deploying to the internal server (MariaDB, no Supabase)

This is a **separate, standalone deployment target**. It does not touch `pksof.vercel.app` or
the live Supabase project — that keeps running exactly as it does today, and (once you wire up
the ongoing sync job in step 7) continues to receive this app's data as a live backup.

Everything this doc refers to was built this session and is verified working end-to-end against
a local MariaDB instance (schema, every API route, login/password-reset, file upload/download) —
see the chat for the exact commands run. What's **not** verified from here, because this sandbox
can't reach either your internal server or your live Supabase project: the actual Docker build on
real hardware, and a real run of the Supabase export. Those are the two steps below marked
**(run this yourself)**.

## What you're deploying

- **MariaDB** — the database. Schema: `server/schema.sql`. Reference data (entities, KPIs,
  periods — the handful of tables the frontend already keeps static copies of and never queries
  directly): `server/seed-reference-data.sql`.
- **The backend** (`server/`) — a small Node/TypeScript/Express API that replaces everything
  Supabase used to do: its auto-generated REST API, Auth, Storage, and the one Edge Function
  (`manage-users`). It also serves the already-built frontend, so there's only one process to run.
- **The frontend** — your existing `src/` tree, **unmodified**. A small, precise set of
  file-for-file replacements lives in `server/frontend-adapter/`, ready to drop in when you
  actually want to build *for this target* — seven files (`apiClient.ts`, the nine files under
  `src/lib/api/`, `session.tsx`, `LoginDialog.tsx`, `ResetPassword.tsx`, `AccessManagement.tsx`)
  plus two small precise edits (documented as snippets, not full files, since the surrounding
  files are mostly unrelated UI) to `UploadsPanel.tsx`. Applying them is literally copying each
  file from `server/frontend-adapter/src/...` to the matching path under `src/...` — every
  function keeps its name and signature, so nothing else in the app needs to change. **Do this
  on a separate branch or a separate checkout** — it's meant for a build that targets this
  internal server, not the one Vercel builds from today.

## 1. Provision the server

Needs: Docker + Docker Compose (recommended — everything below assumes this), reachable only on
your internal network (no inbound port-forward from the internet), outbound internet allowed
(for the backup sync job and for sending password-reset emails via SMTP).

No Docker available? `server/` is a plain Node app and `schema.sql` is plain SQL — install
Node 22 + MariaDB directly instead and skip the Docker-specific steps; everything else (schema,
routes, scripts) works the same either way.

## 2. Apply the database schema

```bash
mysql -u root -p -e "CREATE DATABASE pksof CHARACTER SET utf8mb4; CREATE USER 'pksof'@'%' IDENTIFIED BY '<a real password>'; GRANT ALL ON pksof.* TO 'pksof'@'%';"
mysql -u pksof -p pksof < server/schema.sql
mysql -u pksof -p pksof < server/seed-reference-data.sql
```

(If you're using the Docker Compose setup below instead, `docker compose up -d mariadb` creates
the database/user from `server/.env` automatically — just run the two `schema.sql` /
`seed-reference-data.sql` imports against it once it's up.)

## 3. Configure the backend

```bash
cp server/.env.example server/.env
```

Fill in: a real `DB_PASSWORD` (matching step 2), a long random `JWT_SECRET`
(`openssl rand -hex 32`), real SMTP credentials for password-reset emails, and
`PUBLIC_APP_URL` (the address staff reach this app at on your network).

## 4. Build the frontend for this target

```bash
# On a separate branch/checkout — see the note above.
# Apply the files from server/frontend-adapter/ (see "What you're deploying").
cp server/frontend-adapter/.env.example .env   # sets VITE_API_URL — point it at PUBLIC_APP_URL + /api
npm run build                                   # same command as always — produces dist/
```

## 5. Build and start the stack

```bash
docker compose up -d --build
```

This builds `server/Dockerfile` (backend + the `dist/` you just built) and starts it alongside
MariaDB. Check `docker compose logs -f api` — you should see `pksof backend listening on :4000`.

## 6. Bring over your real data **(run this yourself)**

One-time, when you're actually ready to cut over — not before:

```bash
cd server
# SUPABASE_DB_URL: Supabase dashboard -> Project Settings -> Database -> Connection string -> URI
SUPABASE_DB_URL="postgres://..." npm run migrate:export
```

This pulls every row (entities, KPIs, periods, users — including their real bcrypt password
hashes, so existing passwords keep working — KPI results, submissions, every detail table,
upload history, activity log) out of Supabase and into MariaDB. It's safe to re-run if something
goes wrong partway. It does **not** copy the original uploaded `.xlsx` files themselves (those
sit in Supabase's Storage bucket, separate from the database) — download any you specifically
need from the Supabase dashboard's Storage browser.

After this runs, point staff at the internal server's address instead of (or alongside)
`pksof.vercel.app`.

## 7. Keep Supabase as a live backup

```bash
cd server
crontab -e
# nightly at 2am:
0 2 * * * cd /path/to/pksof/server && SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... DB_HOST=... npm run migrate:sync >> /var/log/pksof-sync.log 2>&1
```

Pushes every business table from MariaDB back up to Supabase, full-table upsert each run. Two
things it deliberately does **not** sync, explained in `server/scripts/sync-to-supabase.ts`'s
own header comment: user passwords (the two systems have separate, incompatible auth models
after cutover — Supabase's copy of `app_users` shows who's who, but isn't meant to be logged
into) and the original uploaded Excel files (only the audit-trail rows about them).

## How access control moved from RLS to the backend

Supabase's Row Level Security policies had no direct MariaDB equivalent, so every rule they
enforced now lives in `server/src/middleware/auth.ts` and the route handlers in
`server/src/routes/`:

| Then (Postgres RLS) | Now |
|---|---|
| Every table `using (true)` except `app_users` (anon-readable) | Every `GET` route stays public except `/api/admin/*` and `/api/activity` — dashboards still browse with no login, same as today |
| `app_users` tightened to `authenticated` read-only | `requireAuth` middleware on every write route; `/api/admin/*` additionally requires `requireRole("admin")` |
| `resolve_login_email` security-definer function | Built into `POST /api/auth/login` directly — no separate lookup needed anymore |
| Submission/detail-submission state-machine CHECKs (insert-only-as-submitted, immutable once reviewed) | Plain `WHERE status = 'submitted'` guards in `server/src/routes/submissions.ts` / `detailSubmissions.ts`, same rules |
| `manage-users` Edge Function (service-role key, own admin check) | `server/src/routes/admin.ts` — same admin check, no separate service-role key needed since there's no second privilege tier to bridge anymore |

## Known, deliberate differences from the Supabase version

- **File downloads require auth now** (the old Supabase Storage bucket was public-read). See
  `server/frontend-adapter/src/components/pk/UploadsPanel.download.snippet.tsx`.
- **Password reset email** requires real SMTP credentials in `server/.env` — without them, the
  backend logs what it *would* have sent instead of failing (useful for testing, not for real
  use — fill in `SMTP_*` before relying on this).
- **Sessions** are a JWT (`server/.env`'s `JWT_EXPIRES_IN`, default 24h) instead of Supabase's
  auto-refreshing session — a deactivated account or changed role takes effect the next time the
  app loads or the token expires, not instantly mid-session.
