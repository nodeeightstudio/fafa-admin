-- ============================================
-- COUNSELLOR BOOKING SYSTEM SCHEMA
-- Complete database schema for counsellor management and booking
-- ============================================

-- ============================================
-- ENHANCED COUNSELLORS TABLE
-- ============================================
DROP TABLE IF EXISTS counsellors CASCADE;
CREATE TABLE counsellors (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Basic Information
  name TEXT NOT NULL,
  email TEXT UNIQUE,
  phone TEXT,
  bio TEXT,
  avatar_url TEXT,
  
  -- Professional Details
  specialties TEXT[] DEFAULT ARRAY[]::TEXT[], -- Array of specialties (e.g., ['Psychologist', 'Anxiety', 'Depression'])
  experience TEXT, -- e.g., "10+ Years"
  qualifications TEXT[] DEFAULT ARRAY[]::TEXT[], -- Array of qualifications/certifications
  languages TEXT[] DEFAULT ARRAY['English'], -- Languages spoken
  
  -- Status & Availability
  is_online BOOLEAN DEFAULT false, -- Real-time online status
  is_active BOOLEAN DEFAULT true, -- Account active/inactive
  is_verified BOOLEAN DEFAULT false, -- Admin verification status
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'inactive', 'suspended')),
  
  -- Ratings (denormalized for performance)
  average_rating DECIMAL(3, 2) DEFAULT 0.0 CHECK (average_rating >= 0 AND average_rating <= 5),
  total_reviews INTEGER DEFAULT 0,
  total_sessions INTEGER DEFAULT 0,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_active_at TIMESTAMP WITH TIME ZONE
);

-- Indexes for performance
CREATE INDEX idx_counsellors_status ON counsellors(status) WHERE status = 'active';
CREATE INDEX idx_counsellors_is_active ON counsellors(is_active) WHERE is_active = true;
CREATE INDEX idx_counsellors_average_rating ON counsellors(average_rating DESC);
CREATE INDEX idx_counsellors_specialties ON counsellors USING GIN(specialties);
CREATE INDEX idx_counsellors_is_online ON counsellors(is_online) WHERE is_online = true;

-- ============================================
-- COUNSELLOR AVAILABILITY TABLE
-- Defines RECURRING weekly availability schedules
-- These schedules repeat every week until admin updates them
-- Example: Monday 9 AM - 5 PM applies to ALL Mondays going forward
-- ============================================
DROP TABLE IF EXISTS counsellor_availability CASCADE;
CREATE TABLE counsellor_availability (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  counsellor_id UUID NOT NULL REFERENCES counsellors(id) ON DELETE CASCADE,
  
  -- Day of week (0 = Sunday, 1 = Monday, ..., 6 = Saturday)
  day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
  
  -- Time slots (24-hour format, e.g., '09:00', '17:00')
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  
  -- Timezone (default to Ghana timezone)
  timezone TEXT DEFAULT 'Africa/Accra',
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Ensure end time is after start time
  CHECK (end_time > start_time),
  
  -- Prevent duplicate availability slots
  UNIQUE(counsellor_id, day_of_week, start_time)
);

CREATE INDEX idx_counsellor_availability_counsellor_id ON counsellor_availability(counsellor_id);
CREATE INDEX idx_counsellor_availability_day ON counsellor_availability(day_of_week);
CREATE INDEX idx_counsellor_availability_active ON counsellor_availability(is_active) WHERE is_active = true;

-- ============================================
-- NOTE: Counsellor availability is managed through recurring weekly schedules
-- No separate time off table - admins can update availability as needed
-- ============================================

-- ============================================
-- ENHANCED BOOKINGS TABLE
-- ============================================
DROP TABLE IF EXISTS bookings CASCADE;
CREATE TABLE bookings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Relationships
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  counsellor_id UUID NOT NULL REFERENCES counsellors(id) ON DELETE CASCADE,
  
  -- Session Details
  session_type TEXT NOT NULL CHECK (session_type IN ('chat', 'online', 'video')),
  duration INTEGER NOT NULL CHECK (duration IN (15, 30, 45, 60)), -- Duration in minutes
  message TEXT, -- User's initial message/reason for booking
  
  -- Scheduling
  scheduled_at TIMESTAMP WITH TIME ZONE NOT NULL,
  scheduled_end_at TIMESTAMP WITH TIME ZONE NOT NULL,
  timezone TEXT DEFAULT 'Africa/Accra',
  
  -- Status
  status TEXT NOT NULL DEFAULT 'pending' CHECK (
    status IN ('pending', 'confirmed', 'in_progress', 'completed', 'cancelled', 'no_show')
  ),
  
  -- Cancellation Details
  cancelled_at TIMESTAMP WITH TIME ZONE,
  cancelled_by UUID REFERENCES profiles(id),
  cancellation_reason TEXT,
  
  -- Session Tracking
  started_at TIMESTAMP WITH TIME ZONE,
  ended_at TIMESTAMP WITH TIME ZONE,
  session_notes TEXT, -- Counsellor's private notes (if needed)
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Ensure end time is after start time
  CHECK (scheduled_end_at > scheduled_at)
);

-- Indexes for performance
CREATE INDEX idx_bookings_user_id ON bookings(user_id);
CREATE INDEX idx_bookings_counsellor_id ON bookings(counsellor_id);
CREATE INDEX idx_bookings_status ON bookings(status);
CREATE INDEX idx_bookings_scheduled_at ON bookings(scheduled_at);
CREATE INDEX idx_bookings_user_status ON bookings(user_id, status);
CREATE INDEX idx_bookings_counsellor_status ON bookings(counsellor_id, status);

-- Prevent double-booking: ensure counsellor doesn't have overlapping active sessions
-- This index ensures no two active bookings for the same counsellor overlap in time
CREATE UNIQUE INDEX idx_bookings_no_overlap ON bookings(
  counsellor_id, 
  scheduled_at
) WHERE status NOT IN ('cancelled', 'no_show');

-- ============================================
-- BOOKING REMINDERS TABLE
-- Track reminders sent to users about upcoming sessions
-- ============================================
DROP TABLE IF EXISTS booking_reminders CASCADE;
CREATE TABLE booking_reminders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  
  reminder_type TEXT NOT NULL CHECK (reminder_type IN ('24h', '1h', '15m')),
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Ensure only one reminder of each type per booking
  UNIQUE(booking_id, reminder_type)
);

CREATE INDEX idx_booking_reminders_booking_id ON booking_reminders(booking_id);

-- ============================================
-- ENHANCED REVIEWS TABLE
-- ============================================
DROP TABLE IF EXISTS reviews CASCADE;
CREATE TABLE reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Relationships
  booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  counsellor_id UUID NOT NULL REFERENCES counsellors(id) ON DELETE CASCADE,
  
  -- Review Content
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  
  -- Detailed Ratings (optional)
  professionalism_rating INTEGER CHECK (professionalism_rating >= 1 AND professionalism_rating <= 5),
  communication_rating INTEGER CHECK (communication_rating >= 1 AND communication_rating <= 5),
  helpfulness_rating INTEGER CHECK (helpfulness_rating >= 1 AND helpfulness_rating <= 5),
  
  -- Status
  is_visible BOOLEAN DEFAULT true, -- Admin can hide inappropriate reviews
  is_flagged BOOLEAN DEFAULT false, -- Users can flag reviews
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Ensure one review per booking per user
  UNIQUE(booking_id, user_id)
);

CREATE INDEX idx_reviews_counsellor_id ON reviews(counsellor_id);
CREATE INDEX idx_reviews_user_id ON reviews(user_id);
CREATE INDEX idx_reviews_rating ON reviews(rating);
CREATE INDEX idx_reviews_visible ON reviews(is_visible) WHERE is_visible = true;
CREATE INDEX idx_reviews_booking_id ON reviews(booking_id);

-- ============================================
-- SESSION CHAT MESSAGES TABLE
-- For chat-based counselling sessions
-- ============================================
DROP TABLE IF EXISTS session_messages CASCADE;
CREATE TABLE session_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  
  -- Sender information
  sender_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  sender_type TEXT NOT NULL CHECK (sender_type IN ('user', 'counsellor')),
  
  -- Message content
  message TEXT NOT NULL,
  
  -- Read status
  is_read BOOLEAN DEFAULT false,
  read_at TIMESTAMP WITH TIME ZONE,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_session_messages_booking_id ON session_messages(booking_id);
CREATE INDEX idx_session_messages_created_at ON session_messages(created_at);
CREATE INDEX idx_session_messages_unread ON session_messages(is_read) WHERE is_read = false;

-- ============================================
-- DATABASE FUNCTIONS
-- ============================================

-- Function to update counsellor statistics when a review is added/updated
CREATE OR REPLACE FUNCTION update_counsellor_stats()
RETURNS TRIGGER AS $$
BEGIN
  -- Update average rating and total reviews
  UPDATE counsellors
  SET 
    average_rating = (
      SELECT COALESCE(ROUND(AVG(rating)::numeric, 2), 0)
      FROM reviews
      WHERE counsellor_id = NEW.counsellor_id
        AND is_visible = true
    ),
    total_reviews = (
      SELECT COUNT(*)
      FROM reviews
      WHERE counsellor_id = NEW.counsellor_id
        AND is_visible = true
    ),
    updated_at = NOW()
  WHERE id = NEW.counsellor_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to update session count when booking is completed
CREATE OR REPLACE FUNCTION update_counsellor_session_count()
RETURNS TRIGGER AS $$
BEGIN
  -- Only count when status changes to 'completed'
  -- For INSERT: check if NEW.status is 'completed'
  -- For UPDATE: check if status changed from non-completed to completed
  IF NEW.status = 'completed' AND (TG_OP = 'INSERT' OR OLD.status != 'completed') THEN
    UPDATE counsellors
    SET 
      total_sessions = total_sessions + 1,
      updated_at = NOW()
    WHERE id = NEW.counsellor_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to check if a counsellor is available at a specific time
-- Checks recurring weekly availability and existing bookings only
CREATE OR REPLACE FUNCTION check_counsellor_availability(
  p_counsellor_id UUID,
  p_scheduled_at TIMESTAMP WITH TIME ZONE,
  p_duration INTEGER
)
RETURNS BOOLEAN AS $$
DECLARE
  v_scheduled_end TIMESTAMP WITH TIME ZONE;
  v_day_of_week INTEGER;
  v_has_availability BOOLEAN;
  v_has_booking BOOLEAN;
BEGIN
  -- Calculate end time
  v_scheduled_end := p_scheduled_at + (p_duration || ' minutes')::INTERVAL;
  
  -- Get day of week (0 = Sunday, 6 = Saturday)
  v_day_of_week := EXTRACT(DOW FROM p_scheduled_at);
  
  -- Check if counsellor has recurring availability for this day/time
  SELECT EXISTS(
    SELECT 1
    FROM counsellor_availability
    WHERE counsellor_id = p_counsellor_id
      AND day_of_week = v_day_of_week
      AND is_active = true
      AND p_scheduled_at::TIME >= start_time
      AND v_scheduled_end::TIME <= end_time
  ) INTO v_has_availability;
  
  IF NOT v_has_availability THEN
    RETURN false;
  END IF;
  
  -- Check for overlapping bookings
  SELECT EXISTS(
    SELECT 1
    FROM bookings
    WHERE counsellor_id = p_counsellor_id
      AND status NOT IN ('cancelled', 'no_show')
      AND (
        -- New booking starts during existing booking
        (scheduled_at <= p_scheduled_at AND scheduled_end_at > p_scheduled_at)
        OR
        -- New booking ends during existing booking
        (scheduled_at < v_scheduled_end AND scheduled_end_at >= v_scheduled_end)
        OR
        -- New booking completely contains existing booking
        (scheduled_at >= p_scheduled_at AND scheduled_end_at <= v_scheduled_end)
      )
  ) INTO v_has_booking;
  
  IF v_has_booking THEN
    RETURN false;
  END IF;
  
  RETURN true;
END;
$$ LANGUAGE plpgsql;

-- Function to get available time slots for a counsellor on a specific date
CREATE OR REPLACE FUNCTION get_available_time_slots(
  p_counsellor_id UUID,
  p_date DATE,
  p_duration INTEGER DEFAULT 30
)
RETURNS TABLE(
  slot_start TIMESTAMP WITH TIME ZONE,
  slot_end TIMESTAMP WITH TIME ZONE
) AS $$
DECLARE
  v_day_of_week INTEGER;
  v_availability RECORD;
  v_current_time TIME;
  v_slot_start TIMESTAMP WITH TIME ZONE;
  v_slot_end TIMESTAMP WITH TIME ZONE;
BEGIN
  -- Get day of week (0 = Sunday, 6 = Saturday)
  v_day_of_week := EXTRACT(DOW FROM p_date);
  
  -- Loop through all availability windows for this day
  FOR v_availability IN
    SELECT start_time, end_time
    FROM counsellor_availability
    WHERE counsellor_id = p_counsellor_id
      AND day_of_week = v_day_of_week
      AND is_active = true
    ORDER BY start_time
  LOOP
    -- Generate time slots within this availability window
    v_current_time := v_availability.start_time;
    
    -- Create slots in 15-minute increments
    WHILE v_current_time + (p_duration || ' minutes')::INTERVAL <= v_availability.end_time LOOP
      v_slot_start := p_date + v_current_time;
      v_slot_end := v_slot_start + (p_duration || ' minutes')::INTERVAL;
      
      -- Check if this slot is available (no conflicts)
      IF check_counsellor_availability(p_counsellor_id, v_slot_start, p_duration) THEN
        slot_start := v_slot_start;
        slot_end := v_slot_end;
        RETURN NEXT;
      END IF;
      
      -- Move to next slot (15-minute increments)
      v_current_time := v_current_time + INTERVAL '15 minutes';
    END LOOP;
  END LOOP;
  
  RETURN;
END;
$$ LANGUAGE plpgsql;

-- Function to automatically update booking status based on time
CREATE OR REPLACE FUNCTION auto_update_booking_status()
RETURNS void AS $$
BEGIN
  -- Mark bookings as in_progress when scheduled time arrives
  UPDATE bookings
  SET 
    status = 'in_progress',
    started_at = NOW(),
    updated_at = NOW()
  WHERE status = 'confirmed'
    AND scheduled_at <= NOW()
    AND scheduled_end_at > NOW();
  
  -- Mark bookings as completed when end time passes
  UPDATE bookings
  SET 
    status = 'completed',
    ended_at = NOW(),
    updated_at = NOW()
  WHERE status = 'in_progress'
    AND scheduled_end_at <= NOW();
  
  -- Mark bookings as no_show if not started 15 minutes after scheduled time
  UPDATE bookings
  SET 
    status = 'no_show',
    updated_at = NOW()
  WHERE status = 'confirmed'
    AND scheduled_at + INTERVAL '15 minutes' <= NOW();
END;
$$ LANGUAGE plpgsql;

-- Function to automatically set scheduled_end_at based on duration
CREATE OR REPLACE FUNCTION set_booking_end_time()
RETURNS TRIGGER AS $$
BEGIN
  -- Calculate end time if not provided
  IF NEW.scheduled_end_at IS NULL THEN
    NEW.scheduled_end_at := NEW.scheduled_at + (NEW.duration || ' minutes')::INTERVAL;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to enforce booking status transition rules
-- This runs in trigger context where OLD and NEW are available
CREATE OR REPLACE FUNCTION enforce_booking_status_transitions()
RETURNS TRIGGER AS $$
BEGIN
  -- Only enforce rules on UPDATE operations
  IF TG_OP = 'UPDATE' THEN
    -- Enforce cancellation rules
    IF NEW.status = 'cancelled' AND OLD.status != 'cancelled' THEN
      -- Can only cancel from pending or confirmed status
      IF OLD.status NOT IN ('pending', 'confirmed') THEN
        RAISE EXCEPTION 'Cannot cancel booking from status %. Only pending or confirmed bookings can be cancelled.', OLD.status;
      END IF;
      
      -- Ensure cancelled_by is set to the user who owns the booking
      IF NEW.cancelled_by IS NULL THEN
        RAISE EXCEPTION 'cancelled_by must be set when cancelling a booking';
      END IF;
      
      -- Set cancelled_at timestamp if not already set
      IF NEW.cancelled_at IS NULL THEN
        NEW.cancelled_at := NOW();
      END IF;
    END IF;
    
    -- Prevent changing status from completed or cancelled (except by admin/system)
    IF OLD.status IN ('completed', 'cancelled') AND NEW.status != OLD.status THEN
      RAISE EXCEPTION 'Cannot change status from % to %. Completed and cancelled bookings are final.', OLD.status, NEW.status;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- TRIGGERS
-- ============================================

-- Update counsellor stats when review is added/updated
DROP TRIGGER IF EXISTS update_counsellor_stats_on_review ON reviews;
CREATE TRIGGER update_counsellor_stats_on_review
  AFTER INSERT OR UPDATE ON reviews
  FOR EACH ROW
  EXECUTE FUNCTION update_counsellor_stats();

-- Update counsellor session count when booking is completed
DROP TRIGGER IF EXISTS update_counsellor_sessions ON bookings;
CREATE TRIGGER update_counsellor_sessions
  AFTER INSERT OR UPDATE ON bookings
  FOR EACH ROW
  EXECUTE FUNCTION update_counsellor_session_count();

-- Automatically set booking end time
DROP TRIGGER IF EXISTS set_booking_end_time_trigger ON bookings;
CREATE TRIGGER set_booking_end_time_trigger
  BEFORE INSERT OR UPDATE ON bookings
  FOR EACH ROW
  EXECUTE FUNCTION set_booking_end_time();

-- Enforce booking status transition rules
DROP TRIGGER IF EXISTS enforce_booking_transitions ON bookings;
CREATE TRIGGER enforce_booking_transitions
  BEFORE UPDATE ON bookings
  FOR EACH ROW
  EXECUTE FUNCTION enforce_booking_status_transitions();

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

-- Enable RLS on all tables
ALTER TABLE counsellors ENABLE ROW LEVEL SECURITY;
ALTER TABLE counsellor_availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE booking_reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_messages ENABLE ROW LEVEL SECURITY;

-- ============================================
-- COUNSELLOR POLICIES
-- ============================================

-- Anyone can read active counsellors
DROP POLICY IF EXISTS "Anyone can read active counsellors" ON counsellors;
CREATE POLICY "Anyone can read active counsellors"
  ON counsellors FOR SELECT
  USING (is_active = true AND status = 'active');

-- Note: Only admins can insert/update counsellors (via service role key)

-- ============================================
-- COUNSELLOR AVAILABILITY POLICIES
-- ============================================

-- Anyone can read active availability
DROP POLICY IF EXISTS "Anyone can read counsellor availability" ON counsellor_availability;
CREATE POLICY "Anyone can read counsellor availability"
  ON counsellor_availability FOR SELECT
  USING (is_active = true);



-- ============================================
-- BOOKING POLICIES
-- ============================================

-- Users can create their own bookings (with availability check)
DROP POLICY IF EXISTS "Users can create their own bookings" ON bookings;
CREATE POLICY "Users can create their own bookings"
  ON bookings FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND check_counsellor_availability(counsellor_id, scheduled_at, duration)
  );

-- Users can view their own bookings
DROP POLICY IF EXISTS "Users can view their own bookings" ON bookings;
CREATE POLICY "Users can view their own bookings"
  ON bookings FOR SELECT
  USING (auth.uid() = user_id);

-- Users can update their own bookings
-- RLS keeps it simple: just check ownership
-- Business logic (status transitions) enforced in trigger below
DROP POLICY IF EXISTS "Users can update their own bookings" ON bookings;
CREATE POLICY "Users can update their own bookings"
  ON bookings FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ============================================
-- BOOKING REMINDERS POLICIES
-- ============================================

-- Users can view reminders for their bookings
DROP POLICY IF EXISTS "Users can view their booking reminders" ON booking_reminders;
CREATE POLICY "Users can view their booking reminders"
  ON booking_reminders FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM bookings
      WHERE bookings.id = booking_reminders.booking_id
        AND bookings.user_id = auth.uid()
    )
  );

-- ============================================
-- REVIEW POLICIES
-- ============================================

-- Users can create reviews for their completed bookings
DROP POLICY IF EXISTS "Users can create reviews for completed bookings" ON reviews;
CREATE POLICY "Users can create reviews for completed bookings"
  ON reviews FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM bookings
      WHERE bookings.id = reviews.booking_id
        AND bookings.user_id = auth.uid()
        AND bookings.status = 'completed'
    )
  );

-- Anyone can read visible reviews
DROP POLICY IF EXISTS "Anyone can read visible reviews" ON reviews;
CREATE POLICY "Anyone can read visible reviews"
  ON reviews FOR SELECT
  USING (is_visible = true);

-- Users can view their own reviews (even if hidden)
DROP POLICY IF EXISTS "Users can view their own reviews" ON reviews;
CREATE POLICY "Users can view their own reviews"
  ON reviews FOR SELECT
  USING (auth.uid() = user_id);

-- Users can update their own reviews
DROP POLICY IF EXISTS "Users can update their own reviews" ON reviews;
CREATE POLICY "Users can update their own reviews"
  ON reviews FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ============================================
-- SESSION MESSAGES POLICIES
-- ============================================

-- Users can read messages from their bookings
DROP POLICY IF EXISTS "Users can read their session messages" ON session_messages;
CREATE POLICY "Users can read their session messages"
  ON session_messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM bookings
      WHERE bookings.id = session_messages.booking_id
        AND bookings.user_id = auth.uid()
    )
  );

-- Users can send messages in their active bookings
DROP POLICY IF EXISTS "Users can send session messages" ON session_messages;
CREATE POLICY "Users can send session messages"
  ON session_messages FOR INSERT
  WITH CHECK (
    sender_id = auth.uid()
    AND sender_type = 'user'
    AND EXISTS (
      SELECT 1 FROM bookings
      WHERE bookings.id = booking_id
        AND bookings.user_id = auth.uid()
        AND bookings.status IN ('confirmed', 'in_progress')
    )
  );

-- Users can mark messages as read
DROP POLICY IF EXISTS "Users can update message read status" ON session_messages;
CREATE POLICY "Users can update message read status"
  ON session_messages FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM bookings
      WHERE bookings.id = session_messages.booking_id
        AND bookings.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM bookings
      WHERE bookings.id = session_messages.booking_id
        AND bookings.user_id = auth.uid()
    )
  );

-- ============================================
-- SAMPLE DATA (Optional - for testing)
-- ============================================

-- Insert sample counsellors
-- INSERT INTO counsellors (name, specialties, experience, bio, is_online, status) VALUES
-- ('Dr. Sara Osei', ARRAY['Psychologist', 'Anxiety', 'Depression'], '10+ Years', 'Experienced psychologist specializing in anxiety and depression treatment.', true, 'active'),
-- ('Dr. Sarah Osei', ARRAY['Psychologist', 'Trauma', 'PTSD'], '10+ Years', 'Clinical psychologist with expertise in trauma and PTSD recovery.', false, 'active'),
-- ('Dr. John Mensah', ARRAY['Therapist', 'Relationships', 'Family'], '5+ Years', 'Licensed therapist focusing on relationship and family counseling.', true, 'active');

-- Insert RECURRING weekly availability (Monday-Friday, 9 AM - 5 PM)
-- These schedules will repeat every week until admin updates them
-- INSERT INTO counsellor_availability (counsellor_id, day_of_week, start_time, end_time)
-- SELECT 
--   c.id,
--   d.day,
--   '09:00'::TIME,
--   '17:00'::TIME
-- FROM counsellors c
-- CROSS JOIN (SELECT generate_series(1, 5) AS day) d -- 1=Monday, 5=Friday
-- WHERE c.status = 'active';
