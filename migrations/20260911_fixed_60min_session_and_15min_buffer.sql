-- Migration: 20260911_fixed_60min_session_and_15min_buffer.sql
-- Description: Hardcode 60-minute fixed session duration and enforce a 15-minute grace period buffer between booking slots.

CREATE OR REPLACE FUNCTION get_available_time_slots(
  p_counsellor_id UUID,
  p_date DATE,
  p_duration INTEGER DEFAULT 60
)
RETURNS TABLE (
  slot_start TIMESTAMP WITH TIME ZONE,
  slot_end TIMESTAMP WITH TIME ZONE
) AS $$
DECLARE
  v_dow INTEGER;
  v_avail RECORD;
  v_slot_start TIMESTAMP WITH TIME ZONE;
  v_slot_end TIMESTAMP WITH TIME ZONE;
  v_buffer_interval INTERVAL := INTERVAL '15 minutes';
  v_session_duration INTERVAL := INTERVAL '60 minutes';
BEGIN
  -- Get day of week (0 = Sunday, 1 = Monday, etc.)
  v_dow := EXTRACT(DOW FROM p_date);

  -- Loop through counselor availability for that day
  FOR v_avail IN
    SELECT start_time, end_time
    FROM counsellor_availability
    WHERE counsellor_id = p_counsellor_id
      AND day_of_week = v_dow
      AND is_active = true
  LOOP
    v_slot_start := (p_date || ' ' || v_avail.start_time)::TIMESTAMP WITH TIME ZONE;
    
    -- Step by 60 mins session + 15 mins grace period buffer
    WHILE (v_slot_start + v_session_duration) <= (p_date || ' ' || v_avail.end_time)::TIMESTAMP WITH TIME ZONE LOOP
      v_slot_end := v_slot_start + v_session_duration;

      -- Check if slot overlaps with any non-cancelled bookings (including 15m buffer around bookings)
      IF NOT EXISTS (
        SELECT 1 FROM bookings b
        WHERE b.counsellor_id = p_counsellor_id
          AND b.status IN ('pending', 'confirmed')
          AND (
            (b.scheduled_at, b.scheduled_at + INTERVAL '60 minutes' + v_buffer_interval)
            OVERLAPS (v_slot_start, v_slot_end + v_buffer_interval)
          )
      ) THEN
        slot_start := v_slot_start;
        slot_end := v_slot_end;
        RETURN NEXT;
      END IF;

      -- Advance start time by 60 mins + 15 mins buffer = 75 mins
      v_slot_start := v_slot_start + v_session_duration + v_buffer_interval;
    END LOOP;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
