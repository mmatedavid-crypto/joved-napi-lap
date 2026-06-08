CREATE TABLE public.reading_memories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reading_type TEXT NOT NULL,
  topic TEXT,
  question TEXT,
  situation TEXT,
  source_route TEXT,
  title TEXT,
  summary TEXT NOT NULL,
  one_sentence TEXT,
  anchors TEXT[] NOT NULL DEFAULT '{}',
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_reading_memories_user_created ON public.reading_memories(user_id, created_at DESC);
CREATE INDEX idx_reading_memories_user_type ON public.reading_memories(user_id, reading_type, created_at DESC);
CREATE INDEX idx_reading_memories_anchors ON public.reading_memories USING GIN (anchors);

GRANT SELECT, INSERT, DELETE ON public.reading_memories TO authenticated;
GRANT ALL ON public.reading_memories TO service_role;

ALTER TABLE public.reading_memories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Reading memories selectable by owner"
  ON public.reading_memories
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Reading memories insertable by owner"
  ON public.reading_memories
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Reading memories deletable by owner"
  ON public.reading_memories
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);
