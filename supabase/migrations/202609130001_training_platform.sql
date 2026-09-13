begin;
create table public.profiles (
 id uuid primary key references auth.users on delete cascade,
 full_name text not null check(char_length(trim(full_name)) between 2 and 100),
 email text not null,
 phone text not null check(phone ~ '^\+?[0-9]{9,15}$'),
 city text not null default '' check(char_length(city)<=100),
 education_level text not null default '' check(char_length(education_level)<=100),
 status text not null default 'active' check(status in ('active','suspended')),
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.admin_users(user_id uuid primary key references public.profiles on delete cascade, created_at timestamptz not null default now());
alter table public.admin_users enable row level security;
revoke all on public.admin_users from anon,authenticated;
create function public.is_admin() returns boolean language sql stable security definer set search_path='' as $$select exists(select 1 from public.admin_users a join public.profiles p on p.id=a.user_id where a.user_id=auth.uid() and p.status='active')$$;
create function public.is_active_user() returns boolean language sql stable security definer set search_path='' as $$select exists(select 1 from public.profiles where id=auth.uid() and status='active')$$;
create function public.handle_new_user() returns trigger language plpgsql security definer set search_path='' as $$
begin
 insert into public.profiles(id,email,full_name,phone,city,education_level) values(new.id,new.email,trim(new.raw_user_meta_data->>'full_name'),regexp_replace(coalesce(new.raw_user_meta_data->>'phone',''),'[\s-]','','g'),left(coalesce(new.raw_user_meta_data->>'city',''),100),left(coalesce(new.raw_user_meta_data->>'education_level',''),100));
 return new;
end $$;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();
create function public.sync_email() returns trigger language plpgsql security definer set search_path='' as $$begin update public.profiles set email=new.email,updated_at=now() where id=new.id; return new; end$$;
create trigger on_auth_email_updated after update of email on auth.users for each row execute function public.sync_email();
create table public.courses (
 id text primary key default gen_random_uuid()::text check(char_length(id)<=80),
 title text not null check(char_length(trim(title)) between 2 and 160), summary text not null default '' check(char_length(summary)<=3000),
 category text not null default 'شامل' check(category in ('شامل','كمي','لفظي')),
 level text not null default 'جميع المستويات', status text not null default 'draft' check(status in ('draft','active','archived')),
 price numeric(10,2) check(price>=0), duration_hours integer check(duration_hours between 1 and 1000),
 created_at timestamptz not null default now(),updated_at timestamptz not null default now()
);
create table public.cohorts (
 id uuid primary key default gen_random_uuid(),course_id text not null references public.courses,
 name text not null check(char_length(trim(name)) between 2 and 160), starts_at date,ends_at date,
 schedule text not null default '' check(char_length(schedule)<=1000), meeting_url text not null default '' check(meeting_url='' or meeting_url ~ '^https://'),
 capacity integer not null default 30 check(capacity between 1 and 10000),status text not null default 'upcoming' check(status in ('upcoming','active','completed')),
 created_at timestamptz not null default now(), check(ends_at is null or starts_at is null or ends_at>=starts_at),unique(id,course_id)
);
create table public.enrollments (
 id uuid primary key default gen_random_uuid(),user_id uuid not null references public.profiles on delete cascade,course_id text not null references public.courses,
 cohort_id uuid, status text not null default 'pending' check(status in ('pending','active','paused','completed','cancelled')),
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(),unique(user_id,course_id), foreign key(cohort_id,course_id) references public.cohorts(id,course_id)
);
create table public.lessons (
 id uuid primary key default gen_random_uuid(),course_id text not null references public.courses,
 module text not null default 'المحتوى التدريبي' check(char_length(module)<=160),title text not null check(char_length(trim(title)) between 2 and 160),
 content text not null default '' check(char_length(content)<=60000), video_url text not null default '' check(video_url='' or video_url ~ '^https://'),
 file_path text not null default '',duration_minutes integer not null default 10 check(duration_minutes between 1 and 600),position integer not null default 1 check(position between 1 and 10000),is_published boolean not null default false,
 created_at timestamptz not null default now(),updated_at timestamptz not null default now()
);
create table public.lesson_progress(user_id uuid not null references public.profiles on delete cascade,lesson_id uuid not null references public.lessons on delete cascade,completed boolean not null default true,updated_at timestamptz not null default now(),primary key(user_id,lesson_id));
create table public.invoices (
 id uuid primary key default gen_random_uuid(),enrollment_id uuid not null references public.enrollments on delete cascade,
 title text not null check(char_length(trim(title)) between 2 and 160),amount numeric(10,2) not null check(amount>0),due_date date not null,
 status text not null default 'issued' check(status in ('issued','void')),created_at timestamptz not null default now()
);
create table public.payments (
 id uuid primary key default gen_random_uuid(),invoice_id uuid not null references public.invoices on delete cascade,
 amount numeric(10,2) not null check(amount>0),method text not null check(method in ('bank_transfer','cash','card')),
 reference text not null default '' check(char_length(reference)<=160),note text not null default '' check(char_length(note)<=500),
 status text not null default 'posted' check(status in ('posted','void')),recorded_by uuid references public.profiles,created_at timestamptz not null default now()
);
create table public.learning_states(user_id uuid primary key references public.profiles on delete cascade,state jsonb not null default '{"version":1,"attempts":[],"savedCourses":[],"plan":[],"draft":null,"session":null}' check(jsonb_typeof(state)='object' and octet_length(state::text)<150000),updated_at timestamptz not null default now());
create table public.support_tickets (
 id uuid primary key default gen_random_uuid(),user_id uuid not null references public.profiles on delete cascade,
 subject text not null check(char_length(trim(subject)) between 2 and 160),body text not null check(char_length(trim(body)) between 5 and 4000),
 status text not null default 'open' check(status in ('open','closed')),reply text not null default '' check(char_length(reply)<=5000),created_at timestamptz not null default now(),updated_at timestamptz not null default now()
);
create table public.announcements (
 id uuid primary key default gen_random_uuid(),course_id text references public.courses,
 title text not null check(char_length(trim(title)) between 2 and 160),body text not null check(char_length(trim(body)) between 2 and 5000),is_published boolean not null default false,created_at timestamptz not null default now()
);
create table public.audit_logs(id bigint generated always as identity primary key,actor_id uuid references public.profiles on delete set null,action text not null,table_name text not null,record_id text,created_at timestamptz not null default now());
create index profiles_name_idx on public.profiles(full_name);
create index enrollments_course_idx on public.enrollments(course_id);
create index enrollments_cohort_idx on public.enrollments(cohort_id);
create index lessons_course_idx on public.lessons(course_id,position);
create index progress_lesson_idx on public.lesson_progress(lesson_id);
create index invoices_enrollment_idx on public.invoices(enrollment_id);
create index payments_invoice_idx on public.payments(invoice_id);
create index tickets_user_idx on public.support_tickets(user_id);
create index announcements_course_idx on public.announcements(course_id);
create index audit_actor_idx on public.audit_logs(actor_id);
create function public.can_learn(course text) returns boolean language sql stable security definer set search_path='' as $$select public.is_active_user() and exists(select 1 from public.enrollments e join public.courses c on c.id=e.course_id where e.user_id=auth.uid() and e.course_id=course and e.status in ('active','completed') and c.status='active')$$;
create function public.touch_updated_at() returns trigger language plpgsql set search_path='' as $$begin new.updated_at=now();return new;end$$;
create function public.audit_change() returns trigger language plpgsql security definer set search_path='' as $$begin insert into public.audit_logs(actor_id,action,table_name,record_id) values(auth.uid(),TG_OP,TG_TABLE_NAME,coalesce(to_jsonb(new)->>'id',to_jsonb(old)->>'id'));return coalesce(new,old);end$$;
do $$declare t text;begin
 foreach t in array array['profiles','courses','cohorts','enrollments','lessons','lesson_progress','invoices','payments','learning_states','support_tickets','announcements','audit_logs'] loop execute format('alter table public.%I enable row level security',t);end loop;
 foreach t in array array['profiles','courses','enrollments','lessons','lesson_progress','learning_states','support_tickets'] loop execute format('create trigger touch_updated before update on public.%I for each row execute function public.touch_updated_at()',t);end loop;
 foreach t in array array['courses','cohorts','enrollments','lessons','invoices','payments','announcements'] loop execute format('create trigger audit_write after insert or update or delete on public.%I for each row execute function public.audit_change()',t);end loop;
end$$;
-- Every exposed table starts with no privileges; only the operations below are granted.
revoke all on all tables in schema public from anon,authenticated;
grant select on public.courses to anon,authenticated;
grant select on public.profiles,public.enrollments,public.cohorts,public.lessons,public.lesson_progress,public.invoices,public.payments,public.learning_states,public.support_tickets,public.announcements,public.audit_logs to authenticated;
grant insert,update on public.courses,public.cohorts,public.enrollments,public.lessons,public.lesson_progress,public.learning_states,public.announcements to authenticated;
grant delete on public.lesson_progress to authenticated;
create policy profiles_read on public.profiles for select to authenticated using(id=(select auth.uid()) or (select public.is_admin()));
create policy courses_read on public.courses for select using(status='active' or (select public.is_admin()));
create policy courses_admin_write on public.courses for all to authenticated using((select public.is_admin())) with check((select public.is_admin()));
create policy enrollment_read on public.enrollments for select to authenticated using((user_id=(select auth.uid()) and (select public.is_active_user())) or (select public.is_admin()));
-- Enrollment mutations go through a transactional RPC to enforce cohort capacity.
revoke insert,update on public.enrollments from authenticated;
create policy cohorts_read on public.cohorts for select to authenticated using((select public.is_admin()) or ((select public.is_active_user()) and exists(select 1 from public.enrollments e where e.cohort_id=id and e.user_id=(select auth.uid()))));
create policy cohorts_admin_write on public.cohorts for all to authenticated using((select public.is_admin())) with check((select public.is_admin()));
create policy lessons_read on public.lessons for select to authenticated using((select public.is_admin()) or (is_published and public.can_learn(course_id)));
create policy lessons_admin_write on public.lessons for all to authenticated using((select public.is_admin())) with check((select public.is_admin()));
create policy progress_read on public.lesson_progress for select to authenticated using((select public.is_admin()) or (user_id=(select auth.uid()) and (select public.is_active_user())));
create policy progress_write on public.lesson_progress for all to authenticated using(user_id=(select auth.uid()) and (select public.is_active_user())) with check(user_id=(select auth.uid()) and exists(select 1 from public.lessons l where l.id=lesson_id and l.is_published and public.can_learn(l.course_id)));
create policy invoices_read on public.invoices for select to authenticated using((select public.is_admin()) or exists(select 1 from public.enrollments e where e.id=enrollment_id and e.user_id=(select auth.uid())));
create policy payments_read on public.payments for select to authenticated using((select public.is_admin()) or exists(select 1 from public.invoices i join public.enrollments e on e.id=i.enrollment_id where i.id=invoice_id and e.user_id=(select auth.uid())));
create policy learning_read on public.learning_states for select to authenticated using((select public.is_admin()) or (user_id=(select auth.uid()) and (select public.is_active_user())));
create policy learning_write on public.learning_states for all to authenticated using(user_id=(select auth.uid()) and (select public.is_active_user())) with check(user_id=(select auth.uid()) and (select public.is_active_user()));
create policy tickets_read on public.support_tickets for select to authenticated using((select public.is_admin()) or (user_id=(select auth.uid()) and (select public.is_active_user())));
create policy announcements_read on public.announcements for select to authenticated using((select public.is_admin()) or (is_published and (select public.is_active_user()) and (course_id is null or public.can_learn(course_id))));
create policy announcements_admin_write on public.announcements for all to authenticated using((select public.is_admin())) with check((select public.is_admin()));
create policy audit_read on public.audit_logs for select to authenticated using((select public.is_admin()));
create function public.update_my_profile(p_name text,p_phone text,p_city text,p_education text) returns void language plpgsql security definer set search_path='' as $$begin
 if not public.is_active_user() then raise exception 'UNAUTHORIZED';end if;
 update public.profiles set full_name=trim(p_name),phone=regexp_replace(p_phone,'[\s-]','','g'),city=trim(p_city),education_level=trim(p_education) where id=auth.uid();
end$$;
create function public.request_enrollment(p_course text) returns void language plpgsql security definer set search_path='' as $$begin
 if not public.is_active_user() then raise exception 'UNAUTHORIZED';end if;
 if not exists(select 1 from public.courses where id=p_course and status='active') then raise exception 'COURSE_UNAVAILABLE';end if;
 insert into public.enrollments(user_id,course_id,status) values(auth.uid(),p_course,'pending') on conflict(user_id,course_id) do nothing;
end$$;
create function public.admin_enroll(p_user uuid,p_course text,p_cohort uuid default null,p_status text default 'active') returns void language plpgsql security definer set search_path='' as $$declare cap integer; n integer;begin
 if not public.is_admin() then raise exception 'FORBIDDEN';end if;
 if p_cohort is not null then
 select capacity into cap from public.cohorts where id=p_cohort and course_id=p_course for update;
 if cap is null then raise exception 'COHORT_MISMATCH';end if;
 select count(*) into n from public.enrollments where cohort_id=p_cohort and user_id<>p_user and status in ('active','pending','paused');
 if n>=cap and p_status in ('active','pending','paused') then raise exception 'COHORT_FULL';end if;
 end if;
 insert into public.enrollments(user_id,course_id,cohort_id,status) values(p_user,p_course,p_cohort,p_status) on conflict(user_id,course_id) do update set cohort_id=excluded.cohort_id,status=excluded.status;
end$$;
create function public.admin_set_student_status(p_user uuid,p_status text) returns void language plpgsql security definer set search_path='' as $$begin
 if not public.is_admin() then raise exception 'FORBIDDEN';end if;
 if exists(select 1 from public.admin_users where user_id=p_user) then raise exception 'ADMIN_ACCOUNT_PROTECTED';end if;
 update public.profiles set status=p_status where id=p_user;
 insert into public.audit_logs(actor_id,action,table_name,record_id)values(auth.uid(),'STATUS_'||p_status,'profiles',p_user::text);
end$$;
create function public.admin_create_invoice(p_enrollment uuid,p_title text,p_amount numeric,p_due date) returns uuid language plpgsql security definer set search_path='' as $$declare v_id uuid;begin
 if not public.is_admin() then raise exception 'FORBIDDEN';end if;
 insert into public.invoices(enrollment_id,title,amount,due_date)values(p_enrollment,trim(p_title),p_amount,p_due)returning id into v_id;return v_id;
end$$;
create function public.admin_record_payment(p_id uuid,p_invoice uuid,p_amount numeric,p_method text,p_reference text default '',p_note text default '') returns uuid language plpgsql security definer set search_path='' as $$declare inv public.invoices; paid numeric;previous public.payments;begin
 if not public.is_admin() then raise exception 'FORBIDDEN';end if;
 select * into inv from public.invoices where id=p_invoice for update;
 if inv.id is null or inv.status<>'issued' then raise exception 'INVOICE_UNAVAILABLE';end if;
 select * into previous from public.payments where id=p_id;
 if previous.id is not null then
 if previous.invoice_id<>p_invoice or previous.amount<>p_amount or previous.method<>p_method then raise exception 'PAYMENT_CONFLICT';end if;
 return p_id;end if;
 select coalesce(sum(amount),0)into paid from public.payments where invoice_id=p_invoice and status='posted';
 if p_amount is null or p_amount<=0 or round(p_amount,2)<>p_amount or paid+p_amount>inv.amount then raise exception 'INVALID_PAYMENT_AMOUNT';end if;
 insert into public.payments(id,invoice_id,amount,method,reference,note,recorded_by)values(p_id,p_invoice,p_amount,p_method,trim(p_reference),trim(p_note),auth.uid());return p_id;
end$$;
create function public.admin_void_financial_record(p_kind text,p_id uuid) returns void language plpgsql security definer set search_path='' as $$declare inv uuid;begin
 if not public.is_admin() then raise exception 'FORBIDDEN';end if;
 if p_kind='payment' then
 select invoice_id into inv from public.payments where id=p_id;
 perform 1 from public.invoices where id=inv for update;
 update public.payments set status='void' where id=p_id;
 elsif p_kind='invoice' then
 perform 1 from public.invoices where id=p_id for update;
 if exists(select 1 from public.payments where invoice_id=p_id and status='posted') then raise exception 'INVOICE_HAS_PAYMENTS';end if;
 update public.invoices set status='void' where id=p_id;
 else raise exception 'INVALID_KIND';end if;
end$$;
create function public.submit_ticket(p_subject text,p_body text) returns void language plpgsql security definer set search_path='' as $$begin
 if not public.is_active_user() then raise exception 'UNAUTHORIZED';end if;
 perform 1 from public.profiles where id=auth.uid() for update;
 if (select count(*) from public.support_tickets where user_id=auth.uid() and created_at>now()-interval '1 hour')>=5 then raise exception 'RATE_LIMIT';end if;
 insert into public.support_tickets(user_id,subject,body) values(auth.uid(),trim(p_subject),trim(p_body));
end$$;
create function public.admin_reply_ticket(p_id uuid,p_reply text,p_status text) returns void language plpgsql security definer set search_path='' as $$begin
 if not public.is_admin() then raise exception 'FORBIDDEN';end if;
 update public.support_tickets set reply=trim(p_reply),status=p_status where id=p_id;
 insert into public.audit_logs(actor_id,action,table_name,record_id)values(auth.uid(),'REPLY','support_tickets',p_id::text);
end$$;
-- Private course attachments. Never expose permanent public URLs.
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)values('course-materials','course-materials',false,20971520,array['application/pdf','image/jpeg','image/png','image/webp']);
create policy materials_read on storage.objects for select to authenticated using(bucket_id='course-materials' and ((select public.is_admin()) or (public.can_learn((storage.foldername(name))[1]) and exists(select 1 from public.lessons l where l.file_path=name and l.is_published))));
create policy materials_admin_insert on storage.objects for insert to authenticated with check(bucket_id='course-materials' and (select public.is_admin()));
create policy materials_admin_delete on storage.objects for delete to authenticated using(bucket_id='course-materials' and (select public.is_admin()));
revoke execute on all functions in schema public from public,anon,authenticated;
grant execute on function public.is_admin(),public.is_active_user(),public.can_learn(text) to authenticated;
grant execute on function public.is_admin() to anon;
grant execute on function public.update_my_profile(text,text,text,text),public.request_enrollment(text),public.admin_enroll(uuid,text,uuid,text),public.admin_set_student_status(uuid,text),public.admin_create_invoice(uuid,text,numeric,date),public.admin_record_payment(uuid,uuid,numeric,text,text,text),public.admin_void_financial_record(text,uuid),public.submit_ticket(text,text),public.admin_reply_ticket(uuid,text,text) to authenticated;
commit;
