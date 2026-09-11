-- 1. Fix Members RLS
DROP POLICY IF EXISTS "Allow authenticated full access on members" ON members;
DROP POLICY IF EXISTS "Allow authenticated read access" ON members;
DROP POLICY IF EXISTS "Allow authenticated insert access" ON members;
DROP POLICY IF EXISTS "Allow authenticated update access" ON members;

CREATE POLICY "Allow authenticated full access on members" 
ON members FOR ALL TO authenticated 
USING (true) WITH CHECK (true);

-- 2. Create Storage Bucket (if missing)
INSERT INTO storage.buckets (id, name, public) 
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public) 
VALUES ('member-avatars', 'member-avatars', true)
ON CONFLICT (id) DO NOTHING;

-- 3. Fix Storage RLS
-- (Avatars bucket)
DROP POLICY IF EXISTS "Avatar Public Access" ON storage.objects;
DROP POLICY IF EXISTS "Avatar Upload Access" ON storage.objects;
DROP POLICY IF EXISTS "Avatar Update Access" ON storage.objects;
DROP POLICY IF EXISTS "Avatar Delete Access" ON storage.objects;

CREATE POLICY "Avatar Public Access" ON storage.objects FOR SELECT USING (bucket_id IN ('avatars', 'member-avatars'));
CREATE POLICY "Avatar Upload Access" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id IN ('avatars', 'member-avatars'));
CREATE POLICY "Avatar Update Access" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id IN ('avatars', 'member-avatars'));
CREATE POLICY "Avatar Delete Access" ON storage.objects FOR DELETE TO authenticated USING (bucket_id IN ('avatars', 'member-avatars'));

