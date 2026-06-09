import { createFileRoute } from "@tanstack/react-router";
import { LegalPage, LegalSection } from "@/components/LegalPage";
import { SITE_LEGAL } from "@/lib/legal";

export const Route = createFileRoute("/adatkezelesi-tajekoztato")({
  head: () => ({
    meta: [
      { title: "Adatkezelési tájékoztató | Jövőd.hu" },
      {
        name: "description",
        content: "A Jövőd.hu adatkezelési tájékoztatója.",
      },
    ],
    links: [{ rel: "canonical", href: "/adatkezelesi-tajekoztato" }],
  }),
  component: () => (
    <LegalPage
      eyebrow="Adatkezelés"
      title="Adatkezelési tájékoztató"
      lead="Röviden és érthetően arról, milyen adatokat kezelünk a Jövőd.hu használatakor."
    >
      <LegalSection title="Adatkezelő">
        <p>
          Adatkezelő: {SITE_LEGAL.operator.name}. Székhely: {SITE_LEGAL.operator.registeredOffice}.
          Kapcsolat:{" "}
          <a className="text-gold hover:text-gold/80" href={`mailto:${SITE_LEGAL.supportEmail}`}>
            {SITE_LEGAL.supportEmail}
          </a>
          .
        </p>
      </LegalSection>

      <LegalSection title="Milyen adatokat kezelünk?">
        <p>
          A szolgáltatás használatakor kezelhetünk email címet, rendelési adatot, fizetési
          állapotot, a kiválasztott olvasat típusát, a felhasználó által megadott kérdést vagy
          születési adatot, olvasati előzményt és visszatérő témamintát, valamint technikai és
          analitikai adatokat.
        </p>
        <p>Bankkártyaadatot nem tárolunk; a fizetést külső fizetési szolgáltató kezeli.</p>
      </LegalSection>

      <LegalSection title="Mire használjuk az adatokat?">
        <p>
          Az adatokat a digitális olvasat elkészítéséhez, a rendelés teljesítéséhez,
          ügyfélszolgálati segítséghez, visszaélések megelőzéséhez, valamint a szolgáltatás
          minőségének javításához használjuk.
        </p>
      </LegalSection>

      <LegalSection title="Személyesebb olvasati memória">
        <p>
          Ha bejelentkezve használod az oldalt, az olvasatok rövid összefoglalóját és néhány
          visszatérő motívumát eltárolhatjuk, hogy később ne minden alkalommal idegenként kezeljen a
          rendszer. Ez segíthet abban, hogy az új olvasatok finoman reflektáljanak arra, milyen
          témákhoz térsz vissza, vagy miben változott a fókuszod.
        </p>
        <p>
          Ez az emlékezet önismereti és szolgáltatásminőségi célú; nem használjuk orvosi,
          pszichológiai, jogi vagy pénzügyi profilalkotásra.
        </p>
      </LegalSection>

      <LegalSection title="Cookie-k és helyi böngészőadatok">
        <p>
          A működéshez és a személyesebb élményhez használhatunk cookie-t, localStorage-t vagy
          sessionStorage-t. Ilyen lehet például egy napi húzás megjegyzése, egy folyamatban lévő
          olvasat átmeneti adata, vagy az, hogy az összeillés kalkulátorban több különböző
          kapcsolatot néztél meg rövid időn belül.
        </p>
        <p>
          Ezek az adatok nem bankkártyaadatok, és nem helyettesítenek szakmai tanácsadást. A
          böngésződben tárolt helyi adatok a böngésző beállításaiban törölhetők.
        </p>
      </LegalSection>

      <LegalSection title="Jogalapok és megőrzés">
        <p>
          A rendeléshez kapcsolódó adatokat szerződés teljesítése és jogi kötelezettség alapján, az
          önként megadott kérdéseket és profiladatokat a szolgáltatás nyújtásához szükséges
          mértékben kezeljük. Az adatokat csak addig őrizzük meg, ameddig a szolgáltatás, jogi
          kötelezettség vagy jogos érdek indokolja.
        </p>
      </LegalSection>

      <LegalSection title="Adatfeldolgozók">
        <p>
          A működéshez tárhely-, adatbázis-, fizetési, analitikai és háttértudás-szolgáltatók
          kapcsolódhatnak. Ezeket csak a szükséges mértékben vonjuk be, és a titkos kulcsok nem
          kerülnek a böngészőbe.
        </p>
      </LegalSection>

      <LegalSection title="Felhasználói jogok">
        <p>
          Kérheted az adataidhoz való hozzáférést, azok helyesbítését, törlését vagy kezelésük
          korlátozását. Kérésedet erre az email címre küldheted:{" "}
          <a className="text-gold hover:text-gold/80" href={`mailto:${SITE_LEGAL.supportEmail}`}>
            {SITE_LEGAL.supportEmail}
          </a>
          .
        </p>
        <p className="text-sm text-ivory/55">Utolsó frissítés: {SITE_LEGAL.updatedAt}</p>
      </LegalSection>
    </LegalPage>
  ),
});
