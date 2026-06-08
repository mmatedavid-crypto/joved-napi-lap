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
    links: [{ rel: "canonical", href: "/aszf" }],
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
          A digitális olvasatok a sikeres fizetés után automatikusan készülnek el, és a fizetés utáni
          oldalon jelennek meg. A hosszabb olvasatoknál a terméklapon jelzett határidő irányadó.
        </p>
        <p>
          Ha technikai hiba miatt a teljesítés nem sikerül, a felhasználó a kapcsolati email címen
          kérhet segítséget.
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
        <p className="text-sm text-ivory/55">Utolsó frissítés: {SITE_LEGAL.updatedAt}</p>
      </LegalSection>
    </LegalPage>
  ),
});
