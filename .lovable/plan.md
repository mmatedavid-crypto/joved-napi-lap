
## Cél

A teljes termékkínálat újrarendezése a megbeszélt logika szerint, egy körben.

## Új termékstruktúra

### Ingyenes termékek (SEO + Google News)

1. **Napi lap** (1 lap) — meglévő, marad ingyenes alaplapnak
2. **Horoszkóp** — napi / heti / havi mindhárom periódus mind a 12 jegyre, teljesen ingyenes
3. **Angyalszámok** — új SEO landing oldalak: 111, 222, 333, 444, 555, 666, 777, 888, 999, 000, 11:11, 12:12, 22:22, 13:13 (+ a meglévő `/angyalszam` kalkulátor és `/angyalszam-jelentese` is ingyenes marad)
4. **Bioritmus** — új ingyenes termék Roxy `/biorhythm` endpointból (fizikai / érzelmi / szellemi görbe)
5. **Kristályok** — meglévő `/kristaly` marad teljesen ingyenes

### Fizetős termékek

| Termék | Ár | Route |
|---|---|---|
| Napi lap kibővített olvasat | 590 Ft | meglévő `/mai-lap` paywall |
| 3 lapos kelta kereszt jelentés | 990 Ft | meglévő `/harom-lap` (lapok ingyen kihúzva, jelentés zárolt) |
| Szerelmi tarot jelentés | 990 Ft | meglévő `/osszeillunk` (lapok ingyen, jelentés zárolt) |
| Döntés előtt jelentés | 990 Ft | meglévő `/dontes-elott` (lapok ingyen, jelentés zárolt) |
| **A következő 30 napod térképe** | **1490 Ft** | **új `/szemelyes-30-napos-horoszkop`** |
| **Védikus asztrológia teljes elemzés** | **1990 Ft** | **új `/vedikus-asztrologia`** |

## Részletek termékenként

### 1. Pricing restructure — meglévő tarot termékek

A 3 lap / szerelmi / döntés flow átalakítása:
- A lapok húzása és képi megjelenítése ingyenes marad
- A **lapok jelentése** (kombinációs olvasat) kerül paywall mögé 990 Ft-ért
- A pozíciók nevei (múlt / jelen / jövő stb.) ingyen láthatók
- Paywall CTA a jelentés helyén jelenik meg

A `products.ts` árazási táblát igazítjuk, a paywall trigger pontját a meglévő olvasat-flow-ban tartjuk.

### 2. Angyalszám SEO landing oldalak

Új dinamikus route: `/angyalszam/$pattern` (pattern = "111", "222", "11-11" stb. URL-safe formátumban). Minden mintára:
- saját H1 (pl. „111 angyalszám jelentése")
- saját meta title + description + OG
- 600–900 szavas tartalom (jelentés, szerelem, munka, spirituális üzenet, gyakori előfordulás)
- belső linkek a többi angyalszámra és a számmisztika kalkulátorhoz
- bekerül a sitemap.xml + sitemap-news.xml-be

Statikus minták listája `src/lib/angel.hu.ts`-be (már létezik, kibővítjük).

### 3. Bioritmus ingyenes termék

Új route: `/bioritmus`. Form: születési dátum. Backend server fn hívja Roxy `/biorhythm` endpointot, a választ EN→HU fordítjuk (csak fordítás, nincs hozzáadott interpretáció), és megjelenítjük a 3 görbét (fizikai / érzelmi / szellemi) a következő 30 napra.

SEO meta + sitemap-be.

### 4. Védikus asztrológia (1990 Ft)

Új route: `/vedikus-asztrologia`. Form: születési dátum / idő / hely. Fizetés után webhookból:
- Roxy `/location/search` → város koordináták
- Roxy `/vedic/*` endpointok (nakshatra, dasha, rashi, házak, yogák — az API-doksi alapján amit visszaad)
- Magyar fordítás (csak fordítás)
- Többoldalas grafikus jelentés generálás, mentés `orders.result_payload`-ba

### 5. A következő 30 napod térképe (1490 Ft) — részletes spec

**Route**: `/szemelyes-30-napos-horoszkop`

**Form mezők**:
- Születési dátum (kötelező)
- Születési idő — opcionális (üresen 12:00 fallback + „közelítő elemzés" jelölés)
- Születési hely / város (kötelező)
- Életterület — radio: Szerelem / Munka / Pénz-döntés / Általános
- Rövid kérdés (max 240 karakter, opcionális)
- Email (kötelező)

**Fizetés után webhookból**:
1. `GET /location/search?q={city}` → `cities[0]` latitude / longitude / timezone
2. `POST /astrology/natal-chart` (név, dátum, idő vagy 12:00 fallback, koordináták, timezone)
3. `POST /forecast/timeline` (startDate = ma, endDate = ma+30, születési adatok)
4. AI Gateway-vel EN→HU fordítás a megadott szigorú prompttal — csak fordítás, semmi hozzáadás
5. Magyar report összeállítás fix címkékkel:
   - A következő 30 napod fő témája
   - Születési képleted röviden
   - Legfontosabb időablakok
   - Szerelem / kapcsolatok
   - Munka / pénz / döntések
   - Mire figyelj
   - Záró üzenet
6. Mentés DB-be: user input + Roxy location + natal + forecast nyers JSON + magyar report + payment_id + createdAt
7. Köszönő oldalon megjelenik (rendelés ID alapján)

Jogi lábjegyzet a riport alján: „A Jövőd.hu szórakoztató és önismereti célú tartalmat nyújt. Nem orvosi, jogi, pénzügyi, pszichológiai vagy krízistanácsadás."

## Technikai részletek

### Új fájlok
- `src/routes/szemelyes-30-napos-horoszkop.tsx` (form + paywall trigger)
- `src/routes/vedikus-asztrologia.tsx`
- `src/routes/bioritmus.tsx`
- `src/routes/angyalszam.$pattern.tsx` (SEO dinamikus)
- `src/lib/products/personal30day.server.ts` (Roxy flow)
- `src/lib/products/vedic.server.ts`
- `src/lib/products/biorhythm.server.ts`
- `src/lib/roxyTranslate.ts` — szigorú EN→HU fordító (már létezik translate.functions, kibővítjük strict módú varianssal)

### DB
A meglévő `orders` táblába mentünk minden fizetős rendelést `product_slug` + `input_payload` + `result_payload` mezőkbe (már megvannak). Új migrációra nincs szükség.

### Roxy szigorú fordítás
Az AI-t **kizárólag** EN→HU fordításra használjuk a megadott prompttal. Külön „strict translate" függvény, ami nem fut át a meglévő prémium-író promptokon. A meglévő `paidReadings.server.ts` szabadon író util-t a 30-napos és védikus terméknél NEM hívjuk.

### Webhook & koszonjuk oldal
A meglévő `/api/public/payments/webhook` route már kezeli a fizetett rendeléseket — bővítjük az új `product_slug`-okra (`personal_30_day`, `vedic_full`) hogy a megfelelő Roxy flow-t hívja, ne az ingyenes prémium-író fallbacket.

### Sitemap & SEO
`sitemap.xml` és `sitemap-news.xml` bővítése az új ingyenes oldalakkal (angyalszám landingek, bioritmus). A fizetős oldalak `noindex`.

### Payments
Új price-okat hozok létre a sandbox payments-ben (`personal_30_day_price` = 1490 Ft, `vedic_full_price` = 1990 Ft). A többi meglévő price-t változatlanul hagyom.

## Sorrend a végrehajtásban

Egy körben, de belül logikus blokkokban:
1. `products.ts` + új price-ok + paywall logika átállítása (tarot termékek 990 Ft, napi 590 Ft)
2. Horoszkóp paywall eltávolítása (teljesen ingyenes)
3. Kristály paywall eltávolítása (ha van)
4. Angyalszám dinamikus SEO route + sitemap
5. Bioritmus új route + Roxy biorhythm flow
6. 30 napos horoszkóp új route + Roxy flow + webhook bekötés
7. Védikus asztrológia új route + Roxy flow + webhook bekötés
8. Árlista oldal (`/arak`) frissítése az új struktúrára

## Mit nem fogok érinteni

- A meglévő ingyenes napi lap (`/mai-lap`) húzás flow
- A meglévő `paidReadings.server.ts` (a régi 990 Ft-os tarot termékek továbbra is használhatják)
- Email / order delivery infrastruktúra
- Auth, profile, user roles

Ha jóváhagyod, megyek és csinálom egyben.
