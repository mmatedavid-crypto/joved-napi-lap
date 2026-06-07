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
    oneSentence: `Kettőtök dinamikája akkor erős, ha nem ugyanolyanná akartok válni, hanem közös tempót találtok.`,
    safetyNote: SAFETY_NOTE,
    meta: { fallbackUsed: true, readingType: "compatibility" },
  };
  const guard = guardQualityReading(reading, [
    String(profile.personA.lifePathNumber),
    String(profile.personB.lifePathNumber),
    profile.status ?? "",
  ]);
  reading.meta = { ...reading.meta, qualityIssues: guard.issues };
  return reading;
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
