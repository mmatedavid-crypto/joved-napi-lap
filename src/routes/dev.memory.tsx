import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { Layout } from "@/components/Layout";
import {
  checkReadingMemoryDiagnostics,
  type MemoryDiagnosticsResult,
} from "@/lib/memoryDiagnostics.functions";

export const Route = createFileRoute("/dev/memory")({
  head: () => ({
    meta: [
      { title: "Memory diagnostics — dev | Jövőd.hu" },
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
  component: Page,
});

const LOVABLE_TASK = `Supabase éles adatbázison futtasd le a repo migrációját:

supabase/migrations/20260608213000_reading_memories.sql

Elvárás:
- public.reading_memories tábla létrejön
- RLS engedélyezve
- authenticated csak saját user_id sorait látja/írja/törli
- service_role teljes jogosultságot kap
- indexek létrejönnek:
  - idx_reading_memories_user_created
  - idx_reading_memories_user_type
  - idx_reading_memories_anchors

Futtatás után ellenőrizd:
- /dev/memory oldalon tableReady=true legyen
- /profil oldalon a Visszatérő mintáid blokk ne dobjon hibát
- egy belépett felhasználó randi/döntés/3 lap/összeillés olvasata után keletkezzen reading_memories sor`;

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

        <div className="surface p-5">
          <div className="text-xs uppercase tracking-[0.18em] text-gold/75">Lovable teendő</div>
          <pre className="mt-3 whitespace-pre-wrap rounded-md bg-black/30 p-4 text-xs leading-relaxed text-ivory/72">
            {LOVABLE_TASK}
          </pre>
        </div>
      </div>
    </Layout>
  );
}
