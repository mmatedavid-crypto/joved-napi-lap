// SERVER-ONLY. Lovable AI Gateway helper. Reads LOVABLE_API_KEY from env.
// Used to rewrite raw English Roxy text into short, warm, Hungarian copy.

const AI_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";
const MODEL = "google/gemini-2.5-pro";

export type AiResult<T> = { ok: boolean; data: T | null; error?: string };

export async function aiJSON<T>(opts: {
  system: string;
  user: string;
  // Optional JSON schema name for structured output.
  schemaName?: string;
  schema?: Record<string, unknown>;
}): Promise<AiResult<T>> {
  const apiKey = process.env.LOVABLE_API_KEY;
  if (!apiKey) return { ok: false, data: null, error: "missing_lovable_api_key" };

  const body: Record<string, unknown> = {
    model: MODEL,
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
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });
  } catch (e) {
    return { ok: false, data: null, error: e instanceof Error ? e.message : "network" };
  }
  if (!res.ok) {
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