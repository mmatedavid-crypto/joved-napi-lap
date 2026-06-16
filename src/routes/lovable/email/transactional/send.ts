import * as React from "react";
import { render } from "@react-email/components";
import { createClient } from "@supabase/supabase-js";
import { createFileRoute } from "@tanstack/react-router";
import type { TemplateData } from "@/lib/email-templates/registry";
import { TEMPLATES } from "@/lib/email-templates/registry";

// Configuration baked in at scaffold time
const SITE_NAME = "joved-napi-lap";
// SENDER_DOMAIN is the verified sender subdomain FQDN (e.g., "notify.example.com").
// It MUST match the subdomain delegated to Lovable's nameservers. NEVER use the root domain.
const SENDER_DOMAIN = "notify.jovod.hu";
// FROM_DOMAIN is the domain shown in the From: header (e.g., "example.com").
// Can be the root domain when display_from_root is enabled — this is cosmetic only.
const FROM_DOMAIN = "jovod.hu";
const PUBLIC_EMAIL_SEND_ERROR =
  "Az emailt most nem tudtuk előkészíteni. Kérlek próbáld újra később.";
const PUBLIC_EMAIL_SEND_AUTH_ERROR = "Nincs jogosultság az email küldéséhez.";
const PUBLIC_EMAIL_SEND_PAYLOAD_ERROR = "Az email küldéséhez szükséges adatok hiányosak vagy hibásak.";

type TransactionalSendErrorCode =
  | "unsubscribe_token_lookup_failed"
  | "unsubscribe_token_create_failed"
  | "unsubscribe_token_confirm_failed"
  | "email_suppression_missing"
  | "email_enqueue_failed";

function publicEmailSendError(message: string, status: number): Response {
  return Response.json({ error: message }, { status });
}

function redactEmail(email: string | null | undefined): string {
  if (!email) return "***";
  const [localPart, domain] = email.split("@");
  if (!localPart || !domain) return "***";
  return `${localPart[0]}***@${domain}`;
}

// Generate a cryptographically random 32-byte hex token
function generateToken(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export const Route = createFileRoute("/lovable/email/transactional/send")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
        const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

        if (!supabaseUrl || !supabaseServiceKey) {
          console.error("Missing required environment variables");
          return publicEmailSendError(PUBLIC_EMAIL_SEND_ERROR, 500);
        }

        // Verify the caller has a valid Supabase auth token.
        // In TanStack, there is no Supabase gateway — we validate the JWT ourselves.
        const authHeader = request.headers.get("Authorization");
        if (!authHeader?.startsWith("Bearer ")) {
          return publicEmailSendError(PUBLIC_EMAIL_SEND_AUTH_ERROR, 401);
        }

        const token = authHeader.slice("Bearer ".length).trim();
        const supabase = createClient(supabaseUrl, supabaseServiceKey);
        const {
          data: { user },
          error: authError,
        } = await supabase.auth.getUser(token);

        if (authError || !user) {
          return publicEmailSendError(PUBLIC_EMAIL_SEND_AUTH_ERROR, 401);
        }

        // Parse request body
        let templateName: string;
        let recipientEmail: string;
        let idempotencyKey: string;
        let messageId: string;
        let templateData: TemplateData = {};
        try {
          const body = await request.json();
          templateName = body.templateName || body.template_name;
          recipientEmail = body.recipientEmail || body.recipient_email;
          messageId = crypto.randomUUID();
          idempotencyKey = body.idempotencyKey || body.idempotency_key || messageId;
          if (body.templateData && typeof body.templateData === "object") {
            templateData = body.templateData;
          }
        } catch {
          return publicEmailSendError(PUBLIC_EMAIL_SEND_PAYLOAD_ERROR, 400);
        }

        if (!templateName) {
          return publicEmailSendError(PUBLIC_EMAIL_SEND_PAYLOAD_ERROR, 400);
        }

        // 1. Look up template from registry (early — needed to resolve recipient)
        const template = TEMPLATES[templateName];

        if (!template) {
          console.error("Template not found in registry", { templateName });
          return publicEmailSendError(PUBLIC_EMAIL_SEND_PAYLOAD_ERROR, 404);
        }

        // Resolve effective recipient: template-level `to` takes precedence over
        // the caller-provided recipientEmail. This allows notification templates
        // to always send to a fixed address (e.g., site owner from env var).
        const effectiveRecipient = template.to || recipientEmail;
        const essentialTransactional = Boolean(template.essentialTransactional);

        if (!effectiveRecipient) {
          return publicEmailSendError(PUBLIC_EMAIL_SEND_PAYLOAD_ERROR, 400);
        }

        // 2. Check suppression list (fail-closed: if we can't verify, don't send)
        const { data: suppressed, error: suppressionError } = await supabase
          .from("suppressed_emails")
          .select("id, reason")
          .eq("email", effectiveRecipient.toLowerCase())
          .maybeSingle();

        if (suppressionError) {
          console.error("Suppression check failed — refusing to send", {
            error: suppressionError,
            recipient_redacted: redactEmail(effectiveRecipient),
          });
          return publicEmailSendError(PUBLIC_EMAIL_SEND_ERROR, 500);
        }

        if (suppressed && (!essentialTransactional || suppressed.reason !== "unsubscribe")) {
          // Log the suppressed attempt
          await supabase.from("email_send_log").insert({
            message_id: messageId,
            template_name: templateName,
            recipient_email: effectiveRecipient,
            status: "suppressed",
          });

          console.log("Email suppressed", {
            templateName,
            recipient_redacted: redactEmail(effectiveRecipient),
          });
          return Response.json({ success: false, reason: "email_suppressed" });
        }

        // 3. Get or create unsubscribe token (one token per email address)
        const normalizedEmail = effectiveRecipient.toLowerCase();
        let unsubscribeToken: string | undefined;

        if (!essentialTransactional) {
          // Check for existing token for this email
          const { data: existingToken, error: tokenLookupError } = await supabase
            .from("email_unsubscribe_tokens")
            .select("token, used_at")
            .eq("email", normalizedEmail)
            .maybeSingle();

          if (tokenLookupError) {
            console.error("Token lookup failed", {
              error: tokenLookupError,
              email_redacted: redactEmail(normalizedEmail),
            });
            await supabase.from("email_send_log").insert({
              message_id: messageId,
              template_name: templateName,
              recipient_email: effectiveRecipient,
              status: "failed",
              error_message: "unsubscribe_token_lookup_failed" satisfies TransactionalSendErrorCode,
            });
            return publicEmailSendError(PUBLIC_EMAIL_SEND_ERROR, 500);
          }

          if (existingToken && !existingToken.used_at) {
            // Reuse existing unused token
            unsubscribeToken = existingToken.token;
          } else if (!existingToken) {
            // Create new token — upsert handles concurrent inserts gracefully
            unsubscribeToken = generateToken();
            const { error: tokenError } = await supabase
              .from("email_unsubscribe_tokens")
              .upsert(
                { token: unsubscribeToken, email: normalizedEmail },
                { onConflict: "email", ignoreDuplicates: true },
              );

            if (tokenError) {
              console.error("Failed to create unsubscribe token", {
                error: tokenError,
              });
              await supabase.from("email_send_log").insert({
                message_id: messageId,
                template_name: templateName,
                recipient_email: effectiveRecipient,
                status: "failed",
                error_message: "unsubscribe_token_create_failed" satisfies TransactionalSendErrorCode,
              });
              return publicEmailSendError(PUBLIC_EMAIL_SEND_ERROR, 500);
            }

            // If another request raced us, our upsert was silently ignored.
            // Re-read to get the actual stored token.
            const { data: storedToken, error: reReadError } = await supabase
              .from("email_unsubscribe_tokens")
              .select("token")
              .eq("email", normalizedEmail)
              .maybeSingle();

            if (reReadError || !storedToken) {
              console.error("Failed to read back unsubscribe token after upsert", {
                error: reReadError,
                email_redacted: redactEmail(normalizedEmail),
              });
              await supabase.from("email_send_log").insert({
                message_id: messageId,
                template_name: templateName,
                recipient_email: effectiveRecipient,
                status: "failed",
                error_message: "unsubscribe_token_confirm_failed" satisfies TransactionalSendErrorCode,
              });
              return publicEmailSendError(PUBLIC_EMAIL_SEND_ERROR, 500);
            }
            unsubscribeToken = storedToken.token;
          } else {
            // Token exists but is already used — email should have been caught by suppression check above.
            // This is a safety fallback; log and skip sending.
            console.warn("Unsubscribe token already used but email not suppressed", {
              email_redacted: redactEmail(normalizedEmail),
            });
            await supabase.from("email_send_log").insert({
              message_id: messageId,
              template_name: templateName,
              recipient_email: effectiveRecipient,
              status: "suppressed",
              error_message: "email_suppression_missing" satisfies TransactionalSendErrorCode,
            });
            return Response.json({ success: false, reason: "email_suppressed" });
          }
        }

        // 4. Render React Email template to HTML and plain text
        const element = React.createElement(template.component, templateData);
        const html = await render(element);
        const plainText = await render(element, { plainText: true });

        // Resolve subject — supports static string or dynamic function
        const resolvedSubject =
          typeof template.subject === "function"
            ? template.subject(templateData)
            : template.subject;

        // 5. Enqueue the pre-rendered email for async processing by the dispatcher.
        // The dispatcher (process-email-queue) handles sending, retries, and rate-limit backoff.

        // Log pending BEFORE enqueue so we have a record even if enqueue crashes
        await supabase.from("email_send_log").insert({
          message_id: messageId,
          template_name: templateName,
          recipient_email: effectiveRecipient,
          status: "pending",
        });

        const { error: enqueueError } = await supabase.rpc("enqueue_email", {
          queue_name: "transactional_emails",
          payload: {
            message_id: messageId,
            to: effectiveRecipient,
            from: `${SITE_NAME} <noreply@${FROM_DOMAIN}>`,
            sender_domain: SENDER_DOMAIN,
            subject: resolvedSubject,
            html,
            text: plainText,
            purpose: "transactional",
            label: templateName,
            idempotency_key: idempotencyKey,
            ...(unsubscribeToken ? { unsubscribe_token: unsubscribeToken } : {}),
            queued_at: new Date().toISOString(),
          },
        });

        if (enqueueError) {
          console.error("Failed to enqueue email", {
            error: enqueueError,
            templateName,
            recipient_redacted: redactEmail(effectiveRecipient),
          });

          await supabase.from("email_send_log").insert({
            message_id: messageId,
            template_name: templateName,
            recipient_email: effectiveRecipient,
            status: "failed",
            error_message: "email_enqueue_failed" satisfies TransactionalSendErrorCode,
          });

          return publicEmailSendError(PUBLIC_EMAIL_SEND_ERROR, 500);
        }

        console.log("Transactional email enqueued", {
          templateName,
          recipient_redacted: redactEmail(effectiveRecipient),
        });

        return Response.json({ success: true, queued: true });
      },
    },
  },
});
