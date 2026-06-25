import { type TarotCard } from "@/data/cards";
import { guardQualityReading } from "./qualityGuard";
import { SAFETY_NOTE, type QualityReading } from "./styleRules";

export type TarotQualityInput = {
  readingType: "Mai lap" | "3 lapos húzás" | "Döntés előtt" | "Randi előtt";
  cards: TarotCard[];
  question?: string;
  category?: string;
};

export function composeThreeCardTarot(input: TarotQualityInput): QualityReading {
  const [past, present, future] = input.cards;
  const category = input.category ?? "általános élethelyzet";
  const q = input.question?.trim();
  const reading: QualityReading = {
    title: q ? `A kérdésed íve · ${q}` : `Három lap · ${category}`,
    sections: [
      {
        heading: "Múlt — honnan jön ez a helyzet?",
        text: `A ${past.name} azt mutatja, hogy ez a helyzet nem a semmiből érkezett: a ${past.keywords[0].toLowerCase()} minősége már korábban is dolgozhatott benned. ${past.general}`,
      },
      {
        heading: "Jelen — milyen minta aktív most?",
        text: `A ${present.name} a jelenben azt kérdezi, mit nem mondasz ki teljesen. A ${category} témájában ez inkább belső feszültség, mint kész válasz: ${present.general}`,
      },
      {
        heading: "Jövő — merre mozdulhat?",
        text: `A ${future.name} nem biztos jövőt mutat, hanem irányt: a ${future.keywords[0].toLowerCase()} akkor nyílhat meg, ha nem ugyanazzal a reakcióval mész tovább, amivel eddig. ${future.general}`,
      },
      {
        heading: "A három lap együtt",
        text: `A három lap együtt egy ismétlődő mintát jelezhet: ami ${past.keywords[0].toLowerCase()}ként indult, most ${present.keywords[0].toLowerCase()} formájában kér figyelmet, és ${future.keywords[0].toLowerCase()} felé mozdulhat. Ez nem három külön tanács, hanem egy történet.`,
      },
      {
        heading: "Mire figyelj most?",
        text: present.warning,
      },
    ],
    oneSentence: q
      ? `A kérdésedre a lapok nem lezárást, hanem érzelmi irányt mutatnak.`
      : `A három lap most nem siettet: a mintát kell észrevenned.`,
    safetyNote: SAFETY_NOTE,
    meta: { fallbackUsed: true, readingType: "tarot" },
  };
  const guard = guardQualityReading(reading, [
    q ?? "",
    category,
    ...input.cards.map((c) => c.name),
  ]);
  reading.meta = { ...reading.meta, qualityIssues: guard.issues };
  return reading;
}
