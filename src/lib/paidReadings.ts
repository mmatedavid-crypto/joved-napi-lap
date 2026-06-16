import { angelMeaning } from "./angel.hu";
import { crystalMeaning, FALLBACK_BIRTHSTONE, FALLBACK_ZODIAC_CRYSTAL } from "./crystal.hu";
import { dreamMeaning } from "./dream.hu";
import { dreamTextToSlug } from "./roxyNormalize";
import { CARDS, type TarotCard } from "@/data/cards";
import {
  calculateCompatibilityProfile,
  composeCompatibilityReading,
} from "./readingQuality/compatibilityEngine";
import {
  calculateNumerologyProfile,
  composeNumerologyReading,
} from "./readingQuality/numerologyEngine";
import { composeHoroscopeReading } from "./readingQuality/horoscopeEngine";
import { composeThreeCardTarot } from "./readingQuality/tarotEngine";
import { SAFETY_NOTE, type QualityReading } from "./readingQuality/styleRules";
import { SIGN_HU } from "./roxyNormalize";

export type PaidReadingPayload = {
  title: string;
  body: string;
  reading?: QualityReading;
  generation?: {
    source: "ai" | "local_premium_draft";
    provider?: string;
    model?: string;
    latencyMs?: number;
    fallbackUsed: boolean;
    qualityRejected?: boolean;
    qualityIssues?: string[];
    generatedAt: string;
  };
};

const INPUT_BRIEF_LABELS: Record<string, string> = {
  question: "Kérdés",
  q: "Kérdés",
  situation: "Helyzet",
  sit: "Helyzet",
  status: "Kapcsolati helyzet",
  category: "Téma",
  cat: "Téma",
  text: "Leírás",
  dream: "Álom",
  emotion: "Érzés",
  symbol: "Szimbólum",
  number: "Szám",
  sign: "Jegy",
  zodiac: "Jegy",
  name: "Név",
  fullName: "Teljes név",
  fullNameA: "Első név",
  fullNameB: "Második név",
  myName: "Első név",
  hisName: "Második név",
  birthDate: "Születési dátum",
  dob: "Születési dátum",
  birthDateA: "Első születési dátum",
  birthDateB: "Második születési dátum",
  myDob: "Első születési dátum",
  hisDob: "Második születési dátum",
  cardName: "Lap",
  cards: "Lapok",
  memoryContext: "Visszatérő minta",
  followupContext: "Miért ezt ajánlottuk",
  articleLead: "Horoszkópcikk alaphangja",
  topic: "Téma",
};

type PaidTarotSpreadCard = {
  position: string;
  cardName: string;
  orientation: string;
  keywords: string[];
  meaning: string;
  oneLine: string;
};

function text(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" ? (value as Record<string, unknown>) : {};
}

function briefValue(value: unknown): string {
  if (typeof value === "string") return value.trim();
  if (typeof value === "number") return String(value);
  if (Array.isArray(value)) {
    return value
      .map((item) => briefValue(item))
      .filter(Boolean)
      .join(", ");
  }
  return "";
}

function paidTarotSpreadFromPayload(input: Record<string, unknown>): PaidTarotSpreadCard[] {
  if (!Array.isArray(input.cardSpread)) return [];
  return input.cardSpread
    .map((item) => {
      const record = asRecord(item);
      const keywords = Array.isArray(record.keywords)
        ? record.keywords.map((keyword) => text(keyword)).filter(Boolean)
        : [];
      return {
        position: text(record.position),
        cardName: text(record.cardName),
        orientation: text(record.orientation),
        keywords,
        meaning: text(record.meaning),
        oneLine: text(record.oneLine),
      };
    })
    .filter((item) => item.position && item.cardName);
}

function briefPaidTarotSpread(input: Record<string, unknown>): string[] {
  const spread = paidTarotSpreadFromPayload(input);
  if (!spread.length) return [];
  return [
    `Kártyakirakás: ${spread
      .map((item) => {
        const orientation = item.orientation ? `, ${item.orientation}` : "";
        const keywords = item.keywords.length ? ` · ${item.keywords.slice(0, 3).join(", ")}` : "";
        return `${item.position}: ${item.cardName}${orientation}${keywords}`;
      })
      .join(" | ")}`,
  ];
}

function briefFreeSynthesis(input: Record<string, unknown>): string[] {
  const synthesis = asRecord(input.freeSynthesis);
  const lines = [
    ["Három lap együtt", text(synthesis.together)],
    ["Mire figyeljen", text(synthesis.attention)],
    ["Egy mondatban", text(synthesis.oneLine)],
  ]
    .filter(([, value]) => value)
    .map(([label, value]) => `${label}: ${String(value).slice(0, 320)}`);
  return lines;
}

function briefCompatibilitySnapshot(input: Record<string, unknown>): string[] {
  const snapshot = asRecord(input.compatibilitySnapshot);
  if (!Object.keys(snapshot).length) return [];
  const personA = asRecord(snapshot.personA);
  const personB = asRecord(snapshot.personB);
  const parts = [
    briefValue(snapshot.score) ? `összeillés: ${briefValue(snapshot.score)}%` : "",
    briefValue(snapshot.relationshipNumber)
      ? `kapcsolatszám: ${briefValue(snapshot.relationshipNumber)}`
      : "",
    briefValue(personA.lifePathNumber)
      ? `első sorsszám: ${briefValue(personA.lifePathNumber)}`
      : "",
    briefValue(personB.lifePathNumber)
      ? `második sorsszám: ${briefValue(personB.lifePathNumber)}`
      : "",
    briefValue(personA.expressionNumber)
      ? `első kifejeződés: ${briefValue(personA.expressionNumber)}`
      : "",
    briefValue(personB.expressionNumber)
      ? `második kifejeződés: ${briefValue(personB.expressionNumber)}`
      : "",
    briefValue(snapshot.status) ? `helyzet: ${briefValue(snapshot.status)}` : "",
    briefValue(snapshot.question) ? `kérdés: ${briefValue(snapshot.question)}` : "",
  ].filter(Boolean);
  return parts.length ? [`Összeillési számolás: ${parts.join("; ")}`] : [];
}

function briefFreeReadingSummary(input: Record<string, unknown>): string[] {
  const summary = asRecord(input.freeReadingSummary);
  const lines = [
    ["Ingyenes olvasat címe", text(summary.title)],
    ["Ingyenes olvasat egy mondata", text(summary.oneSentence)],
  ]
    .filter(([, value]) => value)
    .map(([label, value]) => `${label}: ${String(value).slice(0, 240)}`);
  const sections = Array.isArray(summary.sections)
    ? summary.sections
        .map((item) => {
          const row = asRecord(item);
          const heading = text(row.heading);
          const sectionText = text(row.text);
          return heading && sectionText
            ? `${heading}: ${sectionText.slice(0, 180)}`
            : "";
        })
        .filter(Boolean)
        .slice(0, 4)
    : [];
  if (sections.length) lines.push(`Ingyenes olvasat fókuszai: ${sections.join(" | ")}`);
  return lines;
}

export function paidReadingInputBrief(inputPayload: unknown): string {
  const input = asRecord(inputPayload);
  const seen = new Set<string>();
  const lines: string[] = [];
  for (const [key, label] of Object.entries(INPUT_BRIEF_LABELS)) {
    const value = briefValue(input[key]);
    if (!value || seen.has(label)) continue;
    seen.add(label);
    lines.push(`${label}: ${value.slice(0, 280)}`);
  }
  lines.push(
    ...briefPaidTarotSpread(input),
    ...briefFreeSynthesis(input),
    ...briefCompatibilitySnapshot(input),
    ...briefFreeReadingSummary(input),
  );
  return lines.join("\n");
}

function cardByName(name: string): TarotCard {
  return CARDS.find((card) => card.name === name || card.id === name) ?? CARDS[0];
}

function normalizeSignKey(value: string): string {
  const clean = value
    .trim()
    .toLocaleLowerCase("hu-HU")
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "");
  if (SIGN_HU[value]) return value;
  for (const [key, hu] of Object.entries(SIGN_HU)) {
    const normalizedHu = hu
      .toLocaleLowerCase("hu-HU")
      .normalize("NFD")
      .replace(/\p{Diacritic}/gu, "");
    if (clean === key || clean === normalizedHu) return key;
  }
  return "aries";
}

const PAID_SIGN_TENSION: Record<string, string> = {
  aries: "a gyors lendület és a türelmesebb kivárás között",
  taurus: "a biztonság megtartása és a változás beengedése között",
  gemini: "a sok gondolat és az egyetlen tiszta fókusz között",
  cancer: "az érzelmi biztonság és a régi érzések újraéledése között",
  leo: "a láthatóság igénye és a méltóságteljes visszalépés között",
  virgo: "a javítás vágya és az önkritika elengedése között",
  libra: "a harmónia megőrzése és a valódi döntés kimondása között",
  scorpio: "a mélység iránti vágy és a kontroll elengedése között",
  sagittarius: "a szabadságvágy és a vállalható ígéret között",
  capricorn: "a felelősség, kontroll és időzítés között",
  aquarius: "a távolságtartás és a valódi kapcsolódás között",
  pisces: "az intuíció és az elmosódó határok között",
};

function signDisplayName(value: string): string {
  if (!value) return "";
  const key = normalizeSignKey(value);
  return SIGN_HU[key] ?? value;
}

function signTension(value: string): string {
  if (!value) return "a belső ritmus és a külső elvárások között";
  const key = normalizeSignKey(value);
  return PAID_SIGN_TENSION[key] ?? "a belső ritmus és a külső elvárások között";
}

function situationReflection(situation: string): { heading: string; text: string } {
  const lower = situation.toLocaleLowerCase("hu-HU");
  if (/(szerelem|kapcsolat|randi|ex|visszatér|ismerked|szakítás)/.test(lower)) {
    return {
      heading: "Kapcsolati fókusz",
      text: `A „${situation}” témájában most nem az a legerősebb kérdés, hogy a másik mit lép. Inkább az, milyen tempóban maradsz önazonos: hol keresel valódi kölcsönösséget, és hol próbálsz egy bizonytalan jelből túl nagy választ kiolvasni.`,
    };
  }
  if (/(munka|állás|karrier|projekt|pénz|vállalkoz|ügyfél)/.test(lower)) {
    return {
      heading: "Munka és irány",
      text: `A „${situation}” témájában a fókusz nem a gyors bizonyítás. Inkább azt érdemes ma figyelni, melyik feladat ad valódi tartást, és melyik csak azért sürget, mert félsz lemaradni vagy rosszul látszani.`,
    };
  }
  if (/(dönt|válassz|irány|költöz|menjek|maradjak|elfogadjam)/.test(lower)) {
    return {
      heading: "Döntési fókusz",
      text: `A „${situation}” témájában ne végleges választ kényszeríts ki magadból. Ma inkább azt figyeld, melyik opció mellett lesz csendesebb a belső zaj, és melyik csak rövid időre csökkenti a bizonytalanságot.`,
    };
  }
  if (/(család|otthon|anya|apa|gyerek|barát)/.test(lower)) {
    return {
      heading: "Közeli kapcsolatok",
      text: `A „${situation}” témájában most az lehet beszédes, hol viszel túl sok felelősséget mások érzéseiért. A mai irány nem hideg távolság, hanem tisztább határ: meddig vagy jelen szívből, és honnantól fáradsz el szerepből.`,
    };
  }
  return {
    heading: "A megadott témád felől",
    text: `A „${situation}” témájában ez az olvasat nem nagy előrejelzést ad, hanem napi fókuszt: hol érdemes ma kevesebb zajból, tisztább belső ritmusból reagálnod.`,
  };
}

function cardsFromPayload(input: Record<string, unknown>, count = 3): TarotCard[] {
  const raw = Array.isArray(input.cards) ? input.cards : [];
  const cards = raw.map((item) => cardByName(text(item))).filter(Boolean);
  if (cards.length) return cards.slice(0, count);
  if (text(input.cardName)) return [cardByName(text(input.cardName))];
  return CARDS.slice(0, count);
}

function completeCardsFromPayload(input: Record<string, unknown>, count: number): TarotCard[] {
  const spreadCards = paidTarotSpreadFromPayload(input).map((item) => cardByName(item.cardName));
  const selected = spreadCards.length ? spreadCards.slice(0, count) : cardsFromPayload(input, count);
  const used = new Set(selected.map((card) => card.id));
  for (const card of CARDS) {
    if (selected.length >= count) break;
    if (!used.has(card.id)) {
      selected.push(card);
      used.add(card.id);
    }
  }
  return selected.slice(0, count);
}

function paidSpreadContextSections(input: Record<string, unknown>): QualityReading["sections"] {
  const spread = paidTarotSpreadFromPayload(input);
  const synthesis = asRecord(input.freeSynthesis);
  const sections: QualityReading["sections"] = [];
  if (spread.length) {
    sections.push({
      heading: "A kirakás pontos lenyomata",
      text: spread
        .map((item) => {
          const orientation = item.orientation ? ` ${item.orientation} helyzetben` : "";
          const keywords = item.keywords.length
            ? ` Kulcsszavai: ${item.keywords.slice(0, 3).join(", ")}.`
            : "";
          const meaning = item.oneLine || item.meaning;
          return `${item.position}: ${item.cardName}${orientation}.${keywords}${meaning ? ` ${meaning}` : ""}`;
        })
        .join(" "),
    });
  }
  const together = text(synthesis.together);
  const attention = text(synthesis.attention);
  const oneLine = text(synthesis.oneLine);
  if (together || attention || oneLine) {
    sections.push({
      heading: "A rövid olvasatból továbbmélyítve",
      text: [together, attention, oneLine].filter(Boolean).join(" "),
    });
  }
  return sections;
}

function renderReading(reading: QualityReading): PaidReadingPayload {
  const body = [
    ...reading.sections.map((section) => `${section.heading}\n${section.text}`),
    `Egy mondatban\n${reading.oneSentence}`,
    reading.safetyNote,
  ].join("\n\n");
  return { title: reading.title, body, reading };
}

function premiumTarotOneCard(
  input: Record<string, unknown>,
  productName: string,
): PaidReadingPayload {
  const card = cardsFromPayload(input, 1)[0];
  const question = text(input.q) || text(input.question);
  const situation = text(input.sit) || text(input.category) || "a mostani helyzeted";
  const reading: QualityReading = {
    title: `${card.name} · személyes olvasat`,
    sections: [
      {
        heading: "Miért ez a lap jött most?",
        text: `${card.name} most nem kész választ ad, hanem azt mutatja, milyen minőség aktív benned: ${card.keywords.join(", ")}. ${card.general}`,
      },
      {
        heading: "A helyzetedben",
        text: question
          ? `A „${question}” kérdésben ez a lap arra hívhatja fel a figyelmed, hogy ne csak a másik fél vagy a külső körülmény válaszát keresd. A ${situation} témájában inkább azt nézd meg, hol érzed magad tisztábbnak, és hol szűkülsz össze.`
          : `A ${situation} témájában ez a lap azt kéri, hogy ne általános jóslatként olvasd, hanem belső irányként. A hangsúly most azon van, mi ismétlődik benned, amikor dönteni vagy közeledni próbálsz.`,
      },
      { heading: "Kapcsolódás és érzések", text: card.love },
      { heading: "Döntési irány", text: card.decision },
      { heading: "Mire figyelj?", text: card.warning },
      {
        heading: "Amit ne vigyél túlzásba",
        text: `A ${card.keywords[0].toLowerCase()} minősége akkor segít, ha nem lesz belőle kényszer. Ne próbáld a lapot bizonyítékként használni arra, amit már nagyon szeretnél hallani; inkább azt nézd meg, melyik része érint meg ellenállás nélkül.`,
      },
      {
        heading: "Egy apró belső lépés",
        text: "Ma egyetlen konkrét mozdulatot válassz: egy tisztább mondatot, egy őszintébb határt, vagy egy rövid csendet, ahol nem magyarázod tovább a helyzetet. A lap akkor válik hasznossá, ha a figyelmedet finoman cselekvéssé rendezi.",
      },
    ],
    oneSentence: card.daily,
    safetyNote: SAFETY_NOTE,
    meta: { fallbackUsed: true, readingType: `paid:${productName}` },
  };
  return renderReading(reading);
}

function premiumCelticCross(input: Record<string, unknown>): PaidReadingPayload {
  const cards = completeCardsFromPayload(input, 10);
  const question = text(input.question) || text(input.q) || "Merre mozduljak innen?";
  const category = text(input.category) || text(input.cat) || "mélyebb élethelyzet";
  const positions = [
    {
      heading: "1. A helyzet magja",
      text: `${cards[0].name} mutatja, mi van most a kérdés közepén. A ${category} témájában ez nem felszíni esemény, inkább az a belső minőség, amely köré minden más rendeződik: ${cards[0].general}`,
    },
    {
      heading: "2. Ami keresztezi",
      text: `${cards[1].name} jelzi, mi nehezíti vagy feszíti a helyzetet. Ez nem feltétlenül akadály; lehet olyan tükör is, amely megmutatja, hol ismétled a régi választ. ${cards[1].warning}`,
    },
    {
      heading: "3. A mélyebb gyökér",
      text: `${cards[2].name} a háttérben működő mintára utalhat. A kérdésedben ez azt mutatja, honnan jön az érzés, amelyet most már nem elég csak fejben megoldani. ${cards[2].general}`,
    },
    {
      heading: "4. Ami mögötted van",
      text: `${cards[3].name} azt a réteget hozza, amit már kinőttél, vagy amit lassan el kell engedni. Nem kell megtagadni, de nem biztos, hogy innen érdemes tovább dönteni. ${cards[3].daily}`,
    },
    {
      heading: "5. Ami tudatosan látszik",
      text: `${cards[4].name} azt mutatja, amit már értesz magadból. Itt van a kimondható szándék, de érdemes figyelni, hogy ez ne takarja el a csendesebb, nehezebben bevallható érzést. ${cards[4].decision}`,
    },
    {
      heading: "6. Ami közeledhet",
      text: `${cards[5].name} nem biztos jövőt mond, hanem irányt. Arra utalhat, milyen minőség nyílik meg, ha nem ugyanabból az önvédelemből reagálsz, mint eddig. ${cards[5].general}`,
    },
    {
      heading: "7. Te ebben a történetben",
      text: `${cards[6].name} a saját szerepedet mutatja. A kérdés nem csak az, mi történik veled, hanem az is, milyen részed vesz részt benne: a félelmes, a vágyakozó, vagy az, amelyik már tisztábban lát. ${cards[6].decision}`,
    },
    {
      heading: "8. A környezet hatása",
      text: `${cards[7].name} azt jelzi, milyen külső vagy kapcsolati tér vesz körül. Érdemes lehet elkülöníteni, mi a te belső válaszod, és mi az, amit mások tempója vagy elvárása húz rád. ${cards[7].warning}`,
    },
    {
      heading: "9. Remény és félelem",
      text: `${cards[8].name} kettős hely: amit szeretnél, és amitől tartasz, gyakran ugyanott ér össze. Itt nem az a feladat, hogy eltüntesd a félelmet, hanem hogy ne az vezesse a döntést. ${cards[8].love}`,
    },
    {
      heading: "10. Lehetséges kifutás",
      text: `${cards[9].name} a történet lehetséges irányát mutatja, ha a mostani mintát tudatosabban kezeled. Nem lezárást ad, hanem azt a minőséget, amely felé a helyzet mozdulhat. ${cards[9].daily}`,
    },
  ];
  const reading: QualityReading = {
    title: `Kelta kereszt · ${question}`,
    sections: [
      {
        heading: "A kérdésed tere",
        text: `A „${question}” kérdés nem egyszerű igen-nem helyzetként olvasható. A kelta kereszt itt azt mutatja meg, milyen belső, kapcsolati és időzítési rétegek rakódnak egymásra a ${category} témájában.`,
      },
      ...positions,
      {
        heading: "A tíz lap együtt",
        text: `A fő feszültség ${cards[0].keywords[0].toLowerCase()} és ${cards[1].keywords[0].toLowerCase()} között rajzolódik ki. Ami nyílhat, az nem gyors bizonyosság, hanem ${cards[5].keywords[0].toLowerCase()} és ${cards[9].keywords[0].toLowerCase()} felé mutató lassabb rendeződés.`,
      },
      {
        heading: "Mire figyelj most?",
        text: "A nagy spread értéke nem abban van, hogy több lapból erősebb jóslatot csinál. Abban segít, hogy lásd, melyik rétegben keresed rossz helyen a választ: eseményben, érzésben, félelemben vagy mások visszajelzésében.",
      },
    ],
    oneSentence: `${cards[9].name} nem lezárást, hanem irányt mutat: akkor mozdulhat tisztábban a helyzet, ha a régi reakció helyett új belső tempót választasz.`,
    safetyNote: SAFETY_NOTE,
    meta: { fallbackUsed: true, readingType: "paid:kelta_kereszt" },
  };
  return renderReading(reading);
}

function premiumDailyCompass(input: Record<string, unknown>): PaidReadingPayload {
  const name = text(input.name);
  const rawSign = text(input.sign);
  const sign = signDisplayName(rawSign);
  const tension = signTension(rawSign);
  const situation = text(input.situation) || text(input.question) || text(input.q);
  const personalYear = text(input.personalYear);
  const title = name ? `Mai iránytű · ${name}` : "Mai iránytű · személyes üzenet";
  const reading: QualityReading = {
    title,
    sections: [
      {
        heading: "Mai alaphang",
        text: `A mai napod nem nagy fordulatként, hanem finom hangolásként olvasható. ${sign ? `A ${sign} minősége most főleg ${tension} kér pontosabb figyelmet.` : "A hangsúly azon van, hol térsz vissza saját ritmusodhoz."}`,
      },
      ...(situation
        ? [situationReflection(situation)]
        : []),
      {
        heading: "Személyes ritmus",
        text: personalYear
          ? `A ${personalYear}-es személyes éved miatt most nem mindegy, mire mondasz igent. Ez az év inkább irányt kér tőled, nem kapkodást.`
          : "Ha megadod a születési dátumod, a személyes év és hónap finomabban mutatja meg, miért pont ez a téma erős ma.",
      },
      {
        heading: "Kapcsolatokban",
        text: "Ma az számít, melyik beszélgetés után érzed magad tágasabbnak, és melyik után fogy el belőled a levegő. Ez a különbség most fontosabb lehet, mint a kimondott szavak.",
      },
      {
        heading: "Mire figyelj?",
        text: "Ne abból dönts, hogy mi lenne látványos. Abból dönts, mihez marad benned nyugalom akkor is, ha mások nem erősítik meg azonnal.",
      },
      {
        heading: "A nap rejtett tanítása",
        text: "A mai iránytű nem azt kéri, hogy mindent megoldj. Inkább azt mutatja, melyik apró döntés visz vissza a saját középpontodhoz: egy nemet mondás, egy egyszerűbb terv, vagy egy beszélgetés, amelyben nem kell szerepet játszanod.",
      },
      {
        heading: "Este mire nézz vissza?",
        text: "A nap végén ne azt mérd, mennyi mindent pipáltál ki. Azt figyeld meg, hol lett könnyebb a testedben, amikor őszintébben választottál. Ez adja meg, merre érdemes holnap folytatni.",
      },
    ],
    oneSentence: "Ma az a jó irány, amelyik nem szűkíti, hanem rendezettebbé teszi a figyelmed.",
    safetyNote: SAFETY_NOTE,
    meta: { fallbackUsed: true, readingType: "paid:daily_compass" },
  };
  return renderReading(reading);
}

function premiumHoroscope(input: Record<string, unknown>): PaidReadingPayload {
  const name = text(input.name);
  const rawSign = text(input.sign) || text(input.zodiac) || "Bak";
  const signKey = normalizeSignKey(rawSign);
  const signName = SIGN_HU[signKey] ?? rawSign;
  const tension = signTension(rawSign);
  const situation = text(input.situation) || text(input.question) || text(input.q);
  const articleLead = text(input.articleLead);
  const articleSections = horoscopeArticleSections(input.articleSections);
  const moonPhase = text(input.moonPhase);
  const luckyColor = text(input.luckyColor);
  const luckyNumber = text(input.luckyNumber);
  const personalYear = text(input.personalYear);
  const base = composeHoroscopeReading({
    sign: signKey,
    dateKey: text(input.dateKey) || new Date().toISOString().slice(0, 10),
  });

  base.title = name ? `${signName} horoszkóp · ${name}` : `${signName} horoszkóp · személyesen`;
  base.sections.splice(
    1,
    0,
    {
      heading: "Miért rólad szólhat ma?",
      text: name
        ? `${name}, ez az olvasat nem általános jóslatként kezeli a ${signName} minőséget. Inkább azt nézi, hol jelenik meg benned ma a jegyed alapfeszültsége: ${tension}.`
        : `Ez az olvasat nem általános jóslatként kezeli a ${signName} minőséget. Inkább azt nézi, hol jelenik meg benned ma a jegyed alapfeszültsége: ${tension}.`,
    },
    ...(situation
      ? [situationReflection(situation)]
      : []),
    ...(articleLead || articleSections.length || moonPhase || luckyColor || luckyNumber
      ? [
          {
            heading: "A friss horoszkópcikkedből",
            text: [
              articleLead ? `A most olvasott cikk alaphangja ezt hozza be: ${articleLead}` : "",
              articleSections.length
                ? `A legerősebb cikkbeli fókuszok: ${articleSections
                    .map(
                      (section) => `${section.heading.toLocaleLowerCase("hu-HU")}: ${section.text}`,
                    )
                    .join(" ")}`
                : "",
              [
                moonPhase && `Hold: ${moonPhase}`,
                luckyColor && `szín: ${luckyColor}`,
                luckyNumber && `szám: ${luckyNumber}`,
              ]
                .filter(Boolean)
                .join("; "),
            ]
              .filter(Boolean)
              .join(" "),
          },
        ]
      : []),
    {
      heading: "Személyes ritmus",
      text: personalYear
        ? `A ${personalYear}-es személyes év árnyalatot ad ehhez: ma nem csak az számít, mit szeretnél elérni, hanem az is, milyen tempóban maradsz hiteles. A jó irány most nem feltétlenül látványosabb, inkább pontosabb.`
        : "Ha megadod a születési dátumod is, a személyes év és hónap később finomabban megmutathatja, miért pont ez a napi téma erős nálad.",
    },
  );
  base.sections.push({
    heading: "Ezt vidd magaddal",
    text: `A ${signName} mai üzenete akkor lesz használható, ha nem elvárásként olvasod. Válassz egyetlen helyzetet, ahol nem túlbiztosítani akarod magad, hanem tisztábban érzékelni, mihez van valódi belső nyugalmad.`,
  });
  base.oneSentence = `${signName} ma nem nagy bizonyosságot kér, hanem pontosabb belső időzítést.`;
  base.meta = { ...base.meta, fallbackUsed: true, readingType: "paid:horoscope" };
  return renderReading(base);
}

function horoscopeArticleSections(value: unknown): Array<{ heading: string; text: string }> {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => {
      const row = asRecord(item);
      const heading = text(row.heading).slice(0, 80);
      const sectionText = text(row.text).slice(0, 220);
      return heading && sectionText ? { heading, text: sectionText } : null;
    })
    .filter((item): item is { heading: string; text: string } => Boolean(item))
    .slice(0, 3);
}

function premiumAngel(input: Record<string, unknown>): PaidReadingPayload {
  const number = text(input.number) || "111";
  const root = typeof input.root === "number" ? input.root : undefined;
  const situation = text(input.situation) || text(input.question) || text(input.q);
  const meaning = angelMeaning(number, root);
  return renderReading({
    title: `${number} · ${meaning.title}`,
    sections: [
      { heading: "Mit hordoz ez a szám?", text: meaning.message },
      ...(situation ? [situationReflection(situation)] : []),
      {
        heading: "Miért jelenhet meg most?",
        text: `A ${number} most önismereti jelként azt kérdezheti, hol ismétled ugyanazt a belső választ. Nem bizonyíték, inkább figyelmi pont: mit veszel észre újra meg újra?`,
      },
      { heading: "Szerelemben", text: meaning.love },
      { heading: "Döntés előtt", text: meaning.decision },
      { heading: "Mire figyelj?", text: meaning.warn },
      {
        heading: "A szám árnyéka",
        text: `A ${number} akkor válik félrevezetővé, ha külső megerősítésként hajszolod. Nem az a kérdés, hogy “mit akar üzenni a világ”, hanem az, hogy benned melyik téma kap most újra hangot.`,
      },
      {
        heading: "Hogyan használd ma?",
        text: "Válassz egyetlen mondatot, amit ehhez a számhoz kötsz, és figyeld meg a nap során, mikor tér vissza. Nem kell döntést kényszerítened belőle; elég, ha pontosabban veszed észre a mintát.",
      },
    ],
    oneSentence: meaning.oneLine,
    safetyNote: SAFETY_NOTE,
    meta: { fallbackUsed: true, readingType: "paid:angel" },
  });
}

function premiumCrystal(input: Record<string, unknown>): PaidReadingPayload {
  const month = Number(input.month);
  const sign = text(input.sign) ? normalizeSignKey(text(input.sign)) : "";
  const signName = sign ? SIGN_HU[sign] : "";
  const crystalName =
    text(input.crystal) ||
    (sign ? FALLBACK_ZODIAC_CRYSTAL[sign] : "") ||
    (month ? FALLBACK_BIRTHSTONE[month] : "Hegyikristály");
  const { name, m } = crystalMeaning(crystalName);
  return renderReading({
    title: signName
      ? `${name} · ${signName} személyes kristály-ajánlás`
      : `${name} · személyes kristály-ajánlás`,
    sections: [
      ...(signName
        ? [
            {
              heading: `Miért kapcsolódhat a ${signName} minőségéhez?`,
              text: `A ${signName} mintája felől a ${name} nem díszítő elemként érdekes, hanem önismereti jelként: azt a belső minőséget emeli ki, amelyben most a jegyed árnyaltabban tud működni.`,
            },
          ]
        : []),
      { heading: "Mit jelképez?", text: m.symbol },
      { heading: "Milyen minőséget hordoz?", text: m.quality },
      { heading: "Mikor érdemes figyelned rá?", text: m.when },
      {
        heading: "Hogyan kapcsold magadhoz?",
        text: `A ${name} itt nem testi hatást ígérő eszköz, hanem önismereti jel. Akkor dolgozik jól szimbólumként, ha nem kívülről várod a megoldást, hanem egy belső minőséget nevezel meg vele.`,
      },
      {
        heading: "A te helyzetedben",
        text: `Ha most a ${name} került eléd, érdemes lehet azt figyelned, hol van szükséged több ${m.oneLine.toLocaleLowerCase("hu-HU")} jellegű minőségre. Nem az a cél, hogy mindent megváltoztass, hanem hogy egyetlen belső hangsúlyt tisztábban megnevezz.`,
      },
      {
        heading: "Finom rituálé",
        text: "Tartsd kézben pár percig, vagy csak képzeld magad elé, és fogalmazz meg egy rövid mondatot arról, mit szeretnél ma máshogy érzékelni. A rituálé értéke a figyelemben van, nem a tárgy erejének túlzásában.",
      },
    ],
    oneSentence: m.oneLine,
    safetyNote: "A kristály szimbolikus önismereti eszköz, nem gyógyászati tanács.",
    meta: { fallbackUsed: true, readingType: "paid:crystal" },
  });
}

function premiumDream(input: Record<string, unknown>): PaidReadingPayload {
  const dreamText = text(input.text);
  const emotion = text(input.emotion);
  const slug = dreamTextToSlug(dreamText);
  const meaning = dreamMeaning(slug) ?? dreamMeaning("water")!;
  const feeling = dreamEmotionLabel(emotion);
  return renderReading({
    title: `${meaning.title} · álomfejtés`,
    sections: [
      { heading: "Az álom felszíne", text: meaning.surface },
      {
        heading: "Mi dolgozhat mögötte?",
        text: dreamText
          ? `A leírásod alapján nem egyetlen jóslatot keresünk, hanem azt, milyen érzés maradt meg az álomból. A ${feeling} különösen fontos jel: ez mutatja, hogy a szimbólum nem kívülről üzen, hanem egy belső feszültséghez vagy vágyhoz kapcsolódik.`
          : `Az álom akkor válik beszédessé, ha nem csak a képet, hanem az ébredés utáni érzést is figyeled. Most a ${feeling} adja a legerősebb kulcsot.`,
      },
      { heading: "Mire kérdez rá?", text: meaning.notice },
      {
        heading: "Hogyan vidd magaddal?",
        text: "Írd le egy mondatban, melyik érzés volt a legerősebb. Nem kell megfejteni mindent; elég észrevenni, melyik kép tér vissza benned napközben is.",
      },
      {
        heading: "A visszatérő minta",
        text: "Ha ez az álom vagy ehhez hasonló kép többször is megjelenik, figyeld meg, milyen élethelyzetek után erősödik fel. Sokszor nem a szimbólum a legfontosabb, hanem az, milyen belső feszültség hívja elő újra.",
      },
      {
        heading: "Mit ne olvass bele?",
        text: "Ne kezeld szó szerinti jóslatként, és ne ijeszd meg magad egyetlen képpel. Az álom inkább belső nyelv: sűrít, nagyít, összekever. A jó értelmezés nem félelmet ad, hanem pontosabb figyelmet.",
      },
    ],
    oneSentence: meaning.oneLine,
    safetyNote: "Ez önismereti álomértelmezés, nem diagnózis vagy mentális egészségügyi tanács.",
    meta: { fallbackUsed: true, readingType: "paid:dream" },
  });
}

function dreamEmotionLabel(emotion: string): string {
  switch (emotion) {
    case "fear":
      return "félelem";
    case "desire":
      return "vágy";
    case "uncertain":
      return "bizonytalanság";
    case "calm":
      return "nyugalom";
    case "recurring":
      return "visszatérő álom";
    default:
      return "megmaradt érzés";
  }
}

function premiumCompatibility(input: Record<string, unknown>): PaidReadingPayload {
  const birthDateA = text(input.myDob) || text(input.birthDateA) || "1990-01-14";
  const birthDateB = text(input.hisDob) || text(input.birthDateB) || "1992-06-24";
  const fullNameA = text(input.myName) || text(input.fullNameA) || undefined;
  const fullNameB = text(input.hisName) || text(input.fullNameB) || undefined;
  const status = text(input.sit) || text(input.status) || "kapcsolati dinamika";
  const question = text(input.q) || text(input.question) || undefined;
  const profile = calculateCompatibilityProfile({
    birthDateA,
    birthDateB,
    fullNameA,
    fullNameB,
    status,
    question,
  });
  const reading = composeCompatibilityReading(profile);
  const memoryContext = text(input.memoryContext);
  const comparisonContext = text(input.comparisonContext);
  const freeSummary = asRecord(input.freeReadingSummary);
  if (memoryContext) {
    reading.sections.splice(2, 0, {
      heading: "A visszatérő mintád",
      text: "A korábbi kérdéseid alapján itt nem csak kettőtök százaléka számít, hanem az is, milyen kapcsolati mintát keresel újra: biztonságot, lezárást, visszatérést vagy tisztább választ. Ezt most finoman érdemes különválasztani attól, hogy ez az egy ember mit mutat.",
    });
  }
  if (comparisonContext) {
    reading.sections.splice(3, 0, {
      heading: "Ha több embert is összehasonlítasz",
      text: "Ez a fizetős elemzés külön kezeli azt is, ha mostanában több kapcsolatot nézel egymás mellé. Ilyenkor nem az a legfontosabb, ki kap magasabb százalékot, hanem hogy milyen érzést keresel ismétlődően: biztonságot, izgalmat, lezárást vagy bizonyosságot.",
    });
  }
  if (text(freeSummary.oneSentence)) {
    reading.sections.push({
      heading: "Az első olvasatból továbbvíve",
      text: `Az ingyenes olvasat fő mondata ez volt: „${text(freeSummary.oneSentence)}” A mélyebb elemzés ezt nem ismétli, hanem azt nézi, hol jelenik meg ugyanez a dinamika a hétköznapi közeledésben, a csendekben és a visszatérő reakciókban.`,
    });
  }
  reading.title = `Párkapcsolati dinamika · ${reading.title}`;
  return renderReading(reading);
}

function premiumNumerology(input: Record<string, unknown>): PaidReadingPayload {
  const birthDate = text(input.dob) || text(input.birthDate) || "1992-04-17";
  const fullName = text(input.name) || text(input.fullName) || undefined;
  const profile = calculateNumerologyProfile({ birthDate, fullName });
  const reading = composeNumerologyReading(profile);
  reading.title = `${reading.title} · életút elemzés`;
  reading.sections.push(
    {
      heading: "A fizetős elemzés mélyebb rétege",
      text: `Itt nem csak azt nézzük, mi a sorsszámod, hanem azt is, hogyan találkozik a születési ritmusod az idei személyes éveddel. A ${profile.lifePathNumber}-es alapmintád és a ${profile.personalYearNumber}-es személyes éved együtt azt kérdezi, hol kell most kevesebb szerepből és több saját ritmusból döntened.`,
    },
    profile.fullName
      ? {
          heading: "A név rétegei",
          text: `A teljes név miatt a belső vágyad, a külső képed és a kifejeződésed is látszik. A ${profile.soulUrgeNumber ?? "belső"}-es belső vágy nem mindig ugyanazt akarja, mint amit a külvilág először észrevesz rajtad. Ettől lehet az életutad egyszerre vonzó és fárasztó: nem csak haladni szeretnél, hanem úgy megjelenni, hogy közben ne veszítsd el a belső irányodat.`,
        }
      : {
          heading: "A név rétegei",
          text: "Teljes születési név nélkül a névelemzés mélysége korlátozott. A születési dátum így is erős alapot ad, de ha később megadod a teljes neved, pontosabban látszik a belső vágy, a külső kép és a kifejeződés különbsége.",
        },
    {
      heading: "Következő 30 nap",
      text: `A ${profile.personalMonthNumber}-es személyes hónap most közelebb hozza az idei témát. A következő hetekben ne nagy életdöntést akarj mindenáron kierőltetni; inkább azt figyeld, hol ismétlődik ugyanaz a reakció. Ami háromszor is ugyanoda húz vissza, ott nem véletlenül kér figyelmet a minta.`,
    },
    {
      heading: "Gyakorlati fókusz",
      text: "Válassz egyetlen területet: kapcsolat, munka vagy önbizalom. Írd le, ott milyen szerepet játszol túl gyakran. A számmisztikai olvasat akkor válik használhatóvá, ha nem címkeként viseled a számokat, hanem felismered, melyik döntésed mögött dolgoznak.",
    },
  );
  return renderReading(reading);
}

export function composePaidOrderReading(
  productSlug: string,
  productName: string,
  inputPayload: unknown,
): PaidReadingPayload {
  const input = asRecord(inputPayload);
  if (productSlug === "napi_lap_ai" || productSlug === "extra_huzas") {
    return premiumTarotOneCard(input, productName);
  }
  if (productSlug === "mai_iranytu_ai") return premiumDailyCompass(input);
  if (productSlug === "angyalszam_ai") return premiumAngel(input);
  if (productSlug === "kristaly_ai") return premiumCrystal(input);
  if (productSlug === "alomfejtes_rovid") return premiumDream(input);
  if (productSlug === "horoszkop_szemelyre") return premiumHoroscope(input);
  if (productSlug === "kelta_kereszt") return premiumCelticCross(input);
  if (productSlug === "harom_lap_mely") {
    const question = text(input.question) || text(input.q);
    const category = text(input.category) || "általános élethelyzet";
    const reading = composeThreeCardTarot({
      readingType: "3 lapos húzás",
      cards: completeCardsFromPayload(input, 3),
      question,
      category,
    });
    reading.sections.push(
      ...paidSpreadContextSections(input),
      {
        heading: "A mélyebb réteg",
        text: question
          ? `A „${question}” kérdésben a három lap nem csak eseményívet mutat, hanem azt is, hogyan reagálsz a ${category} helyzetére. A múlt lapja a megszokott védekezésedet, a jelen lapja a mostani feszültséget, a jövő lapja pedig azt a minőséget jelzi, ami felé akkor mozdulhatsz, ha nem ismétled ugyanazt a választ.`
          : "A három lap nem csak eseményívet mutat, hanem azt is, hogyan reagálsz a helyzetre. A múlt lapja a megszokott védekezésedet, a jelen lapja a mostani feszültséget, a jövő lapja pedig azt a minőséget jelzi, ami felé akkor mozdulhatsz, ha nem ismétled ugyanazt a választ.",
      },
      {
        heading: "Következő belső lépés",
        text: "Ne azonnali bizonyosságot keress. Egyetlen pontot válassz ki: mit kell kimondani, mit kell abbahagyni, vagy hol kell lassítani. A lapok akkor dolgoznak jól, ha nem helyetted döntenek, hanem letisztítják a következő mozdulatot.",
      },
    );
    return renderReading(reading);
  }
  if (productSlug === "dontes_komplex") {
    const question = text(input.q) || text(input.question) || "Merre mozduljak?";
    const category = text(input.cat) || text(input.category) || "döntés előtt";
    const reading = composeThreeCardTarot({
      readingType: "Döntés előtt",
      cards: completeCardsFromPayload(input, 3),
      question,
      category,
    });
    reading.sections.push(
      {
        heading: "Mit tisztít a döntés?",
        text: `A „${question}” kérdésben ez az olvasat nem azt mondja meg, melyik opció a helyes. Inkább azt mutatja, hogy a ${category} témájában melyik választás mögött van valódi belső igen, és melyik mögött csak sürgetés, félelem vagy megfelelés. A döntés minősége fontosabb, mint a sebessége.`,
      },
      {
        heading: "Mikor ne lépj még?",
        text: "Ha a kérdésre gondolva a tested összeszűkül, vagy csak azért választanál, hogy vége legyen a bizonytalanságnak, érdemes lehet még egy kört tisztázni. Nem halogatásról van szó, hanem arról, hogy a döntés ne menekülésből szülessen.",
      },
    );
    return renderReading(reading);
  }
  if (productSlug === "parkapcsolat_elemzes") return premiumCompatibility(input);
  if (productSlug === "szammisztika_eletut") return premiumNumerology(input);
  return premiumTarotOneCard(input, productName);
}
