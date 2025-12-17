-- ============================================
-- FAFA Admin Database Schema
-- Admin-specific tables and policies
-- ============================================

-- ============================================
-- ADMINS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS admins (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  role TEXT DEFAULT 'admin' CHECK (role IN ('admin', 'moderator')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on admin-related tables
ALTER TABLE admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE counsellors ENABLE ROW LEVEL SECURITY;
ALTER TABLE counsellor_availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;

-- ============================================
-- ADMINS POLICIES
-- ============================================
DROP POLICY IF EXISTS "Admins can view their own record" ON admins;
CREATE POLICY "Admins can view their own record"
  ON admins FOR SELECT
  USING (auth.uid() = id);

-- ============================================
-- COUNSELLORS POLICIES (Admin access)
-- ============================================
DROP POLICY IF EXISTS "Anyone can read counsellors" ON counsellors;
DROP POLICY IF EXISTS "Admins can insert counsellors" ON counsellors;
DROP POLICY IF EXISTS "Admins can update counsellors" ON counsellors;
DROP POLICY IF EXISTS "Admins can delete counsellors" ON counsellors;

CREATE POLICY "Anyone can read counsellors"
  ON counsellors FOR SELECT
  USING (true);

CREATE POLICY "Admins can insert counsellors"
  ON counsellors FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM admins WHERE id = auth.uid()));

CREATE POLICY "Admins can update counsellors"
  ON counsellors FOR UPDATE
  USING (EXISTS (SELECT 1 FROM admins WHERE id = auth.uid()));

CREATE POLICY "Admins can delete counsellors"
  ON counsellors FOR DELETE
  USING (EXISTS (SELECT 1 FROM admins WHERE id = auth.uid()));

-- ============================================
-- COUNSELLOR AVAILABILITY POLICIES (Admin access)
-- ============================================
DROP POLICY IF EXISTS "Anyone can read counsellor availability" ON counsellor_availability;
DROP POLICY IF EXISTS "Admins can insert counsellor availability" ON counsellor_availability;
DROP POLICY IF EXISTS "Admins can update counsellor availability" ON counsellor_availability;
DROP POLICY IF EXISTS "Admins can delete counsellor availability" ON counsellor_availability;

CREATE POLICY "Anyone can read counsellor availability"
  ON counsellor_availability FOR SELECT
  USING (true);

CREATE POLICY "Admins can insert counsellor availability"
  ON counsellor_availability FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM admins WHERE id = auth.uid()));

CREATE POLICY "Admins can update counsellor availability"
  ON counsellor_availability FOR UPDATE
  USING (EXISTS (SELECT 1 FROM admins WHERE id = auth.uid()));

CREATE POLICY "Admins can delete counsellor availability"
  ON counsellor_availability FOR DELETE
  USING (EXISTS (SELECT 1 FROM admins WHERE id = auth.uid()));

-- ============================================
-- RESOURCES POLICIES (Admin access)
-- ============================================
DROP POLICY IF EXISTS "Anyone can read resources" ON resources;
DROP POLICY IF EXISTS "Admins can insert resources" ON resources;
DROP POLICY IF EXISTS "Admins can update resources" ON resources;
DROP POLICY IF EXISTS "Admins can delete resources" ON resources;

CREATE POLICY "Anyone can read resources"
  ON resources FOR SELECT
  USING (true);

CREATE POLICY "Admins can insert resources"
  ON resources FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM admins WHERE id = auth.uid()));

CREATE POLICY "Admins can update resources"
  ON resources FOR UPDATE
  USING (EXISTS (SELECT 1 FROM admins WHERE id = auth.uid()));

CREATE POLICY "Admins can delete resources"
  ON resources FOR DELETE
  USING (EXISTS (SELECT 1 FROM admins WHERE id = auth.uid()));

-- ============================================
-- REPORTS POLICIES (Admin access)
-- ============================================
DROP POLICY IF EXISTS "Admins can view all reports" ON reports;
DROP POLICY IF EXISTS "Admins can update reports" ON reports;

CREATE POLICY "Admins can view all reports"
  ON reports FOR SELECT
  USING (EXISTS (SELECT 1 FROM admins WHERE id = auth.uid()));

CREATE POLICY "Admins can update reports"
  ON reports FOR UPDATE
  USING (EXISTS (SELECT 1 FROM admins WHERE id = auth.uid()));

-- ============================================
-- PROFILES POLICIES (Admin access for statistics)
-- ============================================
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;

CREATE POLICY "Admins can view all profiles"
  ON profiles FOR SELECT
  USING (EXISTS (SELECT 1 FROM admins WHERE id = auth.uid()));

-- ============================================
-- POSTS POLICIES (Admin access for statistics)
-- ============================================
DROP POLICY IF EXISTS "Admins can view all posts" ON posts;

CREATE POLICY "Admins can view all posts"
  ON posts FOR SELECT
  USING (EXISTS (SELECT 1 FROM admins WHERE id = auth.uid()));

-- ============================================
-- ADMIN SETUP INSTRUCTIONS
-- ============================================

-- To set up an admin user:
-- 1. Have the user sign up/login to create an auth.users record
-- 2. Get their UUID from auth.users table
-- 3. Insert into admins table:
-- INSERT INTO admins (id, email, role) VALUES
-- ('user-uuid-here', 'admin@example.com', 'admin');