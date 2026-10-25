-- "Customize table" safety net for the Excel upload template — the client's own idea, from a
-- live engagement note: any data in an uploaded template that's extra, unrecognized, or
-- conflicting must never be silently discarded; it should be captured here for a human to review
-- afterward, so no uploader's typed figure or typo'd row ever just vanishes.
--
-- Today (see src/lib/excelTemplate.ts's parseWorkbook), any upload row/column that doesn't match
-- the template manifest exactly, or any cell that isn't a parseable number on an otherwise
-- matched row, is dropped with a bare `continue` -- no toast, no log, no audit row. This table is
-- the landing place for exactly those cases, written in the same upload pass that writes the
-- rows that DID match (see DataEntry.tsx's handleSubmitParsed), linked to the same upload_events
-- row (migration 0012) so an admin can trace an overflow entry back to the file it came from.
--
-- Unlike upload_events/upload_event_rows (a pure, immutable audit trail), this table's whole
-- point is to be acted on afterward -- an admin/approving officer reviews each pending entry and
-- either maps it onto a real field (and submits that value through the normal checker queue),
-- marks it as a duplicate/non-issue, or flags it for the next template regeneration. Update is
-- therefore allowed, same open "using (true)" RLS convention as every other table in this schema
-- (app_users is the one deliberate exception, from the real-auth build) -- not tightened here.
create table template_overflow_entries (
  id                   varchar(40)  primary key,
  upload_id            varchar(40)  not null references upload_events(id) on delete cascade,
  entity_id            varchar(20)  not null references entities(id) on delete cascade,

  -- What the parser saw, verbatim, before any match attempt -- deliberately all free text (never
  -- numeric), since the entire point is that this content didn't fit the expected shape.
  sheet                varchar(60)  not null,
  period_label         varchar(40),
  row_label            varchar(300),
  row_sub              varchar(200),
  raw_value            varchar(2000),

  reason               varchar(20)  not null check (reason in
                         ('unmatched_row', 'unmatched_column', 'non_numeric_value', 'conflict')),
  -- reason = 'conflict' only: the other value this same (sheet, label, sub, period) key held
  -- elsewhere in the same upload -- the write that actually landed still goes through unchanged
  -- (today's existing "last value wins" behaviour for a duplicated row), this is purely so the
  -- fact that a conflict happened is no longer invisible.
  conflict_with_value  varchar(2000),

  status               varchar(20)  not null default 'pending'
                         check (status in ('pending', 'mapped', 'ignored', 'flagged_for_template')),
  resolved_by          varchar(100),
  resolved_at          timestamptz,
  resolution_note      varchar(500),
  -- Populated only when status = 'mapped' -- which real field a reviewer transcribed this
  -- overflow row's value onto, for traceability from the queue to the live submission it became.
  mapped_dest          varchar(10)  check (mapped_dest in ('kpi', 'metric', 'record')),
  mapped_key           varchar(300),

  created_at           timestamptz  not null default now()
);

create index idx_template_overflow_upload on template_overflow_entries(upload_id);
create index idx_template_overflow_entity on template_overflow_entries(entity_id);
create index idx_template_overflow_status on template_overflow_entries(status);

alter table template_overflow_entries enable row level security;

create policy "public read template_overflow_entries" on template_overflow_entries for select using (true);
create policy "public write template_overflow_entries" on template_overflow_entries for insert with check (true);
create policy "public update template_overflow_entries" on template_overflow_entries for update using (true) with check (true);
