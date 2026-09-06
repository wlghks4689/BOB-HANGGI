begin;

-- No applicant-facing table access. All writes pass through Edge Functions.
create table public.daese_admins (
  user_id uuid primary key references auth.users(id) on delete cascade,
  active boolean not null default true,
  created_at timestamptz not null default now()
);
create table public.daese_applications (
  id uuid primary key,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  status text not null default 'submitted' check (status in ('submitted','reviewing','approved','rejected')),
  photo_review text not null default 'pending' check (photo_review in ('pending','approved','rejected')),
  name text not null check (length(btrim(name)) between 1 and 50),
  birth_year integer not null check (birth_year between 1900 and 2200),
  gender text not null check (gender in ('male','female')),
  region_city text not null check (region_city in ('daejeon','sejong')),
  region_detail text not null check (length(region_detail) between 1 and 30),
  job_category text not null check (length(job_category) between 1 and 80),
  job_other text check (length(job_other) between 1 and 80),
  height text not null check (height = '195_plus' or height ~ '^(14[5-9]|1[5-8][0-9]|19[0-4])$'),
  mbti text not null check (mbti ~ '^[IE][NS][TF][JP]$'),
  smoking text not null check (smoking in ('yes','vape','none')),
  drinking text not null check (drinking in ('none','monthly','weekly','often')),
  pet text not null check (pet in ('none','dog','cat','other')),
  preferred_age_relation text not null check (preferred_age_relation in ('older','younger','same','any')),
  interests text[] not null check (cardinality(interests) between 1 and 3),
  priority_condition text not null check (length(btrim(priority_condition)) between 1 and 1000),
  preferred_condition text not null default '' check (length(preferred_condition) <= 1000),
  preferred_age_min integer not null check (preferred_age_min between 20 and 40),
  preferred_age_max integer not null check (preferred_age_max between preferred_age_min and 40),
  photo_path text not null unique,
  admin_note text not null default '' check (length(admin_note) <= 3000),
  check (job_category <> '기타' or nullif(btrim(job_other), '') is not null),
  check (status <> 'approved' or photo_review = 'approved')
);
create index daese_applications_queue on public.daese_applications(status, created_at desc, id);
create table public.daese_contacts (
  application_id uuid primary key references public.daese_applications(id) on delete cascade,
  phone text not null check (phone ~ '^0[0-9]{8,10}$'),
  phone_verified boolean not null default false check (phone_verified = false)
);
-- Phone is intentionally NOT UNIQUE: an unverified number cannot identify its owner.
create table public.daese_consents (
  application_id uuid primary key references public.daese_applications(id) on delete cascade,
  required_consent boolean not null check (required_consent = true),
  religion_consent boolean not null,
  document_version text not null check (length(document_version) between 1 and 80),
  consented_at timestamptz not null default now()
);
create table public.daese_sensitive_details (
  application_id uuid primary key references public.daese_applications(id) on delete cascade,
  religion text not null check (religion in ('무교','기독교','천주교','불교','기타'))
);
create table public.daese_review_events (
  id bigint generated always as identity primary key,
  application_id uuid not null references public.daese_applications(id) on delete cascade,
  actor_id uuid not null references auth.users(id),
  status text not null,
  photo_review text not null,
  created_at timestamptz not null default now()
);
create table public.daese_intake_jobs (
  id uuid primary key,
  fingerprint text not null check (fingerprint ~ '^[0-9a-f]{64}$'),
  state text not null check (state in ('receiving','submitted','failed')),
  lease_id uuid not null,
  photo_path text not null,
  updated_at timestamptz not null default now()
);
create table public.daese_rate_limits (
  key_hash text not null check (key_hash ~ '^[0-9a-f]{64}$'),
  bucket timestamptz not null,
  requests integer not null,
  primary key (key_hash, bucket)
);
create table public.daese_photo_cleanup (
  photo_path text primary key,
  queued_at timestamptz not null default now()
);

do $$
declare t text;
begin
  foreach t in array array['daese_admins','daese_applications','daese_contacts','daese_consents',
    'daese_sensitive_details','daese_review_events','daese_intake_jobs','daese_rate_limits','daese_photo_cleanup'] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('revoke all on public.%I from public, anon, authenticated', t);
    execute format('grant all on public.%I to service_role', t);
  end loop;
end $$;
revoke all on sequence public.daese_review_events_id_seq from public, anon, authenticated;
grant usage, select on sequence public.daese_review_events_id_seq to service_role;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('application-photos', 'application-photos', false, 5242880, array['image/jpeg']);
-- No browser policy is installed. On a new Supabase project only service_role can access it.
-- RESTRICTIVE policies also protect this bucket from future broad permissive policies.
create policy daese_photos_private on storage.objects as restrictive for all to anon, authenticated
using (bucket_id <> 'application-photos') with check (bucket_id <> 'application-photos');

create function public.daese_claim_intake(p_id uuid, p_fingerprint text, p_rate_key text)
returns jsonb language plpgsql security invoker set search_path = '' as $$
declare j public.daese_intake_jobs; token uuid; path text; count integer;
  time_bucket timestamptz := date_trunc('hour', now()) + floor(extract(minute from now()) / 10) * interval '10 minutes';
begin
  perform pg_advisory_xact_lock(hashtextextended(p_id::text, 0));
  select * into j from public.daese_intake_jobs where id = p_id for update;
  if found then
    if j.fingerprint <> p_fingerprint then return jsonb_build_object('state','conflict'); end if;
    if j.state = 'submitted' then return jsonb_build_object('state','submitted','id',p_id); end if;
    if j.state = 'receiving' and j.updated_at > now() - interval '2 minutes' then
      return jsonb_build_object('state','busy');
    end if;
  end if;
  insert into public.daese_rate_limits values (p_rate_key, time_bucket, 1)
    on conflict (key_hash,bucket) do update set requests = public.daese_rate_limits.requests + 1
    returning requests into count;
  if count > 5 then return jsonb_build_object('state','limited'); end if;
  if j.id is not null then
    insert into public.daese_photo_cleanup(photo_path) values (j.photo_path) on conflict do nothing;
  end if;
  token := gen_random_uuid();
  path := p_id::text || '/' || token::text || '.jpg';
  insert into public.daese_intake_jobs values (p_id,p_fingerprint,'receiving',token,path,now())
    on conflict (id) do update set state='receiving',lease_id=token,photo_path=path,updated_at=now();
  return jsonb_build_object('state','claimed','lease_id',token,'photo_path',path);
end $$;

create function public.daese_finish_intake(p_id uuid, p_lease_id uuid, p_data jsonb)
returns uuid language plpgsql security invoker set search_path = '' as $$
declare j public.daese_intake_jobs;
begin
  select * into j from public.daese_intake_jobs where id=p_id for update;
  if not found or j.lease_id <> p_lease_id then raise exception 'Invalid intake lease'; end if;
  if j.state = 'submitted' then return p_id; end if;
  if j.state <> 'receiving' then raise exception 'Inactive intake lease'; end if;
  if (p_data->>'birth_year')::integer not between extract(year from now())::integer-40 and extract(year from now())::integer-20
    then raise exception 'Invalid birth year'; end if;
  if p_data->>'consent_version' <> '2026-09-07-draft' then raise exception 'Invalid consent version'; end if;
  -- Metadata alone is not a photo. Complete only after Storage confirms the upload.
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

create function public.daese_review_application(p_id uuid, p_actor uuid, p_status text, p_photo_review text, p_note text, p_expected_updated_at timestamptz)
returns boolean language plpgsql security invoker set search_path = '' as $$
begin
  if not exists(select 1 from public.daese_admins where user_id=p_actor and active) then raise exception 'Forbidden'; end if;
  update public.daese_applications set status=p_status,photo_review=p_photo_review,admin_note=p_note,updated_at=clock_timestamp()
    where id=p_id and updated_at=p_expected_updated_at;
  if not found then return false; end if;
  insert into public.daese_review_events(application_id,actor_id,status,photo_review) values(p_id,p_actor,p_status,p_photo_review);
  return true;
end $$;

create function public.daese_delete_application(p_id uuid, p_actor uuid)
returns boolean language plpgsql security invoker set search_path = '' as $$
declare path text;
begin
  if not exists(select 1 from public.daese_admins where user_id=p_actor and active) then raise exception 'Forbidden'; end if;
  select photo_path into path from public.daese_applications where id=p_id for update;
  if not found then return false; end if;
  insert into public.daese_photo_cleanup(photo_path) values(path) on conflict do nothing;
  delete from public.daese_applications where id=p_id;
  delete from public.daese_intake_jobs where id=p_id;
  return true;
end $$;

create function public.daese_prepare_cleanup()
returns void language plpgsql security invoker set search_path = '' as $$
declare j record;
begin
  for j in select id,photo_path from public.daese_intake_jobs
    where state='receiving' and updated_at < now()-interval '10 minutes' for update skip locked loop
    insert into public.daese_photo_cleanup(photo_path) values(j.photo_path) on conflict do nothing;
    update public.daese_intake_jobs set state='failed',updated_at=now() where id=j.id;
  end loop;
  delete from public.daese_rate_limits where bucket < now()-interval '1 day';
  delete from public.daese_intake_jobs where state='failed' and updated_at < now()-interval '1 day';
end $$;

revoke all on function public.daese_claim_intake(uuid,text,text), public.daese_finish_intake(uuid,uuid,jsonb),
  public.daese_review_application(uuid,uuid,text,text,text,timestamptz), public.daese_delete_application(uuid,uuid),
  public.daese_prepare_cleanup() from public, anon, authenticated;
grant execute on function public.daese_claim_intake(uuid,text,text), public.daese_finish_intake(uuid,uuid,jsonb),
  public.daese_review_application(uuid,uuid,text,text,text,timestamptz), public.daese_delete_application(uuid,uuid),
  public.daese_prepare_cleanup() to service_role;
commit;
