-- Storage bucket for host-uploaded experience photos, replacing the
-- paste-a-URL workaround with real file upload.

insert into storage.buckets (id, name, public)
values ('experience-photos', 'experience-photos', true)
on conflict (id) do nothing;

create policy "Public read access on experience photos"
on storage.objects for select
using (bucket_id = 'experience-photos');

create policy "Authenticated users can upload experience photos"
on storage.objects for insert
with check (bucket_id = 'experience-photos' and auth.role() = 'authenticated');

create policy "Users can update their own experience photos"
on storage.objects for update
using (bucket_id = 'experience-photos' and auth.uid() = owner)
with check (bucket_id = 'experience-photos' and auth.uid() = owner);

create policy "Users can delete their own experience photos"
on storage.objects for delete
using (bucket_id = 'experience-photos' and auth.uid() = owner);
