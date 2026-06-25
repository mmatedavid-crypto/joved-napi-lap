import {
  compatPairMeaning,
  compatibilityScore,
  lifePathInfo,
  relationshipNumber,
} from "../numerology";
import { calculateNumerologyProfile, type NumerologyProfile } from "./numerologyEngine";
import { guardQualityReading } from "./qualityGuard";
import { SAFETY_NOTE, type QualityReading } from "./styleRules";

export type CompatibilityProfile = {
  personA: NumerologyProfile;
  personB: NumerologyProfile;
  relationshipNumber: number;
  score: number;
  status?: string;
  question?: string;
  communication?: number;
  attraction?: number;
  longTerm?: number;
};

export function calculateCompatibilityProfile(opts: {
  birthDateA: string;
  birthDateB: string;
  fullNameA?: string;
  fullNameB?: string;
  status?: string;
  question?: string;
  communication?: number;
  attraction?: number;
  longTerm?: number;
}): CompatibilityProfile {
  const personA = calculateNumerologyProfile({
    birthDate: opts.birthDateA,
    fullName: opts.fullNameA,
  });
  const personB = calculateNumerologyProfile({
    birthDate: opts.birthDateB,
    fullName: opts.fullNameB,
  });
  const rel = relationshipNumber(personA.lifePathNumber, personB.lifePathNumber);
  return {
    personA,
    personB,
    relationshipNumber: rel,
    score: compatibilityScore(personA.lifePathNumber, personB.lifePathNumber),
    status: opts.status,
    question: opts.question,
    communication: opts.communication,
    attraction: opts.attraction,
    longTerm: opts.longTerm,
  };
}

export function composeCompatibilityReading(profile: CompatibilityProfile): QualityReading {
  const a = lifePathInfo(profile.personA.lifePathNumber);
  const b = lifePathInfo(profile.personB.lifePathNumber);
  const rel = lifePathInfo(profile.relationshipNumber);
  const pair = compatPairMeaning(profile.personA.lifePathNumber, profile.personB.lifePathNumber);
  const nameLine =
    profile.personA.expressionNumber && profile.personB.expressionNumber
      ? `A névmintátokban a ${profile.personA.expressionNumber} és ${profile.personB.expressionNumber} találkozik: ez azt mutatja, hogyan mutatkoztok meg egymás mellett, nem csak azt, milyen alapritmust hoztok a születési dátumból.`
      : "Ha mindkét teljes születési név megvan, a névmintákból is látszik, ki hogyan mutatja ki magát a kapcsolatban.";

  const reading: QualityReading = {
    title: `${profile.score}% · ${profile.relationshipNumber}-es kapcsolatminta`,
    sections: [
      {
        heading: "Összeillés",
        text: `A ${profile.personA.lifePathNumber}-es és ${profile.personB.lifePathNumber}-es sorsszám találkozása nem csak százalék: az egyik ritmus ${a.title.toLocaleLowerCase("hu-HU")} minőséget, a másik ${b.title.toLocaleLowerCase("hu-HU")} minőséget hoz. A ${profile.score}% inkább azt jelzi, mennyire könnyen találtok közös tempót.`,
      },
      { heading: "A kapcsolat alapmintája", text: `${rel.meaning} ${nameLine}` },
      { heading: "A helyzet szerint", text: statusText(profile.status, profile.score) },
      ...(profile.question
        ? [{ heading: "A kérdésed felől", text: questionText(profile.question, profile.status) }]
        : []),
      { heading: "Miért erős köztetek?", text: pair.works },
      { heading: "Hol akadhattok el?", text: pair.tension },
      {
        heading: "Kommunikáció",
        text:
          profile.communication != null
            ? metricText(profile.communication, "kommunikáció")
            : "Az egyikőtök hamarabb reagálhat belső feszültségből, míg a másik inkább akkor nyílik meg, ha már biztonságot érez. Ebből nem baj lesz, hanem tempókülönbség, ha észreveszitek.",
      },
      {
        heading: "Vonzalom",
        text:
          profile.attraction != null
            ? metricText(profile.attraction, "vonzalom")
            : "A vonzalom itt nem csak szikra: inkább abból épülhet, hogy a különbségeitek eleinte izgalmat adnak, később viszont tudatos figyelmet kérnek.",
      },
      {
        heading: "Biztonság vagy szabadság?",
        text: `A ${profile.relationshipNumber}-es kapcsolatminta azt kérdezi, mennyi keretet bír el a szabadságotok, és mennyi szabadságot bír el a biztonságotok. Itt nem az a kérdés, ki alkalmazkodjon, hanem hogy van-e közös ritmus.`,
      },
      {
        heading: "Hosszú táv",
        text:
          profile.longTerm != null
            ? metricText(profile.longTerm, "hosszú táv")
            : "Hosszabb távon az dönthet, tudtok-e közös keretet építeni anélkül, hogy egyikőtök eltűnne benne.",
      },
      { heading: "Mire kell figyelni?", text: pair.advice },
    ],
    oneSentence: oneSentenceForStatus(profile.status),
    safetyNote: SAFETY_NOTE,
    meta: { fallbackUsed: true, readingType: "compatibility" },
  };
  const guard = guardQualityReading(reading, [
    String(profile.personA.lifePathNumber),
    String(profile.personB.lifePathNumber),
    profile.status ?? "",
    profile.question ?? "",
  ]);
  reading.meta = { ...reading.meta, qualityIssues: guard.issues };
  return reading;
}

export function statusText(status: string | undefined, score: number): string {
  const normalized = (status ?? "").toLocaleLowerCase("hu-HU");
  if (normalized.includes("ex") || normalized.includes("visszatér")) {
    const tone =
      score >= 70
        ? "van még köztetek felismerhető kapcsolódási erő"
        : "a vonzás visszahúzhat, de a régi feszültség is könnyen újraindulhat";
    return `Ex vagy visszatérő történetként ezt nem egyszerű igen-nem kérdésként érdemes olvasni. Inkább azt mutatja, hogy ${tone}. Ha újra megjelenik, a kérdés nem csak az, marad-e, hanem hogy más mintával érkezik-e vissza. Rövid fellángolás akkor valószínűbb, ha ugyanaz a bizonytalanság, csend vagy kontrollhelyzet ismétlődik. Tartósabb irányt az jelezhet, ha a visszatérés mellett tisztább szándék, következetesebb jelenlét és konkrétabb felelősség is megjelenik.`;
  }
  if (normalized.includes("ismerked")) {
    return "Új vagy alakuló ismeretségnél a százalék nem ígéret, hanem induló ritmus. Itt az számít, hogy a kezdeti kíváncsiság mellett megjelenik-e következetesség is: nem csak jó beszélgetések, hanem visszatérő figyelem, tiszta tempó és valódi érdeklődés.";
  }
  if (normalized.includes("kapcsolatban")) {
    return "Már meglévő kapcsolatnál ez az olvasat nem a kezdeti szikrát méri, hanem azt, hogyan bírjátok a hétköznapi közelséget. A fontos kérdés az, hogy a különbségeitek fárasztanak-e, vagy idővel megtanultatok belőlük közös nyelvet építeni.";
  }
  if (normalized.includes("házasság") || normalized.includes("hosszú")) {
    return "Hosszú távú vagy házassági helyzetben a kapcsolat nem attól erős, hogy nincs feszültség, hanem attól, hogy van-e közös tartás, amikor a romantikus könnyedség kevesebb. Itt a stabilitás, felelősség és szabadság aránya a kulcs.";
  }
  return "A megadott kapcsolati helyzet alapján ez az olvasat azt mutatja, hogy ebben az életszakaszban milyen tempót, közelséget és biztonságot tudtok egymásnak adni.";
}

function questionText(question: string, status: string | undefined): string {
  const clean = question.trim().replace(/\s+/g, " ");
  const normalized = `${status ?? ""} ${clean}`.toLocaleLowerCase("hu-HU");
  const quoted = `A „${clean}” kérdésre ez az összeillés kapcsolati mintaként válaszol.`;
  if (/vissza|visszatér|ex|újra/.test(normalized)) {
    return `${quoted} Inkább azt mutatja, hogy a visszatérés értéke nem önmagában a megjelenésben van, hanem abban, hogy a régi minta mellett látszik-e több felelősség, következetesség és tisztább szándék. Ha csak a hiány hozza vissza, rövid hullám maradhat; ha a tempó is változik, abból már érdemesebb olvasni.`;
  }
  if (/marad|tartós|hosszú|komoly/.test(normalized)) {
    return `${quoted} A tartósság itt nem egyetlen nagy érzelem kérdése, hanem azé, hogy a vonzalom mellé megérkezik-e a kiszámítható figyelem, a hétköznapi jelenlét és a konfliktusok utáni visszarendeződés.`;
  }
  if (/szeret|érez|gondol|komolyan/.test(normalized)) {
    return `${quoted} Érzések helyett biztos bizonyítékot nem ad, de a mintát segít olvasni: a vonzalom akkor válik tisztábban láthatóvá, ha idővel következetesebb jelenlét, ritmus és konkrét figyelem is társul hozzá.`;
  }
  if (/ír|keres|jelentkez|csend/.test(normalized)) {
    return `${quoted} A csendet nem érdemes automatikus válasznak venni. Itt inkább az számít, hogy a hallgatás után jön-e tisztább közeledés, vagy ugyanazt a bizonytalanságot indítja újra.`;
  }
  return `${quoted} A számaitok inkább azt mutatják, milyen tempóban közeledtek, hol akad el a biztonság, és milyen kapcsolati minőség tudna ebből hosszabb távon épülni.`;
}

function oneSentenceForStatus(status: string | undefined): string {
  const normalized = (status ?? "").toLocaleLowerCase("hu-HU");
  if (normalized.includes("ex") || normalized.includes("visszatér")) {
    return "A visszatérés értéke nem abban látszik, hogy újra megjelenik-e, hanem abban, hogy ugyanazt a történetet hozza-e vissza.";
  }
  if (normalized.includes("ismerked")) {
    return "Ez az ismerkedés akkor mélyülhet, ha a kíváncsiság mellett ritmus és következetesség is megjelenik.";
  }
  return "Kettőtök dinamikája akkor erős, ha nem ugyanolyanná akartok válni, hanem közös tempót találtok.";
}

function metricText(value: number, label: string): string {
  if (value >= 80) {
    return `A ${label} erős tartóelem lehet köztetek, de csak akkor, ha nem bizonyításra vagy kontrollra használjátok.`;
  }
  if (value >= 60) {
    return `A ${label} működőképes mintát mutat, de időnként tudatos egyeztetést kérhet.`;
  }
  return `A ${label} érzékenyebb pont lehet: nem lezárást, hanem több finom tempóegyeztetést jelez.`;
}
