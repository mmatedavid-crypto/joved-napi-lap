import { createServerFn } from "@tanstack/react-start";

export type MemoryDiagnosticsResult = {
  ok: boolean;
  tableReady: boolean;
  message: string;
  code?: string;
  checkedAt: string;
};

export const checkReadingMemoryDiagnostics = createServerFn({ method: "GET" }).handler(
  async (): Promise<MemoryDiagnosticsResult> => {
    if (process.env.NODE_ENV === "production") {
      return {
        ok: false,
        tableReady: false,
        message: "A memória-diagnosztika csak fejlesztői környezetben érhető el.",
        code: "dev_only",
        checkedAt: new Date().toISOString(),
      };
    }

    try {
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      const { error } = await supabaseAdmin
        .from("reading_memories")
        .select("id", { count: "exact", head: true })
        .limit(1);

      if (error) {
        const code = "code" in error && typeof error.code === "string" ? error.code : undefined;
        const missingTable =
          code === "PGRST205" ||
          error.message.toLocaleLowerCase("en-US").includes("reading_memories");
        return {
          ok: false,
          tableReady: false,
          code,
          message: missingTable
            ? "A reading_memories tábla még nincs létrehozva az éles Supabase sémában."
            : "A memória-diagnosztika nem futott le tisztán.",
          checkedAt: new Date().toISOString(),
        };
      }

      return {
        ok: true,
        tableReady: true,
        message: "A reading_memories tábla elérhető.",
        checkedAt: new Date().toISOString(),
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return {
        ok: false,
        tableReady: false,
        message: message.includes("Missing Supabase server environment variables")
          ? "Hiányzik a szerveroldali SUPABASE_URL vagy SUPABASE_SERVICE_ROLE_KEY."
          : "A memória-diagnosztika nem érhető el ebben a környezetben.",
        checkedAt: new Date().toISOString(),
      };
    }
  },
);
