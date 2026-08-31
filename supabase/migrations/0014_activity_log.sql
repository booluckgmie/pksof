-- Progress-tracking enhancement: a genuine "user activity" audit trail. Submissions already log
-- submit/approve/reject (see the `submissions` table and Verify & Publish's "Audit trail" tab) and
-- upload_events (0012) already logs every Excel upload -- the one user action nothing captured was
-- signing in. This table adds that, and Verify & Publish's new "Activity" tab merges all three
-- (logins + submissions + uploads) into one chronological feed instead of duplicating what those
-- two tables already record.

create table activity_log (
  id          varchar(40)  primary key,
  user_name   varchar(100) not null,
  role        varchar(30)  not null,
  entity_id   varchar(20)  references entities(id) on delete set null,
  action      varchar(20)  not null check (action in ('login')),
  detail      varchar(200),
  created_at  timestamptz  not null default now()
);

create index idx_activity_log_created_at on activity_log(created_at desc);

alter table activity_log enable row level security;

create policy "public read activity_log" on activity_log for select using (true);
create policy "public write activity_log" on activity_log for insert with check (true);
-- No update/delete policy — same append-only, no-real-auth-yet caveat as upload_events (0012).
