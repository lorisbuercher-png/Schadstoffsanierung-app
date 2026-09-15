-- Shared, versioned application documents. Existing browser data is NOT imported automatically.
create table public.app_records (
  organisation_id uuid not null references public.organisationen(id),
  key text not null,
  value text,
  version bigint not null default 1,
  updated_by uuid not null references auth.users(id),
  updated_at timestamptz not null default now(),
  primary key (organisation_id,key)
);
create table public.app_write_receipts (
  organisation_id uuid not null references public.organisationen(id),
  request_id uuid not null,
  user_id uuid not null references auth.users(id),
  result jsonb not null,
  created_at timestamptz not null default now(),
  primary key (organisation_id,request_id)
);
alter table public.app_records enable row level security;
alter table public.app_write_receipts enable row level security;
revoke all on public.app_records, public.app_write_receipts from anon, authenticated;
grant select on public.app_records to authenticated;
create policy "Active project staff read shared records" on public.app_records
for select to authenticated using (
  organisation_id = public.meine_organisation_id()
  and exists(select 1 from public.profile where id=auth.uid() and aktiv and rolle in ('admin','vorarbeiter'))
);

create or replace function public.save_app_records(p_request uuid, p_changes jsonb)
returns jsonb language plpgsql security definer set search_path=public
as $$
declare
  org uuid;
  role_name text;
  item jsonb;
  record_key text;
  record_value text;
  old_value text;
  old_version bigint;
  result jsonb := '[]'::jsonb;
  receipt jsonb;
  receipt_user uuid;
  seen text[] := array[]::text[];
begin
  select organisation_id,rolle into org,role_name from public.profile
    where id=auth.uid() and aktiv and rolle in ('admin','vorarbeiter');
  if org is null then raise exception 'FORBIDDEN'; end if;
  if p_request is null or jsonb_typeof(p_changes) is distinct from 'array'
    or jsonb_array_length(p_changes) not between 1 and 100 then raise exception 'INVALID_BATCH'; end if;
  -- Serialize writes per organisation, including first creation of a record.
  perform 1 from public.organisationen where id=org for update;
  select r.result,r.user_id into receipt,receipt_user from public.app_write_receipts r
    where organisation_id=org and request_id=p_request;
  if found then
    if receipt_user <> auth.uid() then raise exception 'FORBIDDEN'; end if;
    return receipt;
  end if;
  for item in select * from jsonb_array_elements(p_changes) loop
    record_key := item->>'key';
    record_value := item->>'value';
    if record_key is null or length(record_key)>200 or record_key=any(seen)
      or record_key !~ '^(baustellen|mitarbeiter|instruktionshistorie|kalender-events|((baustellen-mitarbeiter|journal|suva-audit|maengel|as10|zonenplan|dokumente|tagescheck|sanierungsplan|zonenzutritt|geraete)-[A-Za-z0-9_-]+))$'
      then raise exception 'INVALID_KEY'; end if;
    seen := array_append(seen,record_key);
    if record_value is not null then
      if octet_length(record_value)>20000000 then raise exception 'RECORD_TOO_LARGE'; end if;
      perform record_value::jsonb;
    end if;
    old_version := 0; old_value := null;
    select version,value into old_version,old_value from public.app_records where organisation_id=org and key=record_key;
    old_version := coalesce(old_version,0);
    if (item->>'version') is null or (item->>'version')::bigint <> old_version then raise exception 'CONFLICT'; end if;
    if role_name <> 'admin' then
      if record_key='mitarbeiter' or record_key like 'baustellen-mitarbeiter-%' then raise exception 'FORBIDDEN'; end if;
      -- Foremen may update checklist contents, never project identity or core fields.
      if record_key='baustellen' then
        if old_value is null or record_value is null
          or jsonb_typeof(record_value::jsonb)<>'array' then raise exception 'FORBIDDEN'; end if;
        if (select coalesce(jsonb_agg(x-'checklisten'-'fortschritt' order by x->>'id'),'[]'::jsonb) from jsonb_array_elements(old_value::jsonb) x)
          is distinct from
          (select coalesce(jsonb_agg(x-'checklisten'-'fortschritt' order by x->>'id'),'[]'::jsonb) from jsonb_array_elements(record_value::jsonb) x)
          then raise exception 'FORBIDDEN'; end if;
      end if;
    end if;
    insert into public.app_records(organisation_id,key,value,version,updated_by)
      values(org,record_key,record_value,old_version+1,auth.uid())
      on conflict(organisation_id,key) do update set value=excluded.value,version=excluded.version,
        updated_by=excluded.updated_by,updated_at=now();
    result := result || jsonb_build_array(jsonb_build_object('key',record_key,'value',record_value,'version',old_version+1));
  end loop;
  insert into public.app_write_receipts(organisation_id,request_id,user_id,result)
    values(org,p_request,auth.uid(),result);
  return result;
end;
$$;
revoke all on function public.save_app_records(uuid,jsonb) from public,anon;
grant execute on function public.save_app_records(uuid,jsonb) to authenticated;
