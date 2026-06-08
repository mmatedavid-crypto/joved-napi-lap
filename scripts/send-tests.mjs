import * as React from 'react'
import { render } from '@react-email/components'
import { createClient } from '@supabase/supabase-js'
import { template as orderDelivered } from '../src/lib/email-templates/order-delivered'
import { PRODUCTS } from '../src/lib/products'

const RECIPIENT = 'm.mate.david@gmail.com'
const SITE_NAME = 'Jövőd.hu'
const SENDER_DOMAIN = 'notify.jovod.hu'
const FROM_DOMAIN = 'jovod.hu'

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

function token() {
  const b = new Uint8Array(32); crypto.getRandomValues(b)
  return Array.from(b).map(x => x.toString(16).padStart(2,'0')).join('')
}

const normalized = RECIPIENT.toLowerCase()
let unsub: string
const { data: existing } = await supabase.from('email_unsubscribe_tokens').select('token,used_at').eq('email', normalized).maybeSingle()
if (existing?.token && !existing.used_at) unsub = existing.token
else if (existing?.used_at) { console.error('email suppressed'); process.exit(1) }
else {
  unsub = token()
  await supabase.from('email_unsubscribe_tokens').insert({ email: normalized, token: unsub })
}

const results: any[] = []
for (const p of PRODUCTS) {
  const data = {
    productName: p.name,
    title: `${p.name} — próba`,
    body: `Ez egy próba kézbesítés a(z) "${p.name}" termékhez.\n\nA valódi rendelésekben itt a személyre szabott AI-olvasatod jelenik meg több bekezdésben, a kihúzott lapok / számok / álomszimbólumok alapján.\n\nKöszönjük a tesztet!`,
    orderId: `test-${p.slug}-${Date.now()}`,
  }
  const el = React.createElement(orderDelivered.component, data)
  const html = await render(el)
  const text = await render(el, { plainText: true })
  const subject = typeof orderDelivered.subject === 'function' ? orderDelivered.subject(data) : orderDelivered.subject
  const messageId = crypto.randomUUID()

  await supabase.from('email_send_log').insert({
    message_id: messageId, template_name: 'order-delivered', recipient_email: RECIPIENT, status: 'pending',
  })

  const { error } = await supabase.rpc('enqueue_email', {
    queue_name: 'transactional_emails',
    payload: {
      message_id: messageId,
      to: RECIPIENT,
      from: `${SITE_NAME} <noreply@${FROM_DOMAIN}>`,
      sender_domain: SENDER_DOMAIN,
      subject, html, text,
      purpose: 'transactional',
      label: 'order-delivered',
      idempotency_key: messageId,
      unsubscribe_token: unsub,
      queued_at: new Date().toISOString(),
    },
  })
  results.push({ slug: p.slug, ok: !error, error: error?.message })
}
console.log(JSON.stringify(results, null, 2))
