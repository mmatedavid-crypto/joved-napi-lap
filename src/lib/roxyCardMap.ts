// Client-safe mapping helpers: Roxy drawn cards → local TarotCard for display,
// and → AI prompt input that uses ONLY Roxy English source fields (no helyi
// magyar jelentés-szöveg kerül az AI-ba, így nem találhat ki sablonokat).
import { CARDS, type TarotCard } from "@/data/cards";
import type { RoxyDrawnCard } from "./roxyNormalize";

export type LocalDrawn = {
  card: TarotCard;
  reversed: boolean;
  roxy: RoxyDrawnCard;
};

function findLocal(roxy: RoxyDrawnCard): TarotCard {
  if (roxy.localId) {
    const hit = CARDS.find((c) => c.id === roxy.localId);
    if (hit) return hit;
  }
  // Utolsó esély: ha valami miatt nem mappelt, A Bolond legyen a vizuális fallback
  // (a render nem fog AI-ba szivárogni, csak képet ad).
  return CARDS[0];
}

export function mapRoxyToLocal(roxy: RoxyDrawnCard[]): LocalDrawn[] {
  return roxy.map((r) => ({ card: findLocal(r), reversed: r.reversed, roxy: r }));
}

// AI prompt input minden kártyához. SZÁNDÉKOSAN nem adjuk át a helyi
// general/love/decision/warning/daily mezőket — csak a Roxy által adott
// angol forrásszövegeket. Így az AI fordít/stilizál, nem talál ki.
export function toAIInput(d: LocalDrawn) {
  return {
    id: d.card.id,
    name: d.roxy.roxyName || d.card.name,
    keywords: (d.roxy.keywordsEn && d.roxy.keywordsEn.length > 0
      ? d.roxy.keywordsEn
      : d.card.keywords
    ).slice(0, 8),
    reversed: d.reversed,
    meaningEn: d.roxy.meaningEn,
    loveEn: d.roxy.loveEn,
    careerEn: d.roxy.careerEn,
    financesEn: d.roxy.financesEn,
    healthEn: d.roxy.healthEn,
    spiritualityEn: d.roxy.spiritualityEn,
  };
}