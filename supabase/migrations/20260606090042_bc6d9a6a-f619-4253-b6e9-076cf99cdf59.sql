CREATE TABLE public.api_cache (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  provider TEXT NOT NULL DEFAULT 'roxy',
  endpoint TEXT NOT NULL,
  cache_key TEXT NOT NULL UNIQUE,
  request_payload JSONB,
  response_payload JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ
);

CREATE INDEX api_cache_provider_endpoint_idx ON public.api_cache (provider, endpoint);
CREATE INDEX api_cache_expires_at_idx ON public.api_cache (expires_at);

GRANT ALL ON public.api_cache TO service_role;

ALTER TABLE public.api_cache ENABLE ROW LEVEL SECURITY;

-- Server-only table: no policies for anon/authenticated. Only service_role (admin client) reads/writes.
