-- ==============================================================================
-- RESET TEST DATA (PRE-LAUNCH CLEANUP)
-- ==============================================================================
-- CAUTION: Running this script deletes all operational data (members, logs,
-- payments, attendance).
--
-- Configuration data (membership_plans, pt_packages, gym_settings)
-- will REMAIN INTACT.
-- ==============================================================================

TRUNCATE TABLE public.attendance_logs CASCADE;
TRUNCATE TABLE public.whatsapp_logs CASCADE;
TRUNCATE TABLE public.device_events CASCADE;
TRUNCATE TABLE public.payments CASCADE;
TRUNCATE TABLE public.memberships CASCADE;
TRUNCATE TABLE public.pt_assignments CASCADE;
TRUNCATE TABLE public.members CASCADE;
