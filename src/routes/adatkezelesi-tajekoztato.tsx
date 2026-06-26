import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { LegalPage, LegalSection } from "@/components/LegalPage";
import {
  clearGuestPersonalization,
  hasGuestPersonalizationDecision,
  isGuestPersonalizationEnabled,
  setGuestPersonalizationEnabled,
} from "@/lib/guestReadingMemory";
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
    links: [{ rel: "canonical", href: `${SITE_LEGAL.siteUrl}/adatkezelesi-tajekoztato` }],
  }),
  component: PrivacyPage,
});

function PrivacyPage() {
  const [localCleared, setLocalCleared] = useState(false);
  const [personalizationEnabled, setPersonalizationEnabledState] = useState(true);
  const [personalizationDecided, setPersonalizationDecided] = useState(false);

  useEffect(() => {
    setPersonalizationDecided(hasGuestPersonalizationDecision());
    setPersonalizationEnabledState(isGuestPersonalizationEnabled());
  }, []);

  function clearLocalPersonalization() {
    clearGuestPersonalization();
    setLocalCleared(true);
  }

  function setLocalPersonalization(enabled: boolean) {
    setGuestPersonalizationEnabled(enabled);
    setPersonalizationDecided(true);
    setPersonalizationEnabledState(enabled);
    setLocalCleared(!enabled);
  }

  return (
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
          születési adatot, olvasati előzményt és visszatérő témamintát, a fizetős olvasathoz adott
          minőségi visszajelzést és opcionális rövid pontosítást, valamint technikai és analitikai
          adatokat.
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

      <LegalSection title="Minőségi visszajelzés fizetős olvasatoknál">
        <p>
          Az elkészült fizetős olvasatoknál röviden jelezheted, hogy az olvasat hasznos volt,
          részben volt hasznos, vagy pontosítást kérsz. Ha szeretnéd, néhány mondatban azt is
          leírhatod, melyik rész kapcsolódott a helyzetedhez, mit szeretnél pontosítani, mit érdemes
          még hozzátenni, vagy milyen irányban kérsz finomítást.
        </p>
        <p>
          Ezt a visszajelzést a rendeléshez kapcsoljuk, és kizárólag ügyfélszolgálati, hibajavítási
          és szolgáltatásminőségi célra használjuk. A visszajelzés nem helyettesíti a panaszt vagy
          ügyfélszolgálati kérést; ha választ vársz, írj a kapcsolati email címre is.
        </p>
      </LegalSection>

      <LegalSection title="Vendégvásárlások és profil">
        <p>
          Vendégként is vásárolhatsz. Ilyenkor a rendelést a vásárláskor megadott email címhez és a
          biztonságos rendelési linkhez kapcsoljuk, nem szükséges előzetesen fiókot létrehoznod.
        </p>
        <p>
          Ha később ugyanazzal az igazolt email címmel jelentkezel be, a korábbi gazdátlan
          vendégvásárlásaidat a profilodhoz kapcsolhatjuk, hogy a fizetős olvasataidat és azok
          állapotát egy helyen visszanézhesd. Ez nem indít új fizetést, és nem érinti a Stripe által
          kezelt bankkártyaadatokat.
        </p>
        <p>
          A biztonságos rendelési link ilyenkor is működik. A kapcsolást csak azonos email cím
          alapján végezzük, és kizárólag a rendelés teljesítéséhez, visszakereséséhez,
          ügyfélszolgálatához és minőségi visszajelzéséhez használjuk.
        </p>
      </LegalSection>

      <LegalSection title="Személyesebb olvasati memória">
        <p>
          A Jövőd.hu célja, hogy az olvasatok ne minden alkalommal idegenként induljanak. Ezért
          röviden eltárolhatjuk az olvasat típusát, a megadott kérdés lényegét, néhány visszatérő
          motívumot és az olvasat rövid összefoglalóját.
        </p>
        <p>
          Bejelentkezve ezek az adatok a felhasználói fiókodhoz kapcsolódhatnak. Vendégként a
          személyesebb olvasati ív csak akkor indul el, ha ebben a böngészőben bekapcsolod a helyi
          személyesítést. Ilyenkor a minta helyi böngészőadatként marad nálad, például
          localStorage-ban és néhány rövid cookie-jelzésben. Ilyen jelzés lehet, hogy több különböző
          összeillést néztél meg, vagy hogy visszatérően döntési, kapcsolati vagy álomtémákat
          kérdezel. A helyi vendég olvasati mintákat legfeljebb 180 napig használjuk.
        </p>
        <p>
          Az új olvasatok ezt csak finoman használják: visszatérő témára, heti-havi ívre vagy
          változó fókuszra reflektálhatnak. Nem cél az, hogy kész személyiségprofilt vagy biztos
          jövőállítást készítsünk belőle.
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
          kapcsolatot néztél meg rövid időn belül. A visszatérő olvasati minták mentését először
          külön bekapcsolhatod, és ugyanitt később le is állíthatod.
        </p>
        <p>
          Ezek az adatok nem bankkártyaadatok, és nem helyettesítenek szakmai tanácsadást. A régi
          olvasati minták automatikusan kikerülnek a személyesítésből, a böngésződben tárolt helyi
          adatok pedig a böngésző beállításaiban is törölhetők.
        </p>
        <div className="mt-4 rounded-md border border-[oklch(0.78_0.10_80/0.16)] p-4">
          <p className="text-sm text-ivory/70">
            A vendégként tárolt helyi olvasati mintát itt is törölheted ebből a böngészőből, vagy
            kikapcsolhatod a további helyi személyesítést.
          </p>
          <p className="mt-2 text-xs text-ivory/50">
            Jelenlegi állapot:{" "}
            {!personalizationDecided
              ? "még nem döntöttél a helyi személyesítésről ebben a böngészőben."
              : personalizationEnabled
                ? "a helyi személyesítés be van kapcsolva."
                : "a helyi személyesítés ki van kapcsolva ebben a böngészőben."}
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <button type="button" onClick={clearLocalPersonalization} className="btn-ghost-gold">
              Helyi olvasati minta törlése
            </button>
            {personalizationEnabled ? (
              <button
                type="button"
                onClick={() => setLocalPersonalization(false)}
                className="btn-ghost-gold"
              >
                Helyi személyesítés kikapcsolása
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setLocalPersonalization(true)}
                className="btn-gold"
              >
                Helyi személyesítés visszakapcsolása
              </button>
            )}
          </div>
          {localCleared && (
            <p className="mt-2 text-sm text-ivory/55">
              {personalizationEnabled
                ? "Töröltük a helyi olvasati mintát ebből a böngészőből."
                : "Töröltük a helyi olvasati mintát, és kikapcsoltuk az új vendégminták mentését ebben a böngészőben."}
            </p>
          )}
        </div>
      </LegalSection>

      <LegalSection title="Jogalapok és megőrzés">
        <p>
          A rendeléshez kapcsolódó adatokat szerződés teljesítése és jogi kötelezettség alapján, az
          önként megadott kérdéseket és profiladatokat a szolgáltatás nyújtásához szükséges
          mértékben kezeljük. A fizetős olvasathoz adott minőségi visszajelzést a rendelési
          adatokkal együtt őrizhetjük meg, amíg ügyfélszolgálati, hibajavítási vagy jogos
          szolgáltatásminőségi érdek indokolja. Az adatokat csak addig őrizzük meg, ameddig a
          szolgáltatás, jogi kötelezettség vagy jogos érdek indokolja.
        </p>
      </LegalSection>

      <LegalSection title="Adatfeldolgozók">
        <p>
          A működéshez tárhely-, adatbázis-, fizetési, emailküldési és analitikai szolgáltatók
          kapcsolódhatnak. Ezeket csak a szükséges mértékben vonjuk be, és a személyes adataidat nem
          tesszük nyilvánossá.
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
  );
}
