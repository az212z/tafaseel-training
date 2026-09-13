begin;
drop policy cohorts_read on public.cohorts;
create policy cohorts_read on public.cohorts for select to authenticated using((select public.is_admin()) or ((select public.is_active_user()) and exists(select 1 from public.enrollments e where e.cohort_id=cohorts.id and e.user_id=(select auth.uid()))));
create function public.validate_cohort_capacity() returns trigger language plpgsql set search_path='' as $$begin
 if new.capacity<(select count(*) from public.enrollments where cohort_id=new.id and status in ('active','pending','paused')) then raise exception 'COHORT_CAPACITY_TOO_SMALL';end if;return new;
end$$;
create trigger cohort_capacity_guard before update of capacity on public.cohorts for each row execute function public.validate_cohort_capacity();
create or replace function public.admin_create_invoice(p_enrollment uuid,p_title text,p_amount numeric,p_due date) returns uuid language plpgsql security definer set search_path='' as $$declare v_id uuid;begin
 if not public.is_admin() then raise exception 'FORBIDDEN';end if;
 if p_amount is null or p_amount<=0 or round(p_amount,2)<>p_amount then raise exception 'INVALID_PAYMENT_AMOUNT';end if;
 insert into public.invoices(enrollment_id,title,amount,due_date)values(p_enrollment,trim(p_title),p_amount,p_due)returning id into v_id;return v_id;
end$$;
revoke all on function public.validate_cohort_capacity() from public,anon,authenticated;
commit;
