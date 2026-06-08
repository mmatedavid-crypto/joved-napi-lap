import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Layout } from "@/components/Layout";
import { PageHeader, Section } from "@/components/Section";
import { getOrderBySession, processOrder } from "@/lib/payments.functions";
import { formatHuf } from "@/lib/products";

type OrderResponsePayload = {
  title?: string;
  body?: string;
  [key: string]: unknown;
};

type OrderView = {
  product_name: string;
  price_huf: number;
  express: boolean | null;
  category: string;
  status: string;
  guest_email?: string | null;
  response_payload?: unknown;
};

export const Route = createFileRoute("/koszonjuk")({
  validateSearch: (s: Record<string, unknown>): { session_id?: string } => ({
    session_id: typeof s.session_id === "string" ? s.session_id : undefined,
  }),
  head: () => ({
    meta: [{ title: "Köszönjük! | Jövőd.hu" }],
    links: [{ rel: "canonical", href: "/koszonjuk" }],
  }),
  component: Page,
});

function Page() {
  const { session_id } = Route.useSearch();
  const fetchOrder = useServerFn(getOrderBySession);
  const runProcess = useServerFn(processOrder);
  const [order, setOrder] = useState<OrderView | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (!session_id) {
      setLoading(false);
      return;
    }
    let stop = false;
    let triggered = false;
    let attempts = 0;
    const MAX_ATTEMPTS = 240; // ~10 perc 2.5s intervallumonként
    async function tick() {
      attempts++;
      try {
        const r = await fetchOrder({ data: { sessionId: session_id! } });
        if (stop) return;
        setOrder(r.order);
        setLoading(false);
        if (!r.order) return;
        if (!triggered && (r.order.status === "processing" || r.order.status === "paid")) {
          triggered = true;
          runProcess({ data: { sessionId: session_id! } }).catch(() => {});
        }
        if (
          attempts < MAX_ATTEMPTS &&
          (r.order.status === "processing" ||
            r.order.status === "paid" ||
            r.order.status === "pending_payment")
        ) {
          setTimeout(tick, 2500);
        }
      } catch (e: unknown) {
        setErr(e instanceof Error ? e.message : "Hiba");
        setLoading(false);
      }
    }
    tick();
    return () => {
      stop = true;
    };
  }, [session_id, fetchOrder, runProcess]);

  if (!session_id) {
    return (
      <Layout>
        <PageHeader eyebrow="Köszönjük" title="Nincs vásárlási adat" />
        <div className="mx-auto max-w-md px-4 pb-20">
          <Link to="/" className="btn-gold">
            Vissza a főoldalra
          </Link>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <PageHeader eyebrow="Köszönjük" title="A vásárlásod megérkezett" />
      <div className="mx-auto max-w-2xl px-4 pb-20 space-y-4">
        {loading && <Section eyebrow="Egy pillanat">Egyeztetjük a fizetést…</Section>}
        {err && <Section eyebrow="Hiba">{err}</Section>}
        {order && (
          <>
            <Section eyebrow="Vásárlás" title={order.product_name}>
              <p className="text-ivory/70">
                {formatHuf(order.price_huf)}
                {order.express ? " · express" : ""}
              </p>
            </Section>

            {order.status !== "delivered" && order.status !== "failed" && (
              <Section eyebrow="Készítjük">
                A személyes olvasatod itt jelenik meg ezen az oldalon, amint elkészült. Ha az oldal
                nem frissül pár percen belül, írj nekünk a rendelés email címéről
                {order.guest_email ? ` (${order.guest_email})` : ""}, és utánanézünk.
              </Section>
            )}

            {order.status === "delivered" &&
              order.response_payload != null &&
              (() => {
                const payload =
                  typeof order.response_payload === "object" && order.response_payload !== null
                    ? (order.response_payload as OrderResponsePayload)
                    : null;
                return (
                  <Section eyebrow="A te olvasatod" title={payload?.title ?? undefined}>
                    {payload && typeof payload.body === "string" ? (
                      <div className="whitespace-pre-wrap">{payload.body}</div>
                    ) : (
                      <pre className="text-sm whitespace-pre-wrap">
                        {JSON.stringify(order.response_payload, null, 2)}
                      </pre>
                    )}
                  </Section>
                );
              })()}

            {order.status === "failed" && (
              <Section eyebrow="Sajnos hiba történt">
                Nem sikerült feldolgozni az olvasatot. Kérlek írj nekünk — visszatérítjük.
              </Section>
            )}

            <Link to="/" className="btn-gold inline-block">
              Vissza a főoldalra
            </Link>
          </>
        )}
      </div>
    </Layout>
  );
}
