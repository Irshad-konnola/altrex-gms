-- 1. Fix Members RLS (Ensures you can insert new members)
DROP POLICY IF EXISTS "Allow authenticated full access on members" ON members;
CREATE POLICY "Allow authenticated full access on members" ON members FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 2. Fix Storage Bucket (Image Uploads)
-- Create the bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public) 
VALUES ('member-avatars', 'member-avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Allow public read access to avatars
CREATE POLICY "Avatar Public Access" ON storage.objects FOR SELECT USING (bucket_id = 'member-avatars');

-- Allow authenticated users (staff) to upload and delete images
CREATE POLICY "Avatar Upload Access" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'member-avatars');
CREATE POLICY "Avatar Update Access" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'member-avatars');
CREATE POLICY "Avatar Delete Access" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'member-avatars');

