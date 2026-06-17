import { createClient } from "@supabase/supabase-js";
import { WebhookError, verifyWebhookRequest } from "@lovable.dev/webhooks-js";
import { createFileRoute } from "@tanstack/react-router";

// Suppression event payload sent by the Go API when Mailgun reports
// a bounce, complaint, or unsubscribe.
interface SuppressionPayload {
  email: string;
  reason: "bounce" | "complaint" | "unsubscribe";
  message_id?: string;
  metadata?: Record<string, unknown>;
  is_retry: boolean;
  retry_count: number;
}

const PUBLIC_EMAIL_WEBHOOK_ERROR =
  "Az email eseményt most nem tudtuk feldolgozni. Kérlek próbáld újra később.";
const PUBLIC_EMAIL_WEBHOOK_AUTH_ERROR = "Nincs jogosultság az email esemény feldolgozásához.";
const PUBLIC_EMAIL_WEBHOOK_PAYLOAD_ERROR = "Az email esemény adatai hiányosak vagy hibásak.";

type SuppressionLogErrorCode =
  | "email_bounced"
  | "email_complained"
  | "email_unsubscribed"
  | "email_suppressed";

function redactEmail(email: string | null | undefined): string {
  if (!email) return "***";
  const [localPart, domain] = email.split("@");
  if (!localPart || !domain) return "***";
  return `${localPart[0]}***@${domain}`;
}

function redactMessageId(messageId: string | null | undefined): string {
  if (!messageId) return "***";
  if (messageId.length <= 10) return `${messageId.slice(0, 2)}***`;
  return `${messageId.slice(0, 4)}***${messageId.slice(-4)}`;
}

function publicEmailWebhookError(message: string, status: number): Response {
  return Response.json({ error: message }, { status });
}

function parseSuppressionPayload(body: string): SuppressionPayload {
  const parsed = JSON.parse(body);
  if (!parsed.data) {
    throw new Error("Missing data field in payload");
  }
  const data = parsed.data as SuppressionPayload;
  if (!data.email || !data.reason) {
    throw new Error("Missing required fields: email, reason");
  }
  return data;
}

function mapReasonToStatus(reason: string): "bounced" | "complained" | "suppressed" {
  switch (reason) {
    case "bounce":
      return "bounced";
    case "complaint":
      return "complained";
    default:
      return "suppressed";
  }
}

function mapReasonToLogCode(reason: string): SuppressionLogErrorCode {
  switch (reason) {
    case "bounce":
      return "email_bounced";
    case "complaint":
      return "email_complained";
    case "unsubscribe":
      return "email_unsubscribed";
    default:
      return "email_suppressed";
  }
}

export const Route = createFileRoute("/lovable/email/suppression")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const apiKey = process.env.LOVABLE_API_KEY;
        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
        const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

        if (!apiKey || !supabaseUrl || !supabaseServiceKey) {
          console.error("Email suppression webhook configuration failed", {
            error_code: "email_webhook_configuration_missing",
          });
          return publicEmailWebhookError(PUBLIC_EMAIL_WEBHOOK_ERROR, 500);
        }

        // Verify HMAC signature using the Lovable API Key (same as auth-email-hook)
        let payload: SuppressionPayload;
        try {
          const verified = await verifyWebhookRequest({
            req: request,
            secret: apiKey,
            parser: parseSuppressionPayload,
          });
          payload = verified.payload;
        } catch (error) {
          if (error instanceof WebhookError) {
            switch (error.code) {
              case "invalid_signature":
                console.error("Email suppression webhook rejected", {
                  error_code: "email_webhook_invalid_signature",
                });
                return publicEmailWebhookError(PUBLIC_EMAIL_WEBHOOK_AUTH_ERROR, 401);
              case "stale_timestamp":
                console.error("Email suppression webhook rejected", {
                  error_code: "email_webhook_stale_timestamp",
                });
                return publicEmailWebhookError(PUBLIC_EMAIL_WEBHOOK_AUTH_ERROR, 401);
              case "invalid_payload":
              case "invalid_json":
                console.error("Email suppression webhook payload rejected", {
                  error_code: "email_webhook_invalid_payload",
                  verification_code: error.code,
                });
                return publicEmailWebhookError(PUBLIC_EMAIL_WEBHOOK_PAYLOAD_ERROR, 400);
              default:
                console.error("Email suppression webhook verification failed", {
                  error_code: "email_webhook_verification_failed",
                  verification_code: error.code,
                });
                return publicEmailWebhookError(PUBLIC_EMAIL_WEBHOOK_AUTH_ERROR, 401);
            }
          }
          console.error("Email suppression webhook verification failed", {
            error_code: "email_webhook_verification_exception",
          });
          return publicEmailWebhookError(PUBLIC_EMAIL_WEBHOOK_ERROR, 500);
        }

        const supabase = createClient(supabaseUrl, supabaseServiceKey);
        const normalizedEmail = payload.email.toLowerCase();

        // 1. Upsert to suppressed_emails (idempotent — safe for retries)
        const { error: suppressError } = await supabase.from("suppressed_emails").upsert(
          {
            email: normalizedEmail,
            reason: payload.reason,
            metadata: payload.metadata ?? null,
          },
          { onConflict: "email" },
        );

        if (suppressError) {
          console.error("Failed to upsert suppressed email", {
            error_code: "email_suppression_upsert_failed",
            email_redacted: redactEmail(normalizedEmail),
            reason: payload.reason,
          });
          return publicEmailWebhookError(PUBLIC_EMAIL_WEBHOOK_ERROR, 500);
        }

        // 2. Append a new log entry for the suppression event (never update existing rows)
        const sendLogStatus = mapReasonToStatus(payload.reason);
        const sendLogMessage = mapReasonToLogCode(payload.reason);

        const { error: insertError } = await supabase.from("email_send_log").insert({
          message_id: payload.message_id ?? null,
          template_name: "system",
          recipient_email: normalizedEmail,
          status: sendLogStatus,
          error_message: sendLogMessage,
          metadata: payload.metadata ?? null,
        });

        if (insertError) {
          // Non-fatal — log and continue. The suppression was already recorded.
          console.warn("Failed to insert email_send_log", {
            error_code: "email_send_log_insert_failed",
            email_redacted: redactEmail(normalizedEmail),
            reason: payload.reason,
            message_id_redacted: redactMessageId(payload.message_id),
          });
        }

        console.log("Suppression processed", {
          email_redacted: redactEmail(normalizedEmail),
          reason: payload.reason,
          is_retry: payload.is_retry,
          retry_count: payload.retry_count,
          has_message_id: !!payload.message_id,
        });

        return Response.json({ success: true });
      },
    },
  },
});
