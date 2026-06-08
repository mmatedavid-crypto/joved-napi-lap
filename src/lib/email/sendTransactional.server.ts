import * as React from 'react'
import { render } from '@react-email/components'
import { supabaseAdmin } from '@/integrations/supabase/client.server'
import { TEMPLATES } from '@/lib/email-templates/registry'

const SITE_NAME = 'Jövőd.hu'
const SENDER_DOMAIN = 'notify.jovod.hu'
const FROM_DOMAIN = 'jovod.hu'

function generateToken(): string {
  const bytes = new Uint8Array(32)
  crypto.getRandomValues(bytes)
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

export interface EnqueueTransactionalInput {
  templateName: string
  recipientEmail: string
  idempotencyKey?: string
  templateData?: Record<string, any>
}

/**
 * Server-internal helper: render a registered template and enqueue it for
 * delivery via the shared email queue (same path as the public send route,
 * but without requiring a user JWT). Use from server functions / webhooks.
 */
export async function enqueueTransactionalEmail(
  input: EnqueueTransactionalInput,
): Promise<{ ok: true; messageId: string } | { ok: false; error: string }> {
  const template = TEMPLATES[input.templateName]
  if (!template) return { ok: false, error: `Unknown template: ${input.templateName}` }

  const recipient = template.to || input.recipientEmail
  if (!recipient) return { ok: false, error: 'recipientEmail required' }
  const normalized = recipient.toLowerCase()

  // Suppression check
  const { data: suppressed } = await supabaseAdmin
    .from('suppressed_emails')
    .select('id')
    .eq('email', normalized)
    .maybeSingle()
  if (suppressed) return { ok: false, error: 'email_suppressed' }

  // Unsubscribe token (one per email)
  let unsubscribeToken: string
  const { data: existingTok } = await supabaseAdmin
    .from('email_unsubscribe_tokens')
    .select('token, used_at')
    .eq('email', normalized)
    .maybeSingle()
  if (existingTok && !existingTok.used_at) {
    unsubscribeToken = existingTok.token
  } else if (existingTok && existingTok.used_at) {
    return { ok: false, error: 'email_suppressed' }
  } else {
    unsubscribeToken = generateToken()
    const { error: tokErr } = await supabaseAdmin
      .from('email_unsubscribe_tokens')
      .insert({ email: normalized, token: unsubscribeToken })
    if (tokErr) return { ok: false, error: `unsubscribe token: ${tokErr.message}` }
  }

  const templateData = input.templateData ?? {}
  const element = React.createElement(template.component, templateData)
  const html = await render(element)
  const text = await render(element, { plainText: true })
  const subject =
    typeof template.subject === 'function' ? template.subject(templateData) : template.subject

  const messageId = crypto.randomUUID()
  const idempotencyKey = input.idempotencyKey ?? messageId

  await supabaseAdmin.from('email_send_log').insert({
    message_id: messageId,
    template_name: input.templateName,
    recipient_email: recipient,
    status: 'pending',
  })

  const { error: enqErr } = await supabaseAdmin.rpc('enqueue_email', {
    queue_name: 'transactional_emails',
    payload: {
      message_id: messageId,
      to: recipient,
      from: `${SITE_NAME} <noreply@${FROM_DOMAIN}>`,
      sender_domain: SENDER_DOMAIN,
      subject,
      html,
      text,
      purpose: 'transactional',
      label: input.templateName,
      idempotency_key: idempotencyKey,
      unsubscribe_token: unsubscribeToken,
      queued_at: new Date().toISOString(),
    },
  })

  if (enqErr) {
    await supabaseAdmin.from('email_send_log').insert({
      message_id: messageId,
      template_name: input.templateName,
      recipient_email: recipient,
      status: 'failed',
      error_message: `enqueue: ${enqErr.message}`,
    })
    return { ok: false, error: enqErr.message }
  }

  return { ok: true, messageId }
}

/**
 * Resolve an order's recipient email (guest_email or auth user's email).
 */
export async function resolveOrderRecipientEmail(order: {
  user_id: string | null
  guest_email: string | null
}): Promise<string | null> {
  if (order.guest_email) return order.guest_email
  if (!order.user_id) return null
  const { data, error } = await supabaseAdmin.auth.admin.getUserById(order.user_id)
  if (error || !data?.user?.email) return null
  return data.user.email
}