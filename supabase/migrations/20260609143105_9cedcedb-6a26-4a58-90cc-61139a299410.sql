ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS stripe_environment TEXT,
  ADD COLUMN IF NOT EXISTS payment_rechecked_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_orders_pending_payment_recheck
  ON public.orders(status, payment_rechecked_at)
  WHERE status = 'pending_payment';