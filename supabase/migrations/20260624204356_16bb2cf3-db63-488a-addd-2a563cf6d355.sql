CREATE TABLE IF NOT EXISTS public.order_feedback (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID NOT NULL UNIQUE REFERENCES public.orders(id) ON DELETE CASCADE,
  user_id UUID,
  product_slug TEXT NOT NULL,
  product_name TEXT NOT NULL,
  feedback TEXT NOT NULL CHECK (feedback IN ('accurate','partial','missed')),
  note TEXT,
  source TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE ON public.order_feedback TO authenticated;
GRANT ALL ON public.order_feedback TO service_role;

ALTER TABLE public.order_feedback ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own feedback"
  ON public.order_feedback FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own feedback"
  ON public.order_feedback FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own feedback"
  ON public.order_feedback FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX idx_order_feedback_order_id ON public.order_feedback(order_id);
CREATE INDEX idx_order_feedback_user_id ON public.order_feedback(user_id);
CREATE INDEX idx_order_feedback_product_slug ON public.order_feedback(product_slug);
CREATE INDEX idx_order_feedback_created_at ON public.order_feedback(created_at DESC);

CREATE TRIGGER touch_order_feedback_updated_at
  BEFORE UPDATE ON public.order_feedback
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
