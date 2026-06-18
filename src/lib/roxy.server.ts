// SERVER-ONLY. Do NOT import from client code. The .server.ts suffix prevents
// any client bundle from reaching this file (it would fail the build).
//
// Reads the server-side symbolic source key from process.env. The key never
// leaves the server and returned errors stay neutral for downstream copy.

import { supabaseAdmin } from "@/integrations/supabase/client.server";

const ROXY_BASE_URL = "https://roxyapi.com/api/v2";

export type RoxyCallResult<T> = {
  ok: boolean;
  data: T | null;
  cached: boolean;
  providerCode?: string;
  errorMessage?: string;
};

type CacheRow = {
  response_payload: unknown;
  expires_at: string | null;
};

async function readCache(cacheKey: string): Promise<unknown | null> {
  const { data, error } = await supabaseAdmin
    .from("api_cache")
    .select("response_payload, expires_at")
    .eq("cache_key", cacheKey)
    .maybeSingle<CacheRow>();
  if (error || !data) return null;
  if (data.expires_at && new Date(data.expires_at).getTime() < Date.now()) return null;
  return data.response_payload;
}

async function writeCache(
  endpoint: string,
  cacheKey: string,
  requestPayload: unknown,
  responsePayload: unknown,
  ttlSeconds: number | null,
): Promise<void> {
  const expiresAt =
    ttlSeconds == null ? null : new Date(Date.now() + ttlSeconds * 1000).toISOString();
  await supabaseAdmin.from("api_cache").upsert(
    {
      provider: "roxy",
      endpoint,
      cache_key: cacheKey,
      request_payload: requestPayload as never,
      response_payload: responsePayload as never,
      expires_at: expiresAt,
    },
    { onConflict: "cache_key" },
  );
}

/**
 * Call the symbolic source service with caching. Returns a structured result
 * so callers can always fall back to local data when source material is absent.
 */
export async function callRoxy<T = unknown>(opts: {
  endpoint: string;
  method?: "GET" | "POST";
  body?: Record<string, unknown>;
  cacheKey: string;
  ttlSeconds: number | null; // null = no caching, 0 = forever
}): Promise<RoxyCallResult<T>> {
  const { endpoint, method = "POST", body, cacheKey, ttlSeconds } = opts;

  // 1. Cache lookup
  if (ttlSeconds != null) {
    try {
      const cached = await readCache(cacheKey);
      if (cached != null) {
        return { ok: true, data: cached as T, cached: true };
      }
    } catch {
      /* cache miss treated as no-cache */
    }
  }

  // 2. Live call
  const apiKey = process.env.ROXY_API_KEY;
  if (!apiKey) {
    return {
      ok: false,
      data: null,
      cached: false,
      providerCode: "missing_api_key",
      errorMessage: "A szimbolikus forrásanyag most nem érhető el.",
    };
  }

  const url = `${ROXY_BASE_URL}${endpoint}`;
  let res: Response;
  try {
    res = await fetch(url, {
      method,
      headers: {
        "X-API-Key": apiKey,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: method === "GET" ? undefined : JSON.stringify(body ?? {}),
    });
  } catch {
    return {
      ok: false,
      data: null,
      cached: false,
      providerCode: "network_error",
      errorMessage: "A szimbolikus forrásanyag most nem érhető el.",
    };
  }

  if (!res.ok) {
    const code =
      res.status === 400
        ? "validation_error"
        : res.status === 401
          ? "invalid_api_key"
          : res.status === 404
            ? "not_found"
            : res.status === 429
              ? "rate_limited"
              : res.status >= 500
                ? "provider_error"
                : `http_${res.status}`;
    return {
      ok: false,
      data: null,
      cached: false,
      providerCode: code,
      errorMessage: "A szimbolikus forrásanyag most nem érhető el.",
    };
  }

  let json: unknown;
  try {
    json = await res.json();
  } catch {
    return {
      ok: false,
      data: null,
      cached: false,
      providerCode: "invalid_json",
      errorMessage: "A szimbolikus forrásanyag most nem érhető el.",
    };
  }

  // 3. Cache write
  if (ttlSeconds != null) {
    try {
      await writeCache(endpoint, cacheKey, body ?? null, json, ttlSeconds);
    } catch {
      /* cache write failures must not break the call */
    }
  }

  return { ok: true, data: json as T, cached: false };
}
