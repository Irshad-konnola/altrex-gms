-- Drop foreign keys linking to the deleted user accounts
ALTER TABLE memberships DROP CONSTRAINT IF EXISTS memberships_created_by_fkey;
ALTER TABLE payments DROP CONSTRAINT IF EXISTS payments_recorded_by_fkey;
ALTER TABLE pt_assignments DROP CONSTRAINT IF EXISTS pt_assignments_created_by_fkey;
ALTER TABLE attendance_logs DROP CONSTRAINT IF EXISTS attendance_logs_recorded_by_fkey;
ALTER TABLE whatsapp_logs DROP CONSTRAINT IF EXISTS whatsapp_logs_sent_by_fkey;

