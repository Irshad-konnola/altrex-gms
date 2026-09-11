-- 1. Clear all test member data and their relations (Cascades to payments, attendance, etc if configured)
TRUNCATE TABLE members CASCADE;

-- 2. If CASCADE is not enabled on your foreign keys, run these individually:
TRUNCATE TABLE attendance_logs;
TRUNCATE TABLE payments;
TRUNCATE TABLE memberships;
TRUNCATE TABLE pt_assignments;
TRUNCATE TABLE device_events;

-- NOTE: This intentionally leaves your membership_plans, pt_packages, and whatsapp_rules untouched!

