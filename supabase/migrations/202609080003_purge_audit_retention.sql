-- Keep completed purge evidence for 90 days. Unresolved photo deletion failures remain until resolved.
begin;

create function public.daese_prune_purge_audit()
returns integer language plpgsql security invoker set search_path='' as $$
declare removed integer;
begin
  delete from public.daese_purge_audit
  where photo_deleted_at is not null
    and photo_deleted_at < now()-interval '90 days';
  get diagnostics removed = row_count;
  return removed;
end $$;

revoke all on function public.daese_prune_purge_audit() from public,anon,authenticated;
grant execute on function public.daese_prune_purge_audit() to service_role;

commit;
