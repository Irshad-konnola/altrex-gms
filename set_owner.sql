-- Run this in your Supabase SQL Editor to promote a user to 'owner'
-- Replace 'your_owner_email@example.com' with the actual email of your owner account

UPDATE auth.users 
SET raw_user_meta_data = jsonb_set(
  COALESCE(raw_user_meta_data, '{}'::jsonb), 
  '{role}', 
  '"owner"'
)
WHERE email = 'your_owner_email@example.com';

