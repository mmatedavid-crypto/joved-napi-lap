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
  | "smart_followup_shown"
  | "smart_followup_clicked"
  | "paywall_opened"
  | "paywall_alternative_clicked"
  | "checkout_confirmed"
  | "checkout_started"
  | "checkout_succeeded"
  | "checkout_failed"
  | "checkout_retry_clicked"
  | "paid_order_retry_clicked"
  | "paid_reading_feedback_clicked"
  | "knowledge_lookup_started"
  | "knowledge_lookup_succeeded"
  | "knowledge_lookup_failed"
  | "knowledge_cache_hit"
  | "knowledge_cache_miss"
  | "local_meaning_used"
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
  | "knowledge_domain_started"
  | "knowledge_domain_succeeded"
  | "knowledge_domain_failed";

export function trackEvent(name: EventName, payload?: Record<string, unknown>) {
  if (typeof window === "undefined") return;
  try {
    const plausibleWindow = window as Window & {
      plausible?: (
        event: string,
        options?: { props: Record<string, string | number | boolean> },
      ) => void;
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
