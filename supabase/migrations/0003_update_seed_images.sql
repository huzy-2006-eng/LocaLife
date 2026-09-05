-- One-time fix: the original seed used the same 2 placeholder images for
-- every listing. This replaces them with distinct, theme-matched photos
-- (real, freely-licensed Wikimedia Commons images). Safe to run once;
-- re-running is harmless since it just re-sets the same values.

update experiences set image_url = 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/7d/Pol_houses_of_Ahmedabad_1.jpg/500px-Pol_houses_of_Ahmedabad_1.jpg' where title = 'A morning in the old city';
update experiences set image_url = 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d1/Potter_shaping_clay_on_a_traditional_manual_potter%E2%80%99s_wheel_in_India_01.jpg/500px-Potter_shaping_clay_on_a_traditional_manual_potter%E2%80%99s_wheel_in_India_01.jpg' where title = 'Clay, chai & conversation';
update experiences set image_url = 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4d/Night_Street_Food_Stall_Hyderabad.jpg/500px-Night_Street_Food_Stall_Hyderabad.jpg' where title = 'The street food night walk';
update experiences set image_url = 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/34/Sabarmati_riverfront.jpg/500px-Sabarmati_riverfront.jpg' where title = 'Sunrise kayak on the Sabarmati';
update experiences set image_url = 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/cc/Adalaj_Vav_02.jpg/500px-Adalaj_Vav_02.jpg' where title = 'Stepwell secrets: Adalaj by lamplight';
update experiences set image_url = 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c1/Master_artist_carves_a_woodblock_for_textile_printing.jpg/500px-Master_artist_carves_a_woodblock_for_textile_printing.jpg' where title = 'Block-printing with a fourth-generation dyer';
update experiences set image_url = 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/02/DZ6_2632_A_cozy_outdoor_corner_at_night_a_wicker_chair_beside_a_small_table_potted_plants_a_glowing_candle_and_twinkling_string_lights_welcoming_passersby.jpg/500px-DZ6_2632_A_cozy_outdoor_corner_at_night_a_wicker_chair_beside_a_small_table_potted_plants_a_glowing_candle_and_twinkling_string_lights_welcoming_passersby.jpg' where title = 'Rooftop ghazal & chai evening';
update experiences set image_url = 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/36/Joyful_Kite_Flying_at_Shakrain_Festival.jpg/500px-Joyful_Kite_Flying_at_Shakrain_Festival.jpg' where title = 'Kite-flying with the Sarkhej locals';
