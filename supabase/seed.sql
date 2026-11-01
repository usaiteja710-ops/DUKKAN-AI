-- ============================================================================
-- BookWise Local - Seed Data
-- ============================================================================

-- Categories
insert into categories (id, slug, name, icon, sort_order) values
  ('11111111-1111-1111-1111-111111111101', 'salon-beauty', 'Salon & Beauty', 'Sparkles', 1),
  ('11111111-1111-1111-1111-111111111102', 'barber-shop', 'Barber Shop', 'Scissors', 2),
  ('11111111-1111-1111-1111-111111111103', 'spa-wellness', 'Spa & Wellness', 'Heart', 3),
  ('11111111-1111-1111-1111-111111111104', 'clinic-dental', 'Clinic & Dental', 'Activity', 4),
  ('11111111-1111-1111-1111-111111111105', 'auto-repair', 'Auto Repair & Service', 'Wrench', 5),
  ('11111111-1111-1111-1111-111111111106', 'electronics-repair', 'Electronics & Mobile Repair', 'Smartphone', 6),
  ('11111111-1111-1111-1111-111111111107', 'tutoring-coaching', 'Tutoring & Coaching', 'BookOpen', 7),
  ('11111111-1111-1111-1111-111111111108', 'fitness-yoga', 'Fitness & Yoga Studio', 'Dumbbell', 8),
  ('11111111-1111-1111-1111-111111111109', 'pet-grooming', 'Pet Grooming & Vet', 'Dog', 9),
  ('11111111-1111-1111-1111-111111111110', 'photography-studio', 'Photography Studio', 'Camera', 10),
  ('11111111-1111-1111-1111-111111111111', 'home-services', 'Home Services', 'Home', 11),
  ('11111111-1111-1111-1111-111111111112', 'other', 'Other', 'Grid', 12)
on conflict (slug) do update set
  name = excluded.name,
  icon = excluded.icon,
  sort_order = excluded.sort_order;

-- Demo Profiles (Insert safely if not present)
insert into auth.users (id, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data)
values
  ('22222222-2222-2222-2222-222222222201', 'shopkeeper@bookwise.local', crypt('Password@123', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"role":"shopkeeper","full_name":"Rajesh Sharma"}'),
  ('22222222-2222-2222-2222-222222222202', 'customer@bookwise.local', crypt('Password@123', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"role":"customer","full_name":"Priya Rao"}')
on conflict (id) do nothing;

insert into profiles (id, role, full_name, email, phone) values
  ('22222222-2222-2222-2222-222222222201', 'shopkeeper', 'Rajesh Sharma', 'shopkeeper@bookwise.local', '+919876543210'),
  ('22222222-2222-2222-2222-222222222202', 'customer', 'Priya Rao', 'customer@bookwise.local', '+919876543211')
on conflict (id) do update set
  role = excluded.role,
  full_name = excluded.full_name;

-- ----------------------------------------------------------------------------
-- 8 Demo Published Shops
-- ----------------------------------------------------------------------------

-- 1. Urban Look Studio (Barber, Siripuram, Visakhapatnam)
insert into shops (id, owner_id, category_id, name, slug, description, phone, email, address_line, city, state, postal_code, latitude, longitude, timezone, slot_interval_minutes, min_notice_hours, max_advance_days, cancellation_window_hours, auto_confirm, status, rating_avg, rating_count, tags)
values (
  '33333333-3333-3333-3333-333333333301',
  '22222222-2222-2222-2222-222222222201',
  '11111111-1111-1111-1111-111111111102',
  'Urban Look Studio',
  'urban-look-studio-siripuram',
  'Premium modern barber shop offering precision haircuts, beard grooming, hot towel shaves, and skin treatments in Siripuram.',
  '+918912345678',
  'urbanlook@example.com',
  'Shop 4, Waltair Uplands, Near Siripuram Circle',
  'Visakhapatnam',
  'Andhra Pradesh',
  '530003',
  17.7215,
  83.3155,
  'Asia/Kolkata',
  30, 1, 30, 2, true, 'published', 4.85, 42,
  ARRAY['barber', 'haircut', 'beard', 'styling', 'siripuram']
) on conflict (id) do nothing;

-- 2. Glow & Radiance Salon (Salon & Beauty, MVP Colony, Visakhapatnam)
insert into shops (id, owner_id, category_id, name, slug, description, phone, email, address_line, city, state, postal_code, latitude, longitude, timezone, slot_interval_minutes, min_notice_hours, max_advance_days, cancellation_window_hours, auto_confirm, status, rating_avg, rating_count, tags)
values (
  '33333333-3333-3333-3333-333333333302',
  '22222222-2222-2222-2222-222222222201',
  '11111111-1111-1111-1111-111111111101',
  'Glow & Radiance Salon',
  'glow-radiance-salon-mvp',
  'Holistic beauty lounge for hair spa, facials, waxing, bridal makeovers, and nail art using natural organic products.',
  '+918919876543',
  'glowradiance@example.com',
  'Sector 3, Beside Rythu Bazaar, MVP Colony',
  'Visakhapatnam',
  'Andhra Pradesh',
  '530017',
  17.7420,
  83.3385,
  'Asia/Kolkata',
  30, 2, 45, 3, true, 'published', 4.90, 58,
  ARRAY['salon', 'facial', 'spa', 'haircare', 'bridal']
) on conflict (id) do nothing;

-- 3. Apex Dental & Wellness Clinic (Clinic & Dental, Jubilee Hills, Hyderabad)
insert into shops (id, owner_id, category_id, name, slug, description, phone, email, address_line, city, state, postal_code, latitude, longitude, timezone, slot_interval_minutes, min_notice_hours, max_advance_days, cancellation_window_hours, auto_confirm, status, rating_avg, rating_count, tags)
values (
  '33333333-3333-3333-3333-333333333303',
  '22222222-2222-2222-2222-222222222201',
  '11111111-1111-1111-1111-111111111104',
  'Apex Dental & Wellness Clinic',
  'apex-dental-jubilee-hills',
  'State-of-the-art dental care center specializing in routine cleanings, root canals, cosmetic whitening, and pediatric dentistry.',
  '+914023456789',
  'apexdental@example.com',
  'Road No. 36, Opposite Metro Pillar 1650, Jubilee Hills',
  'Hyderabad',
  'Telangana',
  '500033',
  17.4319,
  78.4073,
  'Asia/Kolkata',
  30, 2, 30, 4, true, 'published', 4.80, 35,
  ARRAY['dental', 'dentist', 'teeth cleaning', 'clinic', 'hyderabad']
) on conflict (id) do nothing;

-- 4. ProTech Mobile & Laptop Care (Electronics, Madhapur, Hyderabad)
insert into shops (id, owner_id, category_id, name, slug, description, phone, email, address_line, city, state, postal_code, latitude, longitude, timezone, slot_interval_minutes, min_notice_hours, max_advance_days, cancellation_window_hours, auto_confirm, status, rating_avg, rating_count, tags)
values (
  '33333333-3333-3333-3333-333333333304',
  '22222222-2222-2222-2222-222222222201',
  '11111111-1111-1111-1111-111111111106',
  'ProTech Mobile & Laptop Care',
  'protech-mobile-madhapur',
  'Certified device repair technicians providing express smartphone screen replacement, battery upgrades, and Mac/PC diagnostics.',
  '+914098765432',
  'protech@example.com',
  'Ayyappa Society Main Road, Near Shell Petrol Pump, Madhapur',
  'Hyderabad',
  'Telangana',
  '500081',
  17.4483,
  78.3915,
  'Asia/Kolkata',
  30, 1, 14, 1, true, 'published', 4.75, 29,
  ARRAY['electronics', 'mobile repair', 'laptop repair', 'screen replacement']
) on conflict (id) do nothing;

-- 5. Tranquil Bliss Ayurvedic Spa (Spa & Wellness, Indiranagar, Bengaluru)
insert into shops (id, owner_id, category_id, name, slug, description, phone, email, address_line, city, state, postal_code, latitude, longitude, timezone, slot_interval_minutes, min_notice_hours, max_advance_days, cancellation_window_hours, auto_confirm, status, rating_avg, rating_count, tags)
values (
  '33333333-3333-3333-3333-333333333305',
  '22222222-2222-2222-2222-222222222201',
  '11111111-1111-1111-1111-111111111103',
  'Tranquil Bliss Ayurvedic Spa',
  'tranquil-bliss-indiranagar',
  'Authentic traditional Ayurvedic wellness therapy, Shirodhara, aromatherapy massages, and deep tissue stress relief.',
  '+918023456789',
  'tranquilbliss@example.com',
  '100 Feet Road, 12th Main Junction, Indiranagar',
  'Bengaluru',
  'Karnataka',
  '560038',
  12.9784,
  77.6408,
  'Asia/Kolkata',
  60, 3, 60, 6, true, 'published', 4.92, 73,
  ARRAY['spa', 'massage', 'ayurveda', 'wellness', 'bengaluru']
) on conflict (id) do nothing;

-- 6. FastTrack Two-Wheeler & Car Garage (Auto Repair, Koramangala, Bengaluru)
insert into shops (id, owner_id, category_id, name, slug, description, phone, email, address_line, city, state, postal_code, latitude, longitude, timezone, slot_interval_minutes, min_notice_hours, max_advance_days, cancellation_window_hours, auto_confirm, status, rating_avg, rating_count, tags)
values (
  '33333333-3333-3333-3333-333333333306',
  '22222222-2222-2222-2222-222222222201',
  '11111111-1111-1111-1111-111111111105',
  'FastTrack Auto Garage',
  'fasttrack-auto-koramangala',
  'Complete vehicle servicing, periodic oil maintenance, brake tuning, tire alignment, and computerized diagnostics.',
  '+918098765432',
  'fasttrack@example.com',
  '80 Feet Road, 4th Block, Koramangala',
  'Bengaluru',
  'Karnataka',
  '560034',
  12.9352,
  77.6245,
  'Asia/Kolkata',
  60, 2, 21, 2, true, 'published', 4.70, 38,
  ARRAY['auto repair', 'garage', 'bike service', 'car maintenance']
) on conflict (id) do nothing;

-- 7. Paws & Claws Grooming Spa (Pet Grooming, Bandra West, Mumbai)
insert into shops (id, owner_id, category_id, name, slug, description, phone, email, address_line, city, state, postal_code, latitude, longitude, timezone, slot_interval_minutes, min_notice_hours, max_advance_days, cancellation_window_hours, auto_confirm, status, rating_avg, rating_count, tags)
values (
  '33333333-3333-3333-3333-333333333307',
  '22222222-2222-2222-2222-222222222201',
  '11111111-1111-1111-1111-111111111109',
  'Paws & Claws Grooming Spa',
  'paws-claws-bandra',
  'Gentle, compassionate pet pampering: medicated flea baths, breed styling, deshedding, and nail trimming for dogs and cats.',
  '+912223456789',
  'pawsclaws@example.com',
  'Hill Road, Near Bandra Police Station, Bandra West',
  'Mumbai',
  'Maharashtra',
  '400050',
  19.0596,
  72.8295,
  'Asia/Kolkata',
  30, 2, 30, 3, true, 'published', 4.88, 47,
  ARRAY['pets', 'dog grooming', 'cat bath', 'pet spa', 'mumbai']
) on conflict (id) do nothing;

-- 8. Zenith Mind Coaching & Tuition (Tutoring, Andheri East, Mumbai)
insert into shops (id, owner_id, category_id, name, slug, description, phone, email, address_line, city, state, postal_code, latitude, longitude, timezone, slot_interval_minutes, min_notice_hours, max_advance_days, cancellation_window_hours, auto_confirm, status, rating_avg, rating_count, tags)
values (
  '33333333-3333-3333-3333-333333333308',
  '22222222-2222-2222-2222-222222222201',
  '11111111-1111-1111-1111-111111111107',
  'Zenith Mind Coaching & Tuition',
  'zenith-mind-andheri',
  '1-on-1 personalized academic tutoring, STEM mentoring, competitive exam coaching (IIT-JEE/NEET foundation), and coding sessions.',
  '+912298765432',
  'zenithmind@example.com',
  'Chakala, Next to Metro Station, Andheri East',
  'Mumbai',
  'Maharashtra',
  '400093',
  19.1136,
  72.8697,
  'Asia/Kolkata',
  60, 4, 30, 6, true, 'published', 4.95, 62,
  ARRAY['tutoring', 'coaching', 'education', 'math', 'science']
) on conflict (id) do nothing;

-- ----------------------------------------------------------------------------
-- Services for each shop
-- ----------------------------------------------------------------------------

-- Urban Look Studio (Barber)
insert into services (id, shop_id, name, description, duration_minutes, buffer_minutes, price, is_active) values
  ('44444444-4444-4444-4444-444444444101', '33333333-3333-3333-3333-333333333301', 'Classic Haircut & Styling', 'Consultation, wash, precision shear haircut, and styling.', 30, 5, 299.00, true),
  ('44444444-4444-4444-4444-444444444102', '33333333-3333-3333-3333-333333333301', 'Beard Trim & Shape Up', 'Hot towel steam, razor lining, and conditioning beard balm.', 20, 5, 199.00, true),
  ('44444444-4444-4444-4444-444444444103', '33333333-3333-3333-3333-333333333301', 'Executive Grooming Package', 'Haircut, beard design, face detan scrub, and relaxing head massage.', 60, 10, 699.00, true),
  ('44444444-4444-4444-4444-444444444104', '33333333-3333-3333-3333-333333333301', 'Charcoal Detan Facial', 'Deep cleansing blackhead extraction and skin brightening mask.', 40, 10, 499.00, true)
on conflict (id) do nothing;

-- Glow & Radiance Salon (Beauty)
insert into services (id, shop_id, name, description, duration_minutes, buffer_minutes, price, is_active) values
  ('44444444-4444-4444-4444-444444444201', '33333333-3333-3333-3333-333333333302', 'Gold Radiance Facial', 'Hydrating anti-aging facial with pure herbal extracts.', 45, 10, 899.00, true),
  ('44444444-4444-4444-4444-444444444202', '33333333-3333-3333-3333-333333333302', 'Keratin Hair Spa Treatment', 'Intense moisture repair and smoothing for dry and damaged hair.', 60, 15, 1299.00, true),
  ('44444444-4444-4444-4444-444444444203', '33333333-3333-3333-3333-333333333302', 'Deluxe Manicure & Pedicure', 'Exfoliating sea salt scrub, cuticle care, massage, and gel polish.', 50, 10, 699.00, true)
on conflict (id) do nothing;

-- Apex Dental Clinic
insert into services (id, shop_id, name, description, duration_minutes, buffer_minutes, price, is_active) values
  ('44444444-4444-4444-4444-444444444301', '33333333-3333-3333-3333-333333333303', 'Dental Consultation & X-Ray', 'Comprehensive oral examination and digital panoramic radiograph.', 30, 5, 400.00, true),
  ('44444444-4444-4444-4444-444444444302', '33333333-3333-3333-3333-333333333303', 'Ultrasonic Scaling & Polishing', 'Complete tartar removal, plaque cleaning, and enamel polish.', 45, 15, 1200.00, true),
  ('44444444-4444-4444-4444-444444444303', '33333333-3333-3333-3333-333333333303', 'Laser Teeth Whitening', 'In-office instant brightening treatment for radiant smiles.', 60, 15, 3500.00, true)
on conflict (id) do nothing;

-- ProTech Mobile & Laptop Care
insert into services (id, shop_id, name, description, duration_minutes, buffer_minutes, price, is_active) values
  ('44444444-4444-4444-4444-444444444401', '33333333-3333-3333-3333-333333333304', 'Smartphone Screen Replacement', 'Genuine OEM display replacement with 6-month warranty.', 45, 10, 1899.00, true),
  ('44444444-4444-4444-4444-444444444402', '33333333-3333-3333-3333-333333333304', 'Battery Replacement & Health Check', 'New high-capacity battery installation and thermal check.', 30, 5, 999.00, true),
  ('44444444-4444-4444-4444-444444444403', '33333333-3333-3333-3333-333333333304', 'Laptop Deep Clean & Thermal Repaste', 'Dust extraction, heatsink flush, and Arctic MX-4 paste renewal.', 60, 15, 799.00, true)
on conflict (id) do nothing;

-- Tranquil Bliss Ayurvedic Spa
insert into services (id, shop_id, name, description, duration_minutes, buffer_minutes, price, is_active) values
  ('44444444-4444-4444-4444-444444444501', '33333333-3333-3333-3333-333333333305', 'Abhyanga Full Body Massage', 'Warm herbal infused oil massage harmonizing body energies.', 60, 15, 1799.00, true),
  ('44444444-4444-4444-4444-444444444502', '33333333-3333-3333-3333-333333333305', 'Shirodhara Mind Bliss Therapy', 'Gentle continuous stream of herbal oil on forehead for deep peace.', 60, 15, 2199.00, true)
on conflict (id) do nothing;

-- FastTrack Auto Garage
insert into services (id, shop_id, name, description, duration_minutes, buffer_minutes, price, is_active) values
  ('44444444-4444-4444-4444-444444444601', '33333333-3333-3333-3333-333333333306', 'General Two-Wheeler Service', 'Engine oil change, carburetor/FI tuning, brake inspection, wash.', 60, 15, 599.00, true),
  ('44444444-4444-4444-4444-444444444602', '33333333-3333-3333-3333-333333333306', 'Car 40-Point Comprehensive Inspection', 'Brakes, coolant, suspension check, battery and OBD scan.', 60, 20, 999.00, true)
on conflict (id) do nothing;

-- Paws & Claws Grooming Spa
insert into services (id, shop_id, name, description, duration_minutes, buffer_minutes, price, is_active) values
  ('44444444-4444-4444-4444-444444444701', '33333333-3333-3333-3333-333333333307', 'Bath, Blow-dry & Brushing', 'Hypoallergenic shampoo, warm blow dry, ear cleaning & spritz.', 45, 10, 799.00, true),
  ('44444444-4444-4444-4444-444444444702', '33333333-3333-3333-3333-333333333307', 'Full Breed Grooming & Haircut', 'Sanitary trim, scissor styling, paw pad shaving and nail buff.', 60, 15, 1499.00, true)
on conflict (id) do nothing;

-- Zenith Mind Coaching & Tuition
insert into services (id, shop_id, name, description, duration_minutes, buffer_minutes, price, is_active) values
  ('44444444-4444-4444-4444-444444444801', '33333333-3333-3333-3333-333333333308', '1-on-1 Mathematics Mentorship', 'Class 9-12 calculus, algebra, and analytical problem-solving session.', 60, 10, 750.00, true),
  ('44444444-4444-4444-4444-444444444802', '33333333-3333-3333-3333-333333333308', 'Python & Robotics Foundation', 'Hands-on programming logic, data structures, and mini projects.', 60, 10, 850.00, true)
on conflict (id) do nothing;

-- ----------------------------------------------------------------------------
-- Weekly Business Hours for each shop (Monday to Saturday: 10:00-13:00, 14:00-20:00)
-- ----------------------------------------------------------------------------
-- Days 1=Monday to 6=Saturday
do $$
declare
  s_id uuid;
  day_idx smallint;
begin
  for s_id in select id from shops loop
    for day_idx in 1..6 loop
      -- Morning window: 10:00 - 13:00
      insert into business_hours (shop_id, day_of_week, open_time, close_time)
      values (s_id, day_idx, '10:00:00', '13:00:00');
      -- Afternoon/Evening window: 14:00 - 20:00 (13:00-14:00 is lunch break)
      insert into business_hours (shop_id, day_of_week, open_time, close_time)
      values (s_id, day_idx, '14:00:00', '20:00:00');
    end loop;
  end loop;
end $$;

-- ----------------------------------------------------------------------------
-- Staff members (ensure default staff exists)
-- ----------------------------------------------------------------------------
insert into staff_members (shop_id, name, is_default, is_active)
select id, name || ' Senior Stylist', true, true
from shops
where id not in (select shop_id from staff_members);

-- ----------------------------------------------------------------------------
-- Sample Reviews
-- ----------------------------------------------------------------------------
-- Create mock completed booking to anchor review
insert into bookings (
  id, reference_code, shop_id, service_id, staff_id, customer_id,
  customer_name, customer_phone, customer_email, start_time, end_time,
  occupied_until, status, source, price_at_booking
) values (
  '55555555-5555-5555-5555-555555555501',
  'REVBOOK1',
  '33333333-3333-3333-3333-333333333301',
  '44444444-4444-4444-4444-444444444101',
  (select id from staff_members where shop_id = '33333333-3333-3333-3333-333333333301' limit 1),
  '22222222-2222-2222-2222-222222222202',
  'Priya Rao',
  '+919876543211',
  'customer@bookwise.local',
  now() - interval '2 days',
  now() - interval '2 days' + interval '30 minutes',
  now() - interval '2 days' + interval '35 minutes',
  'completed',
  'web',
  299.00
) on conflict (id) do nothing;

insert into reviews (booking_id, shop_id, customer_id, rating, comment) values
  ('55555555-5555-5555-5555-555555555501', '33333333-3333-3333-3333-333333333301', '22222222-2222-2222-2222-222222222202', 5, 'Exceptional attention to detail! The stylist listened carefully and gave me the exact cut I wanted. Very hygienic salon.')
on conflict (booking_id) do nothing;

