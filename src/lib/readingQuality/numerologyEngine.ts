import { LIFE_PATHS, lifePathInfo, reduceNumber } from "../numerology";
import { guardQualityReading } from "./qualityGuard";
import { SAFETY_NOTE, type QualityReading } from "./styleRules";

const LETTER_VALUES: Record<string, number> = {
  A: 1,
  J: 1,
  S: 1,
  B: 2,
  K: 2,
  T: 2,
  C: 3,
  L: 3,
  U: 3,
  D: 4,
  M: 4,
  V: 4,
  E: 5,
  N: 5,
  W: 5,
  F: 6,
  O: 6,
  X: 6,
  G: 7,
  P: 7,
  Y: 7,
  H: 8,
  Q: 8,
  Z: 8,
  I: 9,
  R: 9,
};

const VOWELS = new Set(["A", "E", "I", "O", "U"]);

export type NumerologyProfile = {
  birthDate: string;
  fullName?: string;
  normalizedName?: string;
  initials?: string;
  lifePathNumber: number;
  birthDayNumber: number;
  personalYearNumber: number;
  personalMonthNumber: number;
  expressionNumber?: number;
  soulUrgeNumber?: number;
  personalityNumber?: number;
  maturityNumber?: number;
};

function digitSum(value: string | number): number {
  return String(value)
    .replace(/\D/g, "")
    .split("")
    .reduce((sum, d) => sum + Number(d), 0);
}

export function normalizeHungarianName(name: string): string {
  return name
    .toLocaleUpperCase("hu-HU")
    .replace(/[Á]/g, "A")
    .replace(/[É]/g, "E")
    .replace(/[Í]/g, "I")
    .replace(/[ÓÖŐ]/g, "O")
    .replace(/[ÚÜŰ]/g, "U")
    .replace(/[^A-Z\s-]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function letterNumberSum(name: string, mode: "all" | "vowels" | "consonants"): number {
  return normalizeHungarianName(name)
    .replace(/[\s-]/g, "")
    .split("")
    .reduce((sum, letter) => {
      const isVowel = VOWELS.has(letter);
      if (mode === "vowels" && !isVowel) return sum;
      if (mode === "consonants" && isVowel) return sum;
      return sum + (LETTER_VALUES[letter] ?? 0);
    }, 0);
}

function initialsOf(name: string): string | undefined {
  const parts = normalizeHungarianName(name).split(/\s+/).filter(Boolean);
  if (!parts.length) return undefined;
  return parts.map((p) => p[0]).join("-");
}

export function calculateNumerologyProfile(opts: {
  birthDate: string;
  fullName?: string;
  now?: Date;
}): NumerologyProfile {
  const [, month, day] = opts.birthDate.split("-").map(Number);
  const now = opts.now ?? new Date();
  const lifePathNumber = reduceNumber(digitSum(opts.birthDate), true);
  const birthDayNumber = reduceNumber(day, true);
  const personalYearNumber = reduceNumber(
    digitSum(month) + digitSum(day) + digitSum(now.getFullYear()),
    true,
  );
  const personalMonthNumber = reduceNumber(personalYearNumber + now.getMonth() + 1, true);

  const profile: NumerologyProfile = {
    birthDate: opts.birthDate,
    fullName: opts.fullName?.trim() || undefined,
    lifePathNumber,
    birthDayNumber,
    personalYearNumber,
    personalMonthNumber,
  };

  if (opts.fullName?.trim()) {
    const normalizedName = normalizeHungarianName(opts.fullName);
    const expressionNumber = reduceNumber(letterNumberSum(opts.fullName, "all"), true);
    const soulUrgeNumber = reduceNumber(letterNumberSum(opts.fullName, "vowels"), true);
    const personalityNumber = reduceNumber(letterNumberSum(opts.fullName, "consonants"), true);
    profile.normalizedName = normalizedName;
    profile.initials = initialsOf(opts.fullName);
    profile.expressionNumber = expressionNumber;
    profile.soulUrgeNumber = soulUrgeNumber;
    profile.personalityNumber = personalityNumber;
    profile.maturityNumber = reduceNumber(lifePathNumber + expressionNumber, true);
  }

  return profile;
}

function infoFor(n?: number) {
  return n ? lifePathInfo(LIFE_PATHS[n] ? n : reduceNumber(n, false)) : lifePathInfo(7);
}

export function composeNumerologyReading(profile: NumerologyProfile): QualityReading {
  const life = infoFor(profile.lifePathNumber);
  const birth = infoFor(profile.birthDayNumber);
  const expression = infoFor(profile.expressionNumber);
  const soul = infoFor(profile.soulUrgeNumber);
  const personality = infoFor(profile.personalityNumber);
  const year = infoFor(profile.personalYearNumber);
  const missingName = "Ha megadod a teljes születési neved, mélyebb névelemzést is kapsz.";

  const reading: QualityReading = {
    title: `${profile.lifePathNumber} · ${life.title}`,
    sections: [
      {
        heading: "A sorsszámod",
        text: `A ${profile.lifePathNumber}-es sorsszám nálad alapritmus: ${life.meaning} Ez akkor látszik a legélesebben, amikor választanod kell kényelmes alkalmazkodás és saját irány között.`,
      },
      {
        heading: "Mit mutat rólad?",
        text: `${life.purpose ?? life.strengths} A születésnapod ${profile.birthDayNumber}-es száma hozzáteszi: ${birth.meaning.toLocaleLowerCase("hu-HU")} Ezt visszatérő működésmódként érdemes figyelni a saját helyzeteidben.`,
      },
      {
        heading: "Belső hajtóerőd",
        text: profile.soulUrgeNumber
          ? `A belső vágyad ${profile.soulUrgeNumber}-es: ${soul.meaning} Ez akkor feszülhet, ha kívül mást mutatsz, mint amit belül már régen szeretnél kimondani.`
          : missingName,
      },
      {
        heading: "Amit mások először látnak belőled",
        text: profile.personalityNumber
          ? `A külső képed ${profile.personalityNumber}-es: ${personality.strengths} Mások ezt gyakran előbb érzik meg rajtad, mint a mélyebb motivációdat.`
          : missingName,
      },
      {
        heading: "Szerelemben",
        text: `${life.love} Ha a kapcsolat túl gyorsan akar formát adni neked, könnyen a sorsszámod árnyéka kapcsol be: ${life.shadow.toLocaleLowerCase("hu-HU")}`,
      },
      {
        heading: "Munkában",
        text: `${life.work} A kifejeződésed ${
          profile.expressionNumber
            ? `${profile.expressionNumber}-es száma (${expression.title})`
            : "teljes név nélkül még nem látszik"
        } azt mutatja, milyen eszközzel tudsz hatni, nem azt, hogy egyetlen pályára lennél bezárva.`,
      },
      {
        heading: "Árnyékoldal",
        text: `${life.shadow} Az árnyék itt nem hiba, hanem jelzés: akkor jelenik meg, amikor túl sokáig mész szembe a saját ritmusoddal.`,
      },
      {
        heading: "Az idei személyes éved",
        text: `A ${profile.personalYearNumber}-es személyes éved ${year.title.toLocaleLowerCase("hu-HU")} minőséget hoz elő. A ${profile.personalMonthNumber}-es személyes hónap ezt most közelebbre húzza: nem az egész életedet kell átrendezned, hanem azt a pontot, ahol már érzed a következő lépést.`,
      },
    ],
    oneSentence: `A ${profile.lifePathNumber}-es sorsszámod akkor dolgozik tisztán, ha nem szerepet választasz, hanem ritmust.`,
    safetyNote: SAFETY_NOTE,
    meta: { fallbackUsed: true, readingType: "numerology" },
  };
  const guard = guardQualityReading(reading, [
    String(profile.lifePathNumber),
    profile.fullName ?? "",
    String(profile.personalYearNumber),
  ]);
  reading.meta = { ...reading.meta, qualityIssues: guard.issues };
  return reading;
}
