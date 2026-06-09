// SERVER-ONLY. AI helper. Reads OPENAI_API_KEY or LOVABLE_API_KEY from env.
// Used to rewrite raw source data into warm, Hungarian Jövőd.hu copy.

const AI_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";
const OPENAI_RESPONSES_URL = "https://api.openai.com/v1/responses";
// A prémium szövegező réteg külső API-n GPT 5.2-t használhat. A konkrét
// gateway-modell env-ből felülírható, de az alapértelmezett referencia 5.2.
const LOVABLE_MODEL = process.env.LOVABLE_AI_MODEL ?? "openai/gpt-5.2";
const LOVABLE_FALLBACK_MODEL = process.env.LOVABLE_AI_FALLBACK_MODEL ?? "google/gemini-2.5-flash";
const OPENAI_MODEL = process.env.OPENAI_READING_MODEL ?? "gpt-5.2";

export type AiResult<T> = { ok: boolean; data: T | null; error?: string };

export async function aiJSON<T>(opts: {
  system: string;
  user: string;
  // Optional JSON schema name for structured output.
  schemaName?: string;
  schema?: Record<string, unknown>;
  model?: string;
  openaiModel?: string;
  lovableModel?: string;
  allowLovableFallback?: boolean;
  providerPreference?: "lovable_first" | "openai_first";
  readingType?: string;
}): Promise<AiResult<T>> {
  const started = Date.now();
  const preference = opts.providerPreference ?? "lovable_first";
  const openaiModel = opts.openaiModel ?? opts.model ?? OPENAI_MODEL;
  const lovableModel = opts.lovableModel ?? opts.model ?? LOVABLE_MODEL;
  const allowLovableFallback = opts.allowLovableFallback ?? true;
  let openaiAttempted = false;
  let lastError: string | undefined;

  if (preference === "openai_first") {
    const openaiKey = process.env.OPENAI_API_KEY;
    if (openaiKey) {
      openaiAttempted = true;
      const r = await openaiJSON<T>({ ...opts, apiKey: openaiKey, model: openaiModel });
      if (r.ok) {
        logAiCall({
          provider: "openai",
          model: openaiModel,
          ok: true,
          started,
          readingType: opts.readingType,
          fallbackUsed: false,
        });
        return r;
      }
      logAiCall({
        provider: "openai",
        model: openaiModel,
        ok: false,
        started,
        readingType: opts.readingType,
        fallbackUsed: true,
      });
      lastError = r.error;
    }
  }

  // Lovable AI Gateway. Ez marad az elsődleges
  // útvonal azoknál az olvasatoknál, ahol nincs külön prémium preferencia.
  const lovableKey = process.env.LOVABLE_API_KEY;
  if (lovableKey) {
    const primaryModel = lovableModel;
    const r = await lovableJSON<T>({ ...opts, apiKey: lovableKey, model: primaryModel });
    if (r.ok) {
      logAiCall({
        provider: "lovable",
        model: primaryModel,
        ok: true,
        started,
        readingType: opts.readingType,
        fallbackUsed: false,
      });
      return r;
    }
    lastError = r.error;
    // Ha az elsődleges gateway modell hibázik, bizonyos nem fizetős utaknál
    // megengedett a gyorsabb fallback. Prémium olvasatnál ezt letiltjuk.
    if (allowLovableFallback && primaryModel !== LOVABLE_FALLBACK_MODEL) {
      const r2 = await lovableJSON<T>({
        ...opts,
        apiKey: lovableKey,
        model: LOVABLE_FALLBACK_MODEL,
      });
      if (r2.ok) {
        logAiCall({
          provider: "lovable",
          model: LOVABLE_FALLBACK_MODEL,
          ok: true,
          started,
          readingType: opts.readingType,
          fallbackUsed: true,
        });
        return r2;
      }
      lastError = r2.error;
    }
  }

  // Másodlagos: közvetlen OpenAI hívás (ha van saját kulcs)
  const openaiKey = process.env.OPENAI_API_KEY;
  if (openaiKey && !openaiAttempted) {
    const model = openaiModel;
    const r = await openaiJSON<T>({ ...opts, apiKey: openaiKey, model });
    logAiCall({
      provider: "openai",
      model,
      ok: r.ok,
      started,
      readingType: opts.readingType,
      fallbackUsed: !r.ok,
    });
    if (!r.ok) lastError = r.error;
    return r;
  }

  return { ok: false, data: null, error: lastError ?? "no_ai_provider_available" };
}

async function lovableJSON<T>(opts: {
  apiKey: string;
  model: string;
  system: string;
  user: string;
  schemaName?: string;
  schema?: Record<string, unknown>;
}): Promise<AiResult<T>> {
  const model = opts.model;
  const body: Record<string, unknown> = {
    model,
    messages: [
      { role: "system", content: opts.system },
      { role: "user", content: opts.user },
    ],
  };
  if (opts.schema && opts.schemaName) {
    body.response_format = {
      type: "json_schema",
      json_schema: { name: opts.schemaName, strict: true, schema: opts.schema },
    };
  } else {
    body.response_format = { type: "json_object" };
  }

  let res: Response;
  try {
    res = await fetch(AI_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${opts.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(20_000),
    });
  } catch (e) {
    return { ok: false, data: null, error: e instanceof Error ? e.message : "network" };
  }
  if (!res.ok) {
    try {
      const t = await res.text();
      console.warn("[lovable_ai]", { model, status: res.status, body: t.slice(0, 400) });
    } catch {
      /* ignore */
    }
    return { ok: false, data: null, error: `http_${res.status}` };
  }
  let json: { choices?: Array<{ message?: { content?: string } }> };
  try {
    json = await res.json();
  } catch {
    return { ok: false, data: null, error: "invalid_json" };
  }
  const content = json.choices?.[0]?.message?.content ?? "";
  try {
    return { ok: true, data: JSON.parse(content) as T };
  } catch {
    return { ok: false, data: null, error: "parse_failed" };
  }
}

async function openaiJSON<T>(opts: {
  apiKey: string;
  model: string;
  system: string;
  user: string;
  schemaName?: string;
  schema?: Record<string, unknown>;
}): Promise<AiResult<T>> {
  const body: Record<string, unknown> = {
    model: opts.model,
    input: [
      { role: "system", content: opts.system },
      { role: "user", content: opts.user },
    ],
  };
  if (opts.schema && opts.schemaName) {
    body.text = {
      format: {
        type: "json_schema",
        name: opts.schemaName,
        strict: true,
        schema: opts.schema,
      },
    };
  } else {
    body.text = { format: { type: "json_object" } };
  }

  let res: Response;
  try {
    res = await fetch(OPENAI_RESPONSES_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${opts.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(22_000),
    });
  } catch (e) {
    return { ok: false, data: null, error: e instanceof Error ? e.message : "network" };
  }
  if (!res.ok) return { ok: false, data: null, error: `http_${res.status}` };

  let json: { output_text?: string; output?: Array<{ content?: Array<{ text?: string }> }> };
  try {
    json = await res.json();
  } catch {
    return { ok: false, data: null, error: "invalid_json" };
  }
  const content =
    json.output_text ??
    json.output?.flatMap((o) => o.content ?? []).find((c) => typeof c.text === "string")?.text ??
    "";
  try {
    return { ok: true, data: JSON.parse(content) as T };
  } catch {
    return { ok: false, data: null, error: "parse_failed" };
  }
}

function logAiCall(opts: {
  provider: string;
  model: string;
  ok: boolean;
  started: number;
  readingType?: string;
  fallbackUsed: boolean;
}) {
  const latencyMs = Date.now() - opts.started;
  console.info("[reading_ai]", {
    provider: opts.provider,
    model: opts.model,
    latencyMs,
    reading_type: opts.readingType ?? "unknown",
    fallbackUsed: opts.fallbackUsed,
    ok: opts.ok,
  });
}
