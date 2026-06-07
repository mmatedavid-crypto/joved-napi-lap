#!/usr/bin/env node

const samples = {
  numerologyBirthOnly: {
    input: { birthDate: "1992-04-17" },
    expectedSections: [
      "A sorsszámod",
      "Mit mutat rólad?",
      "Belső hajtóerőd",
      "Amit mások először látnak belőled",
      "Az idei személyes éved",
    ],
    qualityTarget:
      "Születési dátumra hivatkozik, jelzi hogy teljes születési névvel mélyebb névelemzés jár.",
  },
  numerologyFullName: {
    input: { birthDate: "1988-11-29", fullName: "Kovács Éva Anna" },
    qualityTarget:
      "Ékezeteket normalizál, névbetűkből számol kifejeződés/belső vágy/külső kép számokat.",
  },
  compatibilityHigh: {
    input: {
      birthDateA: "1990-01-14",
      birthDateB: "1992-06-24",
      fullNameA: "Nagy Péter",
      fullNameB: "Szabó Anna",
      status: "kapcsolatban vagyunk",
    },
    expectedTone:
      "Nem csak százalékot ad; tempókülönbséget, kommunikációt és hosszú távú mintát magyaráz.",
  },
  tarotThreeCardLove: {
    input: {
      question: "Komolyan gondolja ezt a kapcsolatot?",
      category: "randi / ismerkedés",
      cards: ["A Szeretők", "A Remete", "A Csillag"],
    },
    expectedTone:
      "A három lap egy történetté áll össze, és konkrétan a kérdésre reagál, nem csak lapjelentéseket sorol.",
  },
  horoscopeSigns: {
    inputs: ["Bak", "Ikrek", "Rák"],
    expectedTone:
      "Mindhárom jegy külön feszültséget kap: Bak kontroll/időzítés, Ikrek mentális túlterhelés, Rák érzelmi biztonság.",
  },
};

console.log(JSON.stringify(samples, null, 2));
console.log("\nManual run: node scripts/reading-quality-samples.mjs");
