import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Layout } from "@/components/Layout";
import { PaidReadingBody, type PaidReadingGenerationPublic } from "@/components/PaidReadingBody";
import { PageHeader, Section } from "@/components/Section";
import { useAuth } from "@/hooks/useAuth";
import { trackEvent } from "@/lib/analytics";
import {
  clearGuestPersonalization,
  getGuestReadingMemoriesForAccountImport,
} from "@/lib/guestReadingMemory";
import { SITE_LEGAL } from "@/lib/legal";
import { getMyOrders, processMyOrder, submitMyOrderFeedback } from "@/lib/payments.functions";
import { PRODUCTS_BY_SLUG, formatHuf } from "@/lib/products";
import {
  clearMyReadingMemories,
  getMyReadingMemoryOverview,
  importGuestReadingMemories,
  type ReadingMemory,
  type ReadingMemoryInsights,
} from "@/lib/readingMemory.functions";

export const Route = createFileRoute("/profil")({
  head: () => ({
    meta: [
      { title: "Profil | Jövőd.hu" },
      { name: "description", content: "Mentett húzásaid, vásárlásaid és sorsszámod." },
      { name: "robots", content: "noindex,nofollow" },
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
  feedback?: FeedbackValue | null;
  delivery_email_status?: "queued" | "attention_needed" | null;
  response_payload?: unknown;
};

type OrderResponsePayload = {
  title?: string;
  body?: string;
  generation?: PaidReadingGenerationPublic;
};

type RetryNotice = {
  kind: "success" | "info" | "error";
  text: string;
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
  const importGuestMemories = useServerFn(importGuestReadingMemories);
  const [orders, setOrders] = useState<ProfileOrder[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [ordersError, setOrdersError] = useState("");
  const [memories, setMemories] = useState<ReadingMemory[]>([]);
  const [themeSummary, setThemeSummary] = useState("");
  const [insights, setInsights] = useState<ReadingMemoryInsights | null>(null);
  const [memoriesLoading, setMemoriesLoading] = useState(true);
  const [memoryError, setMemoryError] = useState("");
  const [guestImportCount, setGuestImportCount] = useState(0);
  const [claimedGuestOrderCount, setClaimedGuestOrderCount] = useState(0);
  const [memoryClearing, setMemoryClearing] = useState(false);
  const [memoryCleared, setMemoryCleared] = useState(false);
  const [retryingOrders, setRetryingOrders] = useState<Set<string>>(() => new Set());
  const [retryNotices, setRetryNotices] = useState<Record<string, RetryNotice>>({});
  const awakenedOrders = useRef(new Set<string>());
  const guestImportAttempted = useRef(false);

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/bejelentkezes" });
  }, [loading, user, navigate]);

  useEffect(() => {
    if (!user) return;
    let stop = false;
    async function loadOrders() {
      setOrdersError("");
      const r = await call({});
      if (stop) return;
      const nextOrders = r.orders ?? [];
      setClaimedGuestOrderCount(r.claimedGuestOrderCount ?? 0);
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
      if (!stop) {
        setClaimedGuestOrderCount((current) =>
          Math.max(current, refreshed.claimedGuestOrderCount ?? 0),
        );
        setOrders(refreshed.orders ?? []);
      }
    }

    loadOrders().catch(() => {
      if (stop) return;
      setOrdersError(
        "A rendelési előzményeket most nem tudtuk betölteni. A rendeléseid ettől nem vesznek el; frissíts rá később, vagy írj nekünk a vásárlási email címedről.",
      );
      setOrdersLoading(false);
    });
    async function loadAndImportMemory() {
      try {
        setMemoryError("");
        const guestMemories = guestImportAttempted.current
          ? []
          : getGuestReadingMemoriesForAccountImport();
        guestImportAttempted.current = true;
        if (guestMemories.length) {
          const imported = await importGuestMemories({ data: { memories: guestMemories } });
          if (stop) return;
          if (imported.imported > 0) {
            clearGuestPersonalization();
            setGuestImportCount(imported.imported);
          }
        }
        const r = await loadMemory({});
        if (stop) return;
        setMemories(r.memories ?? []);
        setThemeSummary(r.themeSummary ?? "");
        setInsights(r.insights ?? null);
      } finally {
        if (!stop) setMemoriesLoading(false);
      }
    }

    loadAndImportMemory().catch(() => {
      if (stop) return;
      setMemoryError(
        "Az olvasati memóriát most nem tudtuk betölteni. Ez nem érinti a rendeléseidet, és később újra megpróbálhatod.",
      );
      setMemoriesLoading(false);
    });
    return () => {
      stop = true;
    };
  }, [user, call, wakeOrder, loadMemory, importGuestMemories]);

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

  async function retryOrder(orderId: string) {
    setRetryingOrders((current) => new Set(current).add(orderId));
    setRetryNotices((current) => {
      const next = { ...current };
      delete next[orderId];
      return next;
    });
    try {
      const result = await wakeOrder({ data: { orderId } });
      const refreshed = await call({});
      setOrders(refreshed.orders ?? []);
      if (result.ok) {
        setRetryNotices((current) => ({
          ...current,
          [orderId]: {
            kind: result.processing ? "info" : "success",
            text: result.processing
              ? "Az olvasat feldolgozása már fut. Pár perc múlva frissíts rá, vagy hagyd nyitva a profilt."
              : "Újraindítottuk a feldolgozást. Ha elkészül, itt a profilban és emailben is látni fogod.",
          },
        }));
      } else {
        setRetryNotices((current) => ({
          ...current,
          [orderId]: {
            kind: "error",
            text: result.error,
          },
        }));
      }
    } catch {
      setRetryNotices((current) => ({
        ...current,
        [orderId]: {
          kind: "error",
          text: "Most nem sikerült újraindítani a feldolgozást. A rendelés nem vész el; próbáld újra később, vagy írj nekünk a vásárlási email címedről.",
        },
      }));
    } finally {
      setRetryingOrders((current) => {
        const next = new Set(current);
        next.delete(orderId);
        return next;
      });
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
          {memoryError && (
            <ProfileLoadError message={memoryError} supportLabel="Memória betöltési segítség" />
          )}
          {!memoriesLoading && !memoryError && memories.length === 0 && (
            <div className="space-y-4">
              <p className="text-ivory/70">
                Ahogy használod az oldalt, itt finoman kirajzolódnak a visszatérő kérdéseid és
                témáid.
              </p>
              <div className="grid gap-3 sm:grid-cols-2">
                <MemoryInsightCard
                  eyebrow="Később itt látod"
                  text="milyen témához térsz vissza újra: kapcsolat, döntés, álom, sorsszám vagy napi irány"
                />
                <MemoryInsightCard
                  eyebrow="Miben segít?"
                  text="a következő olvasat nem idegenként indul, hanem óvatosan figyel a korábbi kérdéseid ívére"
                />
              </div>
              <p className="rounded-md border border-[oklch(0.78_0.10_80/0.14)] bg-black/10 px-4 py-3 text-xs leading-relaxed text-ivory/50">
                Nem készítünk belőle személyiségprofilt, biztos jövőállítást vagy szakmai
                minősítést. A memória törölhető, a rendelési előzményeid pedig külön megmaradnak.
              </p>
              <ProfileStarterActions />
            </div>
          )}
          {memoryCleared && (
            <p className="mt-3 rounded-md border border-gold/15 bg-gold/[0.06] px-4 py-3 text-sm text-ivory/68">
              Töröltük az olvasati memóriát a fiókodból és a helyi böngészőmintát ebből a
              böngészőből.
            </p>
          )}
          {guestImportCount > 0 && !memoryCleared && (
            <p className="mt-3 rounded-md border border-gold/15 bg-gold/[0.06] px-4 py-3 text-sm text-ivory/68">
              Áthoztuk a belépés előtti helyi olvasati mintáidat a profilodba. Így a következő
              olvasatok nem indulnak újra idegenként.
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
              <MemoryNextSteps memories={memories} insights={insights} />
              <ul className="divide-y divide-[oklch(0.78_0.10_80/0.15)]">
                {memories.slice(0, 6).map((memory) => (
                  <MemoryHistoryItem key={memory.id} memory={memory} />
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
          {ordersError && (
            <ProfileLoadError message={ordersError} supportLabel="Rendelési előzmény segítség" />
          )}
          {!ordersLoading && claimedGuestOrderCount > 0 && (
            <p className="mb-4 rounded-md border border-gold/15 bg-gold/[0.06] px-4 py-3 text-sm leading-relaxed text-ivory/68">
              Áthoztuk {claimedGuestOrderCount} korábbi vendégvásárlásodat ebbe a profilba, mert
              ugyanazzal az email címmel jelentkeztél be. A biztonságos rendelési linkek továbbra is
              működnek.
            </p>
          )}
          {!ordersLoading && !ordersError && orders.length === 0 && (
            <div className="space-y-4">
              <p className="text-ivory/70">
                Még nincs vásárlásod. Kezdhetsz ingyenes olvasattal, vagy választhatsz egy olcsó,
                személyes próbaolvasatot.
              </p>
              <ProfileStarterActions compact />
            </div>
          )}
          {!ordersLoading && !ordersError && orders.length > 0 && (
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

                    <OrderStatusNote
                      order={o}
                      retrying={retryingOrders.has(o.id)}
                      onRetry={() => retryOrder(o.id)}
                    />
                    {o.status === "delivered" &&
                      o.delivery_email_status === "attention_needed" && (
                        <ProfileDeliveryEmailNotice orderId={o.id} />
                      )}
                    <OrderRetryNotice notice={retryNotices[o.id]} />

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
                            <PaidReadingBody
                              body={payload.body ?? ""}
                              title={payload.title}
                              productName={o.product_name}
                              orderReference={shortOrderId(o.id)}
                              generation={payload.generation}
                            />
                          </div>
                          <ProfilePaidReadingFeedback order={o} />
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

function ProfileStarterActions({ compact = false }: { compact?: boolean }) {
  const items = [
    {
      title: "Gyors első jel",
      text: "Egy napi lap vagy mai iránytű jó belépő, ha még csak azt néznéd, megszólít-e a hang.",
      to: "/mai-lap",
      cta: "Napi lap",
    },
    {
      title: "Kapcsolati kérdés",
      text: "Randi, ex vagy bizonytalan kötődés esetén a kapcsolati útvonal hamarabb ad személyes fókuszt.",
      to: "/osszeillunk",
      cta: "Összeillünk",
    },
    {
      title: "Döntés előtt",
      text: "Ha nem jóslatot keresel, hanem tisztább belső irányt, innen érdemes indulni.",
      to: "/dontes-elott",
      cta: "Döntés előtt",
    },
    {
      title: "Születési képlet",
      text: "Ha mélyebb személyes alapot szeretnél, innen indulhat a későbbi 30 napos vagy éves térkép.",
      to: "/szuletesi-keplet",
      cta: "Képlet megnézése",
    },
  ] as const;

  return (
    <div
      className={
        compact
          ? "grid gap-3 sm:grid-cols-3"
          : "rounded-md border border-gold/15 bg-gold/[0.045] p-4"
      }
    >
      {!compact && (
        <div className="mb-3">
          <div className="text-[10px] uppercase tracking-[0.24em] text-gold/75">
            Hogyan induljon az íved?
          </div>
          <p className="mt-2 text-sm leading-relaxed text-ivory/58">
            A profil akkor lesz igazán hasznos, ha néhány kérdés után már látjuk, milyen témákhoz
            térsz vissza. Kezdhetsz könnyű, olcsó vagy ingyenes iránnyal.
          </p>
        </div>
      )}
      <div className={compact ? "contents" : "grid gap-3 sm:grid-cols-3"}>
        {items.map((item) => (
          <Link
            key={item.to}
            to={item.to}
            className="rounded-md border border-[oklch(0.78_0.10_80/0.16)] bg-black/10 p-3 transition-colors hover:border-gold/45"
          >
            <div className="font-display text-lg leading-tight text-ivory">{item.title}</div>
            <p className="mt-2 text-xs leading-relaxed text-ivory/55">{item.text}</p>
            <div className="mt-3 text-xs text-gold">{item.cta}</div>
          </Link>
        ))}
      </div>
      {!compact && (
        <div className="mt-3 border-t border-gold/10 pt-3">
          <Link to="/arak" className="text-xs text-ivory/50 hover:text-gold">
            Minden fizetős olvasat és ár áttekintése
          </Link>
        </div>
      )}
    </div>
  );
}

function getOrderPayload(payload: unknown): OrderResponsePayload | null {
  if (!payload || typeof payload !== "object") return null;
  const data = payload as Record<string, unknown>;
  const title = typeof data.title === "string" ? data.title : undefined;
  const body = typeof data.body === "string" ? data.body : undefined;
  const generation =
    data.generation && typeof data.generation === "object"
      ? (data.generation as PaidReadingGenerationPublic)
      : undefined;
  if (!title && !body) return null;
  return { title, body, generation };
}

function OrderStatusNote({
  order,
  retrying,
  onRetry,
}: {
  order: ProfileOrder;
  retrying?: boolean;
  onRetry?: () => void;
}) {
  if (order.status === "delivered") return null;

  if (order.status === "pending_payment") {
    return (
      <div className="mt-3 rounded-md border border-[oklch(0.78_0.10_80/0.14)] bg-black/10 px-3 py-2">
        <p className="text-xs leading-relaxed text-ivory/55">
          A fizetés állapotát még egyeztetjük. Ha már fizettél, pár percen belül frissülhet; a
          rendelés nem vész el, csak a fizetési visszajelzésre várunk.
        </p>
        <ProfileSupportContact className="mt-2" orderId={order.id} />
      </div>
    );
  }

  if (order.status === "paid" || order.status === "processing") {
    return (
      <div className="mt-3 rounded-md border border-gold/15 bg-gold/[0.06] px-3 py-2">
        <p className="text-xs leading-relaxed text-ivory/62">
          {profileOrderPreparationLead(order)}
        </p>
        <p className="mt-1.5 text-xs leading-relaxed text-ivory/50">
          {profileOrderPreparationDetail(order)}
        </p>
      </div>
    );
  }

  if (order.status === "failed") {
    const shortId = shortOrderId(order.id);
    return (
      <div className="mt-3 rounded-md border border-gold/20 bg-gold/[0.06] px-3 py-2">
        <p className="text-xs leading-relaxed text-ivory/65">
          A feldolgozás elakadt, de a rendelés nem vész el. Megpróbálhatod újraindítani az
          olvasatkészítést; ezt csak akkor engedjük, ha a fizetés igazoltan sikeres.
        </p>
        <p className="mt-1.5 text-xs leading-relaxed text-ivory/52">
          Ha az újrapróbálás sem rendezi, rendelés alapján utánanézünk: kézzel elkészítjük az
          olvasatot, vagy visszatérítjük.
        </p>
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={onRetry}
            disabled={retrying}
            className="inline-flex items-center justify-center rounded-md border border-gold/25 px-3 py-2 text-xs text-gold transition-colors hover:border-gold/60 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {retrying ? "Újrapróbálás…" : "Feldolgozás újrapróbálása"}
          </button>
          <span className="text-xs leading-relaxed text-ivory/50">
            Ha továbbra is így marad, írj a vásárlási email címedről:{" "}
            <a className="text-gold hover:text-gold/80" href={profileSupportMailto(shortId)}>
              {SITE_LEGAL.supportEmail}
            </a>
            {shortId ? `. Add meg ezt is: ${shortId}.` : "."}
          </span>
        </div>
      </div>
    );
  }

  return null;
}

function OrderRetryNotice({ notice }: { notice?: RetryNotice }) {
  if (!notice) return null;
  const tone =
    notice.kind === "error"
      ? "border-red-400/25 bg-red-950/20 text-red-100/80"
      : notice.kind === "success"
        ? "border-gold/20 bg-gold/[0.07] text-ivory/70"
        : "border-[oklch(0.78_0.10_80/0.16)] bg-black/10 text-ivory/62";
  return (
    <div className={`mt-3 rounded-md border px-3 py-2 text-xs leading-relaxed ${tone}`}>
      {notice.text}
    </div>
  );
}

function ProfileDeliveryEmailNotice({ orderId }: { orderId?: string }) {
  return (
    <div className="mt-3 rounded-md border border-gold/15 bg-gold/[0.06] px-3 py-2">
      <p className="text-xs leading-relaxed text-ivory/62">
        Az olvasat elkészült és itt a profilban megnyitható. Ha az email késik vagy nem találod, ez
        a profilnézet marad a biztos hozzáférésed.
      </p>
      <ProfileSupportContact className="mt-2" orderId={orderId} />
    </div>
  );
}

function profileOrderPreparationLead(order: ProfileOrder): string {
  if (order.category === "delayed") {
    return "A részletes olvasat készül: nem azonnali sablonválasz, hanem több szakaszos elemzés a megadott adataid alapján.";
  }
  return "Az olvasat készül. Amikor elkészül, itt megnyithatod, és emailben is jelzünk.";
}

function profileOrderPreparationDetail(order: ProfileOrder): string {
  if (order.category === "delayed") {
    return order.deliver_by
      ? `Várhatóan ${new Date(order.deliver_by).toLocaleString("hu-HU")}-ig érkezik. Ha az email késik, itt a profilban akkor is megjelenik.`
      : "Amint elkészül, itt a profilban is megjelenik; emailben csak értesítünk róla.";
  }
  return "Az azonnali termékek általában pár percen belül megjelennek; ha az email késik, a profilban akkor is visszanézheted.";
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
      <a className="text-gold hover:text-gold/80" href={profileSupportMailto(shortId)}>
        {SITE_LEGAL.supportEmail}
      </a>
      {shortId ? `. Add meg ezt is: ${shortId}.` : "."}
    </p>
  );
}

function ProfileLoadError({
  message,
  supportLabel,
}: {
  message: string;
  supportLabel: string;
}) {
  return (
    <div className="rounded-md border border-gold/15 bg-gold/[0.06] px-4 py-3">
      <p className="text-sm leading-relaxed text-ivory/68">{message}</p>
      <p className="mt-2 text-xs leading-relaxed text-ivory/50">
        Segítség:{" "}
        <a className="text-gold hover:text-gold/80" href={profileLoadErrorMailto(supportLabel)}>
          {SITE_LEGAL.supportEmail}
        </a>
      </p>
    </div>
  );
}

function profileLoadErrorMailto(label: string): string {
  const subject = `Jövőd.hu profil segítség · ${label}`;
  const body = [
    "Segítséget szeretnék kérni a profilom betöltéséhez.",
    "",
    `Téma: ${label}`,
    "A vásárlási vagy belépési email címem:",
    "Mi történt röviden:",
    "",
    "Köszönöm.",
  ].join("\n");
  return `mailto:${SITE_LEGAL.supportEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

function profileSupportMailto(shortId?: string): string {
  const orderRef = shortId ?? "nincs rövid azonosító";
  const subject = `Jövőd.hu rendelési segítség · ${orderRef}`;
  const body = [
    "Segítséget szeretnék kérni a profilomban látható rendelésemhez.",
    "",
    `Rendelés: ${orderRef}`,
    "A vásárlási email címem:",
    "Mi történt röviden:",
    "",
    "Köszönöm.",
  ].join("\n");
  return `mailto:${SITE_LEGAL.supportEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

type FeedbackValue = "accurate" | "partial" | "missed";

function ProfilePaidReadingFeedback({ order }: { order: ProfileOrder }) {
  const submitFeedback = useServerFn(submitMyOrderFeedback);
  const [selectedFeedback, setSelectedFeedback] = useState<FeedbackValue | null>(
    order.feedback ?? null,
  );
  const [feedbackSaving, setFeedbackSaving] = useState<FeedbackValue | null>(null);
  const [feedbackNote, setFeedbackNote] = useState("");
  const [feedbackError, setFeedbackError] = useState("");
  const feedbackOptions = [
    {
      label: "Eltalált",
      value: "accurate" as const,
      body: "Az olvasat eltalált. Ezt szeretném jelezni rövid visszajelzésként.",
    },
    {
      label: "Részben talált",
      value: "partial" as const,
      body: "Az olvasat részben talált, de van benne olyan rész, amit pontosítanék.\n\nAmi talált:\n\nAmi nem volt pontos:\n\nA helyzetemből ez maradt ki:",
    },
    {
      label: "Nem volt elég pontos",
      value: "missed" as const,
      body: "Az olvasat nem volt elég pontos számomra. Szeretnék segítséget kérni vagy pontosítást.\n\nMelyik rész nem talált?\n\nMi az a konkrét helyzet, amit jobban figyelembe kellene venni?\n\nMilyen irányban várnék pontosítást?",
    },
  ] as const;
  const shortId = shortOrderId(order.id) ?? "nincs rövid azonosító";
  const selectedOption = feedbackOptions.find((option) => option.value === selectedFeedback);

  async function saveFeedback(option: (typeof feedbackOptions)[number], note?: string) {
    setFeedbackSaving(option.value);
    setFeedbackError("");
    try {
      const result = await submitFeedback({
        data: { orderId: order.id, feedback: option.value, note: note?.trim() },
      });
      if (!result.ok) {
        setFeedbackError("Most nem sikerült menteni a visszajelzést, de emailben elküldheted.");
        return;
      }
      setSelectedFeedback(option.value);
      if (note?.trim()) setFeedbackNote(note.trim());
      trackEvent("paid_reading_feedback_clicked", {
        productSlug: order.product_slug,
        status: order.status,
        feedback: option.value,
        source: "profile",
        saved: true,
      });
    } catch {
      setFeedbackError("Most nem sikerült menteni a visszajelzést, de emailben elküldheted.");
    } finally {
      setFeedbackSaving(null);
    }
  }

  return (
    <div className="mt-5 rounded-md border border-gold/15 bg-gold/[0.05] p-4">
      <div className="text-xs uppercase tracking-[0.2em] text-gold/75">Minőségi visszajelzés</div>
      <p className="mt-2 text-xs leading-relaxed text-ivory/58">
        Ha az olvasat nem volt elég pontos, jelezd nyugodtan. Rendelés alapján visszanézzük, és
        konkrét pontosítási kéréssel segítünk javítani.
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        {feedbackOptions.map((option) => (
          <button
            key={option.value}
            type="button"
            disabled={feedbackSaving != null}
            onClick={() => {
              trackEvent("paid_reading_feedback_clicked", {
                productSlug: order.product_slug,
                status: order.status,
                feedback: option.value,
                source: "profile",
                saved: false,
              });
              void saveFeedback(option);
            }}
            className={`rounded-md border px-3 py-2 text-xs transition-colors ${
              selectedFeedback === option.value
                ? "border-gold text-gold"
                : "border-[oklch(0.78_0.10_80/0.22)] text-ivory/70 hover:border-gold hover:text-gold"
            } disabled:cursor-wait disabled:opacity-60`}
          >
            {feedbackSaving === option.value ? "Mentés…" : option.label}
          </button>
        ))}
      </div>
      {selectedOption && (
        <p className="mt-3 text-xs leading-relaxed text-ivory/58">
          Köszönjük, mentettük a visszajelzést.{" "}
          {selectedOption.value === "accurate"
            ? "Ez segít látni, mely termékek működnek igazán jól."
            : "Ha leírod pár szóban, mi maradt ki, abból gyorsabban tanulunk."}
        </p>
      )}
      {selectedOption && selectedOption.value !== "accurate" && (
        <div className="mt-3 rounded-md border border-[oklch(0.78_0.10_80/0.14)] bg-black/10 p-3">
          <label className="block text-[11px] uppercase tracking-[0.16em] text-gold/70">
            Mi maradt ki?
          </label>
          <textarea
            value={feedbackNote}
            onChange={(event) => setFeedbackNote(event.target.value)}
            maxLength={600}
            rows={3}
            placeholder="Pl. túl általános volt, vagy nem vette figyelembe a kérdésem egyik részét..."
            className="mt-2 w-full rounded-md border border-[oklch(0.78_0.10_80/0.18)] bg-transparent px-3 py-2 text-xs text-ivory outline-none placeholder:text-ivory/35 focus:border-gold/65"
          />
          <div className="mt-2 flex flex-wrap items-center gap-3">
            <button
              type="button"
              disabled={feedbackSaving != null || !feedbackNote.trim()}
              onClick={() => void saveFeedback(selectedOption, feedbackNote)}
              className="rounded-md border border-gold/25 px-3 py-2 text-[11px] text-gold transition-colors hover:border-gold/60 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {feedbackSaving === selectedOption.value ? "Mentés..." : "Pontosítás mentése"}
            </button>
            <a
              className="text-[11px] text-gold hover:text-gold/80"
              href={profileFeedbackMailto({
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
      {feedbackError && <p className="mt-3 text-xs text-amber-200/80">{feedbackError}</p>}
      <p className="mt-3 text-[11px] leading-relaxed text-ivory/42">
        A levélbe csak a rendelés rövid azonosítója és a termék neve kerül előre kitöltve, az
        olvasat teljes szövegét nem tesszük bele automatikusan.
      </p>
    </div>
  );
}

function profileFeedbackMailto(opts: {
  order: ProfileOrder;
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
    "Nem kell a teljes olvasatot bemásolni; elég azt a részt vagy érzést megírni, amelyik nem talált.",
    "",
    "Röviden ezt szeretném hozzátenni:",
    note || "",
  ].join("\n");
  return `mailto:${SITE_LEGAL.supportEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

function MemoryNextSteps({
  memories,
  insights,
}: {
  memories: ReadingMemory[];
  insights: ReadingMemoryInsights | null;
}) {
  const items = memoryNextStepItems(memories, insights);
  return (
    <div className="rounded-md border border-[oklch(0.78_0.10_80/0.14)] bg-black/10 p-4">
      <div className="text-[11px] uppercase tracking-[0.18em] text-gold/70">
        Következő jó kérdés
      </div>
      <p className="mt-2 text-sm leading-relaxed text-ivory/62">
        Ha továbbviszed ezt az ívet, nem kell újra nulláról indulnod. Válassz egy irányt, ami most
        természetesen kapcsolódik a visszatérő mintáidhoz.
      </p>
      <div className="mt-4 grid gap-2 sm:grid-cols-3">
        {items.map((item) => (
          <Link
            key={item.to}
            to={item.to}
            className="rounded-md border border-gold/15 px-3 py-3 text-sm text-ivory/68 transition-colors hover:border-gold/45 hover:text-gold"
          >
            <span className="block text-gold/85">{item.label}</span>
            <span className="mt-1 block text-xs leading-relaxed text-ivory/48">{item.reason}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}

function memoryNextStepItems(
  memories: ReadingMemory[],
  insights: ReadingMemoryInsights | null,
): Array<{ label: string; reason: string; to: string }> {
  const text = [
    insights?.weeklySummary,
    insights?.monthlySummary,
    insights?.recurringQuestion,
    insights?.changeSinceLast,
    ...memories
      .slice(0, 6)
      .flatMap((memory) => [
        memory.reading_type,
        memory.topic,
        memory.situation,
        memory.title,
        ...(memory.anchors ?? []),
      ]),
  ]
    .filter(Boolean)
    .join(" ")
    .toLocaleLowerCase("hu-HU");

  const suggestions: Array<{ label: string; reason: string; to: string }> = [];
  const push = (item: { label: string; reason: string; to: string }) => {
    if (!suggestions.some((existing) => existing.to === item.to)) suggestions.push(item);
  };

  if (/több ember|több összeill|választási minta|több kapcsolat/.test(text)) {
    push({
      label: "Kapcsolati mintázat tisztázása",
      reason:
        "ha nem csak egy ember érdekel, hanem az, milyen biztonságot vagy visszajelzést keresel újra több kapcsolatban",
      to: "/osszeillunk",
    });
  }
  if (/kapcsolat|összeill|compatibility|love|randi|ex|visszatér/.test(text)) {
    push({
      label: "Kapcsolati dinamika",
      reason: "ha ugyanaz a kötődés vagy visszatérő történet kér figyelmet",
      to: "/osszeillunk",
    });
  }
  if (/dönt|dont|decision|irány|munka|választás/.test(text)) {
    push({
      label: "Döntés előtt",
      reason: "ha nem új jóslat kell, hanem tisztább belső szempont",
      to: "/dontes-elott",
    });
  }
  if (/álom|alom|dream/.test(text)) {
    push({
      label: "Álomfejtés",
      reason: "ha képekben és visszatérő érzésekben jelenik meg a téma",
      to: "/alomfejtes",
    });
  }
  if (/horoszkóp|horoszkop|asztrol|tranzit|születési|keplet|képlet|időszak|hetek|hónap|month|year/.test(text)) {
    push({
      label: "30 napos térkép",
      reason: "ha nem napi jegyszöveg kell, hanem személyesebb időszaki fókusz",
      to: "/szemelyes-30-napos-horoszkop",
    });
  }
  push({
    label: "Három lap",
    reason: "ha a múlt, jelen és lehetséges irány együtt érdekel",
    to: "/harom-lap",
  });
  push({
    label: "Mai iránytű",
    reason: "ha csak egy rövid, használható napi fókuszt szeretnél",
    to: "/mai-iranytu",
  });

  return suggestions.slice(0, 3);
}

function MemoryHistoryItem({ memory }: { memory: ReadingMemory }) {
  const continuation = memoryContinuation(memory);
  return (
    <li className="py-4">
      <div className="flex items-center justify-between gap-3">
        <div className="text-ivory">{memory.title || memory.topic || "Olvasat"}</div>
        <div className="text-xs text-ivory/45">
          {new Date(memory.created_at).toLocaleDateString("hu-HU")}
        </div>
      </div>
      <p className="mt-1 text-sm text-ivory/60">{memory.one_sentence || memory.summary}</p>
      <div className="mt-3 rounded-md border border-gold/10 bg-gold/[0.035] px-3 py-3">
        <div className="text-[11px] uppercase tracking-[0.16em] text-gold/70">Folytasd innen</div>
        <p className="mt-1 text-xs leading-relaxed text-ivory/52">{continuation.reason}</p>
        <Link
          to={continuation.to}
          className="mt-2 inline-flex text-xs text-gold transition-colors hover:text-gold/80"
        >
          {continuation.label}
        </Link>
      </div>
    </li>
  );
}

function memoryContinuation(memory: ReadingMemory): { label: string; reason: string; to: string } {
  const source = [
    memory.reading_type,
    memory.topic,
    memory.situation,
    memory.title,
    memory.one_sentence,
    memory.summary,
    ...(memory.anchors ?? []),
  ]
    .filter(Boolean)
    .join(" ")
    .toLocaleLowerCase("hu-HU");

  if (/kapcsolat|összeill|compatibility|love|randi|ex|visszatér/.test(source)) {
    return {
      label: "Kapcsolati dinamika folytatása",
      reason:
        "Ha ez a kapcsolat vagy visszatérő kötődés még dolgozik benned, innen nem újrakezded, hanem pontosabban nézed a tempót és a szándékot.",
      to: "/osszeillunk",
    };
  }
  if (/dönt|dont|decision|választás|munka|költöz|irány/.test(source)) {
    return {
      label: "Döntés újranézése",
      reason:
        "Ha azóta sem lett tiszta a belső igen vagy nem, érdemes ugyanazt a döntést szűkebb kérdéssel továbbvinni.",
      to: "/dontes-elott",
    };
  }
  if (/álom|alom|dream/.test(source)) {
    return {
      label: "Álom továbbfejtése",
      reason:
        "Ha ugyanaz az érzés vagy kép visszatért, a folytatásban már az álom hangulatát is érdemes hozzátenni.",
      to: "/alomfejtes",
    };
  }
  if (/szám|szam|numerology|sors|életút|születésnap|személyes év/.test(source)) {
    return {
      label: "Számmisztikai ív mélyítése",
      reason:
        "Ha a szám nem csak címke volt, hanem működésmód, nézd meg újra teljes névvel vagy az idei személyes év felől.",
      to: "/szammisztika",
    };
  }
  if (/horoszkóp|horoszkop|asztrol|tranzit|képlet|keplet|hold|időszak/.test(source)) {
    return {
      label: "Időszakos térkép folytatása",
      reason:
        "Ha nem napi jegyszöveget keresel, hanem azt, milyen időminőség ismétlődik körülötted, innen érdemes továbbmenni.",
      to: "/szemelyes-30-napos-horoszkop",
    };
  }
  if (/tarot|lap|húzás|huzas|kártya/.test(source)) {
    return {
      label: "Három lapos folytatás",
      reason:
        "Ha egy lap megállított, a következő jó kérdés már nem mindenre kérdez rá, hanem a történet múltjára, jelenére és irányára.",
      to: "/harom-lap",
    };
  }
  return {
    label: "Mai iránytű folytatása",
    reason:
      "Ha az olvasatban volt egy mondat, ami veled maradt, vidd tovább rövid napi fókuszként.",
    to: "/mai-iranytu",
  };
}

function MemoryInsightCard({ eyebrow, text }: { eyebrow: string; text: string }) {
  return (
    <div className="rounded-md border border-[oklch(0.78_0.10_80/0.16)] bg-black/15 p-4">
      <div className="text-[11px] uppercase tracking-[0.18em] text-gold/70">{eyebrow}</div>
      <p className="mt-2 text-sm leading-relaxed text-ivory/72">{text}</p>
    </div>
  );
}
