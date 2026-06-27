DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'order_feedback_value') THEN
    CREATE TYPE public.order_feedback_value AS ENUM ('accurate', 'partial', 'missed');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'order_feedback_source') THEN
    CREATE TYPE public.order_feedback_source AS ENUM ('thank_you', 'profile');
  END IF;
END $$;

ALTER TABLE public.order_feedback DROP CONSTRAINT IF EXISTS order_feedback_feedback_check;
ALTER TABLE public.order_feedback DROP CONSTRAINT IF EXISTS order_feedback_source_check;

ALTER TABLE public.order_feedback
  ALTER COLUMN feedback TYPE public.order_feedback_value USING feedback::public.order_feedback_value;

ALTER TABLE public.order_feedback
  ALTER COLUMN source TYPE public.order_feedback_source USING source::public.order_feedback_source;