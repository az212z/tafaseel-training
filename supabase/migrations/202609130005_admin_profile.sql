begin;
alter table public.profiles drop constraint profiles_phone_check;
alter table public.profiles add constraint profiles_phone_check check(phone='' or phone ~ '^\+?[0-9]{9,15}$');
create or replace function public.handle_new_user() returns trigger language plpgsql security definer set search_path='' as $$declare phone_value text;begin
 phone_value:=regexp_replace(coalesce(new.raw_user_meta_data->>'phone',''),'[\s-]','','g');
 if phone_value='' and coalesce(new.raw_app_meta_data->>'bootstrap_admin','false')<>'true' then raise exception 'PHONE_REQUIRED';end if;
 insert into public.profiles(id,email,full_name,phone,city,education_level) values(new.id,new.email,trim(new.raw_user_meta_data->>'full_name'),phone_value,left(coalesce(new.raw_user_meta_data->>'city',''),100),left(coalesce(new.raw_user_meta_data->>'education_level',''),100));
 return new;end$$;
commit;
