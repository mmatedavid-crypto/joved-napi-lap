import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Layout } from "@/components/Layout";
import { PaidReadingBody } from "@/components/PaidReadingBody";
import { PageHeader, Section } from "@/components/Section";
import { SITE_LEGAL } from "@/lib/legal";
import { getOrderBySession, processOrder } from "@/lib/payments.functions";
import { PRODUCTS_BY_SLUG, formatHuf } from "@/lib/products";

type OrderResponsePayload = {
  title?: string;
  body?: string;
  [key: string]: unknown;
};

type OrderView = {
  id: string;
  product_name: string;
  price_huf: number;
  express: boolean | null;
  category: string;
  status: string;
  deliver_by?: string | null;
  guest_email?: string | null;
  product_slug?: string | null;
  source_route?: string | null;
  response_payload?: unknown;
};

function maskEmail(email: string): string {
  const [local, domain] = email.split("@");
  if (!local || !domain) return "a vásárlási email címed";
  const visible = local.slice(0, Math.min(2, local.length));
  return `${visible}${local.length > 2 ? "..." : ""}@${domain}`;
}

function shortOrderId(id: string | undefined | null): string | undefined {
  return id ? id.slice(0, 8).toUpperCase() : undefined;
}

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
        setErr(safeOrderStatusErrorMessage(e));
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
            <SupportContact className="mt-4" />
          </Section>
        )}
        {order && (
          <>
            {(() => {
              const continuePath =
                order.source_route ?? PRODUCTS_BY_SLUG[order.product_slug ?? ""]?.sourceRoute;
              return continuePath && order.status !== "delivered" ? (
                <Section eyebrow="Innen folytathatod">
                  <p>
                    A rendelésedet ehhez az olvasati élményhez kötöttük. Amíg készül, visszamehetsz
                    ugyanoda, új kérdést nézhetsz, vagy később erről a linkről megnyithatod az
                    elkészült olvasatot.
                  </p>
                  <Link
                    to={continuePath}
                    className="mt-4 inline-flex items-center justify-center rounded-md border border-[oklch(0.78_0.10_80/0.28)] px-4 py-3 text-sm text-ivory/75 hover:text-gold"
                  >
                    Vissza az olvasathoz
                  </Link>
                </Section>
              ) : null;
            })()}

            {order.guest_email && (
              <Section eyebrow="Hozzáférés">
                <p>
                  Vendégként vásároltál. Az olvasatod ehhez az oldalhoz és a vásárlási email
                  címedhez kapcsolódik, ezért érdemes ezt a linket megtartanod.
                </p>
                <p className="mt-3 text-sm text-ivory/55">
                  Amikor elkészül, emailben is elküldjük. Ha később nem találod, a vásárlási email
                  címről írj nekünk, és visszakeressük.
                </p>
                <p className="mt-2 text-xs text-ivory/45">
                  Rögzített cím: {maskEmail(order.guest_email)}
                </p>
              </Section>
            )}

            <Section eyebrow="Vásárlás" title={order.product_name}>
              <p className="text-ivory/70">
                {formatHuf(order.price_huf)}
                {order.express ? " · express" : ""}
              </p>
              {shortOrderId(order.id) && (
                <p className="mt-2 text-xs tracking-[0.16em] text-ivory/45">
                  Rendelés: {shortOrderId(order.id)}
                </p>
              )}
              {order.deliver_by && order.status !== "delivered" && (
                <p className="mt-2 text-sm text-ivory/55">
                  Várható elkészülés: {new Date(order.deliver_by).toLocaleString("hu-HU")}
                </p>
              )}
            </Section>

            {order.status !== "delivered" && order.status !== "failed" && (
              <Section eyebrow="Készítjük">
                <p>{orderPreparationLead(order)}</p>
                <p className="mt-3 text-sm text-ivory/60">{orderPreparationDetail(order)}</p>
                <p className="mt-3 text-sm text-ivory/60">
                  Ha vendégként vásároltál, ezt az oldalt érdemes megtartanod. Ha bejelentkeztél, a
                  profilodban is eléred az elkészült olvasatot.
                </p>
                <p className="mt-3 text-sm text-ivory/50">
                  Ha az oldal nem frissül, írj nekünk a rendelés email címéről, és utánanézünk.
                </p>
                <SupportContact className="mt-4" orderId={order.id} />
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
                      <PaidReadingBody body={payload.body} />
                    ) : (
                      <>
                        <p>
                          Az olvasatod elkészült, de ezen az oldalon most nem tudjuk teljes
                          szövegként megjeleníteni. Ha bejelentkeztél, nézd meg a profilodban; ha
                          vendégként vásároltál, írj nekünk a vásárlási email címedről, és
                          utánanézünk.
                        </p>
                        <SupportContact className="mt-4" />
                      </>
                    )}
                    <p className="mt-4 text-sm text-ivory/55">
                      Az elkészült olvasatot emailben is elküldjük a vásárláshoz használt címre.
                      Vendég vásárlásnál ez az oldal marad a legbiztosabb közvetlen hozzáférés.
                    </p>
                  </Section>
                );
              })()}

            {order.status === "failed" && (
              <Section eyebrow="Sajnos hiba történt">
                <p>
                  Nem sikerült automatikusan feldolgozni az olvasatot. Ez nem jelenti azt, hogy a
                  vásárlásod elveszett: kérlek írj nekünk a vásárlási email címedről, és vagy
                  elkészítjük kézzel, vagy visszatérítjük.
                </p>
                <p className="mt-3 text-sm text-ivory/55">
                  A gyors azonosításhoz írd meg a rövid rendelésazonosítót, a termék nevét és a
                  vásárlás nagyjábóli időpontját.
                </p>
                <SupportContact className="mt-4" orderId={order.id} />
              </Section>
            )}

            <div className="flex flex-wrap gap-3">
              {!order.guest_email && (
                <Link to="/profil" className="btn-gold inline-block">
                  Profil megnyitása
                </Link>
              )}
              <Link
                to="/"
                className={
                  order.guest_email
                    ? "btn-gold inline-block"
                    : "inline-flex items-center justify-center rounded-md border border-[oklch(0.78_0.10_80/0.28)] px-4 py-3 text-sm text-ivory/75 hover:text-gold"
                }
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

function SupportContact({ className = "", orderId }: { className?: string; orderId?: string }) {
  const shortId = shortOrderId(orderId);
  return (
    <p className={`text-sm leading-relaxed text-ivory/58 ${className}`.trim()}>
      Ügyfélszolgálat:{" "}
      <a className="text-gold hover:text-gold/80" href={`mailto:${SITE_LEGAL.supportEmail}`}>
        {SITE_LEGAL.supportEmail}
      </a>
      . A gyors azonosításhoz a vásárlási email címedről írj
      {shortId ? `, és add meg ezt: ${shortId}.` : "."}
    </p>
  );
}

function orderPreparationLead(order: OrderView): string {
  if (order.category === "delayed") {
    return "A részletes olvasatod rögzítve van. Itt nem egy rövid automata választ mutatunk: a megadott kérdést, adatokat és témát több szakaszban dolgozzuk össze.";
  }
  return "A személyes olvasatod ezen az oldalon jelenik meg, amint elkészült. Az azonnali termékek általában pár percen belül megérkeznek.";
}

function orderPreparationDetail(order: OrderView): string {
  if (order.category === "delayed") {
    const deadline = order.deliver_by ? new Date(order.deliver_by).toLocaleString("hu-HU") : null;
    return deadline
      ? `A vállalt határidő: ${deadline}. Addig ezt a biztonságos rendelési linket érdemes megtartanod; elkészüléskor emailben is jelzünk.`
      : "A részletes elemzést gondosabb szövegezéssel készítjük el; amikor kész, ezen a biztonságos rendelési linken és emailben is eléred.";
  }
  return "Ha a fizetés már sikeres volt, de az oldal még készítést mutat, pár percig hagyd nyitva vagy frissítsd később ugyanerről a biztonságos linkről.";
}

function safeOrderStatusErrorMessage(error: unknown): string {
  const raw = error instanceof Error ? error.message.toLocaleLowerCase("hu-HU") : "";
  if (raw.includes("rendelés nem található")) {
    return "Ezt a rendelési linket most nem találtuk. Ellenőrizd, hogy a fizetés utáni teljes linket nyitottad-e meg.";
  }
  return "Az állapotlekérés most megakadt. A rendelés nem vész el; frissítsd az oldalt pár perc múlva.";
}
