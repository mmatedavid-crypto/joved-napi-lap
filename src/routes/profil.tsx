import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Layout } from "@/components/Layout";
import { PageHeader, Section } from "@/components/Section";
import { useAuth } from "@/hooks/useAuth";
import { getMyOrders } from "@/lib/payments.functions";
import { formatHuf } from "@/lib/products";
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
  product_name: string;
  created_at: string;
  status: string;
  express: boolean | null;
  price_huf: number;
};

function Page() {
  const { user, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const call = useServerFn(getMyOrders);
  const loadMemory = useServerFn(getMyReadingMemoryOverview);
  const clearMemory = useServerFn(clearMyReadingMemories);
  const [orders, setOrders] = useState<ProfileOrder[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [memories, setMemories] = useState<ReadingMemory[]>([]);
  const [themeSummary, setThemeSummary] = useState("");
  const [insights, setInsights] = useState<ReadingMemoryInsights | null>(null);
  const [memoriesLoading, setMemoriesLoading] = useState(true);
  const [memoryClearing, setMemoryClearing] = useState(false);

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/bejelentkezes" });
  }, [loading, user, navigate]);

  useEffect(() => {
    if (!user) return;
    call({})
      .then((r) => {
        setOrders(r.orders ?? []);
        setOrdersLoading(false);
      })
      .catch(() => setOrdersLoading(false));
    loadMemory({})
      .then((r) => {
        setMemories(r.memories ?? []);
        setThemeSummary(r.themeSummary ?? "");
        setInsights(r.insights ?? null);
        setMemoriesLoading(false);
      })
      .catch(() => setMemoriesLoading(false));
  }, [user, call, loadMemory]);

  async function handleClearMemory() {
    if (!window.confirm("Töröljük az olvasati memóriádat? A korábbi rendeléseid megmaradnak.")) {
      return;
    }
    setMemoryClearing(true);
    try {
      await clearMemory({});
      setMemories([]);
      setThemeSummary("");
      setInsights(null);
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
          {memoriesLoading && <p className="text-ivory/60 text-sm">Töltés…</p>}
          {!memoriesLoading && memories.length === 0 && (
            <p className="text-ivory/70">
              Ahogy használod az oldalt, itt finoman kirajzolódnak a visszatérő kérdéseid és témáid.
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
                {memoryClearing ? "Törlés…" : "Olvasati memória törlése"}
              </button>
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
              {orders.map((o) => (
                <li key={o.id} className="py-3 flex items-center justify-between gap-3">
                  <div>
                    <div className="text-ivory">{o.product_name}</div>
                    <div className="text-xs text-ivory/55 mt-0.5">
                      {new Date(o.created_at).toLocaleString("hu-HU")} ·{" "}
                      {STATUS_HU[o.status] ?? o.status}
                      {o.express ? " · express" : ""}
                    </div>
                  </div>
                  <div className="text-gold tabular-nums text-sm">{formatHuf(o.price_huf)}</div>
                </li>
              ))}
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

function MemoryInsightCard({ eyebrow, text }: { eyebrow: string; text: string }) {
  return (
    <div className="rounded-md border border-[oklch(0.78_0.10_80/0.16)] bg-black/15 p-4">
      <div className="text-[11px] uppercase tracking-[0.18em] text-gold/70">{eyebrow}</div>
      <p className="mt-2 text-sm leading-relaxed text-ivory/72">{text}</p>
    </div>
  );
}
