-- Migration: 20260911_counsellor_wallet_and_payouts.sql
-- Description: Add settlement accounts, payout requests, 80/20 revenue split calculation, and Row Level Security (RLS) policies

-- Table for Counselor Settlement Accounts (Bank & Mobile Money)
CREATE TABLE IF NOT EXISTS counsellor_settlement_accounts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  counsellor_id UUID NOT NULL REFERENCES counsellors(id) ON DELETE CASCADE,
  account_type TEXT NOT NULL CHECK (account_type IN ('bank', 'momo')),
  bank_name TEXT,
  bank_code TEXT,
  momo_provider TEXT, -- e.g., 'mtn', 'telecel', 'airteltigo'
  account_number TEXT NOT NULL,
  account_name TEXT NOT NULL,
  currency TEXT DEFAULT 'GHS',
  is_verified BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(counsellor_id)
);

CREATE INDEX IF NOT EXISTS idx_counsellor_settlement_counsellor_id ON counsellor_settlement_accounts(counsellor_id);

-- Table for Counselor Payout Requests
CREATE TABLE IF NOT EXISTS payout_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  counsellor_id UUID NOT NULL REFERENCES counsellors(id) ON DELETE CASCADE,
  amount DECIMAL(10, 2) NOT NULL CHECK (amount > 0),
  currency TEXT DEFAULT 'GHS',
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'paid', 'rejected')),
  settlement_type TEXT NOT NULL CHECK (settlement_type IN ('bank', 'momo')),
  account_details JSONB NOT NULL, -- snapshot of bank/momo details at request time
  notes TEXT,
  processed_by UUID REFERENCES auth.users(id),
  processed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_payout_requests_counsellor_id ON payout_requests(counsellor_id);
CREATE INDEX IF NOT EXISTS idx_payout_requests_status ON payout_requests(status);

-- ============================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================

ALTER TABLE counsellor_settlement_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE payout_requests ENABLE ROW LEVEL SECURITY;

-- Settlement Accounts RLS
DROP POLICY IF EXISTS "Counsellors can view own settlement account" ON counsellor_settlement_accounts;
CREATE POLICY "Counsellors can view own settlement account"
  ON counsellor_settlement_accounts FOR SELECT
  USING (auth.uid() = counsellor_id OR EXISTS (SELECT 1 FROM admins WHERE id = auth.uid()));

DROP POLICY IF EXISTS "Counsellors can insert/update own settlement account" ON counsellor_settlement_accounts;
CREATE POLICY "Counsellors can insert/update own settlement account"
  ON counsellor_settlement_accounts FOR ALL
  USING (auth.uid() = counsellor_id OR EXISTS (SELECT 1 FROM admins WHERE id = auth.uid()))
  WITH CHECK (auth.uid() = counsellor_id OR EXISTS (SELECT 1 FROM admins WHERE id = auth.uid()));

-- Payout Requests RLS
DROP POLICY IF EXISTS "Counsellors can view own payout requests" ON payout_requests;
CREATE POLICY "Counsellors can view own payout requests"
  ON payout_requests FOR SELECT
  USING (auth.uid() = counsellor_id OR EXISTS (SELECT 1 FROM admins WHERE id = auth.uid()));

DROP POLICY IF EXISTS "Counsellors can create payout requests" ON payout_requests;
CREATE POLICY "Counsellors can create payout requests"
  ON payout_requests FOR INSERT
  WITH CHECK (auth.uid() = counsellor_id OR EXISTS (SELECT 1 FROM admins WHERE id = auth.uid()));

DROP POLICY IF EXISTS "Admins can manage payout requests" ON payout_requests;
CREATE POLICY "Admins can manage payout requests"
  ON payout_requests FOR UPDATE
  USING (EXISTS (SELECT 1 FROM admins WHERE id = auth.uid()));

-- Function: Compute Counselor Wallet Summary with 80/20 Revenue Split
-- 80% to counselor, 20% platform commission fee
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
BEGIN
  -- Sum gross amount from completed bookings
  SELECT COALESCE(SUM(amount), 0.00) INTO v_gross_revenue
  FROM bookings
  WHERE counsellor_id = p_counsellor_id
    AND status = 'completed';

  -- 80% to counselor, 20% platform fee
  v_counsellor_share := v_gross_revenue * 0.80;
  v_platform_share := v_gross_revenue * 0.20;

  -- Sum requested & paid payouts
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
    'available_balance', v_available_balance
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
