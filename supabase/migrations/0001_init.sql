-- PS6 Local & Experiences — core schema
-- Run this file (then 0002_scoring_function.sql, then ../seed.sql) in the
-- Supabase SQL Editor: https://supabase.com/dashboard/project/_/sql/new

create extension if not exists "pgcrypto";

-- One row per authenticated user, mirrors auth.users.
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null,
  role text not null check (role in ('traveler', 'host')),
  language text not null default 'en' check (language in ('en', 'hi')),
  city text not null default 'Ahmedabad',
  created_at timestamptz not null default now()
);

-- Traveler-only preferences captured during onboarding.
create table if not exists traveler_profiles (
  user_id uuid primary key references profiles(id) on delete cascade,
  interest_tags text[] not null default '{}',
  budget_min numeric not null default 0,
  budget_max numeric not null default 2000,
  time_window text not null default 'any' check (time_window in ('morning', 'afternoon', 'evening', 'night', 'any')),
  lat double precision not null default 23.0225,
  lng double precision not null default 72.5714,
  updated_at timestamptz not null default now()
);

-- Host-only business info.
create table if not exists host_profiles (
  user_id uuid primary key references profiles(id) on delete cascade,
  business_name text not null,
  verified boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists experiences (
  id uuid primary key default gen_random_uuid(),
  host_id uuid not null references profiles(id) on delete cascade,
  title text not null,
  description text not null,
  tags text[] not null default '{}',
  price numeric not null check (price >= 0),
  capacity int not null default 8 check (capacity > 0),
  location_name text not null,
  lat double precision not null,
  lng double precision not null,
  time_slots text[] not null default '{}', -- subset of morning/afternoon/evening/night
  duration_label text not null default '2 hours',
  image_url text not null default '/image.png',
  review_count int not null default 0,
  rating numeric not null default 4.5 check (rating >= 0 and rating <= 5),
  status text not null default 'live' check (status in ('live', 'draft')),
  created_at timestamptz not null default now()
);

create index if not exists experiences_host_id_idx on experiences(host_id);
create index if not exists experiences_status_idx on experiences(status);

create table if not exists interactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  experience_id uuid not null references experiences(id) on delete cascade,
  type text not null check (type in ('view', 'save', 'unsave', 'swipe_right', 'swipe_left', 'interest', 'book')),
  created_at timestamptz not null default now()
);

create index if not exists interactions_experience_id_idx on interactions(experience_id);
create index if not exists interactions_user_id_idx on interactions(user_id);

create table if not exists reviews (
  id uuid primary key default gen_random_uuid(),
  experience_id uuid not null references experiences(id) on delete cascade,
  user_id uuid not null references profiles(id) on delete cascade,
  rating numeric not null check (rating >= 1 and rating <= 5),
  text text not null default '',
  created_at timestamptz not null default now()
);

-- Row Level Security --------------------------------------------------------

alter table profiles enable row level security;
alter table traveler_profiles enable row level security;
alter table host_profiles enable row level security;
alter table experiences enable row level security;
alter table interactions enable row level security;
alter table reviews enable row level security;

-- profiles: names/roles are shown publicly on listing cards, but only the
-- owner can write.
create policy "profiles are publicly readable" on profiles for select using (true);
create policy "users insert their own profile" on profiles for insert with check (auth.uid() = id);
create policy "users update their own profile" on profiles for update using (auth.uid() = id);

-- traveler_profiles: private to the traveler (contains budget etc).
create policy "travelers manage their own profile" on traveler_profiles
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- host_profiles: business name is public, only the host can write.
create policy "host profiles are publicly readable" on host_profiles for select using (true);
create policy "hosts manage their own profile" on host_profiles
  for insert with check (auth.uid() = user_id);
create policy "hosts update their own profile" on host_profiles
  for update using (auth.uid() = user_id);

-- experiences: public discovery feed, but only the owning host can write.
create policy "experiences are publicly readable" on experiences for select using (true);
create policy "hosts insert their own experiences" on experiences
  for insert with check (auth.uid() = host_id);
create policy "hosts update their own experiences" on experiences
  for update using (auth.uid() = host_id);
create policy "hosts delete their own experiences" on experiences
  for delete using (auth.uid() = host_id);

-- interactions: a traveler can write/read their own; a host can read
-- interactions on listings they own (for the dashboard counters).
create policy "users insert their own interactions" on interactions
  for insert with check (auth.uid() = user_id);
create policy "users read their own interactions" on interactions
  for select using (
    auth.uid() = user_id
    or exists (
      select 1 from experiences e
      where e.id = interactions.experience_id and e.host_id = auth.uid()
    )
  );
create policy "users delete their own interactions" on interactions
  for delete using (auth.uid() = user_id);

-- reviews: public read, author-only write.
create policy "reviews are publicly readable" on reviews for select using (true);
create policy "users write their own reviews" on reviews
  for insert with check (auth.uid() = user_id);
