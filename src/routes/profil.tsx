import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Layout } from "@/components/Layout";
import { PaidReadingBody } from "@/components/PaidReadingBody";
import { PageHeader, Section } from "@/components/Section";
import { useAuth } from "@/hooks/useAuth";
import { clearGuestPersonalization } from "@/lib/guestReadingMemory";
import { SITE_LEGAL } from "@/lib/legal";
import { getMyOrders, processMyOrder } from "@/lib/payments.functions";
import { PRODUCTS_BY_SLUG, formatHuf } from "@/lib/products";
import {
  clearMyReadingMemories,
  getMyReadingMemoryOverview,
  type ReadingMemory,
  type ReadingMemoryInsights,
} from "@/lib/readingMemory.functions";

export const Route = createFileRoute("/profil")({
  head: () => ({
    meta: [
      { title: "Profil | Jövőd.hu" },
      { name: "description", content: "Mentett húzásaid, vásárlásaid és sorsszámod." },
    ],
    links: [{ rel: "canonical", href: "/profil" }],
  }),
  component: Page,
});

const STATUS_HU: Record<string, string> = {
  pending_payment: "fizetésre vár",
  paid: "kifizetve — készítjük",
  processing: "feldolgozás alatt",
  delivered: "kész",
  failed: "sikertelen",
  refunded: "visszatérítve",
};

type ProfileOrder = {
  id: string;
  product_slug: string;
  product_name: string;
  created_at: string;
  status: string;
  express: boolean | null;
  price_huf: number;
  category: string;
  source_route?: string | null;
  deliver_by?: string | null;
  delivered_at?: string | null;
  response_payload?: unknown;
};

type OrderResponsePayload = {
  title?: string;
  body?: string;
};

function shortOrderId(id: string | undefined | null): string | undefined {
  return id ? id.slice(0, 8).toUpperCase() : undefined;
}

function Page() {
  const { user, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const call = useServerFn(getMyOrders);
  const wakeOrder = useServerFn(processMyOrder);
  const loadMemory = useServerFn(getMyReadingMemoryOverview);
  const clearMemory = useServerFn(clearMyReadingMemories);
  const [orders, setOrders] = useState<ProfileOrder[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [memories, setMemories] = useState<ReadingMemory[]>([]);
  const [themeSummary, setThemeSummary] = useState("");
  const [insights, setInsights] = useState<ReadingMemoryInsights | null>(null);
  const [memoriesLoading, setMemoriesLoading] = useState(true);
  const [memoryClearing, setMemoryClearing] = useState(false);
  const [memoryCleared, setMemoryCleared] = useState(false);
  const awakenedOrders = useRef(new Set<string>());

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/bejelentkezes" });
  }, [loading, user, navigate]);

  useEffect(() => {
    if (!user) return;
    let stop = false;
    async function loadOrders() {
      const r = await call({});
      if (stop) return;
      const nextOrders = r.orders ?? [];
      setOrders(nextOrders);
      setOrdersLoading(false);

      const wakeable = nextOrders.filter(
        (order) =>
          (order.status === "paid" || order.status === "processing") &&
          !awakenedOrders.current.has(order.id),
      );
      if (!wakeable.length) return;
      for (const order of wakeable) awakenedOrders.current.add(order.id);
      await Promise.allSettled(wakeable.map((order) => wakeOrder({ data: { orderId: order.id } })));
      if (stop) return;
      const refreshed = await call({});
      if (!stop) setOrders(refreshed.orders ?? []);
    }

    loadOrders().catch(() => setOrdersLoading(false));
    loadMemory({})
      .then((r) => {
        setMemories(r.memories ?? []);
        setThemeSummary(r.themeSummary ?? "");
        setInsights(r.insights ?? null);
        setMemoriesLoading(false);
      })
      .catch(() => setMemoriesLoading(false));
    return () => {
      stop = true;
    };
  }, [user, call, wakeOrder, loadMemory]);

  async function handleClearMemory() {
    if (
      !window.confirm(
        "Töröljük az olvasati memóriádat ebből a fiókból és ebből a böngészőből? A korábbi rendeléseid megmaradnak.",
      )
    ) {
      return;
    }
    setMemoryClearing(true);
    try {
      await clearMemory({});
      clearGuestPersonalization();
      setMemories([]);
      setThemeSummary("");
      setInsights(null);
      setMemoryCleared(true);
    } finally {
      setMemoryClearing(false);
    }
  }

  if (loading || !user) {
    return (
      <Layout>
        <PageHeader eyebrow="Profil" title="Egy pillanat…" />
      </Layout>
    );
  }

  return (
    <Layout>
      <PageHeader eyebrow="Profil" title="A te oldalad" lead={user.email ?? undefined} />
      <div className="mx-auto max-w-2xl px-4 pb-20 space-y-4">
        <Section eyebrow="Visszatérő mintáid">
          <p className="mb-4 text-sm leading-relaxed text-ivory/58">
            Itt csak rövid olvasati mintákat őrzünk: milyen témákhoz térsz vissza, milyen kérdést
            tettél fel, és mi volt az olvasat lényege. Ezt azért használjuk, hogy ne minden nap
            idegenként induljon az oldal, de nem készítünk belőle biztos jövőállítást vagy szakmai
            profilt. A vendég böngészőminták legfeljebb 180 napig maradnak meg.
          </p>
          {memoriesLoading && <p className="text-ivory/60 text-sm">Töltés…</p>}
          {!memoriesLoading && memories.length === 0 && (
            <p className="text-ivory/70">
              Ahogy használod az oldalt, itt finoman kirajzolódnak a visszatérő kérdéseid és témáid.
            </p>
          )}
          {memoryCleared && (
            <p className="mt-3 rounded-md border border-gold/15 bg-gold/[0.06] px-4 py-3 text-sm text-ivory/68">
              Töröltük az olvasati memóriát a fiókodból és a helyi böngészőmintát ebből a
              böngészőből.
            </p>
          )}
          {!memoriesLoading && memories.length > 0 && (
            <div className="space-y-4">
              {themeSummary && <p className="font-editorial text-ivory/75">{themeSummary}</p>}
              {insights && (
                <div className="grid gap-3 sm:grid-cols-2">
                  <MemoryInsightCard eyebrow="Heti ív" text={insights.weeklySummary} />
                  <MemoryInsightCard eyebrow="Havi ív" text={insights.monthlySummary} />
                  <MemoryInsightCard
                    eyebrow="Miben kérdezel újra?"
                    text={insights.recurringQuestion}
                  />
                  <MemoryInsightCard eyebrow="Mi változott?" text={insights.changeSinceLast} />
                </div>
              )}
              {insights?.gentleNudge && (
                <p className="rounded-md border border-gold/20 bg-gold/10 px-4 py-3 text-sm text-ivory/75">
                  {insights.gentleNudge}
                </p>
              )}
              <ul className="divide-y divide-[oklch(0.78_0.10_80/0.15)]">
                {memories.slice(0, 6).map((memory) => (
                  <li key={memory.id} className="py-3">
                    <div className="flex items-center justify-between gap-3">
                      <div className="text-ivory">{memory.title || memory.topic || "Olvasat"}</div>
                      <div className="text-xs text-ivory/45">
                        {new Date(memory.created_at).toLocaleDateString("hu-HU")}
                      </div>
                    </div>
                    <p className="text-sm text-ivory/60 mt-1">
                      {memory.one_sentence || memory.summary}
                    </p>
                  </li>
                ))}
              </ul>
              <button
                onClick={handleClearMemory}
                disabled={memoryClearing}
                className="text-xs text-ivory/45 hover:text-gold"
              >
                {memoryClearing ? "Törlés…" : "Olvasati memória törlése a fiókból és böngészőből"}
              </button>
              <p className="text-xs leading-relaxed text-ivory/42">
                A törlés nem érinti a rendelési előzményeket és a számlázási célból szükséges
                adatokat. A részleteket az adatkezelési tájékoztatóban találod.
              </p>
            </div>
          )}
        </Section>

        <Section eyebrow="Előzményeid">
          {ordersLoading && <p className="text-ivory/60 text-sm">Töltés…</p>}
          {!ordersLoading && orders.length === 0 && (
            <p className="text-ivory/70">
              Még nincs vásárlásod.{" "}
              <Link to="/" className="text-gold hover:underline">
                Indulj el itt.
              </Link>
            </p>
          )}
          {!ordersLoading && orders.length > 0 && (
            <ul className="divide-y divide-[oklch(0.78_0.10_80/0.15)]">
              {orders.map((o) => {
                const payload = getOrderPayload(o.response_payload);
                const canOpen = o.status === "delivered" && payload?.body;
                const continuePath =
                  o.source_route ?? PRODUCTS_BY_SLUG[o.product_slug]?.sourceRoute;
                return (
                  <li key={o.id} className="py-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="text-ivory">{o.product_name}</div>
                        <div className="text-xs text-ivory/55 mt-0.5">
                          {new Date(o.created_at).toLocaleString("hu-HU")} ·{" "}
                          {STATUS_HU[o.status] ?? o.status}
                          {o.express ? " · express" : ""}
                        </div>
                        <div className="mt-1 text-[11px] tracking-[0.14em] text-ivory/38">
                          Rendelés: {shortOrderId(o.id)}
                        </div>
                        {o.deliver_by && o.status !== "delivered" && o.status !== "failed" && (
                          <div className="mt-1 text-xs text-ivory/45">
                            Várható elkészülés: {new Date(o.deliver_by).toLocaleString("hu-HU")}
                          </div>
                        )}
                        {o.delivered_at && o.status === "delivered" && (
                          <div className="mt-1 text-xs text-ivory/45">
                            Elkészült: {new Date(o.delivered_at).toLocaleString("hu-HU")}
                          </div>
                        )}
                      </div>
                      <div className="text-gold tabular-nums text-sm">{formatHuf(o.price_huf)}</div>
                    </div>

                    <OrderStatusNote order={o} />

                    {canOpen && (
                      <details className="group mt-3 rounded-md border border-gold/15 bg-black/15 px-4 py-3">
                        <summary className="cursor-pointer list-none text-sm text-gold transition-colors group-open:text-gold/90">
                          Olvasat megnyitása
                        </summary>
                        <div className="mt-4 border-t border-gold/10 pt-4">
                          {payload.title && (
                            <h3 className="font-display text-xl text-ivory">{payload.title}</h3>
                          )}
                          <div className="mt-3">
                            <PaidReadingBody body={payload.body ?? ""} />
                          </div>
                        </div>
                      </details>
                    )}

                    {o.status === "delivered" && !payload?.body && (
                      <div className="mt-3 rounded-md border border-gold/15 bg-gold/[0.06] px-3 py-2">
                        <p className="text-sm text-ivory/62">
                          Az olvasat elkészült, de itt nem tudjuk teljes szövegként megjeleníteni.
                        </p>
                        <ProfileSupportContact className="mt-2" orderId={o.id} />
                      </div>
                    )}

                    {continuePath && (
                      <Link
                        to={continuePath}
                        className="mt-3 inline-flex items-center justify-center rounded-md border border-[oklch(0.78_0.10_80/0.22)] px-3 py-2 text-xs text-ivory/65 hover:border-gold/60 hover:text-gold"
                      >
                        Új kérdést nézek ehhez
                      </Link>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </Section>

        <button
          onClick={() => {
            signOut();
            navigate({ to: "/" });
          }}
          className="w-full px-4 py-3 rounded-md border border-[oklch(0.78_0.10_80/0.3)] text-ivory/80 hover:text-gold"
        >
          Kijelentkezés
        </button>
      </div>
    </Layout>
  );
}

function getOrderPayload(payload: unknown): OrderResponsePayload | null {
  if (!payload || typeof payload !== "object") return null;
  const data = payload as Record<string, unknown>;
  const title = typeof data.title === "string" ? data.title : undefined;
  const body = typeof data.body === "string" ? data.body : undefined;
  if (!title && !body) return null;
  return { title, body };
}

function OrderStatusNote({ order }: { order: ProfileOrder }) {
  if (order.status === "delivered") return null;

  if (order.status === "pending_payment") {
    return (
      <div className="mt-3 rounded-md border border-[oklch(0.78_0.10_80/0.14)] bg-black/10 px-3 py-2">
        <p className="text-xs leading-relaxed text-ivory/55">
          A fizetés állapotát még egyeztetjük. Ha már fizettél, pár percen belül frissülhet.
        </p>
        <ProfileSupportContact className="mt-2" orderId={order.id} />
      </div>
    );
  }

  if (order.status === "paid" || order.status === "processing") {
    return (
      <p className="mt-3 rounded-md border border-gold/15 bg-gold/[0.06] px-3 py-2 text-xs leading-relaxed text-ivory/62">
        Az olvasat készül. Amikor elkészül, itt megnyithatod, és emailben is jelzünk.{" "}
        {order.deliver_by
          ? `Várhatóan ${new Date(order.deliver_by).toLocaleString("hu-HU")}-ig érkezik.`
          : "Az azonnali termékek általában pár percen belül megjelennek."}
      </p>
    );
  }

  if (order.status === "failed") {
    const shortId = shortOrderId(order.id);
    return (
      <p className="mt-3 rounded-md border border-gold/20 bg-gold/[0.06] px-3 py-2 text-xs leading-relaxed text-ivory/65">
        A feldolgozás elakadt, de a rendelés nem vész el. Írj a vásárlási email címedről:{" "}
        <a className="text-gold hover:text-gold/80" href={`mailto:${SITE_LEGAL.supportEmail}`}>
          {SITE_LEGAL.supportEmail}
        </a>
        {shortId ? `. Add meg ezt is: ${shortId}.` : "."} Vagy pótoljuk az olvasatot, vagy
        utánanézünk a visszatérítésnek.
      </p>
    );
  }

  return null;
}

function ProfileSupportContact({
  className = "",
  orderId,
}: {
  className?: string;
  orderId?: string;
}) {
  const shortId = shortOrderId(orderId);
  return (
    <p className={`text-xs leading-relaxed text-ivory/55 ${className}`.trim()}>
      Ha továbbra is így marad, írj a vásárlási email címedről:{" "}
      <a className="text-gold hover:text-gold/80" href={`mailto:${SITE_LEGAL.supportEmail}`}>
        {SITE_LEGAL.supportEmail}
      </a>
      {shortId ? `. Add meg ezt is: ${shortId}.` : "."}
    </p>
  );
}

function MemoryInsightCard({ eyebrow, text }: { eyebrow: string; text: string }) {
  return (
    <div className="rounded-md border border-[oklch(0.78_0.10_80/0.16)] bg-black/15 p-4">
      <div className="text-[11px] uppercase tracking-[0.18em] text-gold/70">{eyebrow}</div>
      <p className="mt-2 text-sm leading-relaxed text-ivory/72">{text}</p>
    </div>
  );
}
