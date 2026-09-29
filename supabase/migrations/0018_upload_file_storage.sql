-- Lets a logged-in user download the actual Excel file behind an Upload History entry, by
-- pillar, from Verify & Publish (and Data Entry's own Uploads tab, which shares the same
-- UploadsPanel component). Until now, upload_events/upload_event_rows only recorded the parsed
-- rows a file produced -- never the file itself -- so there was nothing to download.
--
-- New "upload-files" Storage bucket holds the raw .xlsx as uploaded, one object per upload event
-- at path "<upload_event id>/<original file name>". Public read (same "no real login yet"
-- posture as every other table in this schema -- see README's security note; production
-- hardening should scope this to authenticated pillar/HOD access alongside that same fix),
-- insert-only from the client (a re-upload gets a fresh upload_events id, so nothing ever
-- overwrites an existing object), delete allowed only so deleteUploadEvent can clean up the
-- matching object rather than leaving it orphaned when its audit-trail row is deleted (0015).
insert into storage.buckets (id, name, public) values ('upload-files', 'upload-files', true);

create policy "public read upload-files" on storage.objects
  for select using (bucket_id = 'upload-files');

create policy "public upload upload-files" on storage.objects
  for insert with check (bucket_id = 'upload-files');

create policy "public delete upload-files" on storage.objects
  for delete using (bucket_id = 'upload-files');

-- Nullable: storage upload is best-effort (see DataEntry.tsx) -- a failure there shouldn't block
-- the actual data submission, so older rows (and any upload whose file save failed) simply have
-- no download available, rather than the whole audit-trail insert failing.
alter table upload_events add column file_path varchar(300);
