-- Store the session price on the booking in Ghana cedis.
-- Paystack is charged amount * 100 pesewas.
-- get_counsellor_wallet_summary already sums bookings.amount.

ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS amount NUMERIC(10, 2);

ALTER TABLE public.bookings
  DROP CONSTRAINT IF EXISTS bookings_amount_cedis_check;

ALTER TABLE public.bookings
  ADD CONSTRAINT bookings_amount_cedis_check
  CHECK (amount IS NULL OR amount >= 0);

COMMENT ON COLUMN public.bookings.amount IS
  'Session price in Ghana cedis. Paystack is charged ROUND(amount * 100) pesewas.';

UPDATE public.bookings
SET amount = ROUND(amount_pesewas / 100.0, 2)
WHERE amount IS NULL
  AND amount_pesewas IS NOT NULL;
