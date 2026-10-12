-- Migration: 20260911_moderation_consensus.sql
-- Description: Consensus voting table and RPC functions (Keep, Delete, Escalate, Skip)

-- 1. Create table for tracking individual moderator votes on reports
CREATE TABLE IF NOT EXISTS moderation_votes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  report_id UUID NOT NULL REFERENCES reports(id) ON DELETE CASCADE,
  moderator_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  vote TEXT NOT NULL CHECK (vote IN ('keep', 'delete', 'escalate', 'skip')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(report_id, moderator_id)
);

CREATE INDEX IF NOT EXISTS idx_moderation_votes_report_id ON moderation_votes(report_id);
CREATE INDEX IF NOT EXISTS idx_moderation_votes_moderator_id ON moderation_votes(moderator_id);

-- Enable RLS on moderation_votes
ALTER TABLE moderation_votes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Moderators can view moderation votes" ON moderation_votes;
CREATE POLICY "Moderators can view moderation votes"
  ON moderation_votes FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_moderator = true) OR
    EXISTS (SELECT 1 FROM admins WHERE id = auth.uid())
  );

DROP POLICY IF EXISTS "Moderators can insert moderation votes" ON moderation_votes;
CREATE POLICY "Moderators can insert moderation votes"
  ON moderation_votes FOR INSERT
  WITH CHECK (
    auth.uid() = moderator_id AND (
      EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_moderator = true) OR
      EXISTS (SELECT 1 FROM admins WHERE id = auth.uid())
    )
  );

-- 2. Function: Submit a moderation vote (Keep, Delete, Escalate, Skip)
CREATE OR REPLACE FUNCTION submit_moderation_vote(
  p_report_id UUID,
  p_moderator_id UUID,
  p_vote TEXT
)
RETURNS JSONB AS $$
DECLARE
  v_reported_type TEXT;
  v_reported_id UUID;
  v_delete_count INTEGER := 0;
  v_keep_count INTEGER := 0;
  v_action_taken TEXT := 'voted';
  v_status TEXT := 'pending';
  v_author_id UUID;
  v_deleted_count INTEGER;
BEGIN
  -- Verify moderator or admin status
  IF NOT EXISTS (SELECT 1 FROM profiles WHERE id = p_moderator_id AND is_moderator = true) AND
     NOT EXISTS (SELECT 1 FROM admins WHERE id = p_moderator_id) THEN
    RAISE EXCEPTION 'User is not an authorized moderator.';
  END IF;

  -- Verify valid vote type
  IF p_vote NOT IN ('keep', 'delete', 'escalate', 'skip') THEN
    RAISE EXCEPTION 'Invalid vote type. Must be keep, delete, escalate, or skip.';
  END IF;

  -- Record vote (upsert if already voted/skipped)
  INSERT INTO moderation_votes (report_id, moderator_id, vote)
  VALUES (p_report_id, p_moderator_id, p_vote)
  ON CONFLICT (report_id, moderator_id) 
  DO UPDATE SET vote = EXCLUDED.vote, created_at = NOW();

  -- Get report details
  SELECT reported_type, reported_id INTO v_reported_type, v_reported_id
  FROM reports
  WHERE id = p_report_id;

  IF p_vote = 'escalate' THEN
    -- Escalate immediately for urgent safety / admin review
    UPDATE reports
    SET status = 'escalated',
        reviewed_by = p_moderator_id,
        reviewed_at = NOW(),
        action_taken = 'escalated_to_admin'
    WHERE id = p_report_id;

    v_status := 'escalated';
    v_action_taken := 'escalated_to_admin';

  ELSIF p_vote = 'delete' THEN
    -- Count total delete votes for this report
    SELECT COUNT(*) INTO v_delete_count
    FROM moderation_votes
    WHERE report_id = p_report_id AND vote = 'delete';

    -- Consensus threshold: 2 delete votes
    IF v_delete_count >= 2 THEN
      IF v_reported_type = 'post' THEN
        SELECT user_id INTO v_author_id FROM posts WHERE id = v_reported_id;

        -- Soft delete post
        UPDATE posts SET is_deleted = true WHERE id = v_reported_id;

        IF v_author_id IS NOT NULL THEN
          UPDATE profiles
          SET deleted_posts_count = COALESCE(deleted_posts_count, 0) + 1
          WHERE id = v_author_id
          RETURNING deleted_posts_count INTO v_deleted_count;

          IF v_deleted_count > 3 THEN
            UPDATE profiles SET escalated_for_suspension = true WHERE id = v_author_id;
          END IF;
        END IF;

      ELSIF v_reported_type = 'comment' THEN
        UPDATE comments SET is_deleted = true WHERE id = v_reported_id;
      END IF;

      -- Mark report resolved
      UPDATE reports
      SET status = 'resolved',
          reviewed_by = p_moderator_id,
          reviewed_at = NOW(),
          action_taken = 'deleted_by_consensus'
      WHERE id = p_report_id;

      v_status := 'resolved';
      v_action_taken := 'deleted_by_consensus';
    END IF;

  ELSIF p_vote = 'keep' THEN
    -- Count total keep votes for this report
    SELECT COUNT(*) INTO v_keep_count
    FROM moderation_votes
    WHERE report_id = p_report_id AND vote = 'keep';

    -- Consensus threshold: 2 keep votes
    IF v_keep_count >= 2 THEN
      -- Mark report dismissed
      UPDATE reports
      SET status = 'dismissed',
          reviewed_by = p_moderator_id,
          reviewed_at = NOW(),
          action_taken = 'kept_by_consensus'
      WHERE id = p_report_id;

      v_status := 'dismissed';
      v_action_taken := 'kept_by_consensus';
    END IF;
  END IF;

  RETURN jsonb_build_object(
    'report_id', p_report_id,
    'vote', p_vote,
    'delete_count', v_delete_count,
    'keep_count', v_keep_count,
    'status', v_status,
    'action_taken', v_action_taken
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Function: Fetch next unreviewed report card for a moderator
CREATE OR REPLACE FUNCTION get_next_moderation_card(
  p_moderator_id UUID
)
RETURNS JSONB AS $$
DECLARE
  v_report RECORD;
  v_post RECORD;
  v_comment RECORD;
  v_result JSONB;
BEGIN
  -- Find next pending report that this moderator has not voted on yet
  SELECT r.* INTO v_report
  FROM reports r
  WHERE r.status = 'pending'
    AND NOT EXISTS (
      SELECT 1 FROM moderation_votes mv 
      WHERE mv.report_id = r.id AND mv.moderator_id = p_moderator_id
    )
  ORDER BY r.created_at ASC
  LIMIT 1;

  IF v_report.id IS NULL THEN
    RETURN NULL;
  END IF;

  -- Attach reported content preview
  IF v_report.reported_type = 'post' THEN
    SELECT id, content, category, created_at, user_id INTO v_post
    FROM posts
    WHERE id = v_report.reported_id;

    v_result := jsonb_build_object(
      'report_id', v_report.id,
      'reporter_id', v_report.reporter_id,
      'reported_type', v_report.reported_type,
      'reported_id', v_report.reported_id,
      'reason', v_report.reason,
      'created_at', v_report.created_at,
      'content', COALESCE(v_post.content, '[Deleted Post]'),
      'category', v_post.category,
      'author_id', v_post.user_id
    );
  ELSIF v_report.reported_type = 'comment' THEN
    SELECT id, content, created_at, user_id INTO v_comment
    FROM comments
    WHERE id = v_report.reported_id;

    v_result := jsonb_build_object(
      'report_id', v_report.id,
      'reporter_id', v_report.reporter_id,
      'reported_type', v_report.reported_type,
      'reported_id', v_report.reported_id,
      'reason', v_report.reason,
      'created_at', v_report.created_at,
      'content', COALESCE(v_comment.content, '[Deleted Comment]'),
      'author_id', v_comment.user_id
    );
  ELSE
    v_result := jsonb_build_object(
      'report_id', v_report.id,
      'reporter_id', v_report.reporter_id,
      'reported_type', v_report.reported_type,
      'reported_id', v_report.reported_id,
      'reason', v_report.reason,
      'created_at', v_report.created_at,
      'content', '[User Profile]'
    );
  END IF;

  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
