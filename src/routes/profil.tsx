import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Layout } from "@/components/Layout";
import { PageHeader, Section } from "@/components/Section";
import { useAuth } from "@/hooks/useAuth";
import { getMyOrders } from "@/lib/payments.functions";
import { formatHuf } from "@/lib/products";

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

function Page() {
  const { user, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const call = useServerFn(getMyOrders);
  const [orders, setOrders] = useState<any[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(true);

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/bejelentkezes" });
  }, [loading, user, navigate]);

  useEffect(() => {
    if (!user) return;
    call({}).then((r) => { setOrders(r.orders ?? []); setOrdersLoading(false); }).catch(() => setOrdersLoading(false));
  }, [user, call]);

  if (loading || !user) {
    return <Layout><PageHeader eyebrow="Profil" title="Egy pillanat…" /></Layout>;
  }

  return (
    <Layout>
      <PageHeader eyebrow="Profil" title="A te oldalad" lead={user.email ?? undefined} />
      <div className="mx-auto max-w-2xl px-4 pb-20 space-y-4">
        <Section eyebrow="Előzményeid">
          {ordersLoading && <p className="text-ivory/60 text-sm">Töltés…</p>}
          {!ordersLoading && orders.length === 0 && (
            <p className="text-ivory/70">Még nincs vásárlásod. <Link to="/" className="text-gold hover:underline">Indulj el itt.</Link></p>
          )}
          {!ordersLoading && orders.length > 0 && (
            <ul className="divide-y divide-[oklch(0.78_0.10_80/0.15)]">
              {orders.map((o) => (
                <li key={o.id} className="py-3 flex items-center justify-between gap-3">
                  <div>
                    <div className="text-ivory">{o.product_name}</div>
                    <div className="text-xs text-ivory/55 mt-0.5">
                      {new Date(o.created_at).toLocaleString("hu-HU")} · {STATUS_HU[o.status] ?? o.status}
                      {o.express ? " · express" : ""}
                    </div>
                  </div>
                  <div className="text-gold tabular-nums text-sm">{formatHuf(o.price_huf)}</div>
                </li>
              ))}
            </ul>
          )}
        </Section>

        <button onClick={() => { signOut(); navigate({ to: "/" }); }} className="w-full px-4 py-3 rounded-md border border-[oklch(0.78_0.10_80/0.3)] text-ivory/80 hover:text-gold">
          Kijelentkezés
        </button>
      </div>
    </Layout>
  );
}
