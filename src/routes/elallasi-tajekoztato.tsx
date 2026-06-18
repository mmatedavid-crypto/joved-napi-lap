import { createFileRoute } from "@tanstack/react-router";
import { LegalPage, LegalSection } from "@/components/LegalPage";
import { SITE_LEGAL } from "@/lib/legal";

export const Route = createFileRoute("/elallasi-tajekoztato")({
  head: () => ({
    meta: [
      { title: "Elállási tájékoztató | Jövőd.hu" },
      {
        name: "description",
        content: "Elállási és teljesítési tájékoztató a Jövőd.hu digitális olvasataihoz.",
      },
    ],
    links: [{ rel: "canonical", href: `${SITE_LEGAL.siteUrl}/elallasi-tajekoztato` }],
  }),
  component: () => (
    <LegalPage
      eyebrow="Elállás"
      title="Elállási tájékoztató"
      lead="A Jövőd.hu digitális olvasatai online teljesített tartalmak. Ezért az elállás szabályai eltérhetnek egy fizikai terméktől."
    >
      <LegalSection title="Digitális tartalom">
        <p>
          A Jövőd.hu fizetős olvasatai digitális tartalmak. Az elkészítés a sikeres fizetés után
          indul el, az elkészült olvasat pedig a rendelési oldalon vagy a felhasználói profilban
          érhető el.
        </p>
      </LegalSection>

      <LegalSection title="Teljesítés megkezdése">
        <p>
          A fizetés megkezdése előtt a felhasználó kifejezetten kéri, hogy a digitális tartalom
          teljesítése a sikeres fizetés után megkezdődjön. Ha a digitális olvasat elkészült és a
          rendelési oldalon vagy a profilban megnyílt, az elállási jog a vonatkozó szabályok szerint
          korlátozott lehet.
        </p>
        <p>
          Ez nem érinti azt az esetet, amikor hozzáférési vagy teljesítési gond miatt az olvasat
          nem jelenik meg, nem hozzáférhető, vagy nyilvánvalóan hibásan töltődik be. Ilyenkor a
          rendelést ellenőrizzük, és a hozzáférést pótoljuk.
        </p>
      </LegalSection>

      <LegalSection title="Hibás teljesítés vagy hozzáférési gond">
        <p>
          Ha a fizetés sikeres volt, de az olvasat nem jelent meg, nem nyílt meg, vagy nyilvánvaló
          hozzáférési gond történt, írj erre a címre:{" "}
          <a className="text-gold hover:text-gold/80" href={`mailto:${SITE_LEGAL.supportEmail}`}>
            {SITE_LEGAL.supportEmail}
          </a>
          . Ilyenkor a rendelést ellenőrizzük, és lehetőség szerint pótoljuk a teljesítést.
        </p>
        <p>
          Gyorsabb ügyintézéshez írd meg a vásárláshoz használt email címet, a rendelési oldalon
          látható rövid rendelésazonosítót, és azt, hogy melyik olvasatnál akadt el a folyamat.
        </p>
        <p>
          Ha a kártyás fizetés sikeres volt, de az email késik, először a fizetés utáni
          köszönőoldalt vagy a profilod rendelési előzményeit érdemes újranyitni. Az elkészült
          olvasat ott is megjelenik, nem csak emailben.
        </p>
      </LegalSection>

      <LegalSection title="Fontos korlát">
        <p>
          Az olvasatok szimbolikus, önismereti és szórakoztató tartalmak. Az, hogy egy olvasat
          érzelmileg mennyire találónak érződik, önmagában nem minősül hozzáférési hibának.
        </p>
        <p className="text-sm text-ivory/55">Utolsó frissítés: {SITE_LEGAL.updatedAt}</p>
      </LegalSection>
    </LegalPage>
  ),
});
