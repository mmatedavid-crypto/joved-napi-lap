import { createFileRoute, Link } from "@tanstack/react-router";
import { Layout } from "@/components/Layout";
import { PageHeader, Section } from "@/components/Section";
import { ENTERTAINMENT_DISCLAIMER, SITE_LEGAL } from "@/lib/legal";

export const Route = createFileRoute("/rolunk")({
  head: () => ({
    meta: [
      { title: "Rólunk | Jövőd.hu" },
      {
        name: "description",
        content:
          "A Jövőd.hu egy csendes magyar napi rituálé. Tarot, sorsszám, összeillés — emberi hangon.",
      },
    ],
    links: [{ rel: "canonical", href: "/rolunk" }],
  }),
  component: () => (
    <Layout>
      <PageHeader
        eyebrow="Rólunk"
        title="Egy csendes magyar rituálé"
        lead="A Jövőd.hu nem jóslatgyár. Rövid, személyes önismereti olvasatokat adunk azoknak, akik egy helyzetet szeretnének tisztábban látni."
      />
      <div className="mx-auto max-w-2xl px-4 md:px-6 pb-20 space-y-4">
        <Section eyebrow="Mi ez az oldal?">
          <p>
            A Jövőd.hu magyar nyelvű digitális önismereti és szórakoztató platform. Tarot,
            számmisztika, párkapcsolati összeillés, álomfejtés, horoszkóp és más szimbolikus
            olvasatok segítenek abban, hogy egy kérdésre ne csak gyors választ, hanem nyugodtabb
            nézőpontot kapj.
          </p>
          <p>
            Az oldal hangja szándékosan visszafogott: nem ijesztget, nem ígér biztos jövőt, és nem
            próbál úgy tenni, mintha helyetted dönthetne.
          </p>
        </Section>

        <Section eyebrow="Hogyan készül egy olvasat?">
          <p>
            A háttértudás több rétegből áll: évezredes szimbólumtradíciókból, népi megfigyelésekből,
            számításokból és szerveroldali nyelvi értelmezésből. A végső szövegnek mindig magyarul,
            Jövőd.hu hangon kell megszólalnia.
          </p>
          <p>
            A cél nem az, hogy nyers idegen nyelvű háttérszöveget mutassunk, hanem hogy a kapott
            jelentést röviden, természetesen és a megadott helyzetedhez igazítva fogalmazzuk meg.
          </p>
        </Section>

        <Section eyebrow="Fizetés és hozzáférés">
          <p>
            A fizetést Stripe dolgozza fel; bankkártyaadatot nem tárolunk. A vásárlás előtt mindig
            látod az árat, a kézbesítési módot és azt is, milyen adataidat vesszük figyelembe.
          </p>
          <p>
            Vendégként a biztonságos rendelési linken és emailben éred el az olvasatot.
            Bejelentkezve a profilodban is visszanézheted a fizetős olvasataidat.
          </p>
          <p>
            Az aktuális termékeket és árakat az{" "}
            <Link to="/arak" className="text-gold hover:text-gold/80">
              Árak
            </Link>{" "}
            oldalon találod.
          </p>
        </Section>

        <Section eyebrow="Mit adunk?">
          <p>
            Fizetős olvasataink nem sablonos válaszok. Évtizedes szimbólumismeret és hagyományos
            értelmezés alapján fogalmazunk, a te kérdésedhez és helyzetedhez igazítva. Az eredmény
            nem ígér biztos jövőt — inkább nyugodtabb belső tájékozódást ad.
          </p>
          <p>
            Nem vállalunk orvosi, jogi, pénzügyi, pszichológiai vagy krízistanácsadást. A Jövőd.hu-n
            kapott szöveg önismereti nézőpont, nem szakmai döntéshelyettesítő.
          </p>
        </Section>

        <Section eyebrow="Üzemeltető és kapcsolat">
          <p>
            {`Üzemeltető: ${SITE_LEGAL.operator.name}. Székhely: ${SITE_LEGAL.operator.registeredOffice}. Cégjegyzékszám: ${SITE_LEGAL.operator.companyRegistrationNumber}. Adószám: ${SITE_LEGAL.operator.taxNumber}.`}
          </p>
          <p>
            Rendeléssel, hozzáféréssel vagy hibás megjelenéssel kapcsolatban ezen a címen érsz el
            minket:{" "}
            <a className="text-gold hover:text-gold/80" href={`mailto:${SITE_LEGAL.supportEmail}`}>
              {SITE_LEGAL.supportEmail}
            </a>
            .
          </p>
        </Section>

        <Section eyebrow="Jogi tudnivaló">
          <p>{ENTERTAINMENT_DISCLAIMER}</p>
        </Section>
      </div>
    </Layout>
  ),
});
