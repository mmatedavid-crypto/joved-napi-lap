import { createFileRoute, notFound } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { Layout } from "@/components/Layout";
import {
  checkReadingMemoryDiagnostics,
  type MemoryDiagnosticsResult,
} from "@/lib/memoryDiagnostics.functions";

export const Route = createFileRoute("/dev/memory")({
  beforeLoad: () => {
    if (import.meta.env.PROD) throw notFound();
  },
  head: () => ({
    meta: [
      { title: "Memory diagnostics — dev | Jövőd.hu" },
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
  component: Page,
});

function Page() {
  const check = useServerFn(checkReadingMemoryDiagnostics);
  const [result, setResult] = useState<MemoryDiagnosticsResult | null>(null);
  const [running, setRunning] = useState(false);

  async function runCheck() {
    setRunning(true);
    try {
      setResult(await check({}));
    } finally {
      setRunning(false);
    }
  }

  return (
    <Layout>
      <div className="mx-auto max-w-4xl px-4 md:px-6 py-10 space-y-5">
        <header>
          <div className="text-[10px] tracking-[0.3em] uppercase text-[oklch(0.78_0.10_80/0.7)]">
            Dev
          </div>
          <h1 className="font-display text-3xl text-ivory">Memory diagnostics</h1>
          <p className="text-sm text-ivory/60 mt-1 font-editorial">
            Rejtett, noindex ellenőrző oldal a személyes olvasati memória élesítéséhez.
          </p>
        </header>

        <div className="surface p-5 space-y-4">
          <button className="btn-gold" onClick={runCheck} disabled={running}>
            {running ? "Ellenőrzés…" : "Memória-tábla ellenőrzése"}
          </button>
          {result && (
            <div className="rounded-md border border-[oklch(0.78_0.10_80/0.18)] p-4 text-sm">
              <div className={result.tableReady ? "text-emerald-300" : "text-amber-300"}>
                {result.tableReady ? "tableReady=true" : "tableReady=false"}
              </div>
              <p className="mt-2 text-ivory/70">{result.message}</p>
              {result.code && <p className="mt-1 text-ivory/45">code: {result.code}</p>}
              <p className="mt-1 text-ivory/45">
                checkedAt: {new Date(result.checkedAt).toLocaleString("hu-HU")}
              </p>
            </div>
          )}
        </div>

        <div className="surface p-5 text-sm leading-relaxed text-ivory/70">
          Ez az oldal csak fejlesztői környezetben használható. Éles környezetben a memória
          állapotát szerveroldali naplókból és migrációs ellenőrzésből kell vizsgálni.
        </div>
      </div>
    </Layout>
  );
}
