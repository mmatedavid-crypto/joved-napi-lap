// Lightweight client-side event hook. No third-party analytics yet.
// Centralised so we can later wire Plausible / PostHog / GA without touching call sites.

export type EventName =
  | "daily_card_started"
  | "daily_card_revealed"
  | "three_card_started"
  | "three_card_completed"
  | "dating_reading_started"
  | "dating_reading_revealed"
  | "decision_reading_started"
  | "decision_reading_revealed"
  | "numerology_completed"
  | "compatibility_completed"
  | "compatibility_invite_clicked"
  | "detailed_reading_cta_clicked"
  | "roxy_call_started"
  | "roxy_call_succeeded"
  | "roxy_call_failed"
  | "roxy_cache_hit"
  | "roxy_cache_miss"
  | "roxy_fallback_used";

export function trackEvent(name: EventName, payload?: Record<string, unknown>) {
  if (typeof window === "undefined") return;
  try {
    // For now: structured console log. Replace with real provider later.
    // eslint-disable-next-line no-console
    console.log("[jovod:event]", name, payload ?? {});
  } catch { /* no-op */ }
}