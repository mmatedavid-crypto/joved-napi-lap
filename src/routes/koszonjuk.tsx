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
  deliver_by?: string | null;
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
      <PageHeader
        eyebrow="Köszönjük"
        title="A vásárlásod megérkezett"
        lead="Most elkészítjük az olvasatodat. Az oldalt nyugodtan nyitva hagyhatod, de később is visszatérhetsz."
      />
      <div className="mx-auto max-w-2xl px-4 pb-20 space-y-4">
        {loading && <Section eyebrow="Egy pillanat">Egyeztetjük a fizetést…</Section>}
        {err && (
          <Section eyebrow="Kapcsolódási hiba">
            Nem a fizetéseddel van baj; csak az állapotlekérés akadt meg. Frissítsd az oldalt pár
            perc múlva, vagy írj nekünk a vásárlási email címedről.
          </Section>
        )}
        {order && (
          <>
            <Section eyebrow="Vásárlás" title={order.product_name}>
              <p className="text-ivory/70">
                {formatHuf(order.price_huf)}
                {order.express ? " · express" : ""}
              </p>
              {order.deliver_by && order.status !== "delivered" && (
                <p className="mt-2 text-sm text-ivory/55">
                  Várható elkészülés: {new Date(order.deliver_by).toLocaleString("hu-HU")}
                </p>
              )}
            </Section>

            {order.status !== "delivered" && order.status !== "failed" && (
              <Section eyebrow="Készítjük">
                <p>
                  A személyes olvasatod ezen az oldalon jelenik meg, amint elkészült. Az azonnali
                  termékek általában pár percen belül megérkeznek; a részletes elemzéseket gondosabb
                  szövegezéssel készítjük.
                </p>
                <p className="mt-3 text-sm text-ivory/60">
                  Ha vendégként vásároltál, ezt az oldalt érdemes megtartanod. Ha bejelentkeztél, a
                  profilodban is eléred az elkészült olvasatot.
                </p>
                <p className="mt-3 text-sm text-ivory/50">
                  Ha az oldal nem frissül, írj nekünk a rendelés email címéről
                  {order.guest_email ? ` (${order.guest_email})` : ""}, és utánanézünk.
                </p>
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
                      <p>
                        Az olvasatod elkészült, de ezen az oldalon most nem tudjuk teljes szövegként
                        megjeleníteni. Ha bejelentkeztél, nézd meg a profilodban; ha vendégként
                        vásároltál, írj nekünk a vásárlási email címedről, és utánanézünk.
                      </p>
                    )}
                    <p className="mt-4 text-sm text-ivory/55">
                      Az elkészült olvasatot emailben is elküldjük a vásárláshoz használt címre.
                    </p>
                  </Section>
                );
              })()}

            {order.status === "failed" && (
              <Section eyebrow="Sajnos hiba történt">
                Nem sikerült feldolgozni az olvasatot. Kérlek írj nekünk a vásárlási email címedről;
                vagy elkészítjük kézzel, vagy visszatérítjük.
              </Section>
            )}

            <div className="flex flex-wrap gap-3">
              <Link to="/profil" className="btn-gold inline-block">
                Profil megnyitása
              </Link>
              <Link
                to="/"
                className="inline-flex items-center justify-center rounded-md border border-[oklch(0.78_0.10_80/0.28)] px-4 py-3 text-sm text-ivory/75 hover:text-gold"
              >
                Vissza a főoldalra
              </Link>
            </div>
          </>
        )}
      </div>
    </Layout>
  );
}
