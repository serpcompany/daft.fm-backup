-- Additional songs to complete existing albums
-- Generated from MusicBrainz data

-- First, let's remove the duplicate songs that conflict with MusicBrainz IDs
DELETE FROM songs WHERE id IN (
  's1a2b3c4-d5e6-7890-1234-567890abcdef', -- One More Time (old)
  's2b3c4d5-e6f7-8901-2345-678901bcdefg', -- Aerodynamic (old)
  's3c4d5e6-f7g8-9012-3456-789012cdefgh', -- Digital Love (old)
  's6f7g8h9-i0j1-2345-6789-012345fghijk', -- Genesis (old)
  's7g8h9i0-j1k2-3456-7890-123456ghijkl', -- D.A.N.C.E. (old)
  's9i0j1k2-l3m4-5678-9012-345678ijklmn', -- A New Error (old)
  's0j1k2l3-m4n5-6789-0123-456789jklmno'  -- Rusty Nails (old)
);

-- Now insert all the complete album tracks with real MusicBrainz IDs
INSERT INTO songs (id, title, slug, duration, artist_id, album_id, release_date, lyrics, annotations, isrc, wikidata_id, external_ids, created_at, updated_at) VALUES
-- Discovery - Complete 14 tracks
('60fa767a-d85d-4991-82bc-4294e0b11ae7', 'One More Time', 'one-more-time', 320, '056e4f3e-d505-4dad-8ec1-d04f521cbb56', '47b83c38-8a0e-4d93-9a5b-5c52d4b82f7c', null, null, null, null, null, '{}', 1721826000, 1721826000),
('7c0e11a3-1c7a-4e6d-a14d-6e86d86dbaad', 'Aerodynamic', 'aerodynamic', 208, '056e4f3e-d505-4dad-8ec1-d04f521cbb56', '47b83c38-8a0e-4d93-9a5b-5c52d4b82f7c', null, null, null, null, null, '{}', 1721826000, 1721826000),
('15f16efc-8762-4151-95ab-c12d06268640', 'Digital Love', 'digital-love', 298, '056e4f3e-d505-4dad-8ec1-d04f521cbb56', '47b83c38-8a0e-4d93-9a5b-5c52d4b82f7c', null, null, null, null, null, '{}', 1721826000, 1721826000),
('f1a6a40f-78f5-4918-968d-f64363bae94c', 'Harder, Better, Faster, Stronger', 'harder-better-faster-stronger', 224, '056e4f3e-d505-4dad-8ec1-d04f521cbb56', '47b83c38-8a0e-4d93-9a5b-5c52d4b82f7c', null, null, null, null, null, '{}', 1721826000, 1721826000),
('d63ad586-1124-4df1-9a2b-c014d7b7cb02', 'Crescendolls', 'crescendolls', 211, '056e4f3e-d505-4dad-8ec1-d04f521cbb56', '47b83c38-8a0e-4d93-9a5b-5c52d4b82f7c', null, null, null, null, null, '{}', 1721826000, 1721826000),
('712edd8d-b413-4e4e-aca4-9b91fce2e65c', 'Nightvision', 'nightvision', 104, '056e4f3e-d505-4dad-8ec1-d04f521cbb56', '47b83c38-8a0e-4d93-9a5b-5c52d4b82f7c', null, null, null, null, null, '{}', 1721826000, 1721826000),
('8a98614f-0533-44ef-890a-639cab407a2d', 'Superheroes', 'superheroes', 237, '056e4f3e-d505-4dad-8ec1-d04f521cbb56', '47b83c38-8a0e-4d93-9a5b-5c52d4b82f7c', null, null, null, null, null, '{}', 1721826000, 1721826000),
('07b720fc-0d6f-4342-a6df-876d1749de0b', 'High Life', 'high-life', 201, '056e4f3e-d505-4dad-8ec1-d04f521cbb56', '47b83c38-8a0e-4d93-9a5b-5c52d4b82f7c', null, null, null, null, null, '{}', 1721826000, 1721826000),
('defbfcb2-7a5c-4456-be28-b7e5ccf92cc2', 'Something About Us', 'something-about-us', 231, '056e4f3e-d505-4dad-8ec1-d04f521cbb56', '47b83c38-8a0e-4d93-9a5b-5c52d4b82f7c', null, null, null, null, null, '{}', 1721826000, 1721826000),
('e1fe1d12-dac2-4325-ae1b-25e0ef06b998', 'Voyager', 'voyager', 227, '056e4f3e-d505-4dad-8ec1-d04f521cbb56', '47b83c38-8a0e-4d93-9a5b-5c52d4b82f7c', null, null, null, null, null, '{}', 1721826000, 1721826000),
('2a220770-1150-4190-b0e0-57d89a0a7469', 'Veridis Quo', 'veridis-quo', 344, '056e4f3e-d505-4dad-8ec1-d04f521cbb56', '47b83c38-8a0e-4d93-9a5b-5c52d4b82f7c', null, null, null, null, null, '{}', 1721826000, 1721826000),
('3f60ae01-43cc-4db9-86ec-97b79f83764f', 'Short Circuit', 'short-circuit', 206, '056e4f3e-d505-4dad-8ec1-d04f521cbb56', '47b83c38-8a0e-4d93-9a5b-5c52d4b82f7c', null, null, null, null, null, '{}', 1721826000, 1721826000),
('59038571-03ea-4ca4-965c-a57eae2aa138', 'Face to Face', 'face-to-face', 240, '056e4f3e-d505-4dad-8ec1-d04f521cbb56', '47b83c38-8a0e-4d93-9a5b-5c52d4b82f7c', null, null, null, null, null, '{}', 1721826000, 1721826000),
('1a915a2d-e2f4-4300-a230-96fc9c8a7b60', 'Too Long', 'too-long', 600, '056e4f3e-d505-4dad-8ec1-d04f521cbb56', '47b83c38-8a0e-4d93-9a5b-5c52d4b82f7c', null, null, null, null, null, '{}', 1721826000, 1721826000),

-- Justice - † (Cross) - Complete 12 tracks
('a405352d-6f33-482c-a1be-0b5b2c966b63', 'Genesis', 'genesis', 234, 'f54ba20c-aa3b-443e-a97e-6bee0329b0dd', 'b2c3d4e5-f6g7-8901-2345-678901bcdefg', null, null, null, null, null, '{}', 1721826000, 1721826000),
('5e10ccfe-eb20-4c51-95cb-b5edc143556e', 'Let There Be Light', 'let-there-be-light', 295, 'f54ba20c-aa3b-443e-a97e-6bee0329b0dd', 'b2c3d4e5-f6g7-8901-2345-678901bcdefg', null, null, null, null, null, '{}', 1721826000, 1721826000),
('d18a1284-d6a1-42d9-b0c1-b247e9f27b80', 'D.A.N.C.E.', 'dance', 242, 'f54ba20c-aa3b-443e-a97e-6bee0329b0dd', 'b2c3d4e5-f6g7-8901-2345-678901bcdefg', null, null, null, null, null, '{}', 1721826000, 1721826000),
('b63614d4-cea7-4cb3-85e6-047a1e60735f', 'Newjack', 'newjack', 216, 'f54ba20c-aa3b-443e-a97e-6bee0329b0dd', 'b2c3d4e5-f6g7-8901-2345-678901bcdefg', null, null, null, null, null, '{}', 1721826000, 1721826000),
('e0bc2ebe-3ee2-4ee1-8bcb-9e95c0547b1f', 'Phantom', 'phantom', 262, 'f54ba20c-aa3b-443e-a97e-6bee0329b0dd', 'b2c3d4e5-f6g7-8901-2345-678901bcdefg', null, null, null, null, null, '{}', 1721826000, 1721826000),
('8da1caed-9b21-49a7-a95f-f328f26e66de', 'Phantom, Pt II', 'phantom-pt-ii', 200, 'f54ba20c-aa3b-443e-a97e-6bee0329b0dd', 'b2c3d4e5-f6g7-8901-2345-678901bcdefg', null, null, null, null, null, '{}', 1721826000, 1721826000),
('6ad051b4-6d12-4545-9f4f-54fa36e04fa4', 'Valentine', 'valentine', 176, 'f54ba20c-aa3b-443e-a97e-6bee0329b0dd', 'b2c3d4e5-f6g7-8901-2345-678901bcdefg', null, null, null, null, null, '{}', 1721826000, 1721826000),
('88d1915a-5a30-48d3-9b4f-da0ccb21b790', 'Tthhee Ppaarrttyy', 'tthhee-ppaarrttyy', 243, 'f54ba20c-aa3b-443e-a97e-6bee0329b0dd', 'b2c3d4e5-f6g7-8901-2345-678901bcdefg', null, null, null, null, null, '{}', 1721826000, 1721826000),
('c19a4565-62ca-4926-b91c-e650612b963b', 'DVNO', 'dvno', 236, 'f54ba20c-aa3b-443e-a97e-6bee0329b0dd', 'b2c3d4e5-f6g7-8901-2345-678901bcdefg', null, null, null, null, null, '{}', 1721826000, 1721826000),
('6662c57d-240c-471a-b360-fcba24b03142', 'Stress', 'stress', 298, 'f54ba20c-aa3b-443e-a97e-6bee0329b0dd', 'b2c3d4e5-f6g7-8901-2345-678901bcdefg', null, null, null, null, null, '{}', 1721826000, 1721826000),
('358f0172-3efe-4b09-84aa-7c0b060c9941', 'Waters of Nazareth', 'waters-of-nazareth', 265, 'f54ba20c-aa3b-443e-a97e-6bee0329b0dd', 'b2c3d4e5-f6g7-8901-2345-678901bcdefg', null, null, null, null, null, '{}', 1721826000, 1721826000),
('a359ce7b-39b0-493a-8aee-0e1cb60ac0ec', 'One Minute to Midnight', 'one-minute-to-midnight', 220, 'f54ba20c-aa3b-443e-a97e-6bee0329b0dd', 'b2c3d4e5-f6g7-8901-2345-678901bcdefg', null, null, null, null, null, '{}', 1721826000, 1721826000),

-- Justice - Woman - Complete 10 tracks (excluding duplicate "Fire")
('ee32d5e1-89c7-4cb2-84de-bbde2538084a', 'Safe and Sound', 'safe-and-sound', 345, 'f54ba20c-aa3b-443e-a97e-6bee0329b0dd', 'c3d4e5f6-g7h8-9012-3456-789012cdefgh', null, null, null, null, null, '{}', 1721826000, 1721826000),
('bc79d781-1dd8-4719-8db4-2f99da00854b', 'Pleasure', 'pleasure', 255, 'f54ba20c-aa3b-443e-a97e-6bee0329b0dd', 'c3d4e5f6-g7h8-9012-3456-789012cdefgh', null, null, null, null, null, '{}', 1721826000, 1721826000),
('d95cfb7d-5edf-4c8c-91bc-60c700137e5c', 'Alakazam !', 'alakazam', 311, 'f54ba20c-aa3b-443e-a97e-6bee0329b0dd', 'c3d4e5f6-g7h8-9012-3456-789012cdefgh', null, null, null, null, null, '{}', 1721826000, 1721826000),
('5f76e10d-f4d1-4638-b387-da96a9290d7f', 'Fire', 'fire', 334, 'f54ba20c-aa3b-443e-a97e-6bee0329b0dd', 'c3d4e5f6-g7h8-9012-3456-789012cdefgh', null, null, null, null, null, '{}', 1721826000, 1721826000),
('727d170a-7c6a-4aec-b280-a516089a7c19', 'Stop', 'stop', 297, 'f54ba20c-aa3b-443e-a97e-6bee0329b0dd', 'c3d4e5f6-g7h8-9012-3456-789012cdefgh', null, null, null, null, null, '{}', 1721826000, 1721826000),
('298b0a39-3e63-4890-b5fc-d4334eccf4e7', 'Chorus', 'chorus', 429, 'f54ba20c-aa3b-443e-a97e-6bee0329b0dd', 'c3d4e5f6-g7h8-9012-3456-789012cdefgh', null, null, null, null, null, '{}', 1721826000, 1721826000),
('f68c9fa8-fd59-412c-8bcb-2d5ffe8bf6d5', 'Randy', 'randy', 398, 'f54ba20c-aa3b-443e-a97e-6bee0329b0dd', 'c3d4e5f6-g7h8-9012-3456-789012cdefgh', null, null, null, null, null, '{}', 1721826000, 1721826000),
('04c8e31f-9a80-4468-b925-27b9d9cf94f5', 'Heavy Metal', 'heavy-metal', 270, 'f54ba20c-aa3b-443e-a97e-6bee0329b0dd', 'c3d4e5f6-g7h8-9012-3456-789012cdefgh', null, null, null, null, null, '{}', 1721826000, 1721826000),
('26729ea2-26a4-4df6-99a2-89f33616eefe', 'Love S.O.S.', 'love-sos', 303, 'f54ba20c-aa3b-443e-a97e-6bee0329b0dd', 'c3d4e5f6-g7h8-9012-3456-789012cdefgh', null, null, null, null, null, '{}', 1721826000, 1721826000),
('2b3507cb-8c60-44e4-a764-14895c3db59c', 'Close Call', 'close-call', 308, 'f54ba20c-aa3b-443e-a97e-6bee0329b0dd', 'c3d4e5f6-g7h8-9012-3456-789012cdefgh', null, null, null, null, null, '{}', 1721826000, 1721826000),

-- Moderat - Moderat - Complete 11 tracks
('5d2ce680-b68e-4528-abde-5122ff045003', 'A New Error', 'a-new-error', 354, '6f70bfbe-f3b3-4985-8074-d3a67aad0e8b', 'd4e5f6g7-h8i9-0123-4567-890123defghi', null, null, null, null, null, '{}', 1721826000, 1721826000),
('141710cb-b939-43fa-bf36-f303f210607d', 'Rusty Nails', 'rusty-nails', 272, '6f70bfbe-f3b3-4985-8074-d3a67aad0e8b', 'd4e5f6g7-h8i9-0123-4567-890123defghi', null, null, null, null, null, '{}', 1721826000, 1721826000),
('e43390bf-5c04-48d8-bdcb-59c8f759102a', 'Seamonkey', 'seamonkey', 369, '6f70bfbe-f3b3-4985-8074-d3a67aad0e8b', 'd4e5f6g7-h8i9-0123-4567-890123defghi', null, null, null, null, null, '{}', 1721826000, 1721826000),
('9bf8c284-f5d8-4ed6-8309-c8c7a4aa2e5c', 'Slow Match', 'slow-match', 308, '6f70bfbe-f3b3-4985-8074-d3a67aad0e8b', 'd4e5f6g7-h8i9-0123-4567-890123defghi', null, null, null, null, null, '{}', 1721826000, 1721826000),
('9748b746-ee1a-4b5f-a1d3-101da29c64a2', '3 Minutes Of', '3-minutes-of', 192, '6f70bfbe-f3b3-4985-8074-d3a67aad0e8b', 'd4e5f6g7-h8i9-0123-4567-890123defghi', null, null, null, null, null, '{}', 1721826000, 1721826000),
('34fac68c-c5f2-4181-985a-2bb71cf9f7b8', 'Nasty Silence', 'nasty-silence', 187, '6f70bfbe-f3b3-4985-8074-d3a67aad0e8b', 'd4e5f6g7-h8i9-0123-4567-890123defghi', null, null, null, null, null, '{}', 1721826000, 1721826000),
('d5c3a4f3-01da-4d05-b8c7-da320e58d769', 'Sick With It', 'sick-with-it', 225, '6f70bfbe-f3b3-4985-8074-d3a67aad0e8b', 'd4e5f6g7-h8i9-0123-4567-890123defghi', null, null, null, null, null, '{}', 1721826000, 1721826000),
('50f8e2b1-56ff-4474-8e34-8930217c6483', 'Porc#1', 'porc1', 160, '6f70bfbe-f3b3-4985-8074-d3a67aad0e8b', 'd4e5f6g7-h8i9-0123-4567-890123defghi', null, null, null, null, null, '{}', 1721826000, 1721826000),
('4096a514-33e7-431b-a0ff-dc16740e188d', 'Porc#2', 'porc2', 180, '6f70bfbe-f3b3-4985-8074-d3a67aad0e8b', 'd4e5f6g7-h8i9-0123-4567-890123defghi', null, null, null, null, null, '{}', 1721826000, 1721826000),
('da93dc1c-b9f3-49df-a354-4379a82a72cb', 'Nr.22', 'nr22', 340, '6f70bfbe-f3b3-4985-8074-d3a67aad0e8b', 'd4e5f6g7-h8i9-0123-4567-890123defghi', null, null, null, null, null, '{}', 1721826000, 1721826000),
('703a16c6-cbd5-4199-b7d4-31a2df456e8d', 'Out of Sight', 'out-of-sight', 307, '6f70bfbe-f3b3-4985-8074-d3a67aad0e8b', 'd4e5f6g7-h8i9-0123-4567-890123defghi', null, null, null, null, null, '{}', 1721826000, 1721826000);