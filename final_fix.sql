-- 1. Fix Foreign Key constraint blocking member registration
ALTER TABLE members DROP CONSTRAINT IF EXISTS members_created_by_fkey;

-- 2. Fix Image Upload Bucket
-- Create the correct bucket 'member_photos'
INSERT INTO storage.buckets (id, name, public) 
VALUES ('member_photos', 'member_photos', true)
ON CONFLICT (id) DO NOTHING;

-- 3. Apply Storage Permissions for 'member_photos'
DROP POLICY IF EXISTS "Avatar Public Access" ON storage.objects;
DROP POLICY IF EXISTS "Avatar Upload Access" ON storage.objects;
DROP POLICY IF EXISTS "Avatar Update Access" ON storage.objects;
DROP POLICY IF EXISTS "Avatar Delete Access" ON storage.objects;

CREATE POLICY "Avatar Public Access" ON storage.objects FOR SELECT USING (bucket_id = 'member_photos');
CREATE POLICY "Avatar Upload Access" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'member_photos');
CREATE POLICY "Avatar Update Access" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'member_photos');
CREATE POLICY "Avatar Delete Access" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'member_photos');

