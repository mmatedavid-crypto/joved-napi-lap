import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Layout } from "@/components/Layout";
import { PageHeader } from "@/components/Section";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { useAuth } from "@/hooks/useAuth";

export const Route = createFileRoute("/bejelentkezes")({
  head: () => ({
    meta: [
      { title: "Bejelentkezés | Jövőd.hu" },
      {
        name: "description",
        content: "Jelentkezz be Google vagy Apple fiókkal — az előzményeid megmaradnak.",
      },
    ],
    links: [{ rel: "canonical", href: "/bejelentkezes" }],
  }),
  component: Page,
});

function Page() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [pwd, setPwd] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && user) navigate({ to: "/profil" });
  }, [loading, user, navigate]);

  async function oauth(provider: "google" | "apple") {
    setErr(null);
    setBusy(true);
    const r = await lovable.auth.signInWithOAuth(provider, {
      redirect_uri: window.location.origin + "/profil",
    });
    if (r.error) {
      setErr("Bejelentkezés sikertelen. Próbáld újra.");
      setBusy(false);
      return;
    }
    if (r.redirected) return;
    navigate({ to: "/profil" });
  }

  async function email_submit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setMsg(null);
    setBusy(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password: pwd,
          options: { emailRedirectTo: window.location.origin + "/profil" },
        });
        if (error) throw error;
        setMsg("Megerősítő emailt küldtünk. Kérlek nyisd meg a postaládád.");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password: pwd });
        if (error) throw error;
        navigate({ to: "/profil" });
      }
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : "Hiba történt.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Layout>
      <PageHeader
        eyebrow="Bejelentkezés"
        title={mode === "signin" ? "Üdv újra" : "Regisztráció"}
        lead="Az előzményeid megmaradnak — ingyenesen."
      />
      <div className="mx-auto max-w-md px-4 pb-20 space-y-4">
        <div className="surface p-6 space-y-3">
          <button onClick={() => oauth("google")} disabled={busy} className="w-full btn-gold">
            Folytatás Google-lel
          </button>
          <button
            onClick={() => oauth("apple")}
            disabled={busy}
            className="w-full px-4 py-3 rounded-md border border-[oklch(0.78_0.10_80/0.3)] text-ivory hover:text-gold"
          >
            Folytatás Apple-lel
          </button>
        </div>

        <div className="text-center text-xs text-ivory/40 uppercase tracking-widest">
          vagy emaillel
        </div>

        <form onSubmit={email_submit} className="surface p-6 space-y-3">
          <input
            type="email"
            required
            placeholder="email@pelda.hu"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full bg-transparent border border-[oklch(0.78_0.10_80/0.25)] rounded-md px-4 py-3 text-ivory placeholder:text-ivory/40 focus:border-gold outline-none"
          />
          <input
            type="password"
            required
            minLength={6}
            placeholder="jelszó"
            value={pwd}
            onChange={(e) => setPwd(e.target.value)}
            className="w-full bg-transparent border border-[oklch(0.78_0.10_80/0.25)] rounded-md px-4 py-3 text-ivory placeholder:text-ivory/40 focus:border-gold outline-none"
          />
          <button disabled={busy} className="w-full btn-gold">
            {mode === "signin" ? "Belépés" : "Regisztráció"}
          </button>
          {msg && <p className="text-sm text-gold">{msg}</p>}
          {err && <p className="text-sm text-red-300">{err}</p>}
          <button
            type="button"
            onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
            className="w-full text-sm text-ivory/60 hover:text-gold"
          >
            {mode === "signin" ? "Még nincs fiókom — regisztráció" : "Van fiókom — belépés"}
          </button>
        </form>

        <p className="text-center text-xs text-ivory/40">
          Vendégként is használhatod:{" "}
          <Link to="/" className="hover:text-gold">
            vissza a főoldalra
          </Link>
        </p>
      </div>
    </Layout>
  );
}
