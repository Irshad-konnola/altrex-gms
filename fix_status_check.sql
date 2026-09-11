-- Drop status check constraints to prevent 'upcoming' or custom statuses from blocking registration
ALTER TABLE members DROP CONSTRAINT IF EXISTS members_status_check;
ALTER TABLE memberships DROP CONSTRAINT IF EXISTS memberships_status_check;
ALTER TABLE payments DROP CONSTRAINT IF EXISTS payments_status_check;

