-- Migration: Final Admin Moderation RLS Policies
-- Date: 2025-12-31

BEGIN;

-- ============================================
-- 1. POSTS Admin Access
-- ============================================

-- Allow admins to see ALL posts (including soft-deleted ones)
DROP POLICY IF EXISTS "Admins can view all posts" ON posts;
CREATE POLICY "Admins can view all posts"
  ON posts FOR SELECT
  USING (EXISTS (SELECT 1 FROM admins WHERE id = auth.uid()));

-- Allow admins to update ALL posts (needed for soft delete)
DROP POLICY IF EXISTS "Admins can moderate posts" ON posts;
CREATE POLICY "Admins can moderate posts"
  ON posts FOR UPDATE
  USING (EXISTS (SELECT 1 FROM admins WHERE id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM admins WHERE id = auth.uid()));


-- ============================================
-- 2. COMMENTS Admin Access
-- ============================================

-- Allow admins to see ALL comments (including soft-deleted ones)
DROP POLICY IF EXISTS "Admins can view all comments" ON comments;
CREATE POLICY "Admins can view all comments"
  ON comments FOR SELECT
  USING (EXISTS (SELECT 1 FROM admins WHERE id = auth.uid()));

-- Allow admins to update ALL comments (needed for soft delete)
DROP POLICY IF EXISTS "Admins can moderate comments" ON comments;
CREATE POLICY "Admins can moderate comments"
  ON comments FOR UPDATE
  USING (EXISTS (SELECT 1 FROM admins WHERE id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM admins WHERE id = auth.uid()));


-- ============================================
-- 3. PROFILES Admin Access
-- ============================================

-- Allow admins to see ALL profiles
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
CREATE POLICY "Admins can view all profiles"
  ON profiles FOR SELECT
  USING (EXISTS (SELECT 1 FROM admins WHERE id = auth.uid()));

-- Allow admins to update ALL profiles (needed for user suspension)
DROP POLICY IF EXISTS "Admins can moderate profiles" ON profiles;
CREATE POLICY "Admins can moderate profiles"
  ON profiles FOR UPDATE
  USING (EXISTS (SELECT 1 FROM admins WHERE id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM admins WHERE id = auth.uid()));

COMMIT;
