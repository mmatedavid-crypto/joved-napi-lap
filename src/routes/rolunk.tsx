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
    links: [{ rel: "canonical", href: `${SITE_LEGAL.siteUrl}/rolunk` }],
  }),
  component: () => (
    <Layout>
      <PageHeader
        eyebrow="Rólunk"
        title="Egy csendes magyar rituálé"
        lead="A Jövőd.hu hagyományos jelképrendszerekből induló, rövid és személyes önismereti olvasatokat ad azoknak, akik egy helyzetet szeretnének tisztábban látni."
      />
      <div className="mx-auto max-w-2xl px-4 md:px-6 pb-20 space-y-4">
        <Section eyebrow="Mi ez az oldal?">
          <p>
            A Jövőd.hu magyar nyelvű, hagyományalapú önismereti olvasatokat ad. Tarot,
            számmisztika, párkapcsolati összeillés, álomfejtés, horoszkóp és más szimbolikus
            olvasatok segítenek abban, hogy egy kérdésre ne csak gyors választ, hanem nyugodtabb
            nézőpontot kapj.
          </p>
          <p>
            Az oldal hangja szándékosan visszafogott: nem ijesztget, nem ígér biztos jövőt, és nem
            próbál úgy tenni, mintha helyetted dönthetne.
          </p>
        </Section>

        <Section eyebrow="Milyen hagyományból indul?">
          <p>
            Olvasataink régi jelképrendszerekből indulnak: a tarot képeiből, az asztrológiai
            időminőségekből, a számmisztika mintáiból és azokból a népi megfigyelésekből, amelyek
            régóta segítenek értelmet adni visszatérő emberi helyzeteknek.
          </p>
          <p>
            Nem kész válaszokat vagy biztos jóslatokat adunk. A szimbólumok jelentését a
            helyzetedhez, kérdésedhez és megadott adataidhoz kapcsoljuk, hogy új nézőpontot és
            használható önismereti kapaszkodót kapj.
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
            Fizetős olvasataink a tarot, az asztrológia és a számmisztika hagyományos
            szimbólumaiból indulnak, majd a te kérdésedhez, adataidhoz és helyzetedhez kapcsolódnak.
            Az eredmény nem ígér biztos jövőt — inkább nyugodtabb belső tájékozódást ad.
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
