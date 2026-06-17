import { createFileRoute } from "@tanstack/react-router";
import { LegalPage, LegalSection } from "@/components/LegalPage";
import { ENTERTAINMENT_DISCLAIMER, SITE_LEGAL } from "@/lib/legal";

export const Route = createFileRoute("/impresszum")({
  head: () => ({
    meta: [
      { title: "Impresszum | Jövőd.hu" },
      {
        name: "description",
        content: "A Jövőd.hu üzemeltetői és kapcsolatfelvételi adatai.",
      },
    ],
    links: [{ rel: "canonical", href: `${SITE_LEGAL.siteUrl}/impresszum` }],
  }),
  component: () => (
    <LegalPage
      eyebrow="Impresszum"
      title="Üzemeltetői adatok"
      lead="Itt találod a Jövőd.hu szolgáltatóhoz tartozó alapadatokat és elérhetőséget."
    >
      <LegalSection title="Szolgáltató">
        <dl className="grid gap-3 text-base md:text-lg">
          <div>
            <dt className="text-ivory/55">Cégnév</dt>
            <dd>{SITE_LEGAL.operator.name}</dd>
          </div>
          <div>
            <dt className="text-ivory/55">Rövidített név</dt>
            <dd>{SITE_LEGAL.operator.shortName}</dd>
          </div>
          <div>
            <dt className="text-ivory/55">Székhely</dt>
            <dd>{SITE_LEGAL.operator.registeredOffice}</dd>
          </div>
          <div>
            <dt className="text-ivory/55">Adószám</dt>
            <dd>{SITE_LEGAL.operator.taxNumber}</dd>
          </div>
          <div>
            <dt className="text-ivory/55">Cégjegyzékszám</dt>
            <dd>{SITE_LEGAL.operator.companyRegistrationNumber}</dd>
          </div>
          <div>
            <dt className="text-ivory/55">Kapcsolat</dt>
            <dd>
              <a
                className="text-gold hover:text-gold/80"
                href={`mailto:${SITE_LEGAL.supportEmail}`}
              >
                {SITE_LEGAL.supportEmail}
              </a>
            </dd>
          </div>
        </dl>
      </LegalSection>

      <LegalSection title="A szolgáltatás jellege">
        <p>{ENTERTAINMENT_DISCLAIMER}</p>
        <p>
          A kártyavetések, számmisztikai és horoszkóp jellegű olvasatok nem ígérnek biztos jövőbeli
          eseményt, és nem helyettesítik szakember döntését vagy tanácsát.
        </p>
      </LegalSection>

      <LegalSection title="Tárhely és technikai működés">
        <p>
          A weboldal digitális szolgáltatásként működik. A rendelés, fizetés, tárhely és emailes
          kézbesítés működéséhez megbízható technikai szolgáltatók kapcsolódhatnak.
        </p>
      </LegalSection>

      <LegalSection title="Panasz és fogyasztói jogvita">
        <p>
          Panaszt elsőként a kapcsolati email címen tudsz jelezni. Fogyasztói jogvita esetén
          békéltető testülethez is fordulhatsz; a szolgáltató székhelye alapján illetékes testület:{" "}
          {SITE_LEGAL.disputeResolution.competentConciliationBoard}.
        </p>
        <p>
          Az aktuális békéltető testületi elérhetőségek itt érhetők el:{" "}
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
        <p className="text-sm text-ivory/55">Utolsó frissítés: {SITE_LEGAL.updatedAt}</p>
      </LegalSection>
    </LegalPage>
  ),
});
