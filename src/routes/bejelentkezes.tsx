import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Layout } from "@/components/Layout";
import { PageHeader } from "@/components/Section";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { useAuth } from "@/hooks/useAuth";
import { SITE_LEGAL } from "@/lib/legal";

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
      setErr(safeAuthErrorMessage(e, mode));
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
        <section className="surface p-5">
          <div className="text-[10px] uppercase tracking-[0.24em] text-gold/75">
            Miért érdemes belépni?
          </div>
          <ul className="mt-3 space-y-2 text-sm leading-relaxed text-ivory/68">
            <li>Megtalálod a korábbi fizetős olvasataidat és rendelési állapotaidat.</li>
            <li>A személyes memória finoman emlékszik a visszatérő témáidra.</li>
            <li>A fiók létrehozása ingyenes, és nem indít új fizetést.</li>
          </ul>
        </section>

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
          {err && (
            <p className="text-sm leading-relaxed text-red-300">
              {err}{" "}
              <a
                className="text-gold hover:text-gold/80"
                href={`mailto:${SITE_LEGAL.supportEmail}`}
              >
                Segítünk.
              </a>
            </p>
          )}
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

function safeAuthErrorMessage(error: unknown, mode: "signin" | "signup"): string {
  const raw = error instanceof Error ? error.message.toLocaleLowerCase("hu-HU") : "";
  if (raw.includes("invalid login") || raw.includes("invalid credentials")) {
    return "Nem egyezik az email cím és a jelszó. Ellenőrizd az adatokat, vagy regisztrálj új fiókot.";
  }
  if (raw.includes("email not confirmed") || raw.includes("not confirmed")) {
    return "Ezt az email címet még meg kell erősíteni. Nézd meg a postaládádat, és utána próbáld újra.";
  }
  if (raw.includes("already registered") || raw.includes("already exists")) {
    return "Ezzel az email címmel már van fiók. Válts belépésre, és próbáld meg úgy.";
  }
  if (raw.includes("password") && raw.includes("6")) {
    return "A jelszó legyen legalább 6 karakter hosszú.";
  }
  if (raw.includes("rate") || raw.includes("too many")) {
    return "Túl sok próbálkozás történt rövid idő alatt. Várj egy kicsit, majd próbáld újra.";
  }
  if (mode === "signup") {
    return "Most nem sikerült létrehozni a fiókot. Próbáld újra pár perc múlva.";
  }
  return "Most nem sikerült belépni. Próbáld újra pár perc múlva.";
}
