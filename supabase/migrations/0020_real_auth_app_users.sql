-- Real authentication: app_users gains the columns a real Supabase Auth-backed login needs
-- (email for sign-in/password-reset, a new approving_officer role the client's own access
-- matrix calls for, assigned_module so a pillar-locked login's pillar lives in the DB instead
-- of being picked from a dropdown, a link to the real auth.users row, and a forced-password-
-- change flag for the shared "prokhas" default every seeded account starts on).
--
-- Scope note: this migration does NOT touch any other table's RLS. Every other table stays
-- exactly as open as it is today (`using (true)` everywhere, confirmed across every prior
-- migration) -- that's a deliberate, separate decision, not an oversight. The one RLS change
-- here is narrowed to app_users itself, because this table is about to start holding real
-- email addresses and a direct link to real auth identities, so it can't stay anon-readable
-- the way it's been since 0001_init.sql.

alter table app_users add column email varchar(150);
alter table app_users add column assigned_module varchar(4) check (assigned_module in ('CP', 'FH', 'RP'));
alter table app_users add column auth_user_id uuid unique;
alter table app_users add column must_change_password boolean not null default true;
alter table app_users add column active boolean not null default true;

-- Backfill required for any pre-existing row before the NOT NULL is added (there are none today
-- -- app_users has never actually been written to by the app -- but this keeps the migration
-- safe to run against a table that does have rows).
update app_users set email = id || '@prokhas.com.my' where email is null;
alter table app_users alter column email set not null;

-- Widen the role check (last touched 0011_remove_pmo_checker_role.sql) to add the new role.
alter table app_users drop constraint if exists app_users_role_check;
alter table app_users add constraint app_users_role_check
  check (role in ('board', 'exec', 'dept_head', 'reporting_officer', 'approving_officer', 'admin'));

-- app_users now carries real emails and the auth_user_id linkage -- stop it being world-readable
-- (it was `public read app_users` / `using (true)` since 0001_init.sql). Every other table's
-- policies are untouched; see the scope note above.
drop policy if exists "public read app_users" on app_users;
create policy "authenticated read app_users" on app_users for select to authenticated using (true);

-- Signing in by username (the "nhba" style ids in the client's spreadsheet, not a full email
-- address) needs to resolve username -> email BEFORE the person is authenticated -- but the
-- table itself is now authenticated-only (above). A single-purpose function is a much narrower
-- surface than reopening a public SELECT policy on the whole table: it reveals nothing except
-- "does this username exist, and if so what's its email", the same amount a password-reset flow
-- already has to reveal.
create or replace function resolve_login_email(p_username text)
returns text
language sql
security definer
set search_path = public
as $$
  select email from app_users where id = p_username and active;
$$;

revoke all on function resolve_login_email(text) from public;
grant execute on function resolve_login_email(text) to anon, authenticated;

-- A signed-in user needs to clear their OWN must_change_password flag once they've set a new
-- password (the forced-first-login / recovery flow, app-side) -- but nothing else about app_users
-- should be self-editable (a policy keyed only on "is this your own row" would otherwise let
-- someone update their own role to admin via the same REST call). The RLS policy restricts WHICH
-- ROW; the column grant below separately restricts WHICH COLUMN -- both are needed together.
create policy "self update own password flag" on app_users for update
  to authenticated
  using (auth_user_id = auth.uid())
  with check (auth_user_id = auth.uid());

revoke update on app_users from authenticated;
grant update (must_change_password) on app_users to authenticated;
