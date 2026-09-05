-- The seeded photos were served as 500px-wide Wikimedia thumbnails, which
-- is fine for the small grid cards but visibly blurs when stretched into
-- the larger experience-detail view. Bump every seeded image to a 1280px
-- thumbnail of the same file (verified to exist for all of them) so it
-- stays crisp at both sizes -- browsers downscale cleanly, they just
-- can't upscale without blurring.

update experiences
set image_url = replace(image_url, '/500px-', '/1280px-')
where image_url like 'https://upload.wikimedia.org/%/500px-%';
