begin;
drop policy materials_read on storage.objects;
-- Learners download through course-material, which checks current RLS before streaming.
-- Direct object reads are restricted to administrators and the service runtime.
create policy materials_admin_read on storage.objects for select to authenticated using(bucket_id='course-materials' and (select public.is_admin()));
commit;
