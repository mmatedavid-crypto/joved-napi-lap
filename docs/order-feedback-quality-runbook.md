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
GET /api/internal/order-feedback/summary?days=30
Authorization: Bearer <ORDER_FEEDBACK_SUMMARY_SECRET>
```

A `days` 1 és 180 közötti egész szám lehet. Alapértelmezés: 30 nap.

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
- `watch_next_orders`: még ne módosíts vakon, de figyeld a következő rendeléseket.
- `no_action`: nincs azonnali minőségi teendő.

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
2. Kezdd a `high` prioritású termékekkel.
3. Ha nincs `high`, nézd meg a `medium` termékeket, ahol `negativeDetailCount > 0`.
4. Javítás után figyeld, csökken-e a `missRate` és a `negativeDetailCount`.
5. A termék akkor javul üzletileg is, ha nem csak a panasz csökken, hanem az `accurate` arány nő.
