-- Migration: Moderation Updates
-- Date: 2025-12-30

-- 1. Enhance Reports table with missing audit columns
ALTER TABLE reports 
ADD COLUMN IF NOT EXISTS reviewed_by UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS action_taken TEXT;

-- 2. Ensure profiles table has is_active/is_suspended logic correctly defined
-- (is_active is used in the app, but we want to ensure it's robust)
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- 3. Add index for faster queries on suspended users
CREATE INDEX IF NOT EXISTS idx_profiles_is_active ON profiles(is_active) WHERE is_active = false;
