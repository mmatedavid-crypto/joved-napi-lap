// Lightweight client-side events sent to the privacy-focused analytics already loaded by the site.

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
  | "paywall_opened"
  | "checkout_confirmed"
  | "checkout_started"
  | "checkout_succeeded"
  | "checkout_failed"
  | "checkout_retry_clicked"
  | "paid_reading_feedback_clicked"
  | "roxy_call_started"
  | "roxy_call_succeeded"
  | "roxy_call_failed"
  | "roxy_cache_hit"
  | "roxy_cache_miss"
  | "roxy_fallback_used"
  | "daily_compass_opened"
  | "daily_compass_completed"
  | "iching_started"
  | "iching_completed"
  | "dream_started"
  | "dream_completed"
  | "angel_number_started"
  | "angel_number_completed"
  | "lucky_numbers_generated"
  | "crystal_opened"
  | "horoscope_opened"
  | "astrology_advanced_enabled"
  | "roxy_domain_started"
  | "roxy_domain_succeeded"
  | "roxy_domain_failed";

export function trackEvent(name: EventName, payload?: Record<string, unknown>) {
  if (typeof window === "undefined") return;
  try {
    const plausibleWindow = window as Window & {
      plausible?: (event: string, options?: { props: Record<string, string | number | boolean> }) => void;
    };
    const props = Object.fromEntries(
      Object.entries(payload ?? {}).flatMap(([key, value]) =>
        typeof value === "string" || typeof value === "number" || typeof value === "boolean"
          ? [[key, value]]
          : [],
      ),
    );
    plausibleWindow.plausible?.(name, { props });
  } catch {
    /* no-op */
  }
}
