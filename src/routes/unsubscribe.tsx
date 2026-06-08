import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";

type Status = "loading" | "valid" | "already" | "invalid" | "done" | "error";

export const Route = createFileRoute("/unsubscribe")({
  component: UnsubscribePage,
  validateSearch: (search: Record<string, unknown>) => ({
    token: typeof search.token === "string" ? search.token : "",
  }),
});

function UnsubscribePage() {
  const { token } = Route.useSearch();
  const [status, setStatus] = useState<Status>("loading");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!token) {
      setStatus("invalid");
      return;
    }
    fetch(`/email/unsubscribe?token=${encodeURIComponent(token)}`)
      .then(async (r) => {
        const j = await r.json().catch(() => ({}));
        if (!r.ok) return setStatus("invalid");
        if (j.valid) return setStatus("valid");
        if (j.reason === "already_unsubscribed") return setStatus("already");
        setStatus("invalid");
      })
      .catch(() => setStatus("error"));
  }, [token]);

  async function confirm() {
    setSubmitting(true);
    try {
      const r = await fetch("/email/unsubscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });
      const j = await r.json().catch(() => ({}));
      if (j.success) setStatus("done");
      else if (j.reason === "already_unsubscribed") setStatus("already");
      else setStatus("error");
    } catch {
      setStatus("error");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md w-full rounded-2xl border border-border bg-card p-8 text-center shadow-sm">
        <h1 className="text-2xl font-semibold text-foreground">Leiratkozás</h1>
        <p className="mt-2 text-sm text-muted-foreground">Jövőd.hu — emailek</p>

        <div className="mt-6 text-sm text-foreground">
          {status === "loading" && <p>Egy pillanat, ellenőrizzük a linket…</p>}
          {status === "invalid" && <p>Ez a leiratkozási link érvénytelen vagy lejárt.</p>}
          {status === "already" && (
            <p>Ez az email cím már le van iratkozva. Nem küldünk több üzenetet.</p>
          )}
          {status === "error" && <p>Valami megakadt. Kérlek próbáld újra később.</p>}
          {status === "valid" && (
            <>
              <p>
                Biztosan leiratkozol a Jövőd.hu emailjeiről? Ezután nem küldünk több üzenetet erre a
                címre.
              </p>
              <button
                onClick={confirm}
                disabled={submitting}
                className="mt-6 inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
              >
                {submitting ? "Folyamatban…" : "Igen, iratkozzatok le"}
              </button>
            </>
          )}
          {status === "done" && <p>Sikeresen leiratkoztál. Köszönjük, hogy velünk voltál.</p>}
        </div>
      </div>
    </main>
  );
}
