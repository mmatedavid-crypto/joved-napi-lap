## Mit építünk

A `roxyTranslate.functions.ts` már bevált mintáját (Roxy nyers angol → szigorú „csak fordítok, nem találok ki" AI-réteg → magyar JSON → cache) kiterjesztjük a tarotra. A jelenlegi `aiTarotReadingHU` (ami **fogalmazó** módban dolgozik a `readingQuality/prompts.ts` alapján) többé nem szerepel a tarot folyamokban.

Fontos: ebben a kódbázisban a „Roxy translate" **nem** egy külön Roxy API endpoint, hanem a `roxyTranslate.functions.ts` szigorú-fordító réteg. A horoszkóp, kristály, angyalszám, álom, számmisztika MIND így működik már — a tarot kimaradt. Ezt pótoljuk.

## Új szerver fn-ek (`src/lib/roxyTranslate.functions.ts`)

1. **`aiTarotDailyHU({ dateKey })`** — Roxy `/tarot/daily` → `TarotCardHU`
   - Mezők: `cardName` (magyar, a meglévő `cards.ts` neve), `reversed`, `meaning`, `love`, `career`, `finances`, `health`, `spirituality`, `oneLine`.
   - Cache: 24h.

2. **`aiTarotDrawHU({ count, seed?, allowReversals, question? })`** — Roxy `/tarot/draw` → `TarotSpreadHU`
   - Mezők: `cards: TarotCardHU[]`, `oneLine` (összefoglaló a forrásból, ha van).
   - Cache: seed alapján 7 nap, seed nélkül nincs cache.

Mindkettő ugyanazt a `TRANSLATOR_SYSTEM` promptot használja, és `guardAITextObject`-tel ellenőrzi a kimenetet (tiltott panelmondatok, magyar nyelv).

## Átállított oldalak (5)

- `src/components/PersonalDailyBriefing.tsx` (főoldal): `SpreadDeck` helyett `CardBack` reveal mint a `/mai-lap`-nál; tartalom `aiTarotDailyHU`-ból. A `drawnCard.general` és `drawnCard.daily` helyi szövegek kivezetve. Az enrichment (horoszkóp, kristály, sorsszám) változatlan.
- `src/routes/mai-lap.tsx`: `roxyTarotDraw` + `aiTarotReadingHU` helyett `aiTarotDailyHU`. Az „extra húzás" `aiTarotDrawHU(count=1, seed=random)`-ot hív.
- `src/routes/harom-lap.tsx`: `aiTarotDrawHU(count=3, seed=...)`.
- `src/routes/dontes-elott.tsx`: `aiTarotDrawHU(count=1, question)`.
- `src/routes/randi-elott.tsx`: `aiTarotDrawHU(count=1, question)`.

A lap-objektumokat (kép, magyar név) továbbra is a `mapRoxyToLocal` / `roxyCardMap.ts` adja — a `cards.ts` `name`, `image`, `keywords` része megmarad.

## Mit nem érintünk most

- A `cards.ts` prózai mezőinek (`general/love/decision/warning/daily`) tényleges törlését, valamint a `paidReadings.ts` / `RitualTable.tsx` / `tarotEngine.ts` átállítását külön körben végezzük — most csak a 4 ingyenes tarot folyam + főoldal kerül Roxy-fordító útvonalra, hogy a tartalom-minőség azonnal megugorjon és láthassuk az eredményt.
- `aiTarotReadingHU` egyelőre marad a fájlban (még hivatkozhat rá a `paidReadings`); a következő körben távolítjuk el, amikor a fizetős és RitualTable folyamot is átállítjuk.

## Kockázat

- A Roxy `/tarot/daily` és `/tarot/draw` válaszsémája részben különböző (single card vs. cards array). Két külön translate fn kezeli őket, közös guard-dal.
- Az AI-fordítás 1-3 mp késleltetést ad — `ReadingLoadingState`-tel kezelve, mint eddig.
