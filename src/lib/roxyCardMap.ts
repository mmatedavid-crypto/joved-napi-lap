// Client-safe mapping helpers: drawn source cards -> local TarotCard for display,
// plus a source-only editor input. Local Hungarian template text stays out,
// so the result remains forráshű.
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
  // (a render nem szivárog be a szerkesztői szövegbe, csak képet ad).
  return CARDS[0];
}

export function mapRoxyToLocal(roxy: RoxyDrawnCard[]): LocalDrawn[] {
  return roxy.map((r) => ({ card: findLocal(r), reversed: r.reversed, roxy: r }));
}

// Szerkesztői bemenet minden kártyához. Szándékosan nem adjuk át a helyi
// general/love/decision/warning/daily mezőket; csak a kapott jelképi
// forrásmezőket, hogy ne sablonból készüljön az olvasat.
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
