-- ============================================================================
-- BookWise Local - Schema Migration 003: Row Level Security (RLS)
-- ============================================================================

-- Enable RLS on every table
alter table profiles enable row level security;
alter table categories enable row level security;
alter table shops enable row level security;
alter table services enable row level security;
alter table staff_members enable row level security;
alter table business_hours enable row level security;
alter table time_off enable row level security;
alter table bookings enable row level security;
alter table booking_events enable row level security;
alter table reviews enable row level security;
alter table customer_notes enable row level security;
alter table chat_sessions enable row level security;
alter table chat_messages enable row level security;

-- ----------------------------------------------------------------------------
-- Security Helper: is_shop_owner
-- ----------------------------------------------------------------------------
create or replace function is_shop_owner(p_shop uuid) returns boolean as $$
  select exists (
    select 1 from shops
    where id = p_shop and owner_id = auth.uid()
  );
$$ language sql stable security definer set search_path = public;

-- ----------------------------------------------------------------------------
-- Profiles policies
-- ----------------------------------------------------------------------------
drop policy if exists "own profile read" on profiles;
create policy "own profile read" on profiles
  for select using (id = auth.uid());

drop policy if exists "own profile update" on profiles;
create policy "own profile update" on profiles
  for update using (id = auth.uid())
  with check (id = auth.uid() and role = (select role from profiles where id = auth.uid()));

-- ----------------------------------------------------------------------------
-- Categories policies (public read)
-- ----------------------------------------------------------------------------
drop policy if exists "categories public read" on categories;
create policy "categories public read" on categories
  for select using (true);

-- ----------------------------------------------------------------------------
-- Shops policies
-- ----------------------------------------------------------------------------
drop policy if exists "published shops public read" on shops;
create policy "published shops public read" on shops
  for select using (status = 'published' or owner_id = auth.uid());

drop policy if exists "owner insert shop" on shops;
create policy "owner insert shop" on shops
  for insert with check (owner_id = auth.uid());

drop policy if exists "owner update shop" on shops;
create policy "owner update shop" on shops
  for update using (owner_id = auth.uid());

drop policy if exists "owner delete shop" on shops;
create policy "owner delete shop" on shops
  for delete using (owner_id = auth.uid());

-- ----------------------------------------------------------------------------
-- Services policies
-- ----------------------------------------------------------------------------
drop policy if exists "services public read" on services;
create policy "services public read" on services
  for select using (
    exists (
      select 1 from shops s
      where s.id = shop_id and (s.status = 'published' or s.owner_id = auth.uid())
    )
  );

drop policy if exists "services owner write" on services;
create policy "services owner write" on services
  for all using (is_shop_owner(shop_id))
  with check (is_shop_owner(shop_id));

-- ----------------------------------------------------------------------------
-- Business hours policies
-- ----------------------------------------------------------------------------
drop policy if exists "hours public read" on business_hours;
create policy "hours public read" on business_hours
  for select using (
    exists (
      select 1 from shops s
      where s.id = shop_id and s.status = 'published'
    ) or is_shop_owner(shop_id)
  );

drop policy if exists "hours owner write" on business_hours;
create policy "hours owner write" on business_hours
  for all using (is_shop_owner(shop_id))
  with check (is_shop_owner(shop_id));

-- ----------------------------------------------------------------------------
-- Staff members policies
-- ----------------------------------------------------------------------------
drop policy if exists "staff public read" on staff_members;
create policy "staff public read" on staff_members
  for select using (
    exists (
      select 1 from shops s
      where s.id = shop_id and s.status = 'published'
    ) or is_shop_owner(shop_id)
  );

drop policy if exists "staff owner write" on staff_members;
create policy "staff owner write" on staff_members
  for all using (is_shop_owner(shop_id))
  with check (is_shop_owner(shop_id));

-- ----------------------------------------------------------------------------
-- Time off policies (shop owner only)
-- ----------------------------------------------------------------------------
drop policy if exists "timeoff owner all" on time_off;
create policy "timeoff owner all" on time_off
  for all using (is_shop_owner(shop_id))
  with check (is_shop_owner(shop_id));

-- ----------------------------------------------------------------------------
-- Bookings policies
-- ----------------------------------------------------------------------------
drop policy if exists "customer read own bookings" on bookings;
create policy "customer read own bookings" on bookings
  for select using (customer_id = auth.uid());

drop policy if exists "owner read shop bookings" on bookings;
create policy "owner read shop bookings" on bookings
  for select using (is_shop_owner(shop_id));

drop policy if exists "owner update shop bookings" on bookings;
create policy "owner update shop bookings" on bookings
  for update using (is_shop_owner(shop_id));

-- ----------------------------------------------------------------------------
-- Booking events policies
-- ----------------------------------------------------------------------------
drop policy if exists "events read" on booking_events;
create policy "events read" on booking_events
  for select using (
    exists (
      select 1 from bookings b
      where b.id = booking_id and (b.customer_id = auth.uid() or is_shop_owner(b.shop_id))
    )
  );

-- ----------------------------------------------------------------------------
-- Reviews policies
-- ----------------------------------------------------------------------------
drop policy if exists "reviews public read" on reviews;
create policy "reviews public read" on reviews
  for select using (true);

drop policy if exists "reviews customer insert" on reviews;
create policy "reviews customer insert" on reviews
  for insert with check (
    customer_id = auth.uid() and exists (
      select 1 from bookings b
      where b.id = booking_id and b.customer_id = auth.uid() and b.status = 'completed'
    )
  );

-- ----------------------------------------------------------------------------
-- Customer notes policies (shop owner only)
-- ----------------------------------------------------------------------------
drop policy if exists "notes owner all" on customer_notes;
create policy "notes owner all" on customer_notes
  for all using (is_shop_owner(shop_id))
  with check (is_shop_owner(shop_id));

-- ----------------------------------------------------------------------------
-- Chat sessions & messages policies
-- ----------------------------------------------------------------------------
drop policy if exists "chat sessions own" on chat_sessions;
create policy "chat sessions own" on chat_sessions
  for all using (user_id = auth.uid())
  with check (user_id = auth.uid());

drop policy if exists "chat messages own" on chat_messages;
create policy "chat messages own" on chat_messages
  for all using (
    exists (
      select 1 from chat_sessions cs
      where cs.id = session_id and cs.user_id = auth.uid()
    )
  );

