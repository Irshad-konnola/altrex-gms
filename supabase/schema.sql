-- ==============================================================================
-- ALTREX GMS (Gym Management System) - COMPLETE SUPABASE DATABASE SCHEMA
-- ==============================================================================
-- This script sets up the full database schema, foreign keys, indexes,
-- Row Level Security (RLS) policies, and storage bucket configuration.
-- Execute this script in your Supabase SQL Editor.
-- ==============================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. TABLES

-- Members Table
CREATE TABLE IF NOT EXISTS public.members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    full_name TEXT NOT NULL,
    phone TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'active', -- active, expiring, expired, inactive, archived
    gender TEXT,
    date_of_birth DATE,
    emergency_contact TEXT,
    height_cm NUMERIC,
    weight_kg NUMERIC,
    blood_group TEXT,
    medical_notes TEXT,
    address TEXT,
    photo_url TEXT,
    device_user_id TEXT UNIQUE,
    split_timing TEXT, -- 'morning' or 'evening'
    is_pt_member BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Membership Plans Table
CREATE TABLE IF NOT EXISTS public.membership_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    duration_days INTEGER NOT NULL,
    price NUMERIC NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Memberships (Subscribed Plans) Table
CREATE TABLE IF NOT EXISTS public.memberships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    member_id UUID NOT NULL REFERENCES public.members(id) ON DELETE CASCADE,
    plan_id UUID NOT NULL REFERENCES public.membership_plans(id),
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    status TEXT NOT NULL DEFAULT 'active',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Payments Table
CREATE TABLE IF NOT EXISTS public.payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    member_id UUID NOT NULL REFERENCES public.members(id) ON DELETE CASCADE,
    amount NUMERIC NOT NULL,
    method TEXT NOT NULL DEFAULT 'cash', -- 'cash', 'upi', 'card', 'razorpay'
    status TEXT NOT NULL DEFAULT 'paid', -- 'paid', 'pending', 'failed', 'refunded'
    description TEXT,
    utr_reference TEXT,
    razorpay_order_id TEXT,
    razorpay_payment_id TEXT,
    payment_date DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Personal Training (PT) Packages Table
CREATE TABLE IF NOT EXISTS public.pt_packages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    sessions_count INTEGER NOT NULL,
    price NUMERIC NOT NULL,
    validity_days INTEGER NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Personal Training Assignments Table
CREATE TABLE IF NOT EXISTS public.pt_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    member_id UUID NOT NULL REFERENCES public.members(id) ON DELETE CASCADE,
    package_id UUID NOT NULL REFERENCES public.pt_packages(id),
    trainer_name TEXT NOT NULL,
    sessions_total INTEGER NOT NULL,
    sessions_remaining INTEGER NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    status TEXT NOT NULL DEFAULT 'active', -- 'active', 'completed', 'expired'
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Attendance Logs Table
CREATE TABLE IF NOT EXISTS public.attendance_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    member_id UUID NOT NULL REFERENCES public.members(id) ON DELETE CASCADE,
    check_in_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    method TEXT NOT NULL DEFAULT 'MANUAL', -- 'FACE', 'MANUAL', 'CARD'
    device_raw JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- WhatsApp Notification Logs Table
CREATE TABLE IF NOT EXISTS public.whatsapp_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    member_id UUID REFERENCES public.members(id) ON DELETE SET NULL,
    phone TEXT NOT NULL,
    template_name TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'sent', -- 'sent', 'failed', 'delivered'
    response JSONB,
    sent_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Hardware / Biometric Device Raw Events Table
CREATE TABLE IF NOT EXISTS public.device_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    device_id TEXT,
    raw_payload JSONB NOT NULL,
    status TEXT DEFAULT 'processed',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Gym Settings Table (Key-Value Configuration)
CREATE TABLE IF NOT EXISTS public.gym_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key TEXT UNIQUE NOT NULL,
    value JSONB NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================================================================
-- 3. PERFORMANCE INDEXES
-- ==============================================================================
CREATE INDEX IF NOT EXISTS idx_members_phone ON public.members(phone);
CREATE INDEX IF NOT EXISTS idx_members_status ON public.members(status);
CREATE INDEX IF NOT EXISTS idx_members_name ON public.members(full_name);
CREATE INDEX IF NOT EXISTS idx_members_device_user_id ON public.members(device_user_id);

CREATE INDEX IF NOT EXISTS idx_payments_member_id ON public.payments(member_id);
CREATE INDEX IF NOT EXISTS idx_payments_created_at ON public.payments(created_at);

CREATE INDEX IF NOT EXISTS idx_attendance_member_date ON public.attendance_logs(member_id, check_in_at);
CREATE INDEX IF NOT EXISTS idx_attendance_check_in_at ON public.attendance_logs(check_in_at);

CREATE INDEX IF NOT EXISTS idx_memberships_member_id ON public.memberships(member_id);
CREATE INDEX IF NOT EXISTS idx_memberships_end_date ON public.memberships(end_date);

CREATE INDEX IF NOT EXISTS idx_pt_assignments_member_id ON public.pt_assignments(member_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_logs_member_id ON public.whatsapp_logs(member_id);

-- ==============================================================================
-- 4. ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================
ALTER TABLE public.members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.membership_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pt_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pt_packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.whatsapp_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.device_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gym_settings ENABLE ROW LEVEL SECURITY;

-- Clean up any existing policies
DROP POLICY IF EXISTS "Allow authenticated full access on members" ON public.members;
DROP POLICY IF EXISTS "Allow authenticated full access on memberships" ON public.memberships;
DROP POLICY IF EXISTS "Allow authenticated full access on membership_plans" ON public.membership_plans;
DROP POLICY IF EXISTS "Allow authenticated full access on payments" ON public.payments;
DROP POLICY IF EXISTS "Allow authenticated full access on pt_assignments" ON public.pt_assignments;
DROP POLICY IF EXISTS "Allow authenticated full access on pt_packages" ON public.pt_packages;
DROP POLICY IF EXISTS "Allow authenticated full access on attendance_logs" ON public.attendance_logs;
DROP POLICY IF EXISTS "Allow authenticated full access on whatsapp_logs" ON public.whatsapp_logs;
DROP POLICY IF EXISTS "Allow authenticated full access on device_events" ON public.device_events;
DROP POLICY IF EXISTS "Allow authenticated full access on gym_settings" ON public.gym_settings;

-- Create full access policies for authenticated staff/owners
CREATE POLICY "Allow authenticated full access on members" ON public.members FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow authenticated full access on memberships" ON public.memberships FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow authenticated full access on membership_plans" ON public.membership_plans FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow authenticated full access on payments" ON public.payments FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow authenticated full access on pt_assignments" ON public.pt_assignments FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow authenticated full access on pt_packages" ON public.pt_packages FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow authenticated full access on attendance_logs" ON public.attendance_logs FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow authenticated full access on whatsapp_logs" ON public.whatsapp_logs FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow authenticated full access on device_events" ON public.device_events FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow authenticated full access on gym_settings" ON public.gym_settings FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ==============================================================================
-- 5. STORAGE BUCKETS & POLICIES (AVATARS & MEMBER PHOTOS)
-- ==============================================================================
INSERT INTO storage.buckets (id, name, public) 
VALUES ('member_photos', 'member_photos', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public) 
VALUES ('member-avatars', 'member-avatars', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Member Photos Public Access" ON storage.objects;
DROP POLICY IF EXISTS "Member Photos Upload Access" ON storage.objects;
DROP POLICY IF EXISTS "Member Photos Update Access" ON storage.objects;
DROP POLICY IF EXISTS "Member Photos Delete Access" ON storage.objects;

CREATE POLICY "Member Photos Public Access" ON storage.objects FOR SELECT USING (bucket_id IN ('member_photos', 'member-avatars'));
CREATE POLICY "Member Photos Upload Access" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id IN ('member_photos', 'member-avatars'));
CREATE POLICY "Member Photos Update Access" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id IN ('member_photos', 'member-avatars'));
CREATE POLICY "Member Photos Delete Access" ON storage.objects FOR DELETE TO authenticated USING (bucket_id IN ('member_photos', 'member-avatars'));
