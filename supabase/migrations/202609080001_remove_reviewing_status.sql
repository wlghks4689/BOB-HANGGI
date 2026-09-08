-- The operator decides each new application as approved or rejected directly.
-- Preserve existing undecided rows by returning the obsolete reviewing state to submitted.
begin;

update public.daese_applications
set status = 'submitted', updated_at = clock_timestamp()
where status = 'reviewing';

update public.daese_review_events
set status = 'submitted'
where status = 'reviewing';

alter table public.daese_applications
  drop constraint daese_applications_status_check,
  add constraint daese_applications_status_check
    check (status in ('submitted', 'approved', 'rejected'));

alter table public.daese_review_events
  add constraint daese_review_events_status_check
    check (status in ('submitted', 'approved', 'rejected'));

commit;
