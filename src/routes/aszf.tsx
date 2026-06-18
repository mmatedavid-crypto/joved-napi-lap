import { createFileRoute, Link } from "@tanstack/react-router";
import { LegalPage, LegalSection } from "@/components/LegalPage";
import { ENTERTAINMENT_DISCLAIMER, SITE_LEGAL } from "@/lib/legal";

export const Route = createFileRoute("/aszf")({
  head: () => ({
    meta: [
      { title: "Általános Szerződési Feltételek | Jövőd.hu" },
      {
        name: "description",
        content: "A Jövőd.hu digitális olvasatainak használati és vásárlási feltételei.",
      },
    ],
    links: [{ rel: "canonical", href: `${SITE_LEGAL.siteUrl}/aszf` }],
  }),
  component: () => (
    <LegalPage
      eyebrow="ÁSZF"
      title="Általános Szerződési Feltételek"
      lead="A Jövőd.hu használatára és a digitális olvasatok megrendelésére vonatkozó alapfeltételek."
    >
      <LegalSection title="Szolgáltató">
        <p>
          A szolgáltató: {SITE_LEGAL.operator.name}. Székhely:{" "}
          {SITE_LEGAL.operator.registeredOffice}. Adószám: {SITE_LEGAL.operator.taxNumber}.
          Kapcsolat:{" "}
          <a className="text-gold hover:text-gold/80" href={`mailto:${SITE_LEGAL.supportEmail}`}>
            {SITE_LEGAL.supportEmail}
          </a>
          .
        </p>
      </LegalSection>

      <LegalSection title="A szolgáltatás">
        <p>{ENTERTAINMENT_DISCLAIMER}</p>
        <p>
          A Jövőd.hu tarot, számmisztikai, párkapcsolati, horoszkóp és más önismereti jellegű
          digitális tartalmakat ad. Az olvasatok szimbolikus értelmezések, nem tényállítások és nem
          garantált előrejelzések.
        </p>
      </LegalSection>

      <LegalSection title="Megrendelés és fizetés">
        <p>
          Fizetős olvasat megrendelésekor a felhasználó megadja az email címét, kiválasztja a
          szolgáltatást, majd bankkártyás fizetéssel rendezi az ellenértéket. A fizetést külső
          fizetési szolgáltató dolgozza fel; a Jövőd.hu nem tárol bankkártyaadatot.
        </p>
        <p>
          Az árak forintban, bruttó módon jelennek meg az oldalon. A megrendelés akkor jön létre,
          amikor a fizetés sikeresen megtörténik.
        </p>
      </LegalSection>

      <LegalSection title="Teljesítés">
        <p>
          A digitális olvasatok elkészítése a sikeres fizetés után indul el, és az elkészült
          olvasat a rendelési oldalon vagy a felhasználói profilban érhető el. Egyes részletesebb
          olvasatok elkészítése hosszabb ideig tarthat; ezeknél a terméklapon jelzett tájékoztatás
          irányadó.
        </p>
        <p>
          Vendégvásárlásnál a fizetés utáni rendelési linket és a vásárláshoz használt email címet
          érdemes megőrizni. Bejelentkezett felhasználónál az elkészült olvasat a profilban is visszanézhető.
        </p>
        <p>
          Ha hozzáférési vagy teljesítési gond miatt az olvasat nem nyílik meg, nem hozzáférhető,
          vagy hibásan jelenik meg, a felhasználó a kapcsolati email címen kérhet segítséget.
          Ilyenkor a vásárlási email cím és a rövid rendelésazonosító alapján ellenőrizzük a
          rendelést, és lehetőség szerint pótoljuk a hozzáférést, javítjuk a hibás megjelenítést
          vagy újraküldjük az olvasatot.
        </p>
      </LegalSection>

      <LegalSection title="Minőségi visszajelzés">
        <p>
          Az elkészült fizetős olvasatoknál rövid visszajelzést adhatsz arról, hogy az olvasat
          mennyire talált. Ha részben talált vagy nem volt elég pontos, opcionálisan azt is
          megírhatod, mi maradt ki a helyzetedből.
        </p>
        <p>
          A visszajelzéseket a szolgáltatás javítására és ügyfélszolgálati ellenőrzésre használjuk.
          Ha konkrét választ vagy javítást kérsz, a rendelési azonosítóval együtt írj a kapcsolati
          email címre is.
        </p>
      </LegalSection>

      <LegalSection title="Elállás digitális tartalomnál">
        <p>
          A fizetős olvasat digitális tartalom. Ha a felhasználó kifejezetten kéri a teljesítés
          megkezdését, tudomásul veszi, hogy a teljesítés megkezdése után az elállási jog
          korlátozott lehet. Részletek az{" "}
          <Link to="/elallasi-tajekoztato" className="text-gold hover:text-gold/80">
            elállási tájékoztatóban
          </Link>
          .
        </p>
      </LegalSection>

      <LegalSection title="Felhasználói felelősség">
        <p>
          A felhasználó felel azért, hogy az olvasatokat saját helyzetére józanul, önismereti
          jelként értelmezze. Krízishelyzetben, egészségügyi, jogi, pénzügyi vagy pszichológiai
          kérdésben szakemberhez kell fordulni.
        </p>
      </LegalSection>

      <LegalSection title="Adatkezelés és panasz">
        <p>
          Az adatkezelési feltételek külön oldalon érhetők el:{" "}
          <Link to="/adatkezelesi-tajekoztato" className="text-gold hover:text-gold/80">
            Adatkezelési tájékoztató
          </Link>
          . Panasz vagy kérdés esetén írj erre a címre:{" "}
          <a className="text-gold hover:text-gold/80" href={`mailto:${SITE_LEGAL.supportEmail}`}>
            {SITE_LEGAL.supportEmail}
          </a>
          .
        </p>
        <p>
          Hozzáférési vagy rendelési kérdésnél mindig a vásárlási email címedről
          írj, és ha látod, add meg a rövid rendelésazonosítót is. Így gyorsabban ellenőrizhető,
          hogy a fizetés, az olvasat elkészítése vagy az emailes értesítés melyik ponton akadt el.
        </p>
      </LegalSection>

      <LegalSection title="Panaszkezelés és békéltetés">
        <p>
          Panaszt elsőként írásban, a kapcsolati email címen tudsz jelezni. A panaszt érdemben
          kivizsgáljuk, és a lehetőségekhez képest írásban válaszolunk.
        </p>
        <p>
          Ha a fogyasztói jogvita közvetlenül nem rendezhető, fogyasztóként békéltető testülethez
          fordulhatsz. A szolgáltató székhelye alapján illetékes testület:{" "}
          {SITE_LEGAL.disputeResolution.competentConciliationBoard}. A békéltető testületek aktuális
          elérhetőségei itt találhatók:{" "}
          <a
            className="text-gold hover:text-gold/80"
            href={SITE_LEGAL.disputeResolution.conciliationInfoUrl}
            target="_blank"
            rel="noreferrer"
          >
            bekeltetes.hu
          </a>
          .
        </p>
        <p>
          Az Európai Bizottság korábbi online vitarendezési platformja 2025. július 20-án megszűnt;
          a hivatalos tájékoztató itt érhető el:{" "}
          <a
            className="text-gold hover:text-gold/80"
            href={SITE_LEGAL.disputeResolution.euOdrInfoUrl}
            target="_blank"
            rel="noreferrer"
          >
            consumer-redress.ec.europa.eu
          </a>
          .
        </p>
        <p className="text-sm text-ivory/55">Utolsó frissítés: {SITE_LEGAL.updatedAt}</p>
      </LegalSection>
    </LegalPage>
  ),
});
