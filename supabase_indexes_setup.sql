-- Phase 3: Performance Indexing

-- Indexes for the 'members' table
-- Speeds up searching by phone number (common for check-ins)
CREATE INDEX IF NOT EXISTS idx_members_phone ON members(phone);
-- Speeds up filtering active vs inactive members
CREATE INDEX IF NOT EXISTS idx_members_status ON members(status);
-- Speeds up alphabetical sorting of members
CREATE INDEX IF NOT EXISTS idx_members_name ON members(full_name);

-- Indexes for the 'payments' table
-- Speeds up calculating total revenue for a specific member
CREATE INDEX IF NOT EXISTS idx_payments_member_id ON payments(member_id);
-- Speeds up dashboard revenue charts (filtering by date)
CREATE INDEX IF NOT EXISTS idx_payments_created_at ON payments(created_at);

-- Indexes for the 'attendance_logs' table
-- Speeds up checking if a user already checked in today (cooldown logic)
CREATE INDEX IF NOT EXISTS idx_attendance_member_date ON attendance_logs(member_id, check_in_at);
-- Speeds up dashboard footfall charts (filtering by date)
CREATE INDEX IF NOT EXISTS idx_attendance_check_in_at ON attendance_logs(check_in_at);

-- Indexes for the 'memberships' table
-- Speeds up finding active plans for a member
CREATE INDEX IF NOT EXISTS idx_memberships_member_id ON memberships(member_id);
-- Speeds up dashboard cron jobs checking for expiring plans
CREATE INDEX IF NOT EXISTS idx_memberships_end_date ON memberships(end_date);

-- Indexes for 'pt_assignments'
CREATE INDEX IF NOT EXISTS idx_pt_assignments_member_id ON pt_assignments(member_id);

