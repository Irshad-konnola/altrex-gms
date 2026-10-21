-- ==============================================================================
-- PROMOTE USER TO OWNER ROLE
-- ==============================================================================
-- Run this in your Supabase SQL Editor to grant 'owner' permissions to an account.
-- Replace 'your_owner_email@example.com' with the actual login email of the user.

UPDATE auth.users 
SET raw_user_meta_data = jsonb_set(
  COALESCE(raw_user_meta_data, '{}'::jsonb), 
  '{role}', 
  '"owner"'
)
WHERE email = 'your_owner_email@example.com';
