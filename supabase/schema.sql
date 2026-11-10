-- Neuro Recode — Phase 1 schema
-- Run in Supabase SQL editor on a fresh project.

create extension if not exists "pgcrypto";

-- =========================================================================
-- users: app profile keyed to auth.users
-- =========================================================================
create table if not exists public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  phone text unique,
  name text,
  language text not null default 'en' check (language in ('en','ta')),
  preferred_time text,
  consent_whatsapp boolean not null default false,
  consent_push boolean not null default false,
  expo_push_token text,
  onboarding_complete boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- =========================================================================
-- programmes: a user's 60-day attempt. On strict reset, status becomes
-- 'reset' and a new row is inserted.
-- =========================================================================
create table if not exists public.programmes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  start_date date not null,
  status text not null default 'active'
    check (status in ('active','completed','paused','reset')),
  current_day int not null default 1,
  streak int not null default 0,
  longest_streak int not null default 0,
  missed_days int not null default 0,
  consecutive_misses int not null default 0,
  completed_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists programmes_user_idx on public.programmes(user_id, status);

-- =========================================================================
-- daily_uploads: one row per completed day. Unique on (programme, day).
-- =========================================================================
create table if not exists public.daily_uploads (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  programme_id uuid not null references public.programmes(id) on delete cascade,
  day_number int not null check (day_number between 1 and 60),
  image_path text not null,
  note text,
  uploaded_at timestamptz not null default now(),
  unique (programme_id, day_number)
);

create index if not exists daily_uploads_programme_idx on public.daily_uploads(programme_id);

-- =========================================================================
-- reminders_log: audit trail of every push / WhatsApp fired by the cron
-- =========================================================================
create table if not exists public.reminders_log (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  channel text not null check (channel in ('push','whatsapp','sms')),
  template text not null,
  sent_at timestamptz not null default now(),
  status text not null default 'sent',
  error text
);

create index if not exists reminders_log_user_idx on public.reminders_log(user_id, sent_at desc);

-- =========================================================================
-- at_risk_flags: a row appears when consecutive_misses hits 3
-- =========================================================================
create table if not exists public.at_risk_flags (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  programme_id uuid not null references public.programmes(id) on delete cascade,
  flagged_at timestamptz not null default now(),
  resolved_at timestamptz,
  called_by uuid references public.users(id),
  call_note text
);

-- =========================================================================
-- admin_users: separate role table so admin login is not mixed with members
-- =========================================================================
create table if not exists public.admin_users (
  id uuid primary key references auth.users(id) on delete cascade,
  role text not null default 'support' check (role in ('admin','support')),
  created_at timestamptz not null default now()
);

-- =========================================================================
-- settings: single-row config; keyed by id = 1
-- =========================================================================
create table if not exists public.settings (
  id int primary key default 1,
  missed_day_policy text not null default 'strict'
    check (missed_day_policy in ('strict','continue')),
  push_morning time not null default '07:00',
  push_midday time not null default '12:30',
  push_evening time not null default '18:00',
  push_final time not null default '21:30',
  whatsapp_morning time not null default '08:00',
  whatsapp_final time not null default '20:30',
  updated_at timestamptz not null default now()
);

insert into public.settings (id) values (1) on conflict (id) do nothing;

-- =========================================================================
-- RLS
-- =========================================================================
alter table public.users enable row level security;
alter table public.programmes enable row level security;
alter table public.daily_uploads enable row level security;
alter table public.reminders_log enable row level security;
alter table public.at_risk_flags enable row level security;

create policy "users_select_own" on public.users
  for select using (auth.uid() = id);
create policy "users_upsert_own" on public.users
  for insert with check (auth.uid() = id);
create policy "users_update_own" on public.users
  for update using (auth.uid() = id);

create policy "programmes_own" on public.programmes
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "daily_uploads_own" on public.daily_uploads
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "reminders_log_own_read" on public.reminders_log
  for select using (auth.uid() = user_id);

-- =========================================================================
-- Guardrail: a day counts only if uploaded_at falls inside the correct
-- IST calendar day computed from the programme's start_date + day_number.
-- =========================================================================
create or replace function public.enforce_upload_day()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  p_start date;
  expected_date date;
  upload_ist_date date;
begin
  select start_date into p_start from public.programmes where id = new.programme_id;
  expected_date := p_start + (new.day_number - 1);
  upload_ist_date := (new.uploaded_at at time zone 'Asia/Kolkata')::date;

  if upload_ist_date <> expected_date then
    raise exception 'upload_day_mismatch: expected % got %', expected_date, upload_ist_date;
  end if;
  return new;
end;
$$;

drop trigger if exists daily_uploads_enforce on public.daily_uploads;
create trigger daily_uploads_enforce
  before insert on public.daily_uploads
  for each row execute procedure public.enforce_upload_day();

-- =========================================================================
-- After-upload trigger: update programme counters.
-- =========================================================================
create or replace function public.after_daily_upload()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  prg public.programmes%rowtype;
  new_streak int;
  new_longest int;
  new_missed int;
  today_ist date;
  expected_day int;
begin
  select * into prg from public.programmes where id = new.programme_id for update;

  today_ist := (now() at time zone 'Asia/Kolkata')::date;
  expected_day := (today_ist - prg.start_date) + 1;

  -- streak math: previous day done? +1, else reset to 1
  if exists (
    select 1 from public.daily_uploads
    where programme_id = prg.id and day_number = new.day_number - 1
  ) then
    new_streak := prg.streak + 1;
  else
    new_streak := 1;
  end if;

  new_longest := greatest(prg.longest_streak, new_streak);
  new_missed := greatest(0, expected_day - (
    select count(*) from public.daily_uploads where programme_id = prg.id
  ));

  update public.programmes
     set current_day = greatest(current_day, new.day_number),
         streak = new_streak,
         longest_streak = new_longest,
         missed_days = new_missed,
         consecutive_misses = 0,
         status = case when new.day_number >= 60 then 'completed' else status end,
         completed_at = case when new.day_number >= 60 then now() else completed_at end
   where id = prg.id;

  return new;
end;
$$;

drop trigger if exists daily_uploads_after on public.daily_uploads;
create trigger daily_uploads_after
  after insert on public.daily_uploads
  for each row execute procedure public.after_daily_upload();

-- =========================================================================
-- Storage bucket for photos. Private; access via signed URLs only.
-- =========================================================================
insert into storage.buckets (id, name, public) values ('rrr-uploads','rrr-uploads', false)
  on conflict (id) do nothing;

create policy "rrr_uploads_insert_own"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'rrr-uploads' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "rrr_uploads_select_own"
  on storage.objects for select to authenticated
  using (bucket_id = 'rrr-uploads' and (storage.foldername(name))[1] = auth.uid()::text);
