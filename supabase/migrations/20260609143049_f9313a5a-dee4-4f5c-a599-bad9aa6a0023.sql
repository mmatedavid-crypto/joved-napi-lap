ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS delivery_email_queued_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS delivery_email_error TEXT;

CREATE INDEX IF NOT EXISTS idx_orders_delivery_email_pending
  ON public.orders(status, delivered_at)
  WHERE status = 'delivered' AND delivery_email_queued_at IS NULL;