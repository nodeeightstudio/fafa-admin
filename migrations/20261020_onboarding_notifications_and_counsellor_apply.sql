-- Counsellor self-apply RPC, and admin notifications for onboarding and assignments.

CREATE TABLE IF NOT EXISTS counsellor_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  phone TEXT,
  specialization TEXT,
  years_of_experience INTEGER,
  license_number TEXT,
  bio TEXT,
  onboarding_notes TEXT,
  status TEXT NOT NULL DEFAULT 'pending_approval',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE counsellor_applications ADD COLUMN IF NOT EXISTS onboarding_notes TEXT;

ALTER TABLE counsellor_applications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Applicants manage their counsellor application" ON counsellor_applications;
CREATE POLICY "Applicants manage their counsellor application"
  ON counsellor_applications
  FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Admins can view counsellor applications" ON counsellor_applications;
CREATE POLICY "Admins can view counsellor applications"
  ON counsellor_applications
  FOR SELECT
  TO authenticated
  USING (EXISTS (SELECT 1 FROM admins WHERE id = auth.uid()));

CREATE OR REPLACE FUNCTION submit_counsellor_onboarding(
  p_full_name TEXT,
  p_phone TEXT DEFAULT NULL,
  p_specialization TEXT DEFAULT NULL,
  p_years_of_experience INTEGER DEFAULT NULL,
  p_license_number TEXT DEFAULT NULL,
  p_bio TEXT DEFAULT NULL,
  p_onboarding_notes TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_id UUID;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF p_full_name IS NULL OR length(trim(p_full_name)) = 0 THEN
    RAISE EXCEPTION 'Full name is required';
  END IF;

  INSERT INTO counsellor_applications (
    user_id, full_name, phone, specialization, years_of_experience,
    license_number, bio, onboarding_notes, status, updated_at
  )
  VALUES (
    auth.uid(),
    trim(p_full_name),
    NULLIF(trim(COALESCE(p_phone, '')), ''),
    NULLIF(trim(COALESCE(p_specialization, '')), ''),
    p_years_of_experience,
    NULLIF(trim(COALESCE(p_license_number, '')), ''),
    NULLIF(trim(COALESCE(p_bio, '')), ''),
    NULLIF(trim(COALESCE(p_onboarding_notes, '')), ''),
    'pending_approval',
    NOW()
  )
  ON CONFLICT (user_id) DO UPDATE
  SET
    full_name = EXCLUDED.full_name,
    phone = EXCLUDED.phone,
    specialization = EXCLUDED.specialization,
    years_of_experience = EXCLUDED.years_of_experience,
    license_number = EXCLUDED.license_number,
    bio = EXCLUDED.bio,
    onboarding_notes = EXCLUDED.onboarding_notes,
    status = 'pending_approval',
    updated_at = NOW()
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$$;

GRANT EXECUTE ON FUNCTION submit_counsellor_onboarding(
  TEXT, TEXT, TEXT, INTEGER, TEXT, TEXT, TEXT
) TO authenticated;

CREATE OR REPLACE FUNCTION admin_notify_user(
  p_user_id UUID,
  p_type TEXT,
  p_title TEXT,
  p_message TEXT,
  p_related_id UUID DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_id UUID;
BEGIN
  IF auth.uid() IS NULL OR NOT EXISTS (SELECT 1 FROM admins WHERE id = auth.uid()) THEN
    RAISE EXCEPTION 'Only admins can send this notification';
  END IF;

  INSERT INTO notifications (user_id, type, title, message, related_id)
  VALUES (p_user_id, p_type, p_title, p_message, p_related_id)
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$$;

GRANT EXECUTE ON FUNCTION admin_notify_user(UUID, TEXT, TEXT, TEXT, UUID) TO authenticated;
