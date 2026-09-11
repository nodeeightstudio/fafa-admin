-- Migration: 20260911_specialties_table.sql
-- Description: Create specialties table for dynamic counselor specialization management and RLS policies

CREATE TABLE IF NOT EXISTS specialties (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT UNIQUE NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_specialties_slug ON specialties(slug);

-- Enable RLS
ALTER TABLE specialties ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view specialties" ON specialties;
CREATE POLICY "Anyone can view specialties"
  ON specialties FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Admins can manage specialties" ON specialties;
CREATE POLICY "Admins can manage specialties"
  ON specialties FOR ALL
  USING (EXISTS (SELECT 1 FROM admins WHERE id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM admins WHERE id = auth.uid()));

-- Seed initial specialties
INSERT INTO specialties (name, slug, description) VALUES
  ('General Wellbeing & Peer Support', 'general', 'General wellness, daily peer encouragement, and emotional check-ins'),
  ('Mental Health & Therapy', 'mental_health', 'Clinical mental health, anxiety, depression, and trauma support'),
  ('Youth & Student Counseling', 'youth_student', 'Academic pressure, youth development, and peer relationships'),
  ('Relationship & Family', 'relationship', 'Family dynamics, marriage counseling, and interpersonal conflict resolution'),
  ('Addiction & Behavioral Recovery', 'addiction', 'Substance dependency, behavioral recovery, and habit change'),
  ('Career & Life Coaching', 'career', 'Professional guidance, goal setting, and personal growth')
ON CONFLICT (slug) DO NOTHING;
