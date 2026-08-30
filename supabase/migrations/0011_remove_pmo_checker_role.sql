-- 28 Aug 2026 Prokhas meeting: "remove role: PMO & Administrator; Department Head will verify
-- and publish." The checker role (labeled "PMO & Administrator" in src/lib/roles.ts) is retired
-- -- Department Head (dept_head) already had independent verify/publish rights for its own
-- pillar and is now the sole non-admin role that can approve & publish a submission.
--
-- Remove any seeded/real users still on the old role, then tighten app_users.role's check
-- constraint to match the app's Role union (src/types.ts) with 'checker' dropped.
delete from app_users where role = 'checker';

alter table app_users drop constraint if exists app_users_role_check;
alter table app_users add constraint app_users_role_check
  check (role in ('board', 'exec', 'dept_head', 'reporting_officer', 'admin'));
