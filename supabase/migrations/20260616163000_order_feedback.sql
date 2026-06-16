CREATE TABLE IF NOT EXISTS public.order_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  product_slug TEXT,
  product_name TEXT,
  feedback TEXT NOT NULL CHECK (feedback IN ('accurate', 'partial', 'missed')),
  note TEXT,
  source TEXT NOT NULL CHECK (source IN ('thank_you', 'profile')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (order_id)
);

CREATE INDEX IF NOT EXISTS idx_order_feedback_user_created
  ON public.order_feedback(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_order_feedback_feedback_created
  ON public.order_feedback(feedback, created_at DESC);

GRANT SELECT, INSERT, UPDATE ON public.order_feedback TO authenticated;
GRANT ALL ON public.order_feedback TO service_role;

ALTER TABLE public.order_feedback ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Order feedback selectable by owner"
  ON public.order_feedback
  FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.orders
      WHERE orders.id = order_feedback.order_id
        AND orders.user_id = auth.uid()
    )
  );

CREATE POLICY "Order feedback insertable by order owner"
  ON public.order_feedback
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.orders
      WHERE orders.id = order_feedback.order_id
        AND orders.user_id = auth.uid()
    )
  );

CREATE POLICY "Order feedback updatable by order owner"
  ON public.order_feedback
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.orders
      WHERE orders.id = order_feedback.order_id
        AND orders.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.orders
      WHERE orders.id = order_feedback.order_id
        AND orders.user_id = auth.uid()
    )
  );

CREATE TRIGGER trg_order_feedback_updated
  BEFORE UPDATE ON public.order_feedback
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
