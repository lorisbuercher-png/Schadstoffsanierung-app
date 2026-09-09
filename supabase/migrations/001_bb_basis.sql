create extension if not exists "pgcrypto";

create table if not exists public.organisationen (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  erstellt_am timestamptz not null default now()
);

create table if not exists public.profile (
  id uuid primary key references auth.users(id) on delete cascade,
  organisation_id uuid not null references public.organisationen(id) on delete cascade,
  email text not null,
  name text,
  rolle text not null default 'vorarbeiter' check (rolle in ('admin', 'vorarbeiter', 'mitarbeiter')),
  aktiv boolean not null default true,
  erstellt_am timestamptz not null default now()
);

create table if not exists public.baustellen (
  id uuid primary key default gen_random_uuid(),
  organisation_id uuid not null references public.organisationen(id) on delete cascade,
  nummer text not null,
  projektname text not null,
  adresse text,
  plz text,
  ort text,
  startdatum date,
  enddatum date,
  sanierungsart text,
  verantwortlich_id uuid references public.profile(id),
  status text not null default 'in_vorbereitung',
  erstellt_von uuid not null default auth.uid() references auth.users(id),
  erstellt_am timestamptz not null default now(),
  aktualisiert_am timestamptz not null default now(),
  unique (organisation_id, nummer)
);

create table if not exists public.baustellen_team (
  baustelle_id uuid not null references public.baustellen(id) on delete cascade,
  profil_id uuid not null references public.profile(id) on delete cascade,
  funktion text,
  primary key (baustelle_id, profil_id)
);

create table if not exists public.tageschecks (
  id uuid primary key default gen_random_uuid(),
  organisation_id uuid not null references public.organisationen(id) on delete cascade,
  baustelle_id uuid not null references public.baustellen(id) on delete cascade,
  datum date not null,
  kontrolliert_von uuid not null default auth.uid() references auth.users(id),
  pruefungen jsonb not null default '{}'::jsonb,
  bemerkung text,
  status text not null check (status in ('arbeitsbereit', 'nicht_arbeitsbereit')),
  gespeichert_am timestamptz not null default now(),
  unique (baustelle_id, datum)
);

create table if not exists public.zonenzutritte (
  id uuid primary key default gen_random_uuid(),
  organisation_id uuid not null references public.organisationen(id) on delete cascade,
  baustelle_id uuid not null references public.baustellen(id) on delete cascade,
  profil_id uuid not null references public.profile(id),
  typ text not null check (typ in ('eintritt', 'austritt')),
  zeitpunkt timestamptz not null default now(),
  manuell boolean not null default false,
  erfasst_von uuid not null default auth.uid() references auth.users(id)
);

create table if not exists public.journale (
  id uuid primary key default gen_random_uuid(),
  organisation_id uuid not null references public.organisationen(id) on delete cascade,
  baustelle_id uuid not null references public.baustellen(id) on delete cascade,
  datum date not null,
  zone text,
  vorarbeiter_id uuid not null references public.profile(id),
  arbeiten text not null,
  besonderheiten text,
  arbeitszeiten jsonb not null default '[]'::jsonb,
  sicherheitskontrolle jsonb not null default '{}'::jsonb,
  abgeschlossen boolean not null default false,
  abgeschlossen_am timestamptz,
  erstellt_am timestamptz not null default now(),
  aktualisiert_am timestamptz not null default now(),
  unique (baustelle_id, datum)
);

create table if not exists public.dokumente (
  id uuid primary key default gen_random_uuid(),
  organisation_id uuid not null references public.organisationen(id) on delete cascade,
  baustelle_id uuid not null references public.baustellen(id) on delete cascade,
  ordner text not null,
  dateiname text not null,
  speicherpfad text not null unique,
  mime_typ text,
  dateigroesse bigint,
  hochgeladen_von uuid not null default auth.uid() references auth.users(id),
  hochgeladen_am timestamptz not null default now()
);

create table if not exists public.maengel (
  id uuid primary key default gen_random_uuid(),
  organisation_id uuid not null references public.organisationen(id) on delete cascade,
  baustelle_id uuid not null references public.baustellen(id) on delete cascade,
  titel text not null,
  beschreibung text,
  prioritaet text not null default 'normal' check (prioritaet in ('normal', 'hoch', 'kritisch')),
  status text not null default 'offen' check (status in ('offen', 'in_bearbeitung', 'behoben')),
  suva_punkt integer,
  erfasst_von uuid not null default auth.uid() references auth.users(id),
  erfasst_am timestamptz not null default now(),
  behoben_am timestamptz
);

insert into public.organisationen (name, slug)
values ('B&B Schadstoffsanierung', 'bb-schadstoffsanierung')
on conflict (slug) do nothing;

create or replace function public.meine_organisation_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select organisation_id from public.profile where id = auth.uid() and aktiv = true
$$;

create or replace function public.ist_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profile
    where id = auth.uid() and aktiv = true and rolle = 'admin'
  )
$$;

create or replace function public.neues_benutzerprofil()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  org_id uuid;
  benutzer_email text := lower(coalesce(new.email, ''));
  benutzer_rolle text := 'vorarbeiter';
begin
  if benutzer_email not like '%@bb-schadstoffsanierung.ch' then
    return new;
  end if;

  select id into org_id from public.organisationen where slug = 'bb-schadstoffsanierung';

  if benutzer_email in ('l.b@bb-schadstoffsanierung.ch', 'r.b@bb-schadstoffsanierung.ch') then
    benutzer_rolle := 'admin';
  end if;

  insert into public.profile (id, organisation_id, email, name, rolle)
  values (
    new.id,
    org_id,
    benutzer_email,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', split_part(benutzer_email, '@', 1)),
    benutzer_rolle
  )
  on conflict (id) do update set
    email = excluded.email,
    name = excluded.name;

  return new;
end;
$$;

drop trigger if exists auth_benutzer_angelegt on auth.users;
create trigger auth_benutzer_angelegt
  after insert or update of email, raw_user_meta_data on auth.users
  for each row execute procedure public.neues_benutzerprofil();

alter table public.organisationen enable row level security;
alter table public.profile enable row level security;
alter table public.baustellen enable row level security;
alter table public.baustellen_team enable row level security;
alter table public.tageschecks enable row level security;
alter table public.zonenzutritte enable row level security;
alter table public.journale enable row level security;
alter table public.dokumente enable row level security;
alter table public.maengel enable row level security;

create policy "Eigene Organisation lesen" on public.organisationen
  for select to authenticated using (id = public.meine_organisation_id());
create policy "Profile der Organisation lesen" on public.profile
  for select to authenticated using (organisation_id = public.meine_organisation_id());
create policy "Eigenes Profil aktualisieren" on public.profile
  for update to authenticated using (id = auth.uid()) with check (id = auth.uid() and organisation_id = public.meine_organisation_id());

-- Mitarbeitende dürfen nur ihren Anzeigenamen ändern, niemals Rolle oder Organisation.
revoke update on public.profile from authenticated;
grant update (name) on public.profile to authenticated;

create policy "Baustellen der Organisation lesen" on public.baustellen
  for select to authenticated using (organisation_id = public.meine_organisation_id());
create policy "Admins verwalten Baustellen" on public.baustellen
  for all to authenticated using (organisation_id = public.meine_organisation_id() and public.ist_admin())
  with check (organisation_id = public.meine_organisation_id() and public.ist_admin());

create policy "Team der Organisation lesen" on public.baustellen_team
  for select to authenticated using (
    exists (select 1 from public.baustellen b where b.id = baustelle_id and b.organisation_id = public.meine_organisation_id())
  );
create policy "Admins verwalten Teams" on public.baustellen_team
  for all to authenticated using (public.ist_admin()) with check (public.ist_admin());

create policy "Tageschecks der Organisation" on public.tageschecks
  for all to authenticated using (organisation_id = public.meine_organisation_id())
  with check (organisation_id = public.meine_organisation_id());
create policy "Zonenzutritte der Organisation" on public.zonenzutritte
  for all to authenticated using (organisation_id = public.meine_organisation_id())
  with check (organisation_id = public.meine_organisation_id());
create policy "Journale der Organisation" on public.journale
  for all to authenticated using (organisation_id = public.meine_organisation_id())
  with check (organisation_id = public.meine_organisation_id());
create policy "Dokumente der Organisation" on public.dokumente
  for all to authenticated using (organisation_id = public.meine_organisation_id())
  with check (organisation_id = public.meine_organisation_id());
create policy "Maengel der Organisation" on public.maengel
  for all to authenticated using (organisation_id = public.meine_organisation_id())
  with check (organisation_id = public.meine_organisation_id());

insert into storage.buckets (id, name, public)
values ('baustellendokumente', 'baustellendokumente', false)
on conflict (id) do nothing;

create policy "Dokumente der eigenen Organisation lesen" on storage.objects
  for select to authenticated using (
    bucket_id = 'baustellendokumente'
    and (storage.foldername(name))[1] = public.meine_organisation_id()::text
  );
create policy "Dokumente der eigenen Organisation hochladen" on storage.objects
  for insert to authenticated with check (
    bucket_id = 'baustellendokumente'
    and (storage.foldername(name))[1] = public.meine_organisation_id()::text
  );
create policy "Eigene Dokumente aktualisieren" on storage.objects
  for update to authenticated using (
    bucket_id = 'baustellendokumente'
    and (storage.foldername(name))[1] = public.meine_organisation_id()::text
  );
create policy "Admins loeschen Dokumente" on storage.objects
  for delete to authenticated using (
    bucket_id = 'baustellendokumente'
    and (storage.foldername(name))[1] = public.meine_organisation_id()::text
    and public.ist_admin()
  );
