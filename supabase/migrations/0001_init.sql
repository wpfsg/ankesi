-- Ankesi — milestone 2 schema
-- Run in the Supabase SQL editor or with `supabase db push`.
-- Everything is under row-level security. The anon key can read public
-- data (approved spots, non-hidden reports, weather history) and nothing
-- else; writes require a signed-in user and are scoped to that user.

-- ---------------------------------------------------------------- profiles

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text,
  locale text not null default 'ka' check (locale in ('ka', 'en')),
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "profiles: read own" on public.profiles
  for select to authenticated using (id = auth.uid());

create policy "profiles: update own" on public.profiles
  for update to authenticated using (id = auth.uid()) with check (id = auth.uid());

-- Public view of names for report attribution, nothing else.
create view public.public_profiles
  with (security_invoker = false) as
  select id, display_name from public.profiles;

grant select on public.public_profiles to anon, authenticated;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', split_part(coalesce(new.email, ''), '@', 1))
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ------------------------------------------------------------------- spots
-- Seeded spots (source = 'seed') plus owner-submitted paid ponds
-- (source = 'pond'), which stay hidden until a moderator sets approved.

create table public.spots (
  id text primary key,
  name_ka text not null,
  name_en text not null,
  type text not null check (type in ('lake', 'reservoir', 'river', 'paid', 'sea')),
  region text not null,
  lat double precision not null check (lat between 40 and 44),
  lon double precision not null check (lon between 39.5 and 47),
  depth text not null check (depth in ('shallow', 'medium', 'deep', 'river', 'sea')),
  species jsonb not null default '{}'::jsonb,
  access_ka text,
  access_en text,
  note_ka text,
  note_en text,
  info_only boolean not null default false,
  fee_gel numeric(8, 2),
  contact text,
  hours text,
  marine_lat double precision,
  marine_lon double precision,
  source text not null default 'seed' check (source in ('seed', 'pond')),
  owner_id uuid references auth.users (id) on delete set null,
  approved boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index spots_approved_idx on public.spots (approved, source);
create index spots_owner_idx on public.spots (owner_id);

alter table public.spots enable row level security;

create policy "spots: read approved or own" on public.spots
  for select to anon, authenticated
  using (approved or owner_id = auth.uid());

create policy "spots: owners submit ponds" on public.spots
  for insert to authenticated
  with check (
    owner_id = auth.uid()
    and source = 'pond'
    and type = 'paid'
    and approved = false
  );

create policy "spots: owners edit own ponds" on public.spots
  for update to authenticated
  using (owner_id = auth.uid() and source = 'pond')
  with check (owner_id = auth.uid() and source = 'pond');

-- Owners may edit their pond but never flip the moderation flag.
revoke update (approved, source, owner_id) on public.spots from authenticated;

create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger spots_touch before update on public.spots
  for each row execute function public.touch_updated_at();

-- ----------------------------------------------------------------- catches

create table public.catches (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  spot_id text not null references public.spots (id),
  species_id text not null,
  caught_at timestamptz not null default now(),
  weight_kg numeric(6, 2) check (weight_kg is null or weight_kg between 0 and 500),
  length_cm numeric(5, 1) check (length_cm is null or length_cm between 0 and 400),
  bait text check (bait is null or char_length(bait) <= 80),
  method text check (method is null or char_length(method) <= 80),
  note text check (note is null or char_length(note) <= 1000),
  photo_path text,
  -- Score, factors, water temperature and model version at logging time.
  weather_snapshot jsonb,
  is_public boolean not null default false,
  created_at timestamptz not null default now()
);

create index catches_user_idx on public.catches (user_id, caught_at desc);
create index catches_spot_idx on public.catches (spot_id, caught_at desc);

alter table public.catches enable row level security;

create policy "catches: read own or public" on public.catches
  for select to anon, authenticated
  using (is_public or user_id = auth.uid());

create policy "catches: insert own" on public.catches
  for insert to authenticated with check (user_id = auth.uid());

create policy "catches: update own" on public.catches
  for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "catches: delete own" on public.catches
  for delete to authenticated using (user_id = auth.uid());

-- ----------------------------------------------------------------- reports
-- Community activity reports: -2 dead, -1 slow, 0 ok, +1 good, +2 great.

create table public.reports (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  spot_id text not null references public.spots (id),
  activity smallint not null check (activity between -2 and 2),
  note text check (note is null or char_length(note) <= 500),
  photo_path text,
  weather_snapshot jsonb,
  hidden boolean not null default false,
  created_at timestamptz not null default now()
);

create index reports_spot_recent_idx on public.reports (spot_id, created_at desc);
create index reports_recent_idx on public.reports (created_at desc) where not hidden;

alter table public.reports enable row level security;

create policy "reports: read visible" on public.reports
  for select to anon, authenticated
  using (not hidden or user_id = auth.uid());

create policy "reports: insert own" on public.reports
  for insert to authenticated with check (user_id = auth.uid());

create policy "reports: delete own" on public.reports
  for delete to authenticated using (user_id = auth.uid());

-- One report per user per spot per 30 minutes, to blunt spam.
create unique index reports_rate_idx
  on public.reports (user_id, spot_id, (date_trunc('hour', created_at) + (floor(extract(minute from created_at) / 30) * interval '30 minutes')));

-- Flags: three distinct flags hide a report.
create table public.report_flags (
  report_id uuid not null references public.reports (id) on delete cascade,
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (report_id, user_id)
);

alter table public.report_flags enable row level security;

create policy "flags: insert own" on public.report_flags
  for insert to authenticated with check (user_id = auth.uid());

create policy "flags: read own" on public.report_flags
  for select to authenticated using (user_id = auth.uid());

create or replace function public.hide_flagged_report()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if (select count(*) from public.report_flags where report_id = new.report_id) >= 3 then
    update public.reports set hidden = true where id = new.report_id;
  end if;
  return new;
end;
$$;

create trigger report_flag_added after insert on public.report_flags
  for each row execute function public.hide_flagged_report();

-- ------------------------------------------------------------- saved spots

create table public.saved_spots (
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  spot_id text not null references public.spots (id) on delete cascade,
  alerts boolean not null default true,
  created_at timestamptz not null default now(),
  primary key (user_id, spot_id)
);

alter table public.saved_spots enable row level security;

create policy "saved: all own" on public.saved_spots
  for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ------------------------------------------------------- push subscriptions

create table public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  locale text not null default 'ka',
  created_at timestamptz not null default now()
);

alter table public.push_subscriptions enable row level security;

create policy "push: all own" on public.push_subscriptions
  for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

-- --------------------------------------------------------- weather history
-- Written hourly by the `snapshot` edge function with the service role.
-- Forecast hours are overwritten by later runs, so each row converges to
-- the freshest value. This is the dataset for refitting the model weights.

create table public.weather_hourly (
  spot_id text not null references public.spots (id) on delete cascade,
  ts timestamptz not null,
  temp real,
  pressure real,
  wind real,
  wind_dir real,
  cloud real,
  precip real,
  wave_height real,
  sst real,
  source text not null default 'open-meteo',
  fetched_at timestamptz not null default now(),
  primary key (spot_id, ts)
);

alter table public.weather_hourly enable row level security;

create policy "weather: public read" on public.weather_hourly
  for select to anon, authenticated using (true);

-- ------------------------------------------------------------------ storage
-- Photos bucket: public read, users write only under their own folder.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('photos', 'photos', true, 8388608, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;

create policy "photos: public read" on storage.objects
  for select to anon, authenticated using (bucket_id = 'photos');

create policy "photos: upload to own folder" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'photos' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "photos: delete own" on storage.objects
  for delete to authenticated
  using (bucket_id = 'photos' and (storage.foldername(name))[1] = auth.uid()::text);
