-- ============================================================================
-- BookWise Local - Schema Migration 001: Init
-- ============================================================================

-- Extensions
create extension if not exists "pgcrypto";
create extension if not exists "btree_gist";
create extension if not exists "pg_trgm";

-- Enums
do $$ begin
  create type user_role as enum ('customer', 'shopkeeper', 'admin');
exception when duplicate_object then null; end $$;

do $$ begin
  create type booking_status as enum ('pending', 'confirmed', 'completed', 'cancelled', 'no_show');
exception when duplicate_object then null; end $$;

do $$ begin
  create type shop_status as enum ('draft', 'published', 'suspended');
exception when duplicate_object then null; end $$;

do $$ begin
  create type chat_role as enum ('user', 'assistant', 'tool');
exception when duplicate_object then null; end $$;

do $$ begin
  create type booking_source as enum ('web', 'ai_assistant', 'walk_in');
exception when duplicate_object then null; end $$;

-- Helper: updated_at trigger function
create or replace function set_updated_at() returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- ----------------------------------------------------------------------------
-- Profiles (1:1 with auth.users)
-- ----------------------------------------------------------------------------
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role user_role not null default 'customer',
  full_name text not null check (char_length(full_name) between 2 and 80),
  phone text,
  email text not null,
  avatar_url text,
  email_notifications boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists trg_profiles_updated on profiles;
create trigger trg_profiles_updated before update on profiles
  for each row execute function set_updated_at();

-- Auto-create profile on signup trigger
create or replace function handle_new_user() returns trigger as $$
begin
  insert into profiles (id, role, full_name, email)
  values (
    new.id,
    coalesce((new.raw_user_meta_data->>'role')::user_role, 'customer'),
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    coalesce(new.email, '')
  )
  on conflict (id) do update set
    email = excluded.email,
    full_name = coalesce(excluded.full_name, profiles.full_name);
  return new;
end;
$$ language plpgsql security definer set search_path = public;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function handle_new_user();

-- ----------------------------------------------------------------------------
-- Categories
-- ----------------------------------------------------------------------------
create table if not exists categories (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null,
  icon text,
  sort_order int not null default 0
);

-- ----------------------------------------------------------------------------
-- Shops
-- ----------------------------------------------------------------------------
create table if not exists shops (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references profiles(id) on delete cascade,
  category_id uuid references categories(id),
  name text not null check (char_length(name) between 2 and 120),
  slug text unique not null,
  description text check (char_length(description) <= 1000),
  phone text,
  email text,
  address_line text,
  city text not null,
  state text,
  postal_code text,
  latitude double precision,
  longitude double precision,
  timezone text not null default 'Asia/Kolkata',
  slot_interval_minutes int not null default 30 check (slot_interval_minutes in (10,15,20,30,60)),
  min_notice_hours int not null default 1 check (min_notice_hours >= 0),
  max_advance_days int not null default 60 check (max_advance_days between 1 and 365),
  cancellation_window_hours int not null default 2 check (cancellation_window_hours >= 0),
  auto_confirm boolean not null default true,
  cover_image_url text,
  gallery_urls text[] not null default '{}',
  tags text[] not null default '{}',
  status shop_status not null default 'draft',
  rating_avg numeric(3,2) not null default 0,
  rating_count int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_shops_status_city on shops(status, city);
create index if not exists idx_shops_category on shops(category_id);
create index if not exists idx_shops_name_trgm on shops using gin (name gin_trgm_ops);

drop trigger if exists trg_shops_updated on shops;
create trigger trg_shops_updated before update on shops
  for each row execute function set_updated_at();

-- ----------------------------------------------------------------------------
-- Services
-- ----------------------------------------------------------------------------
create table if not exists services (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid not null references shops(id) on delete cascade,
  name text not null check (char_length(name) between 2 and 120),
  description text,
  duration_minutes int not null check (duration_minutes between 5 and 480),
  buffer_minutes int not null default 0 check (buffer_minutes between 0 and 60),
  price numeric(10,2) not null check (price >= 0),
  currency text not null default 'INR',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_services_shop on services(shop_id) where is_active;
create index if not exists idx_services_name_trgm on services using gin (name gin_trgm_ops);

drop trigger if exists trg_services_updated on services;
create trigger trg_services_updated before update on services
  for each row execute function set_updated_at();

-- ----------------------------------------------------------------------------
-- Staff Members
-- ----------------------------------------------------------------------------
create table if not exists staff_members (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid not null references shops(id) on delete cascade,
  name text not null,
  is_default boolean not null default false,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create index if not exists idx_staff_shop on staff_members(shop_id);

create or replace function create_default_staff() returns trigger as $$
begin
  insert into staff_members (shop_id, name, is_default)
  values (new.id, new.name || ' Specialist', true);
  return new;
end;
$$ language plpgsql security definer set search_path = public;

drop trigger if exists trg_shop_default_staff on shops;
create trigger trg_shop_default_staff after insert on shops
  for each row execute function create_default_staff();

-- ----------------------------------------------------------------------------
-- Business Hours (0 = Sunday ... 6 = Saturday)
-- ----------------------------------------------------------------------------
create table if not exists business_hours (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid not null references shops(id) on delete cascade,
  day_of_week smallint not null check (day_of_week between 0 and 6),
  open_time time not null,
  close_time time not null,
  check (close_time > open_time)
);

create index if not exists idx_hours_shop_day on business_hours(shop_id, day_of_week);

-- ----------------------------------------------------------------------------
-- Time off / Holidays / Blocked Slots
-- ----------------------------------------------------------------------------
create table if not exists time_off (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid not null references shops(id) on delete cascade,
  staff_id uuid references staff_members(id) on delete cascade,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  reason text,
  check (ends_at > starts_at)
);

create index if not exists idx_timeoff_shop_range on time_off using gist (shop_id, tstzrange(starts_at, ends_at));

-- ----------------------------------------------------------------------------
-- Bookings
-- ----------------------------------------------------------------------------
create table if not exists bookings (
  id uuid primary key default gen_random_uuid(),
  reference_code text unique not null default upper(substr(encode(gen_random_bytes(5), 'hex'), 1, 8)),
  shop_id uuid not null references shops(id) on delete cascade,
  service_id uuid not null references services(id),
  staff_id uuid not null references staff_members(id),
  customer_id uuid references profiles(id) on delete set null,
  customer_name text not null,
  customer_phone text not null,
  customer_email text not null,
  notes text,
  start_time timestamptz not null,
  end_time timestamptz not null,
  occupied_until timestamptz not null, -- end_time + buffer
  status booking_status not null default 'confirmed',
  source booking_source not null default 'web',
  price_at_booking numeric(10,2) not null,
  cancelled_reason text,
  reminder_sent boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (end_time > start_time),
  check (occupied_until >= end_time),
  -- DB-LEVEL DOUBLE-BOOKING PREVENTION
  constraint no_overlap_per_staff exclude using gist (
    staff_id with =,
    tstzrange(start_time, occupied_until, '[)') with &&
  ) where (status in ('pending', 'confirmed'))
);

create index if not exists idx_bookings_shop_start on bookings(shop_id, start_time);
create index if not exists idx_bookings_customer on bookings(customer_id, start_time desc);

drop trigger if exists trg_bookings_updated on bookings;
create trigger trg_bookings_updated before update on bookings
  for each row execute function set_updated_at();

-- ----------------------------------------------------------------------------
-- Booking Events (Audit Trail)
-- ----------------------------------------------------------------------------
create table if not exists booking_events (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references bookings(id) on delete cascade,
  actor_id uuid references profiles(id),
  from_status booking_status,
  to_status booking_status not null,
  note text,
  created_at timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- Reviews
-- ----------------------------------------------------------------------------
create table if not exists reviews (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid unique not null references bookings(id) on delete cascade,
  shop_id uuid not null references shops(id) on delete cascade,
  customer_id uuid not null references profiles(id) on delete cascade,
  rating smallint not null check (rating between 1 and 5),
  comment text check (char_length(comment) <= 1000),
  created_at timestamptz not null default now()
);

create or replace function refresh_shop_rating() returns trigger as $$
begin
  update shops s set
    rating_avg = coalesce((select round(avg(rating)::numeric, 2) from reviews where shop_id = s.id), 0),
    rating_count = (select count(*) from reviews where shop_id = s.id)
  where s.id = coalesce(new.shop_id, old.shop_id);
  return null;
end;
$$ language plpgsql security definer set search_path = public;

drop trigger if exists trg_reviews_rating on reviews;
create trigger trg_reviews_rating after insert or update or delete on reviews
  for each row execute function refresh_shop_rating();

-- ----------------------------------------------------------------------------
-- Customer Notes (Private to Shop)
-- ----------------------------------------------------------------------------
create table if not exists customer_notes (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid not null references shops(id) on delete cascade,
  customer_email text not null,
  note text not null,
  created_at timestamptz not null default now(),
  unique (shop_id, customer_email)
);

-- ----------------------------------------------------------------------------
-- AI Chat Sessions & Messages
-- ----------------------------------------------------------------------------
create table if not exists chat_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  title text,
  context_shop_id uuid references shops(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists chat_messages (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references chat_sessions(id) on delete cascade,
  role chat_role not null,
  content text,
  tool_name text,
  tool_payload jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_chat_messages_session on chat_messages(session_id, created_at);

-- ----------------------------------------------------------------------------
-- Realtime publication
-- ----------------------------------------------------------------------------
do $$ begin
  alter publication supabase_realtime add table bookings;
exception when others then null; end $$;

