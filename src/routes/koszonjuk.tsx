import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Layout } from "@/components/Layout";
import { PaidReadingBody, type PaidReadingGenerationPublic } from "@/components/PaidReadingBody";
import { PageHeader, Section } from "@/components/Section";
import { trackEvent } from "@/lib/analytics";
import { SITE_LEGAL } from "@/lib/legal";
import {
  getOrderBySession,
  processOrder,
  submitOrderFeedbackBySession,
} from "@/lib/payments.functions";
import { PRODUCTS_BY_SLUG, formatHuf } from "@/lib/products";

type OrderResponsePayload = {
  title?: string;
  body?: string;
  generation?: PaidReadingGenerationPublic;
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
  feedback?: FeedbackValue | null;
  delivery_email_status?: "queued" | "attention_needed" | null;
  response_payload?: unknown;
};

type FeedbackValue = "accurate" | "partial" | "missed";

const FEEDBACK_OPTIONS = [
  {
    label: "Hasznos volt",
    value: "accurate" as const,
    body: "Az olvasat hasznos volt és kapcsolódott a helyzetemhez. Ezt szeretném jelezni rövid visszajelzésként.",
  },
  {
    label: "Részben volt hasznos",
    value: "partial" as const,
    body: "Az olvasat részben hasznos volt, és szeretném pontosabban megmutatni, mit pontosítanék vagy tennék hozzá.\n\nAmi kapcsolódott a helyzetemhez:\n\nAmit szeretnék pontosítani:\n\nA helyzetemből ezt érdemes még hozzátenni:",
  },
  {
    label: "Pontosítást kérek",
    value: "missed" as const,
    body: "Szeretnék pontosítást kérni az elkészült olvasathoz.\n\nAmit szeretnék pontosítani:\n\nA saját helyzetemből ezt érdemes még figyelembe venni:\n\nEbben az irányban kérnék finomítást:",
  },
] as const;

function normalizeFeedbackSearch(value: unknown): FeedbackValue | undefined {
  return value === "accurate" || value === "partial" || value === "missed" ? value : undefined;
}

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
  validateSearch: (
    s: Record<string, unknown>,
  ): { session_id?: string; feedback?: FeedbackValue } => ({
    session_id: typeof s.session_id === "string" ? s.session_id : undefined,
    feedback: normalizeFeedbackSearch(s.feedback),
  }),
  head: () => ({
    meta: [{ title: "Köszönjük! | Jövőd.hu" }, { name: "robots", content: "noindex,nofollow" }],
    links: [{ rel: "canonical", href: `${SITE_LEGAL.siteUrl}/koszonjuk` }],
  }),
  component: Page,
});

function Page() {
  const { session_id, feedback } = Route.useSearch();
  const fetchOrder = useServerFn(getOrderBySession);
  const runProcess = useServerFn(processOrder);
  const [order, setOrder] = useState<OrderView | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [pollingPaused, setPollingPaused] = useState(false);
  const [orderLookupPending, setOrderLookupPending] = useState(false);
  const [retryingFailedOrder, setRetryingFailedOrder] = useState(false);
  const [retryNotice, setRetryNotice] = useState<string | null>(null);

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
        setPollingPaused(false);
        setOrderLookupPending(false);
        setLoading(false);
        if (!r.order) {
          setOrderLookupPending(true);
          if (attempts < MAX_ATTEMPTS) {
            setTimeout(tick, 2500);
          } else {
            setPollingPaused(true);
          }
          return;
        }
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
        } else if (
          attempts >= MAX_ATTEMPTS &&
          (r.order.status === "processing" ||
            r.order.status === "paid" ||
            r.order.status === "pending_payment")
        ) {
          setPollingPaused(true);
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

  async function retryFailedOrder() {
    if (!session_id) return;
    setRetryingFailedOrder(true);
    setRetryNotice(null);
    trackEvent("paid_order_retry_clicked", {
      productSlug: order?.product_slug ?? "",
      status: order?.status ?? "",
      source: "thank_you",
    });
    try {
      const result = await runProcess({ data: { sessionId: session_id } });
      const refreshed = await fetchOrder({ data: { sessionId: session_id } });
      setOrder(refreshed.order);
      if (!result.ok) {
        setRetryNotice(
          "Most nem sikerült újraindítani a feldolgozást. A rendelés nem vész el; írj nekünk a vásárlási email címedről, és utánanézünk.",
        );
        return;
      }
      setRetryNotice(
        result.processing
          ? "Az olvasat feldolgozása már fut. Tartsd nyitva ezt az oldalt, vagy frissíts rá később."
          : "Újraindítottuk a feldolgozást. Ha elkészül, ezen az oldalon jelenik meg.",
      );
    } catch {
      setRetryNotice(
        "Most nem sikerült újraindítani a feldolgozást. A rendelés nem vész el; írj nekünk a vásárlási email címedről, és utánanézünk.",
      );
    } finally {
      setRetryingFailedOrder(false);
    }
  }

  if (!session_id) {
    return (
      <Layout>
        <PageHeader
          eyebrow="Köszönjük"
          title="Hiányzik a rendelési azonosító"
          lead="Ez általában akkor történik, ha nem a fizetés utáni teljes visszatérési link nyílt meg."
        />
        <div className="mx-auto max-w-2xl px-4 pb-20 space-y-4">
          <Section eyebrow="Mit tehetsz most?">
            <p>
              Ha már fizettél, a vásárlás nem ettől az oldaltól függ. Nyisd meg újra a Stripe után
              kapott teljes köszönőoldali linket, vagy nézd meg a profilodat, ha be voltál
              jelentkezve.
            </p>
            <p className="mt-3 text-sm text-ivory/58">
              Vendégvásárlásnál a vásárlási email cím a legfontosabb azonosító. Ha nem találod a
              linket vagy az emailt, írj nekünk arról a címről, amellyel vásároltál.
            </p>
            <SupportContact className="mt-4" />
          </Section>
          <div className="flex flex-wrap gap-3">
            <Link to="/profil" className="btn-gold">
              Profil megnyitása
            </Link>
            <Link
              to="/arak"
              className="inline-flex items-center justify-center rounded-md border border-[oklch(0.78_0.10_80/0.28)] px-4 py-3 text-sm text-ivory/75 hover:text-gold"
            >
              Vissza az árakhoz
            </Link>
          </div>
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
          <Section eyebrow="Rendelés egyeztetése" title="A fizetésed ettől nem vész el">
            A rendelés állapota most nem frissült, de ez nem jelenti azt, hogy a fizetéseddel baj
            lenne. Frissítsd az oldalt pár perc múlva, vagy írj nekünk a vásárlási email címedről.
            <SupportContact className="mt-4" />
          </Section>
        )}
        {orderLookupPending && !order && !err && (
          <Section eyebrow="Fizetés egyeztetése">
            <p>
              A fizetés utáni visszatérés megérkezett, most összekapcsoljuk a vásárlásoddal. Ez néha
              pár frissítési körrel később látszik ezen az oldalon.
            </p>
            <p className="mt-3 text-sm text-ivory/60">
              Az oldalt nyugodtan hagyd nyitva. Ha sikeres volt a fizetés, a rendelés nem vész el;
              amint az egyeztetés lezárul, itt folytatjuk az olvasat elkészítésével.
            </p>
            {pollingPaused && (
              <p className="mt-3 text-sm text-ivory/55">
                Ha pár perc után sem változik, frissíts rá később erre a teljes linkre, vagy írj
                nekünk a vásárlási email címedről.
              </p>
            )}
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
                  címedhez kapcsolódik, ezért érdemes ezt a teljes, biztonságos rendelési linket
                  megtartanod.
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

            <OrderCapturedSummary order={order} />

            {order.status !== "delivered" && order.status !== "failed" && (
              <Section eyebrow="Készítjük">
                <p>{orderPreparationLead(order)}</p>
                <p className="mt-3 text-sm text-ivory/60">{orderPreparationDetail(order)}</p>
                <OrderPreparationTimeline order={order} />
                {pollingPaused && <OrderPollingPaused order={order} />}
                <p className="mt-3 text-sm text-ivory/60">
                  Ha vendégként vásároltál, ezt az oldalt érdemes megtartanod. Ha bejelentkeztél, a
                  profilodban is eléred az elkészült olvasatot.
                </p>
                <p className="mt-3 text-sm text-ivory/50">
                  Ha az oldal nem frissül, írj nekünk a vásárlási email címedről, és add meg a
                  rövid rendelésazonosítót.
                </p>
                <SupportContact className="mt-4" order={order} />
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
                      <PaidReadingBody
                        body={payload.body}
                        title={payload.title}
                        productName={order.product_name}
                        orderReference={shortOrderId(order.id)}
                        generation={payload.generation}
                      />
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
                      Vendégvásárlásnál ez az oldal marad az elsődleges közvetlen hozzáférés.
                    </p>
                    {order.delivery_email_status === "attention_needed" && (
                      <DeliveryEmailNotice order={order} />
                    )}
                    <PaidReadingFeedback
                      order={order}
                      sessionId={session_id}
                      emailFeedback={feedback}
                    />
                  </Section>
                );
              })()}

            {order.status === "failed" && (
              <Section eyebrow="Rendelés biztonságban" title="Az olvasatkészítés most elakadt">
                <p>
                  A rendelésed nem veszett el: a fizetést ellenőrizzük, és az olvasatkészítést csak
                  akkor engedjük újraindítani, ha a fizetés igazoltan sikeres.
                </p>
                <p className="mt-3 text-sm text-ivory/55">
                  Ha az újrapróbálás sem rendezi, rendelés alapján utánanézünk: pótoljuk az
                  olvasathoz való hozzáférést, vagy jogos esetben visszatérítési egyeztetést
                  indítunk.
                </p>
                <div className="mt-4 flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    onClick={() => void retryFailedOrder()}
                    disabled={retryingFailedOrder}
                    className="inline-flex items-center justify-center rounded-md border border-gold/25 px-4 py-3 text-sm text-gold transition-colors hover:border-gold/60 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {retryingFailedOrder ? "Újrapróbálás…" : "Feldolgozás újrapróbálása"}
                  </button>
                  <span className="text-xs leading-relaxed text-ivory/50">
                    A gyors azonosításhoz add meg ezt is:{" "}
                    {shortOrderId(order.id) ?? "a rendelés rövid azonosítója"}.
                  </span>
                </div>
                {retryNotice && (
                  <p
                    aria-live="polite"
                    role="status"
                    className="mt-3 rounded-md border border-gold/15 bg-gold/[0.06] px-3 py-2 text-sm leading-relaxed text-ivory/62"
                  >
                    {retryNotice}
                  </p>
                )}
                <SupportContact className="mt-4" order={order} />
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

function OrderCapturedSummary({ order }: { order: OrderView }) {
  const product = PRODUCTS_BY_SLUG[order.product_slug ?? ""];
  const access =
    order.guest_email != null
      ? "biztonságos rendelési link + vásárlási email"
      : "biztonságos rendelési link + profil";
  const delivery =
    order.status === "delivered"
      ? "elkészült"
      : order.category === "delayed"
        ? order.express
          ? "részletes olvasat express határidővel; csúszásnál a gyorsítás díját külön rendezzük"
          : "részletes olvasat vállalt határidővel"
        : "azonnali olvasat, általában pár percen belül";
  const source =
    product?.sourceRoute || order.source_route
      ? "az előző olvasati útvonaladhoz kapcsolva"
      : "a rendelésedhez kapcsolva";

  return (
    <Section eyebrow="Ezt rögzítettük">
      <dl className="grid gap-3 text-sm leading-relaxed sm:grid-cols-2">
        <div className="rounded-md border border-gold/10 bg-black/10 px-3 py-2">
          <dt className="text-[10px] uppercase tracking-[0.2em] text-gold/65">Olvasat</dt>
          <dd className="mt-1 text-ivory/68">{order.product_name}</dd>
        </div>
        <div className="rounded-md border border-gold/10 bg-black/10 px-3 py-2">
          <dt className="text-[10px] uppercase tracking-[0.2em] text-gold/65">Elérés</dt>
          <dd className="mt-1 text-ivory/68">{access}</dd>
        </div>
        <div className="rounded-md border border-gold/10 bg-black/10 px-3 py-2">
          <dt className="text-[10px] uppercase tracking-[0.2em] text-gold/65">Elkészülés</dt>
          <dd className="mt-1 text-ivory/68">{delivery}</dd>
        </div>
        <div className="rounded-md border border-gold/10 bg-black/10 px-3 py-2">
          <dt className="text-[10px] uppercase tracking-[0.2em] text-gold/65">Kapcsolódás</dt>
          <dd className="mt-1 text-ivory/68">{source}</dd>
        </div>
      </dl>
      <p className="mt-3 text-xs leading-relaxed text-ivory/45">
        A személyes kérdést és a megadott adatokat nem ismételjük ki ezen az oldalon, de a rendelés
        elkészítéséhez rögzítettük őket.
      </p>
    </Section>
  );
}

function OrderPreparationTimeline({ order }: { order: OrderView }) {
  const steps =
    order.category === "delayed"
      ? [
          "A fizetés megérkezett, a kérdésedet és a megadott adatokat rögzítettük.",
          "A részletes olvasat több szakaszban készül: a megadott adatokból, kérdésből és a választott hagyomány jelképeiből áll össze.",
          ...(order.express
            ? [
                "Express rendelésnél, ha a gyorsított határidő csúszna, a rendelés nem vész el; utánanézünk, és a gyorsítás díját külön rendezzük.",
              ]
            : []),
          "Amikor elkészül, ezen a linken megnyílik; emailben is jelzünk, akkor is, ha közben bezárod az oldalt.",
        ]
      : [
          "A fizetés megérkezett, az olvasat feldolgozása elindult.",
          "Az azonnali olvasat általában pár percen belül megjelenik ezen az oldalon.",
          "Ha az email késik, ez a biztonságos rendelési link akkor is a közvetlen hozzáférésed marad.",
        ];

  return (
    <div className="mt-4 rounded-md border border-gold/15 bg-gold/[0.06] p-4">
      <div className="text-xs uppercase tracking-[0.2em] text-gold/75">Mi történik most?</div>
      <ol className="mt-3 space-y-2 text-sm leading-relaxed text-ivory/64">
        {steps.map((step, index) => (
          <li key={step} className="grid grid-cols-[1.5rem_1fr] gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-full border border-gold/25 text-[11px] text-gold/80">
              {index + 1}
            </span>
            <span>{step}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}

function OrderPollingPaused({ order }: { order: OrderView }) {
  return (
    <div className="mt-4 rounded-md border border-gold/15 bg-[oklch(0.13_0.03_292/0.68)] p-4">
      <div className="text-xs uppercase tracking-[0.2em] text-gold/75">
        Hosszabb ellenőrzés alatt
      </div>
      <p className="mt-2 text-sm leading-relaxed text-ivory/64">
        Az automatikus frissítés most hosszabb várakozás után megállt, de a rendelésed nem tűnt el.
        Ezt a biztonságos linket érdemes megtartanod; ha az olvasat elkészül, itt, emailben és
        bejelentkezett vásárlásnál a profilodban is elérhető lesz.
      </p>
      <p className="mt-2 text-sm leading-relaxed text-ivory/55">
        Frissíts rá később erre az oldalra. Ha sürgős, írj nekünk a vásárlási email címedről, és add
        meg a rövid rendelésazonosítót: {shortOrderId(order.id) ?? "a köszönőoldalon látható kód"}.
      </p>
      <p className="mt-2 text-sm leading-relaxed text-ivory/55">
        Ilyenkor ne indíts új fizetést és ne rendeld meg újra ugyanazt az olvasatot; ugyanerről a
        biztonságos linkről vagy a rendelésazonosító alapján rendezzük a hozzáférést.
      </p>
      <SupportContact className="mt-3" order={order} />
    </div>
  );
}

function DeliveryEmailNotice({ order }: { order?: OrderView }) {
  return (
    <div className="mt-4 rounded-md border border-gold/15 bg-gold/[0.06] px-4 py-3">
      <div className="text-xs uppercase tracking-[0.18em] text-gold/75">Email kézbesítés</div>
      <p className="mt-2 text-sm leading-relaxed text-ivory/62">
        Az olvasatod már elkészült, ezért innen biztonságosan elérhető akkor is, ha az email később
        érkezik meg vagy nem találod a postafiókodban.
      </p>
      <SupportContact className="mt-2" order={order} />
    </div>
  );
}

function SupportContact({ className = "", order }: { className?: string; order?: OrderView }) {
  const shortId = shortOrderId(order?.id);
  return (
    <p className={`text-sm leading-relaxed text-ivory/58 ${className}`.trim()}>
      Ügyfélszolgálat:{" "}
      <a className="text-gold hover:text-gold/80" href={supportMailto({ order })}>
        {SITE_LEGAL.supportEmail}
      </a>
      . A gyors azonosításhoz a vásárlási email címedről írj
      {shortId ? `, és add meg ezt: ${shortId}.` : "."}
    </p>
  );
}

function supportMailto({ order }: { order?: OrderView }): string {
  const orderRef = shortOrderId(order?.id) ?? "nincs rövid azonosító";
  const subject = `Jövőd.hu rendelési segítség · ${orderRef}`;
  const body = [
    "Segítséget szeretnék kérni a rendelésemhez.",
    "",
    `Rendelés: ${orderRef}`,
    order?.product_name ? `Termék: ${order.product_name}` : null,
    order?.status ? `Állapot: ${orderStatusLabel(order.status)}` : null,
    "A vásárlási email címem:",
    "Mi történt röviden:",
    "",
    "Köszönöm.",
  ]
    .filter((line): line is string => line !== null)
    .join("\n");
  return `mailto:${SITE_LEGAL.supportEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

function orderStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    pending_payment: "fizetésre vár",
    paid: "kifizetve — készítjük",
    processing: "feldolgozás alatt",
    delivered: "kész",
    failed: "sikertelen",
    refunded: "visszatérítve",
  };
  return labels[status] ?? status;
}

function PaidReadingFeedback({
  order,
  sessionId,
  emailFeedback,
}: {
  order: OrderView;
  sessionId?: string;
  emailFeedback?: FeedbackValue;
}) {
  const submitFeedback = useServerFn(submitOrderFeedbackBySession);
  const [selectedFeedback, setSelectedFeedback] = useState<FeedbackValue | null>(
    order.feedback ?? null,
  );
  const emailFeedbackHandled = useRef(false);
  const [feedbackSaving, setFeedbackSaving] = useState<FeedbackValue | null>(null);
  const [feedbackNote, setFeedbackNote] = useState("");
  const [feedbackError, setFeedbackError] = useState("");
  const shortId = shortOrderId(order.id) ?? "nincs rövid azonosító";
  const selectedOption = FEEDBACK_OPTIONS.find((option) => option.value === selectedFeedback);

  const saveFeedback = useCallback(
    async (option: (typeof FEEDBACK_OPTIONS)[number], note?: string) => {
      if (!sessionId) return;
      setFeedbackSaving(option.value);
      setFeedbackError("");
      try {
        const result = await submitFeedback({
          data: { sessionId, feedback: option.value, note: note?.trim() },
        });
        if (!result.ok) {
          setFeedbackError(
            "Most nem sikerült menteni a visszajelzést. A beírt szöveg nem vész el: az emailes út ugyanazzal a rendelésazonosítóval működik.",
          );
          return;
        }
        setSelectedFeedback(option.value);
        if (note?.trim()) setFeedbackNote(note.trim());
        trackEvent("paid_reading_feedback_clicked", {
          productSlug: order.product_slug,
          status: order.status,
          feedback: option.value,
          source: "thank_you",
          saved: true,
        });
      } catch {
        setFeedbackError(
          "Most nem sikerült menteni a visszajelzést. A beírt szöveg nem vész el: az emailes út ugyanazzal a rendelésazonosítóval működik.",
        );
      } finally {
        setFeedbackSaving(null);
      }
    },
    [order.product_slug, order.status, sessionId, submitFeedback],
  );

  useEffect(() => {
    if (
      !emailFeedback ||
      !sessionId ||
      emailFeedbackHandled.current ||
      selectedFeedback === emailFeedback ||
      feedbackSaving
    ) {
      return;
    }
    const option = FEEDBACK_OPTIONS.find((candidate) => candidate.value === emailFeedback);
    if (!option) return;
    emailFeedbackHandled.current = true;
    void saveFeedback(option);
  }, [emailFeedback, feedbackSaving, saveFeedback, selectedFeedback, sessionId]);

  return (
    <div className="mt-5 rounded-md border border-gold/15 bg-gold/[0.05] p-4">
      <div className="text-xs uppercase tracking-[0.2em] text-gold/75">Minőségi visszajelzés</div>
      <p className="mt-2 text-sm leading-relaxed text-ivory/62">
        Fontos, hogy ne csak elkészüljön az olvasat, hanem valóban használható legyen. Ha
        pontosítanál rajta, írj nekünk: rendelés alapján visszanézzük, és egy rövid pontosítási
        vázlattal segítünk megírni, mit érdemes még hozzátenni vagy melyik részt pontosítanád.
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        {FEEDBACK_OPTIONS.map((option) => {
          return (
            <button
              key={option.value}
              type="button"
              disabled={feedbackSaving != null}
              onClick={() => {
                trackEvent("paid_reading_feedback_clicked", {
                  productSlug: order.product_slug,
                  status: order.status,
                  feedback: option.value,
                  source: "thank_you",
                  saved: false,
                });
                void saveFeedback(option);
              }}
              className={`rounded-md border px-3 py-2 text-sm transition-colors ${
                selectedFeedback === option.value
                  ? "border-gold text-gold"
                  : "border-[oklch(0.78_0.10_80/0.22)] text-ivory/75 hover:border-gold hover:text-gold"
              } disabled:cursor-wait disabled:opacity-60`}
            >
              {feedbackSaving === option.value ? "Mentés…" : option.label}
            </button>
          );
        })}
      </div>
      {selectedOption && (
        <p className="mt-3 text-sm leading-relaxed text-ivory/62">
          Köszönjük, mentettük a visszajelzést.{" "}
          {selectedOption.value === "accurate"
            ? "Ez segít látni, mely termékek működnek igazán jól."
            : "Ha leírod pár szóban, mit pontosítanál, abból gyorsabban tanulunk."}
        </p>
      )}
      {selectedOption && selectedOption.value !== "accurate" && (
        <div className="mt-3 rounded-md border border-[oklch(0.78_0.10_80/0.14)] bg-black/10 p-3">
          <label className="block text-xs uppercase tracking-[0.18em] text-gold/70">
            Mit finomítsunk?
          </label>
          <textarea
            value={feedbackNote}
            onChange={(event) => setFeedbackNote(event.target.value)}
            maxLength={600}
            rows={3}
            placeholder="Pl. a kérdésem érzelmi részét szeretném pontosítani, vagy ezt a kapcsolati mintát érdemes még hozzátenni..."
            className="mt-2 w-full rounded-md border border-[oklch(0.78_0.10_80/0.18)] bg-transparent px-3 py-2 text-sm text-ivory outline-none placeholder:text-ivory/35 focus:border-gold/65"
          />
          <div className="mt-2 flex flex-wrap items-center gap-3">
            <button
              type="button"
              disabled={feedbackSaving != null || !feedbackNote.trim()}
              onClick={() => void saveFeedback(selectedOption, feedbackNote)}
              className="rounded-md border border-gold/25 px-3 py-2 text-xs text-gold transition-colors hover:border-gold/60 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {feedbackSaving === selectedOption.value ? "Mentés..." : "Pontosítás mentése"}
            </button>
            <a
              className="text-xs text-gold hover:text-gold/80"
              href={feedbackMailto({
                order,
                shortId,
                feedback: selectedOption.label,
                body: selectedOption.body,
                note: feedbackNote,
              })}
            >
              Inkább emailben írom le
            </a>
          </div>
        </div>
      )}
      {feedbackError && (
        <p aria-live="polite" className="mt-3 text-sm text-amber-200/80">
          {feedbackError}
        </p>
      )}
      <p className="mt-3 text-xs leading-relaxed text-ivory/45">
        A levélben csak a rendelés rövid azonosítója és a termék neve szerepel előre kitöltve, az
        olvasat teljes szövegét nem tesszük bele automatikusan.
      </p>
    </div>
  );
}

function feedbackMailto(opts: {
  order: OrderView;
  shortId: string;
  feedback: string;
  body: string;
  note?: string;
}): string {
  const subject = `Jövőd.hu visszajelzés · ${opts.shortId}`;
  const note = typeof opts.note === "string" ? opts.note.trim().slice(0, 600) : "";
  const body = [
    opts.body,
    "",
    `Visszajelzés: ${opts.feedback}`,
    `Rendelés: ${opts.shortId}`,
    `Termék: ${opts.order.product_name}`,
    "",
    "Nem kell a teljes olvasatot bemásolni; elég megírni, mi kapcsolódott, mit szeretnél pontosítani, és mit érdemes még hozzátenni.",
    "",
    "Röviden ezt szeretném hozzátenni:",
    note || "",
  ].join("\n");
  return `mailto:${SITE_LEGAL.supportEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

function orderPreparationLead(order: OrderView): string {
  if (order.category === "delayed") {
    return "A részletes olvasatod rögzítve van. A megadott kérdést, adatokat és témát több szakaszban, a választott hagyomány jelképeivel dolgozzuk össze.";
  }
  return "A személyes olvasatod ezen az oldalon jelenik meg, amint elkészült. Az azonnali termékek általában pár percen belül megérkeznek.";
}

function orderPreparationDetail(order: OrderView): string {
  if (order.category === "delayed") {
    const deadline = order.deliver_by ? new Date(order.deliver_by).toLocaleString("hu-HU") : null;
    const base = deadline
      ? `A vállalt határidő: ${deadline}. Addig ezt a biztonságos rendelési linket érdemes megtartanod; elkészüléskor emailben is jelzünk.`
      : "A részletes elemzést gondosabb szövegezéssel készítjük el; amikor kész, ezen a biztonságos rendelési linken és emailben is eléred.";
    if (!order.express) return base;
    return `${base} Express rendelésnél, ha a gyorsított határidő csúszna, a rendelés nem vész el; utánanézünk, és a gyorsítás díját külön rendezzük.`;
  }
  return "Ha a fizetés már sikeres volt, de az oldal még készítést mutat, pár percig hagyd nyitva vagy frissítsd később ugyanerről a biztonságos linkről.";
}

function safeOrderStatusErrorMessage(error: unknown): string {
  const raw = error instanceof Error ? error.message.toLocaleLowerCase("hu-HU") : "";
  if (raw.includes("rendelés nem található")) {
    return "Ezt a rendelési linket most nem találtuk. Ellenőrizd, hogy a fizetés utáni teljes linket nyitottad-e meg.";
  }
  return "A rendelés állapota most nem frissült. A rendelés nem vész el; frissítsd az oldalt pár perc múlva, vagy írj nekünk a vásárlási email címedről.";
}
