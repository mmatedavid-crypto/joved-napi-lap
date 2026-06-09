import { angelMeaning } from "./angel.hu";
import { crystalMeaning, FALLBACK_BIRTHSTONE } from "./crystal.hu";
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
};

function text(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" ? (value as Record<string, unknown>) : {};
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

function cardsFromPayload(input: Record<string, unknown>, count = 3): TarotCard[] {
  const raw = Array.isArray(input.cards) ? input.cards : [];
  const cards = raw.map((item) => cardByName(text(item))).filter(Boolean);
  if (cards.length) return cards.slice(0, count);
  if (text(input.cardName)) return [cardByName(text(input.cardName))];
  return CARDS.slice(0, count);
}

function completeCardsFromPayload(input: Record<string, unknown>, count: number): TarotCard[] {
  const selected = cardsFromPayload(input, count);
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
  const sign = text(input.sign);
  const situation = text(input.situation) || text(input.question) || text(input.q);
  const personalYear = text(input.personalYear);
  const title = name ? `Mai iránytű · ${name}` : "Mai iránytű · személyes üzenet";
  const reading: QualityReading = {
    title,
    sections: [
      {
        heading: "Mai alaphang",
        text: `A mai napod nem nagy fordulatként, hanem finom hangolásként olvasható. ${sign ? `A ${sign} minősége most azt kéri, hogy pontosabban figyeld, hol gyorsítasz túl.` : "A hangsúly azon van, hol térsz vissza saját ritmusodhoz."}`,
      },
      ...(situation
        ? [
            {
              heading: "A megadott témád felől",
              text: `A „${situation}” témájában ez az olvasat nem nagy előrejelzést ad, hanem napi fókuszt: hol érdemes ma kevesebb zajból, tisztább belső ritmusból reagálnod.`,
            },
          ]
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
  const situation = text(input.situation) || text(input.question) || text(input.q);
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
        ? `${name}, ez az olvasat nem általános jóslatként kezeli a ${signName} minőséget. Inkább azt nézi, hol jelenik meg benned ma a jegyed alapfeszültsége: mikor tartasz túl erősen valamit kézben, és mikor engedsz épp annyit, hogy a helyzet mozdulni tudjon.`
        : `Ez az olvasat nem általános jóslatként kezeli a ${signName} minőséget. Inkább azt nézi, hol jelenik meg benned ma a jegyed alapfeszültsége: mikor tartasz túl erősen valamit kézben, és mikor engedsz épp annyit, hogy a helyzet mozdulni tudjon.`,
    },
    ...(situation
      ? [
          {
            heading: "A megadott helyzeted felől",
            text: `A „${situation}” témájában a mai horoszkóp nem kész választ ad. A ${signName} mintája inkább arra hívhatja fel a figyelmed, hogy melyik reakciód születik valódi belső rendből, és melyik csak abból, hogy szeretnéd gyorsan kontroll alá venni a bizonytalanságot.`,
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

function premiumAngel(input: Record<string, unknown>): PaidReadingPayload {
  const number = text(input.number) || "111";
  const root = typeof input.root === "number" ? input.root : undefined;
  const meaning = angelMeaning(number, root);
  return renderReading({
    title: `${number} · ${meaning.title}`,
    sections: [
      { heading: "Mit hordoz ez a szám?", text: meaning.message },
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
  const crystalName = text(input.crystal) || (month ? FALLBACK_BIRTHSTONE[month] : "Hegyikristály");
  const { name, m } = crystalMeaning(crystalName);
  return renderReading({
    title: `${name} · személyes kristály-ajánlás`,
    sections: [
      { heading: "Mit jelképez?", text: m.symbol },
      { heading: "Milyen minőséget hordoz?", text: m.quality },
      { heading: "Mikor érdemes figyelned rá?", text: m.when },
      {
        heading: "Hogyan kapcsold magadhoz?",
        text: `A ${name} itt nem gyógyító ígéret, hanem önismereti jel. Akkor dolgozik jól szimbólumként, ha nem kívülről várod a megoldást, hanem egy belső minőséget nevezel meg vele.`,
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
  const profile = calculateCompatibilityProfile({
    birthDateA,
    birthDateB,
    fullNameA,
    fullNameB,
    status,
  });
  const reading = composeCompatibilityReading(profile);
  const memoryContext = text(input.memoryContext);
  if (memoryContext) {
    reading.sections.splice(2, 0, {
      heading: "A visszatérő mintád",
      text: "A korábbi kérdéseid alapján itt nem csak kettőtök százaléka számít, hanem az is, milyen kapcsolati mintát keresel újra: biztonságot, lezárást, visszatérést vagy tisztább választ. Ezt most finoman érdemes különválasztani attól, hogy ez az egy ember mit mutat.",
    });
  }
  reading.title = `Párkapcsolati dinamika · ${reading.title}`;
  return renderReading(reading);
}

function premiumNumerology(input: Record<string, unknown>): PaidReadingPayload {
  const birthDate = text(input.dob) || text(input.birthDate) || "1992-04-17";
  const fullName = text(input.name) || text(input.fullName) || undefined;
  const profile = calculateNumerologyProfile({ birthDate, fullName });
  return renderReading(composeNumerologyReading(profile));
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
      cards: cardsFromPayload(input, 3),
      question,
      category,
    });
    reading.sections.push(
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
      cards: cardsFromPayload(input, 3),
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
