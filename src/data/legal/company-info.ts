import type { LegalDocument } from "./types";

export const companyInfo: LegalDocument = {
  slug: "company-info",
  audience: "general",
  title: { en: "Company Information", ro: "Informații despre companie" },
  shortTitle: { en: "Company info", ro: "Date companie" },
  description: {
    en: "The legal identity of the company operating Zavoia, as required by Romanian law (Law 365/2002 art. 5).",
    ro: "Identitatea juridică a societății care operează Zavoia, conform Legii 365/2002 art. 5.",
  },
  status: "published",
  effectiveDate: "2026-11-15",
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
              "Legal name: TNT VENTURES SRL",
              "Trade Register number: J4/1369/2023",
              "Fiscal code: 48718430",
              "VAT registration: not registered for VAT",
              "Registered office: Mun. București, Sectorul 6, Str. Splaiul Independenței, Nr. 202 B, Camera 42, postal code 060023",
              "Share capital: 200 RON",
            ],
            ro: [
              "Denumire: TNT VENTURES SRL",
              "Număr de ordine în Registrul Comerțului: J4/1369/2023",
              "Cod unic de înregistrare (CUI): 48718430",
              "Înregistrare în scopuri de TVA: neînregistrată",
              "Sediu social: Mun. București, Sectorul 6, Str. Splaiul Independenței, Nr. 202 B, Camera 42, cod poștal 060023",
              "Capital social: 200 lei",
            ],
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
              "Email: support@zavoia.com",
              "Phone: +40 767 893 122",
              "Support: the Help Centre at zavoia.com/help, available to visitors and account holders",
              "Postal address: the registered office listed above",
              "Single point of contact for authorities and users (Articles 11 and 12 of the Digital Services Act, Regulation (EU) 2022/2065): support@zavoia.com, in Romanian or English",
            ],
            ro: [
              "Email: support@zavoia.com",
              "Telefon: +40 767 893 122",
              "Asistență: Centrul de ajutor la zavoia.com/help, disponibil vizitatorilor și deținătorilor de cont",
              "Adresă poștală: sediul social menționat mai sus",
              "Punct unic de contact pentru autorități și utilizatori (art. 11 și 12 din Regulamentul (UE) 2022/2065 privind serviciile digitale): support@zavoia.com, în limba română sau engleză",
            ],
          },
        },
        {
          kind: "p",
          text: {
            en: "We aim to answer support requests within a reasonable time. Requests that concern a specific booking or a specific business should include the booking reference so we can help faster.",
            ro: "Ne propunem să răspundem solicitărilor de asistență într-un termen rezonabil. Solicitările care privesc o programare sau o afacere anume ar trebui să includă referința programării, ca să vă putem ajuta mai repede.",
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
            en: "If you are a consumer and have a complaint, please contact our support first — most issues are resolved there. If we cannot resolve your complaint, you may contact the National Authority for Consumer Protection (ANPC) or use ANPC's alternative dispute resolution service.",
            ro: "Dacă sunteți consumator și aveți o reclamație, contactați mai întâi echipa noastră de asistență — majoritatea problemelor se rezolvă acolo. Dacă nu vă putem soluționa reclamația, vă puteți adresa Autorității Naționale pentru Protecția Consumatorilor (ANPC) sau puteți folosi mecanismul de soluționare alternativă a litigiilor (SAL).",
          },
        },
        {
          kind: "list",
          items: {
            en: [
              "ANPC — National Authority for Consumer Protection: anpc.ro",
              "ANPC's alternative dispute resolution service: reclamatiisal.anpc.ro",
            ],
            ro: [
              "ANPC — Autoritatea Națională pentru Protecția Consumatorilor: anpc.ro",
              "SAL — soluționarea alternativă a litigiilor: reclamatiisal.anpc.ro",
            ],
          },
        },
      ],
    },
  ],
};
