// SERVER-ONLY. AI olvasat cache az api_cache táblában (provider="reading_ai").
// A Roxy cache mellett a végső, generált olvasatot is tároljuk, így ugyanaz
// a sign+dátum / sorsszám / pár nem indít új AI hívást.

import { supabaseAdmin } from "@/integrations/supabase/client.server";
import type { QualityReading } from "./styleRules";

type CacheRow = {
  response_payload: unknown;
  expires_at: string | null;
};

export async function readReadingCache(cacheKey: string): Promise<QualityReading | null> {
  try {
    const { data, error } = await supabaseAdmin
      .from("api_cache")
      .select("response_payload, expires_at")
      .eq("cache_key", cacheKey)
      .maybeSingle<CacheRow>();
    if (error || !data) return null;
    if (data.expires_at && new Date(data.expires_at).getTime() < Date.now()) return null;
    return data.response_payload as QualityReading;
  } catch {
    return null;
  }
}

export async function writeReadingCache(
  cacheKey: string,
  endpoint: string,
  reading: QualityReading,
  ttlSeconds: number,
): Promise<void> {
  try {
    const expiresAt = new Date(Date.now() + ttlSeconds * 1000).toISOString();
    await supabaseAdmin.from("api_cache").upsert(
      {
        provider: "reading_ai",
        endpoint,
        cache_key: cacheKey,
        request_payload: null as never,
        response_payload: reading as never,
        expires_at: expiresAt,
      },
      { onConflict: "cache_key" },
    );
  } catch {
    /* cache write hibák nem törhetik el a választ */
  }
}
