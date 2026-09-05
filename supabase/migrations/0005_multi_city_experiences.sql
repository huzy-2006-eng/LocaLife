-- 8 new experiences spread across different Indian cities (not just
-- Ahmedabad), each with its own local host and a real, theme-matched photo.

do $$
declare
  v_instance_id uuid;
  v_devika_id uuid := gen_random_uuid();   -- Jaipur
  v_vikram_id uuid := gen_random_uuid();   -- Udaipur
  v_maria_id uuid := gen_random_uuid();    -- Goa
  v_rustom_id uuid := gen_random_uuid();   -- Mumbai
  v_salma_id uuid := gen_random_uuid();    -- Delhi
  v_ganesh_id uuid := gen_random_uuid();   -- Varanasi
  v_thomas_id uuid := gen_random_uuid();   -- Alleppey, Kerala
  v_ananya_id uuid := gen_random_uuid();   -- Rishikesh
begin
  select coalesce((select instance_id from auth.users limit 1), '00000000-0000-0000-0000-000000000000')
    into v_instance_id;

  insert into auth.users (
    instance_id, id, aud, role, email, encrypted_password,
    email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
    created_at, updated_at, confirmation_token, email_change,
    email_change_token_new, recovery_token
  ) values
    (v_instance_id, v_devika_id, 'authenticated', 'authenticated', 'devika.demo@local-experiences.test', crypt('demo-password-only', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{}', now(), now(), '', '', '', ''),
    (v_instance_id, v_vikram_id, 'authenticated', 'authenticated', 'vikram.demo@local-experiences.test', crypt('demo-password-only', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{}', now(), now(), '', '', '', ''),
    (v_instance_id, v_maria_id, 'authenticated', 'authenticated', 'maria.demo@local-experiences.test', crypt('demo-password-only', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{}', now(), now(), '', '', '', ''),
    (v_instance_id, v_rustom_id, 'authenticated', 'authenticated', 'rustom.demo@local-experiences.test', crypt('demo-password-only', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{}', now(), now(), '', '', '', ''),
    (v_instance_id, v_salma_id, 'authenticated', 'authenticated', 'salma.demo@local-experiences.test', crypt('demo-password-only', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{}', now(), now(), '', '', '', ''),
    (v_instance_id, v_ganesh_id, 'authenticated', 'authenticated', 'ganesh.demo@local-experiences.test', crypt('demo-password-only', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{}', now(), now(), '', '', '', ''),
    (v_instance_id, v_thomas_id, 'authenticated', 'authenticated', 'thomas.demo@local-experiences.test', crypt('demo-password-only', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{}', now(), now(), '', '', '', ''),
    (v_instance_id, v_ananya_id, 'authenticated', 'authenticated', 'ananya.demo@local-experiences.test', crypt('demo-password-only', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{}', now(), now(), '', '', '', '');

  insert into auth.identities (id, provider_id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
  values
    (gen_random_uuid(), v_devika_id::text, v_devika_id, jsonb_build_object('sub', v_devika_id::text, 'email', 'devika.demo@local-experiences.test'), 'email', now(), now(), now()),
    (gen_random_uuid(), v_vikram_id::text, v_vikram_id, jsonb_build_object('sub', v_vikram_id::text, 'email', 'vikram.demo@local-experiences.test'), 'email', now(), now(), now()),
    (gen_random_uuid(), v_maria_id::text, v_maria_id, jsonb_build_object('sub', v_maria_id::text, 'email', 'maria.demo@local-experiences.test'), 'email', now(), now(), now()),
    (gen_random_uuid(), v_rustom_id::text, v_rustom_id, jsonb_build_object('sub', v_rustom_id::text, 'email', 'rustom.demo@local-experiences.test'), 'email', now(), now(), now()),
    (gen_random_uuid(), v_salma_id::text, v_salma_id, jsonb_build_object('sub', v_salma_id::text, 'email', 'salma.demo@local-experiences.test'), 'email', now(), now(), now()),
    (gen_random_uuid(), v_ganesh_id::text, v_ganesh_id, jsonb_build_object('sub', v_ganesh_id::text, 'email', 'ganesh.demo@local-experiences.test'), 'email', now(), now(), now()),
    (gen_random_uuid(), v_thomas_id::text, v_thomas_id, jsonb_build_object('sub', v_thomas_id::text, 'email', 'thomas.demo@local-experiences.test'), 'email', now(), now(), now()),
    (gen_random_uuid(), v_ananya_id::text, v_ananya_id, jsonb_build_object('sub', v_ananya_id::text, 'email', 'ananya.demo@local-experiences.test'), 'email', now(), now(), now());

  insert into profiles (id, name, role, city) values
    (v_devika_id, 'Devika Rathore', 'host', 'Jaipur'),
    (v_vikram_id, 'Vikram Singh Chundawat', 'host', 'Udaipur'),
    (v_maria_id, 'Maria D''Souza', 'host', 'Goa'),
    (v_rustom_id, 'Rustom Wadia', 'host', 'Mumbai'),
    (v_salma_id, 'Salma Khan', 'host', 'Delhi'),
    (v_ganesh_id, 'Ganesh Chaturvedi', 'host', 'Varanasi'),
    (v_thomas_id, 'Thomas Kutty', 'host', 'Alleppey'),
    (v_ananya_id, 'Ananya Bisht', 'host', 'Rishikesh');

  insert into host_profiles (user_id, business_name) values
    (v_devika_id, 'Sanganer Blue Pottery Studio'),
    (v_vikram_id, 'Pichola Boatmen''s Collective'),
    (v_maria_id, 'Ponda Spice Trails'),
    (v_rustom_id, 'Girgaon Food Walks'),
    (v_salma_id, 'Nizamuddin Sufi Circle'),
    (v_ganesh_id, 'Dashashwamedh Boat Tours'),
    (v_thomas_id, 'Alleppey Backwater Homestays'),
    (v_ananya_id, 'Parmarth Ganga Yoga');

  insert into experiences (host_id, title, description, tags, price, capacity, location_name, lat, lng, time_slots, duration_label, image_url, review_count, rating) values
    (v_devika_id, 'Paint your own blue pottery', 'Sit at a potter''s bench in a family-run Sanganer studio and hand-paint a piece of Jaipur''s famous cobalt-blue pottery to take home.', array['workshops','art'], 750, 6, 'Sanganer, Jaipur', 26.8206, 75.7996, array['morning','afternoon'], '2 hours', 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/72/Blue_Pottery_Jaipur_Collection.jpg/500px-Blue_Pottery_Jaipur_Collection.jpg', 16, 4.8),
    (v_vikram_id, 'Sunset row across Lake Pichola', 'A quiet, oar-powered crossing of Udaipur''s lake as the City Palace turns gold, with a boatman whose family has rowed this water for generations.', array['outdoors','culture'], 600, 4, 'Lake Pichola, Udaipur', 24.5764, 73.6835, array['evening'], '1 hour', 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c9/Lake_Pichola_Udaipur.jpg/500px-Lake_Pichola_Udaipur.jpg', 21, 4.9),
    (v_maria_id, 'A spice farm breakfast in the hills', 'Walk through cardamom, pepper, and areca groves in the Western Ghats foothills, ending with a home-cooked Goan Saraswat breakfast under the trees.', array['nature','food'], 850, 10, 'Ponda, Goa', 15.4027, 74.0078, array['morning'], '3 hours', 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f3/Spice_Plantation_in_Goa.JPG/500px-Spice_Plantation_in_Goa.JPG', 29, 4.7),
    (v_rustom_id, 'The real vada pav trail', 'Three generations of Girgaon''s best vada pav stalls, in the order the locals actually eat them, with the stories behind each family recipe.', array['food','culture'], 300, 8, 'Girgaon, Mumbai', 18.9547, 72.8156, array['afternoon','evening'], '2 hours', 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5f/Aran_Vada_Pav_Mumbai.jpg/500px-Aran_Vada_Pav_Mumbai.jpg', 45, 4.8),
    (v_salma_id, 'Thursday night qawwali at Nizamuddin', 'Sit shoulder to shoulder with regulars at the dargah''s weekly Sufi devotional singing, a living tradition eight centuries old, explained quietly beforehand by a local guide.', array['nightlife','culture'], 400, 12, 'Nizamuddin, Delhi', 28.5895, 77.2431, array['night'], '2 hours', 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4a/Qawwali_hazrat_nizamuddin_delhi.jpg/500px-Qawwali_hazrat_nizamuddin_delhi.jpg', 38, 4.9),
    (v_ganesh_id, 'Dawn boat ride on the Ganges', 'Glide past the ghats as the city wakes and the first aarti lamps are lit, with a boatman who has rowed these waters since childhood.', array['culture','nature'], 500, 6, 'Dashashwamedh Ghat, Varanasi', 25.3070, 83.0104, array['morning'], '1.5 hours', 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/06/Varanasi_ghats_seen_from_a_boat_on_the_Ganges_river_in_October_2014.jpg/500px-Varanasi_ghats_seen_from_a_boat_on_the_Ganges_river_in_October_2014.jpg', 52, 4.9),
    (v_thomas_id, 'A day on an Alleppey houseboat', 'Drift through the backwaters on a traditional kettuvallam, watching village life along the banks, with a home-cooked Kerala lunch served on board.', array['nature','food'], 2200, 6, 'Alleppey, Kerala', 9.4981, 76.3388, array['morning','afternoon'], '5 hours', 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/67/Houseboat_on_Alleppey_backwaters_%28Kerala%2C_India_2023%29_%2852703799562%29.jpg/500px-Houseboat_on_Alleppey_backwaters_%28Kerala%2C_India_2023%29_%2852703799562%29.jpg', 33, 4.8),
    (v_ananya_id, 'Sunrise yoga on the Ganges', 'A quiet hour of yoga and breathwork on a riverside ghat as the sun comes up over the Himalayan foothills, taught by a Rishikesh-trained instructor.', array['workshops','nature'], 450, 15, 'Parmarth Niketan, Rishikesh', 30.1290, 78.2946, array['morning'], '1 hour', 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/38/River_ghat_%28of_River_Ganges%29_at_the_Parmarth_Niketan%2C_in_Rishikesh%2C_Uttarakhand.jpg/500px-River_ghat_%28of_River_Ganges%29_at_the_Parmarth_Niketan%2C_in_Rishikesh%2C_Uttarakhand.jpg', 24, 4.9);
end $$;
