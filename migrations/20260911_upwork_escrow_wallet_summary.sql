-- Migration: 20260911_upwork_escrow_wallet_summary.sql
-- Description: Upwork-style Escrow calculation for get_counsellor_wallet_summary RPC function

CREATE OR REPLACE FUNCTION get_counsellor_wallet_summary(
  p_counsellor_id UUID
)
RETURNS JSONB AS $$
DECLARE
  v_gross_revenue DECIMAL(10, 2) := 0.00;
  v_counsellor_share DECIMAL(10, 2) := 0.00;
  v_platform_share DECIMAL(10, 2) := 0.00;
  v_paid_payouts DECIMAL(10, 2) := 0.00;
  v_available_balance DECIMAL(10, 2) := 0.00;
  v_in_escrow_amount DECIMAL(10, 2) := 0.00;
BEGIN
  -- 1. Sum gross amount from COMPLETED bookings
  SELECT COALESCE(SUM(amount), 0.00) INTO v_gross_revenue
  FROM bookings
  WHERE counsellor_id = p_counsellor_id
    AND status = 'completed';

  -- 80% to counselor, 20% platform fee for completed sessions
  v_counsellor_share := v_gross_revenue * 0.80;
  v_platform_share := v_gross_revenue * 0.20;

  -- 2. Sum Upwork-style IN ESCROW funds for upcoming/funded sessions (80% share)
  SELECT COALESCE(SUM(amount * 0.80), 0.00) INTO v_in_escrow_amount
  FROM bookings
  WHERE counsellor_id = p_counsellor_id
    AND status IN ('pending', 'confirmed', 'in_progress')
    AND (payment_status IS NULL OR payment_status = 'paid');

  -- 3. Sum requested & paid payouts
  SELECT COALESCE(SUM(amount), 0.00) INTO v_paid_payouts
  FROM payout_requests
  WHERE counsellor_id = p_counsellor_id
    AND status IN ('pending', 'paid');

  v_available_balance := GREATEST(0.00, v_counsellor_share - v_paid_payouts);

  RETURN jsonb_build_object(
    'gross_revenue', v_gross_revenue,
    'counsellor_share_80', v_counsellor_share,
    'platform_share_20', v_platform_share,
    'paid_or_pending_payouts', v_paid_payouts,
    'available_balance', v_available_balance,
    'in_escrow_amount', v_in_escrow_amount
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
