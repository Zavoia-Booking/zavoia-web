import type { LegalDocument } from "./types";

export const dac7: LegalDocument = {
  slug: "dac7",
  audience: "business",
  title: {
    en: "DAC7 — Platform Tax Reporting",
    ro: "DAC7 — Raportarea fiscală a platformei",
  },
  shortTitle: { en: "DAC7", ro: "DAC7" },
  description: {
    en: "What the EU platform-reporting rules (DAC7) are, what data they require, and what they mean for businesses listed on the Zavoia marketplace.",
    ro: "Ce sunt regulile UE de raportare a platformelor (DAC7), ce date presupun și ce înseamnă pentru afacerile listate în marketplace-ul Zavoia.",
  },
  status: "published",
  effectiveDate: "2026-11-14",
  sections: [
    {
      id: "what-is-dac7",
      blueprintRef: "gate D12",
      title: { en: "What DAC7 is", ro: "Ce este DAC7" },
      summary: {
        en: "An EU tax-transparency rule that makes platforms report seller activity to tax authorities.",
        ro: "O regulă UE de transparență fiscală prin care platformele raportează activitatea vânzătorilor către autoritățile fiscale.",
      },
      body: [
        {
          kind: "p",
          text: {
            en: "DAC7 is Council Directive (EU) 2021/514, transposed into Romanian law by Government Ordinance 16/2023 into the Fiscal Procedure Code (Law 207/2015). It requires online platforms that connect sellers with users to identify those sellers and report their activity annually to the tax authority — in Romania, the National Agency for Fiscal Administration (ANAF), which then exchanges the information with other EU tax authorities.",
            ro: "DAC7 este Directiva (UE) 2021/514 a Consiliului, transpusă în legislația română prin OG 16/2023 în Codul de procedură fiscală (Legea 207/2015). Impune platformelor online care pun în legătură vânzători cu utilizatori să identifice acei vânzători și să le raporteze anual activitatea către autoritatea fiscală — în România, ANAF, care apoi face schimb de informații cu celelalte autorități fiscale din UE.",
          },
        },
        {
          kind: "p",
          text: {
            en: "It is a transparency and information-reporting regime, not a new tax. It does not create any tax for you, and it does not make the platform responsible for paying or declaring your taxes — those obligations remain entirely yours.",
            ro: "Este un regim de transparență și raportare informativă, nu o taxă nouă. Nu creează nicio taxă pentru dumneavoastră și nu face platforma responsabilă de plata sau declararea taxelor dumneavoastră — acele obligații vă revin în întregime.",
          },
        },
        {
          kind: "p",
          text: {
            en: "The activities DAC7 covers include “personal services” — time- or task-based work carried out at a user's request, including work performed physically offline after being arranged through a platform. Beauty, wellness and similar appointment-based services fall in that category.",
            ro: "Activitățile acoperite de DAC7 includ „serviciile personale” — muncă pe bază de timp sau sarcini, prestată la cererea unui utilizator, inclusiv muncă efectuată fizic, offline, după ce a fost intermediată printr-o platformă. Serviciile de înfrumusețare, wellness și alte servicii pe bază de programare intră în această categorie.",
          },
        },
      ],
    },
    {
      id: "does-it-apply",
      blueprintRef: "gate D12",
      title: {
        en: "Does it apply to Zavoia?",
        ro: "Se aplică pentru Zavoia?",
      },
      summary: {
        en: "Yes, for bookings made through Zavoia, even though customers pay at your venue.",
        ro: "Da, pentru programările făcute prin Zavoia, chiar dacă clienții plătesc la sediul dumneavoastră.",
      },
      body: [
        {
          kind: "p",
          text: {
            en: "Yes, for appointments customers book through Zavoia. You are paid directly at your venue, but DAC7 doesn't depend on who handles the payment: it covers platforms that connect sellers with customers for a service, not ones that only list or advertise, and the price of each booking is known to us. So Zavoia is a reporting platform operator and reports this activity to ANAF.",
            ro: "Da, pentru programările pe care clienții le fac prin Zavoia. Sunteți plătit direct, la sediul dumneavoastră, dar DAC7 nu depinde de cine gestionează plata: se aplică platformelor care pun în legătură vânzători cu clienți pentru un serviciu, nu celor care doar listează sau promovează, iar prețul fiecărei programări ne este cunoscut. Prin urmare, Zavoia este operator de platformă cu obligație de raportare și raportează această activitate la ANAF.",
          },
        },
      ],
    },
    {
      id: "thresholds",
      title: {
        en: "Are there minimum thresholds?",
        ro: "Există praguri minime?",
      },
      summary: {
        en: "For services there is no de-minimis threshold — unlike sales of goods.",
        ro: "Pentru servicii nu există un prag minim — spre deosebire de vânzarea de bunuri.",
      },
      body: [
        {
          kind: "p",
          text: {
            en: "You may have seen other platforms mention a threshold of 30 transactions or EUR 2,000 per year. That exclusion exists in DAC7 only for sellers of goods. For personal services there is no minimum volume or value: a business that provided at least one reportable appointment in a calendar year is reportable for that year.",
            ro: "Este posibil să fi văzut alte platforme menționând un prag de 30 de tranzacții sau 2.000 EUR pe an. Acea excludere există în DAC7 doar pentru vânzătorii de bunuri. Pentru serviciile personale nu există un volum sau o valoare minimă: o afacere care a avut cel puțin o programare raportabilă într-un an calendaristic este raportabilă pentru acel an.",
          },
        },
        {
          kind: "p",
          text: {
            en: "Reporting is also activity-based, not subscription-based: a Zavoia subscription alone does not make you reportable. What counts is appointments customers book through Zavoia — on the marketplace or on your Web Studio website, which uses the same booking system. Appointments you add to your calendar yourself, walk-ins and clients who book by phone are not reported.",
            ro: "Raportarea este bazată pe activitate, nu pe abonament: un abonament Zavoia, în sine, nu vă face raportabil. Contează programările făcute de clienți prin Zavoia — în marketplace sau pe site-ul dumneavoastră Web Studio, care folosește același sistem de programare. Programările pe care le adăugați chiar dumneavoastră în calendar, clienții veniți direct și cei care se programează telefonic nu sunt raportate.",
          },
        },
      ],
    },
    {
      id: "what-is-reported",
      title: {
        en: "What information is reported",
        ro: "Ce informații sunt raportate",
      },
      summary: {
        en: "Identification data about your business, plus quarterly marketplace activity.",
        ro: "Date de identificare despre afacerea dumneavoastră, plus activitatea trimestrială din marketplace.",
      },
      body: [
        {
          kind: "p",
          text: {
            en: "The regime prescribes exactly what a platform collects and reports. For a business organised as a legal entity (for example a limited liability company):",
            ro: "Regimul prevede exact ce colectează și raportează o platformă. Pentru o afacere organizată ca persoană juridică (de exemplu un SRL):",
          },
        },
        {
          kind: "list",
          items: {
            en: [
              "legal name, primary address and fiscal code, plus VAT number where you have one;",
              "the Trade Register registration number;",
              "the identifier of the financial account used for payments, where the platform holds one;",
              "the consideration attributable to your marketplace activity, broken down per calendar quarter, and the number of activities;",
              "any fees, commissions or taxes the platform withheld or charged you.",
            ],
            ro: [
              "denumirea legală, adresa principală și codul de identificare fiscală (CUI), plus codul de TVA, dacă aveți;",
              "numărul de înregistrare în Registrul Comerțului;",
              "identificatorul contului financiar folosit pentru plăți, dacă platforma îl deține;",
              "contraprestația aferentă activității dumneavoastră din marketplace, defalcată pe trimestre calendaristice, și numărul de activități;",
              "orice onorarii, comisioane sau taxe reținute sau percepute de platformă.",
            ],
          },
        },
        {
          kind: "p",
          text: {
            en: "If you operate as an authorised sole trader or a private individual, the regime treats you as a natural person, so the identification set is: first and last name, primary address, tax identification number (the fiscal code for an authorised sole trader, the personal numeric code for a private individual), date of birth, and VAT number where you have one — plus the same activity and fee information.",
            ro: "Dacă activați ca PFA sau ca persoană fizică neautorizată, regimul vă tratează ca persoană fizică, astfel că setul de identificare este: nume și prenume, adresa principală, codul de identificare fiscală (CUI-ul pentru PFA, CNP-ul pentru persoana fizică neautorizată), data nașterii și codul de TVA, dacă aveți — plus aceleași informații despre activitate și onorarii.",
          },
        },
        {
          kind: "p",
          text: {
            en: "Because Zavoia doesn't handle your money, the amounts we report are the prices recorded for the bookings made through Zavoia that you mark as completed. Each service counts as one activity, a bundle's price is split across its services, and each amount counts in the quarter of the appointment date. These are not the amounts you actually collected at the venue, so they are not a statement of your income and don't replace your own accounting.",
            ro: "Deoarece Zavoia nu vă gestionează banii, sumele raportate sunt prețurile înregistrate pentru programările făcute prin Zavoia pe care le marcați ca finalizate. Fiecare serviciu contează ca o activitate, prețul unui pachet se împarte între serviciile sale, iar fiecare sumă intră în trimestrul datei programării. Acestea nu sunt sumele încasate efectiv de dumneavoastră la sediu, deci nu reprezintă o declarație a veniturilor și nu înlocuiesc propria contabilitate.",
          },
        },
      ],
    },
    {
      id: "where-and-when",
      title: {
        en: "Where the data goes, and when",
        ro: "Unde ajung datele și când",
      },
      summary: {
        en: "To ANAF, once a year, by 31 January for the previous calendar year.",
        ro: "La ANAF, o dată pe an, până la 31 ianuarie pentru anul calendaristic anterior.",
      },
      body: [
        {
          kind: "p",
          text: {
            en: "Reporting is annual, not continuous. By 31 January, we file form F7000 with ANAF, electronically signed, for the previous calendar year, and ANAF shares the information with the tax authority of any other EU country where a seller is resident. By the same date, we send you the information we reported about your business.",
            ro: "Raportarea este anuală, nu continuă. Până la 31 ianuarie depunem la ANAF formularul F7000, semnat electronic, pentru anul calendaristic anterior, iar ANAF transmite informațiile autorității fiscale din orice alt stat membru UE în care un vânzător este rezident. Până la aceeași dată vă trimitem informațiile raportate despre afacerea dumneavoastră.",
          },
        },
        {
          kind: "p",
          text: {
            en: "The details we report are the billing details in your Zavoia dashboard, under Billing & Subscription. We have to check them by 31 December of the year we report on, so please keep them up to date.",
            ro: "Datele raportate sunt datele de facturare din panoul Zavoia, la Facturare și abonament. Trebuie să le verificăm până la 31 decembrie a anului pentru care raportăm, așa că vă rugăm să le țineți la zi.",
          },
        },
      ],
    },
    {
      id: "what-you-do",
      title: {
        en: "What this means for you",
        ro: "Ce înseamnă pentru dumneavoastră",
      },
      summary: {
        en: "Keep your data accurate; your own tax obligations are unchanged.",
        ro: "Mențineți datele corecte; obligațiile dumneavoastră fiscale rămân neschimbate.",
      },
      body: [
        {
          kind: "list",
          items: {
            en: [
              "Keep your billing details accurate and update them when anything changes (legal form, name, address, registration, VAT status). If you invoice as a private individual, also fill in your personal numeric code and date of birth, which this reporting needs.",
              "Keep declaring your income and issuing fiscal receipts and invoices exactly as you do now — DAC7 changes none of this. The reported figure is not a tax return and is not calculated as one.",
              "If required details are missing, we will ask you for them. If they are still missing after two reminders and at least 60 days, the law requires us to take your business off the marketplace until you provide them.",
              "You can ask us at any time what data about your business we hold for this purpose, and receive a copy.",
              "If you think a reported figure is wrong, contact us — we will check it and, where a correction is warranted, file a corrected report.",
            ],
            ro: [
              "Țineți corecte datele de facturare și actualizați-le la orice schimbare (formă juridică, denumire, adresă, înregistrare, statut TVA). Dacă facturați ca persoană fizică neautorizată, completați și CNP-ul și data nașterii, de care această raportare are nevoie.",
              "Continuați să vă declarați veniturile și să emiteți bonuri fiscale și facturi exact ca până acum — DAC7 nu schimbă nimic din toate acestea. Cifra raportată nu este o declarație fiscală și nu se calculează ca atare.",
              "Dacă lipsesc date obligatorii, vi le vom cere. Dacă lipsesc în continuare după două reamintiri și cel puțin 60 de zile, legea ne obligă să vă scoatem afacerea din marketplace până când le furnizați.",
              "Ne puteți întreba oricând ce date despre afacerea dumneavoastră deținem în acest scop și puteți primi o copie.",
              "Dacă apreciați că o cifră raportată este greșită, contactați-ne — o verificăm și, unde se justifică o corecție, depunem un raport rectificativ.",
            ],
          },
        },
      ],
    },
    {
      id: "privacy",
      title: {
        en: "Privacy and this data",
        ro: "Confidențialitatea acestor date",
      },
      summary: {
        en: "Used for this reporting and your Zavoia invoices, never for marketing.",
        ro: "Folosite pentru această raportare și pentru facturile Zavoia, niciodată pentru marketing.",
      },
      body: [
        {
          kind: "p",
          text: {
            en: "Your name, address and fiscal code are the details we also use for your Zavoia invoices. Your date of birth and personal numeric code are used only for this reporting, and none of these details is used for marketing or ranking. In the dashboard only the business owner can see them, and at Zavoia only the staff who handle the reporting. We keep DAC7 records, even after you delete your account, for the period required by tax law. Your rights and our contact details are in the Privacy Notice.",
            ro: "Numele, adresa și CUI-ul sunt datele pe care le folosim și pentru facturile Zavoia. Data nașterii și CNP-ul sunt folosite doar pentru această raportare, iar niciuna dintre aceste date nu este folosită pentru marketing sau ierarhizare. În panou le poate vedea doar proprietarul afacerii, iar la Zavoia doar personalul care se ocupă de raportare. Păstrăm evidențele DAC7, inclusiv după ștergerea contului, pe perioada impusă de legislația fiscală. Drepturile dumneavoastră și datele noastre de contact sunt în Politica de confidențialitate.",
          },
        },
      ],
    },
    {
      id: "questions",
      title: { en: "Questions", ro: "Întrebări" },
      summary: {
        en: "Where to ask — and where not to.",
        ro: "Unde întrebați — și unde nu.",
      },
      body: [
        {
          kind: "p",
          text: {
            en: "For questions about what data we hold or report about your business, contact us through the Help Centre. For questions about your own tax position — how to declare income, what regime applies to you, VAT registration — please ask your accountant or ANAF: we cannot give tax advice, and nothing on this page is tax advice.",
            ro: "Pentru întrebări despre ce date deținem sau raportăm despre afacerea dumneavoastră, contactați-ne prin Centrul de ajutor. Pentru întrebări despre propria situație fiscală — cum vă declarați veniturile, ce regim vi se aplică, înregistrarea în scopuri de TVA — adresați-vă contabilului dumneavoastră sau ANAF: nu putem oferi consultanță fiscală, iar nimic de pe această pagină nu constituie consultanță fiscală.",
          },
        },
      ],
    },
  ],
};
