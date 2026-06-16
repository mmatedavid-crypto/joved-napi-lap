# Fizetős olvasatok minőségi visszajelzésének runbookja

Ez az internal folyamat azt segít eldönteni, melyik fizetős terméket kell először emberileg
átolvasni vagy termékoldalon javítani. Nem ügyféladat-lista, hanem aggregált minőségjelző.

## Környezeti változó

Állíts be egy külön, erős secretet:

```text
ORDER_FEEDBACK_SUMMARY_SECRET
```

Az endpoint a `SUPABASE_SERVICE_ROLE_KEY` kulccsal is elfogadott, de napi üzemeltetéshez a külön
`ORDER_FEEDBACK_SUMMARY_SECRET` ajánlott. Ezt ne tedd frontend környezetbe, ne írd bele Lovable
publikus beállításba, és ne küldd át ügyfélnek.

## Endpoint

```text
GET /api/internal/order-feedback/summary?days=30&staleProcessingMinutes=15
Authorization: Bearer <ORDER_FEEDBACK_SUMMARY_SECRET>
```

A `days` 1 és 180 közötti egész szám lehet. Alapértelmezés: 30 nap.
A `staleProcessingMinutes` azt jelzi, hány perc után számít elakadt feldolgozásnak egy
`processing` rendelés. Alapértelmezés: 15 perc, legfeljebb 180 perc.

## Mit ad vissza?

Az összesítés termékenként tartalmazza:

- `total`: ennyi fizetős visszajelzés érkezett.
- `accurate`, `partial`, `missed`: a három visszajelzési kategória darabszáma.
- `negative`: `partial + missed`.
- `missRate`: a részleges vagy negatív jelzések aránya.
- `detailCount`: hány valódi szöveges pontosítás érkezett.
- `negativeDetailCount`: hány részleges vagy negatív szöveges pontosítás érkezett.
- `reviewPriority`: `high`, `medium` vagy `low`.
- `reviewRecommendation`: rövid belső teendőjelzés.

Az endpoint ezen felül ad egy `orderHealth` blokkot is. Ez nem ügyféladat, hanem fizetős rendelési
állapotfigyelő:

- `open`: hány `failed`, `processing` vagy még `paid` állapotú rendelés látszik az időablakban.
- `failed`: hány rendelés futott hibára a feldolgozásban.
- `staleProcessing`: hány `processing` rendelés régebbi a `staleProcessingMinutes` küszöbnél.
- `express`: hány érintett rendelés expressz.
- `needsAttentionCount`: hány termék/státusz csoport kér emberi figyelmet.
- `products`: termék, kategória, státusz, `errorCode`, darabszám és legrégebbi/legfrissebb időpont
  szerinti aggregátum.

Az `errorCode` csak stabil belső kód lehet. Ha régi adatban nyersebb hibaszöveg lenne, az összesítő
`internal_error` értékre cseréli, hogy ne kerüljön ki provider vagy ügyfélhez kapcsolódó részlet.

Ha az `orderHealth` lekérés nem sikerül, az endpoint `order_health_summary_unavailable` hibát ad.
Ez belső üzemeltetési jelzés, nem ügyfélnek szánt szöveg.

Az endpoint külön `deliveryEmailHealth` blokkot is ad a már `delivered` állapotú fizetős
olvasatokról. Ez azt figyeli, hogy az elkészült olvasathoz tartozó kézbesítési email rendben
sorba állt-e:

- `delivered`: hány elkészült rendelést vizsgált az időablakban.
- `queued`: hány rendelésnél látszik email-sorbaállítás.
- `missing`: hány elkészült rendelésnél nincs email-sorbaállítás és nincs stabil hibakód sem.
- `failed`: hány elkészült rendelésnél stabil email-kézbesítési hibakód látszik.
- `needsAttentionCount`: hány termék/email állapot csoport kér emberi figyelmet.
- `products`: termék, kategória, email állapot, `errorCode`, darabszám és időablak szerinti
  aggregátum.

Ha a `deliveryEmailHealth` lekérés nem sikerül, az endpoint
`delivery_email_health_summary_unavailable` hibát ad. Ez különösen fontos, mert az olvasat ettől még
elkészülhetett, de az ügyfél csak akkor érzi biztonságosnak a vásárlást, ha emailben vagy a
profiljában ténylegesen megtalálja.

## Prioritások

`high`
: Ezzel kezdd. Több negatív részletes jelzés vagy magas nem-talált arány látszik.

`medium`
: Figyelni kell. Lehet, hogy még kevés az adat, de már van részletes negatív jelzés vagy romló
arány.

`low`
: Nincs azonnali teendő, de a trendet érdemes tovább gyűjteni.

## Ajánlások értelmezése

- `manual_review_first`: először ezt a terméket érdemes emberileg átnézni.
- `read_feedback_details`: van részletes negatív jelzés, belső ügyfélszolgálati nézetben érdemes
  megnézni.
- `retry_watch`: a rendelésfeldolgozás nem feltétlenül hibás, de van elakadt `processing` csoport,
  amire rá kell nézni.
- `watch_next_orders`: még ne módosíts vakon, de figyeld a következő rendeléseket.
- `no_action`: nincs azonnali minőségi teendő.

Az `orderHealth.products[].action` értelmezése:

- `manual_review_first`: van `failed` rendelés; először ellenőrizd, hogy a fizetés sikeres volt-e,
  majd indíts újrafeldolgozást vagy készíts kézi pótlást.
- `retry_watch`: nincs stabil hiba, de a feldolgozás túl régóta fut. Előbb várj vagy indíts
  biztonságos újrapróbálást.
- `watch`: nincs azonnali beavatkozási jel.

A `deliveryEmailHealth.products[].action` értelmezése:

- `manual_review_first`: az olvasat elkészült, de email-kézbesítési hibakód látszik. Ellenőrizd,
  hogy a profilban vagy biztonságos rendelési linken elérhető-e, majd szükség esetén küldj kézi
  pótlást.
- `retry_watch`: az olvasat elkészült, de nincs email-sorbaállítási nyom. Ez lehet régi adat vagy
  félbeszakadt kézbesítési állapot, ezért ezt nézd meg a failed rendelések után.
- `watch`: az email-sorbaállítás rendben látszik.

## Biztonsági határok

Az összesítő nem adhat vissza:

- rendelésazonosítót,
- Stripe azonosítót,
- teljes olvasati szöveget,
- nyers ügyfélmegjegyzést,
- email címet.

A részletes megjegyzések csak ügyfélszolgálati vagy hibajavítási kontextusban használhatók. Ha egy
termék `high` prioritású, ne a felhasználó személyes történetét másold promptba, hanem a visszatérő
minőségi mintát fogalmazd át belső fejlesztési megfigyeléssé.

## Napi használat

1. Nézd meg a 30 napos összesítést.
2. Először az `orderHealth.needsAttentionCount` értéket nézd meg, mert a ki nem adott fizetős
   olvasat sürgősebb, mint a későbbi minőségi visszajelzés.
3. Ha van `failed` vagy régi `processing`, kezdd a `manual_review_first` és `retry_watch`
   csoportokkal.
4. Utána nézd meg a `deliveryEmailHealth.needsAttentionCount` értéket. A `failed` vagy `missing`
   email állapot ügyféloldalon ugyanúgy bizalomvesztéshez vezethet, mint egy elakadt feldolgozás.
5. Ezután menj a `high` prioritású termékekre.
6. Ha nincs `high`, nézd meg a `medium` termékeket, ahol `negativeDetailCount > 0`.
7. Javítás után figyeld, csökken-e a `missRate`, a `negativeDetailCount`, a `failed` és a `missing`
   email arány.
8. A termék akkor javul üzletileg is, ha nem csak a panasz csökken, hanem az `accurate` arány nő.
