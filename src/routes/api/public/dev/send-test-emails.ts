import { createFileRoute } from '@tanstack/react-router'
import { enqueueTransactionalEmail } from '@/lib/email/sendTransactional.server'
import { PRODUCTS } from '@/lib/products'

const RECIPIENT = 'm.mate.david@gmail.com'

const SAMPLE_BODY: Record<string, { title: string; body: string }> = {
  default: {
    title: 'Próba olvasat',
    body: 'Ez egy próba kézbesítés a Jövőd.hu transzakciós email rendszerből.\n\nA valódi rendelésekben itt az AI által generált, személyre szabott olvasatod jelenik meg több bekezdésben.\n\nKöszönjük, hogy teszteled!',
  },
}

export const Route = createFileRoute('/api/public/dev/send-test-emails')({
  server: {
    handlers: {
      GET: async () => {
        const results: Array<{ slug: string; ok: boolean; error?: string; messageId?: string }> = []
        for (const p of PRODUCTS) {
          const sample = SAMPLE_BODY.default
          const res = await enqueueTransactionalEmail({
            templateName: 'order-delivered',
            recipientEmail: RECIPIENT,
            idempotencyKey: `test-${p.slug}-${Date.now()}`,
            templateData: {
              productName: p.name,
              title: `${p.name} — próba`,
              body: sample.body,
              orderId: `test-${p.slug}`,
            },
          })
          if (res.ok) results.push({ slug: p.slug, ok: true, messageId: res.messageId })
          else results.push({ slug: p.slug, ok: false, error: res.error })
        }
        return Response.json({ recipient: RECIPIENT, count: results.length, results })
      },
    },
  },
})