begin;
create schema if not exists private;
revoke all on schema private from public,anon,authenticated;
create table private.account_bootstrap(token uuid primary key,email text not null,expires_at timestamptz not null default now()+interval '5 minutes');
revoke all on private.account_bootstrap from public,anon,authenticated;
-- An expiring, one-use nonce lets the service provision the owner without fabricating a phone number.
-- It never grants an administrative role; that remains a separate service-only operation.
create or replace function public.handle_new_user() returns trigger language plpgsql security definer set search_path='' as $$declare phone_value text;invited_email text;begin
 phone_value:=regexp_replace(coalesce(new.raw_user_meta_data->>'phone',''),'[\s-]','','g');
 if phone_value='' then
 delete from private.account_bootstrap where token::text=new.raw_user_meta_data->>'bootstrap_nonce' and email=new.email and expires_at>now() returning email into invited_email;
 if invited_email is null then raise exception 'PHONE_REQUIRED';end if;
 end if;
 insert into public.profiles(id,email,full_name,phone,city,education_level) values(new.id,new.email,trim(new.raw_user_meta_data->>'full_name'),phone_value,left(coalesce(new.raw_user_meta_data->>'city',''),100),left(coalesce(new.raw_user_meta_data->>'education_level',''),100));
 return new;end$$;
drop policy courses_read on public.courses;
create policy courses_public_read on public.courses for select to anon using(status='active');
create policy courses_authenticated_read on public.courses for select to authenticated using(status='active' or (select public.is_admin()));
revoke execute on function public.is_admin() from anon;
commit;
