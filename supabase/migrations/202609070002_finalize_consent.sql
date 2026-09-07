begin;

create or replace function public.daese_finish_intake(p_id uuid, p_lease_id uuid, p_data jsonb)
returns uuid language plpgsql security invoker set search_path = '' as $$
declare j public.daese_intake_jobs;
begin
  select * into j from public.daese_intake_jobs where id=p_id for update;
  if not found or j.lease_id <> p_lease_id then raise exception 'Invalid intake lease'; end if;
  if j.state = 'submitted' then return p_id; end if;
  if j.state <> 'receiving' then raise exception 'Inactive intake lease'; end if;
  if (p_data->>'birth_year')::integer not between extract(year from now())::integer-40 and extract(year from now())::integer-20
    then raise exception 'Invalid birth year'; end if;
  if p_data->>'consent_version' <> '2026-09-07' then raise exception 'Invalid consent version'; end if;
  if not exists(select 1 from storage.objects where bucket_id='application-photos' and name=j.photo_path)
    then raise exception 'Missing uploaded photo'; end if;
  insert into public.daese_applications(id,name,birth_year,gender,region_city,region_detail,job_category,job_other,
    height,mbti,smoking,drinking,pet,preferred_age_relation,interests,priority_condition,preferred_condition,
    preferred_age_min,preferred_age_max,photo_path)
  values(p_id,p_data->>'name',(p_data->>'birth_year')::integer,p_data->>'gender',p_data->>'region_city',
    p_data->>'region_detail',p_data->>'job_category',p_data->>'job_other',p_data->>'height',p_data->>'mbti',
    p_data->>'smoking',p_data->>'drinking',p_data->>'pet',p_data->>'preferred_age_relation',
    array(select jsonb_array_elements_text(p_data->'interests')),p_data->>'priority_condition',
    p_data->>'preferred_condition',(p_data->>'preferred_age_min')::integer,(p_data->>'preferred_age_max')::integer,j.photo_path);
  insert into public.daese_contacts(application_id,phone) values(p_id,p_data->>'phone');
  insert into public.daese_consents(application_id,required_consent,religion_consent,document_version)
    values(p_id,true,(p_data->>'religion_consent')::boolean,p_data->>'consent_version');
  if (p_data->>'religion_consent')::boolean and nullif(p_data->>'religion','') is not null then
    insert into public.daese_sensitive_details values(p_id,p_data->>'religion');
  end if;
  update public.daese_intake_jobs set state='submitted',updated_at=now() where id=p_id;
  return p_id;
end $$;

revoke all on function public.daese_finish_intake(uuid,uuid,jsonb) from public, anon, authenticated;
grant execute on function public.daese_finish_intake(uuid,uuid,jsonb) to service_role;

commit;
