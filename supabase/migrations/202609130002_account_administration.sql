begin;
alter table public.profiles add column must_change_password boolean not null default false;
create or replace function public.is_active_user() returns boolean language sql stable security definer set search_path='' as $$select exists(select 1 from public.profiles where id=auth.uid() and status='active' and not must_change_password)$$;
create or replace function public.is_admin() returns boolean language sql stable security definer set search_path='' as $$select exists(select 1 from public.admin_users a join public.profiles p on p.id=a.user_id where a.user_id=auth.uid() and p.status='active' and not p.must_change_password)$$;
grant select on public.admin_users to authenticated;
create policy admin_staff_read on public.admin_users for select to authenticated using((select public.is_admin()));
create function public.admin_update_profile(p_user uuid,p_name text,p_phone text,p_city text,p_education text) returns void language plpgsql security definer set search_path='' as $$begin
 if not public.is_admin() then raise exception 'FORBIDDEN';end if;
 update public.profiles set full_name=trim(p_name),phone=regexp_replace(p_phone,'[\s-]','','g'),city=trim(p_city),education_level=trim(p_education) where id=p_user;
 insert into public.audit_logs(actor_id,action,table_name,record_id) values(auth.uid(),'UPDATE_PROFILE','profiles',p_user::text);
end$$;
revoke all on function public.admin_update_profile(uuid,text,text,text,text) from public,anon;
grant execute on function public.admin_update_profile(uuid,text,text,text,text) to authenticated;
commit;
