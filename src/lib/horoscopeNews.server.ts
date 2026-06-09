import { cleanHUText } from "./huTextGuard";
import { SIGN_HU } from "./roxyNormalize";
import {
  PERIOD_LABEL,
  PERIOD_TO_ROXY,
  SIGN_BY_SLUG,
  SIGN_SLUGS,
  type HoroscopeNewsArticle,
  type HoroscopeNewsSection,
  type HoroscopePeriodHU,
} from "./horoscopeNews";

const NEWS_TRANSLATION_VERSION = "news-horo-hu-v4";
const DAY_SECONDS = 60 * 60 * 24;
const HOROSCOPE_NEWS_MODEL = process.env.LOVABLE_HOROSCOPE_NEWS_MODEL ?? "google/gemini-2.5-flash";
const HOROSCOPE_NEWS_TIMEOUT_MS = Number(process.env.HOROSCOPE_NEWS_TIMEOUT_MS ?? 35_000);

const TECHNICAL_FALLBACK_RE =
  /háttéradat|nem érhető el|általános magyar tartalmat|\bprovider\b|\bendpoint\b|\broxy\b|\bapi\b|\bfallback\b/i;

function todayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

function ttlFor(period: HoroscopePeriodHU): number {
  if (period === "napi") return DAY_SECONDS;
  if (period === "heti") return DAY_SECONDS * 7;
  return DAY_SECONDS * 31;
}

function datedKey(period: HoroscopePeriodHU, dateKey: string): string {
  if (period === "napi") return dateKey;
  if (period === "heti") {
    const d = new Date(`${dateKey}T00:00:00.000Z`);
    const day = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() - day + 1);
    return d.toISOString().slice(0, 10);
  }
  return dateKey.slice(0, 7);
}

function cacheDateKey(period: HoroscopePeriodHU, requested?: string): string {
  return datedKey(period, requested ?? todayKey());
}

async function readCache<T>(cacheKey: string): Promise<T | null> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  try {
    const { data } = await supabaseAdmin
      .from("api_cache")
      .select("response_payload, expires_at")
      .eq("cache_key", cacheKey)
      .maybeSingle();
    if (!data) return null;
    if (data.expires_at && new Date(data.expires_at as string).getTime() < Date.now()) return null;
    return data.response_payload as T;
  } catch {
    return null;
  }
}

function hasTechnicalFallbackText(value: unknown): boolean {
  if (typeof value === "string") return TECHNICAL_FALLBACK_RE.test(value);
  if (Array.isArray(value)) return value.some((item) => hasTechnicalFallbackText(item));
  if (!value || typeof value !== "object") return false;
  return Object.values(value as Record<string, unknown>).some((item) =>
    hasTechnicalFallbackText(item),
  );
}

async function writeCache(
  cacheKey: string,
  endpoint: string,
  payload: unknown,
  ttlSeconds: number,
): Promise<void> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  try {
    await supabaseAdmin.from("api_cache").upsert(
      {
        provider: "roxy+ai",
        endpoint,
        cache_key: cacheKey,
        request_payload: {} as never,
        response_payload: payload as never,
        expires_at: new Date(Date.now() + ttlSeconds * 1000).toISOString(),
      },
      { onConflict: "cache_key" },
    );
  } catch {
    /* cache write must not break public pages */
  }
}

const ARTICLE_SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    title: { type: "string" },
    lead: { type: "string" },
    sections: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          heading: { type: "string" },
          text: { type: "string" },
        },
        required: ["heading", "text"],
      },
    },
    luckyColor: { type: "string" },
    luckyNumber: { type: "number" },
    moonPhase: { type: "string" },
  },
  required: ["title", "lead", "sections", "luckyColor", "luckyNumber", "moonPhase"],
} as const;

type ArticleAI = {
  title: string;
  lead: string;
  sections: HoroscopeNewsSection[];
  luckyColor?: string;
  luckyNumber?: number;
  moonPhase?: string;
};

const SIGN_FALLBACK_ARCHETYPE: Record<keyof typeof SIGN_SLUGS, string> = {
  aries:
    "A Kos lendülete most gyors választ keres, de a hét valódi ereje abban lehet, ha nem minden impulzusból lesz azonnal döntés.",
  taurus:
    "A Bika számára most a biztonság, a ritmus és a testközeli józanság adhat kapaszkodót; ami túl gyorsan kér választ, azt érdemes lassabban megvizsgálni.",
  gemini:
    "Az Ikrek figyelme könnyen több irányba szalad, ezért most az lehet a kulcs, hogy ne minden gondolatból legyen külön történet.",
  cancer:
    "A Rák érzékenyebb belső antennákkal figyel, de most nem minden régi emlék kér azonnali választ; elég lehet észrevenni, mi érint meg.",
  leo: "Az Oroszlán most könnyebben érzi, hol kap figyelmet és hol nem, de a valódi erő nem a bizonyításban, hanem a méltóságteljes jelenlétben van.",
  virgo:
    "A Szűz most rendet kereshet ott is, ahol még csak alakul a kép; a túl sok elemzés helyett egy tiszta, gyakorlati lépés vihet közelebb.",
  libra:
    "A Mérleg számára a kapcsolati egyensúly kerülhet előtérbe: nem az a kérdés, mindenkinek megfelelsz-e, hanem hogy te hol maradsz benne.",
  scorpio:
    "A Skorpió most mélyebbre lát a felszínnél, de nem minden sejtés bizonyíték; a tisztaságot az adhatja, ha nem a félelem vezeti az értelmezést.",
  sagittarius:
    "A Nyilas tágabb térre vágyhat, de most a szabadság akkor ad valódi könnyebbséget, ha nem menekülésből, hanem belső irányból születik.",
  capricorn:
    "A Bak számára a felelősség és az időzítés lehet a fő téma; nem mindent kell most megoldani, de amit vállalsz, annak legyen tiszta kerete.",
  aquarius:
    "A Vízöntő most kívülről láthat rá egy régi mintára, de a távolság mellett fontos lehet az is, hogy ne szakadj el attól, ami valóban számít.",
  pisces:
    "A Halak érzékenyebben veszi át a hangulatokat, ezért most különösen fontos lehet megkülönböztetni, mi a saját érzésed és mi az, amit másoktól hozol magaddal.",
};

const SIGN_WITH_ARTICLE: Record<keyof typeof SIGN_SLUGS, string> = {
  aries: "a Kos",
  taurus: "a Bika",
  gemini: "az Ikrek",
  cancer: "a Rák",
  leo: "az Oroszlán",
  virgo: "a Szűz",
  libra: "a Mérleg",
  scorpio: "a Skorpió",
  sagittarius: "a Nyilas",
  capricorn: "a Bak",
  aquarius: "a Vízöntő",
  pisces: "a Halak",
};

const SIGN_RELATIONSHIP_FOCUS: Record<keyof typeof SIGN_SLUGS, string> = {
  aries:
    "Kapcsolatokban a gyors reakciók mögött most könnyen lehet sértettség vagy türelmetlenség. Akkor érthetőbb a helyzet, ha nem az első benyomásra válaszolsz, hanem arra, ami mögötte tényleg fontos.",
  taurus:
    "Kapcsolatokban a biztonság kérdése erősebben jelenhet meg. Ami megbízható, az most vonzóbb lehet, de érdemes figyelni, mikor válik a nyugalomhoz való ragaszkodás makacssággá.",
  gemini:
    "Kapcsolatokban sok minden fejben dől el, mégis most az számíthat, hogy a beszélgetés után könnyebbnek vagy zajosabbnak érzed-e magad. Nem minden üzenet kíván azonnali választ.",
  cancer:
    "Kapcsolatokban a régi emlékek és a jelen érzései könnyebben összecsúszhatnak. Most az lehet felszabadító, ha megkülönbözteted, ki bántott meg régen, és ki áll előtted most.",
  leo: "Kapcsolatokban a figyelem minősége fontosabb lehet, mint a mennyisége. Ha valaki lát téged, azt nem kell bizonygatni; ha nem lát, a túlzott ragyogás sem fogja pótolni.",
  virgo:
    "Kapcsolatokban most könnyű apró részletekből nagy következtetést levonni. A tisztánlátást nem az adja, ha mindent elemzel, hanem ha kimondod, mire van valóban szükséged.",
  libra:
    "Kapcsolatokban előjöhet, mennyit igazítasz magadon a béke kedvéért. A harmónia most akkor valódi, ha nem csak csend van, hanem te is jelen vagy benne.",
  scorpio:
    "Kapcsolatokban erős lehet a késztetés, hogy a sorok között olvass. A megérzés értékes, de most különösen fontos lehet nem összekeverni a mélységet a gyanakvással.",
  sagittarius:
    "Kapcsolatokban a szabadság és a kötődés közötti arány kerülhet elő. Ami őszinte, annak nem kell szűknek lennie, de a távolság sem mindig jelent valódi függetlenséget.",
  capricorn:
    "Kapcsolatokban a felelősség és az időzítés fontosabbá válhat. Nem az a kérdés, mennyit bírsz el, hanem hogy amiért tartod magad, abban van-e még kölcsönösség.",
  aquarius:
    "Kapcsolatokban most könnyebb kívülről nézni a helyzetet, mint benne maradni az érzésben. A távolság segíthet, de ne legyen menekülés attól, amit valójában kimondanál.",
  pisces:
    "Kapcsolatokban erősen átveheted mások hangulatát. Most az lehet a legfontosabb, hogy ne csak azt érezd, mire van szüksége a másiknak, hanem azt is, neked mi fér bele.",
};

const SIGN_WORK_FOCUS: Record<keyof typeof SIGN_SLUGS, string> = {
  aries:
    "Munka terén a lendület hasznos, ha iránya is van. A hónap vagy hét akkor hozhat eredményt, ha nem több fronton harcolsz, hanem egy ügyet viszel végig tisztán.",
  taurus:
    "Munka terén a stabil építkezés kedvezőbb lehet, mint a látványos fordulat. Ami lassan erősödik, most többet érhet, mint ami gyors sikernek látszik.",
  gemini:
    "Munka terén az információk szétaprózhatják a figyelmedet. Egy jól megválasztott beszélgetés vagy döntés most többet érhet, mint tíz félig elindított ötlet.",
  cancer:
    "Munka terén a hangulat erősen befolyásolhatja a teljesítményedet. Ha teremtesz magadnak egy védettebb ritmust, könnyebben látszik, mi a valódi feladat.",
  leo: "Munka terén a láthatóság témája előtérbe kerülhet. Nem kell túlmagyaráznod az értékedet; elég lehet következetesen megmutatni, hol vagy valóban erős.",
  virgo:
    "Munka terén a pontosítás most előny. Arra figyelj, hogy a javítás ne váljon halogatássá: van, amit elég jó állapotban kell továbbengedni.",
  libra:
    "Munka terén együttműködésből jöhet előrelépés, de csak akkor, ha nem te viszed csendben mindenki más aránytalanságát. A tiszta keretek most sokat számítanak.",
  scorpio:
    "Munka terén mélyebb motivációk mozoghatnak a háttérben. Érdemes észrevenni, mi az, amit valódi célból csinálsz, és mi az, amit csak kontrollból tartasz kézben.",
  sagittarius:
    "Munka terén nagyobb térre vagy új nézőpontra lehet szükséged. A szélesebb terv akkor működik, ha mellé kerül egy konkrét első lépés is.",
  capricorn:
    "Munka terén az időzítés és a felelősségvállalás hangsúlyos. Most nem a gyors könnyebbség, hanem a jól megválasztott határ adhat erőt.",
  aquarius:
    "Munka terén egy megszokott rendszer kívülről nézve már szűknek tűnhet. Az újítás jó irány lehet, ha nem csak ellenállásból, hanem tiszta felismerésből születik.",
  pisces:
    "Munka terén a megérzés segíthet, de most szüksége van néhány egyszerű kapaszkodóra. Amit leírsz, időzítesz vagy lezársz, az tehermentesítheti a fejedet.",
};

const SIGN_ATTENTION_FOCUS: Record<keyof typeof SIGN_SLUGS, string> = {
  aries:
    "Ne minden sürgetést tekints jelnek. Ami valóban fontos, az egy rövid szünet után is fontos marad.",
  taurus:
    "Ne csak azt nézd, mi biztonságos, hanem azt is, mi élő. A megszokás és a nyugalom most könnyen összekeveredhet.",
  gemini:
    "A túl sok lehetőség most nem szabadságot, hanem zajt is hozhat. Válassz kevesebb szálat, de azokkal maradj jelen.",
  cancer:
    "Nem minden érzékenység gyengeség, de nem is minden hangulat üzenet. A saját határaid most finom figyelmet kérnek.",
  leo: "A figyelem utáni vágy mögött lehet valódi kapcsolódási igény. Ne szerepből válaszolj arra, ami sebezhetőbb benned.",
  virgo:
    "A részletek segítenek, amíg nem fedik el az egészet. Most ne a tökéletes mondatot keresd, hanem a tiszta szándékot.",
  libra:
    "A békítés csak akkor működik, ha közben nem tűnsz el belőle. Figyeld meg, hol mondasz igent túl gyorsan.",
  scorpio:
    "A mélység nem mindig dráma. Néha az mutat erőt, ha nem mész bele abba a játszmába, amit már túl jól ismersz.",
  sagittarius:
    "A szabadságvágy most irányt is kér. Ne csak távolodj valamitől, nevezd meg, mi felé mennél.",
  capricorn:
    "Nem minden felelősség a tiéd. Amit tisztán vállalsz, erősít; amit megszokásból cipelsz, lassan szűkíthet.",
  aquarius:
    "A kívülálló nézőpont hasznos, de ne váljon érzelmi távolsággá. Amit fontosnak tartasz, ahhoz érdemes emberien is kapcsolódni.",
  pisces:
    "A megérzésed érzékenyebb lehet, de most szűrésre is szüksége van. Nem kell minden rezdülést magadra venned.",
};

const FALLBACK_COLORS: Record<keyof typeof SIGN_SLUGS, string> = {
  aries: "mélyvörös",
  taurus: "mohazöld",
  gemini: "világossárga",
  cancer: "ezüst",
  leo: "arany",
  virgo: "zsályazöld",
  libra: "rózsakvarc",
  scorpio: "bordó",
  sagittarius: "királykék",
  capricorn: "grafitszürke",
  aquarius: "türkiz",
  pisces: "gyöngyház",
};

function periodFocus(period: HoroscopePeriodHU): {
  leadPrefix: string;
  firstHeading: string;
  workHeading: string;
  loveHeading: string;
  attentionHeading: string;
} {
  if (period === "heti") {
    return {
      leadPrefix: "Ezen a héten",
      firstHeading: "Heti hangulat",
      workHeading: "Munka és ritmus",
      loveHeading: "Kapcsolatok",
      attentionHeading: "Mire figyelj a héten?",
    };
  }
  if (period === "havi") {
    return {
      leadPrefix: "Ebben a hónapban",
      firstHeading: "Havi irány",
      workHeading: "Munka és hosszabb táv",
      loveHeading: "Kapcsolati tér",
      attentionHeading: "Mire figyelj ebben a hónapban?",
    };
  }
  return {
    leadPrefix: "Ma",
    firstHeading: "Mai hangulat",
    workHeading: "Munka",
    loveHeading: "Szerelem",
    attentionHeading: "Mire figyelj ma?",
  };
}

function fallbackNumber(sign: keyof typeof SIGN_SLUGS, period: HoroscopePeriodHU): number {
  const signs = Object.keys(SIGN_SLUGS);
  const signIndex = Math.max(0, signs.indexOf(sign));
  const periodOffset = period === "napi" ? 1 : period === "heti" ? 3 : 6;
  return ((signIndex + periodOffset) % 9) + 1;
}

function cleanHoroscopeNewsText(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const softened = value
    .replace(/\bengedd el\b/gi, "hagyd magad mögött")
    .replace(/\bfigyelj a jelekre\b/gi, "vedd észre a finom jelzéseket")
    .replace(/\bhallgass a szívedre\b/gi, "a saját érzéseidre is figyelj")
    .replace(/\blégy önmagad\b/gi, "maradj hiteles")
    .replace(/\bkommunikálj nyíltan és őszintén\b/gi, "fogalmazz tisztán");
  const cleaned = cleanHUText(softened);
  return cleaned?.replace(
    /(^|[.!?]\s+)([a-záéíóöőúüű])/g,
    (_, prefix: string, letter: string) => `${prefix}${letter.toLocaleUpperCase("hu-HU")}`,
  );
}

function cleanHoroscopeNewsHeading(value: unknown): string | undefined {
  const cleaned = cleanHoroscopeNewsText(value);
  return cleaned ? cleaned.charAt(0).toLocaleUpperCase("hu-HU") + cleaned.slice(1) : undefined;
}

function normalizeArticle(
  raw: ArticleAI,
  meta: {
    period: HoroscopePeriodHU;
    sign: keyof typeof SIGN_SLUGS;
    signSlug: string;
    dateKey: string;
    sourceCached: boolean;
    translationCached: boolean;
    fallbackUsed: boolean;
  },
): HoroscopeNewsArticle | null {
  if (hasTechnicalFallbackText(raw)) return null;
  const title = cleanHoroscopeNewsText(raw.title);
  const lead = cleanHoroscopeNewsText(raw.lead);
  const sections = Array.isArray(raw.sections)
    ? raw.sections
        .map((s) => ({
          heading: cleanHoroscopeNewsHeading(s.heading) ?? "",
          text: cleanHoroscopeNewsText(s.text) ?? "",
        }))
        .filter((s) => s.heading && s.text)
    : [];
  if (!title || !lead || !sections.length) return null;
  const article = {
    ...meta,
    signName: SIGN_HU[meta.sign],
    title,
    lead,
    sections,
    luckyColor: cleanHUText(raw.luckyColor),
    luckyNumber: typeof raw.luckyNumber === "number" ? raw.luckyNumber : undefined,
    moonPhase: cleanHUText(raw.moonPhase),
  };
  if (hasTechnicalFallbackText(article)) return null;
  return {
    ...article,
  };
}

function localFallbackArticle(opts: {
  period: HoroscopePeriodHU;
  sign: keyof typeof SIGN_SLUGS;
  signSlug: string;
  dateKey: string;
  sourceCached: boolean;
  translationCached: boolean;
  fallbackUsed: boolean;
}): HoroscopeNewsArticle {
  const signName = SIGN_HU[opts.sign];
  const focus = periodFocus(opts.period);
  const archetype = SIGN_FALLBACK_ARCHETYPE[opts.sign];
  const signArticle = SIGN_WITH_ARTICLE[opts.sign];
  const periodFrame =
    opts.period === "havi" ? "Ez a hónap" : opts.period === "heti" ? "Ez a hét" : "Ez a nap";
  return {
    ...opts,
    signName,
    title: `${PERIOD_LABEL[opts.period]} ${signName} jegyűeknek`,
    lead: `${periodFrame} ${signArticle} számára akkor lehet igazán használható, ha nem kész jóslatként, hanem belső iránytűként olvasod. ${archetype}`,
    sections: [
      {
        heading: focus.firstHeading,
        text: `${focus.leadPrefix} ${signArticle} alapmintája erősebben látszódhat: ${archetype} A legfontosabb kérdés most az, hogy mi az, ami valóban belőled indul, és mi az, amit csak a környezet tempója hív elő.`,
      },
      {
        heading: focus.loveHeading,
        text: SIGN_RELATIONSHIP_FOCUS[opts.sign],
      },
      {
        heading: focus.workHeading,
        text: SIGN_WORK_FOCUS[opts.sign],
      },
      {
        heading: focus.attentionHeading,
        text: SIGN_ATTENTION_FOCUS[opts.sign],
      },
    ],
    luckyColor: FALLBACK_COLORS[opts.sign],
    luckyNumber: fallbackNumber(opts.sign, opts.period),
  };
}

export async function getHoroscopeNewsArticle(opts: {
  period: HoroscopePeriodHU;
  signSlug: string;
  dateKey?: string;
}): Promise<HoroscopeNewsArticle> {
  const sign = SIGN_BY_SLUG[opts.signSlug];
  const dateKey = cacheDateKey(opts.period, opts.dateKey);
  if (!sign) {
    return localFallbackArticle({
      period: opts.period,
      sign: "aries",
      signSlug: "kos",
      dateKey,
      sourceCached: false,
      translationCached: false,
      fallbackUsed: true,
    });
  }

  const periodRoxy = PERIOD_TO_ROXY[opts.period];
  const translationKey = `horo-news:${NEWS_TRANSLATION_VERSION}:${opts.period}:${sign}:${dateKey}`;
  const cached = await readCache<HoroscopeNewsArticle>(translationKey);
  if (cached && !hasTechnicalFallbackText(cached)) return { ...cached, translationCached: true };

  const { callRoxy } = await import("./roxy.server");
  const endpoint = `/astrology/horoscope/${sign}/${periodRoxy}`;
  const roxy = await callRoxy<unknown>({
    endpoint,
    method: "GET",
    cacheKey: `astro:${periodRoxy}:${sign}:${dateKey}`,
    ttlSeconds: ttlFor(opts.period),
  });

  if (!roxy.ok || !roxy.data) {
    return localFallbackArticle({
      period: opts.period,
      sign,
      signSlug: opts.signSlug,
      dateKey,
      sourceCached: false,
      translationCached: false,
      fallbackUsed: true,
    });
  }

  const { aiJSON } = await import("./ai.server");
  const translated = await aiJSON<ArticleAI>({
    system: [
      "Te magyar szerkesztőségi fordító vagy a Jövőd.hu-n.",
      "A RoxyAPI horoszkóp-forrását hűen, természetes magyar szerkesztőségi nyelvre fordítod.",
      "Ne rövidíts, ne vágj, ne értelmezz át, ne adj hozzá új állítást.",
      "Őrizd meg a forrás szerkezetét: amit a forrás külön témaként ad, legyen külön szekció.",
      "A finance/health témákat is csak horoszkóp-rovatként fordítsd; ne adj valós orvosi vagy pénzügyi tanácsot.",
      "Ne használj angol szót, endpointnevet, mezőnevet vagy AI-meta mondatot.",
      "Csak JSON-t adj vissza a séma szerint.",
    ].join("\n"),
    user: [
      `Időszak: ${PERIOD_LABEL[opts.period]}`,
      `Jegy: ${SIGN_HU[sign]}`,
      `Dátumkulcs: ${dateKey}`,
      "Fordítsd magyar cikké. A title legyen keresőbarát, de ne legyen bulváros.",
      "Forrás JSON:",
      JSON.stringify(roxy.data),
    ].join("\n\n"),
    schemaName: "HoroscopeNewsArticleHU",
    schema: ARTICLE_SCHEMA as unknown as Record<string, unknown>,
    readingType: `horoscope-news:${opts.period}`,
    // A news-horoszkóp nem prémium mélyolvasat, hanem gyors, hű fordítás.
    // Itt a stabil, rövid latency fontosabb, mint a legerősebb kreatív modell,
    // mert timeout esetén a publikus SEO-oldal gyenge fallbackra esne.
    providerPreference: "lovable_first",
    lovableModel: HOROSCOPE_NEWS_MODEL,
    openaiModel: process.env.OPENAI_HOROSCOPE_NEWS_MODEL ?? "gpt-5.2",
    timeoutMs: HOROSCOPE_NEWS_TIMEOUT_MS,
  });

  const article =
    translated.ok && translated.data
      ? normalizeArticle(translated.data, {
          period: opts.period,
          sign,
          signSlug: opts.signSlug,
          dateKey,
          sourceCached: roxy.cached,
          translationCached: false,
          fallbackUsed: false,
        })
      : null;

  if (!article) {
    return localFallbackArticle({
      period: opts.period,
      sign,
      signSlug: opts.signSlug,
      dateKey,
      sourceCached: roxy.cached,
      translationCached: false,
      fallbackUsed: true,
    });
  }

  await writeCache(
    translationKey,
    `/ai/horoscope-news/${opts.period}`,
    article,
    ttlFor(opts.period),
  );
  return article;
}
