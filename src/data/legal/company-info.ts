import type { LegalDocument } from "./types";

export const companyInfo: LegalDocument = {
  slug: "company-info",
  audience: "general",
  title: { en: "Company Information", ro: "Informații despre companie" },
  shortTitle: { en: "Company info", ro: "Date companie" },
  description: {
    en: "The legal identity of the company operating Zavoia, as required by Romanian law (Legea 365/2002 art. 5).",
    ro: "Identitatea juridică a societății care operează Zavoia, conform Legii 365/2002 art. 5.",
  },
  status: "draft",
  sections: [
    {
      id: "identity",
      blueprintRef: "gate D1",
      title: { en: "Legal identity", ro: "Identitate juridică" },
      summary: {
        en: "The company operating the Zavoia platform.",
        ro: "Societatea care operează platforma Zavoia.",
      },
      body: [
        {
          kind: "p",
          text: {
            en: "The Zavoia platform — the website zavoia.com, the Zavoia mobile applications and the Zavoia business applications — is operated by the company identified below.",
            ro: "Platforma Zavoia — site-ul zavoia.com, aplicațiile mobile Zavoia și aplicațiile Zavoia pentru afaceri — este operată de societatea identificată mai jos.",
          },
        },
        {
          kind: "list",
          items: {
            en: [
              "Legal name: [COMPANY NAME S.R.L.]",
              "Trade Register number: [J__/____/____]",
              "Tax identification code (CUI): [________]",
              "VAT registration: [RO________ / not VAT-registered]",
              "Registered office: [full address]",
              "Share capital: [amount] RON",
            ],
            ro: [
              "Denumire: [DENUMIRE SOCIETATE S.R.L.]",
              "Număr de ordine în Registrul Comerțului: [J__/____/____]",
              "Cod unic de înregistrare (CUI): [________]",
              "Înregistrare în scopuri de TVA: [RO________ / neînregistrată în scopuri de TVA]",
              "Sediu social: [adresa completă]",
              "Capital social: [suma] RON",
            ],
          },
        },
        {
          kind: "note",
          text: {
            en: "GATE D1 (blueprint): the contracting entity's details are not yet confirmed. All bracketed fields must be completed with the real company data before publication — Legea 365/2002 art. 5 makes each of them mandatory for an information-society service provider.",
            ro: "GATE D1 (blueprint): datele entității contractante nu sunt încă confirmate. Toate câmpurile dintre paranteze trebuie completate cu datele reale ale societății înainte de publicare — Legea 365/2002 art. 5 le face obligatorii pentru un furnizor de servicii ale societății informaționale.",
          },
        },
      ],
    },
    {
      id: "contact",
      title: { en: "Contact", ro: "Contact" },
      summary: {
        en: "How to reach us rapidly and directly.",
        ro: "Cum ne puteți contacta rapid și direct.",
      },
      body: [
        {
          kind: "list",
          items: {
            en: [
              "Email: [contact/support email address]",
              "Support: the Help Centre at zavoia.com/help, available to visitors and account holders",
              "Postal address: the registered office listed above",
            ],
            ro: [
              "Email: [adresa de email de contact/asistență]",
              "Asistență: Centrul de ajutor la zavoia.com/help, disponibil vizitatorilor și deținătorilor de cont",
              "Adresă poștală: sediul social menționat mai sus",
            ],
          },
        },
        {
          kind: "p",
          text: {
            en: "We aim to answer support requests within a reasonable time. Requests that concern a specific booking or a specific business should include the booking reference so we can help faster.",
            ro: "Ne propunem să răspundem solicitărilor de asistență într-un termen rezonabil. Solicitările care privesc o programare sau o afacere anume ar trebui să includă referința programării, pentru a vă putea ajuta mai repede.",
          },
        },
        {
          kind: "note",
          text: {
            en: "Confirm the official contact email address before publication. Legea 365/2002 art. 5 lit. c) requires contact details, including email, that allow direct and effective contact.",
            ro: "Confirmați adresa oficială de email înainte de publicare. Legea 365/2002 art. 5 lit. c) impune date de contact, inclusiv email, care să permită contactul direct și efectiv.",
          },
        },
      ],
    },
    {
      id: "consumer-protection",
      blueprintRef: "B9",
      title: {
        en: "Consumer protection and dispute resolution",
        ro: "Protecția consumatorilor și soluționarea litigiilor",
      },
      summary: {
        en: "Where consumers can turn if a problem is not resolved with us directly.",
        ro: "Unde se pot adresa consumatorii dacă o problemă nu se rezolvă direct cu noi.",
      },
      body: [
        {
          kind: "p",
          text: {
            en: "If you are a consumer and have a complaint, please contact our support first — most issues are resolved there. If we cannot resolve your complaint, you may address the National Authority for Consumer Protection (ANPC) or use the alternative dispute resolution (SAL) mechanism.",
            ro: "Dacă sunteți consumator și aveți o reclamație, contactați mai întâi echipa noastră de asistență — majoritatea problemelor se rezolvă acolo. Dacă nu vă putem soluționa reclamația, vă puteți adresa Autorității Naționale pentru Protecția Consumatorilor (ANPC) sau puteți folosi mecanismul de soluționare alternativă a litigiilor (SAL).",
          },
        },
        {
          kind: "list",
          items: {
            en: [
              "ANPC — National Authority for Consumer Protection: anpc.ro",
              "SAL — alternative dispute resolution: reclamatiisal.anpc.ro",
            ],
            ro: [
              "ANPC — Autoritatea Națională pentru Protecția Consumatorilor: anpc.ro",
              "SAL — soluționarea alternativă a litigiilor: reclamatiisal.anpc.ro",
            ],
          },
        },
        {
          kind: "note",
          text: {
            en: "Per blueprint B9: display the ANPC/SAL links and pictograms in the site footer following the eMAG pattern; do not reference the discontinued EU ODR platform. Whether the SAL pictogram order (Ordin ANPC 449/2022 as amended) applies directly to Zavoia is a pending question for counsel.",
            ro: "Conform blueprint B9: afișați linkurile și pictogramele ANPC/SAL în subsolul site-ului după modelul eMAG; nu faceți referire la platforma ODR a UE, care a fost desființată. Dacă ordinul privind pictograma SAL (Ordin ANPC 449/2022, modificat) se aplică direct Zavoia este o întrebare în curs pentru avocați.",
          },
        },
      ],
    },
  ],
};
