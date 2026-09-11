-- Migration: 20260911_moderation_rules_and_streaks.sql
-- Description: Add moderator attributes, posting streak tracking, post flags, automated suspension threshold columns, and RLS policies

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_moderator BOOLEAN DEFAULT false;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS posting_streak_count INTEGER DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS last_posted_date DATE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS deleted_posts_count INTEGER DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS escalated_for_suspension BOOLEAN DEFAULT false;

-- Create table to track individual moderator deletion flags for 2-moderator consensus
CREATE TABLE IF NOT EXISTS moderator_post_flags (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  moderator_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(post_id, moderator_id)
);

CREATE INDEX IF NOT EXISTS idx_moderator_post_flags_post_id ON moderator_post_flags(post_id);

-- RLS for moderator_post_flags
ALTER TABLE moderator_post_flags ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Moderators can view post flags" ON moderator_post_flags;
CREATE POLICY "Moderators can view post flags"
  ON moderator_post_flags FOR SELECT
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_moderator = true) OR EXISTS (SELECT 1 FROM admins WHERE id = auth.uid()));

DROP POLICY IF EXISTS "Moderators can insert post flags" ON moderator_post_flags;
CREATE POLICY "Moderators can insert post flags"
  ON moderator_post_flags FOR INSERT
  WITH CHECK (auth.uid() = moderator_id AND (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_moderator = true) OR EXISTS (SELECT 1 FROM admins WHERE id = auth.uid())));

-- Function: Flag post for deletion by a moderator
-- Evaluates 2-moderator consensus, deletes post, increments author deleted count,
-- and triggers admin escalation (> 3 deletions) or auto-suspension (> 5 deletions).
CREATE OR REPLACE FUNCTION flag_post_by_moderator(
  p_post_id UUID,
  p_moderator_id UUID
)
RETURNS JSONB AS $$
DECLARE
  v_flag_count INTEGER;
  v_post_author_id UUID;
  v_deleted_count INTEGER;
  v_auto_suspended BOOLEAN := false;
  v_escalated BOOLEAN := false;
  v_deleted BOOLEAN := false;
BEGIN
  -- Verify moderator privilege
  IF NOT EXISTS (SELECT 1 FROM profiles WHERE id = p_moderator_id AND is_moderator = true) AND
     NOT EXISTS (SELECT 1 FROM admins WHERE id = p_moderator_id) THEN
    RAISE EXCEPTION 'User is not an authorized moderator.';
  END IF;

  -- Record flag from this moderator
  INSERT INTO moderator_post_flags (post_id, moderator_id)
  VALUES (p_post_id, p_moderator_id)
  ON CONFLICT (post_id, moderator_id) DO NOTHING;

  -- Get total flag count for this post
  SELECT COUNT(*) INTO v_flag_count
  FROM moderator_post_flags
  WHERE post_id = p_post_id;

  -- If 2 or more distinct moderators flag the post, execute deletion
  IF v_flag_count >= 2 THEN
    -- Retrieve post author
    SELECT user_id INTO v_post_author_id FROM posts WHERE id = p_post_id;

    -- Permanently delete post
    DELETE FROM posts WHERE id = p_post_id;
    v_deleted := true;

    IF v_post_author_id IS NOT NULL THEN
      -- Increment author's deleted posts count
      UPDATE profiles
      SET deleted_posts_count = COALESCE(deleted_posts_count, 0) + 1
      WHERE id = v_post_author_id
      RETURNING deleted_posts_count INTO v_deleted_count;

      -- Check thresholds
      IF v_deleted_count > 5 THEN
        -- Automatic system suspension
        UPDATE profiles
        SET is_active = false
        WHERE id = v_post_author_id;
        v_auto_suspended := true;
      ELSIF v_deleted_count > 3 THEN
        -- Escalated to admin for manual suspension
        UPDATE profiles
        SET escalated_for_suspension = true
        WHERE id = v_post_author_id;
        v_escalated := true;
      END IF;
    END IF;
  END IF;

  RETURN jsonb_build_object(
    'flag_count', v_flag_count,
    'post_deleted', v_deleted,
    'author_escalated', v_escalated,
    'author_suspended', v_auto_suspended
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Admin invite user to become a moderator
CREATE OR REPLACE FUNCTION admin_invite_moderator(
  p_target_user_id UUID
)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE profiles
  SET is_moderator = true
  WHERE id = p_target_user_id;
  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Increment daily posting streak
CREATE OR REPLACE FUNCTION record_user_post_streak(
  p_user_id UUID
)
RETURNS INTEGER AS $$
DECLARE
  v_last_date DATE;
  v_current_streak INTEGER;
  v_today DATE := CURRENT_DATE;
BEGIN
  SELECT last_posted_date, COALESCE(posting_streak_count, 0)
  INTO v_last_date, v_current_streak
  FROM profiles
  WHERE id = p_user_id;

  IF v_last_date IS NULL THEN
    v_current_streak := 1;
  ELSIF v_last_date = v_today THEN
    -- Already posted today, streak unchanged
    RETURN v_current_streak;
  ELSIF v_last_date = v_today - INTERVAL '1 day' THEN
    -- Consecutive day
    v_current_streak := v_current_streak + 1;
  ELSE
    -- Reset streak
    v_current_streak := 1;
  END IF;

  UPDATE profiles
  SET posting_streak_count = v_current_streak,
      last_posted_date = v_today
  WHERE id = p_user_id;

  RETURN v_current_streak;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
