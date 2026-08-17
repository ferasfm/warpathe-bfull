
-- RLS for storage.objects to allow admins to upload to 'logos' bucket
create policy "Admins can upload logos"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'logos' AND
  (public.has_role(auth.uid(), 'super_admin'))
);

create policy "Admins can update logos"
on storage.objects for update
to authenticated
using (
  bucket_id = 'logos' AND
  (public.has_role(auth.uid(), 'super_admin'))
);

create policy "Public can view logos"
on storage.objects for select
to anon, authenticated
using (bucket_id = 'logos');
