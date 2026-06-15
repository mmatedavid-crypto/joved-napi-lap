import * as React from "react";
import { render } from "@react-email/components";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import type { TemplateData } from "@/lib/email-templates/registry";
import { TEMPLATES } from "@/lib/email-templates/registry";

const SITE_NAME = "Jövőd.hu";
const SENDER_DOMAIN = "notify.jovod.hu";
const FROM_DOMAIN = "jovod.hu";

export type TransactionalEmailError =
  | "unknown_template"
  | "missing_recipient_email"
  | "email_suppressed"
  | "unsubscribe_token_unavailable"
  | "email_queue_unavailable";

function redactEmail(email: string | null | undefined): string {
  if (!email) return "***";
  const [localPart, domain] = email.split("@");
  if (!localPart || !domain) return "***";
  return `${localPart[0]}***@${domain}`;
}

function generateToken(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export interface EnqueueTransactionalInput {
  templateName: string;
  recipientEmail: string;
  idempotencyKey?: string;
  templateData?: TemplateData;
}

/**
 * Server-internal helper: render a registered template and enqueue it for
 * delivery via the shared email queue (same path as the public send route,
 * but without requiring a user JWT). Use from server functions / webhooks.
 */
export async function enqueueTransactionalEmail(
  input: EnqueueTransactionalInput,
): Promise<{ ok: true; messageId: string } | { ok: false; error: TransactionalEmailError }> {
  const template = TEMPLATES[input.templateName];
  if (!template) return { ok: false, error: "unknown_template" };

  const recipient = template.to || input.recipientEmail;
  if (!recipient) return { ok: false, error: "missing_recipient_email" };
  const normalized = recipient.toLowerCase();
  const essentialTransactional = Boolean(template.essentialTransactional);

  // Suppression check
  const { data: suppressed } = await supabaseAdmin
    .from("suppressed_emails")
    .select("id, reason")
    .eq("email", normalized)
    .maybeSingle();
  if (suppressed && (!essentialTransactional || suppressed.reason !== "unsubscribe")) {
    return { ok: false, error: "email_suppressed" };
  }

  // The delivery API requires an unsubscribe token for every app email,
  // including essential order/access messages.
  let unsubscribeToken: string | undefined;
  const { data: existingTok } = await supabaseAdmin
    .from("email_unsubscribe_tokens")
    .select("token, used_at")
    .eq("email", normalized)
    .maybeSingle();
  if (existingTok && !existingTok.used_at) {
    unsubscribeToken = existingTok.token;
  } else if (existingTok && existingTok.used_at) {
    if (!essentialTransactional) {
      return { ok: false, error: "email_suppressed" };
    }
    unsubscribeToken = existingTok.token;
  } else {
    unsubscribeToken = generateToken();
    const { error: tokErr } = await supabaseAdmin
      .from("email_unsubscribe_tokens")
      .insert({ email: normalized, token: unsubscribeToken });
    if (tokErr) {
      console.error("Failed to create unsubscribe token for transactional email", {
        error: tokErr,
        recipient_redacted: redactEmail(normalized),
        templateName: input.templateName,
      });
      return { ok: false, error: "unsubscribe_token_unavailable" };
    }
  }

  const templateData = input.templateData ?? {};
  const element = React.createElement(template.component, templateData);
  const html = await render(element);
  const text = await render(element, { plainText: true });
  const subject =
    typeof template.subject === "function" ? template.subject(templateData) : template.subject;

  const idempotencyKey = input.idempotencyKey ?? crypto.randomUUID();
  const messageId = idempotencyKey;

  await supabaseAdmin.from("email_send_log").insert({
    message_id: messageId,
    template_name: input.templateName,
    recipient_email: recipient,
    status: "pending",
    metadata: {
      idempotency_key: idempotencyKey,
    } as never,
  });

  const { error: enqErr } = await supabaseAdmin.rpc("enqueue_email", {
    queue_name: "transactional_emails",
    payload: {
      message_id: messageId,
      to: recipient,
      from: `${SITE_NAME} <noreply@${FROM_DOMAIN}>`,
      sender_domain: SENDER_DOMAIN,
      subject,
      html,
      text,
      purpose: "transactional",
      label: input.templateName,
      idempotency_key: idempotencyKey,
      ...(unsubscribeToken ? { unsubscribe_token: unsubscribeToken } : {}),
      queued_at: new Date().toISOString(),
    },
  });

  if (enqErr) {
    console.error("Failed to enqueue transactional email", {
      error: enqErr,
      recipient_redacted: redactEmail(recipient),
      templateName: input.templateName,
      messageId,
    });
    await supabaseAdmin.from("email_send_log").insert({
      message_id: messageId,
      template_name: input.templateName,
      recipient_email: recipient,
      status: "failed",
      error_message: "email_queue_unavailable",
      metadata: {
        idempotency_key: idempotencyKey,
      } as never,
    });
    return { ok: false, error: "email_queue_unavailable" };
  }

  return { ok: true, messageId };
}

/**
 * Resolve an order's recipient email (guest_email or auth user's email).
 */
export async function resolveOrderRecipientEmail(order: {
  user_id: string | null;
  guest_email: string | null;
}): Promise<string | null> {
  if (order.guest_email) return order.guest_email;
  if (!order.user_id) return null;
  const { data, error } = await supabaseAdmin.auth.admin.getUserById(order.user_id);
  if (error || !data?.user?.email) return null;
  return data.user.email;
}
