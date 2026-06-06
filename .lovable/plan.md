# Fizetési és felhasználói rendszer — jovod.hu

## Áttekintés
Egyszeri vásárlás Stripe-pal (vendégként is). Regisztráció ingyenes és előzményt ment. Nagyobb tételeknél 12–24 órás emailes válasz, +990 Ft-os "express" gyorsítóval (6 óra).

## 1. Termékkatalógus

**Azonnali (490–990 Ft):**
- Napi lap AI értelmezés — 490 Ft
- Mai iránytű AI — 590 Ft
- Angyalszám AI — 490 Ft
- Kristály ajánlás AI — 490 Ft
- Álomfejtés AI (rövid) — 790 Ft
- Horoszkóp AI személyre szabva — 990 Ft
- Extra napi húzás (cap feloldása) — 490 Ft

**Késleltetett, 12–24 órán belül emailben (1990–2990 Ft):**
- Három lap mély elemzés — 1990 Ft
- Kelta kereszt / nagy spread — 2990 Ft
- Döntés előtt komplex elemzés — 2490 Ft
- Randi előtt / összeillünk párkapcsolat-elemzés — 2490 Ft
- Számmisztika életút-elemzés — 2490 Ft

**Express gyorsító:** +990 Ft → 6 órán belüli válasz (csak késleltetett termékekhez)

## 2. Felhasználói modell

- **Vendég:** email megadás kötelező vásárláskor → a megrendelés és a válasz az emailhez van kötve. Nincs előzmény-megtekintés.
- **Regisztrált (Google / Apple):** ugyanaz, plusz az `előzmények` oldalon visszanézheti a korábbi húzásokat és válaszokat. Regisztráció ingyenes, semmi extra fizetős funkciót nem ad — csak history-t.
- A vendég és a regisztrált email azonos → vásárláskor a rendszer felajánlja: "Regisztrálj és nézd vissza később".

## 3. Fizetési flow

1. Felhasználó terméket választ → "Megvásárlás" gomb
2. Email mező (ha nincs bejelentkezve) → Stripe Checkout
3. Sikeres fizetés után Stripe webhook → `orders` tábla `paid` állapotra
4. **Azonnali termék:** ott helyben generálja az AI választ (meglévő szerver-fn-ekkel), megjeleníti + emailben is elküldi
5. **Késleltetett termék:** "Köszönjük, 12–24 órán belül emailben küldjük" képernyő, sorba kerül, cron 5 percenként feldolgozza, email kimegy a válasszal
6. Express gyorsító: külön line item a Stripe Checkout-on, a cron prioritást ad

## 4. Mit építünk

### Backend
- **Auth bekapcsolása:** Google + Apple OAuth (Lovable Cloud managed). Email/jelszó letiltva.
- **Adatbázis:**
  - `profiles` — user ID, email, created_at
  - `products` — termék katalógus (id, slug, name, price_huf, category, delivery_minutes)
  - `orders` — id, user_id (nullable), guest_email, product_slug, status, stripe_session_id, input_payload, response_payload, paid_at, deliver_by, delivered_at, express
  - `order_history` view — bejelentkezett user saját rendelései
- **Stripe (beépített) bekapcsolása** `enable_stripe_payments`-szel, automatic_tax + 0.5% (mert magyar seller, full compliance nem elérhető)
- **Server functions:**
  - `createCheckoutSession` — termék + email + (express?) → Stripe Checkout URL
  - `stripeWebhook` (`/api/public/stripe/webhook`) — aláírás-ellenőrzés, `orders` frissítés, azonnali termékeknél AI hívás
  - `getMyOrders` — bejelentkezett user előzményei
- **Késleltetett feldolgozó:** `/api/public/cron/process-delayed-orders` + pg_cron 5 percenként → lekér pending késleltetett orders-t, AI hívás, email küldés
- **Email:** Lovable beépített app emails — `order-confirmation`, `delayed-result` template-ek

### Frontend
- **Termék kártya komponens** árazással, "Megvásárlás" gombbal
- **Checkout dialog:** email mező + express checkbox (csak késleltetettnél) + "Tovább a fizetéshez"
- **Sikeres fizetés visszatérő oldal** (`/koszonjuk?session_id=...`): azonnali eredmény VAGY "Emailben küldjük" üzenet
- **`/elozmenyek` oldal** (csak bejelentkezve): rendelések listája, válasz újranézése
- **`/belepes` oldal:** Google + Apple gombok
- **Layout módosítás:** ha be van jelentkezve → profil ikon az "Előzmények" linkkel; ha nincs → "Belépés" gomb
- **Fizetős funkciók paywall:** meglévő ingyenes route-okon (mai-lap, álomfejtés, stb.) az "AI értelmezés" gombot mostantól vásárláshoz köti

## 5. Mit NEM építünk most
- Saját számlázás / NAV online számla — Stripe Tax + cég bejegyzés után manuális számlázó programmal (Számlázz.hu, Billingo) intézed
- Visszatérítés UI — Stripe Dashboard-ból kezelhető
- Marketing emailek — nem támogatott
- Apple Sign In credentials BYOC — managed verzióval indulunk

## 6. Sorrend
1. Stripe bekapcsolása + adatbázis schema (products, orders, profiles)
2. Google + Apple auth + `/belepes` + `/elozmenyek`
3. Termék katalógus seedelése + Stripe termékek létrehozása
4. Checkout dialog + `createCheckoutSession` + visszatérő oldal
5. Stripe webhook + azonnali termékek AI flow-ja
6. Email infrastruktúra + cron + késleltetett termékek
7. Meglévő route-ok paywall-osítása

## Megjegyzések
- Stripe bekapcsolása előtt **Pro plan** kell. Ha még nincs, ezt elsőként meg kell oldanod.
- A bekapcsolás után először teszt-környezet jön létre, valódi pénz csak akkor mozog, ha céget alapítasz és Stripe-on átmegy a verifikáció.
- A 0.5% tax calculation surcharge a magyar EV miatt szükséges — a vásárlótól szedi be, neked nem költség.

---

Jóváhagyod ezt a tervet, vagy módosítsunk valamit (árak, termékkör, late delivery idők)?
