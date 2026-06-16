import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Layout } from "@/components/Layout";
import { PaidReadingBody } from "@/components/PaidReadingBody";
import { PageHeader, Section } from "@/components/Section";
import { trackEvent } from "@/lib/analytics";
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
    meta: [{ title: "Köszönjük! | Jövőd.hu" }, { name: "robots", content: "noindex,nofollow" }],
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
  const [pollingPaused, setPollingPaused] = useState(false);
  const [orderLookupPending, setOrderLookupPending] = useState(false);

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
        {orderLookupPending && !order && !err && (
          <Section eyebrow="Fizetés egyeztetése">
            <p>
              A fizetés utáni visszairányítás megérkezett, most keressük hozzá a rendelési sort. Ez
              néha pár frissítési körrel később jelenik meg, főleg akkor, ha a fizetési szolgáltató
              gyorsabban küldött vissza, mint ahogy a rendelésállapot beért.
            </p>
            <p className="mt-3 text-sm text-ivory/60">
              Az oldalt nyugodtan hagyd nyitva. Ha sikeres volt a fizetés, a rendelés nem vész el;
              amint megtaláljuk, itt folytatjuk az olvasat elkészítésével.
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
                <OrderPreparationTimeline order={order} />
                {pollingPaused && <OrderPollingPaused order={order} />}
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
                      <PaidReadingBody
                        body={payload.body}
                        title={payload.title}
                        productName={order.product_name}
                        orderReference={shortOrderId(order.id)}
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
                      Vendég vásárlásnál ez az oldal marad a legbiztosabb közvetlen hozzáférés.
                    </p>
                    <PaidReadingFeedback order={order} />
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

function OrderPreparationTimeline({ order }: { order: OrderView }) {
  const steps =
    order.category === "delayed"
      ? [
          "A fizetés megérkezett, a kérdésedet és a megadott adatokat rögzítettük.",
          "A részletes olvasat több szakaszban készül, ezért nem azonnali sablonszöveget kapsz.",
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
    </div>
  );
}

function SupportContact({ className = "", orderId }: { className?: string; orderId?: string }) {
  const shortId = shortOrderId(orderId);
  return (
    <p className={`text-sm leading-relaxed text-ivory/58 ${className}`.trim()}>
      Ügyfélszolgálat:{" "}
      <a className="text-gold hover:text-gold/80" href={supportMailto(shortId)}>
        {SITE_LEGAL.supportEmail}
      </a>
      . A gyors azonosításhoz a vásárlási email címedről írj
      {shortId ? `, és add meg ezt: ${shortId}.` : "."}
    </p>
  );
}

function supportMailto(shortId?: string): string {
  const orderRef = shortId ?? "nincs rövid azonosító";
  const subject = `Jövőd.hu rendelési segítség · ${orderRef}`;
  const body = [
    "Segítséget szeretnék kérni a rendelésemhez.",
    "",
    `Rendelés: ${orderRef}`,
    "A vásárlási email címem:",
    "Mi történt röviden:",
    "",
    "Köszönöm.",
  ].join("\n");
  return `mailto:${SITE_LEGAL.supportEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

function PaidReadingFeedback({ order }: { order: OrderView }) {
  const feedbackOptions = [
    {
      label: "Eltalált",
      value: "accurate",
      body: "Az olvasat eltalált. Ezt szeretném jelezni rövid visszajelzésként.",
    },
    {
      label: "Részben talált",
      value: "partial",
      body: "Az olvasat részben talált, de van benne olyan rész, amit pontosítanék.\n\nAmi talált:\n\nAmi nem volt pontos:\n\nA helyzetemből ez maradt ki:",
    },
    {
      label: "Nem volt elég pontos",
      value: "missed",
      body: "Az olvasat nem volt elég pontos számomra. Szeretnék segítséget kérni vagy pontosítást.\n\nMelyik rész nem talált?\n\nMi az a konkrét helyzet, amit jobban figyelembe kellene venni?\n\nMilyen irányban várnék pontosítást?",
    },
  ] as const;
  const shortId = shortOrderId(order.id) ?? "nincs rövid azonosító";

  return (
    <div className="mt-5 rounded-md border border-gold/15 bg-gold/[0.05] p-4">
      <div className="text-xs uppercase tracking-[0.2em] text-gold/75">Minőségi visszajelzés</div>
      <p className="mt-2 text-sm leading-relaxed text-ivory/62">
        Fontos, hogy ne csak elkészüljön az olvasat, hanem valóban használható legyen. Ha valami nem
        talált, írj nekünk: rendelés alapján visszanézzük, és konkrét pontosítási kéréssel segítünk
        továbbmenni.
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        {feedbackOptions.map((option) => {
          const href = feedbackMailto({
            order,
            shortId,
            feedback: option.label,
            body: option.body,
          });
          return (
            <a
              key={option.value}
              href={href}
              onClick={() =>
                trackEvent("paid_reading_feedback_clicked", {
                  productSlug: order.product_slug,
                  status: order.status,
                  feedback: option.value,
                })
              }
              className="rounded-md border border-[oklch(0.78_0.10_80/0.22)] px-3 py-2 text-sm text-ivory/75 hover:border-gold hover:text-gold"
            >
              {option.label}
            </a>
          );
        })}
      </div>
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
}): string {
  const subject = `Jövőd.hu visszajelzés · ${opts.shortId}`;
  const body = [
    opts.body,
    "",
    `Visszajelzés: ${opts.feedback}`,
    `Rendelés: ${opts.shortId}`,
    `Termék: ${opts.order.product_name}`,
    "",
    "Nem kell a teljes olvasatot bemásolni; elég azt a részt vagy érzést megírni, amelyik nem talált.",
    "",
    "Röviden ezt szeretném hozzátenni:",
  ].join("\n");
  return `mailto:${SITE_LEGAL.supportEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
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
