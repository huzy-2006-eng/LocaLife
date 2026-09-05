-- Demo data for PS6 Local & Experiences.
-- Run AFTER 0001_init.sql and 0002_scoring_function.sql.
--
-- This creates 4 demo host accounts directly in auth.users so the seeded
-- listings have a real, RLS-compatible owner. This touches Supabase's
-- internal auth schema (auth.users + auth.identities), which is the
-- standard pattern for seed scripts but can occasionally drift between
-- Supabase Postgres versions. If this block errors for you, skip it and
-- instead: sign up 1-2 hosts through the app UI, then rerun just the
-- "experiences" inserts below with host_id set to their real user id
-- (find it in Authentication > Users in the dashboard).

do $$
declare
  v_instance_id uuid;
  v_asha_id uuid := gen_random_uuid();
  v_ramesh_id uuid := gen_random_uuid();
  v_nirali_id uuid := gen_random_uuid();
  v_kabir_id uuid := gen_random_uuid();
begin
  select coalesce((select instance_id from auth.users limit 1), '00000000-0000-0000-0000-000000000000')
    into v_instance_id;

  insert into auth.users (
    instance_id, id, aud, role, email, encrypted_password,
    email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
    created_at, updated_at, confirmation_token, email_change,
    email_change_token_new, recovery_token
  ) values
    (v_instance_id, v_asha_id, 'authenticated', 'authenticated', 'asha.demo@local-experiences.test', crypt('demo-password-only', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{}', now(), now(), '', '', '', ''),
    (v_instance_id, v_ramesh_id, 'authenticated', 'authenticated', 'ramesh.demo@local-experiences.test', crypt('demo-password-only', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{}', now(), now(), '', '', '', ''),
    (v_instance_id, v_nirali_id, 'authenticated', 'authenticated', 'nirali.demo@local-experiences.test', crypt('demo-password-only', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{}', now(), now(), '', '', '', ''),
    (v_instance_id, v_kabir_id, 'authenticated', 'authenticated', 'kabir.demo@local-experiences.test', crypt('demo-password-only', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{}', now(), now(), '', '', '', '');

  insert into auth.identities (id, provider_id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
  values
    (gen_random_uuid(), v_asha_id::text, v_asha_id, jsonb_build_object('sub', v_asha_id::text, 'email', 'asha.demo@local-experiences.test'), 'email', now(), now(), now()),
    (gen_random_uuid(), v_ramesh_id::text, v_ramesh_id, jsonb_build_object('sub', v_ramesh_id::text, 'email', 'ramesh.demo@local-experiences.test'), 'email', now(), now(), now()),
    (gen_random_uuid(), v_nirali_id::text, v_nirali_id, jsonb_build_object('sub', v_nirali_id::text, 'email', 'nirali.demo@local-experiences.test'), 'email', now(), now(), now()),
    (gen_random_uuid(), v_kabir_id::text, v_kabir_id, jsonb_build_object('sub', v_kabir_id::text, 'email', 'kabir.demo@local-experiences.test'), 'email', now(), now(), now());

  insert into profiles (id, name, role, city) values
    (v_asha_id, 'Asha Mehta', 'host', 'Ahmedabad'),
    (v_ramesh_id, 'Ramesh Patel', 'host', 'Ahmedabad'),
    (v_nirali_id, 'Nirali Shah', 'host', 'Ahmedabad'),
    (v_kabir_id, 'Kabir Solanki', 'host', 'Ahmedabad');

  insert into host_profiles (user_id, business_name) values
    (v_asha_id, 'Old City Walking Tours'),
    (v_ramesh_id, 'Gota Pottery Studio'),
    (v_nirali_id, 'Manek Chowk Food Walks'),
    (v_kabir_id, 'Sabarmati Riverside Kayaking');

  insert into experiences (host_id, title, description, tags, price, capacity, location_name, lat, lng, time_slots, duration_label, image_url, review_count, rating) values
    (v_asha_id, 'A morning in the old city', 'Walk the lanes, meet the makers, and share a home-cooked breakfast in a part of Ahmedabad most visitors miss.', array['culture','food'], 1200, 6, 'Shahpur, Ahmedabad', 23.0335, 72.5850, array['morning'], '3 hours', 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/7d/Pol_houses_of_Ahmedabad_1.jpg/500px-Pol_houses_of_Ahmedabad_1.jpg', 18, 4.9),
    (v_ramesh_id, 'Clay, chai & conversation', 'Get your hands dirty in a tiny neighborhood pottery studio, then stay for a cup of spiced chai with your host.', array['workshops','culture'], 850, 8, 'Gota, Ahmedabad', 23.1050, 72.5350, array['afternoon','evening'], '2 hours', 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d1/Potter_shaping_clay_on_a_traditional_manual_potter%E2%80%99s_wheel_in_India_01.jpg/500px-Potter_shaping_clay_on_a_traditional_manual_potter%E2%80%99s_wheel_in_India_01.jpg', 22, 4.8),
    (v_nirali_id, 'The street food night walk', 'Follow a local appetite through sizzling stalls, secret snacks, and the stories behind the city''s most loved flavors.', array['food','nightlife'], 650, 10, 'Manek Chowk, Ahmedabad', 23.0258, 72.5873, array['evening','night'], '2.5 hours', 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4d/Night_Street_Food_Stall_Hyderabad.jpg/500px-Night_Street_Food_Stall_Hyderabad.jpg', 41, 4.9),
    (v_kabir_id, 'Sunrise kayak on the Sabarmati', 'Paddle the riverfront before the city wakes up, with a local guide who knows every quiet bend.', array['outdoors','nature'], 950, 4, 'Sabarmati Riverfront, Ahmedabad', 23.0395, 72.5660, array['morning'], '1.5 hours', 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/34/Sabarmati_riverfront.jpg/500px-Sabarmati_riverfront.jpg', 9, 4.7),
    (v_asha_id, 'Stepwell secrets: Adalaj by lamplight', 'A quiet evening tour of a 15th-century stepwell most tour buses skip entirely.', array['culture','art'], 700, 8, 'Adalaj, Ahmedabad', 23.1652, 72.5797, array['evening'], '2 hours', 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/cc/Adalaj_Vav_02.jpg/500px-Adalaj_Vav_02.jpg', 6, 4.8),
    (v_ramesh_id, 'Block-printing with a fourth-generation dyer', 'Learn traditional Ajrakh block printing in a family workshop that has run for a hundred years.', array['workshops','art'], 1100, 6, 'Jamalpur, Ahmedabad', 23.0180, 72.5780, array['afternoon'], '2.5 hours', 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c1/Master_artist_carves_a_woodblock_for_textile_printing.jpg/500px-Master_artist_carves_a_woodblock_for_textile_printing.jpg', 14, 4.9),
    (v_nirali_id, 'Rooftop ghazal & chai evening', 'Live acoustic ghazal music on a heritage rooftop, paired with unlimited masala chai.', array['culture','nightlife'], 500, 20, 'Khadia, Ahmedabad', 23.0225, 72.5920, array['evening','night'], '2 hours', 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/02/DZ6_2632_A_cozy_outdoor_corner_at_night_a_wicker_chair_beside_a_small_table_potted_plants_a_glowing_candle_and_twinkling_string_lights_welcoming_passersby.jpg/500px-DZ6_2632_A_cozy_outdoor_corner_at_night_a_wicker_chair_beside_a_small_table_potted_plants_a_glowing_candle_and_twinkling_string_lights_welcoming_passersby.jpg', 63, 4.6),
    (v_kabir_id, 'Kite-flying with the Sarkhej locals', 'Join a neighborhood rooftop kite session and learn the manja tricks the pros use during Uttarayan season.', array['outdoors','culture'], 400, 12, 'Sarkhej, Ahmedabad', 22.9800, 72.5000, array['afternoon'], '2 hours', 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/36/Joyful_Kite_Flying_at_Shakrain_Festival.jpg/500px-Joyful_Kite_Flying_at_Shakrain_Festival.jpg', 11, 4.5);
end $$;
