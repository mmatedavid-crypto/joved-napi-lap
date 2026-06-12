## SEO-mega csomag — terv

A korábbi listából minden zöld (1–11) + a kiegészítések. Hreflang **nem** kell (magyar only).

### Új ingyenes SEO landing-ek (Roxy + statikus tartalom)

1. **Tarot kártya enciklopédia** — 78 oldal
   - Route: `/tarot/$slug`
   - Forrás: Roxy `/tarot/card/{id}` + magyar fordítás cache (Supabase `tarot_card_meanings` tábla)
   - Bake script: `scripts/bake-tarot.ts` — 78 kártya magyarítva
   - Per-card: jelentés (egyenes/fordított), szerelem, munka, egészség, tanács, kapcsolódó kártyák
   - Hub oldal: `/tarot` — 78 kártya grid (Nagy Arkánum + 4 szín)
   - JSON-LD: Article + BreadcrumbList

2. **Kínai zodiákus** — 12 állat + év szerinti almatrix
   - `/kinai-horoszkop` (hub)
   - `/kinai-horoszkop/$animal` (12 oldal: patkány…disznó)
   - `/kinai-horoszkop/$animal/$year` (opcionális, csak 1924–2032 születésű évek → SEO long-tail)
   - Tartalom: jellemzők, szerelem, munka, kompatibilitás, szerencsés szín/szám, idei év előrejelzése
   - JSON-LD: Article + BreadcrumbList

3. **I Ching / Ji King hexagramok** — 64 oldal
   - `/jiking` (hub) + `/jiking/$n` (1–64)
   - Statikus tartalom magyarul (lib/iching.hu.ts már létezik — bővítjük)

4. **Napi szerencseszámok widget** — `/szerencseszamok`
   - Friss naponta, jegy szerint 6 szám + lottó-tipp

5. **Tarot napi húzás bővítés** — már megvan, de FAQ schema + belső linkek a kártya-oldalakra

### Új fizetős termékek

6. **Éves személyes horoszkóp** — `personal_yearly` — 4990 Ft
   - 12 hónap × ~500 szó, Roxy `/yearly-horoscope` + AI bővítés
   - Termék landing: `/eves-horoszkop`
   - Bake szerver-funkció + cache (mint `personal30day`)

7. **Tranzitok jelentés** — `transits_personal` — 3990 Ft
   - Mostani bolygóállás × natál képlet, 6 hónap előretekintés

### Numerológia bővítés (a meglévő `/sorsszam` mellé)

8. **Új ingyenes numerológiai oldalak**:
   - `/sorsszam/$n` — már megvan (1–9, 11, 22, 33)
   - `/lelek-szam/$n` (1–9, 11, 22, 33) — Soul urge number, magánhangzókból
   - `/szemelyiseg-szam/$n` (1–9, 11, 22, 33) — Personality, mássalhangzókból
   - `/kifejezes-szam/$n` (1–9, 11, 22, 33) — Expression number
   - `/eves-szam/$n` (1–9) — Personal year number
   - Új numerológia hub: `/numerologia` (kalkulátorok + magyarázatok index)

### SEO infrastruktúra

9. **Breadcrumb komponens** — `<Breadcrumb />` minden tartalmi oldalra
   - Vizuálisan: Home › Szekció › Aloldal
   - JSON-LD `BreadcrumbList` minden landingen
   - Beépítés: SeoLandingPage + minden új route

10. **Sitemap bővítés** — `src/routes/sitemap[.]xml.tsx`
    - +78 tarot kártya
    - +12 kínai állat (+ év almatrix opcionális)
    - +64 jiking
    - +numerológia új altípusok (4 új × ~12 = ~48 oldal)
    - Új termék oldalak

11. **News sitemap bővítés** — `sitemap-news.xml`
    - Horoszkóp mellett: kínai napi (12), tarot napi húzás, mai iránytű, holdfázis hírek
    - Csak az utóbbi 48 órán belül frissült cikkek (Google News policy)

12. **Web Vitals audit**
    - `scripts/audit-web-vitals.mjs` — lighthouse CI a top 20 oldalra
    - Eredmények `audit/web-vitals.json`, integrálva a `product-quality.yml` workflow-ba
    - Konkrét fixek a TOP problémákra (image lazy loading, font preload, JS chunk split)

13. **Tartalom marketing (blog)**
    - Új route: `/magazin` (hub) + `/magazin/$slug` (cikk)
    - Supabase `blog_posts` tábla (title, slug, excerpt, body_md, cover, published_at, tags)
    - 10 seed cikk magyarul (pl. "Hogyan olvass tarotot kezdőként", "Mire jó a sorsszám", "Holdfázisok és rituálék", "Kínai új év 2026")
    - Schema.org Article + author + datePublished

### Műszaki részletek

- **Hreflang**: nem teszünk, mert csak magyar van.
- **Roxy fordítás cache**: meglévő `roxyTranslate.functions.ts` + Supabase tábla, új tartalomtípusok hozzáadása.
- **Új Supabase migrációk**: `tarot_card_meanings`, `blog_posts`, `chinese_zodiac_cache`.
- **Bake scriptek**: `scripts/bake-tarot.ts`, `scripts/bake-chinese.ts`, `scripts/bake-iching.ts` (egyszer futnak, eredmény a DB-ben).
- **Routes naming**: dot-separated TanStack konvenció, breadcrumb-helper a `src/lib/breadcrumbs.ts`-ben.
- **Menü integráció**: új hub-okat (`/tarot`, `/kinai-horoszkop`, `/numerologia`, `/jiking`, `/magazin`) felvesszük a footerbe és a mobil hamburger menübe; bottom nav változatlan (5 ikon marad).

### Sorrend (commit-grupok)

1. **Infra**: Breadcrumb komponens + helper, sitemap helper bővítés, JSON-LD utility
2. **Tarot enciklopédia**: tábla + bake + route + hub
3. **Kínai zodiákus**: tartalom + 12 route + hub
4. **I Ching**: 64 route + hub
5. **Numerológia bővítés**: 4 új altípus × oldalak
6. **Éves horoszkóp + tranzitok** (fizetős)
7. **Sitemap + news sitemap bővítés**
8. **Blog (`/magazin`) infra + 10 seed cikk**
9. **Web Vitals audit script + workflow integráció**
10. **Linkelés, meta finomítás, FAQ schema bővítés**

### Becsült skála

- ~78 + 12 + 64 + 48 + 10 + 2 = **~214 új SEO indexelhető oldal**
- 2 új fizetős termék
- 3 új Supabase migráció
- 1 új audit pipeline

Ha a terv jó, megyek és **az 1–4 commit-csoportot** (infra + tarot + kínai + jiking) végigtolom egy menetben, mert ez a legnagyobb SEO ütőkártya. A többi (numerológia bővítés, fizetős termékek, blog, web vitals) jönne utána. Szólj, ha valamit kivennél vagy a sorrendet máshogy kéred.
