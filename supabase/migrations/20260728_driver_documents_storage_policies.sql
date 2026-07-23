-- "New row violates row-level security policy" when uploading driver
-- documents (license/vehicle photos) — storage.objects has RLS enabled
-- project-wide by default, and the 'driver-documents' bucket never got any
-- policies, so every upload was rejected regardless of who was calling it
-- (the driver themselves completing their profile, or a vendor adding an
-- internal driver).
--
-- The bucket itself still has to be created by hand in the Supabase
-- dashboard (Storage → New bucket → name it exactly "driver-documents",
-- Public) — this project doesn't manage bucket creation via SQL, only the
-- policies gating access to it once it exists.

create policy "driver_documents_insert"
  on storage.objects for insert
  with check (bucket_id = 'driver-documents' and auth.role() = 'authenticated');

create policy "driver_documents_update"
  on storage.objects for update
  using (bucket_id = 'driver-documents' and auth.role() = 'authenticated');

-- Public read: the app renders these via plain getPublicUrl() + <img src>
-- (same convention as restaurant-images / menuimages / subscription-receipts),
-- not signed URLs, so the SELECT policy must allow unauthenticated reads too.
create policy "driver_documents_read"
  on storage.objects for select
  using (bucket_id = 'driver-documents');
