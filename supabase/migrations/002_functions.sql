-- ============================================================================
-- BookWise Local - Schema Migration 002: Functions & RPCs
-- ============================================================================

-- ----------------------------------------------------------------------------
-- create_booking RPC (Atomic, Conflict-Safe Booking Creation)
-- ----------------------------------------------------------------------------
create or replace function create_booking(
  p_shop_id uuid,
  p_service_id uuid,
  p_staff_id uuid,
  p_customer_id uuid,
  p_name text,
  p_phone text,
  p_email text,
  p_notes text,
  p_start timestamptz,
  p_source booking_source default 'web'
) returns bookings as $$
declare
  v_service services%rowtype;
  v_shop shops%rowtype;
  v_staff uuid;
  v_end timestamptz;
  v_occ timestamptz;
  v_booking bookings%rowtype;
begin
  -- Validate shop
  select * into v_shop from shops where id = p_shop_id and status = 'published';
  if not found then
    raise exception 'SHOP_NOT_AVAILABLE' using errcode = 'P0001';
  end if;

  -- Validate service
  select * into v_service from services where id = p_service_id and shop_id = p_shop_id and is_active;
  if not found then
    raise exception 'SERVICE_NOT_AVAILABLE' using errcode = 'P0001';
  end if;

  -- Validate notice window and max advance days
  if p_start < now() + make_interval(hours => v_shop.min_notice_hours) then
    raise exception 'TOO_SOON' using errcode = 'P0001';
  end if;
  if p_start > now() + make_interval(days => v_shop.max_advance_days) then
    raise exception 'TOO_FAR' using errcode = 'P0001';
  end if;

  -- Compute timing
  v_end := p_start + make_interval(mins => v_service.duration_minutes);
  v_occ := v_end + make_interval(mins => v_service.buffer_minutes);

  -- Check shop-wide or staff-specific time off / holidays / blocked slots
  if exists (
    select 1 from time_off t
    where t.shop_id = p_shop_id
      and (t.staff_id is null or t.staff_id = coalesce(p_staff_id, t.staff_id))
      and tstzrange(t.starts_at, t.ends_at) && tstzrange(p_start, v_occ)
  ) then
    raise exception 'SLOT_BLOCKED' using errcode = 'P0001';
  end if;

  -- Select staff: requested or the first active staff member free during the slot
  if p_staff_id is not null then
    -- Verify chosen staff is active and belongs to shop
    if not exists (select 1 from staff_members where id = p_staff_id and shop_id = p_shop_id and is_active) then
      raise exception 'STAFF_NOT_AVAILABLE' using errcode = 'P0001';
    end if;
    v_staff := p_staff_id;
  else
    select sm.id into v_staff from staff_members sm
    where sm.shop_id = p_shop_id and sm.is_active
      and not exists (
        select 1 from bookings b
        where b.staff_id = sm.id and b.status in ('pending', 'confirmed')
          and tstzrange(b.start_time, b.occupied_until, '[)') && tstzrange(p_start, v_occ, '[)')
      )
    order by sm.is_default desc, sm.created_at asc limit 1;

    if v_staff is null then
      raise exception 'SLOT_TAKEN' using errcode = 'P0001';
    end if;
  end if;

  -- Insert booking (handled inside begin-exception for exclusion_violation)
  begin
    insert into bookings (
      shop_id, service_id, staff_id, customer_id, customer_name,
      customer_phone, customer_email, notes, start_time, end_time,
      occupied_until, status, source, price_at_booking
    )
    values (
      p_shop_id, p_service_id, v_staff, p_customer_id, p_name,
      p_phone, p_email, p_notes, p_start, v_end,
      v_occ,
      case when v_shop.auto_confirm then 'confirmed'::booking_status else 'pending'::booking_status end,
      p_source, v_service.price
    )
    returning * into v_booking;
  exception when exclusion_violation then
    raise exception 'SLOT_TAKEN' using errcode = 'P0001';
  end;

  -- Record audit event
  insert into booking_events (booking_id, actor_id, from_status, to_status, note)
  values (v_booking.id, p_customer_id, null, v_booking.status, 'Booking created via ' || p_source::text);

  return v_booking;
end;
$$ language plpgsql security definer set search_path = public;

revoke all on function create_booking from public, anon, authenticated;

-- ----------------------------------------------------------------------------
-- reschedule_booking RPC (Atomic Cancel Old + Create New Booking)
-- ----------------------------------------------------------------------------
create or replace function reschedule_booking(
  p_booking_id uuid,
  p_new_start timestamptz,
  p_actor_id uuid
) returns bookings as $$
declare
  v_old bookings%rowtype;
  v_shop shops%rowtype;
  v_service services%rowtype;
  v_staff uuid;
  v_end timestamptz;
  v_occ timestamptz;
  v_new bookings%rowtype;
begin
  -- Fetch existing booking
  select * into v_old from bookings where id = p_booking_id for update;
  if not found then
    raise exception 'BOOKING_NOT_FOUND' using errcode = 'P0001';
  end if;

  if v_old.status not in ('pending', 'confirmed') then
    raise exception 'CANNOT_RESCHEDULE_STATUS' using errcode = 'P0001';
  end if;

  -- Fetch shop
  select * into v_shop from shops where id = v_old.shop_id and status = 'published';
  if not found then
    raise exception 'SHOP_NOT_AVAILABLE' using errcode = 'P0001';
  end if;

  -- Check cancellation/reschedule policy window
  if v_old.start_time < now() + make_interval(hours => v_shop.cancellation_window_hours) then
    raise exception 'INSIDE_CANCELLATION_WINDOW' using errcode = 'P0001';
  end if;

  -- Fetch service
  select * into v_service from services where id = v_old.service_id and is_active;
  if not found then
    raise exception 'SERVICE_NOT_AVAILABLE' using errcode = 'P0001';
  end if;

  -- Verify new start timing rules
  if p_new_start < now() + make_interval(hours => v_shop.min_notice_hours) then
    raise exception 'TOO_SOON' using errcode = 'P0001';
  end if;
  if p_new_start > now() + make_interval(days => v_shop.max_advance_days) then
    raise exception 'TOO_FAR' using errcode = 'P0001';
  end if;

  v_end := p_new_start + make_interval(mins => v_service.duration_minutes);
  v_occ := v_end + make_interval(mins => v_service.buffer_minutes);

  -- Check time off for new slot
  if exists (
    select 1 from time_off t
    where t.shop_id = v_shop.id
      and (t.staff_id is null or t.staff_id = v_old.staff_id)
      and tstzrange(t.starts_at, t.ends_at) && tstzrange(p_new_start, v_occ)
  ) then
    raise exception 'SLOT_BLOCKED' using errcode = 'P0001';
  end if;

  -- Cancel existing booking first to free up slot if same staff
  update bookings set
    status = 'cancelled',
    cancelled_reason = 'Rescheduled to new time: ' || p_new_start::text,
    updated_at = now()
  where id = v_old.id;

  insert into booking_events (booking_id, actor_id, from_status, to_status, note)
  values (v_old.id, p_actor_id, v_old.status, 'cancelled', 'Rescheduled to new booking');

  -- Attempt to keep same staff if free, else pick another active free staff
  if not exists (
    select 1 from bookings b
    where b.staff_id = v_old.staff_id and b.id <> v_old.id and b.status in ('pending', 'confirmed')
      and tstzrange(b.start_time, b.occupied_until, '[)') && tstzrange(p_new_start, v_occ, '[)')
  ) then
    v_staff := v_old.staff_id;
  else
    select sm.id into v_staff from staff_members sm
    where sm.shop_id = v_shop.id and sm.is_active
      and not exists (
        select 1 from bookings b
        where b.staff_id = sm.id and b.status in ('pending', 'confirmed')
          and tstzrange(b.start_time, b.occupied_until, '[)') && tstzrange(p_new_start, v_occ, '[)')
      )
    order by sm.is_default desc, sm.created_at asc limit 1;

    if v_staff is null then
      -- Rollback cancellation if no slot is free
      raise exception 'SLOT_TAKEN' using errcode = 'P0001';
    end if;
  end if;

  -- Insert new booking
  begin
    insert into bookings (
      shop_id, service_id, staff_id, customer_id, customer_name,
      customer_phone, customer_email, notes, start_time, end_time,
      occupied_until, status, source, price_at_booking
    )
    values (
      v_shop.id, v_service.id, v_staff, v_old.customer_id, v_old.customer_name,
      v_old.customer_phone, v_old.customer_email, v_old.notes,
      p_new_start, v_end, v_occ,
      case when v_shop.auto_confirm then 'confirmed'::booking_status else 'pending'::booking_status end,
      v_old.source, v_service.price
    )
    returning * into v_new;
  exception when exclusion_violation then
    raise exception 'SLOT_TAKEN' using errcode = 'P0001';
  end;

  insert into booking_events (booking_id, actor_id, from_status, to_status, note)
  values (v_new.id, p_actor_id, null, v_new.status, 'Rescheduled replacement for ' || v_old.reference_code);

  return v_new;
end;
$$ language plpgsql security definer set search_path = public;

revoke all on function reschedule_booking from public, anon, authenticated;

