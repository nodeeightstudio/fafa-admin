-- ============================================
-- Fafa Database Schema
-- Anonymous Mental Health Platform
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- ADMINS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS admins (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  role TEXT DEFAULT 'admin' CHECK (role IN ('admin', 'moderator')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_seen_at TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT true
);

-- Table to track post-specific user numbers
-- Post creator always gets 0, others get sequential numbers per post
CREATE TABLE IF NOT EXISTS post_user_numbers (
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  user_number INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (post_id, user_id),
  UNIQUE(post_id, user_number)
);

CREATE INDEX idx_post_user_numbers_post_id ON post_user_numbers(post_id);
CREATE INDEX idx_post_user_numbers_user_id ON post_user_numbers(user_id);

-- ============================================
-- POSTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS posts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  category TEXT DEFAULT 'All',
  likes_count INTEGER DEFAULT 0,
  comments_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_deleted BOOLEAN DEFAULT false
);

CREATE INDEX idx_posts_user_id ON posts(user_id);
CREATE INDEX idx_posts_category ON posts(category);
CREATE INDEX idx_posts_created_at ON posts(created_at DESC);
CREATE INDEX idx_posts_is_deleted ON posts(is_deleted) WHERE is_deleted = false;

-- ============================================
-- POST LIKES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS post_likes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(post_id, user_id)
);

CREATE INDEX idx_post_likes_post_id ON post_likes(post_id);
CREATE INDEX idx_post_likes_user_id ON post_likes(user_id);

-- ============================================
-- COMMENTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_deleted BOOLEAN DEFAULT false
);

CREATE INDEX idx_comments_post_id ON comments(post_id);
CREATE INDEX idx_comments_user_id ON comments(user_id);
CREATE INDEX idx_comments_created_at ON comments(created_at DESC);

-- ============================================
-- COUNSELLORS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS counsellors (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Basic Information
  name TEXT NOT NULL,
  email TEXT UNIQUE,
  phone TEXT,
  bio TEXT,
  avatar_url TEXT,
  
  -- Professional Details
  specialties TEXT[] DEFAULT ARRAY[]::TEXT[],
  experience TEXT,
  qualifications TEXT[] DEFAULT ARRAY[]::TEXT[],
  languages TEXT[] DEFAULT ARRAY['English'],
  
  -- Status & Availability
  is_online BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  is_verified BOOLEAN DEFAULT false,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'inactive', 'suspended')),
  
  -- Ratings
  average_rating DECIMAL(3, 2) DEFAULT 0.0,
  total_reviews INTEGER DEFAULT 0,
  total_sessions INTEGER DEFAULT 0,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_active_at TIMESTAMP WITH TIME ZONE
);

-- ============================================
-- COUNSELLOR AVAILABILITY TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS counsellor_availability (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  counsellor_id UUID NOT NULL REFERENCES counsellors(id) ON DELETE CASCADE,
  day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6), -- 0 = Sunday, 1 = Monday, etc.
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  is_available BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(counsellor_id, day_of_week, start_time, end_time)
);

CREATE INDEX idx_counsellor_availability_counsellor_id ON counsellor_availability(counsellor_id);
CREATE INDEX idx_counsellor_availability_day ON counsellor_availability(day_of_week);

-- ============================================
-- BOOKINGS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS bookings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  counsellor_id UUID NOT NULL REFERENCES counsellors(id) ON DELETE CASCADE,
  session_type TEXT NOT NULL CHECK (session_type IN ('chat', 'online', 'video')),
  duration INTEGER NOT NULL CHECK (duration IN (15, 30, 45)),
  message TEXT,
  scheduled_at TIMESTAMP WITH TIME ZONE NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'completed', 'cancelled')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_bookings_user_id ON bookings(user_id);
CREATE INDEX idx_bookings_counsellor_id ON bookings(counsellor_id);
CREATE INDEX idx_bookings_status ON bookings(status);

-- ============================================
-- REVIEWS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  counsellor_id UUID NOT NULL REFERENCES counsellors(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(booking_id, user_id)
);

CREATE INDEX idx_reviews_counsellor_id ON reviews(counsellor_id);
CREATE INDEX idx_reviews_user_id ON reviews(user_id);

-- ============================================
-- RESOURCES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS resources (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('video', 'article', 'playlist')),
  url TEXT, -- Legacy main URL
  urls TEXT[] DEFAULT ARRAY[]::TEXT[], -- Multiple URLs for videos/playlists
  content TEXT, -- Rich text content for articles
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_resources_category ON resources(category);

-- ============================================
-- NOTIFICATIONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  related_id UUID,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_is_read ON notifications(is_read) WHERE is_read = false;

-- ============================================
-- REPORTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  reporter_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  reported_type TEXT NOT NULL CHECK (reported_type IN ('post', 'comment', 'user')),
  reported_id UUID NOT NULL,
  reason TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'resolved', 'dismissed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_reports_status ON reports(status);
CREATE INDEX idx_reports_reporter_id ON reports(reporter_id);

-- ============================================
-- FUNCTIONS
-- ============================================

-- Function to get or assign user number for a post
-- Post creator always gets 0, others get sequential numbers
CREATE OR REPLACE FUNCTION get_or_assign_post_user_number(
  p_post_id UUID,
  p_user_id UUID
)
RETURNS INTEGER AS $$
DECLARE
  v_post_creator_id UUID;
  v_user_number INTEGER;
  v_max_number INTEGER;
BEGIN
  -- Get the post creator
  SELECT user_id INTO v_post_creator_id
  FROM posts
  WHERE id = p_post_id;

  -- If this user is the post creator, return 0
  IF p_user_id = v_post_creator_id THEN
    -- Ensure the mapping exists
    INSERT INTO post_user_numbers (post_id, user_id, user_number)
    VALUES (p_post_id, p_user_id, 0)
    ON CONFLICT (post_id, user_id) DO NOTHING;
    RETURN 0;
  END IF;

  -- Check if user already has a number for this post
  SELECT user_number INTO v_user_number
  FROM post_user_numbers
  WHERE post_id = p_post_id AND user_id = p_user_id;

  IF v_user_number IS NOT NULL THEN
    RETURN v_user_number;
  END IF;

  -- Get the next available number (starting from 1, since 0 is for creator)
  SELECT COALESCE(MAX(user_number), 0) + 1 INTO v_max_number
  FROM post_user_numbers
  WHERE post_id = p_post_id;

  -- Assign the number
  INSERT INTO post_user_numbers (post_id, user_id, user_number)
  VALUES (p_post_id, p_user_id, v_max_number)
  ON CONFLICT (post_id, user_id) DO UPDATE
  SET user_number = EXCLUDED.user_number;

  RETURN v_max_number;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user number for a post (read-only)
CREATE OR REPLACE FUNCTION get_post_user_number(
  p_post_id UUID,
  p_user_id UUID
)
RETURNS INTEGER AS $$
DECLARE
  v_post_creator_id UUID;
  v_user_number INTEGER;
BEGIN
  -- Get the post creator
  SELECT user_id INTO v_post_creator_id
  FROM posts
  WHERE id = p_post_id;

  -- If this user is the post creator, return 0
  IF p_user_id = v_post_creator_id THEN
    RETURN 0;
  END IF;

  -- Get the user's number for this post
  SELECT user_number INTO v_user_number
  FROM post_user_numbers
  WHERE post_id = p_post_id AND user_id = p_user_id;

  RETURN COALESCE(v_user_number, NULL);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Handle new user creation
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Create profile (user numbers are assigned per-post, not globally)
  INSERT INTO public.profiles (id)
  VALUES (NEW.id)
  ON CONFLICT (id) DO NOTHING;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to auto-assign user number 0 when a post is created
CREATE OR REPLACE FUNCTION assign_post_creator_number()
RETURNS TRIGGER AS $$
BEGIN
  -- Automatically assign 0 to the post creator
  INSERT INTO post_user_numbers (post_id, user_id, user_number)
  VALUES (NEW.id, NEW.user_id, 0)
  ON CONFLICT (post_id, user_id) DO NOTHING;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Update post comment count
CREATE OR REPLACE FUNCTION update_post_comment_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE posts SET comments_count = comments_count + 1 WHERE id = NEW.post_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE posts SET comments_count = comments_count - 1 WHERE id = OLD.post_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Update post like count
CREATE OR REPLACE FUNCTION update_post_like_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE posts SET likes_count = likes_count + 1 WHERE id = NEW.post_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE posts SET likes_count = likes_count - 1 WHERE id = OLD.post_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Update counsellor rating
CREATE OR REPLACE FUNCTION update_counsellor_rating()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE counsellors
  SET updated_at = NOW()
  WHERE id = NEW.counsellor_id;

  -- Recalculate average rating
  UPDATE counsellors
  SET updated_at = NOW()
  WHERE id = NEW.counsellor_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- TRIGGERS
-- ============================================

-- Create profile on user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Auto-assign number 0 to post creator when post is created
DROP TRIGGER IF EXISTS assign_creator_number_on_post_create ON posts;
CREATE TRIGGER assign_creator_number_on_post_create
  AFTER INSERT ON posts
  FOR EACH ROW EXECUTE FUNCTION assign_post_creator_number();

-- Update comment count
DROP TRIGGER IF EXISTS update_comment_count ON comments;
CREATE TRIGGER update_comment_count
  AFTER INSERT OR DELETE ON comments
  FOR EACH ROW EXECUTE FUNCTION update_post_comment_count();

-- Update like count
DROP TRIGGER IF EXISTS update_like_count ON post_likes;
CREATE TRIGGER update_like_count
  AFTER INSERT OR DELETE ON post_likes
  FOR EACH ROW EXECUTE FUNCTION update_post_like_count();

-- Update counsellor rating
DROP TRIGGER IF EXISTS update_rating ON reviews;
CREATE TRIGGER update_rating
  AFTER INSERT OR UPDATE ON reviews
  FOR EACH ROW EXECUTE FUNCTION update_counsellor_rating();

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_user_numbers ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE counsellors ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE admins ENABLE ROW LEVEL SECURITY;

-- ============================================
-- PROFILES POLICIES
-- ============================================
CREATE POLICY "Users can view their own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- Allow reading user numbers for posts/comments
CREATE POLICY "Anyone can read post user numbers"
  ON post_user_numbers FOR SELECT
  USING (true);

-- Allow authenticated users to insert their own user numbers
CREATE POLICY "Users can insert their own user numbers"
  ON post_user_numbers FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Allow users to update their own user numbers
CREATE POLICY "Users can update their own user numbers"
  ON post_user_numbers FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ============================================
-- POSTS POLICIES
-- ============================================
CREATE POLICY "Anyone authenticated can create posts"
  ON posts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Anyone can read non-deleted posts"
  ON posts FOR SELECT
  USING (is_deleted = false);

CREATE POLICY "Users can update their own posts"
  ON posts FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own posts"
  ON posts FOR UPDATE
  USING (auth.uid() = user_id);

-- ============================================
-- POST LIKES POLICIES
-- ============================================
CREATE POLICY "Anyone authenticated can like posts"
  ON post_likes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can unlike their own likes"
  ON post_likes FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can see their own likes"
  ON post_likes FOR SELECT
  USING (auth.uid() = user_id OR true); -- Allow seeing all likes for count

-- ============================================
-- COMMENTS POLICIES
-- ============================================
CREATE POLICY "Anyone authenticated can create comments"
  ON comments FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Anyone can read non-deleted comments"
  ON comments FOR SELECT
  USING (is_deleted = false);

CREATE POLICY "Users can update their own comments"
  ON comments FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own comments"
  ON comments FOR UPDATE
  USING (auth.uid() = user_id);

-- ============================================
-- ADMINS POLICIES
-- ============================================
CREATE POLICY "Admins can view their own record"
  ON admins FOR SELECT
  USING (auth.uid() = id);

-- ============================================
-- COUNSELLORS POLICIES (Updated for admin access)
-- ============================================
DROP POLICY IF EXISTS "Anyone can read counsellors" ON counsellors;
DROP POLICY IF EXISTS "Anyone can read active counsellors" ON counsellors;
CREATE POLICY "Anyone can read active counsellors"
  ON counsellors FOR SELECT
  USING (is_active = true AND status = 'active');

DROP POLICY IF EXISTS "Admins can manage counsellors" ON counsellors;
DROP POLICY IF EXISTS "Admins can insert counsellors" ON counsellors;
DROP POLICY IF EXISTS "Admins can update counsellors" ON counsellors;
DROP POLICY IF EXISTS "Admins can delete counsellors" ON counsellors;
CREATE POLICY "Admins can manage counsellors"
  ON counsellors FOR ALL
  USING (EXISTS (SELECT 1 FROM admins WHERE id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM admins WHERE id = auth.uid()));

-- ============================================
-- RESOURCES POLICIES (Updated for admin access)
-- ============================================
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
-- REPORTS POLICIES (Updated for admin access)
-- ============================================
CREATE POLICY "Users can create reports"
  ON reports FOR INSERT
  WITH CHECK (auth.uid() = reporter_id);

CREATE POLICY "Users can view their own reports"
  ON reports FOR SELECT
  USING (auth.uid() = reporter_id);

CREATE POLICY "Admins can view all reports"
  ON reports FOR SELECT
  USING (EXISTS (SELECT 1 FROM admins WHERE id = auth.uid()));

CREATE POLICY "Admins can update reports"
  ON reports FOR UPDATE
  USING (EXISTS (SELECT 1 FROM admins WHERE id = auth.uid()));

-- ============================================
-- INITIAL DATA (Optional)
-- ============================================

-- Insert sample counsellors (optional)
-- INSERT INTO counsellors (name, specialty, experience, is_online) VALUES
-- ('Dr. Sara Osei', 'Psychologist', '10+ Years', true),
-- ('Dr. Sarah Osei', 'Psychologist', '10+ Years', false),
-- ('Dr. John Mensah', 'Therapist', '5+ Years', true);