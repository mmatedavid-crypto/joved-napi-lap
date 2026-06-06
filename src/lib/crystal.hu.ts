// Hungarian crystal meanings — symbolic only. No healing or medical claims.

export type CrystalMeaning = {
  symbol: string;     // mit jelképez
  quality: string;    // milyen minőséget hoz elő
  when: string;       // mikor érdemes figyelni rá
  oneLine: string;
};

const FALLBACK: CrystalMeaning = {
  symbol: "A belső csend és a tisztulás jelképe.",
  quality: "Letisztult figyelmet és nyugalmat hoz elő.",
  when: "Amikor sok az inger körülötted, és nehéz lecsendesedni.",
  oneLine: "Tisztaság a zaj közepén.",
};

export const CRYSTAL_HU: Record<string, CrystalMeaning> = {
  "Ametiszt": {
    symbol: "A tisztánlátás és a belső béke köve.",
    quality: "Csendet és átlátást hoz elő, amikor kavargó a fejed.",
    when: "Amikor egy döntés előtt lecsendesednél.",
    oneLine: "A nyugalom kapuja.",
  },
  "Rózsakvarc": {
    symbol: "A szelíd szeretet és önelfogadás jelképe.",
    quality: "Lágyítja a belső kritikust, megnyitja a szívet.",
    when: "Amikor szigorú vagy magadhoz.",
    oneLine: "Először magadat öleld.",
  },
  "Hegyikristály": {
    symbol: "A tiszta szándék köve.",
    quality: "Letisztítja a zsúfolt gondolatokat, fókuszt ad.",
    when: "Új kezdetnél, döntés előtt.",
    oneLine: "Tisztaság, mint kiindulás.",
  },
  "Citrin": {
    symbol: "A napfény, a jólét és a kifejeződés köve.",
    quality: "Bátorságot ad megmutatni magad.",
    when: "Amikor összehúzódtál és visszafognád magad.",
    oneLine: "Engedd, hogy lásson a fény.",
  },
  "Karneol": {
    symbol: "A bátor cselekvés és életöröm jelképe.",
    quality: "Lendületet ad, segít kimozdulni a halogatásból.",
    when: "Amikor sokat tervezel, de keveset lépsz.",
    oneLine: "Most lépj egyet.",
  },
  "Obszidián": {
    symbol: "A belső igazság és határhúzás köve.",
    quality: "Segít szembenézni azzal, amit kerülnél.",
    when: "Amikor egy konfliktust nem akarsz kimondani.",
    oneLine: "Az igazság néha tükör.",
  },
  "Holdkő": {
    symbol: "Az intuíció és a női ciklusok jelképe.",
    quality: "Finomítja a megérzéseidet.",
    when: "Amikor a fejed és a szíved mást mond.",
    oneLine: "Hallgass a belső holdadra.",
  },
  "Labradorit": {
    symbol: "A küszöbök és átmenetek köve.",
    quality: "Védelmet ad változás idején.",
    when: "Új szakasz elején, amikor még köd van.",
    oneLine: "A küszöb is irány.",
  },
  "Lapis lazuli": {
    symbol: "A bölcs hang és a tisztánlátás jelképe.",
    quality: "Segít kimondani azt, ami valóban benned van.",
    when: "Amikor egy fontos beszélgetés vár rád.",
    oneLine: "Az igaz szó is csendből születik.",
  },
  "Tigrisszem": {
    symbol: "A földelt bátorság köve.",
    quality: "Higgadtságot és önbizalmat hoz.",
    when: "Amikor szétszórt vagy egy nagy feladat előtt.",
    oneLine: "Maradj nyugodtan jelen.",
  },
  "Fekete turmalin": {
    symbol: "A védelem és a tisztulás jelképe.",
    quality: "Segít leengedni azt, ami nem a tiéd.",
    when: "Sűrű, zsúfolt napok után.",
    oneLine: "Tedd le, ami nem a tiéd.",
  },
  "Szelenit": {
    symbol: "A finom fény és a belső tisztulás köve.",
    quality: "Lágy, megnyugtató jelenlétet hoz.",
    when: "Esti lecsendesedéshez.",
    oneLine: "Hagyd, hogy a nap leüljön.",
  },
  "Akvamarin": {
    symbol: "A nyugodt kifejeződés köve.",
    quality: "Segít higgadtan, kerek mondatokban szólni.",
    when: "Amikor fontos beszélgetés vár.",
    oneLine: "Higgadt szavak, tiszta víz.",
  },
  "Smaragd": {
    symbol: "A szív érésének köve.",
    quality: "A hűséget és a türelmet erősíti.",
    when: "Hosszan érlelt kapcsolatok idején.",
    oneLine: "Ami valódi, az kibontakozik.",
  },
  "Gránát": {
    symbol: "A szenvedély és a vitalitás jelképe.",
    quality: "Visszahozza az életkedvet, ha kifáradtál.",
    when: "Lefáradás után, új ciklus kezdetén.",
    oneLine: "Engedd, hogy újra ízleld az életedet.",
  },
  "Türkiz": {
    symbol: "A védelem és az őszinte hang köve.",
    quality: "Bátorságot ad őszintén szólni.",
    when: "Amikor ki kellene mondani valamit.",
    oneLine: "Mondd ki tisztán.",
  },
  "Opál": {
    symbol: "Az érzékenység és a látás jelképe.",
    quality: "Megmutatja a finom árnyalatokat.",
    when: "Amikor csak a felszínt látnád.",
    oneLine: "Nézz finomabban.",
  },
  "Zafír": {
    symbol: "A bölcsesség köve.",
    quality: "Tiszta gondolkodást, fókuszt ad.",
    when: "Komoly döntés előtt.",
    oneLine: "Gondold végig még egyszer.",
  },
  "Rubin": {
    symbol: "A szív és a bátorság köve.",
    quality: "Megerősíti a belső igent.",
    when: "Amikor választanod kell.",
    oneLine: "A szív tud választani.",
  },
  "Topáz": {
    symbol: "A világosság és a remény jelképe.",
    quality: "Felemelő, derűs minőséget hoz.",
    when: "Egy nehéz időszak után.",
    oneLine: "A fény visszatér.",
  },
  "Peridot": {
    symbol: "A megújulás és a megbocsátás köve.",
    quality: "Segít lezárni régi sérelmeket.",
    when: "Amikor egy nehéz történetet engednél el.",
    oneLine: "Tedd le, ami nehéz.",
  },
  "Gyémánt": {
    symbol: "A tisztaság és a tartós érték jelképe.",
    quality: "Megerősíti azt, ami valóban a tiéd.",
    when: "Hosszú távú elköteleződés idején.",
    oneLine: "Ami valódi, az fénylik.",
  },
};

export function crystalMeaning(name?: string): { name: string; m: CrystalMeaning } {
  if (!name) return { name: "Hegyikristály", m: CRYSTAL_HU["Hegyikristály"] };
  return { name, m: CRYSTAL_HU[name] ?? FALLBACK };
}

export const MONTH_HU = [
  "Január", "Február", "Március", "Április", "Május", "Június",
  "Július", "Augusztus", "Szeptember", "Október", "November", "December",
] as const;

// Fallback birthstones if Roxy fails — symbolic, not gemological.
export const FALLBACK_BIRTHSTONE: Record<number, string> = {
  1: "Gránát", 2: "Ametiszt", 3: "Akvamarin", 4: "Gyémánt", 5: "Smaragd",
  6: "Holdkő", 7: "Rubin", 8: "Peridot", 9: "Zafír", 10: "Opál",
  11: "Topáz", 12: "Türkiz",
};