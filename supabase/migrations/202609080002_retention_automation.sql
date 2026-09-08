begin;

alter table public.daese_applications
  add column result_notified_at timestamptz,
  add column service_ended_at timestamptz,
  add column deletion_requested_at timestamptz,
  add column purge_due_at timestamptz,
  add column purge_reason text;

update public.daese_applications set purge_due_at=created_at+interval '29 days 23 hours',purge_reason='intake_timeout';
alter table public.daese_applications
  alter column purge_due_at set not null,
  alter column purge_due_at set default (now()+interval '29 days 23 hours'),
  alter column purge_reason set not null,
  alter column purge_reason set default 'intake_timeout',
  add constraint daese_applications_purge_reason_check check (purge_reason in ('intake_timeout','rejected_notified','service_ended','deletion_requested'));
create index daese_applications_purge_due on public.daese_applications(purge_due_at,id);

alter table public.daese_photo_cleanup
  add column application_id uuid,
  add column reason text not null default 'abandoned_upload',
  add column purge_due_at timestamptz,
  add column attempt_count integer not null default 0 check (attempt_count>=0),
  add column last_attempt_at timestamptz,
  add column last_error text check (length(last_error)<=200);

create table public.daese_purge_audit (
  application_id uuid primary key,
  reason text not null check (reason in ('intake_timeout','rejected_notified','service_ended','deletion_requested','manual_admin')),
  purge_due_at timestamptz not null,
  db_deleted_at timestamptz not null default now(),
  photo_deleted_at timestamptz,
  attempt_count integer not null default 0 check (attempt_count>=0),
  last_attempt_at timestamptz,
  last_error text check (length(last_error)<=200)
);
alter table public.daese_purge_audit enable row level security;
revoke all on public.daese_purge_audit from public,anon,authenticated;
grant all on public.daese_purge_audit to service_role;

create function public.daese_mark_retention_event(p_id uuid,p_actor uuid,p_event text,p_expected_updated_at timestamptz)
returns timestamptz language plpgsql security invoker set search_path='' as $$
declare deadline timestamptz; current_status text;
begin
  if not exists(select 1 from public.daese_admins where user_id=p_actor and active) then raise exception 'Forbidden'; end if;
  select status into current_status from public.daese_applications where id=p_id and updated_at=p_expected_updated_at for update;
  if not found then return null; end if;
  deadline:=clock_timestamp()+interval '47 hours';
  if p_event='result_notified' and current_status='rejected' then
    update public.daese_applications set result_notified_at=coalesce(result_notified_at,clock_timestamp()),purge_due_at=least(purge_due_at,deadline),purge_reason='rejected_notified',updated_at=clock_timestamp() where id=p_id returning purge_due_at into deadline;
  elsif p_event='service_ended' and current_status='approved' then
    update public.daese_applications set service_ended_at=coalesce(service_ended_at,clock_timestamp()),purge_due_at=least(purge_due_at,deadline),purge_reason='service_ended',updated_at=clock_timestamp() where id=p_id returning purge_due_at into deadline;
  elsif p_event='deletion_requested' then
    update public.daese_applications set deletion_requested_at=coalesce(deletion_requested_at,clock_timestamp()),purge_due_at=least(purge_due_at,deadline),purge_reason='deletion_requested',updated_at=clock_timestamp() where id=p_id returning purge_due_at into deadline;
  else raise exception 'Invalid retention event'; end if;
  return deadline;
end $$;

create function public.daese_prepare_retention_purge(p_limit integer default 100)
returns integer language plpgsql security invoker set search_path='' as $$
declare item record; removed integer:=0;
begin
  if p_limit not between 1 and 100 then raise exception 'Invalid limit'; end if;
  for item in select id,photo_path,purge_reason,purge_due_at from public.daese_applications where purge_due_at<=now() order by purge_due_at,id limit p_limit for update skip locked loop
    insert into public.daese_purge_audit(application_id,reason,purge_due_at) values(item.id,item.purge_reason,item.purge_due_at) on conflict(application_id) do nothing;
    insert into public.daese_photo_cleanup(photo_path,application_id,reason,purge_due_at) values(item.photo_path,item.id,item.purge_reason,item.purge_due_at)
      on conflict(photo_path) do update set application_id=excluded.application_id,reason=excluded.reason,purge_due_at=excluded.purge_due_at;
    delete from public.daese_applications where id=item.id;
    delete from public.daese_intake_jobs where id=item.id;
    removed:=removed+1;
  end loop;
  return removed;
end $$;

create function public.daese_record_photo_cleanup_result(p_photo_path text,p_success boolean,p_error text default null)
returns void language plpgsql security invoker set search_path='' as $$
declare app_id uuid;
begin
  select application_id into app_id from public.daese_photo_cleanup where photo_path=p_photo_path for update;
  if not found then return; end if;
  if p_success then
    update public.daese_purge_audit set photo_deleted_at=clock_timestamp(),attempt_count=attempt_count+1,last_attempt_at=clock_timestamp(),last_error=null where application_id=app_id;
    delete from public.daese_photo_cleanup where photo_path=p_photo_path;
  else
    update public.daese_photo_cleanup set attempt_count=attempt_count+1,last_attempt_at=clock_timestamp(),last_error=left(coalesce(p_error,'storage_delete_failed'),200) where photo_path=p_photo_path;
    update public.daese_purge_audit set attempt_count=attempt_count+1,last_attempt_at=clock_timestamp(),last_error=left(coalesce(p_error,'storage_delete_failed'),200) where application_id=app_id;
  end if;
end $$;

create or replace function public.daese_delete_application(p_id uuid,p_actor uuid)
returns boolean language plpgsql security invoker set search_path='' as $$
declare path text;
begin
  if not exists(select 1 from public.daese_admins where user_id=p_actor and active) then raise exception 'Forbidden'; end if;
  select photo_path into path from public.daese_applications where id=p_id for update;
  if not found then return false; end if;
  insert into public.daese_purge_audit(application_id,reason,purge_due_at) values(p_id,'manual_admin',clock_timestamp()) on conflict(application_id) do nothing;
  insert into public.daese_photo_cleanup(photo_path,application_id,reason,purge_due_at) values(path,p_id,'manual_admin',clock_timestamp())
    on conflict(photo_path) do update set application_id=excluded.application_id,reason=excluded.reason,purge_due_at=excluded.purge_due_at;
  delete from public.daese_applications where id=p_id;
  delete from public.daese_intake_jobs where id=p_id;
  return true;
end $$;

revoke all on function public.daese_mark_retention_event(uuid,uuid,text,timestamptz),public.daese_prepare_retention_purge(integer),public.daese_record_photo_cleanup_result(text,boolean,text) from public,anon,authenticated;
grant execute on function public.daese_mark_retention_event(uuid,uuid,text,timestamptz),public.daese_prepare_retention_purge(integer),public.daese_record_photo_cleanup_result(text,boolean,text) to service_role;

commit;
